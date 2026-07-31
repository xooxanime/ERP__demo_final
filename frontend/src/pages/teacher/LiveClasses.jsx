import { useEffect, useState, useCallback } from 'react';
import { teacherAPI } from '../../services/api';
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

export default function TeacherLiveClasses() {
  const { user } = useAuth();
  
  // States
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
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
    
    // Format to local ISO yyyy-MM-ddTHH:mm representation
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
    const now = new Date();
    
    // Add 1-minute grace margin
    now.setMinutes(now.getMinutes() - 1);
    
    if (start < now) return 'start_past';
    if (end <= start) return 'end_before_start';
    return false;
  };


  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classesRes, coursesRes] = await Promise.all([
        teacherAPI.getLiveClasses(),
        teacherAPI.getCourses()
      ]);
      
      setClasses(classesRes?.data?.data || []);
      setCourses(coursesRes?.data?.data?.courses || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load teacher schedules. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.courseId || !formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const invalidReason = isFormInvalid();
    if (invalidReason === 'start_past') {
      toast.error('Start time cannot be in the past');
      return;
    }
    if (invalidReason === 'end_before_start') {
      toast.error('End Time must be after Start Time');
      return;
    }

    try {
      toast.loading('Scheduling live class...', { id: 'schedule-toast' });
      await teacherAPI.createLiveClass(formData);
      
      toast.success('Live class scheduled successfully!', { id: 'schedule-toast' });
      setIsScheduleOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        courseId: '',
        startTime: '',
        endTime: ''
      });
      
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to schedule class', { id: 'schedule-toast' });
    }
  };

  // Class Actions
  const handleStartClass = async (liveClass) => {
    try {
      toast.loading('Starting video conference room...', { id: 'start-toast' });
      
      // 1. Update status to 'live' on backend
      await teacherAPI.updateLiveClassStatus(liveClass._id, { status: 'live' });
      
      // 2. Open embedded Jitsi
      setActiveMeeting(liveClass);
      toast.success('Lecture is now LIVE!', { id: 'start-toast' });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to start class', { id: 'start-toast' });
    }
  };

  const handleJoinClass = (liveClass) => {
    setActiveMeeting(liveClass);
  };

  const triggerEndClassModal = (liveClass) => {
    setClassToEnd(liveClass);
    setRecordingUrl('');
    setIsEndClassOpen(true);
  };

  const handleEndClassSubmit = async (e) => {
    e.preventDefault();
    if (!classToEnd) return;

    try {
      toast.loading('Concluding lecture session...', { id: 'end-toast' });
      
      // Update status to 'completed' & save optional recording Link
      await teacherAPI.updateLiveClassStatus(classIdOrMeeting(classToEnd), {
        status: 'completed',
        recordingUrl: recordingUrl.trim()
      });
      
      toast.success('Lecture ended and saved successfully!', { id: 'end-toast' });
      setIsEndClassOpen(false);
      setClassToEnd(null);
      
      // Reset active meeting if they were in it
      if (activeMeeting && activeMeeting._id === classIdOrMeeting(classToEnd)) {
        setActiveMeeting(null);
      }
      
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to end class', { id: 'end-toast' });
    }
  };

  const classIdOrMeeting = (cls) => cls._id || cls.id;

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this scheduled live class?')) return;
    
    try {
      toast.loading('Deleting scheduled class...', { id: 'delete-toast' });
      await teacherAPI.deleteLiveClass(id);
      toast.success('Live class deleted!', { id: 'delete-toast' });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to delete class', { id: 'delete-toast' });
    }
  };

  // Tabs filters
  const filteredClasses = classes.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return item.status === 'scheduled';
    if (activeTab === 'live') return item.status === 'live';
    if (activeTab === 'completed') return item.status === 'completed';
    return true;
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const options = { hour: '2-digit', minute: '2-digit' };
    return `${start.toLocaleTimeString('en-US', options)} - ${end.toLocaleTimeString('en-US', options)}`;
  };

  // Immersive teacher classroom layout
  if (activeMeeting) {
    return (
      <div className="space-y-4 animate-fade-in py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card border border-border rounded-xl p-4 shadow-sm gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                {activeMeeting.courseId?.title}
              </span>
              <Badge variant="destructive" className="animate-pulse">Live Now</Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight">{activeMeeting.title}</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setActiveMeeting(null)} 
              variant="outline"
              className="flex items-center gap-2 font-medium w-full sm:w-auto cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Temporary Dashboard View
            </Button>
            <Button 
              onClick={() => triggerEndClassModal(activeMeeting)} 
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 font-bold w-full sm:w-auto cursor-pointer shadow-sm"
            >
              <Power className="w-4 h-4" />
              End Class & Record
            </Button>
          </div>
        </div>

        <LiveMeetingEmbed 
          meetingLink={activeMeeting.meetingLink}
          user={user}
          role="teacher"
          jwt={activeMeeting.jwt}
          onLeave={() => setActiveMeeting(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-md">
        <div>
          <h1 className="text-3xl font-bold font-display">Manage Live Classes</h1>
          <p className="mt-2 text-emerald-100 max-w-xl text-sm">
            Schedule lectures, start live broadcasts, manage interactive doubt sessions, and upload recordings for student access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsScheduleOpen(true)}
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition duration-200 cursor-pointer border border-transparent shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            Schedule Class
          </Button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white/20 border border-white/20 hover:bg-white/30 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <Button size="sm" variant="destructive" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'all', label: 'All Classes' },
          { id: 'scheduled', label: 'Upcoming Scheduled' },
          { id: 'live', label: 'Live' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors -mb-px flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.id === 'live' && classes.some(c => c.status === 'live') && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Class List */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3 bg-card border rounded-2xl">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground font-medium">Fetching classes schedule...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-2xl flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Video className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1 font-display">No Lectures Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {activeTab === 'all'
              ? 'You have not scheduled any lectures yet. Click the Schedule Class button to start!'
              : `There are no ${activeTab} classes scheduled.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses.map((item) => (
            <Card key={item._id} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
              item.status === 'live' ? 'border-rose-200 ring-1 ring-rose-100/50 bg-rose-50/5' : 'border-border'
            }`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded inline-block mb-1">
                    {item.courseId?.title || 'General Course'}
                  </span>
                  <CardTitle className="text-lg font-bold leading-snug line-clamp-2">
                    {item.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    item.status === 'live' ? 'destructive' :
                    item.status === 'scheduled' ? 'default' : 'outline'
                  } className="flex-shrink-0 flex items-center px-2 py-0.5 text-xs capitalize">
                    {item.status === 'scheduled' ? 'Upcoming' : item.status}
                  </Badge>
                  {item.status === 'scheduled' && (
                    <button 
                      onClick={() => handleDeleteClass(item._id)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded transition cursor-pointer"
                      title="Cancel Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" />
                    <span>
                      <strong className="text-foreground font-medium font-sans">Instructor: </strong>
                      {item.teacherId?.name || 'You'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>{formatDate(item.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>{formatTime(item.startTime, item.endTime)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {item.status === 'live' && (
                      <span className="flex items-center gap-1 font-medium text-rose-600">
                        <Users className="w-3.5 h-3.5" />
                        {item.attendanceCount || 0} students online
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.attendanceCount || 0} attended
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {item.status === 'scheduled' && (
                      <Button
                        onClick={() => handleStartClass(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition w-full sm:w-auto cursor-pointer shadow-sm"
                      >
                        Start Lecture
                      </Button>
                    )}

                    {item.status === 'live' && (
                      <>
                        <Button
                          onClick={() => handleJoinClass(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                        >
                          Join Conference
                        </Button>
                        <Button
                          onClick={() => triggerEndClassModal(item)}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                        >
                          End Lecture
                        </Button>
                      </>
                    )}

                    {item.status === 'completed' && (
                      item.recordingUrl ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <a
                            href={item.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition w-full"
                          >
                            <Play className="w-4 h-4 fill-emerald-600" />
                            <span>Watch Recording</span>
                          </a>
                          <button
                            onClick={() => triggerEndClassModal(item)}
                            className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition cursor-pointer"
                            title="Edit Recording Link"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => triggerEndClassModal(item)}
                          variant="outline"
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold w-full sm:w-auto cursor-pointer"
                        >
                          Add Recording Link
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: Schedule Lecture Form */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-emerald-50/10">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-500" />
                Schedule Live Lecture
              </h2>
              <button 
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Course Batch *</label>
                {courses.length === 0 ? (
                  <div className="p-3 border border-amber-500/25 bg-amber-500/10 text-amber-500 rounded-xl text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span>You have no active courses/batches assigned. Live class scheduling is disabled.</span>
                  </div>
                ) : (
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition duration-150"
                  >
                    <option value="">Select a Course Batch</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Lecture Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Partnership Accounts - Admission of a Partner"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition duration-150"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Description</label>
                <textarea
                  name="description"
                  placeholder="Write a brief overview of topics to cover..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition duration-150"
                />
              </div>

              {/* Quick Presets Section */}
              <div className="space-y-1.5 border-t border-border pt-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Quick Presets</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(0, 60)}
                    className="px-2.5 py-1 text-xs border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-lg text-muted-foreground hover:text-emerald-500 transition cursor-pointer font-medium"
                  >
                    Start Now (1h)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(30, 60)}
                    className="px-2.5 py-1 text-xs border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-lg text-muted-foreground hover:text-emerald-500 transition cursor-pointer font-medium"
                  >
                    In 30 mins (1h)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(1440, 90)} // 24 hours later
                    className="px-2.5 py-1 text-xs border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-lg text-muted-foreground hover:text-emerald-500 transition cursor-pointer font-medium"
                  >
                    Tomorrow (1.5h)
                  </button>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Start Time *</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 transition duration-150 ${
                      isFormInvalid() === 'start_past'
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-border focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">End Time *</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 transition duration-150 ${
                      isFormInvalid() === 'end_before_start'
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-border focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Preview and Warnings */}
              {(formData.startTime || formData.endTime) && (
                <div className="p-3 bg-neutral-900 border border-border rounded-xl space-y-1 text-xs">
                  {formData.startTime && !isFormInvalid() && (
                    <div className="text-emerald-500 flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Selected Start: {getReadableDateTimeFormat(formData.startTime)}</span>
                    </div>
                  )}
                  {getDurationString() && !isFormInvalid() && (
                    <div className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <span>⏱️ Lecture Duration:</span>
                      <span className="text-foreground font-semibold">{getDurationString()}</span>
                    </div>
                  )}

                  {isFormInvalid() === 'start_past' && (
                    <div className="text-red-500 flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Start time cannot be in the past</span>
                    </div>
                  )}

                  {isFormInvalid() === 'end_before_start' && (
                    <div className="text-red-500 flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>End time must be after start time</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsScheduleOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isFormInvalid() || courses.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-transparent text-white rounded-lg font-semibold shadow-sm cursor-pointer transition duration-150"
                >
                  Schedule Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: End Class & Add Recording */}
      {isEndClassOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-red-50/10">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <Power className="w-5 h-5 text-red-500" />
                Conclude Lecture Session
              </h2>
              <button 
                onClick={() => setIsEndClassOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEndClassSubmit} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ending this class will notify students that the session has concluded and complete their attendance tracking.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Lecture Recording Link (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. YouTube, Cloudinary, Zoom, or Drive URL"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[10px] text-muted-foreground font-sans">
                  Students and parents can access this link at any time from their lecture archive histories.
                </p>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEndClassOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
                >
                  End & Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
