import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Primitives';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, Users, BookOpen, CreditCard } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', revenue: 145000, students: 28 },
  { month: 'Feb', revenue: 162000, students: 32 },
  { month: 'Mar', revenue: 189000, students: 41 },
  { month: 'Apr', revenue: 175000, students: 38 },
  { month: 'May', revenue: 210000, students: 47 },
  { month: 'Jun', revenue: 198000, students: 44 },
  { month: 'Jul', revenue: 225000, students: 52 },
  { month: 'Aug', revenue: 241000, students: 58 },
];

const courseEnrollData = [
  { name: 'CA Foundation', students: 95, color: '#3b82f6' },
  { name: 'CA Inter', students: 82, color: '#8b5cf6' },
  { name: 'CA Final', students: 54, color: '#10b981' },
  { name: 'Other', students: 16, color: '#f59e0b' },
];

const attendanceData = [
  { batch: 'CA Final A', attendance: 88 },
  { batch: 'CA Final B', attendance: 79 },
  { batch: 'CA Inter A', attendance: 91 },
  { batch: 'CA Inter B', attendance: 74 },
  { batch: 'CA Foundation', attendance: 85 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-elevated text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' && p.name?.includes('Revenue') ? formatCurrency(p.value) : p.value}</span></p>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics & Reports</h1>
        <p className="page-subtitle">Business intelligence overview for the current academic year</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(1575000)} icon={CreditCard} color="blue" trend="up" trendValue={18} />
        <StatCard title="Total Enrollments" value="340" icon={Users} color="green" trend="up" trendValue={12} />
        <StatCard title="Active Courses" value="12" icon={BookOpen} color="violet" trend="up" trendValue={8} />
        <StatCard title="Avg Revenue/Student" value={formatCurrency(4632)} icon={TrendingUp} color="amber" trend="up" trendValue={5} />
      </div>

      {/* Revenue & Enrollment Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue & Enrollment Trend</CardTitle>
            <Badge variant="success">↑ 18% this month</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <YAxis yAxisId="stu" orientation="right" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
              <Area yAxisId="stu" type="monotone" dataKey="students" name="New Students" stroke="#10b981" strokeWidth={2} fill="url(#stuGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Course Distribution */}
        <Card>
          <CardHeader><CardTitle>Course Enrollment Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={courseEnrollData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="students">
                    {courseEnrollData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Students']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {courseEnrollData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold text-sm">{item.students}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance by Batch */}
        <Card>
          <CardHeader><CardTitle>Attendance by Batch</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="batch" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={v => [`${v}%`, 'Attendance']} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="attendance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
