/**
 * Expert Network Service
 * Manages expert profiles, consultations, bookings, and ratings
 */

const { ExpertProfile, Consultation, ConsultationBooking, ExpertReview } = require('../models/Community');
const { User } = require('../models');

class ExpertNetworkService {
  constructor() {
    this.expertiseAreas = [
      'soil_management',
      'pest_management',
      'crop_selection',
      'irrigation',
      'climate_adaptation',
      'market_linkage',
      'financial_management',
      'technology_adoption',
      'organic_farming',
      'seed_production',
      'equipment_rental',
      'crop_insurance',
      'supply_chain',
      'export_procedures'
    ];

    this.consultationTypes = ['phone', 'video', 'in_person', 'chat'];
  }

  /**
   * Create expert profile
   */
  async createExpertProfile(userId, profileData) {
    try {
      const { expertise, bio, qualifications, experience_years, hourly_rate } = profileData;

      // Validate expertise areas
      const validExpertise = expertise.filter(exp => this.expertiseAreas.includes(exp));
      if (validExpertise.length === 0) {
        throw new Error('At least one valid expertise area is required');
      }

      let profile = await ExpertProfile.findOne({ user_id: userId });

      if (!profile) {
        profile = new ExpertProfile({
          user_id: userId,
          expertise: validExpertise,
          bio,
          qualifications: qualifications || [],
          experience_years: experience_years || 0,
          hourly_rate: hourly_rate || 0,
          availability: this.getDefaultAvailability()
        });
      } else {
        profile.expertise = validExpertise;
        profile.bio = bio;
        profile.qualifications = qualifications || profile.qualifications;
        profile.experience_years = experience_years || profile.experience_years;
        profile.hourly_rate = hourly_rate || profile.hourly_rate;
      }

      await profile.save();

      // Update user as expert
      const user = await User.findById(userId);
      user.is_expert = true;
      user.expert_profile_id = profile._id;
      await user.save();

      return profile;
    } catch (error) {
      console.error('Create expert profile error:', error);
      throw error;
    }
  }

  /**
   * Get expert profile
   */
  async getExpertProfile(expertId) {
    try {
      const profile = await ExpertProfile.findOne({ user_id: expertId })
        .populate('user_id', 'name avatar email phone');

      if (!profile) {
        throw new Error('Expert profile not found');
      }

      // Get reviews
      const reviews = await ExpertReview.find({ expert_id: expertId })
        .populate('reviewer_id', 'name avatar')
        .sort({ created_at: -1 })
        .limit(10);

      return {
        ...profile.toObject(),
        reviews
      };
    } catch (error) {
      console.error('Get expert profile error:', error);
      throw error;
    }
  }

  /**
   * Search experts
   */
  async searchExperts(expertise = null, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      let filter = { verified: true };

      if (expertise) {
        filter.expertise = expertise;
      }

      const experts = await ExpertProfile.find(filter)
        .populate('user_id', 'name avatar')
        .sort({ rating: -1, reviews_count: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ExpertProfile.countDocuments(filter);

      return {
        experts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Search experts error:', error);
      throw error;
    }
  }

  /**
   * Book consultation
   */
  async bookConsultation(userId, expertId, bookingData) {
    try {
      const { consultation_type, scheduled_date, topic, duration_minutes } = bookingData;

      // Validate consultation type
      if (!this.consultationTypes.includes(consultation_type)) {
        throw new Error('Invalid consultation type');
      }

      // Get expert profile
      const expertProfile = await ExpertProfile.findOne({ user_id: expertId });
      if (!expertProfile) {
        throw new Error('Expert not found');
      }

      // Check availability
      const isAvailable = this.checkAvailability(expertProfile.availability, scheduled_date);
      if (!isAvailable) {
        throw new Error('Expert not available at this time');
      }

      // Calculate cost
      const cost = (expertProfile.hourly_rate / 60) * duration_minutes;

      const booking = new ConsultationBooking({
        user_id: userId,
        expert_id: expertId,
        consultation_type,
        scheduled_date: new Date(scheduled_date),
        topic,
        duration_minutes,
        cost,
        status: 'pending'
      });

      await booking.save();

      // Create consultation record
      const consultation = new Consultation({
        booking_id: booking._id,
        user_id: userId,
        expert_id: expertId,
        consultation_type,
        topic,
        status: 'scheduled'
      });

      await consultation.save();

      return {
        booking,
        consultation
      };
    } catch (error) {
      console.error('Book consultation error:', error);
      throw error;
    }
  }

  /**
   * Confirm consultation
   */
  async confirmConsultation(expertId, bookingId) {
    try {
      const booking = await ConsultationBooking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.expert_id.toString() !== expertId.toString()) {
        throw new Error('Not authorized to confirm this booking');
      }

      booking.status = 'confirmed';
      booking.confirmed_at = new Date();
      await booking.save();

      // Update consultation status
      const consultation = await Consultation.findOne({ booking_id: bookingId });
      if (consultation) {
        consultation.status = 'confirmed';
        await consultation.save();
      }

      return booking;
    } catch (error) {
      console.error('Confirm consultation error:', error);
      throw error;
    }
  }

  /**
   * Complete consultation
   */
  async completeConsultation(bookingId, notes = null) {
    try {
      const booking = await ConsultationBooking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      booking.status = 'completed';
      booking.completed_at = new Date();
      await booking.save();

      // Update consultation
      const consultation = await Consultation.findOne({ booking_id: bookingId });
      if (consultation) {
        consultation.status = 'completed';
        consultation.notes = notes;
        consultation.completed_at = new Date();
        await consultation.save();
      }

      return booking;
    } catch (error) {
      console.error('Complete consultation error:', error);
      throw error;
    }
  }

  /**
   * Cancel consultation
   */
  async cancelConsultation(bookingId, reason = null) {
    try {
      const booking = await ConsultationBooking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      booking.status = 'cancelled';
      booking.cancellation_reason = reason;
      await booking.save();

      // Update consultation
      const consultation = await Consultation.findOne({ booking_id: bookingId });
      if (consultation) {
        consultation.status = 'cancelled';
        await consultation.save();
      }

      return booking;
    } catch (error) {
      console.error('Cancel consultation error:', error);
      throw error;
    }
  }

  /**
   * Submit review
   */
  async submitReview(userId, expertId, bookingId, reviewData) {
    try {
      const { rating, comment } = reviewData;

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const review = new ExpertReview({
        expert_id: expertId,
        reviewer_id: userId,
        booking_id: bookingId,
        rating,
        comment
      });

      await review.save();

      // Update expert profile rating
      const allReviews = await ExpertReview.find({ expert_id: expertId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      const expertProfile = await ExpertProfile.findOne({ user_id: expertId });
      expertProfile.rating = avgRating;
      expertProfile.reviews_count = allReviews.length;
      await expertProfile.save();

      return review;
    } catch (error) {
      console.error('Submit review error:', error);
      throw error;
    }
  }

  /**
   * Get expert consultations
   */
  async getExpertConsultations(expertId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const consultations = await Consultation.find({ expert_id: expertId })
        .populate('user_id', 'name avatar')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Consultation.countDocuments({ expert_id: expertId });

      return {
        consultations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get expert consultations error:', error);
      throw error;
    }
  }

  /**
   * Get user consultations
   */
  async getUserConsultations(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const consultations = await Consultation.find({ user_id: userId })
        .populate('expert_id', 'name avatar')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Consultation.countDocuments({ user_id: userId });

      return {
        consultations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user consultations error:', error);
      throw error;
    }
  }

  /**
   * Get top experts
   */
  async getTopExperts(limit = 10) {
    try {
      const experts = await ExpertProfile.find({ verified: true })
        .populate('user_id', 'name avatar')
        .sort({ rating: -1, reviews_count: -1 })
        .limit(limit);

      return experts;
    } catch (error) {
      console.error('Get top experts error:', error);
      throw error;
    }
  }

  /**
   * Update availability
   */
  async updateAvailability(expertId, availability) {
    try {
      const profile = await ExpertProfile.findOne({ user_id: expertId });
      if (!profile) {
        throw new Error('Expert profile not found');
      }

      profile.availability = availability;
      await profile.save();

      return profile;
    } catch (error) {
      console.error('Update availability error:', error);
      throw error;
    }
  }

  // Helper methods

  getDefaultAvailability() {
    return {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '14:00' },
      sunday: null
    };
  }

  checkAvailability(availability, scheduledDate) {
    const date = new Date(scheduledDate);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const dayAvailability = availability[dayName];

    if (!dayAvailability) {
      return false;
    }

    const time = date.toTimeString().slice(0, 5);
    return time >= dayAvailability.start && time <= dayAvailability.end;
  }

  getExpertiseAreas() {
    return this.expertiseAreas;
  }

  getConsultationTypes() {
    return this.consultationTypes;
  }
}

module.exports = new ExpertNetworkService();



