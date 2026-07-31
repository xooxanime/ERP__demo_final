import { useEffect, useState } from 'react';
import { parentAPI } from '../../services/api';

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { BookOpen } from 'lucide-react';

export default function ParentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await parentAPI.getCourses();
        setCourses(res?.data?.data || []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load enrolled courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title text-3xl font-bold">Child Courses</h1>
        <p className="text-muted-foreground mt-1">
          View all enrolled courses of your child.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
        </CardHeader>

        <CardContent> 
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground font-medium">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No courses found.
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map((item) => (
                <div
                  key={item?.enrollmentId || item?._id}
                  className="border rounded-xl p-4 flex items-center justify-between transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />

                    <div>
                      <h3 className="font-semibold text-foreground">
                        {item?.course?.title}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Progress: {item?.progress || 0}%
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs capitalize ${
                      item?.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item?.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}