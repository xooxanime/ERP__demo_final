import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Primitives';
import {
  Bell, Send, Search, RefreshCw, AlertCircle, Users, BookOpen, User as UserIcon,
  ChevronLeft, ChevronRight, Inbox, Megaphone, Paperclip, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../ui/FileUpload';
import { openOrDownloadFile } from '../../lib/utils';

const ACCENTS = {
  violet: {
    gradient: 'from-violet-600 to-indigo-600',
    subText: 'text-violet-100',
    ring: 'focus:ring-violet-500',
    sendBtn: 'bg-violet-600 hover:bg-violet-700',
    tabActive: 'border-violet-600 text-violet-600',
  },
  emerald: {
    gradient: 'from-emerald-600 to-teal-500',
    subText: 'text-emerald-100',
    ring: 'focus:ring-emerald-500',
    sendBtn: 'bg-emerald-600 hover:bg-emerald-700',
    tabActive: 'border-emerald-600 text-emerald-600',
  },
};

const TYPE_BADGE = { info: 'default', success: 'success', warning: 'warning', error: 'destructive' };
const PRIORITY_BADGE = { low: 'muted', normal: 'secondary', high: 'warning', urgent: 'destructive' };
const SCOPE_LABEL = { all: 'All Students', course: 'Course / Batch', individual: 'Individual' };

const emptyForm = {
  title: '',
  message: '',
  type: 'info',
  priority: 'normal',
  audienceScope: 'course',
  courseId: '',
  studentId: '',
  expiryDate: '',
  scheduledAt: '',
  attachmentBase64: '',
  attachmentName: '',
};

export default function NotificationManager({
  accent = 'violet',
  heading = 'Notification Center',
  subheading = 'Create and send notifications to your students.',
  allowAllStudents = false,
  showSender = false,
  loadCourses,
  loadStudents,
  sendNotification,
  listNotifications,
}) {
  const a = ACCENTS[accent] || ACCENTS.violet;

  const [form, setForm] = useState({ ...emptyForm, audienceScope: allowAllStudents ? 'all' : 'course' });
  const [sending, setSending] = useState(false);

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  // ---- Load dropdown options (courses + students) ----
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setOptionsLoading(true);
        const [c, s] = await Promise.all([
          loadCourses ? loadCourses() : Promise.resolve([]),
          loadStudents ? loadStudents() : Promise.resolve([]),
        ]);
        if (!active) return;
        setCourses(c || []);
        setStudents(s || []);
      } catch (err) {
        console.error('Failed to load notification options:', err);
      } finally {
        if (active) setOptionsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadCourses, loadStudents]);

  // ---- Load history ----
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const res = await listNotifications({
        page,
        limit: 10,
        search: search || undefined,
        type: typeFilter || undefined,
        scope: scopeFilter || undefined,
      });
      setHistory(res?.data?.data || []);
      const p = res?.data?.pagination;
      if (p) setPagination({ page: p.page, totalPages: p.totalPages, total: p.total });
    } catch (err) {
      console.error(err);
      setHistoryError(err?.response?.data?.message || 'Failed to load notification history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [listNotifications, page, search, typeFilter, scopeFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit');
      if (e.target && 'value' in e.target) e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        attachmentBase64: reader.result,
        attachmentName: file.name
      }));
    };
    reader.onerror = (err) => {
      console.error('File reading error:', err);
      toast.error('Failed to read file');
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter a title');
    if (!form.message.trim()) return toast.error('Please enter a message');
    if (form.audienceScope === 'course' && !form.courseId) return toast.error('Please select a target course');
    if (form.audienceScope === 'individual' && !form.studentId) return toast.error('Please select a target student');

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      priority: form.priority,
      audienceScope: form.audienceScope,
      expiryDate: form.expiryDate || undefined,
      scheduledAt: form.scheduledAt || undefined,
      attachmentBase64: form.attachmentBase64 || undefined,
      attachmentName: form.attachmentName || undefined
    };
    if (form.audienceScope === 'course') payload.courseId = form.courseId;
    if (form.audienceScope === 'individual') payload.studentId = form.studentId;

    try {
      setSending(true);
      toast.loading('Processing notification...', { id: 'notif' });
      const res = await sendNotification(payload);
      toast.success(res?.data?.message || 'Notification sent!', { id: 'notif' });
      setForm({ ...emptyForm, audienceScope: allowAllStudents ? 'all' : 'course' });
      // Reset file input if exists
      const fileInput = document.getElementById('attachment-file-input');
      if (fileInput) fileInput.value = '';
      
      // Refresh history at page 1
      if (page !== 1) setPage(1);
      else fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to send notification', { id: 'notif' });
    } finally {
      setSending(false);
    }
  };

  const applySearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setTypeFilter('');
    setScopeFilter('');
    setPage(1);
  };

  const inputCls = `w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 ${a.ring} transition`;

  const formatDate = (d) => {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const audienceText = (n) => {
    if (n.audienceScope === 'all') return 'All Students';
    if (n.audienceScope === 'course') return n.courseId?.title || n.courseName || 'Course';
    if (n.audienceScope === 'individual') return n.studentId?.name || n.studentName || 'Student';
    return '—';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header banner */}
      <div className={`bg-gradient-to-r ${a.gradient} rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-md`}>
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <Megaphone className="w-7 h-7" /> {heading}
          </h1>
          <p className={`mt-2 ${a.subText} max-w-xl text-sm`}>{subheading}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Create form */}
        <Card className="xl:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5" /> Compose Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Exam schedule update" className={inputCls} maxLength={120} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Write the notification message..." className={`${inputCls} resize-y`} maxLength={1000} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error / Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Priority</label>
                  <select name="priority" value={form.priority} onChange={handleChange} className={inputCls}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Send To</label>
                <select name="audienceScope" value={form.audienceScope} onChange={handleChange} className={inputCls}>
                  {allowAllStudents && <option value="all">All Students</option>}
                  <option value="course">A Course / Batch</option>
                  <option value="individual">An Individual Student</option>
                </select>
              </div>

              {form.audienceScope === 'course' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Course / Batch *</label>
                  {optionsLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 py-2"><Spinner size="sm" /> Loading courses...</div>
                  ) : courses.length === 0 ? (
                    <div className="p-3 border border-amber-500/25 bg-amber-500/10 text-amber-500 rounded-xl text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> No courses available to target.
                    </div>
                  ) : (
                    <select name="courseId" value={form.courseId} onChange={handleChange} className={inputCls}>
                      <option value="">Select a course</option>
                      {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  )}
                </div>
              )}

              {form.audienceScope === 'individual' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Student *</label>
                  {optionsLoading ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 py-2"><Spinner size="sm" /> Loading students...</div>
                  ) : students.length === 0 ? (
                    <div className="p-3 border border-amber-500/25 bg-amber-500/10 text-amber-500 rounded-xl text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> No students available to target.
                    </div>
                  ) : (
                    <select name="studentId" value={form.studentId} onChange={handleChange} className={inputCls}>
                      <option value="">Select a student</option>
                      {students.map((s) => <option key={s._id} value={s._id}>{s.name}{s.email ? ` (${s.email})` : ''}</option>)}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Scheduled Send Time
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={form.scheduledAt}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1 mb-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachment (Max 5MB)
                </label>
                <FileUpload
                  onChange={handleFileChange}
                  multiple={false}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,image/*"
                  maxSize={5 * 1024 * 1024}
                  disabled={sending}
                  files={form.attachmentBase64 ? [{ name: form.attachmentName || 'Selected Attachment', url: form.attachmentBase64 }] : []}
                  onRemove={() => setForm(prev => ({ ...prev, attachmentBase64: '', attachmentName: '' }))}
                  dragLabel="Drag & drop attachment here, or click to browse"
                  acceptLabel="Supports documents, images, zip archive files up to 5MB"
                />
              </div>

              <Button type="submit" disabled={sending} className={`w-full text-white ${a.sendBtn} cursor-pointer`}>
                {sending ? <Spinner size="sm" className="text-white" /> : <Send className="w-4 h-4" />}
                {sending ? 'Processing...' : 'Send Broadcast'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5" /> Sent History
                {pagination.total > 0 && <Badge variant="muted" className="ml-1">{pagination.total}</Badge>}
              </CardTitle>
              <button onClick={fetchHistory} disabled={historyLoading} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition disabled:opacity-50 cursor-pointer">
                <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={applySearch} className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search title or message..."
                  className={`${inputCls} pl-9`}
                />
              </form>
              <select value={typeFilter} onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }} className={`${inputCls} sm:w-36`}>
                <option value="">All types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <select value={scopeFilter} onChange={(e) => { setPage(1); setScopeFilter(e.target.value); }} className={`${inputCls} sm:w-36`}>
                <option value="">All audiences</option>
                {allowAllStudents && <option value="all">All Students</option>}
                <option value="course">Course</option>
                <option value="individual">Individual</option>
              </select>
              {(search || typeFilter || scopeFilter) && (
                <Button type="button" variant="ghost" onClick={resetFilters} className="cursor-pointer">Clear</Button>
              )}
            </div>

            {/* List */}
            {historyError ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">{historyError}</div>
                <Button size="sm" variant="destructive" onClick={fetchHistory}>Retry</Button>
              </div>
            ) : historyLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No notifications yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {(search || typeFilter || scopeFilter)
                    ? 'No notifications match your filters.'
                    : 'Notifications you send will appear here with their delivery audience.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((n) => (
                  <div key={n._id} className="border border-border rounded-xl p-4 hover:bg-accent/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-sm text-foreground truncate">{n.title}</h4>
                          <Badge variant={TYPE_BADGE[n.type] || 'default'} className="capitalize">{n.type}</Badge>
                          {n.priority && n.priority !== 'normal' && (
                            <Badge variant={PRIORITY_BADGE[n.priority] || 'secondary'} className="capitalize">{n.priority}</Badge>
                          )}
                          {n.status === 'scheduled' && (
                            <Badge variant="warning" className="capitalize">Scheduled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                        
                        {n.attachment?.url && (
                          <div className="mt-2 flex items-center">
                            <button
                              type="button"
                              onClick={() => openOrDownloadFile(n.attachment.url, n.attachment.name)}
                              className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer bg-transparent border-0 p-0"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{n.attachment.name || 'Attachment'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {n.audienceScope === 'all' ? <Users className="w-3.5 h-3.5" /> : n.audienceScope === 'course' ? <BookOpen className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                        {SCOPE_LABEL[n.audienceScope]}: <span className="text-foreground font-medium">{audienceText(n)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {n.recipientCount} recipient{n.recipientCount === 1 ? '' : 's'}
                      </span>
                      {showSender && n.senderName && (
                        <span>By: <span className="text-foreground font-medium">{n.senderName}</span> ({n.senderRole})</span>
                      )}
                      {n.status === 'scheduled' && n.scheduledAt && (
                        <span className="text-amber-500 font-medium">Sends at: {formatDate(n.scheduledAt)}</span>
                      )}
                      <span className="ml-auto">{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!historyLoading && !historyError && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
