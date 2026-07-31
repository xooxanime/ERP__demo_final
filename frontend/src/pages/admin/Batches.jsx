import { useState, useEffect } from 'react';
import { batchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, BookOpen, GraduationCap, X, Search, School } from 'lucide-react';

const AdminBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  
  // Lists for dropdown selects
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teachers: [],
    batchManager: '',
    canManageStudents: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'detail'
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchUsersList();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await batchAPI.getAll();
      setBatches(response.data.data.batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const response = await batchAPI.getUsersList();
      const { teachers, students, courses } = response.data.data;
      setTeachersList(teachers);
      setStudentsList(students);
      setCoursesList(courses);
    } catch (error) {
      console.error('Error fetching users/courses list:', error);
    }
  };

  const handleOpenModal = (batch = null) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        name: batch.name,
        description: batch.description || '',
        teachers: batch.teachers.map(t => t._id),
        batchManager: batch.batchManager?._id || batch.batchManager || '',
        canManageStudents: batch.canManageStudents || false
      });
    } else {
      setEditingBatch(null);
      setFormData({
        name: '',
        description: '',
        teachers: [],
        batchManager: '',
        canManageStudents: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBatch(null);
  };

  const handleMultiSelectChange = (e, field) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      [field]: selectedIds
    }));
  };

  const toggleSelection = (id, field) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(id) 
        ? current.filter(x => x !== id)
        : [...current, id];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Batch name is required');
      return;
    }

    try {
      if (editingBatch) {
        await batchAPI.update(editingBatch._id, formData);
        toast.success('Batch updated successfully');
      } else {
        await batchAPI.create(formData);
        toast.success('Batch created successfully');
      }
      handleCloseModal();
      fetchBatches();
      if (selectedBatch && editingBatch?._id === selectedBatch._id) {
        // Refresh detail view
        const updated = await batchAPI.getById(selectedBatch._id);
        setSelectedBatch(updated.data.data.batch);
      }
    } catch (error) {
      console.error('Error saving batch:', error);
      toast.error(error.response?.data?.message || 'Error saving batch');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await batchAPI.delete(id);
        toast.success('Batch deleted successfully');
        if (selectedBatch?._id === id) {
          setActiveTab('list');
          setSelectedBatch(null);
        }
        fetchBatches();
      } catch (error) {
        console.error('Error deleting batch:', error);
        toast.error('Failed to delete batch');
      }
    }
  };

  const handleViewDetails = async (batch) => {
    try {
      const response = await batchAPI.getById(batch._id);
      setSelectedBatch(response.data.data.batch);
      setActiveTab('detail');
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast.error('Failed to load batch details');
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.description && batch.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <School className="w-7 h-7 text-primary" />
            Batch Management
          </h1>
          <p className="text-sm text-slate-500">Create, monitor, and assign students and teachers to academic batch groups.</p>
        </div>
        {activeTab === 'list' ? (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Batch
          </button>
        ) : (
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedBatch(null);
            }}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            Back to List
          </button>
        )}
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          {/* Batches Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-48"></div>
              ))}
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <School className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No batches found</h3>
              <p className="text-slate-500 text-sm mt-1">Get started by creating your first academic batch.</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm inline-flex items-center gap-2 hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> Create Batch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((batch) => (
                <div 
                  key={batch._id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 font-display text-lg leading-snug">{batch.name}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleOpenModal(batch)}
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(batch._id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {batch.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{batch.description}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                        <Users className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{batch.teachers?.length || 0}</span>
                        <span className="text-[10px] text-slate-400">Teachers</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                        <GraduationCap className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{batch.students?.length || 0}</span>
                        <span className="text-[10px] text-slate-400">Students</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                        <BookOpen className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{batch.courses?.length || 0}</span>
                        <span className="text-[10px] text-slate-400">Courses</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(batch)}
                      className="w-full mt-2 py-2 bg-slate-50 hover:bg-primary/5 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary font-semibold text-xs rounded-xl transition-all border border-slate-100 dark:border-slate-800"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Batch Detail View */
        selectedBatch && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Batch Info Card */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 h-fit">
              <div>
                <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg mb-2">Academic Batch</span>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">{selectedBatch.name}</h2>
                {selectedBatch.description && (
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{selectedBatch.description}</p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {selectedBatch.batchManager && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Batch Manager:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedBatch.batchManager.name}
                      {selectedBatch.canManageStudents && ' 🔑'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Teachers Assigned:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBatch.teachers?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Students Enrolled:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBatch.students?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Linked Courses:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBatch.courses?.length || 0}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleOpenModal(selectedBatch)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Batch
                </button>
                <button
                  onClick={() => handleDelete(selectedBatch._id)}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Relations Details Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Linked Courses Tab */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 text-md">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Linked Courses ({selectedBatch.courses?.length || 0})
                </h3>
                {selectedBatch.courses?.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No courses linked to this batch.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBatch.courses.map(course => (
                      <div key={course._id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex gap-3 items-center">
                        <img 
                          src={course.thumbnail?.url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop'} 
                          alt={course.title}
                          className="w-12 h-12 object-cover rounded-lg bg-slate-200"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{course.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{course.category} • {course.instructor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Teachers Tab */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 text-md">
                  <Users className="w-4 h-4 text-emerald-500" /> Assigned Teachers ({selectedBatch.teachers?.length || 0})
                </h3>
                {selectedBatch.teachers?.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No teachers assigned to this batch.</p>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {selectedBatch.teachers.map(teacher => (
                      <div key={teacher._id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{teacher.name}</p>
                          <p className="text-[10px] text-slate-400">{teacher.email}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{teacher.phone || 'No phone'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled Students Tab */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 text-md">
                  <GraduationCap className="w-4 h-4 text-violet-500" /> Enrolled Students ({selectedBatch.students?.length || 0})
                </h3>
                {selectedBatch.students?.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No students assigned to this batch.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {selectedBatch.students.map(student => (
                      <div key={student._id} className="p-2.5 border border-slate-50 dark:border-slate-800/40 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{student.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Create / Edit Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-base">
                {editingBatch ? 'Edit Batch Details' : 'Create New Batch'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Name *</label>
                <input
                  type="text"
                  placeholder="e.g. CA Intermediate Nov 2026 Batch A"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Add some details about the batch timeline, courses, etc."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm h-20"
                />
              </div>

              {/* Teachers Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Teachers</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl max-h-40 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                  {teachersList.map(teacher => {
                    const isSelected = formData.teachers.includes(teacher._id);
                    return (
                      <div 
                        key={teacher._id}
                        onClick={() => toggleSelection(teacher._id, 'teachers')}
                        className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{teacher.name}</span>
                        {isSelected && <X className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Batch Manager Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nominate Batch Manager</label>
                <select
                  value={formData.batchManager || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    batchManager: e.target.value || null,
                    canManageStudents: e.target.value ? prev.canManageStudents : false
                  }))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                >
                  <option value="">None</option>
                  {teachersList
                    .filter(t => formData.teachers.includes(t._id))
                    .map(teacher => (
                      <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                    ))}
                </select>
              </div>

              {/* Toggle student management */}
              {formData.batchManager && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="canManageStudents"
                    checked={formData.canManageStudents}
                    onChange={(e) => setFormData(prev => ({ ...prev, canManageStudents: e.target.checked }))}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="canManageStudents" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Grant student enrollment/management permission
                  </label>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary/90 shadow-md"
                >
                  {editingBatch ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatches;
