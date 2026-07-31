import { useEffect, useState, useCallback } from 'react';
import { parentAPI } from '../../services/api';
import { Bell, CheckCircle2, AlertTriangle, Info, RefreshCw, Paperclip, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { openOrDownloadFile } from '../../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../../components/ui/Card';

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentAPI.getNotifications();
      setNotifications(res?.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id || n._id);
      if (unreadIds.length === 0) return;
      await parentAPI.markNotificationsRead(unreadIds);
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Dispatch event to sync topbar unread badge
      window.dispatchEvent(new CustomEvent('notifications-marked-read'));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Sort and filter out expired notifications
  const sortedNotifications = [...notifications]
    .filter(n => !n.expiryDate || new Date(n.expiryDate) >= new Date())
    .sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const generalNotifications = sortedNotifications.filter(n => n.section === 'general' || n.section === 'system');
  const courseNotifications = sortedNotifications.filter(n => n.section === 'course');

  const displayNotifications = activeTab === 'general' ? generalNotifications : courseNotifications;
  const unreadCount = sortedNotifications.filter(n => !n.read).length;

  // Get color and icon based on notification type
  const getNotificationDetails = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          colorClass: 'bg-green-50/50 dark:bg-green-955/10 border-green-150 dark:border-green-900/20',
          iconColorClass: 'text-green-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          colorClass: 'bg-amber-50/50 dark:bg-amber-955/10 border-amber-150 dark:border-amber-900/20',
          iconColorClass: 'text-amber-500'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          colorClass: 'bg-red-50/50 dark:bg-red-955/10 border-red-150 dark:border-red-900/20',
          iconColorClass: 'text-red-500'
        };
      case 'info':
      default:
        return {
          icon: Info,
          colorClass: 'bg-blue-50/50 dark:bg-blue-955/10 border-blue-150 dark:border-blue-900/20',
          iconColorClass: 'text-blue-500'
        };
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title text-3xl font-bold font-display">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Important updates related to your child.
          </p>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Mark All Read
            </button>
          )}
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition bg-card hover:bg-muted text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'general'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          General
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'general' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {generalNotifications.length}
          </span>
          {activeTab === 'general' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('course')}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'course'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Teacher / Course
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'course' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {courseNotifications.length}
          </span>
          {activeTab === 'course' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'general' ? 'Academy Announcements' : "Child's Academic & Course Updates"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground font-medium">Loading notifications...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-foreground">No notifications available</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {activeTab === 'general'
                  ? 'All caught up! No general announcements have been posted for parents.'
                  : 'No course performance updates or academic alerts for your child yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayNotifications.map((notification) => {
                const details = getNotificationDetails(notification.type);
                const IconComponent = details.icon;
                return (
                  <div
                    key={notification.id || notification._id}
                    className={`border rounded-xl p-4 flex gap-4 transition hover:shadow-sm ${details.colorClass} ${
                      !notification.read ? 'border-primary/40 ring-1 ring-primary/10 bg-primary/[0.01]' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 flex items-center gap-1.5">
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0 animate-pulse" title="Unread" />
                      )}
                      <IconComponent className={`w-5 h-5 ${details.iconColorClass}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          {notification.title}
                        </h3>
                        {notification.courseName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                            {notification.courseName}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-foreground/85 mt-1.5 prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{notification.message}</ReactMarkdown>
                      </div>

                      {notification.attachment?.url && (
                        <div className="mt-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => openOrDownloadFile(notification.attachment.url, notification.attachment.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{notification.attachment.name || 'Attachment'}</span>
                            <Download className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
                          </button>
                        </div>
                      )}

                      {notification.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2.5">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}