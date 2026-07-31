import { useEffect, useState, useCallback } from 'react';
import { parentAPI } from '../../services/api';
import {
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Primitives';

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentAPI.getDashboard();
      setDashboard(res?.data?.data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const student = dashboard?.student;
  const stats = dashboard?.stats;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Parent Dashboard
          </h1>

          <p className="mt-2 text-amber-100">
            Monitor your child's academic progress and course activity.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 border border-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>

        <CardContent>
          {loading && !dashboard ? (
            <p className="text-muted-foreground">Loading student details...</p>
          ) : student ? (
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {student?.name}
              </p>

              <p>
                <strong>Email:</strong> {student?.email}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No student linked to this parent account.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          loading={loading}
        />

        <StatCard
          title="Average Progress"
          value={`${stats?.avgProgress || 0}%`}
          icon={TrendingUp}
          loading={loading}
        />

        <StatCard
          title="Completed Courses"
          value={stats?.completedCourses || 0}
          icon={CheckCircle}
          loading={loading}
        />

        <StatCard
          title="Linked Student"
          value={student ? 1 : 0}
          icon={Users}
          loading={loading}
        />
      </div>

      {/* Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
        </CardHeader>

        <CardContent>
          {loading && !dashboard ? (
            <p className="text-muted-foreground">Loading courses...</p>
          ) : dashboard?.enrollments?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.enrollments.map((enrollment) => (
                <div
                  key={enrollment?._id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">
                      {enrollment?.courseId?.title}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Progress: {enrollment?.progress || 0}%
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs capitalize ${
                      enrollment?.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {enrollment?.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No courses found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}