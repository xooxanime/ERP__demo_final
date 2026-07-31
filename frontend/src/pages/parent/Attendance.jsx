import { useEffect, useState } from 'react';
import { parentAPI } from '../../services/api';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../../components/ui/Card';

import { CalendarDays } from 'lucide-react';

export default function ParentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await parentAPI.getAttendance();
        setAttendance(res?.data?.data || []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load attendance records. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title text-3xl font-bold">Attendance Overview</h1>

        <p className="text-muted-foreground mt-1">
          Track your child's attendance and activity.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Course Attendance</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground font-medium">Loading attendance records...</p>
            </div>
          ) : attendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No attendance records found.
            </p>
          ) : (
            <div className="space-y-4">
              {attendance.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-xl p-4 transition hover:shadow-sm"
                >
                  <div className="flex justify-between items-center w-full flex-wrap gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {item?.course}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Last Access:{' '}
                          {item?.lastAccessedDate
                            ? new Date(item.lastAccessedDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Attendance details */}
                    <div className="flex flex-col text-left min-w-[150px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Class Attendance</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-foreground">{item?.attendanceRate ?? 100}%</span>
                        <span className="text-[10px] text-muted-foreground">({item?.total || 0} classes logged)</span>
                      </div>
                      <div className="flex gap-2 text-[10px] font-bold text-muted-foreground mt-1">
                        <span className="text-emerald-500">P: {item?.present || 0}</span>
                        <span className="text-rose-500">A: {item?.absent || 0}</span>
                        <span className="text-amber-500">L: {item?.late || 0}</span>
                        <span className="text-blue-500">Lv: {item?.leave || 0}</span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="text-right min-w-[100px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Course Progress</span>
                      <div className="font-bold text-sm text-foreground">
                        {item?.progress || 0}%
                      </div>
                      <div
                        className={`text-xs capitalize font-bold mt-0.5 ${
                          item?.status === 'completed'
                            ? 'text-emerald-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {item?.status || 'active'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}