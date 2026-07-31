import { useState, useEffect } from 'react';
import { batchAPI, teacherAPI, studyMaterialAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  School, Users, BookOpen, ClipboardList, Award, Plus, 
  ChevronRight, Calendar, ExternalLink, CheckCircle, FileText, Send, Trash, Edit, X, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fileToBase64 } from '../../utils/helpers';
import { getFileUrl, openOrDownloadFile } from '../../lib/utils';
import FileUpload from '../../components/ui/FileUpload';

const TeacherBatches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'courses'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseTab, setCourseTab] = useState('lectures'); // 'lectures', 'materials', 'assignments', 'quizzes', 'attendance'
  
  // Lectures/Modules management state
  const [courseModules, setCourseModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [videoForm, setVideoForm] = useState({ title: '', duration: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'CA Intermediate',
    price: 0,
    duration: '3 months',
    level: 'Intermediate',
    language: 'English'
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    courseId: '',
    batchId: ''
  });

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    courseId: '',
    batchId: '',
    dueDate: '',
    duration: 30,
    questions: [
      { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }
    ]
  });

  // Dynamic Data Lists
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);

  // Grading State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingForm, setGradingForm] = useState({
    submissionId: '',
    grade: '',
    feedback: '',
    status: 'graded'
  });

  // Study Materials State
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [uploadingMaterialFile, setUploadingMaterialFile] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    category: 'Notes',
    subject: 'Accounting',
    fileType: 'PDF',
    fileUrl: '',
    publicId: ''
  });

  // Student Enrollment State & Methods (Batch Manager Delegation)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  // PDF Quiz AI Extraction States
  const [quizCreationMode, setQuizCreationMode] = useState('manual'); // 'manual' | 'pdf'
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [selectedQuestionsForQuiz, setSelectedQuestionsForQuiz] = useState([]); // indices
  const [numQuestionsToUse, setNumQuestionsToUse] = useState(5);
  const [extractingPdf, setExtractingPdf] = useState(false);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  const isBatchManager = selectedBatch && 
    (
      selectedBatch.batchManager?._id === user?.id || 
      selectedBatch.batchManager === user?.id || 
      selectedBatch.batchManager?._id === user?._id || 
      selectedBatch.batchManager === user?._id
    ) && 
    selectedBatch.canManageStudents;

  const fetchAttendanceList = async (batchId, courseId, date) => {
    try {
      setAttendanceLoading(true);
      const params = { date };
      if (courseId) {
        params.courseId = courseId;
      }
      const response = await batchAPI.getBatchAttendance(batchId, params);
      setAttendanceList(response.data.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance list:', error);
      toast.error('Failed to load attendance list');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendanceSubmit = async () => {
    try {
      setAttendanceSaving(true);
      const records = attendanceList.map(item => ({
        studentId: item.studentId,
        status: item.status || 'present'
      }));
      const payload = {
        date: attendanceDate,
        attendanceRecords: records
      };
      if (attendanceCourseId) {
        payload.courseId = attendanceCourseId;
      }
      await batchAPI.submitAttendance(selectedBatch._id, payload);
      toast.success('Attendance updated successfully!');
      fetchAttendanceList(selectedBatch._id, attendanceCourseId, attendanceDate);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const updateStudentAttendanceStatus = (studentId, status) => {
    setAttendanceList(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, status } : s
    ));
  };

  const markAllAttendance = (status) => {
    setAttendanceList(prev => prev.map(s => ({ ...s, status })));
  };

  useEffect(() => {
    if (selectedBatch && activeTab === 'attendance') {
      fetchAttendanceList(selectedBatch._id, attendanceCourseId, attendanceDate);
    }
  }, [selectedBatch, activeTab, attendanceCourseId, attendanceDate]);

  const openEnrollmentModal = async () => {
    try {
      setShowEnrollmentModal(true);
      const response = await batchAPI.getUsersList();
      setAllStudents(response.data.data.students || []);
      setEnrolledStudentIds(selectedBatch.students?.map(s => s._id) || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students list');
    }
  };

  const handleEnrollmentSubmit = async () => {
    setSavingEnrollment(true);
    try {
      await batchAPI.manageBatchStudents(selectedBatch._id, enrolledStudentIds);
      toast.success('Enrolled students updated successfully');
      setShowEnrollmentModal(false);
      // Refresh batch details
      const response = await batchAPI.getById(selectedBatch._id);
      setSelectedBatch(response.data.data.batch);
    } catch (error) {
      console.error('Error saving enrollment:', error);
      toast.error(error.response?.data?.message || 'Failed to update enrollment');
    } finally {
      setSavingEnrollment(false);
    }
  };

  const toggleStudentEnrollment = (studentId) => {
    setEnrolledStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  useEffect(() => {
    fetchTeacherBatches();
  }, []);

  const fetchTeacherBatches = async () => {
    try {
      setLoading(true);
      const response = await batchAPI.getAll();
      setBatches(response.data.data.batches);
    } catch (error) {
      console.error('Error fetching teacher batches:', error);
      toast.error('Failed to load assigned batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseContent = async (courseId) => {
    try {
      setModulesLoading(true);
      const res = await teacherAPI.getCourseContent(courseId);
      setCourseModules(res.data?.data?.modules || []);
    } catch (err) {
      console.error('Error fetching course content:', err);
      toast.error('Failed to load course modules');
    } finally {
      setModulesLoading(false);
    }
  };

  const handleOpenCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedCourseForMaterials(course);
    setCourseTab('lectures');
    
    // Fetch Modules & Lectures
    fetchCourseContent(course._id);
    
    // Fetch Assignments & Quizzes
    fetchAssignments(selectedBatch._id);
    fetchQuizzes(selectedBatch._id);
    
    // Fetch Study Materials
    handleFetchMaterials(course._id);
    
    // Fetch Attendance
    setAttendanceCourseId(course._id);
    fetchAttendanceList(selectedBatch._id, course._id, attendanceDate);
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      await teacherAPI.addModule(selectedCourse._id, { 
        title: moduleTitle,
        order: courseModules.length + 1
      });
      toast.success('Module added successfully');
      setModuleTitle('');
      setShowModuleModal(false);
      fetchCourseContent(selectedCourse._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure? This will delete all videos in this module.')) return;
    try {
      await teacherAPI.deleteModule(moduleId);
      toast.success('Module deleted');
      fetchCourseContent(selectedCourse._id);
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const handleUploadVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
        toast.error('Please select a video file');
        return;
    }
    
    setUploadingVideo(true);
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

      await teacherAPI.addVideo(selectedModuleId, {
        ...videoForm,
        url,
        publicId
      });

      toast.success('Video uploaded successfully');
      setShowVideoModal(false);
      setVideoForm({ title: '', duration: '' });
      setVideoFile(null);
      fetchCourseContent(selectedCourse._id);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(0);
      toast.dismiss(loadingToast);
    }
  };

  const handleDeleteVideo = async (moduleId, videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await teacherAPI.deleteVideo(moduleId, videoId);
      toast.success('Video deleted');
      fetchCourseContent(selectedCourse._id);
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const handleSelectBatch = async (batch) => {
    try {
      setLoading(true);
      setSelectedCourse(null);
      const response = await batchAPI.getById(batch._id);
      setSelectedBatch(response.data.data.batch);
      setActiveTab('students');
      
      // Fetch assignments & quizzes
      fetchAssignments(batch._id);
      fetchQuizzes(batch._id);
    } catch (error) {
      console.error('Error loading batch details:', error);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (batchId) => {
    try {
      const response = await batchAPI.getAssignments(batchId);
      setAssignments(response.data.data.assignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const fetchQuizzes = async (batchId) => {
    try {
      const response = await batchAPI.getQuizzes(batchId);
      setQuizzes(response.data.data.quizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  // Course Actions
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await batchAPI.createCourseInBatch(selectedBatch._id, courseForm);
      toast.success('Course created inside batch!');
      setShowCourseModal(false);
      // Reload batch details
      handleSelectBatch(selectedBatch);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  };

  // Assignment Actions
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...assignmentForm,
        batchId: selectedBatch._id
      };
      await batchAPI.createAssignment(payload);
      toast.success('Assignment published successfully!');
      setShowAssignmentModal(false);
      setAssignmentForm({ title: '', description: '', dueDate: '', courseId: '', batchId: '' });
      fetchAssignments(selectedBatch._id);
    } catch (error) {
      console.error('Error publishing assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      const response = await batchAPI.getSubmissions(assignment._id);
      setSubmissions(response.data.data.submissions);
      setShowSubmissionsModal(true);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    try {
      await batchAPI.gradeSubmission(gradingForm.submissionId, {
        grade: gradingForm.grade,
        feedback: gradingForm.feedback,
        status: gradingForm.status
      });
      toast.success('Evaluation submitted successfully!');
      // Refresh submissions
      const response = await batchAPI.getSubmissions(selectedAssignment._id);
      setSubmissions(response.data.data.submissions);
      setGradingForm({ submissionId: '', grade: '', feedback: '', status: 'graded' });
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error grading/evaluating submission:', error);
      toast.error('Failed to submit evaluation');
    }
  };

  // Study Materials Actions
  const handleOpenMaterialsModal = async (course) => {
    setSelectedCourseForMaterials(course);
    setMaterialForm({
      title: '',
      description: '',
      category: 'Notes',
      subject: 'Accounting',
      fileType: 'PDF',
      fileUrl: '',
      publicId: ''
    });
    setEditingMaterial(null);
    setShowAddMaterialForm(false);
    setShowMaterialsModal(true);
    await handleFetchMaterials(course._id);
  };

  const handleFetchMaterials = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      // Fetch materials filtering by course and selectedBatch
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/study-materials?course=${courseId}&batchId=${selectedBatch._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.status === 'success') {
        setCourseMaterials(res.data.data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching course materials:', error);
      toast.error('Failed to load study materials');
    }
  };

  const handleMaterialFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMaterialFile(true);
    const loadingToast = toast.loading('Uploading file to Cloudinary...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload?folder=study-materials`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.status === 'success') {
        setMaterialForm(prev => ({
          ...prev,
          fileUrl: res.data.data.url,
          publicId: res.data.data.publicId,
          fileType: res.data.data.fileType
        }));
        toast.dismiss(loadingToast);
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Study material upload error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to upload study material file');
    } finally {
      setUploadingMaterialFile(false);
    }
  };

  const handleSubmitMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.fileUrl) {
      toast.error('Please upload a file or provide a valid URL');
      return;
    }

    try {
      const payload = {
        ...materialForm,
        course: selectedCourseForMaterials._id,
        batchId: selectedBatch._id,
        academicSessionId: selectedBatch.academicSessionId?._id || selectedBatch.academicSessionId
      };

      const token = localStorage.getItem('token');
      if (editingMaterial) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/study-materials/${editingMaterial._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Study material updated successfully!');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/study-materials`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Study material uploaded successfully!');
      }

      setShowAddMaterialForm(false);
      setEditingMaterial(null);
      setMaterialForm({
        title: '',
        description: '',
        category: 'Notes',
        subject: 'Accounting',
        fileType: 'PDF',
        fileUrl: '',
        publicId: ''
      });
      await handleFetchMaterials(selectedCourseForMaterials._id);
    } catch (error) {
      console.error('Error submitting study material:', error);
      toast.error(error.response?.data?.message || 'Failed to submit study material');
    }
  };

  const handleEditMaterialClick = (material) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title,
      description: material.description || '',
      category: material.category || 'Notes',
      subject: material.subject || 'Accounting',
      fileType: material.fileType || 'PDF',
      fileUrl: material.fileUrl,
      publicId: material.publicId || ''
    });
    setShowAddMaterialForm(true);
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/study-materials/${materialId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Study material deleted successfully');
      await handleFetchMaterials(selectedCourseForMaterials._id);
    } catch (error) {
      console.error('Error deleting study material:', error);
      toast.error('Failed to delete study material');
    }
  };

  // Quiz Actions
  const handleAddQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }]
    }));
  };

  const handleRemoveQuestion = (idx) => {
    if (quizForm.questions.length === 1) return;
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuizForm(prev => {
      const questions = [...prev.questions];
      questions[idx][field] = value;
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuizForm(prev => {
      const questions = [...prev.questions];
      questions[qIdx].options[optIdx] = val;
      return { ...prev, questions };
    });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExtractingPdf(true);
    const loadingToast = toast.loading('Reading PDF and extracting questions with AI...');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/batches/quizzes/extract-questions`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.status === 'success') {
        const questions = res.data.data.questions || [];
        setExtractedQuestions(questions);
        setSelectedQuestionsForQuiz(questions.map((_, i) => i));
        setNumQuestionsToUse(questions.length);
        toast.dismiss(loadingToast);
        toast.success(`Successfully extracted ${questions.length} questions from PDF!`);
      }
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to extract questions from PDF');
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleExtractedQuestionChange = (idx, field, value) => {
    setExtractedQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleExtractedOptionChange = (qIdx, optIdx, val) => {
    setExtractedQuestions(prev => {
      const updated = [...prev];
      const options = [...updated[qIdx].options];
      options[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options };
      return updated;
    });
  };

  const handleToggleQuestionSelection = (idx) => {
    setSelectedQuestionsForQuiz(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleDeleteExtractedQuestion = (idx) => {
    setExtractedQuestions(prev => prev.filter((_, i) => i !== idx));
    setSelectedQuestionsForQuiz(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();

    let finalQuestions = [];
    if (quizCreationMode === 'manual') {
      finalQuestions = quizForm.questions;
    } else {
      // PDF Mode
      // Get selected questions
      finalQuestions = extractedQuestions.filter((_, idx) => selectedQuestionsForQuiz.includes(idx));
      
      // Limit to numQuestionsToUse if specified
      if (numQuestionsToUse && numQuestionsToUse < finalQuestions.length) {
        finalQuestions = finalQuestions.slice(0, numQuestionsToUse);
      }

      if (finalQuestions.length === 0) {
        toast.error('Please select at least one question for the quiz');
        return;
      }
    }

    try {
      const payload = {
        title: quizForm.title,
        description: quizForm.description,
        courseId: quizForm.courseId,
        batchId: selectedBatch._id,
        dueDate: quizForm.dueDate,
        duration: quizForm.duration,
        questions: finalQuestions
      };
      await batchAPI.createQuiz(payload);
      toast.success('Quiz published successfully!');
      setShowQuizModal(false);
      
      // Reset Quiz states
      setQuizForm({
        title: '',
        description: '',
        courseId: '',
        batchId: '',
        dueDate: '',
        duration: 30,
        questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }]
      });
      setExtractedQuestions([]);
      setSelectedQuestionsForQuiz([]);
      setQuizCreationMode('manual');
      
      fetchQuizzes(selectedBatch._id);
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleViewAttempts = async (quiz) => {
    try {
      setSelectedQuiz(quiz);
      const response = await batchAPI.getAttempts(quiz._id);
      setAttempts(response.data.data.attempts);
      setShowAttemptsModal(true);
    } catch (error) {
      console.error('Error loading attempts:', error);
      toast.error('Failed to load attempts');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <School className="w-7 h-7 text-primary" />
            My Batches
          </h1>
          <p className="text-sm text-slate-500">Manage learning groups, create curriculum, publish assignments, and grade quizzes.</p>
        </div>
        {selectedBatch && (
          <button
            onClick={() => setSelectedBatch(null)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            Back to Batches
          </button>
        )}
      </div>

      {!selectedBatch ? (
        /* Batches List */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-44"></div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <School className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No batches assigned</h3>
            <p className="text-slate-500 text-sm mt-1">You are not currently assigned to any active batch groups. Contact Admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div 
                key={batch._id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 font-display text-lg mb-2">{batch.name}</h3>
                  {batch.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{batch.description}</p>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-500" /> {batch.students?.length || 0} Students</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-blue-500" /> {batch.courses?.length || 0} Courses</span>
                  </div>

                  <button
                    onClick={() => handleSelectBatch(batch)}
                    className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    Manage Batch <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Batch Dashboard View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm h-fit space-y-1">
            <div className="pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 font-display text-md truncate">{selectedBatch.name}</h3>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5">Teacher Controls</p>
            </div>
            
            <button
              onClick={() => {
                setActiveTab('students');
                setSelectedCourse(null);
              }}
              className={`w-full px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2.5 transition-all ${
                activeTab === 'students' && !selectedCourse ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" /> Enrolled Students
            </button>
            <button
              onClick={() => {
                setActiveTab('courses');
                setSelectedCourse(null);
              }}
              className={`w-full px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2.5 transition-all ${
                activeTab === 'courses' && !selectedCourse ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Batch Courses
            </button>
          </div>

          {/* Main Dashboard Panel */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCourse ? (
              <div className="space-y-6">
                {/* Course Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setSelectedCourse(null);
                          setCourseTab('lectures');
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition-all"
                      >
                        ← Back to Courses
                      </button>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-150 font-display text-lg leading-tight">{selectedCourse.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">Batch: {selectedBatch.name} • {selectedCourse.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Tab Navigation */}
                  <div className="flex border-b border-slate-150 dark:border-slate-800 gap-1 overflow-x-auto pt-2 no-scrollbar">
                    {[
                      { id: 'lectures', label: 'Lectures & Modules', icon: BookOpen },
                      { id: 'materials', label: 'Study Materials', icon: FileText },
                      { id: 'assignments', label: 'Assignments', icon: ClipboardList },
                      { id: 'quizzes', label: 'Quizzes & Tests', icon: Award },
                      { id: 'attendance', label: 'Attendance', icon: Calendar }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = courseTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setCourseTab(tab.id);
                            if (tab.id === 'materials') {
                              handleFetchMaterials(selectedCourse._id);
                            } else if (tab.id === 'assignments') {
                              fetchAssignments(selectedBatch._id);
                              setAssignmentForm(prev => ({ ...prev, courseId: selectedCourse._id, batchId: selectedBatch._id }));
                            } else if (tab.id === 'quizzes') {
                              fetchQuizzes(selectedBatch._id);
                              setQuizForm(prev => ({ ...prev, courseId: selectedCourse._id, batchId: selectedBatch._id }));
                            } else if (tab.id === 'attendance') {
                              setAttendanceCourseId(selectedCourse._id);
                              fetchAttendanceList(selectedBatch._id, selectedCourse._id, attendanceDate);
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                            isActive 
                              ? 'border-primary text-primary bg-primary/5 rounded-t-xl' 
                              : 'border-transparent text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub Tab contents */}
                {courseTab === 'lectures' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Modules ({courseModules.length})</h4>
                      <button
                        type="button"
                        onClick={() => setShowModuleModal(true)}
                        className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 hover:bg-primary/95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Module
                      </button>
                    </div>

                    {modulesLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : courseModules.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-xs text-slate-500 font-bold">No modules created yet. Start by adding one!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {courseModules.map((module) => (
                          <div key={module._id} className="bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                            <div 
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                              onClick={() => setExpandedModule(expandedModule === module._id ? null : module._id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xs">
                                  {module.order}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-slate-250 text-xs">{module.title}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{module.videos?.length || 0} Video Lectures</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => {
                                    setSelectedModuleId(module._id);
                                    setShowVideoModal(true);
                                  }}
                                  className="p-1.5 text-primary bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-primary hover:text-white rounded-lg transition-all"
                                  title="Add Video"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteModule(module._id)}
                                  className="p-1.5 text-rose-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                  title="Delete Module"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setExpandedModule(expandedModule === module._id ? null : module._id)}
                                  className="p-1.5 text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg"
                                >
                                  {expandedModule === module._id ? <ChevronRight className="w-3.5 h-3.5 rotate-90" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {expandedModule === module._id && (
                              <div className="p-4 bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                {module.videos && module.videos.length > 0 ? (
                                  <div className="space-y-2">
                                    {module.videos.map((video, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="flex items-center gap-3">
                                          <BookOpen className="text-slate-400 w-4 h-4" />
                                          <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{video.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{video.duration} mins</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button 
                                            type="button" 
                                            onClick={() => openOrDownloadFile(video.url || video.videoUrl, video.title)} 
                                            className="text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer p-0"
                                          >
                                            Preview
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteVideo(module._id, video._id)}
                                            className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center text-slate-400 py-4 italic text-[11px]">No videos uploaded yet</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {courseTab === 'materials' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left Column: Materials List */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Materials ({courseMaterials.length})</h4>
                          {!showAddMaterialForm && (
                            <button
                              onClick={() => {
                                setEditingMaterial(null);
                                setMaterialForm({
                                  title: '',
                                  description: '',
                                  category: 'Notes',
                                  subject: selectedCourse.title,
                                  fileType: 'PDF',
                                  fileUrl: '',
                                  publicId: ''
                                });
                                setShowAddMaterialForm(true);
                              }}
                              className="px-2.5 py-1 bg-primary text-white font-bold text-[10px] rounded-lg shadow-sm"
                            >
                              + Add New
                            </button>
                          )}
                        </div>

                        {courseMaterials.length === 0 ? (
                          <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl">No study materials uploaded yet.</p>
                        ) : (
                          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                            {courseMaterials.map(mat => (
                              <div key={mat._id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{mat.title}</p>
                                    <p className="text-[10px] text-slate-505 line-clamp-2 mt-0.5">{mat.description}</p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handleEditMaterialClick(mat)}
                                      className="p-1 text-slate-650 hover:text-primary dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMaterial(mat._id)}
                                      className="p-1 text-red-500 hover:text-red-750 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-slate-405 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                                  <span className="font-semibold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full">{mat.category}</span>
                                  <button type="button" onClick={() => openOrDownloadFile(mat.fileUrl || mat.url, mat.title)} className="text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer text-xs p-0">Open File</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Form */}
                      <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-4">
                        {!showAddMaterialForm ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                            <BookOpen className="w-12 h-12 text-slate-350 mb-2" />
                            <p className="text-xs font-semibold">Select a material to edit, or click '+ Add New' to upload resources.</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitMaterial} className="space-y-4">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                              {editingMaterial ? 'Edit Material' : 'Upload Study Material'}
                            </h4>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Title *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Chapter 1 Accounting Principles"
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                              <textarea
                                placeholder="Provide details of the topic or contents..."
                                value={materialForm.description}
                                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs h-16"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                                <select
                                  value={materialForm.category}
                                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold"
                                >
                                  <option value="Notes">Notes</option>
                                  <option value="Practice Questions">Practice Questions</option>
                                  <option value="Mock Tests">Mock Tests</option>
                                  <option value="Previous Papers">Previous Papers</option>
                                  <option value="Reference Books">Reference Books</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                                <input
                                  type="text"
                                  required
                                  value={materialForm.subject}
                                  onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Resource File (PDF/Docs/ZIP)</label>
                              <FileUpload
                                onChange={handleMaterialFileUpload}
                                multiple={false}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                                maxSize={15 * 1024 * 1024}
                                disabled={uploadingMaterialFile}
                                uploading={uploadingMaterialFile}
                                files={materialForm.fileUrl ? [{ name: materialForm.title || 'Uploaded File', url: materialForm.fileUrl }] : []}
                                onRemove={() => setMaterialForm(prev => ({ ...prev, fileUrl: '', publicId: '', fileType: '' }))}
                                dragLabel="Drag & drop study material here, or click to browse"
                                acceptLabel="Supports PDF, Word, Excel, or ZIP files up to 15MB"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Or Paste External Resource URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/notes.pdf"
                                value={materialForm.fileUrl}
                                onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value, publicId: '' })}
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                              />
                            </div>

                            <div className="flex gap-3 justify-end pt-3">
                              <button
                                type="button"
                                onClick={() => { setShowAddMaterialForm(false); setEditingMaterial(null); }}
                                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-650 text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={uploadingMaterialFile}
                                className="px-4 py-1.5 bg-primary text-white font-semibold text-xs rounded-xl shadow-sm"
                              >
                                {editingMaterial ? 'Update' : 'Upload Material'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {courseTab === 'assignments' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Assignments ({assignments.filter(a => a.courseId === selectedCourse._id || a.courseId?._id === selectedCourse._id).length})</h3>
                      <button
                        onClick={() => {
                          setAssignmentForm({
                            title: '',
                            description: '',
                            dueDate: '',
                            courseId: selectedCourse._id,
                            batchId: selectedBatch._id
                          });
                          setShowAssignmentModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Assignment
                      </button>
                    </div>

                    {assignments.filter(a => a.courseId === selectedCourse._id || a.courseId?._id === selectedCourse._id).length === 0 ? (
                      <p className="text-slate-500 text-xs py-8 text-center">No assignments published for this course.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {assignments.filter(a => a.courseId === selectedCourse._id || a.courseId?._id === selectedCourse._id).map(assignment => (
                          <div key={assignment._id} className="py-4 flex justify-between items-center gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{assignment.title}</p>
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-red-400" /> Due: {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleViewSubmissions(assignment)}
                              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                            >
                              Submissions
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {courseTab === 'quizzes' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Quizzes & Tests ({quizzes.filter(q => q.courseId === selectedCourse._id || q.courseId?._id === selectedCourse._id).length})</h3>
                      <button
                        onClick={() => {
                          setQuizForm({
                            title: '',
                            description: '',
                            courseId: selectedCourse._id,
                            batchId: selectedBatch._id,
                            dueDate: '',
                            duration: 30,
                            questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }]
                          });
                          setShowQuizModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Quiz
                      </button>
                    </div>

                    {quizzes.filter(q => q.courseId === selectedCourse._id || q.courseId?._id === selectedCourse._id).length === 0 ? (
                      <p className="text-slate-500 text-xs py-8 text-center">No quizzes published for this course.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {quizzes.filter(q => q.courseId === selectedCourse._id || q.courseId?._id === selectedCourse._id).map(quiz => (
                          <div key={quiz._id} className="py-4 flex justify-between items-center gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{quiz.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Questions: {quiz.questions?.length} • Duration: {quiz.duration} mins</p>
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-red-400" /> Deadline: {new Date(quiz.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleViewAttempts(quiz)}
                              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                            >
                              View Results
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {courseTab === 'attendance' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/60 pb-5">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-display">Attendance Tracker</h3>
                        <p className="text-xs text-slate-500 mt-1">Mark attendance for General or Course lectures.</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-1">Date</label>
                          <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => {
                              setAttendanceDate(e.target.value);
                              fetchAttendanceList(selectedBatch._id, selectedCourse._id, e.target.value);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold text-slate-700 dark:text-slate-205"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        className="px-4 py-2 max-w-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markAllAttendance('present')}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-lg transition-all border border-emerald-500/20"
                        >
                          All Present
                        </button>
                        <button
                          type="button"
                          onClick={() => markAllAttendance('absent')}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 font-bold text-[10px] rounded-lg transition-all border border-rose-500/20"
                        >
                          All Absent
                        </button>
                      </div>
                    </div>

                    {attendanceLoading ? (
                      <div className="flex flex-col justify-center items-center py-12 gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <p className="text-xs text-slate-500">Loading student attendance...</p>
                      </div>
                    ) : attendanceList.length === 0 ? (
                      <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No students enrolled in this batch to mark attendance.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3 text-center">Attendance Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                              {attendanceList
                                .filter(s => 
                                  s.name?.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                                  s.email?.toLowerCase().includes(attendanceSearch.toLowerCase())
                                )
                                .map(student => (
                                  <tr key={student.studentId} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">{student.name}</td>
                                    <td className="px-4 py-3.5 text-slate-500 font-normal">{student.email}</td>
                                    <td className="px-4 py-3.5">
                                      <div className="flex justify-center items-center gap-1.5">
                                        {[
                                          { value: 'present', label: 'Present', color: 'bg-emerald-500 text-white', activeBorder: 'border-emerald-500', inactive: 'text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/15' },
                                          { value: 'absent', label: 'Absent', color: 'bg-rose-500 text-white', activeBorder: 'border-rose-500', inactive: 'text-rose-500 bg-rose-500/5 hover:bg-rose-500/15' },
                                          { value: 'late', label: 'Late', color: 'bg-amber-500 text-white', activeBorder: 'border-amber-500', inactive: 'text-amber-500 bg-amber-500/5 hover:bg-amber-500/15' },
                                          { value: 'leave', label: 'Leave', color: 'bg-blue-500 text-white', activeBorder: 'border-blue-500', inactive: 'text-blue-500 bg-blue-500/5 hover:bg-blue-500/15' },
                                        ].map(opt => {
                                          const isSelected = student.status === opt.value;
                                          return (
                                            <button
                                              key={opt.value}
                                              type="button"
                                              onClick={() => updateStudentAttendanceStatus(student.studentId, opt.value)}
                                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                isSelected 
                                                  ? `${opt.color} ${opt.activeBorder} shadow-sm` 
                                                  : `${opt.inactive} border-slate-100 dark:border-slate-800`
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={handleAttendanceSubmit}
                            disabled={attendanceSaving}
                            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {attendanceSaving ? 'Saving Attendance...' : 'Save Attendance Records'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Normal Tab Views (only students, courses) */
              <>
                {/* STUDENTS TAB */}
                {activeTab === 'students' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Enrolled Students ({selectedBatch.students?.length || 0})</h3>
                      {isBatchManager && (
                        <button
                          onClick={openEnrollmentModal}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Enroll Students
                        </button>
                      )}
                    </div>
                    {selectedBatch.students?.length === 0 ? (
                      <p className="text-slate-500 text-xs py-8 text-center">No students currently enrolled in this batch.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedBatch.students.map(student => (
                          <div key={student._id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{student.email}</p>
                            </div>
                            <span className="text-[10px] text-slate-400">{student.phone || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* COURSES TAB */}
                {activeTab === 'courses' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Batch Courses ({selectedBatch.courses?.length || 0})</h3>
                      <button
                        onClick={() => setShowCourseModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Course inside Batch
                      </button>
                    </div>

                    {selectedBatch.courses?.length === 0 ? (
                      <p className="text-slate-500 text-xs py-8 text-center">No courses currently associated with this batch.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedBatch.courses.map(course => (
                          <div key={course._id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/30 flex flex-col justify-between h-40">
                            <div className="flex gap-3">
                              <img 
                                src={course.thumbnail?.url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop'} 
                                alt={course.title}
                                className="w-14 h-14 object-cover rounded-lg bg-slate-200 animate-fade-in"
                              />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">{course.title}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{course.category} • {course.level}</p>
                              </div>
                            </div>
                             <div className="mt-4">
                               <button
                                 onClick={() => handleOpenCourse(course)}
                                 className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                               >
                                 <ExternalLink className="w-4 h-4" /> Open Course Portal
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Create Course inside Batch</h3>
              <button onClick={() => setShowCourseModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accounts Chapter 4 Mastery"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  placeholder="Course concepts covered, expectations..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  >
                    <option value="CA Foundation">CA Foundation</option>
                    <option value="CA Intermediate">CA Intermediate</option>
                    <option value="CA Final">CA Final</option>
                    <option value="Programming">Programming</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</label>
                  <input
                    type="text"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Publish Assignment</h3>
              <button onClick={() => setShowAssignmentModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course</label>
                <input
                  type="text"
                  disabled
                  value={selectedCourse?.title || ''}
                  className="w-full px-4 py-2 rounded-xl bg-slate-150 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 outline-none text-xs font-semibold text-slate-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Practice Homework"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instructions</label>
                <textarea
                  required
                  placeholder="Explain submission instructions, files to upload, etc."
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs h-24"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Submissions: {selectedAssignment?.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Grade student homework submissions</p>
              </div>
              <button onClick={() => { setShowSubmissionsModal(false); setSelectedSubmission(null); }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Submissions List */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Submissions ({submissions.length})</h4>
                {submissions.length === 0 ? (
                  <p className="text-slate-500 text-xs py-8 text-center">No submissions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map(sub => (
                      <div 
                        key={sub._id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradingForm({ 
                            submissionId: sub._id, 
                            grade: sub.grade || '', 
                            feedback: sub.feedback || '',
                            status: sub.status || 'graded'
                          });
                        }}
                        className={`p-3 border rounded-xl cursor-pointer transition-all ${
                          gradingForm.submissionId === sub._id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{sub.studentId?.name}</p>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600' :
                            sub.status === 'returned' ? 'bg-amber-500/10 text-amber-600' :
                            sub.status === 'late' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'
                          }`}>{sub.status}</span>
                        </div>
                        {sub.content && (
                          <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">"{sub.content}"</p>
                        )}
                        <p className="text-[9px] text-slate-400 mt-2">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Grading Form */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-4 space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Evaluation & Grading</h4>
                {!gradingForm.submissionId ? (
                  <p className="text-slate-500 text-xs py-12 text-center">Select a submission from the list to start grading.</p>
                ) : (
                  <div className="space-y-4">
                    {/* View submission details */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Student Notes</span>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{selectedSubmission?.content || 'No text/notes provided.'}</p>
                      </div>

                      {selectedSubmission?.attachments && selectedSubmission.attachments.length > 0 && (
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Attached Files</span>
                          <div className="flex flex-col gap-1.5">
                            {selectedSubmission.attachments.map((att, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => openOrDownloadFile(att.url, att.title)}
                                className="inline-flex items-center gap-1.5 text-primary hover:underline bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="truncate">{att.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleGradeSubmission} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Status</label>
                        <select
                          value={gradingForm.status || 'graded'}
                          onChange={(e) => setGradingForm({ ...gradingForm, status: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold"
                        >
                          <option value="graded">Grade & Mark Completed</option>
                          <option value="returned">Return to Student (Request Revision)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grade / Score *</label>
                        <input
                          type="text"
                          required={gradingForm.status === 'graded'}
                          placeholder="e.g. A+, 95/100, Excellent"
                          value={gradingForm.grade}
                          onChange={(e) => setGradingForm({ ...gradingForm, grade: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Feedback comments</label>
                        <textarea
                          placeholder="Provide student feedback on where they can improve..."
                          value={gradingForm.feedback}
                          onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs h-24"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Evaluation
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Create New Quiz</h3>
              <button onClick={() => {
                setShowQuizModal(false);
                setExtractedQuestions([]);
                setSelectedQuestionsForQuiz([]);
                setQuizCreationMode('manual');
              }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {/* Mode Select Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-2 gap-2">
              <button
                type="button"
                onClick={() => setQuizCreationMode('manual')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  quizCreationMode === 'manual' 
                    ? 'bg-primary text-white' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Manual Input
              </button>
              <button
                type="button"
                onClick={() => setQuizCreationMode('pdf')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  quizCreationMode === 'pdf' 
                    ? 'bg-primary text-white' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                AI PDF Extraction
              </button>
            </div>
            
            <form onSubmit={handleCreateQuiz} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Quiz Metadata (Shared for both modes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course</label>
                  <input
                    type="text"
                    disabled
                    value={selectedCourse?.title || ''}
                    className="w-full px-4 py-2 rounded-xl bg-slate-150 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 outline-none text-xs font-semibold text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quiz Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Accounts Chapter 4 Quick Test"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    value={quizForm.duration}
                    onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={quizForm.dueDate}
                    onChange={(e) => setQuizForm({ ...quizForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  />
                </div>
                {quizCreationMode === 'pdf' && extractedQuestions.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max Questions to Use</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={extractedQuestions.length}
                      value={numQuestionsToUse}
                      onChange={(e) => setNumQuestionsToUse(parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ────────────────── MANUAL QUIZ FORM ────────────────── */}
              {quizCreationMode === 'manual' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Questions</h4>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>

                  {quizForm.questions.map((quest, qIdx) => (
                    <div key={qIdx} className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl space-y-3 relative">
                      {quizForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="absolute right-3 top-3 text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Question {qIdx + 1}</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. What is the basic rule of Debit and Credit?"
                          value={quest.questionText}
                          onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {quest.options.map((opt, optIdx) => (
                          <div key={optIdx} className="space-y-1">
                            <label className="text-[9px] font-semibold text-slate-400">Option {optIdx + 1}</label>
                            <input
                              type="text"
                              required
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Correct Option Index</label>
                          <select
                            value={quest.correctOptionIndex}
                            onChange={(e) => handleQuestionChange(qIdx, 'correctOptionIndex', parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                          >
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            <option value={2}>Option 3</option>
                            <option value={3}>Option 4</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Points / Weight</label>
                          <input
                            type="number"
                            value={quest.points}
                            onChange={(e) => handleQuestionChange(qIdx, 'points', parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ────────────────── AI PDF QUIZ FORM ────────────────── */}
              {quizCreationMode === 'pdf' && (
                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {extractedQuestions.length === 0 ? (
                    /* PDF Uploader Screen */
                    <div className="space-y-4">
                      <FileUpload
                        onChange={handlePdfUpload}
                        multiple={false}
                        accept="application/pdf"
                        maxSize={20 * 1024 * 1024}
                        disabled={extractingPdf}
                        uploading={extractingPdf}
                        files={[]}
                        dragLabel="Drag & drop quiz question sheet PDF here, or click to browse"
                        acceptLabel="Supports single PDF document up to 20MB"
                      />
                    </div>
                  ) : (
                    /* Extracted Questions Preview & Editing Panel */
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20">
                        <span className="text-[10px] font-bold text-primary uppercase">Extracted Questions ({extractedQuestions.length})</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setExtractedQuestions([]);
                            setSelectedQuestionsForQuiz([]);
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-bold"
                        >
                          Clear & Upload New PDF
                        </button>
                      </div>

                      {/* Extracted Questions List */}
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                        {extractedQuestions.map((quest, qIdx) => {
                          const isSelected = selectedQuestionsForQuiz.includes(qIdx);
                          return (
                            <div key={qIdx} className={`p-4 border rounded-2xl space-y-3 relative transition-all ${
                              isSelected 
                                ? 'border-violet-500/30 bg-violet-500/5 dark:bg-violet-500/5' 
                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/20 opacity-70'
                            }`}>
                              
                              {/* Selection checkbox and delete button */}
                              <div className="absolute right-3 top-3 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleQuestionSelection(qIdx)}
                                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExtractedQuestion(qIdx)}
                                  className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Question {qIdx + 1}</span>
                                <input
                                  type="text"
                                  required
                                  value={quest.questionText}
                                  onChange={(e) => handleExtractedQuestionChange(qIdx, 'questionText', e.target.value)}
                                  className="w-full pr-14 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {quest.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="space-y-1">
                                    <label className="text-[9px] font-semibold text-slate-400">Option {optIdx + 1}</label>
                                    <input
                                      type="text"
                                      required
                                      value={opt}
                                      onChange={(e) => handleExtractedOptionChange(qIdx, optIdx, e.target.value)}
                                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">Correct Option Index</label>
                                  <select
                                    value={quest.correctOptionIndex}
                                    onChange={(e) => handleExtractedQuestionChange(qIdx, 'correctOptionIndex', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                                  >
                                    <option value={0}>Option 1</option>
                                    <option value={1}>Option 2</option>
                                    <option value={2}>Option 3</option>
                                    <option value={3}>Option 4</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">Points / Weight</label>
                                  <input
                                    type="number"
                                    value={quest.points}
                                    onChange={(e) => handleExtractedQuestionChange(qIdx, 'points', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuizModal(false);
                    setExtractedQuestions([]);
                    setSelectedQuestionsForQuiz([]);
                    setQuizCreationMode('manual');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                {(quizCreationMode === 'manual' || extractedQuestions.length > 0) && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl"
                  >
                    Publish Quiz
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attempts Modal */}
      {showAttemptsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Quiz Results: {selectedQuiz?.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">View scores and completion statuses</p>
              </div>
              <button onClick={() => setShowAttemptsModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {attempts.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center">No student has attempted this quiz yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2.5">Student Name</th>
                        <th className="py-2.5">Email</th>
                        <th className="py-2.5">Score</th>
                        <th className="py-2.5">Percentage</th>
                        <th className="py-2.5">Date Attempted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                      {attempts.map(att => {
                        const pct = Math.round((att.score / att.totalPoints) * 100);
                        return (
                          <tr key={att._id}>
                            <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{att.studentId?.name}</td>
                            <td className="py-3 text-slate-500">{att.studentId?.email}</td>
                            <td className="py-3">{att.score} / {att.totalPoints}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full font-extrabold ${
                                pct >= 80 ? 'bg-emerald-500/10 text-emerald-600' : pct >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'
                              }`}>{pct}%</span>
                            </td>
                            <td className="py-3 text-slate-400">{new Date(att.submittedAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Manage Student Enrollment</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Select students to enroll in {selectedBatch?.name}</p>
              </div>
              <button onClick={() => setShowEnrollmentModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs"
              />
            </div>

            <div className="p-6 overflow-y-auto flex-1 max-h-[50vh] space-y-2">
              {allStudents
                .filter(student => 
                  student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  student.email.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map(student => {
                  const isSelected = enrolledStudentIds.includes(student._id);
                  return (
                    <div 
                      key={student._id}
                      onClick={() => toggleStudentEnrollment(student._id)}
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-400' 
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{student.email}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled via wrapper div click
                        className="rounded border-slate-300 text-violet-500 focus:ring-violet-500 h-4 w-4"
                      />
                    </div>
                  );
                })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-3 justify-end bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setShowEnrollmentModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                disabled={savingEnrollment}
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollmentSubmit}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl"
                disabled={savingEnrollment}
              >
                {savingEnrollment ? 'Saving changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Study Materials Modal */}
      {showMaterialsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Study Materials: {selectedCourseForMaterials?.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload and manage study materials for this course and batch</p>
              </div>
              <button onClick={() => { setShowMaterialsModal(false); setShowAddMaterialForm(false); }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Materials List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">Materials ({courseMaterials.length})</h4>
                  {!showAddMaterialForm && (
                    <button
                      onClick={() => {
                        setEditingMaterial(null);
                        setMaterialForm({
                          title: '',
                          description: '',
                          category: 'Notes',
                          subject: 'Accounting',
                          fileType: 'PDF',
                          fileUrl: '',
                          publicId: ''
                        });
                        setShowAddMaterialForm(true);
                      }}
                      className="px-2.5 py-1 bg-primary text-white font-bold text-[10px] rounded-lg shadow-sm"
                    >
                      + Add New
                    </button>
                  )}
                </div>

                {courseMaterials.length === 0 ? (
                  <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl">No study materials uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {courseMaterials.map(mat => (
                      <div key={mat._id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{mat.title}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{mat.description}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditMaterialClick(mat)}
                              className="p-1 text-slate-600 hover:text-primary dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(mat._id)}
                              className="p-1 text-red-500 hover:text-red-700 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                          <span className="font-semibold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full">{mat.category}</span>
                          <button type="button" onClick={() => openOrDownloadFile(mat.fileUrl || mat.url, mat.title)} className="text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer text-xs p-0">Open File</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Add/Edit Form */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-4">
                {!showAddMaterialForm ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                    <BookOpen className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Select a material to edit, or click '+ Add New' to upload resources.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitMaterial} className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                      {editingMaterial ? 'Edit Material' : 'Upload Study Material'}
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chapter 1 Accounting Principles"
                        value={materialForm.title}
                        onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                      <textarea
                        placeholder="Provide details of the topic or contents..."
                        value={materialForm.description}
                        onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs h-16"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                        <select
                          value={materialForm.category}
                          onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold"
                        >
                          <option value="Notes">Notes</option>
                          <option value="Practice Questions">Practice Questions</option>
                          <option value="Mock Tests">Mock Tests</option>
                          <option value="Previous Papers">Previous Papers</option>
                          <option value="Reference Books">Reference Books</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                        <select
                          value={materialForm.subject}
                          onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs font-semibold"
                        >
                          <option value="Accounting">Accounting</option>
                          <option value="Taxation">Taxation</option>
                          <option value="Auditing">Auditing</option>
                          <option value="Law">Law</option>
                          <option value="Costing">Costing</option>
                          <option value="Financial Management">Financial Management</option>
                        </select>
                      </div>
                    </div>

                     {/* File Upload Section */}
                     <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Resource File (PDF/Docs/ZIP)</label>
                       <FileUpload
                         onChange={handleMaterialFileUpload}
                         multiple={false}
                         accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                         maxSize={15 * 1024 * 1024}
                         disabled={uploadingMaterialFile}
                         uploading={uploadingMaterialFile}
                         files={materialForm.fileUrl ? [{ name: materialForm.title || 'Uploaded File', url: materialForm.fileUrl }] : []}
                         onRemove={() => setMaterialForm(prev => ({ ...prev, fileUrl: '', publicId: '', fileType: '' }))}
                         dragLabel="Drag & drop study material here, or click to browse"
                         acceptLabel="Supports PDF, Word, Excel, or ZIP files up to 15MB"
                       />
                     </div>

                    {/* Or File URL Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Or Paste External Resource URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com/notes.pdf"
                        value={materialForm.fileUrl}
                        onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value, publicId: '' })}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => { setShowAddMaterialForm(false); setEditingMaterial(null); }}
                        className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingMaterialFile}
                        className="px-4 py-1.5 bg-primary text-white font-semibold text-xs rounded-xl shadow-sm"
                      >
                        {editingMaterial ? 'Update' : 'Upload Material'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-4">Add New Module</h3>
            <form onSubmit={handleAddModule}>
              <div className="mb-4 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module Title</label>
                <input 
                  type="text" 
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  placeholder="e.g. Introduction to CA Foundation"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm">Save Module</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-4">Upload Video Lecture</h3>
            <form onSubmit={handleUploadVideoSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Video Title</label>
                <input 
                  type="text" 
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  placeholder="e.g. Double Entry System Overview"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration (minutes)</label>
                <input 
                  type="text" 
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  placeholder="e.g. 45"
                  required
                />
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Video File</label>
                <FileUpload
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  multiple={false}
                  accept="video/*"
                  maxSize={100 * 1024 * 1024}
                  disabled={uploadingVideo}
                  uploading={uploadingVideo}
                  progress={videoUploadProgress}
                  files={videoFile ? [videoFile] : []}
                  onRemove={() => setVideoFile(null)}
                  dragLabel="Drag & drop video file here, or click to browse"
                  acceptLabel="Supports MP4, WebM, and other video formats up to 100MB"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowVideoModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 text-xs font-bold" disabled={uploadingVideo}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm" disabled={uploadingVideo}>
                  {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherBatches;
