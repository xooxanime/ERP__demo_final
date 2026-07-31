import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiBook, FiStar } from 'react-icons/fi';
import axios from 'axios';
import Loading from '../components/Loading';
import { getFileUrl } from '../lib/utils';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/faculty`);
      setFaculty(response.data.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-display">
            Our Distinguished Faculty
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Learn from industry experts and experienced educators dedicated to your success
          </p>
        </div>

        {/* Faculty Grid */}
                    </div>
                  </div>
                </div>

                {/* Faculty Info */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400 font-semibold mb-2">
                    {member.designation}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {member.qualification}
                  </p>
                </div>

                {/* Experience & Specialization */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiBook className="w-4 h-4 mr-2 text-primary-600" />
                    <span><strong>Experience:</strong> {member.experience}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiStar className="w-4 h-4 mr-2 text-primary-600" />
                    <span><strong>Specialization:</strong> {member.specialization}</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {member.bio}
                </p>

                {/* Subjects */}
                {member.subjects && member.subjects.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Subjects:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.subjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {member.achievements && member.achievements.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Achievements:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {member.achievements.slice(0, 3).map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Faculty information will be available soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Faculty;
