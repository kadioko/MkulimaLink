/**
 * Training Platform Service
 * Manages courses, modules, lessons, quizzes, and certifications
 */

const { Course, CourseModule, Lesson, Quiz, QuizQuestion, StudentEnrollment, StudentProgress, Certificate } = require('../models/Community');
const { User } = require('../models');

class TrainingPlatformService {
  constructor() {
    this.courseLevels = ['beginner', 'intermediate', 'advanced'];
    this.courseCategories = [
      'soil_management',
      'pest_management',
      'crop_production',
      'irrigation',
      'climate_adaptation',
      'market_linkage',
      'financial_management',
      'technology_adoption',
      'organic_farming',
      'business_skills'
    ];
  }

  /**
   * Create course
   */
  async createCourse(instructorId, courseData) {
    try {
      const { title, description, category, level, duration_hours, price } = courseData;

      if (!this.courseLevels.includes(level)) {
        throw new Error('Invalid course level');
      }

      if (!this.courseCategories.includes(category)) {
        throw new Error('Invalid course category');
      }

      const course = new Course({
        title,
        description,
        instructor_id: instructorId,
        category,
        level,
        duration_hours: duration_hours || 0,
        price: price || 0,
        modules: []
      });

      await course.save();

      return course;
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
  }

  /**
   * Add module to course
   */
  async addModule(courseId, instructorId, moduleData) {
    try {
      const { title, description, order } = moduleData;

      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructor_id.toString() !== instructorId.toString()) {
        throw new Error('Not authorized to edit this course');
      }

      const module = new CourseModule({
        course_id: courseId,
        title,
        description,
        order: order || course.modules.length + 1,
        lessons: []
      });

      await module.save();

      course.modules.push(module._id);
      await course.save();

      return module;
    } catch (error) {
      console.error('Add module error:', error);
      throw error;
    }
  }

  /**
   * Add lesson to module
   */
  async addLesson(moduleId, lessonData) {
    try {
      const { title, content, video_url, resources, order } = lessonData;

      const module = await CourseModule.findById(moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const lesson = new Lesson({
        module_id: moduleId,
        title,
        content,
        video_url: video_url || null,
        resources: resources || [],
        order: order || module.lessons.length + 1
      });

      await lesson.save();

      module.lessons.push(lesson._id);
      await module.save();

      return lesson;
    } catch (error) {
      console.error('Add lesson error:', error);
      throw error;
    }
  }

  /**
   * Create quiz
   */
  async createQuiz(lessonId, quizData) {
    try {
      const { title, description, passing_score } = quizData;

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const quiz = new Quiz({
        lesson_id: lessonId,
        title,
        description,
        passing_score: passing_score || 70,
        questions: []
      });

      await quiz.save();

      lesson.quiz = quiz._id;
      await lesson.save();

      return quiz;
    } catch (error) {
      console.error('Create quiz error:', error);
      throw error;
    }
  }

  /**
   * Add quiz question
   */
  async addQuizQuestion(quizId, questionData) {
    try {
      const { question_text, question_type, options, correct_answer, points } = questionData;

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const question = new QuizQuestion({
        quiz_id: quizId,
        question_text,
        question_type: question_type || 'multiple_choice',
        options: options || [],
        correct_answer,
        points: points || 1
      });

      await question.save();

      quiz.questions.push(question._id);
      await quiz.save();

      return question;
    } catch (error) {
      console.error('Add quiz question error:', error);
      throw error;
    }
  }

  /**
   * Enroll student in course
   */
  async enrollStudent(userId, courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already enrolled
      const existingEnrollment = await StudentEnrollment.findOne({
        student_id: userId,
        course_id: courseId
      });

      if (existingEnrollment) {
        throw new Error('Already enrolled in this course');
      }

      const enrollment = new StudentEnrollment({
        student_id: userId,
        course_id: courseId,
        enrolled_at: new Date()
      });

      await enrollment.save();

      // Update course enrollment count
      course.enrolled_count = (course.enrolled_count || 0) + 1;
      await course.save();

      // Create progress record
      const progress = new StudentProgress({
        student_id: userId,
        course_id: courseId,
        enrollment_id: enrollment._id,
        modules_completed: 0,
        lessons_completed: 0,
        progress_percentage: 0
      });

      await progress.save();

      return enrollment;
    } catch (error) {
      console.error('Enroll student error:', error);
      throw error;
    }
  }

  /**
   * Submit quiz answers
   */
  async submitQuizAnswers(userId, quizId, answers) {
    try {
      const quiz = await Quiz.findById(quizId)
        .populate('questions');

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      let score = 0;
      let totalPoints = 0;

      // Calculate score
      for (const question of quiz.questions) {
        totalPoints += question.points;
        const userAnswer = answers[question._id.toString()];

        if (userAnswer === question.correct_answer) {
          score += question.points;
        }
      }

      const scorePercentage = (score / totalPoints) * 100;
      const passed = scorePercentage >= quiz.passing_score;

      // Update progress
      const lesson = await Lesson.findById(quiz.lesson_id);
      const module = await CourseModule.findById(lesson.module_id);
      const course = await Course.findById(module.course_id);

      const progress = await StudentProgress.findOne({
        student_id: userId,
        course_id: course._id
      });

      if (progress) {
        if (passed) {
          progress.lessons_completed = (progress.lessons_completed || 0) + 1;
          progress.quiz_scores.push({
            quiz_id: quizId,
            score: scorePercentage,
            passed: true,
            completed_at: new Date()
          });
        }

        // Calculate overall progress
        const totalLessons = await Lesson.countDocuments({ 'module_id': { $in: course.modules } });
        progress.progress_percentage = (progress.lessons_completed / totalLessons) * 100;

        await progress.save();
      }

      return {
        score: Math.round(scorePercentage),
        passed,
        message: passed ? 'Quiz passed!' : `Score: ${Math.round(scorePercentage)}%. Required: ${quiz.passing_score}%`
      };
    } catch (error) {
      console.error('Submit quiz answers error:', error);
      throw error;
    }
  }

  /**
   * Complete course
   */
  async completeCourse(userId, courseId) {
    try {
      const progress = await StudentProgress.findOne({
        student_id: userId,
        course_id: courseId
      });

      if (!progress) {
        throw new Error('Enrollment not found');
      }

      if (progress.progress_percentage < 100) {
        throw new Error('Course not fully completed');
      }

      progress.completed_at = new Date();
      progress.status = 'completed';
      await progress.save();

      // Generate certificate
      const course = await Course.findById(courseId);
      const user = await User.findById(userId);

      const certificate = new Certificate({
        student_id: userId,
        course_id: courseId,
        course_title: course.title,
        issued_at: new Date(),
        certificate_number: this.generateCertificateNumber(),
        instructor_name: (await User.findById(course.instructor_id)).name
      });

      await certificate.save();

      return {
        progress,
        certificate
      };
    } catch (error) {
      console.error('Complete course error:', error);
      throw error;
    }
  }

  /**
   * Get course details
   */
  async getCourseDetails(courseId) {
    try {
      const course = await Course.findById(courseId)
        .populate('instructor_id', 'name avatar')
        .populate({
          path: 'modules',
          populate: {
            path: 'lessons'
          }
        });

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      console.error('Get course details error:', error);
      throw error;
    }
  }

  /**
   * Get student progress
   */
  async getStudentProgress(userId, courseId) {
    try {
      const progress = await StudentProgress.findOne({
        student_id: userId,
        course_id: courseId
      });

      if (!progress) {
        throw new Error('Progress not found');
      }

      return progress;
    } catch (error) {
      console.error('Get student progress error:', error);
      throw error;
    }
  }

  /**
   * Get student courses
   */
  async getStudentCourses(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const enrollments = await StudentEnrollment.find({ student_id: userId })
        .populate('course_id')
        .sort({ enrolled_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await StudentEnrollment.countDocuments({ student_id: userId });

      return {
        enrollments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get student courses error:', error);
      throw error;
    }
  }

  /**
   * Get instructor courses
   */
  async getInstructorCourses(instructorId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const courses = await Course.find({ instructor_id: instructorId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Course.countDocuments({ instructor_id: instructorId });

      return {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get instructor courses error:', error);
      throw error;
    }
  }

  /**
   * Get popular courses
   */
  async getPopularCourses(limit = 10) {
    try {
      const courses = await Course.find()
        .populate('instructor_id', 'name avatar')
        .sort({ enrolled_count: -1, rating: -1 })
        .limit(limit);

      return courses;
    } catch (error) {
      console.error('Get popular courses error:', error);
      throw error;
    }
  }

  /**
   * Get certificates
   */
  async getStudentCertificates(userId) {
    try {
      const certificates = await Certificate.find({ student_id: userId })
        .sort({ issued_at: -1 });

      return certificates;
    } catch (error) {
      console.error('Get certificates error:', error);
      throw error;
    }
  }

  /**
   * Search courses
   */
  async searchCourses(query, category = null, level = null, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      let filter = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      if (category) filter.category = category;
      if (level) filter.level = level;

      const courses = await Course.find(filter)
        .populate('instructor_id', 'name avatar')
        .sort({ enrolled_count: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Course.countDocuments(filter);

      return {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Search courses error:', error);
      throw error;
    }
  }

  // Helper methods

  generateCertificateNumber() {
    return `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  getCourseLevels() {
    return this.courseLevels;
  }

  getCourseCategories() {
    return this.courseCategories;
  }
}

module.exports = new TrainingPlatformService();



