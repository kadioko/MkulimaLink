/**
 * Community Routes
 * Handles communities, forums, discussions, and member interactions
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const communityService = require('../services/communityService');
const expertNetworkService = require('../services/expertNetworkService');
const trainingPlatformService = require('../services/trainingPlatformService');

// Public routes - no authentication required
router.get('/communities/trending', async (req, res) => {
  try {
    const communities = await communityService.getTrendingCommunities(10);
    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Get trending communities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending communities',
      error: error.message
    });
  }
});

router.get('/communities/search', async (req, res) => {
  try {
    const { query, type, page, limit } = req.query;
    const result = await communityService.searchCommunities(
      query,
      type,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search communities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search communities',
      error: error.message
    });
  }
});

router.get('/communities/types', async (req, res) => {
  try {
    const types = communityService.getCommunityTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get community types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community types',
      error: error.message
    });
  }
});

router.get('/communities/:communityId', async (req, res) => {
  try {
    const community = await communityService.getCommunityDetails(req.params.communityId);
    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Get community details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community details',
      error: error.message
    });
  }
});

// Protected routes - authentication required
router.use(protect);

// Community management
router.post('/communities', async (req, res) => {
  try {
    const community = await communityService.createCommunity(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: community
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community',
      error: error.message
    });
  }
});

router.get('/communities', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await communityService.getUserCommunities(req.user._id, page, limit);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user communities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communities',
      error: error.message
    });
  }
});

router.post('/communities/:communityId/join', async (req, res) => {
  try {
    const community = await communityService.joinCommunity(req.user._id, req.params.communityId);
    res.json({
      success: true,
      message: 'Joined community successfully',
      data: community
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join community',
      error: error.message
    });
  }
});

router.post('/communities/:communityId/leave', async (req, res) => {
  try {
    const community = await communityService.leaveCommunity(req.user._id, req.params.communityId);
    res.json({
      success: true,
      message: 'Left community successfully',
      data: community
    });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave community',
      error: error.message
    });
  }
});

// Forum management
router.post('/communities/:communityId/posts', async (req, res) => {
  try {
    const post = await communityService.createForumPost(
      req.user._id,
      req.params.communityId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Create forum post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
});

router.get('/communities/:communityId/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await communityService.getForumPosts(
      req.params.communityId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get forum posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
});

router.post('/posts/:postId/replies', async (req, res) => {
  try {
    const reply = await communityService.replyToPost(
      req.user._id,
      req.params.postId,
      req.body.content
    );

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      data: reply
    });
  } catch (error) {
    console.error('Reply to post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message
    });
  }
});

router.get('/posts/:postId/replies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await communityService.getPostReplies(
      req.params.postId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get post replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replies',
      error: error.message
    });
  }
});

router.post('/posts/:postId/like', async (req, res) => {
  try {
    const post = await communityService.togglePostLike(req.user._id, req.params.postId);
    res.json({
      success: true,
      message: 'Like toggled successfully',
      data: post
    });
  } catch (error) {
    console.error('Toggle post like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
});

router.post('/posts/:postId/solve', async (req, res) => {
  try {
    const post = await communityService.markPostSolved(req.user._id, req.params.postId);
    res.json({
      success: true,
      message: 'Post marked as solved',
      data: post
    });
  } catch (error) {
    console.error('Mark post solved error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark post as solved',
      error: error.message
    });
  }
});

// Expert network
router.post('/experts/profile', async (req, res) => {
  try {
    const profile = await expertNetworkService.createExpertProfile(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Expert profile created',
      data: profile
    });
  } catch (error) {
    console.error('Create expert profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expert profile',
      error: error.message
    });
  }
});

router.get('/experts/search', async (req, res) => {
  try {
    const { expertise, page, limit } = req.query;
    const result = await expertNetworkService.searchExperts(
      expertise,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search experts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search experts',
      error: error.message
    });
  }
});

router.get('/experts/top', async (req, res) => {
  try {
    const experts = await expertNetworkService.getTopExperts(10);
    res.json({
      success: true,
      data: experts
    });
  } catch (error) {
    console.error('Get top experts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top experts',
      error: error.message
    });
  }
});

router.get('/experts/:expertId', async (req, res) => {
  try {
    const profile = await expertNetworkService.getExpertProfile(req.params.expertId);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get expert profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert profile',
      error: error.message
    });
  }
});

router.post('/consultations/book', async (req, res) => {
  try {
    const { expert_id, ...bookingData } = req.body;
    const result = await expertNetworkService.bookConsultation(
      req.user._id,
      expert_id,
      bookingData
    );

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: result
    });
  } catch (error) {
    console.error('Book consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book consultation',
      error: error.message
    });
  }
});

router.get('/consultations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await expertNetworkService.getUserConsultations(
      req.user._id,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations',
      error: error.message
    });
  }
});

router.post('/consultations/:bookingId/review', async (req, res) => {
  try {
    const { expert_id, ...reviewData } = req.body;
    const review = await expertNetworkService.submitReview(
      req.user._id,
      expert_id,
      req.params.bookingId,
      reviewData
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
});

// Training platform
router.post('/courses', async (req, res) => {
  try {
    const course = await trainingPlatformService.createCourse(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
});

router.get('/courses/search', async (req, res) => {
  try {
    const { query, category, level, page, limit } = req.query;
    const result = await trainingPlatformService.searchCourses(
      query,
      category,
      level,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search courses',
      error: error.message
    });
  }
});

router.get('/courses/popular', async (req, res) => {
  try {
    const courses = await trainingPlatformService.getPopularCourses(10);
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get popular courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular courses',
      error: error.message
    });
  }
});

router.get('/courses/:courseId', async (req, res) => {
  try {
    const course = await trainingPlatformService.getCourseDetails(req.params.courseId);
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course details',
      error: error.message
    });
  }
});

router.post('/courses/:courseId/enroll', async (req, res) => {
  try {
    const enrollment = await trainingPlatformService.enrollStudent(
      req.user._id,
      req.params.courseId
    );

    res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message
    });
  }
});

router.get('/courses/:courseId/progress', async (req, res) => {
  try {
    const progress = await trainingPlatformService.getStudentProgress(
      req.user._id,
      req.params.courseId
    );

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message
    });
  }
});

router.get('/my-courses', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await trainingPlatformService.getStudentCourses(
      req.user._id,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

router.get('/certificates', async (req, res) => {
  try {
    const certificates = await trainingPlatformService.getStudentCertificates(req.user._id);
    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

module.exports = router;



