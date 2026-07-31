import { useState, useEffect } from 'react';
import { batchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ClipboardList, Calendar, CheckCircle, AlertCircle, Clock, 
  Send, FileText, X, Award, ExternalLink, Paperclip
} from 'lucide-react';
import FileUpload from '../../components/ui/FileUpload';

const StudentAssignments = () => {
  const [batch, setBatch] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    content: '',
    attachments: [{ title: 'Submission File', url: '' }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchStudentBatchAndAssignments();
  }, []);

  const fetchStudentBatchAndAssignments = async () => {
    try {
      setLoading(true);
      const batchResponse = await batchAPI.getStudentBatch();
      const studentBatch = batchResponse.data.data.batch;
      setBatch(studentBatch);

      if (studentBatch) {
        const assignmentsResponse = await batchAPI.getAssignments(studentBatch._id);
        setAssignments(assignmentsResponse.data.data.assignments);
      }
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedAssignment(null);
  };

  const handleUploadSuccess = (uploadedResults) => {
    // uploadedResults is an array of { url, fileName, ... } from the upload endpoint
    const newAttachments = uploadedResults.map(r => ({
      title: r.fileName || 'Uploaded File',
      url: r.url
    }));
    setSubmitForm(prev => {
      const existing = prev.attachments.filter(att => att.url && att.url.trim() !== '');
      const merged = [...existing, ...newAttachments];
      return { ...prev, attachments: merged.length > 0 ? merged : [{ title: 'Submission File', url: '' }] };
    });
    setUploadingFile(false);
  };

  const handleUploadError = () => {
    setUploadingFile(false);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Filter out empty attachment urls
      const attachments = submitForm.attachments.filter(att => att.url.trim() !== '');
      
      await batchAPI.submitAssignment(selectedAssignment._id, {
        content: submitForm.content,
        attachments
      });

      toast.success('Assignment submitted successfully!');
      handleCloseSubmitModal();
      // Reload assignments
      fetchStudentBatchAndAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Group assignments
  const pendingAssignments = assignments.filter(a => !a.submission && !a.isOverdue);
  const submittedAssignments = assignments.filter(a => a.submission && (a.submission.status === 'submitted' || a.submission.status === 'late' || a.submission.status === 'returned'));
  const gradedAssignments = assignments.filter(a => a.submission && a.submission.status === 'graded');
  const overdueAssignments = assignments.filter(a => a.isOverdue);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-primary" />
          My Assignments
        </h1>
        {batch ? (
          <p className="text-sm text-slate-500 mt-1">
            Assigned Batch: <span className="font-bold text-slate-700 dark:text-slate-300">{batch.name}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-1">Submit coursework, check deadlines, and view grades.</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : !batch ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 font-display">No batch assigned</h3>
          <p className="text-slate-500 text-sm mt-1">You are not currently enrolled in any academic batches. Please contact Admin.</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 font-display">No assignments</h3>
          <p className="text-slate-500 text-sm mt-1">Yay! No homework assigned to your batch at this moment.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Section */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" /> Pending Homework ({pendingAssignments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {pendingAssignments.map(a => (
                  <div key={a._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{a.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{a.courseId?.title}</p>
                      <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-2 max-w-xl">{a.description}</p>
                      <p className="text-[10px] text-red-500 font-bold mt-3 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Due Date: {new Date(a.dueDate).toLocaleDateString()} {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenSubmitModal(a)}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-md transition-all self-stretch md:self-auto flex items-center justify-center gap-1 flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Assignment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graded Section */}
          {gradedAssignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-500" /> Graded & Evaluated ({gradedAssignments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {gradedAssignments.map(a => (
                  <div key={a._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{a.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.courseId?.title}</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold leading-none uppercase">Grade</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 leading-none block mt-1">{a.submission.grade}</span>
                      </div>
                    </div>
                    {a.submission.feedback && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-700 dark:text-slate-300">Teacher's Feedback:</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 italic">"{a.submission.feedback}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted Section */}
          {submittedAssignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-500" /> Submitted / Awaiting Evaluation ({submittedAssignments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {submittedAssignments.map(a => (
                  <div key={a._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{a.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.courseId?.title}</p>
                        {a.submission.content && (
                          <p className="text-[11px] text-slate-500 mt-2 italic">Notes: "{a.submission.content}"</p>
                        )}
                        {/* Attachments List */}
                        {a.submission.attachments && a.submission.attachments.length > 0 && (
                          <div className="mt-2.5 space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Submitted Files:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {a.submission.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10"
                                >
                                  <Paperclip className="w-3 h-3" /> {att.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
                        {a.submission.status === 'returned' ? (
                          <span className="text-[10px] px-2.5 py-1 bg-amber-500/10 text-amber-600 font-extrabold rounded-lg uppercase">Returned for Revision</span>
                        ) : a.submission.status === 'late' ? (
                          <span className="text-[10px] px-2.5 py-1 bg-rose-500/10 text-rose-600 font-extrabold rounded-lg uppercase">Submitted Late</span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-1 bg-blue-500/10 text-blue-600 font-extrabold rounded-lg uppercase">Submitted</span>
                        )}

                        <button
                          onClick={() => handleOpenSubmitModal(a)}
                          className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                          Resubmit / Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Section */}
          {overdueAssignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" /> Overdue Homework ({overdueAssignments.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {overdueAssignments.map(a => (
                  <div key={a._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-75">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{a.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{a.courseId?.title}</p>
                      <p className="text-[10px] text-red-500 font-bold mt-2">Missed Deadline: {new Date(a.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
                      <span className="text-[10px] px-3 py-1 bg-red-500/10 text-red-600 font-extrabold rounded-lg uppercase flex-shrink-0">Overdue</span>
                      <button
                        onClick={() => handleOpenSubmitModal(a)}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1 flex-shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Late
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold font-display text-slate-800 dark:text-slate-100 text-sm">Submit Homework</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedAssignment?.title}</p>
              </div>
              <button onClick={handleCloseSubmitModal}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submission Text / Notes</label>
                <textarea
                  placeholder="Type any answers, comments, or details for your teacher here..."
                  value={submitForm.content}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs h-24"
                />
              </div>

              {/* Upload Files Section — Drag & Drop Dropbox */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Attached Files</label>
                <FileUpload
                  uploadUrl="/upload?folder=assignments"
                  multiple={true}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                  maxSize={10 * 1024 * 1024}
                  maxFiles={5}
                  disabled={submitting}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  files={submitForm.attachments
                    .filter(att => att.url && att.url.trim() !== '')
                    .map(att => ({ name: att.title, url: att.url }))}
                  onRemove={(idx) => {
                    setSubmitForm(prev => {
                      const atts = idx === -1 ? [] : prev.attachments.filter((_, i) => i !== idx);
                      return { ...prev, attachments: atts.length > 0 ? atts : [{ title: 'Submission File', url: '' }] };
                    });
                  }}
                  dragLabel="Drag & drop homework files here, or click to browse"
                  acceptLabel="Supports PDF, Word, Excel, PowerPoint, or Images up to 10MB"
                  enableDragDrop={true}
                  showPreview={true}
                />
              </div>

              {/* External file link fallback */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Or Paste File URL (e.g. Google Drive Link)</label>
                <input
                  type="url"
                  placeholder="https://example.com/my-homework.pdf"
                  value={submitForm.attachments[0]?.url || ''}
                  onChange={(e) => setSubmitForm(prev => {
                    const atts = [...prev.attachments];
                    if (atts.length === 0) {
                      atts.push({ title: 'External File', url: e.target.value });
                    } else {
                      atts[0].url = e.target.value;
                      if (!atts[0].title) atts[0].title = 'External File';
                    }
                    return { ...prev, attachments: atts };
                  })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseSubmitModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                  disabled={submitting || uploadingFile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl flex items-center gap-1"
                  disabled={submitting || uploadingFile}
                >
                  {submitting ? 'Submitting...' : 'Send Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
