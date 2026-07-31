import { useEffect, useState, useCallback } from 'react';
import { parentAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Primitives';
import { Video, User, Calendar, Clock, ExternalLink, Play, AlertCircle, RefreshCw } from 'lucide-react';

export default function ParentLiveClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentAPI.getLiveClasses();
      setClasses(res?.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load live classes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = classes.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'live') return item.status === 'live';
    if (activeTab === 'upcoming') return item.status === 'scheduled';
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-display">Live Classes</h1>
          <p className="mt-2 text-amber-100 max-w-xl">
            Monitor and join the live interactive sessions and scheduled webinars for your child.
          </p>
        </div>
        <button
          onClick={loadClasses}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 border border-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed w-fit cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <Button size="sm" variant="destructive" onClick={loadClasses}>Retry</Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'all', label: 'All Classes' },
          { id: 'live', label: 'Live Now' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors -mb-px flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 font-semibold'
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

      {/* Classes Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3 bg-card border rounded-2xl">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground font-medium">Loading live classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-2xl flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Video className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">No Classes Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {activeTab === 'all'
              ? "There are currently no live or scheduled classes for your child's courses."
              : `There are no ${activeTab} classes matching this filter.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses.map((item) => (
            <Card key={item._id} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
              item.status === 'live' ? 'border-rose-200 ring-1 ring-rose-100/50' : 'border-border'
            }`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-1">
                  <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md inline-block mb-1">
                    {item.courseId?.title || 'Course'}
                  </span>
                  <CardTitle className="text-lg font-bold leading-snug line-clamp-2">
                    {item.title}
                  </CardTitle>
                </div>
                <Badge variant={
                  item.status === 'live' ? 'destructive' :
                  item.status === 'scheduled' ? 'default' : 'outline'
                } className="flex-shrink-0 flex items-center px-2.5 py-1 text-xs capitalize">
                  {getStatusBadge(item.status)}
                  {item.status === 'scheduled' ? 'Upcoming' : item.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>
                      <strong className="text-foreground font-medium">Instructor: </strong>
                      {item.teacherId?.name || 'TBA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>{formatDate(item.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{formatTime(item.startTime, item.endTime)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
                  {item.status === 'live' ? (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition shadow-sm w-full sm:w-fit"
                    >
                      <span>Join Live Class</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : item.status === 'completed' ? (
                    item.recordingUrl ? (
                      <a
                        href={item.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-amber-500 text-amber-600 hover:bg-amber-50 rounded-lg text-sm font-semibold transition w-full sm:w-fit"
                      >
                        <Play className="w-4 h-4 fill-amber-600" />
                        <span>Watch Recording</span>
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground border border-transparent rounded-lg text-sm font-medium w-full sm:w-fit cursor-not-allowed"
                      >
                        Class Ended
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground border border-transparent rounded-lg text-sm font-medium w-full sm:w-fit cursor-not-allowed"
                    >
                      Upcoming Session
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
