import { useEffect, useState } from 'react';
import { parentAPI } from '../../services/api';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../../components/ui/Card';

export default function ParentProgress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await parentAPI.getProgress();
        setProgress(res?.data?.data || []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load progress records. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title text-3xl font-bold">Child Progress</h1>

        <p className="text-muted-foreground mt-1">
          Monitor course completion and performance.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Academic Progress</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground font-medium">Loading progress records...</p>
            </div>
          ) : progress.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No progress records found.
            </p>
          ) : (
            <div className="space-y-4">
              {progress.map((item) => (
                <div
                  key={item?._id}
                  className="border rounded-xl p-4 transition hover:shadow-sm"
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold text-foreground">
                      {item?.course?.title}
                    </h3>

                    <span className="font-medium text-sm">
                      {item?.completionPercentage || 0}%
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${item?.completionPercentage || 0}%`
                      }}
                    />
                  </div>

                  <div className="mt-3 text-sm text-muted-foreground">
                    Time Spent: {item?.timeSpent || 0} mins
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