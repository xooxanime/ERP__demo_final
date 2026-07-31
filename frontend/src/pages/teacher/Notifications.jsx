import { useCallback } from 'react';
import NotificationManager from '../../components/notifications/NotificationManager';
import { teacherAPI } from '../../services/api';

export default function TeacherNotifications() {
  const loadCourses = useCallback(async () => {
    const res = await teacherAPI.getCourses();
    return res?.data?.data?.courses || [];
  }, []);

  // Teacher students come back as enrollments; flatten to a unique student list.
  const loadStudents = useCallback(async () => {
    const res = await teacherAPI.getStudents();
    const enrollments = res?.data?.data?.enrollments || [];
    const map = new Map();
    enrollments.forEach((e) => {
      const s = e.studentId;
      if (s && s._id && !map.has(s._id)) {
        map.set(s._id, { _id: s._id, name: s.name, email: s.email });
      }
    });
    return Array.from(map.values());
  }, []);

  return (
    <NotificationManager
      accent="emerald"
      heading="Notification Management"
      subheading="Send notifications to the courses you teach or to an individual student in your batches."
      allowAllStudents={false}
      showSender={false}
      loadCourses={loadCourses}
      loadStudents={loadStudents}
      sendNotification={teacherAPI.sendNotification}
      listNotifications={teacherAPI.getNotifications}
    />
  );
}
