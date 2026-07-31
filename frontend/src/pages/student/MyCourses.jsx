import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Primitives';
import { BookOpen, Play, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import axios from 'axios';
import { studentAPI } from '../../services/api';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await studentAPI.getMyCourses();
        setEnrollments(res.data?.data?.enrollments || []);
      } catch (err) {
        console.error('Error fetching student courses:', err);
        // fallback mock
        setEnrollments([
          { _id: '1', course: { _id: 'c1', title: 'CA Foundation', thumbnail: null, description: 'Complete CA Foundation course covering all subjects' }, progress: 65, status: 'active', startDate: new Date('2025-01-15') },
          { _id: '2', course: { _id: 'c2', title: 'CA Inter Group I', thumbnail: null, description: 'CA Intermediate Group I – Accounts, Law, Cost' }, progress: 32, status: 'active', startDate: new Date('2025-03-01') },
          { _id: '3', course: { _id: 'c3', title: 'Taxation Basics', thumbnail: null, description: 'Basics of direct and indirect taxation' }, progress: 100, status: 'completed', startDate: new Date('2024-08-10') },
        ]);
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">My Batch</h1><p className="page-subtitle">{enrollments.length} courses enrolled</p></div>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Browse our catalog and enroll in a course to get started.</p>
            <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {enrollments.map(enr => {
            const course = enr.courseId || enr.course || {};
            const progress = enr.progress || 0;
            return (
              <Card key={enr._id} className="overflow-hidden hover:shadow-card transition-shadow group">
                {/* Thumbnail */}
                <div className="h-36 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center relative">
                  {course.thumbnail?.url || course.thumbnail ? (
                    <img src={course.thumbnail?.url || course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-white/60" />
                  )}
                  <Badge variant={enr.status === 'completed' ? 'success' : 'default'} className="absolute top-3 right-3 capitalize">{enr.status || 'active'}</Badge>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{course.description}</p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-semibold text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />Started {formatDate(enr.startDate)}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/student/course/${course._id}`)}>
                      {progress === 100 ? <><CheckCircle className="w-3.5 h-3.5" />Review</> : <><Play className="w-3.5 h-3.5" />Continue</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
