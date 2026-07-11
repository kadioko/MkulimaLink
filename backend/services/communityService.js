/**
 * Community Service
 * Manages farmer communities, forums, discussions, and member interactions
 */

const { Community, ForumPost, ForumReply, CommunityMember, CommunityRole } = require('../models/Community');
const { User } = require('../models');

class CommunityService {
  constructor() {
    this.communityTypes = ['regional', 'crop', 'interest', 'skill'];
    this.communityCategories = {
      regional: ['Dar es Salaam', 'Arusha', 'Mbeya', 'Iringa', 'Dodoma', 'Nairobi', 'Kampala', 'Kigali'],
      crop: ['maize', 'rice', 'beans', 'tomatoes', 'coffee', 'tea', 'cotton', 'cashew'],
      interest: ['organic_farming', 'irrigation', 'climate_smart', 'women_farming', 'youth_farming'],
      skill: ['soil_testing', 'pest_management', 'market_linkage', 'financial_management', 'technology']
    };
  }

  /**
   * Create community
   */
  async createCommunity(userId, communityData) {
    try {
      const { name, description, type, category, rules } = communityData;

      if (!this.communityTypes.includes(type)) {
        throw new Error('Invalid community type');
      }

      const community = new Community({
        name,
        description,
        type,
        category,
        rules: rules || [],
        created_by: userId,
        members: [userId],
        moderators: [userId]
      });

      await community.save();

      // Add creator as member
      const member = new CommunityMember({
        community_id: community._id,
        user_id: userId,
        role: 'moderator',
        joined_at: new Date()
      });

      await member.save();

      return community;
    } catch (error) {
      console.error('Create community error:', error);
      throw error;
    }
  }

  /**
   * Get community details
   */
  async getCommunityDetails(communityId) {
    try {
      const community = await Community.findById(communityId)
        .populate('created_by', 'name avatar')
        .populate('members', 'name avatar');

      if (!community) {
        throw new Error('Community not found');
      }

      // Get recent posts
      const recentPosts = await ForumPost.find({ community_id: communityId })
        .sort({ created_at: -1 })
        .limit(5)
        .populate('author_id', 'name avatar');

      return {
        ...community.toObject(),
        recent_posts: recentPosts
      };
    } catch (error) {
      console.error('Get community details error:', error);
      throw error;
    }
  }

  /**
   * Join community
   */
  async joinCommunity(userId, communityId) {
    try {
      const community = await Community.findById(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if already member
      const existingMember = await CommunityMember.findOne({
        community_id: communityId,
        user_id: userId
      });

      if (existingMember) {
        throw new Error('Already a member of this community');
      }

      // Add to members array
      community.members.push(userId);
      community.member_count = community.members.length;
      await community.save();

      // Create member record
      const member = new CommunityMember({
        community_id: communityId,
        user_id: userId,
        role: 'member',
        joined_at: new Date()
      });

      await member.save();

      return community;
    } catch (error) {
      console.error('Join community error:', error);
      throw error;
    }
  }

  /**
   * Leave community
   */
  async leaveCommunity(userId, communityId) {
    try {
      const community = await Community.findById(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      // Remove from members
      community.members = community.members.filter(id => id.toString() !== userId.toString());
      community.member_count = community.members.length;
      await community.save();

      // Remove member record
      await CommunityMember.deleteOne({
        community_id: communityId,
        user_id: userId
      });

      return community;
    } catch (error) {
      console.error('Leave community error:', error);
      throw error;
    }
  }

  /**
   * Create forum post
   */
  async createForumPost(userId, communityId, postData) {
    try {
      const { title, content, tags, category } = postData;

      // Verify user is community member
      const member = await CommunityMember.findOne({
        community_id: communityId,
        user_id: userId
      });

      if (!member) {
        throw new Error('Not a member of this community');
      }

      const post = new ForumPost({
        community_id: communityId,
        author_id: userId,
        title,
        content,
        tags: tags || [],
        category: category || 'general'
      });

      await post.save();

      // Update community post count
      const community = await Community.findById(communityId);
      community.post_count = (community.post_count || 0) + 1;
      await community.save();

      return post;
    } catch (error) {
      console.error('Create forum post error:', error);
      throw error;
    }
  }

  /**
   * Get forum posts
   */
  async getForumPosts(communityId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const posts = await ForumPost.find({ community_id: communityId })
        .populate('author_id', 'name avatar')
        .sort({ is_pinned: -1, created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ForumPost.countDocuments({ community_id: communityId });

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get forum posts error:', error);
      throw error;
    }
  }

  /**
   * Reply to post
   */
  async replyToPost(userId, postId, content) {
    try {
      const post = await ForumPost.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const reply = new ForumReply({
        post_id: postId,
        author_id: userId,
        content
      });

      await reply.save();

      // Update reply count
      post.replies_count = (post.replies_count || 0) + 1;
      await post.save();

      return reply;
    } catch (error) {
      console.error('Reply to post error:', error);
      throw error;
    }
  }

  /**
   * Get post replies
   */
  async getPostReplies(postId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const replies = await ForumReply.find({ post_id: postId })
        .populate('author_id', 'name avatar')
        .sort({ created_at: 1 })
        .skip(skip)
        .limit(limit);

      const total = await ForumReply.countDocuments({ post_id: postId });

      return {
        replies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get post replies error:', error);
      throw error;
    }
  }

  /**
   * Like/unlike post
   */
  async togglePostLike(userId, postId) {
    try {
      const post = await ForumPost.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const likeIndex = post.likes.indexOf(userId);
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
      } else {
        post.likes.push(userId);
      }

      await post.save();
      return post;
    } catch (error) {
      console.error('Toggle post like error:', error);
      throw error;
    }
  }

  /**
   * Search communities
   */
  async searchCommunities(query, type = null, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      let filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      if (type) {
        filter.type = type;
      }

      const communities = await Community.find(filter)
        .sort({ member_count: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Community.countDocuments(filter);

      return {
        communities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Search communities error:', error);
      throw error;
    }
  }

  /**
   * Get user communities
   */
  async getUserCommunities(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const communities = await Community.find({ members: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Community.countDocuments({ members: userId });

      return {
        communities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user communities error:', error);
      throw error;
    }
  }

  /**
   * Get trending communities
   */
  async getTrendingCommunities(limit = 10) {
    try {
      const communities = await Community.find()
        .sort({ member_count: -1, post_count: -1 })
        .limit(limit);

      return communities;
    } catch (error) {
      console.error('Get trending communities error:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin post
   */
  async togglePinPost(userId, postId, communityId) {
    try {
      const community = await Community.findById(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      // Check if user is moderator
      if (!community.moderators.includes(userId)) {
        throw new Error('Only moderators can pin posts');
      }

      const post = await ForumPost.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      post.is_pinned = !post.is_pinned;
      await post.save();

      return post;
    } catch (error) {
      console.error('Toggle pin post error:', error);
      throw error;
    }
  }

  /**
   * Mark post as solved
   */
  async markPostSolved(userId, postId) {
    try {
      const post = await ForumPost.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.author_id.toString() !== userId.toString()) {
        throw new Error('Only post author can mark as solved');
      }

      post.is_solved = true;
      await post.save();

      return post;
    } catch (error) {
      console.error('Mark post solved error:', error);
      throw error;
    }
  }

  /**
   * Get community categories
   */
  getCommunityCategories(type) {
    return this.communityCategories[type] || [];
  }

  /**
   * Get community types
   */
  getCommunityTypes() {
    return this.communityTypes;
  }
}

module.exports = new CommunityService();



