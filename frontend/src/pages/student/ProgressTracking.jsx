import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiClock, FiAward, FiTarget } from 'react-icons/fi';
import axios from 'axios';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/AuthContext';

const ProgressTracking = () => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    avgCompletion: 0,
    totalTimeSpent: 0,
    completedCourses: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/progress`);
      const progressData = response.data.data.progress;
      setProgress(progressData);

      // Calculate stats
      const totalCourses = progressData.length;
      const avgCompletion = progressData.reduce((sum, p) => sum + p.completionPercentage, 0) / totalCourses || 0;
      const totalTimeSpent = progressData.reduce((sum, p) => sum + p.timeSpent, 0);
      const completedCourses = progressData.filter(p => p.completionPercentage === 100).length;

      setStats({
        totalCourses,
        avgCompletion: Math.round(avgCompletion),
        totalTimeSpent,
        completedCourses
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Progress Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your performance with detailed analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Courses
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FiTarget className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Avg Completion
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.avgCompletion}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Time Spent
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatTime(stats.totalTimeSpent)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.completedCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <FiAward className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Course Progress */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Course Progress
          </h2>

          {progress.length > 0 ? (
            <div className="space-y-6">
              {progress.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.course?.title || 'Course'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last accessed: {new Date(item.lastAccessed).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {item.completionPercentage}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.completedVideos.length}/{item.totalVideos} videos
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-700 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${item.completionPercentage}%` }}
                    ></div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Time Spent</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatTime(item.timeSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Quiz Scores</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.quizScores?.length || 0} completed
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Status</p>
                      <p className={`font-semibold ${
                        item.completionPercentage === 100 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        {item.completionPercentage === 100 ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiTrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No progress data yet. Start learning to track your progress!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking;
