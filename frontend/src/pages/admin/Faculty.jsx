import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiAward, FiUpload } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import Loading from '../../components/Loading';
import { fileToBase64 } from '../../utils/helpers';
import { getFileUrl } from '../../lib/utils';
import FileUpload from '../../components/ui/FileUpload';

const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    qualification: '',
    experience: '',
    specialization: '',
    bio: '',
    subjects: '',
    achievements: '',
    imageBase64: ''
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await adminAPI.getAllFaculty();
      setFaculty(response.data.data.faculty);
    } catch (error) {
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
        achievements: formData.achievements.split('\n').map(a => a.trim()).filter(Boolean)
      };

      if (editingFaculty) {
        await adminAPI.updateFaculty(editingFaculty._id, data);
        toast.success('Faculty updated successfully');
      } else {
        await adminAPI.createFaculty(data);
        toast.success('Faculty added successfully');
      }

      setShowModal(false);
      resetForm();
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (member) => {
    setEditingFaculty(member);
    setFormData({
      name: member.name,
      email: member.email,
      designation: member.designation,
      qualification: member.qualification,
      experience: member.experience,
      specialization: member.specialization,
      bio: member.bio,
      subjects: member.subjects?.join(', ') || '',
      achievements: member.achievements?.join('\n') || '',
      imageBase64: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      await adminAPI.deleteFaculty(id);
      toast.success('Faculty deleted successfully');
      fetchFaculty();
    } catch (error) {
      toast.error('Failed to delete faculty');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      designation: '',
      qualification: '',
      experience: '',
      specialization: '',
      bio: '',
      subjects: '',
      achievements: '',
      imageBase64: ''
    });
    setEditingFaculty(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image size should be less than 2MB');
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, imageBase64: base64 });
      } catch (error) {
        toast.error('Failed to process image');
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Faculty Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage faculty members and their profiles
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus />
            <span>Add Faculty</span>
          </button>
        </div>

        {/* Faculty Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculty.map((member) => (
            <div key={member._id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={(!member.image?.url || member.image.url.includes('avatar-placeholder.png') || !getFileUrl(member.image.url))
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3B82F6&color=fff&size=128`
                      : getFileUrl(member.image.url)
                    }
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      {member.designation}
                    </p>
                  </div>
                </div>
                <FiAward className="w-6 h-6 text-yellow-500" />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> {member.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Qualification:</strong> {member.qualification}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Experience:</strong> {member.experience}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Specialization:</strong> {member.specialization}
                </p>
              </div>

              {member.subjects && member.subjects.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subjects:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.subjects.map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {faculty.length === 0 && (
          <div className="text-center py-12">
            <FiAward className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No faculty members yet. Add your first faculty member!
            </p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="input-field"
                        placeholder="e.g., Senior Faculty"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Qualification *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="input-field"
                        placeholder="e.g., CA, MBA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Experience *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="input-field"
                        placeholder="e.g., 10+ years"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Specialization *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="input-field"
                        placeholder="e.g., Taxation"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio *
                    </label>
                    <textarea
                      required
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Brief bio about the faculty member"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subjects (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Accounting, Taxation, Auditing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Achievements (one per line)
                    </label>
                    <textarea
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      className="input-field"
                      rows="4"
                      placeholder="Enter achievements, one per line"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Photo
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <FileUpload
                        onChange={handleImageUpload}
                        multiple={false}
                        accept="image/*"
                        maxSize={2 * 1024 * 1024}
                        files={formData.imageBase64 ? [{ name: 'Selected Photo', url: formData.imageBase64 }] : (editingFaculty && editingFaculty.image?.url ? [{ name: editingFaculty.name, url: editingFaculty.image.url }] : [])}
                        onRemove={() => {
                          setFormData(prev => ({ ...prev, imageBase64: '' }));
                          if (editingFaculty && editingFaculty.image) {
                            editingFaculty.image.url = '';
                          }
                        }}
                        dragLabel="Drag & drop faculty photo here, or click to browse"
                        acceptLabel="Supports PNG, JPG, or JPEG up to 2MB"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button type="submit" className="flex-1 btn-primary">
                      {editingFaculty ? 'Update' : 'Add'} Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFaculty;
