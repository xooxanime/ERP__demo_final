import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiFile, FiDownload } from 'react-icons/fi';
import { adminAPI, studyMaterialAPI } from '../../services/api';
import { getFileUrl, openOrDownloadFile } from '../../lib/utils';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import Loading from '../../components/Loading';

const AdminStudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Notes',
    subject: '',
    fileUrl: '',
    fileType: 'PDF',
    fileSize: '',
    isPremium: false
  });

  const categories = ['Notes', 'Practice Questions', 'Mock Tests', 'Previous Papers', 'Reference Books'];
  const subjects = ['Accounting', 'Taxation', 'Auditing', 'Law', 'Costing', 'Financial Management'];
  const fileTypes = ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'ZIP'];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await adminAPI.getAllStudyMaterials();
      setMaterials(response.data.data.materials);
    } catch (error) {
      toast.error('Failed to fetch study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingMaterial) {
        await adminAPI.updateStudyMaterial(editingMaterial._id, formData);
        toast.success('Study material updated successfully');
      } else {
        await adminAPI.createStudyMaterial(formData);
        toast.success('Study material added successfully');
      }

      setShowModal(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      category: material.category,
      subject: material.subject,
      fileUrl: material.file?.url || '',
      fileType: material.fileType,
      fileSize: material.fileSize || '',
      isPremium: material.isPremium
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;

    try {
      await adminAPI.deleteStudyMaterial(id);
      toast.success('Study material deleted successfully');
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to delete study material');
    }
  };

  const handleDownloadMaterial = async (materialId) => {
    try {
      const res = await studyMaterialAPI.download(materialId);
      const fileUrl = res.data?.data?.fileUrl;
      if (fileUrl) {
        window.open(getFileUrl(fileUrl), '_blank');
        toast.success('Opening study material...');
        fetchMaterials();
      } else {
        toast.error('File URL not found');
      }
    } catch (error) {
      console.error('Download material error:', error);
      toast.error('Failed to download material');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Notes',
      subject: '',
      fileUrl: '',
      fileType: 'PDF',
      fileSize: '',
      isPremium: false
    });
    setEditingMaterial(null);
  };

  if (loading) return <Loading />;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Study Materials Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage notes, practice questions, and mock tests
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
            <span>Add Material</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Materials</p>
            <p className="text-3xl font-bold text-foreground">{materials.length}</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-3xl font-bold text-blue-500">
              {materials.filter(m => m.category === 'Notes').length}
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Practice Questions</p>
            <p className="text-3xl font-bold text-emerald-500">
              {materials.filter(m => m.category === 'Practice Questions').length}
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Mock Tests</p>
            <p className="text-3xl font-bold text-purple-500">
              {materials.filter(m => m.category === 'Mock Tests').length}
            </p>
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Title
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Category
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Subject
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Downloads
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Premium
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material._id} className="border-b border-border hover:bg-muted/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <FiFile className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {material.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {material.description.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs rounded-full">
                      {material.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {material.subject}
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {material.fileType}
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    <div className="flex items-center space-x-2">
                      <FiDownload className="w-4 h-4 text-muted-foreground" />
                      <span>{material.downloads}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {material.isPremium ? (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full">
                        Premium
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownloadMaterial(material._id)}
                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded"
                        title="Download / Open File"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {materials.length === 0 && (
            <div className="text-center py-12">
              <FiFile className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No study materials yet. Add your first material!
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-popover border border-border text-popover-foreground rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {editingMaterial ? 'Edit Study Material' : 'Add Study Material'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Accounting Fundamentals Notes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Brief description of the study material"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input-field"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject *
                      </label>
                      <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="input-field"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        File Type *
                      </label>
                      <select
                        required
                        value={formData.fileType}
                        onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                        className="input-field"
                      >
                        {fileTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        File Size
                      </label>
                      <input
                        type="text"
                        value={formData.fileSize}
                        onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                        className="input-field"
                        placeholder="e.g., 2.5 MB"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload File / File URL *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const formDataUpload = new FormData();
                            formDataUpload.append('file', file);
                            toast.loading('Uploading file...', { id: 'sm-upload' });
                            const res = await axios.post('/api/upload?folder=study-materials', formDataUpload, {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'multipart/form-data'
                              }
                            });
                            const uploadedUrl = res.data.data.url;
                            setFormData(prev => ({
                              ...prev,
                              fileUrl: uploadedUrl,
                              fileSize: res.data.data.fileSize || `${(file.size / (1024*1024)).toFixed(2)} MB`,
                              fileType: file.name.split('.').pop().toUpperCase()
                            }));
                            toast.success('File uploaded successfully!', { id: 'sm-upload' });
                          } catch (err) {
                            console.error('File upload failed:', err);
                            toast.error(err.response?.data?.message || 'File upload failed', { id: 'sm-upload' });
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <input
                        type="text"
                        required
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        className="input-field"
                        placeholder="https://example.com/file.pdf or uploaded file path"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPremium"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isPremium" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Premium Content (Only for enrolled students)
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button type="submit" className="flex-1 btn-primary">
                      {editingMaterial ? 'Update' : 'Add'} Material
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

export default AdminStudyMaterials;
