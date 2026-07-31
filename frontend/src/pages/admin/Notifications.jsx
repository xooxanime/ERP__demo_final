import { useCallback } from 'react';
import NotificationManager from '../../components/notifications/NotificationManager';
import { adminAPI, courseAPI } from '../../services/api';

export default function AdminNotifications() {
  const loadCourses = useCallback(async () => {
    const res = await courseAPI.getAll();
    return res?.data?.data?.courses || [];
  }, []);

  const loadStudents = useCallback(async () => {
    const res = await adminAPI.getStudents();
    return res?.data?.data?.students || [];
  }, []);

  return (
    <NotificationManager
      accent="violet"
      heading="Notification Management"
      subheading="Send system-wide announcements or target a specific course or student. Admin notifications can reach all students."
      allowAllStudents
      showSender
      loadCourses={loadCourses}
      loadStudents={loadStudents}
      sendNotification={adminAPI.sendNotification}
      listNotifications={adminAPI.getNotifications}
    />
  );
}
