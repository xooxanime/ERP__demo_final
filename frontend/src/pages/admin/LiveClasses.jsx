import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Primitives';
import { 
  Video, User, Calendar, Clock, Plus, RefreshCw, AlertCircle, 
  Trash2, Play, Power, X, ChevronLeft, Link2, Users 
} from 'lucide-react';
import LiveMeetingEmbed from '../../components/LiveMeetingEmbed';
import toast from 'react-hot-toast';

export default function AdminLiveClasses() {
  const { user } = useAuth();
  
  // States
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('all');
  const [activeMeeting, setActiveMeeting] = useState(null);
  
  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEndClassOpen, setIsEndClassOpen] = useState(false);
  const [classToEnd, setClassToEnd] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  
  // Schedule Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    teacherId: '',
    startTime: '',
    endTime: ''
  });

  // Date and Time UX Helpers
  const handlePresetSelect = (minutesFromNow, durationMinutes) => {
    const start = new Date();
    start.setMinutes(start.getMinutes() + minutesFromNow);
    start.setSeconds(0);
    start.setMilliseconds(0);
    
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    const formatForInput = (date) => {
      const tzoffset = date.getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    };
    
    setFormData(prev => ({
      ...prev,
      startTime: formatForInput(start),
      endTime: formatForInput(end)
    }));
  };

  const getReadableDateTimeFormat = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  const getDurationString = () => {
    if (!formData.startTime || !formData.endTime) return '';
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return '';
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
  };

  const isFormInvalid = () => {
    if (!formData.startTime || !formData.endTime) return false;
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    return end <= start;
  };

  // Data Fetching
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classesRes, coursesRes, facultyRes] = await Promise.all([
        adminAPI.getLiveClasses(),
        adminAPI.getAllCourses(),
        adminAPI.getAllFaculty()
      ]);
      
      setClasses(classesRes?.data?.data || []);
      setCourses(coursesRes?.data?.data?.courses || coursesRes?.data?.data || []);
      
      const facultyList = facultyRes?.data?.data?.faculty || facultyRes?.data?.data || [];
      const teachersList = Array.isArray(facultyList) ? facultyList : [];
      setTeachers(teachersList);
      
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch live classes details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Operations
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (isFormInvalid()) {
      return toast.error('End time must be after start time.');
    }

    try {
      toast.loading('Scheduling live class...', { id: 'schedule' });
      await adminAPI.createLiveClass(formData);
      toast.success('Live class scheduled successfully!', { id: 'schedule' });
      setIsScheduleOpen(false);
      setFormData({
        title: '',
        description: '',
        courseId: '',
        teacherId: '',
        startTime: '',
        endTime: ''
      });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to schedule class.', { id: 'schedule' });
    }
  };

  const handleUpdateStatus = async (classId, newStatus, extra = {}) => {
    try {
      toast.loading(`Updating class status to ${newStatus}...`, { id: 'status' });
      const payload = { status: newStatus, ...extra };
      await adminAPI.updateLiveClassStatus(classId, payload);
      toast.success(`Class marked as ${newStatus}!`, { id: 'status' });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status.', { id: 'status' });
    }
  };

  const handleEndClassSubmit = async (e) => {
    e.preventDefault();
    if (!classToEnd) return;
    
    await handleUpdateStatus(classToEnd._id, 'completed', { recordingUrl });
    setIsEndClassOpen(false);
    setClassToEnd(null);
    setRecordingUrl('');
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this live class?')) return;
    try {
      toast.loading('Deleting live class...', { id: 'delete' });
      await adminAPI.deleteLiveClass(classId);
      toast.success('Live class deleted successfully.', { id: 'delete' });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete class.', { id: 'delete' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <Badge variant="success" className="animate-pulse">LIVE</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'scheduled':
      default:
        return <Badge variant="default">Scheduled</Badge>;
    }
  };

  const filteredClasses = classes.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  if (activeMeeting) {
    return (
      <div className="space-y-4 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveMeeting(null)}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">{activeMeeting.title}</h2>
              <p className="text-xs text-muted-foreground">Managing as System Administrator</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeMeeting.status === 'live' && (
              <Button 
                variant="destructive"
                onClick={() => {
                  setClassToEnd(activeMeeting);
                  setIsEndClassOpen(true);
                }}
                className="gap-2"
              >
                <Power className="w-4 h-4" /> End Class
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setActiveMeeting(null)}
            >
              Close Window
            </Button>
          </div>
        </div>

        <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-black shadow-2xl relative min-h-[500px]">
          <LiveMeetingEmbed 
            meetingLink={activeMeeting.meetingLink}
            jwt={activeMeeting.jwt}
            userName={user?.name || 'Admin'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="page-title text-3xl font-bold font-display">Live Classes Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Schedule, launch, and monitor all virtual meetings and classrooms.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition bg-card hover:bg-muted text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Button onClick={() => setIsScheduleOpen(true)} className="gap-2 text-white">
            <Plus className="w-4 h-4" /> Schedule Class
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10 border-indigo-100 dark:border-indigo-900/30">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Active Rooms</p>
                <h3 className="text-3xl font-bold mt-2 text-foreground">
                  {classes.filter(c => c.status === 'live').length}
                </h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Video className="w-6 h-6 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-100 dark:border-amber-900/30">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Scheduled Today</p>
                <h3 className="text-3xl font-bold mt-2 text-foreground">
                  {classes.filter(c => c.status === 'scheduled').length}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-100 dark:border-emerald-900/30">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed Classes</p>
                <h3 className="text-3xl font-bold mt-2 text-foreground">
                  {classes.filter(c => c.status === 'completed').length}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        {['all', 'scheduled', 'live', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-all relative capitalize ${
              activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Class List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading classrooms...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Video className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-foreground">No classes found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                There are no live meetings corresponding to this tab state.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClasses.map((item) => (
                <div 
                  key={item._id}
                  className="p-5 border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition bg-card"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                      {getStatusBadge(item.status)}
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                        {item.courseId?.title || 'Unknown Course'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground max-w-xl">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" />
                        Instructor: <strong className="text-foreground">{item.teacherId?.name || 'Unassigned'}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {getReadableDateTimeFormat(item.startTime)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Duration: {Math.round((new Date(item.endTime) - new Date(item.startTime)) / 60000)} mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.status === 'scheduled' && (
                      <>
                        <Button 
                          onClick={() => handleUpdateStatus(item._id, 'live')}
                          className="gap-2 text-white bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4" /> Start Class
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveMeeting(item)}
                          className="gap-2"
                        >
                          <Video className="w-4 h-4" /> Join Room
                        </Button>
                      </>
                    )}

                    {item.status === 'live' && (
                      <>
                        <Button 
                          onClick={() => setActiveMeeting(item)}
                          className="gap-2 text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Video className="w-4 h-4" /> Open Meet Window
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            setClassToEnd(item);
                            setIsEndClassOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Power className="w-4 h-4" /> End Class
                        </Button>
                      </>
                    )}

                    {item.status === 'completed' && item.recordingUrl && (
                      <a 
                        href={item.recordingUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold text-primary hover:bg-muted transition"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Recording
                      </a>
                    )}

                    <button 
                      onClick={() => handleDeleteClass(item._id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Live Class Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/40">
              <h2 className="text-xl font-bold text-foreground">Schedule Live Class</h2>
              <button 
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Title *</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. CA Inter Taxation Doubts Class"
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Provide syllabus chapters or guidelines..."
                  rows={2}
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Course *</label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => setFormData(p => ({ ...p, courseId: e.target.value }))}
                    className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-3 py-2.5 text-sm text-foreground transition outline-none"
                  >
                    <option value="">Choose Course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instructor (Teacher) *</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData(p => ({ ...p, teacherId: e.target.value }))}
                    className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-3 py-2.5 text-sm text-foreground transition outline-none"
                  >
                    <option value="">Select Instructor</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start Time *</label>
                  <input 
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-3 py-2.5 text-sm text-foreground transition outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">End Time *</label>
                  <input 
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-3 py-2.5 text-sm text-foreground transition outline-none"
                  />
                </div>
              </div>

              {/* Preset Buttons for easy Scheduling */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-muted-foreground">Or pick quick presets:</label>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    type="button" 
                    onClick={() => handlePresetSelect(5, 45)}
                    className="px-2.5 py-1 text-xs border rounded-lg bg-card hover:bg-muted transition text-foreground"
                  >
                    In 5 mins (45m class)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handlePresetSelect(30, 60)}
                    className="px-2.5 py-1 text-xs border rounded-lg bg-card hover:bg-muted transition text-foreground"
                  >
                    In 30 mins (1h class)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handlePresetSelect(60, 90)}
                    className="px-2.5 py-1 text-xs border rounded-lg bg-card hover:bg-muted transition text-foreground"
                  >
                    In 1 hour (1.5h class)
                  </button>
                </div>
                {getDurationString() && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    Calculated duration: {getDurationString()}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsScheduleOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isFormInvalid()}
                  className="text-white"
                >
                  Schedule Meeting
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Class / Recording URL Modal */}
      {isEndClassOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/40">
              <h2 className="text-xl font-bold text-foreground">Complete Live Class</h2>
              <button 
                onClick={() => {
                  setIsEndClassOpen(false);
                  setClassToEnd(null);
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEndClassSubmit} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to complete the class <strong>{classToEnd?.title}</strong>. Optionally paste a cloud recording URL (e.g. Cloudinary, YouTube, Zoom link) so students can view the playback later.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Recording Link (Optional)</label>
                <input 
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://cloudinary.com/..."
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEndClassOpen(false);
                    setClassToEnd(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                >
                  End & Save Recording
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
