import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { 
  BookOpen, ClipboardList, Award, FolderOpen, Calendar, 
  CheckCircle2, AlertCircle, Clock, Send, FileText, X, 
  Paperclip, ChevronRight, HelpCircle, Download, CheckCircle
} from 'lucide-react';
import { studentAPI, batchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getFileUrl } from '../../lib/utils';
import Loading from '../../components/Loading';
import axios from 'axios';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Spinner } from '../../components/ui/Primitives';
import FileUpload from '../../components/ui/FileUpload';

const CourseContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lectures'); // 'lectures', 'materials', 'assignments', 'quizzes', 'attendance'
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Assignment Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    content: '',
    attachments: [{ title: 'Submission File', url: '' }]
  });
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Active Quiz attempt state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [attemptingQuiz, setAttemptingQuiz] = useState(false);

  useEffect(() => {
    fetchCourseContent();
  }, [id]);

  // Quiz Timer effect
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0 || quizComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(true); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft, quizComplete]);

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const res = await batchAPI.getStudentAttendance();
      if (res.data?.status === 'success') {
        const courseIdStr = id.toString();
        const courseRecord = res.data.data.find(rec => rec.courseId === courseIdStr || rec.courseId?._id === courseIdStr);
        setAttendance(courseRecord || { present: 0, absent: 0, late: 0, leave: 0, total: 0, percentage: 100 });
      }
    } catch (error) {
      console.error('Error fetching student attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      await Promise.all([
        (async () => {
          const response = await studentAPI.getCourseContent(id);
          const data = response.data?.data || {};
          setCourseData(data);
          if (data.modules && data.modules.length > 0 && data.modules[0].videos && data.modules[0].videos.length > 0) {
            setSelectedVideo(data.modules[0].videos[0]);
          } else {
            setSelectedVideo(null);
          }
        })(),
        fetchAttendance()
      ]);
    } catch (error) {
      console.error('Error fetching course content:', error);
      toast.error(error.response?.data?.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async (videoId) => {
    try {
      await studentAPI.markVideoComplete(videoId, id);
      toast.success('Video marked as complete');
      // Refresh to update progress
      const response = await studentAPI.getCourseContent(id);
      setCourseData(prev => ({
        ...prev,
        progress: response.data?.data?.progress,
        completedVideos: response.data?.data?.completedVideos
      }));
    } catch (error) {
      console.error('Error marking video complete:', error);
    }
  };

  // Assignment Handlers
  const handleOpenSubmitModal = (assignment) => {
    setSelectedAssignment(assignment);
    if (assignment.submission) {
      setSubmitForm({
        content: assignment.submission.content || '',
        attachments: assignment.submission.attachments && assignment.submission.attachments.length > 0 
          ? assignment.submission.attachments 
          : [{ title: 'Submission File', url: '' }]
      });
    } else {
      setSubmitForm({
        content: '',
        attachments: [{ title: 'Submission File', url: '' }]
      });
    }
    setShowSubmitModal(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);
    const loadingToast = toast.loading('Uploading files to Cloudinary...');

    try {
      const updatedAttachments = submitForm.attachments.filter(att => att.url.trim() !== '');
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/upload?folder=assignments`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (res.data.status === 'success') {
          updatedAttachments.push({
            title: file.name,
            url: res.data.data.url
          });
        }
      }
      
      setSubmitForm(prev => ({
        ...prev,
        attachments: updatedAttachments.length > 0 ? updatedAttachments : [{ title: 'Submission File', url: '' }]
      }));
      toast.dismiss(loadingToast);
      toast.success('Files uploaded successfully');
    } catch (err) {
      console.error('File upload error:', err);
      toast.dismiss(loadingToast);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (idx) => {
    setSubmitForm(prev => {
      const filtered = idx === -1 ? [] : prev.attachments.filter((_, i) => i !== idx);
      return {
        ...prev,
        attachments: filtered.length > 0 ? filtered : [{ title: 'Submission File', url: '' }]
      };
    });
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setSubmittingAssignment(true);
    
    try {
      const cleanAttachments = submitForm.attachments.filter(att => att.url && att.url.trim() !== '');
      const payload = {
        content: submitForm.content,
        attachments: cleanAttachments,
        submissionStatus: 'submitted'
      };
      
      await batchAPI.submitAssignment(selectedAssignment._id, payload);
      toast.success('Assignment submitted successfully!');
      setShowSubmitModal(false);
      fetchCourseContent(); // Refresh assignments list
    } catch (err) {
      console.error('Submit assignment error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Quiz Attempt Handlers
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setTimeLeft(quiz.duration * 60);
    setQuizComplete(false);
    setQuizScore(null);
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[qIdx] = optIdx;
      return updated;
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit && answers.some(ans => ans === null)) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    try {
      setAttemptingQuiz(true);
      const payload = {
        answers: answers.map(ans => ans === null ? -1 : ans)
      };

      const response = await batchAPI.attemptQuiz(activeQuiz._id, payload);
      const { attempt } = response.data.data;
      
      setQuizScore({
        score: attempt.score,
        totalPoints: attempt.totalPoints
      });
      setQuizComplete(true);
      toast.success(autoSubmit ? 'Time expired! Quiz submitted automatically.' : 'Quiz submitted successfully!');
      fetchCourseContent(); // Refresh quiz statuses
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      toast.error('Failed to submit quiz responses');
    } finally {
      setAttemptingQuiz(false);
    }
  };

  if (loading) return <Loading />;
  if (!courseData || !courseData.course) {
    return (
      <div className="p-8 text-center font-bold text-rose-500 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl max-w-lg mx-auto mt-20">
        Course content not found or you are not authorized to view it.
      </div>
    );
  }

  const completedVideos = courseData.completedVideos || [];
  const { course, modules, studyMaterials, assignments = [], quizzes = [] } = courseData;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Back and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/student/my-courses')} 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
            >
              <X className="w-3.5 h-3.5 rotate-45" /> Back to My Batch
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground leading-tight">
              {course.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 capitalize">Instructor: {course.instructor || 'Staff'} · Category: {course.category}</p>
          </div>
          
          {/* Progress Banner */}
          <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 w-full sm:w-64">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Progress</span>
                <span className="text-xs font-bold text-foreground">{courseData.progress || 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${courseData.progress || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {courseData.progress || 0}%
            </div>
          </div>
        </div>

        {/* LMS NAVIGATION TABS */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-px no-scrollbar">
          {[
            { id: 'lectures', label: 'Video Lectures', icon: BookOpen },
            { id: 'materials', label: 'Study Material', icon: FolderOpen },
            { id: 'assignments', label: 'Assignments', icon: ClipboardList },
            { id: 'quizzes', label: 'Quizzes & Tests', icon: Award },
            { id: 'attendance', label: 'Attendance', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="pt-2">
          
          {/* 1. LECTURES TAB */}
          {activeTab === 'lectures' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Player side */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card overflow-hidden">
                  {selectedVideo ? (
                    <div>
                      <div className="aspect-video bg-black relative">
                        <ReactPlayer
                          url={getFileUrl(selectedVideo.url)}
                          controls
                          width="100%"
                          height="100%"
                          onEnded={() => handleVideoComplete(selectedVideo._id)}
                        />
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-bold text-foreground mb-1 leading-snug">
                          {selectedVideo.title}
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedVideo.duration}</span>
                          {completedVideos.includes(selectedVideo._id) ? (
                            <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>
                          ) : (
                            <Button size="xs" variant="outline" className="h-6 text-[10px]" onClick={() => handleVideoComplete(selectedVideo._id)}>Mark Complete</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mb-3 opacity-60" />
                      <p className="text-sm font-semibold text-foreground">Select a lecture to start learning</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">Click on any video from the course content playlist on the right.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modules side */}
              <div className="lg:col-span-1">
                <Card className="max-h-[500px] overflow-y-auto no-scrollbar border-border">
                  <CardHeader className="pb-3 border-b border-border/60"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Course Playlist</CardTitle></CardHeader>
                  <CardContent className="p-3 space-y-4">
                    {!modules || modules.length === 0 ? (
                      <p className="text-muted-foreground text-xs py-8 text-center">No modules published yet.</p>
                    ) : (
                      modules.map((module, mIdx) => (
                        <div key={module._id} className="space-y-2">
                          <h4 className="font-bold text-xs text-foreground bg-accent/30 px-3 py-1.5 rounded-lg">
                            {mIdx + 1}. {module.title}
                          </h4>
                          <div className="space-y-1 pl-1">
                            {!module.videos || module.videos.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground p-2 italic text-center">No video lectures.</p>
                            ) : (
                              module.videos.map(video => {
                                const isSelected = selectedVideo?._id === video._id;
                                const isCompleted = completedVideos.includes(video._id);
                                return (
                                  <button
                                    key={video._id}
                                    onClick={() => setSelectedVideo(video)}
                                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                                      isSelected
                                        ? 'bg-primary/10 border border-primary/50 text-primary font-bold'
                                        : 'hover:bg-accent text-muted-foreground hover:text-foreground border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                      )}
                                      <span className="truncate">{video.title}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{video.duration}</span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* 2. STUDY MATERIAL TAB */}
          {activeTab === 'materials' && (
            <Card>
              <CardHeader><CardTitle>Study Materials</CardTitle></CardHeader>
              <CardContent className="p-6">
                {!studyMaterials || studyMaterials.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No materials uploaded</p>
                    <p className="text-xs text-muted-foreground mt-1">Study notes, files, and lectures for this course will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studyMaterials.map(material => (
                      <div key={material._id} className="p-4 border border-border rounded-2xl bg-card hover:shadow-card transition-all flex flex-col justify-between h-40">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{material.title}</h4>
                            <Badge variant="outline" className="text-[9px] shrink-0 font-extrabold uppercase">{material.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{material.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-3">
                          <span className="text-[10px] text-muted-foreground font-semibold">Format: {material.fileType || 'PDF'}</span>
                          <a
                            href={material.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3. ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && (
            <Card>
              <CardHeader><CardTitle>Course Assignments</CardTitle></CardHeader>
              <CardContent className="p-0">
                {assignments.length === 0 ? (
                  <div className="text-center py-16">
                    <ClipboardList className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No assignments assigned</p>
                    <p className="text-xs text-muted-foreground mt-1">All course homework and assignments will be listed here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Instructions</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map(ass => {
                        const isSubmitted = ass.submission;
                        const isGraded = ass.submission?.status === 'graded';
                        return (
                          <TableRow key={ass._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-bold text-foreground text-sm">{ass.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{ass.description}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(ass.dueDate).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  isGraded ? 'success' : 
                                  isSubmitted ? 'primary' : 
                                  (new Date() > new Date(ass.dueDate) ? 'destructive' : 'warning')
                                } 
                                className="capitalize"
                              >
                                {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : (new Date() > new Date(ass.dueDate) ? 'Overdue' : 'Pending')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-bold text-foreground">{isGraded ? ass.submission.grade : '—'}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="xs" 
                                variant={isSubmitted ? 'outline' : 'default'}
                                onClick={() => handleOpenSubmitModal(ass)}
                              >
                                {isSubmitted ? 'Review' : 'Submit'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. QUIZZES TAB */}
          {activeTab === 'quizzes' && (
            <Card>
              <CardHeader><CardTitle>Quizzes & Tests</CardTitle></CardHeader>
              <CardContent className="p-0">
                {quizzes.length === 0 ? (
                  <div className="text-center py-16">
                    <Award className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No quizzes scheduled</p>
                    <p className="text-xs text-muted-foreground mt-1">Tests scheduled by your instructor will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quiz Name</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map(quiz => {
                        const isAttempted = quiz.attempt;
                        const isOverdue = quiz.isOverdue;
                        return (
                          <TableRow key={quiz._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-bold text-foreground text-sm">{quiz.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{quiz.duration} mins</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(quiz.dueDate).toLocaleString()}</TableCell>
                            <TableCell className="text-xs font-bold text-foreground">
                              {isAttempted ? `${quiz.attempt.score} / ${quiz.attempt.totalPoints}` : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  isAttempted ? 'success' : 
                                  (isOverdue ? 'destructive' : 'warning')
                                } 
                                className="capitalize"
                              >
                                {isAttempted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {isAttempted ? (
                                <span className="text-xs font-bold text-emerald-500">Submitted</span>
                              ) : isOverdue ? (
                                <span className="text-xs text-muted-foreground">Locked</span>
                              ) : (
                                <Button size="xs" onClick={() => handleStartQuiz(quiz)}>Start Quiz</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* 5. ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Record</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Spinner />
                    <p className="text-xs text-muted-foreground">Loading attendance details...</p>
                  </div>
                ) : !attendance || attendance.total === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No Attendance Data Available</p>
                    <p className="text-xs text-muted-foreground mt-1">No attendance records have been registered for this course yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-border text-center space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Sessions</span>
                        <span className="text-2xl font-black text-foreground">{attendance.total}</span>
                      </div>
                      <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider block">Present</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{attendance.present}</span>
                      </div>
                      <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-center space-y-1">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-455 uppercase tracking-wider block">Absent</span>
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{attendance.absent + attendance.late}</span>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center space-y-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Percentage</span>
                        <span className="text-2xl font-black text-primary">{attendance.percentage}%</span>
                      </div>
                    </div>

                    {/* Progress Bar visual */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-foreground">
                        <span>Attendance Ratio</span>
                        <span>{attendance.percentage}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            attendance.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${attendance.percentage}%` }}
                        ></div>
                      </div>
                      {attendance.percentage < 75 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Warning: Your attendance is below the 75% required threshold.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

      </div>

      {/* ASSIGNMENT SUBMISSION MODAL */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-foreground uppercase">{selectedAssignment.submission ? 'Your Submission' : 'Submit Assignment'}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedAssignment.title}</p>
              </div>
              <button onClick={handleCloseSubmitModal}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
            </div>
            
            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-4">
              {/* If graded, show grades */}
              {selectedAssignment.submission?.status === 'graded' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Grade Received: {selectedAssignment.submission.grade}</span>
                    <Badge variant="success">Graded</Badge>
                  </div>
                  {selectedAssignment.submission.feedback && (
                    <p className="text-muted-foreground"><strong>Teacher Feedback:</strong> {selectedAssignment.submission.feedback}</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submission text notes</label>
                <textarea
                  placeholder="Type your notes, solution summary, or responses here..."
                  value={submitForm.content}
                  onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                  disabled={selectedAssignment.submission?.status === 'graded'}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border outline-none text-xs h-28 focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
              </div>

              {/* Upload list */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Attached Files</label>
                {selectedAssignment.submission?.status !== 'graded' ? (
                  <FileUpload
                    onChange={handleFileUpload}
                    multiple={true}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                    maxSize={10 * 1024 * 1024}
                    disabled={uploadingFile}
                    uploading={uploadingFile}
                    files={submitForm.attachments
                      .filter(att => att.url && att.url.trim() !== '')
                      .map(att => ({ name: att.title, url: att.url }))}
                    onRemove={handleRemoveAttachment}
                    dragLabel="Drag & drop assignment files here, or click to browse"
                    acceptLabel="Supports PDF, Word, Excel, PowerPoint, or Images up to 10MB"
                  />
                ) : (
                  <div className="space-y-2">
                    {submitForm.attachments.filter(att => att.url.trim() !== '').map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-border text-xs">
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-bold hover:underline truncate max-w-[80%]">
                          <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">{att.title}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseSubmitModal}
                  className="px-4 py-2 border border-border rounded-xl text-muted-foreground font-bold text-xs"
                >
                  Close
                </button>
                {selectedAssignment.submission?.status !== 'graded' && (
                  <button
                    type="submit"
                    disabled={submittingAssignment || uploadingFile}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    {submittingAssignment ? 'Submitting...' : selectedAssignment.submission ? 'Update Submission' : 'Submit Assignment'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUIZ INTERACTIVE TAKING SCREEN */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Quiz Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-foreground uppercase">{activeQuiz.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{activeQuiz.questions.length} Questions · Total Duration: {activeQuiz.duration} mins</p>
              </div>
              
              {/* Ticking Timer */}
              {!quizComplete && (
                <div className={`px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-extrabold ${timeLeft < 120 ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-primary/10 text-primary'}`}>
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Quiz content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Score Display on Completion */}
              {quizComplete ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-3xl font-extrabold shadow-sm border border-emerald-500/20">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">Quiz Submitted Successfully!</h4>
                    <p className="text-xs text-muted-foreground mt-1">Your responses have been processed.</p>
                  </div>
                  {quizScore && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl inline-block border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Your Score</span>
                      <span className="text-3xl font-black text-primary">{quizScore.score}</span>
                      <span className="text-sm font-bold text-muted-foreground"> / {quizScore.totalPoints} points</span>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button onClick={() => setActiveQuiz(null)}>Close Quiz Portal</Button>
                  </div>
                </div>
              ) : (
                /* Question Render loop */
                <div className="space-y-6">
                  {activeQuiz.questions.map((q, qIdx) => (
                    <div key={q._id || qIdx} className="p-5 border border-border bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          <span className="text-primary mr-1">Q{qIdx + 1}.</span> {q.questionText}
                        </h4>
                        <Badge variant="outline" className="text-[9px] shrink-0 font-extrabold uppercase">{q.points || 1} Pt</Badge>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = answers[qIdx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleOptionSelect(qIdx, optIdx)}
                              className={`p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all ${
                                isSelected 
                                  ? 'bg-primary border-primary text-white shadow-md' 
                                  : 'bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className="mr-2 uppercase font-black">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Quiz Footer */}
            {!quizComplete && (
              <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
                <span className="text-[10px] font-bold text-muted-foreground">
                  Answered: {answers.filter(a => a !== null).length} / {activeQuiz.questions.length}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                        setActiveQuiz(null);
                      }
                    }}
                    disabled={attemptingQuiz}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSubmitQuiz(false)}
                    disabled={attemptingQuiz}
                  >
                    {attemptingQuiz ? 'Submitting...' : 'Submit Answers'}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default CourseContent;
