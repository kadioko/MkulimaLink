import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Award, Users, Star, Search } from 'lucide-react';
import api from '../../api/axios';

const TrainingPlatform = () => {
  const [courses, setCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  const categories = [
    'soil_management',
    'pest_management',
    'crop_production',
    'irrigation',
    'climate_adaptation',
    'market_linkage',
    'financial_management',
    'technology_adoption'
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [searchRes, popularRes, myRes] = await Promise.all([
        api.get('/api/community/courses/search', {
          params: { query: searchQuery, category: selectedCategory, level: selectedLevel }
        }),
        api.get('/api/community/courses/popular'),
        api.get('/api/community/my-courses')
      ]);

      setCourses(searchRes.data.courses || []);
      setPopularCourses(popularRes.data || []);
      setMyCourses(myRes.data.enrollments || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading courses...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Training Academy</h1>
          <p className="text-gray-600">Learn new skills and advance your farming knowledge</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedCategory === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm transition capitalize ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Level</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedLevel === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-3 py-1 rounded-full text-sm transition capitalize ${
                      selectedLevel === level
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* My Courses */}
        {myCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-purple-600" />
              My Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((enrollment) => (
                <CourseCard key={enrollment._id} course={enrollment.course_id} />
              ))}
            </div>
          </div>
        )}

        {/* Popular Courses */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            Popular Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Results</h2>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No courses found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-32 flex items-center justify-center">
      <BookOpen className="w-16 h-16 text-white opacity-50" />
    </div>

    <div className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-purple-600" />
          {course.enrolled_count || 0} students
        </div>
        <div className="flex items-center">
          <Play className="w-4 h-4 mr-2 text-purple-600" />
          {course.duration_hours} hours
        </div>
        <div className="flex items-center">
          <Award className="w-4 h-4 mr-2 text-purple-600" />
          <span className="capitalize">{course.level}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {course.category?.replace('_', ' ')}
        </span>
        {course.rating && (
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm font-semibold">{course.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium">
        {course.price > 0 ? `Enroll - ${course.price} TZS` : 'Enroll Free'}
      </button>
    </div>
  </div>
);

export default TrainingPlatform;
