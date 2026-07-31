import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash, FiVideo, FiFileText, FiChevronDown, FiChevronUp, FiUpload, FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { adminAPI, teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fileToBase64 } from '../../utils/helpers';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import Loading from '../../components/Loading';
import FileUpload from '../../components/ui/FileUpload';

const ManageCourseContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const apiInstance = isTeacher ? teacherAPI : adminAPI;
  const backPath = isTeacher ? '/teacher/batches' : '/admin/courses';
  const Layout = isTeacher ? ({ children }) => <>{children}</> : AdminLayout;

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);
  
  // Modals / Forms state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [videoForm, setVideoForm] = useState({ title: '', duration: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  useEffect(() => {
    fetchCourseContent();
  }, [id]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.getCourseContent(id);
      setCourse(response.data.data.course);
      setModules(response.data.data.modules);
    } catch (error) {
      console.error('Error fetching course content:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      await apiInstance.addModule(id, { 
        title: moduleTitle,
        order: modules.length + 1
      });
      toast.success('Module added successfully');
      setModuleTitle('');
      setShowModuleModal(false);
      fetchCourseContent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure? This will delete all videos in this module.')) return;
    try {
      await apiInstance.deleteModule(moduleId);
      toast.success('Module deleted');
      fetchCourseContent();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const handleDeleteVideo = async (moduleId, videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await apiInstance.deleteVideo(moduleId, videoId);
      toast.success('Video deleted');
      fetchCourseContent();
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
        toast.error('Please select a video file');
        return;
    }
    
    setUploading(true);
    setVideoUploadProgress(0);
    const loadingToast = toast.loading('Uploading video file to Cloudinary...');
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      
      const token = localStorage.getItem('token');
      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload?folder=videos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setVideoUploadProgress(pct);
          }
        }
      );

      if (uploadRes.data.status !== 'success') {
        throw new Error(uploadRes.data.message || 'Upload failed');
      }

      const { url, publicId } = uploadRes.data.data;

      await apiInstance.addVideo(selectedModuleId, {
        ...videoForm,
        url,
        publicId
      });

      toast.success('Video uploaded successfully');
      setShowVideoModal(false);
      setVideoForm({ title: '', duration: '' });
      setVideoFile(null);
      fetchCourseContent();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setVideoUploadProgress(0);
      toast.dismiss(loadingToast);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <button 
            onClick={() => navigate(backPath)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {course?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage modules and recorded lectures</p>
            </div>
            <button 
              onClick={() => setShowModuleModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
            >
              <FiPlus className="mr-2" /> Add Module
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                  onClick={() => setExpandedModule(expandedModule === module._id ? null : module._id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center font-bold">
                      {module.order}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                      <p className="text-sm text-gray-500">{module.videos?.length || 0} Videos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModuleId(module._id);
                            setShowVideoModal(true);
                        }}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md"
                        title="Add Video"
                    >
                        <FiVideo />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(module._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        title="Delete Module"
                    >
                        <FiTrash />
                    </button>
                    {expandedModule === module._id ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>

                {expandedModule === module._id && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
                    {module.videos && module.videos.length > 0 ? (
                      <div className="space-y-2">
                        {module.videos.map((video, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                            <div className="flex items-center space-x-3">
                              <FiVideo className="text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{video.title}</p>
                                <p className="text-xs text-gray-500">{video.duration} mins</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                                <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Preview</a>
                                <button 
                                  onClick={() => handleDeleteVideo(module._id, video._id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4 italic text-sm">No videos uploaded yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {modules.length === 0 && (
              <div className="text-center py-20 bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <FiVideo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No content modules yet. Start by adding one!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Module</h2>
            <form onSubmit={handleAddModule}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Module Title</label>
                <input 
                  type="text" 
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., Introduction to CA Foundation"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModuleModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Module</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Recorded Lecture</h2>
                <button onClick={() => setShowVideoModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleVideoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Video Title</label>
                <input 
                  type="text" 
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                  className="input-field w-full"
                  placeholder="e.g., Chapter 1: Basics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input 
                  type="text" 
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm({...videoForm, duration: e.target.value})}
                  className="input-field w-full"
                  placeholder="e.g., 45"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Video File</label>
                <FileUpload
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  multiple={false}
                  accept="video/*"
                  maxSize={100 * 1024 * 1024}
                  disabled={uploading}
                  uploading={uploading}
                  progress={videoUploadProgress}
                  files={videoFile ? [videoFile] : []}
                  onRemove={() => setVideoFile(null)}
                  dragLabel="Drag & drop video file here, or click to browse"
                  acceptLabel="Supports MP4, WebM, and other video formats up to 100MB"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowVideoModal(false)} className="btn-secondary" disabled={uploading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                    {uploading ? 'Uploading to Cloudinary...' : 'Upload Lecture'}
                </button>
              </div>
              {uploading && (
                  <p className="text-xs text-center text-blue-600 animate-pulse">Wait, this might take a minute depending on file size...</p>
              )}
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageCourseContent;
