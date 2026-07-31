import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash, FiX, FiUpload, FiPlayCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { courseAPI, adminAPI } from '../../services/api';
import { formatCurrency, fileToBase64 } from '../../utils/helpers';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import FileUpload from '../../components/ui/FileUpload';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CA Foundation',
    instructor: '',
    price: '',
    discount: 0,
    duration: '',
    level: 'Beginner',
    language: 'English',
    features: '',
    requirements: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      setCourses(response.data.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        instructor: course.instructor,
        price: course.price,
        discount: course.discount || 0,
        duration: course.duration,
        level: course.level,
        language: course.language,
        features: course.features?.join('\n') || '',
        requirements: course.requirements?.join('\n') || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        category: 'CA Foundation',
        instructor: '',
        price: '',
        discount: 0,
        duration: '',
        level: 'Beginner',
        language: 'English',
        features: '',
        requirements: ''
      });
    }
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setThumbnailFile(null);
    setPaymentQrFile(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e, type = 'thumbnail') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (type === 'thumbnail') {
         setThumbnailFile(file);
      } else if (type === 'paymentQr') {
         setPaymentQrFile(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const courseData = {
        ...formData,
        price: Number(formData.price),
        discount: Number(formData.discount),
        features: formData.features.split('\n').filter(f => f.trim()),
        requirements: formData.requirements.split('\n').filter(r => r.trim())
      };

      // Handle thumbnail upload
      if (thumbnailFile) {
        const base64 = await fileToBase64(thumbnailFile);
        courseData.thumbnailBase64 = base64;
      }

      // Handle QR upload
      if (paymentQrFile) {
        const base64 = await fileToBase64(paymentQrFile);
        courseData.paymentQrImageBase64 = base64;
      }

      if (editingCourse) {
        await adminAPI.updateCourse(editingCourse._id, courseData);
        toast.success('Course updated successfully');
      } else {
        // For demo, create with placeholder thumbnail
        if (!thumbnailFile) {
          courseData.thumbnail = {
            url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
            publicId: 'demo'
          };
        }
        await adminAPI.createCourse(courseData);
        toast.success('Course created successfully');
      }

      handleCloseModal();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await adminAPI.deleteCourse(id);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
      </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Courses
          </h1>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus />
            <span>Add Course</span>
          </button>
        </div>

        {courses.length > 0 ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4">Course</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Discount</th>
                    <th className="text-left py-3 px-4">Students</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id} className="border-b dark:border-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={course.thumbnail?.url}
                            alt={course.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {course.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {course.category}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {formatCurrency(course.price)}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {course.discount}%
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {course.enrolledStudents || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/admin/courses/${course._id}/content`)}
                            title="Manage Content"
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          >
                            <FiPlayCircle />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(course)}
                            title="Edit Course"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            title="Delete Course"
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <FiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No courses found</p>
            <button 
              onClick={() => handleOpenModal()}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <FiPlus />
              <span>Create First Course</span>
            </button>
          </div>
        )}

        {/* Add/Edit Course Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., CA Foundation Complete Course"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="input-field"
                    placeholder="Course description..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="CA Foundation">CA Foundation</option>
                      <option value="CA Intermediate">CA Intermediate</option>
                      <option value="CA Final">CA Final</option>
                      <option value="Programming">Programming</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Cloud Computing">Cloud Computing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instructor Name *
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="e.g., CA Rajesh Kumar"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      className="input-field"
                      placeholder="9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="6 months"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Level
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <input
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="English"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail Image
                  </label>
                  <FileUpload
                    onChange={(e) => handleFileChange(e, 'thumbnail')}
                    multiple={false}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    files={thumbnailFile ? [thumbnailFile] : (editingCourse && editingCourse.thumbnail?.url ? [{ name: 'Current Thumbnail', url: editingCourse.thumbnail.url }] : [])}
                    onRemove={() => {
                      setThumbnailFile(null);
                      if (editingCourse) {
                        setEditingCourse(prev => ({ ...prev, thumbnail: null }));
                      }
                    }}
                    dragLabel="Drag & drop course thumbnail here, or click to browse"
                    acceptLabel="Supports JPG, PNG, WEBP, or GIF up to 5MB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment QR Image (Optional)
                  </label>
                  <FileUpload
                    onChange={(e) => handleFileChange(e, 'paymentQr')}
                    multiple={false}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    files={paymentQrFile ? [paymentQrFile] : (editingCourse && editingCourse.paymentQrImage?.url ? [{ name: 'Current Payment QR', url: editingCourse.paymentQrImage.url }] : [])}
                    onRemove={() => {
                      setPaymentQrFile(null);
                      if (editingCourse) {
                        setEditingCourse(prev => ({ ...prev, paymentQrImage: null }));
                      }
                    }}
                    dragLabel="Drag & drop payment QR image here, or click to browse"
                    acceptLabel="Supports JPG, PNG, WEBP, or GIF up to 5MB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Features (one per line)
                  </label>
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    rows="4"
                    className="input-field"
                    placeholder="Complete video lectures&#10;PDF study material&#10;Practice questions&#10;Doubt clearing sessions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements (one per line)
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows="3"
                    className="input-field"
                    placeholder="Basic understanding of accounting&#10;12th pass or equivalent&#10;Dedication to study"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
};

export default Courses;
