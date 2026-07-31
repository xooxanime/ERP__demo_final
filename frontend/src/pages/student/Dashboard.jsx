import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Video, ClipboardList, Award, CreditCard, Bell,
  ArrowRight, CheckCircle, Clock, PlayCircle, Calendar
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/Primitives';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Spinner } from '../../components/ui/Primitives';
import { formatDate } from '../../lib/utils';
import { studentAPI, batchAPI, assessmentAPI } from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await studentAPI.getMyCourses();
        setCourses(res.data?.data?.enrollments || []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveClasses = async () => {
      try {
        const res = await studentAPI.getLiveClasses();
        setLiveClasses(res.data?.data || []);
      } catch {
        setLiveClasses([]);
      } finally {
        setClassesLoading(false);
      }
    };

    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);
        const res = await batchAPI.getStudentAttendance();
        setAttendanceList(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load attendance:', err);
        setAttendanceList([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    const fetchBatchAndAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        const batchRes = await batchAPI.getStudentBatch();
        const batch = batchRes.data?.data?.batch;
        if (batch) {
          const assignmentsRes = await batchAPI.getAssignments(batch._id);
          setAssignments(assignmentsRes.data?.data?.assignments || []);
        }
      } catch (err) {
        console.error('Failed to load batch or assignments:', err);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    const fetchResults = async () => {
      try {
        setResultsLoading(true);
        const res = await assessmentAPI.getStudentResults();
        setResults(res.data?.data?.results || []);
      } catch (err) {
        console.error('Failed to load test results:', err);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchCourses();
    fetchLiveClasses();
    fetchAttendance();
    fetchBatchAndAssignments();
    fetchResults();
  }, []);

  const totalClasses = attendanceList.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalAttended = attendanceList.reduce((sum, item) => sum + ((item.present || 0) + (item.late || 0) + (item.leave || 0)), 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;
  
  const presentCount = attendanceList.reduce((sum, item) => sum + (item.present || 0), 0);
  const absentCount = attendanceList.reduce((sum, item) => sum + (item.absent || 0), 0);
  const lateCount = attendanceList.reduce((sum, item) => sum + (item.late || 0), 0);
  const leaveCount = attendanceList.reduce((sum, item) => sum + (item.leave || 0), 0);

  const attendanceData = attendanceList.map(item => ({
    subject: item.courseTitle || 'General',
    attendance: item.percentage
  }));

  // Only upcoming + currently live classes, soonest first, capped to 4 for the widget
  const upcomingClasses = liveClasses
    .filter((c) => c.status === 'live' || c.status === 'scheduled')
    .sort((a, b) => {
      // live classes always float to the top, then by start time
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return new Date(a.startTime) - new Date(b.startTime);
    })
    .slice(0, 4);

  const formatClassTime = (startStr) => {
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return '';
    const today = new Date();
    const isToday = start.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = start.toDateString() === tomorrow.toDateString();
    const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${time}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="page-header">
        <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-primary-100 mt-1 text-sm">
                {upcomingClasses.length > 0
                  ? `You have ${upcomingClasses.length} upcoming ${upcomingClasses.length === 1 ? 'class' : 'classes'} for your enrolled courses.`
                  : 'No upcoming live classes scheduled right now.'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Batch Courses" value={courses.length} icon={BookOpen} color="blue" loading={loading} />
        <StatCard title="Avg Attendance" value={attendanceLoading ? "..." : `${overallPercentage}%`} icon={CheckCircle} color="green" subtitle={attendanceLoading ? "" : `${presentCount} Present, ${absentCount} Absent`} />
        <StatCard title="Assignments Due" value={assignmentsLoading ? "..." : assignments.filter(a => !a.submission).length} icon={ClipboardList} color="amber" subtitle={assignmentsLoading ? "" : `${assignments.length} Total`} />
        <StatCard title="Tests Completed" value={resultsLoading ? "..." : results.length} icon={Award} color="violet" subtitle={resultsLoading ? "" : "Graded exams"} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card>
          <CardHeader><CardTitle>Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : attendanceList.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">No attendance records found.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={attendanceData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-2 text-center mt-4 pt-4 border-t border-border/60 text-xs font-semibold">
                  <div>
                    <span className="block font-bold text-emerald-500">{presentCount}</span>
                    <span className="text-[9px] text-muted-foreground font-normal">Present</span>
                  </div>
                  <div>
                    <span className="block font-bold text-rose-500">{absentCount}</span>
                    <span className="text-[9px] text-muted-foreground font-normal">Absent</span>
                  </div>
                  <div>
                    <span className="block font-bold text-amber-500">{lateCount}</span>
                    <span className="text-[9px] text-muted-foreground font-normal">Late</span>
                  </div>
                  <div>
                    <span className="block font-bold text-blue-500">{leaveCount}</span>
                    <span className="text-[9px] text-muted-foreground font-normal">Leave</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Classes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/live-classes')}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {classesLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Spinner size="md" />
                <p className="text-xs text-muted-foreground">Loading your class schedule...</p>
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No upcoming classes</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Live classes for your enrolled courses will appear here once your teachers schedule them.
                </p>
              </div>
            ) : (
              upcomingClasses.map(cls => {
                const isLive = cls.status === 'live';
                return (
                  <div key={cls._id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors group">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${isLive ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                      {isLive ? <Video className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{cls.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {cls.courseId?.title || 'Course'} · {cls.teacherId?.name || 'Instructor'} · {formatClassTime(cls.startTime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={isLive ? 'destructive' : 'secondary'}>{isLive ? 'Live' : 'Upcoming'}</Badge>
                      <Button
                        size="sm"
                        variant={isLive ? 'default' : 'ghost'}
                        onClick={() => navigate('/student/live-classes')}
                      >
                        {isLive ? 'Join' : 'View'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assignments</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/my-courses')}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4"><Spinner size="sm" /></TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No assignments assigned</TableCell>
                  </TableRow>
                ) : (
                  assignments.slice(0, 5).map(a => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium text-sm">{a.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.courseId?.title || 'General'}</TableCell>
                      <TableCell className="text-sm">
                        {a.submission ? 'Submitted' : a.isOverdue ? 'Overdue' : new Date(a.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.submission ? 'success' : a.isOverdue ? 'destructive' : 'warning'} className="capitalize">
                          {a.submission ? (a.submission.status || 'Submitted') : a.isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader><CardTitle>Quick Access</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'My Batch', icon: BookOpen, color: 'text-primary bg-primary/10', path: '/student/my-courses' },
                { label: 'Pay Fees', icon: CreditCard, color: 'text-emerald-600 bg-emerald-500/10', path: '/student/payments' },
                { label: 'Notifications', icon: Bell, color: 'text-amber-600 bg-amber-500/10', path: '/student/notifications' },
              ].map(item => (
                <button key={item.label} onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-card transition-all group">
                  <div className={`p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
