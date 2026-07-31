import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users, BookOpen, Video, ClipboardList, CalendarDays,
  Megaphone, ArrowRight, CheckCircle, Clock, TrendingUp
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/Primitives';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Avatar } from '../../components/ui/Avatar';

const performanceData = [
  { batch: 'Batch A', avgScore: 72, attendance: 88 },
  { batch: 'Batch B', avgScore: 65, attendance: 76 },
  { batch: 'Batch C', avgScore: 79, attendance: 92 },
];

const RECENT_STUDENTS = [
  { name: 'Ravi Kumar', batch: 'CA Final Batch A', attendance: '92%', lastSeen: '2 hours ago' },
  { name: 'Priya Sharma', batch: 'CA Inter Batch B', attendance: '78%', lastSeen: '1 day ago' },
  { name: 'Arjun Singh', batch: 'CA Final Batch A', attendance: '85%', lastSeen: '3 hours ago' },
  { name: 'Neha Patel', batch: 'CA Inter Batch C', attendance: '95%', lastSeen: 'Online now' },
];

const TODAY_SCHEDULE = [
  { time: '10:00 AM', title: 'Advanced Auditing', batch: 'CA Final Batch A', type: 'live' },
  { time: '2:00 PM', title: 'Corporate Law', batch: 'CA Inter Batch B', type: 'live' },
  { time: '4:30 PM', title: 'Doubt Session', batch: 'All Batches', type: 'live' },
];

const PENDING_EVALUATIONS = [
  { student: 'Ravi Kumar', assignment: 'AS-15 Case Study', submitted: '2 hours ago', status: 'pending' },
  { student: 'Priya Sharma', assignment: 'SEBI Regulations', submitted: '1 day ago', status: 'pending' },
  { student: 'Arjun Singh', assignment: 'Ratio Analysis', submitted: '3 days ago', status: 'graded' },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold font-display">Welcome, {user?.name?.split(' ')[0]}! 👨‍🏫</h1>
          <p className="text-emerald-100 mt-1 text-sm">You have 3 classes scheduled today and 2 assignments to evaluate.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value="86" icon={Users} color="blue" trend="up" trendValue={8} />
        <StatCard title="Active Batches" value="3" icon={BookOpen} color="green" subtitle="Running this term" />
        <StatCard title="Classes Today" value="3" icon={Video} color="violet" />
        <StatCard title="Pending Reviews" value="12" icon={ClipboardList} color="amber" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Batch Performance Chart */}
        <Card>
          <CardHeader><CardTitle>Batch Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={performanceData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="batch" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="avgScore" name="Avg Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Schedule</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/live-classes')}>Manage <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {TODAY_SCHEDULE.map((cls, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors group">
                <div className="text-right min-w-[70px]">
                  <p className="text-sm font-semibold text-foreground">{cls.time}</p>
                  <p className="text-xs text-muted-foreground uppercase">{cls.type}</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{cls.title}</p>
                  <p className="text-xs text-muted-foreground">{cls.batch}</p>
                </div>
                <Button size="sm" className="hidden group-hover:flex" onClick={() => navigate('/teacher/live-classes')}>Start Class</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/batches')}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_STUDENTS.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} size="sm" />
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.batch}</TableCell>
                    <TableCell>
                      <Badge variant={parseFloat(s.attendance) >= 85 ? 'success' : 'warning'}>{s.attendance}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.lastSeen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Evaluations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Evaluations</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/batches')}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PENDING_EVALUATIONS.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{e.student}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.assignment}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.submitted}</TableCell>
                    <TableCell>
                      {e.status === 'pending'
                        ? <Button size="sm" variant="outline">Grade</Button>
                        : <Badge variant="success">Graded</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
