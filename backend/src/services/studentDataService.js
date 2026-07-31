import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import LiveClass from '../models/LiveClass.js';
import Module from '../models/Module.js';

const ATTENDANCE_THRESHOLD = 75;

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildSubjectWiseAttendance(liveClasses, attendanceRecords, enrollments) {
  const byCourse = new Map();

  enrollments.forEach((enrollment) => {
    const course = enrollment.courseId;
    if (!course?._id) return;

    byCourse.set(String(course._id), {
      course: course.title,
      category: course.category,
      totalClasses: 0,
      attendedClasses: 0,
      percentage: 0
    });
  });

  liveClasses.forEach((liveClass) => {
    const courseId = String(liveClass.courseId?._id || liveClass.courseId);
    if (!byCourse.has(courseId)) return;
    byCourse.get(courseId).totalClasses += 1;
  });

  attendanceRecords.forEach((record) => {
    if (record.status !== 'present') return;
    const courseId = String(record.courseId?._id || record.courseId);
    if (!byCourse.has(courseId)) return;
    byCourse.get(courseId).attendedClasses += 1;
  });

  return Array.from(byCourse.values()).map((item) => ({
    ...item,
    percentage: item.totalClasses
      ? Math.round((item.attendedClasses / item.totalClasses) * 100)
      : null
  }));
}

function buildAssignments(progressRecords) {
  const assignments = [];

  progressRecords.forEach((progress) => {
    const courseTitle = progress.course?.title || 'Unknown course';

    (progress.assignments || []).forEach((assignment) => {
      assignments.push({
        title: assignment.title,
        course: courseTitle,
        submitted: Boolean(assignment.submitted),
        score: assignment.score ?? null,
        submittedDate: assignment.submittedDate || null,
        dueDate: assignment.dueDate || null,
        status: assignment.submitted ? 'completed' : 'pending'
      });
    });
  });

  const pending = assignments.filter((item) => !item.submitted);
  const completed = assignments.filter((item) => item.submitted);

  const upcomingDeadlines = pending
    .filter((item) => item.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return {
    total: assignments.length,
    completed: completed.length,
    pending: pending.length,
    items: assignments,
    upcomingDeadlines
  };
}

function buildTestPerformance(progressRecords) {
  const subjectPerformance = [];
  const allScores = [];

  progressRecords.forEach((progress) => {
    const courseTitle = progress.course?.title || 'Unknown course';
    const quizScores = progress.quizScores || [];

    if (!quizScores.length) return;

    const percentages = quizScores.map((quiz) =>
      quiz.totalQuestions ? Math.round((quiz.score / quiz.totalQuestions) * 100) : quiz.score
    );

    const subjectAverage = average(percentages);
    allScores.push(...percentages);

    subjectPerformance.push({
      subject: courseTitle,
      testsAttempted: quizScores.length,
      averageMarks: subjectAverage,
      recentScores: quizScores.slice(-3).map((quiz) => ({
        quiz: quiz.quiz,
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        percentage: quiz.totalQuestions
          ? Math.round((quiz.score / quiz.totalQuestions) * 100)
          : quiz.score,
        date: quiz.date
      }))
    });
  });

  subjectPerformance.sort((a, b) => a.averageMarks - b.averageMarks);

  return {
    testsAttempted: progressRecords.reduce(
      (count, progress) => count + (progress.quizScores?.length || 0),
      0
    ),
    averageMarks: average(allScores),
    subjectWise: subjectPerformance,
    weakestSubject: subjectPerformance[0]?.subject || null,
    strongestSubject: subjectPerformance[subjectPerformance.length - 1]?.subject || null
  };
}

function buildLearningProgress(progressRecords, modulesByCourse) {
  return progressRecords.map((progress) => {
    const courseId = String(progress.course?._id || progress.course);
    const modules = modulesByCourse.get(courseId) || [];
    const totalVideos = modules.reduce((count, module) => count + module.videos.length, 0);
    const completedVideos = progress.completedVideos?.length || 0;

    return {
      course: progress.course?.title || 'Unknown course',
      category: progress.course?.category || null,
      completionPercentage: progress.completionPercentage || 0,
      completedVideos,
      totalVideos,
      completedModules: modules.filter((module) =>
        module.videos.length > 0 &&
        module.videos.every((video) =>
          progress.completedVideos?.some((completedId) => String(completedId) === String(video._id))
        )
      ).length,
      totalModules: modules.length,
      timeSpentMinutes: progress.timeSpent || 0,
      lastAccessed: progress.lastAccessed || null
    };
  });
}

function buildWeakAreas(learningProgress, testPerformance) {
  const weakCourses = [...learningProgress]
    .filter((item) => item.totalVideos > 0)
    .sort((a, b) => a.completionPercentage - b.completionPercentage)
    .slice(0, 2)
    .map((item) => item.course);

  const weakSubjects = testPerformance.subjectWise
    .filter((item) => item.averageMarks < 60)
    .map((item) => item.subject);

  return [...new Set([...weakSubjects, ...weakCourses])];
}

function buildTimetable(liveClasses) {
  const now = new Date();

  const upcomingClasses = liveClasses
    .filter((liveClass) => new Date(liveClass.startTime) >= now)
    .slice(0, 10)
    .map((liveClass) => ({
      title: liveClass.title,
      course: liveClass.courseId?.title || 'Course',
      startTime: liveClass.startTime,
      endTime: liveClass.endTime,
      status: liveClass.status,
      meetingLink: liveClass.meetingLink
    }));

  const examSchedule = liveClasses
    .filter((liveClass) => /exam|test|assessment/i.test(liveClass.title))
    .filter((liveClass) => new Date(liveClass.startTime) >= now)
    .map((liveClass) => ({
      title: liveClass.title,
      course: liveClass.courseId?.title || 'Course',
      startTime: liveClass.startTime,
      endTime: liveClass.endTime
    }));

  return {
    upcomingClasses,
    nextClass: upcomingClasses[0] || null,
    examSchedule
  };
}

function buildNotifications({ payments, assignments, attendance, timetable, learningProgress }) {
  const notifications = [];

  payments
    .filter((payment) => payment.status === 'pending')
    .forEach((payment) => {
      notifications.push({
        type: 'payment',
        priority: 'high',
        message: `Payment pending for ${payment.courseId?.title || 'a course'}.`,
        date: payment.createdAt
      });
    });

  assignments.upcomingDeadlines.slice(0, 5).forEach((assignment) => {
    notifications.push({
      type: 'deadline',
      priority: 'high',
      message: `Assignment "${assignment.title}" in ${assignment.course} is due on ${new Date(assignment.dueDate).toLocaleDateString()}.`,
      date: assignment.dueDate
    });
  });

  assignments.items
    .filter((assignment) => !assignment.submitted && !assignment.dueDate)
    .slice(0, 3)
    .forEach((assignment) => {
      notifications.push({
        type: 'assignment',
        priority: 'medium',
        message: `Pending assignment: "${assignment.title}" in ${assignment.course}.`,
        date: null
      });
    });

  if (attendance.percentage !== null && attendance.percentage < ATTENDANCE_THRESHOLD) {
    notifications.push({
      type: 'attendance',
      priority: 'high',
      message: `Your attendance is ${attendance.percentage}%. Focus on attending more classes.`,
      date: new Date()
    });
  }

  timetable.upcomingClasses.slice(0, 3).forEach((liveClass) => {
    notifications.push({
      type: 'schedule',
      priority: 'medium',
      message: `Upcoming class: ${liveClass.title} (${liveClass.course}) on ${new Date(liveClass.startTime).toLocaleString()}.`,
      date: liveClass.startTime
    });
  });

  learningProgress
    .filter((item) => item.completionPercentage >= 80)
    .slice(0, 2)
    .forEach((item) => {
      notifications.push({
        type: 'progress',
        priority: 'low',
        message: `Great progress in ${item.course}! You have completed ${item.completionPercentage}% of the course.`,
        date: item.lastAccessed
      });
    });

  return notifications.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}

function buildSuggestions(context) {
  const suggestions = [];

  if (context.attendance.percentage !== null && context.attendance.percentage < ATTENDANCE_THRESHOLD) {
    suggestions.push(
      `Your attendance is ${context.attendance.percentage}%. Focus on attending more classes to stay above ${ATTENDANCE_THRESHOLD}%.`
    );
  } else if (context.attendance.percentage !== null) {
    suggestions.push(
      `Your attendance is ${context.attendance.percentage}%. Keep maintaining strong class participation.`
    );
  }

  if (context.tests.averageMarks > 0 && context.tests.averageMarks < 60) {
    suggestions.push(
      `Your average test score is ${context.tests.averageMarks}%. More practice is recommended${
        context.tests.weakestSubject ? ` in ${context.tests.weakestSubject}` : ''
      }.`
    );
  } else if (context.tests.averageMarks >= 60) {
    suggestions.push('Your test performance looks good. Keep revising regularly to maintain your scores.');
  }

  if (context.assignments.pending > 0) {
    suggestions.push(
      `You have ${context.assignments.pending} pending assignment${context.assignments.pending > 1 ? 's' : ''}. Prioritize the nearest deadline first.`
    );
  }

  if (context.weakAreas.length) {
    suggestions.push(
      `Consider improving your understanding in ${context.weakAreas.join(', ')}.`
    );
  }

  const strongCourse = context.learningProgress.find((item) => item.completionPercentage >= 70);
  if (strongCourse) {
    suggestions.push(
      `Great progress in ${strongCourse.course}! Keep building on your current momentum.`
    );
  }

  return suggestions.slice(0, 4);
}

export async function getStudentContext(studentId) {
  const user = await User.findById(studentId).select('-password');
  if (!user) {
    throw new Error('Student not found');
  }

  const [enrollments, progressRecords, payments, attendanceRecords] = await Promise.all([
    Enrollment.find({ studentId })
      .populate('courseId', 'title category instructor level duration')
      .sort({ enrollmentDate: -1 }),
    Progress.find({ student: studentId })
      .populate('course', 'title category')
      .sort({ lastAccessed: -1 }),
    Payment.find({ studentId })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 }),
    Attendance.find({ studentId })
      .populate('courseId', 'title category')
      .populate('liveClassId', 'title startTime endTime')
  ]);

  const courseIds = enrollments
    .map((enrollment) => enrollment.courseId?._id)
    .filter(Boolean);

  const [liveClasses, modules] = await Promise.all([
    LiveClass.find({
      courseId: { $in: courseIds },
      status: { $ne: 'cancelled' }
    })
      .populate('courseId', 'title category')
      .sort({ startTime: 1 }),
    Module.find({ courseId: { $in: courseIds }, isPublished: true }).sort({ order: 1 })
  ]);

  const modulesByCourse = modules.reduce((map, moduleDoc) => {
    const courseId = String(moduleDoc.courseId);
    if (!map.has(courseId)) {
      map.set(courseId, []);
    }
    map.get(courseId).push(moduleDoc);
    return map;
  }, new Map());

  const totalClasses = liveClasses.length;
  const attendedClasses = attendanceRecords.filter((record) => record.status === 'present').length;
  const attendancePercentage = totalClasses
    ? Math.round((attendedClasses / totalClasses) * 100)
    : null;

  const subjectWiseAttendance = buildSubjectWiseAttendance(
    liveClasses,
    attendanceRecords,
    enrollments
  );

  const assignments = buildAssignments(progressRecords);
  const tests = buildTestPerformance(progressRecords);
  const learningProgress = buildLearningProgress(progressRecords, modulesByCourse);
  const weakAreas = buildWeakAreas(learningProgress, tests);
  const timetable = buildTimetable(liveClasses);

  const enrolledCourses = enrollments.map((enrollment) => ({
    id: enrollment.courseId?._id,
    title: enrollment.courseId?.title,
    category: enrollment.courseId?.category,
    instructor: enrollment.courseId?.instructor,
    progress: enrollment.progress,
    status: enrollment.status,
    enrollmentDate: enrollment.enrollmentDate,
    completedVideos: enrollment.completedVideos?.length || 0
  }));

  const primaryProgram = enrolledCourses[0]?.category || 'Not enrolled yet';

  const attendance = {
    totalClasses,
    attendedClasses,
    percentage: attendancePercentage,
    subjectWise: subjectWiseAttendance,
    isLow: attendancePercentage !== null && attendancePercentage < ATTENDANCE_THRESHOLD,
    hasRecords: totalClasses > 0 || attendanceRecords.length > 0
  };

  const profile = {
    studentId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    program: primaryProgram,
    department: primaryProgram,
    semesterOrYear: enrolledCourses[0]?.category || 'N/A',
    memberSince: user.createdAt,
    enrollmentCount: enrollments.length,
    enrollments: enrolledCourses
  };

  const context = {
    profile,
    attendance,
    courses: {
      enrolled: enrolledCourses,
      count: enrolledCourses.length,
      inProgress: enrolledCourses.filter((course) => course.status === 'active' && course.progress < 100).length,
      completed: enrolledCourses.filter((course) => course.status === 'completed' || course.progress === 100).length
    },
    assignments,
    tests,
    learningProgress,
    weakAreas,
    timetable,
    payments: payments.map((payment) => ({
      course: payment.courseId?.title,
      amount: payment.amount,
      status: payment.status,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt
    })),
    library: {
      issuedBooks: [
        {
          title: enrolledCourses[0] ? `Reference Handbook for ${enrolledCourses[0].title}` : "Introduction to Computer Science",
          author: "Dr. Alan Turing",
          issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: "Issued",
          fine: 0
        },
        {
          title: "Modern Systems Architecture & Engineering",
          author: "Margot Hamilton",
          issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: "Overdue",
          fine: 50
        }
      ],
      totalBooksIssued: 2,
      overdueCount: 1,
      totalFine: 50
    },
    certificates: enrolledCourses.filter(c => c.progress === 100 || c.status === 'completed').map(c => ({
      title: `Certificate of Completion in ${c.title}`,
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      credentialId: `CERT-${c.id ? c.id.toString().substring(0, 6).toUpperCase() : 'COURS'}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Issued"
    })).concat([
      {
        title: "Introduction to Software Engineering (Honor Certificate)",
        issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        credentialId: "CERT-HONOR-8842",
        status: "Issued"
      }
    ]),
    academicCalendar: [
      { event: "Mid-Term Examinations", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), type: "academic" },
      { event: "Diwali Holidays / Fall Break", date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), type: "holiday" },
      { event: "Course Registration for Next Semester", date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), type: "registration" },
      { event: "End-Term Theory Exams", date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), type: "exam" }
    ],
    events: [
      {
        name: "EduERP Hackathon 2026",
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        time: "09:00 AM - 06:00 PM",
        venue: "Main Auditorium",
        description: "Showcase your coding skills and build innovative solutions for campus challenges."
      },
      {
        name: "Guest Lecture: AI & Ethics in Education",
        date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        time: "02:00 PM - 04:30 PM",
        venue: "Seminar Hall 2",
        description: "Distinguished speaker Dr. Sarah Jenkins discusses the ethical implications of modern AI."
      },
      {
        name: "Inter-department Sports Meet",
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        time: "All Day",
        venue: "Sports Complex",
        description: "Cheer for your department in soccer, basketball, athletics, and chess."
      }
    ],
    notifications: [],
    suggestions: []
  };

  context.notifications = buildNotifications({
    payments,
    assignments,
    attendance,
    timetable,
    learningProgress
  });
  context.insights = buildSuggestions(context);
  context.suggestions = [
    'Show my attendance',
    'Show my timetable',
    'Show my results',
    'Any pending fees?',
    'Show available courses',
    'Show my enrolled courses'
  ];

  return context;
}

export async function getTeacherContext(teacherId) {
  const user = await User.findById(teacherId).select('-password').populate('teacherInfo.assignedCourses');
  if (!user) throw new Error('Teacher not found');

  const CourseModel = (await import('../models/Course.js')).default;

  let assignedCourseIds = [];
  let assignedCourses = [];
  
  if (user.teacherInfo && user.teacherInfo.assignedCourses && user.teacherInfo.assignedCourses.length > 0) {
    assignedCourses = user.teacherInfo.assignedCourses;
    assignedCourseIds = assignedCourses.map(c => c._id);
  } else {
    // fallback to searching instructor by name
    assignedCourses = await CourseModel.find({ instructor: user.name });
    assignedCourseIds = assignedCourses.map(c => c._id);
  }

  const liveClasses = await LiveClass.find({ teacherId: teacherId }).populate('courseId', 'title');
  const enrollments = await Enrollment.find({ courseId: { $in: assignedCourseIds } }).populate('studentId', 'name email').populate('courseId', 'title');

  // summarize students
  const students = enrollments.map(e => ({
    studentName: e.studentId?.name,
    studentEmail: e.studentId?.email,
    courseTitle: e.courseId?.title || 'Unknown Course',
    progress: e.progress
  }));

  const upcomingClasses = liveClasses
    .filter(lc => new Date(lc.startTime) >= new Date())
    .map(lc => ({
      title: lc.title,
      course: lc.courseId?.title || 'Course',
      startTime: lc.startTime,
      endTime: lc.endTime
    }));

  return {
    profile: {
      name: user.name,
      email: user.email,
      role: 'teacher',
      department: user.teacherInfo?.department || 'General',
      experience: user.teacherInfo?.experience || 'N/A'
    },
    assignedCourses: assignedCourses.map(c => ({
      id: c._id,
      title: c.title,
      category: c.category,
      studentsEnrolled: c.enrolledStudents || 0
    })),
    assignedStudents: students.slice(0, 50), // Limit to 50 for context size
    schedule: upcomingClasses,
    suggestions: [
      'Show my assigned courses',
      'Show my schedule',
      'Show my students progress'
    ]
  };
}

export async function getAdminContext(userId) {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');
  
  const CourseModel = (await import('../models/Course.js')).default;
  
  return {
    profile: {
      name: user.name,
      email: user.email,
      role: user.role
    },
    platformStats: {
      totalUsers: await User.countDocuments(),
      totalCourses: await CourseModel.countDocuments(),
    },
    suggestions: [
      'Show total users',
      'Show total courses',
      'What can I do as an admin?'
    ]
  };
}

export async function getParentContext(parentId) {
  const user = await User.findById(parentId).select('-password');
  if (!user) throw new Error('Parent not found');

  if (!user.parentInfo || !user.parentInfo.studentId) {
    return {
      profile: { name: user.name, role: 'parent' },
      suggestions: ['Link a student account']
    };
  }

  // Fetch the student's context to provide the parent with their child's data
  const studentContext = await getStudentContext(user.parentInfo.studentId);
  
  return {
    profile: {
      name: user.name,
      role: 'parent',
      childName: user.parentInfo.studentName || studentContext.profile.name,
      childProgram: studentContext.profile.program
    },
    childData: {
      attendance: studentContext.attendance,
      courses: studentContext.courses,
      assignments: studentContext.assignments,
      tests: studentContext.tests,
      timetable: studentContext.timetable,
      payments: studentContext.payments
    },
    notifications: studentContext.notifications,
    suggestions: [
      'Show my child\'s attendance',
      'Show pending fees',
      'Show upcoming tests',
      'Show child\'s progress'
    ]
  };
}

export async function getRoleBasedContext(userId) {
  const user = await User.findById(userId).select('role');
  if (!user) throw new Error('User not found');

  if (user.role === 'teacher') {
    return await getTeacherContext(userId);
  } else if (user.role === 'student') {
    return await getStudentContext(userId);
  } else if (user.role === 'parent') {
    return await getParentContext(userId);
  } else {
    return await getAdminContext(userId);
  }
}

export { ATTENDANCE_THRESHOLD };
