import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFile, FiFilter } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { openOrDownloadFile } from '../lib/utils';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', subject: '' });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchMaterials();
  }, [filter]);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/study-materials`, {
        params: filter
      });
      setMaterials(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId, title) => {
    if (!isAuthenticated) {
      toast.error('Please login to download study materials');
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/study-materials/${materialId}/download`
      );
      
      // Open download link via openOrDownloadFile helper
      openOrDownloadFile(response.data.data.fileUrl, title);
      toast.success('Download started!');
    } catch (error) {
      toast.error('Failed to download material');
    }
  };

  const categories = ['Notes', 'Practice Questions', 'Mock Tests', 'Previous Papers', 'Reference Books'];
  const subjects = ['Accounting', 'Taxation', 'Auditing', 'Law', 'Costing', 'Financial Management'];

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Study Materials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400"
          >
            Comprehensive notes, practice questions & mock tests
          </motion.p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex items-center mb-4">
            <FiFilter className="w-5 h-5 mr-2 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={filter.subject}
                onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {materials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material, index) => (
              <motion.div
                key={material._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card hover:shadow-xl transition-shadow"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4">
                  <FiFile className="w-8 h-8 text-primary-600" />
                </div>

                {/* Title & Category */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {material.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    {material.category}
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    {material.subject}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {material.description}
                </p>

                {/* File Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{material.fileType}</span>
                  <span>{material.fileSize || 'N/A'}</span>
                  <span>{material.downloads} downloads</span>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(material._id, material.title)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download</span>
                </button>

                {material.isPremium && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                    Premium Content
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiFile className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No study materials found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
