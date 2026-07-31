import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Course APIs
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getCategories: () => api.get('/courses/categories')
};

// Student APIs
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getMyCourses: () => api.get('/student/my-courses'),
  getCourseContent: (id) => api.get(`/student/course/${id}/content`),
  markVideoComplete: (videoId, courseId) => api.post(`/student/video/${videoId}/complete`, { courseId }),
  checkEnrollment: (courseId) => api.get(`/student/enrollment-status/${courseId}`),
  getNotifications: () => api.get('/student/notifications'),
  markNotificationsRead: (notificationIds) => api.put('/student/notifications/mark-read', { notificationIds }),
  getLiveClasses: () => api.get('/student/live-classes'),
  joinLiveClass: (id) => api.post(`/student/live-classes/${id}/join`),
  leaveLiveClass: (id) => api.post(`/student/live-classes/${id}/leave`)
};


// Payment APIs
export const paymentAPI = {
  createManualPayment: (data) => api.post('/payment/manual-payment', data),
  getHistory: () => api.get('/payment/history')
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Courses
  getAllCourses: () => api.get('/courses'),
  createCourse: (data) => api.post('/admin/courses', data),
  getCourseContent: (id) => api.get(`/admin/courses/${id}/content`),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  
  // Modules
  addModule: (courseId, data) => api.post(`/admin/courses/${courseId}/modules`, data),
  updateModule: (id, data) => api.put(`/admin/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/admin/modules/${id}`),
  
  // Videos and Notes
  addVideo: (moduleId, data) => api.post(`/admin/modules/${moduleId}/videos`, data),
  deleteVideo: (moduleId, videoId) => api.delete(`/admin/modules/${moduleId}/videos/${videoId}`),
  addNote: (moduleId, data) => api.post(`/admin/modules/${moduleId}/notes`, data),
  deleteNote: (moduleId, noteId) => api.delete(`/admin/modules/${moduleId}/notes/${noteId}`),
  
  // Students
  getStudents: () => api.get('/admin/students'),
  
  // Hero Section
  getHeroSection: () => api.get('/admin/hero-section'),
  updateHeroSection: (data) => api.put('/admin/hero-section', data),
  
  // Faculty
  getAllFaculty: () => api.get('/faculty'),
  createFaculty: (data) => api.post('/faculty', data),
  updateFaculty: (id, data) => api.put(`/faculty/${id}`, data),
  deleteFaculty: (id) => api.delete(`/faculty/${id}`),
  
  // Study Materials
  getAllStudyMaterials: () => api.get('/study-materials'),
  createStudyMaterial: (data) => api.post('/study-materials', data),
  updateStudyMaterial: (id, data) => api.put(`/study-materials/${id}`, data),
  deleteStudyMaterial: (id) => api.delete(`/study-materials/${id}`),
  
  // Payments
  getPendingPayments: () => api.get('/admin/payments/pending'),
  verifyPayment: (id, data) => api.put(`/admin/payments/${id}/verify`, data),

  // Live Classes
  getLiveClasses: () => api.get('/admin/live-classes'),
  createLiveClass: (data) => api.post('/admin/live-classes', data),
  updateLiveClassStatus: (id, statusData) => api.patch(`/admin/live-classes/${id}/status`, statusData),
  deleteLiveClass: (id) => api.delete(`/admin/live-classes/${id}`),

  // Permissions
  getAllPermissions: () => api.get('/approvals/admin/permissions'),
  updatePermissions: (role, data) => api.put(`/approvals/admin/permissions/${role}`, data),

  // Approvals
  getApprovalRequests: (filter) => api.get(`/approvals/requests?status=${filter}`),
  handleApproval: (id, data) => api.put(`/approvals/${id}`, data),

  // Notification management
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  getUserNotifications: () => api.get('/admin/user-notifications'),
  sendNotification: (data) => api.post('/admin/notifications', data),
  markNotificationsRead: (notificationIds) => api.put('/admin/notifications/mark-read', { notificationIds })
};

// Parent APIs
export const parentAPI = {
  getDashboard: () => api.get('/parent/dashboard'),
  getProgress: () => api.get('/parent/progress'),
  getAttendance: () => api.get('/parent/attendance'),
  getCourses: () => api.get('/parent/courses'),
  getNotifications: () => api.get('/parent/notifications'),
  markNotificationsRead: (notificationIds) => api.put('/parent/notifications/mark-read', { notificationIds }),
  getLiveClasses: () => api.get('/parent/live-classes')
};

// Teacher APIs
export const teacherAPI = {
  getCourses: () => api.get('/teacher/courses'),
  getStudents: () => api.get('/teacher/students'),
  getLiveClasses: () => api.get('/teacher/live-classes'),
  createLiveClass: (data) => api.post('/teacher/live-classes', data),
  updateLiveClassStatus: (id, statusData) => api.patch(`/teacher/live-classes/${id}/status`, statusData),
  deleteLiveClass: (id) => api.delete(`/teacher/live-classes/${id}`),

  // Course content management
  getCourseContent: (id) => api.get(`/teacher/courses/${id}/content`),
  addModule: (courseId, data) => api.post(`/teacher/courses/${courseId}/modules`, data),
  updateModule: (id, data) => api.put(`/teacher/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/teacher/modules/${id}`),
  addVideo: (moduleId, data) => api.post(`/teacher/modules/${moduleId}/videos`, data),
  deleteVideo: (moduleId, videoId) => api.delete(`/teacher/modules/${moduleId}/videos/${videoId}`),
  addNote: (moduleId, data) => api.post(`/teacher/modules/${moduleId}/notes`, data),
  deleteNote: (moduleId, noteId) => api.delete(`/teacher/modules/${moduleId}/notes/${noteId}`),

  // Notification management (course-scoped)
  getNotifications: (params) => api.get('/teacher/notifications', { params }),
  getUserNotifications: () => api.get('/teacher/user-notifications'),
  sendNotification: (data) => api.post('/teacher/notifications', data),
  markNotificationsRead: (notificationIds) => api.put('/teacher/notifications/mark-read', { notificationIds })
};

// Faculty APIs
export const facultyAPI = {
  getAll: () => api.get('/faculty')
};

// Study Material APIs
export const studyMaterialAPI = {
  getAll: (params) => api.get('/study-materials', { params }),
  download: (id) => api.post(`/study-materials/${id}/download`)
};

// Progress APIs
export const progressAPI = {
  getMyProgress: () => api.get('/progress'),
  getCourseProgress: (courseId) => api.get(`/progress/${courseId}`)
};

// Chatbot APIs
export const chatbotAPI = {
  getContext: () => api.get('/context'),
  sendMessage: (message, userId, history = []) =>
    api.post('/chat', {
      user_id: userId,
      message,
      question: message,
      history
    })
};

// Batch APIs
export const batchAPI = {
  create: (data) => api.post('/batches', data),
  getAll: () => api.get('/batches'),
  getById: (id) => api.get(`/batches/${id}`),
  update: (id, data) => api.put(`/batches/${id}`, data),
  delete: (id) => api.delete(`/batches/${id}`),
  getUsersList: () => api.get('/batches/users/list'),
  createCourseInBatch: (batchId, data) => api.post(`/batches/${batchId}/courses`, data),
  manageBatchStudents: (batchId, studentIds) => api.post(`/batches/${batchId}/students`, { students: studentIds }),
  createAssignment: (data) => api.post('/batches/assignments', data),
  getAssignments: (batchId) => api.get(`/batches/${batchId}/assignments`),
  submitAssignment: (assignmentId, data) => api.post(`/batches/assignments/${assignmentId}/submit`, data),
  getSubmissions: (assignmentId) => api.get(`/batches/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, data) => api.post(`/batches/assignments/submissions/${submissionId}/grade`, data),
  createQuiz: (data) => api.post('/batches/quizzes', data),
  getQuizzes: (batchId) => api.get(`/batches/${batchId}/quizzes`),
  attemptQuiz: (quizId, data) => api.post(`/batches/quizzes/${quizId}/attempt`, data),
  getAttempts: (quizId) => api.get(`/batches/quizzes/${quizId}/attempts`),
  getStudentBatch: () => api.get('/batches/student/my-batch'),
  getParentStudentProgress: (studentId) => api.get(`/batches/parent/student-progress/${studentId}`),
  submitAttendance: (batchId, data) => api.post(`/batches/${batchId}/attendance`, data),
  getBatchAttendance: (batchId, params) => api.get(`/batches/${batchId}/attendance`, { params }),
  getStudentAttendance: () => api.get('/batches/student/attendance')
};

export const feeAPI = {
  getActiveSession: () => api.get('/v1/fees/sessions/active'),
  getHeads: () => api.get('/v1/fees/heads'),
  createHead: (data) => api.post('/v1/fees/heads', data),
  createStructure: (data) => api.post('/v1/fees/structures', data),
  getStructures: () => api.get('/v1/fees/structures'),
  deleteStructure: (id) => api.delete(`/v1/fees/structures/${id}`),
  getLedgers: (params) => api.get('/v1/fees/ledgers', { params }),
  adjustLedgerItem: (ledgerId, data) => api.put(`/v1/fees/ledgers/${ledgerId}`, data),
  createPaymentOrder: (data) => api.post('/v1/fees/payment/create-order', data),
  verifyPayment: (data) => api.post('/v1/fees/payment/verify', data)
};

export const assessmentAPI = {
  create: (data) => api.post('/batches/assessments', data),
  getBatchAssessments: (batchId, params) => api.get(`/batches/${batchId}/assessments`, { params }),
  attempt: (assessmentId, data) => api.post(`/batches/assessments/${assessmentId}/attempt`, data),
  submitScores: (examId, data) => api.post(`/batches/assessments/${examId}/scores`, data),
  getScores: (examId) => api.get(`/batches/assessments/${examId}/scores`),
  getStudentResults: () => api.get('/batches/student/results'),
  getParentStudentResults: (studentId) => api.get(`/batches/parent/results/${studentId}`),

  getDashboard: (studentId) => api.get(`/assessment/dashboard/${studentId}`),
  generateAssessment: (data) => api.post('/assessment/generate', data),
  submitAssessment: (data) => api.post('/assessment/submit', data),
  getHistory: (studentId) => api.get(`/assessment/history/${studentId}`)
};

export const aiAssessmentAPI = {
  getDashboard: (studentId) => api.get(`/assessment/dashboard/${studentId}`),
  generateAssessment: (data) => api.post('/assessment/generate', data),
  submitAssessment: (data) => api.post('/assessment/submit', data),
  getHistory: (studentId) => api.get(`/assessment/history/${studentId}`)
};

export default api;
