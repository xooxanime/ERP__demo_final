import { ATTENDANCE_THRESHOLD } from './studentDataService.js';

function formatDate(value) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function matchesIntent(message, keywords) {
  const normalized = message.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function buildGreeting(context) {
  const name = context.profile.name?.split(' ')[0] || 'there';
  return `Hi ${name} 👋, how may I help you today?\n\nI can help with your attendance, courses, assignments, test scores, learning progress, schedule, and notifications.`;
}

function buildAttendanceResponse(context) {
  const { attendance } = context;

  if (!attendance.hasRecords) {
    return 'No live class attendance records are available yet. Once your classes are scheduled and tracked, I can show your attendance here.';
  }

  const subjectLines = attendance.subjectWise
    .filter((item) => item.totalClasses > 0)
    .map(
      (item) =>
        `- ${item.course}: ${item.attendedClasses}/${item.totalClasses} classes (${item.percentage}%)`
    )
    .join('\n');

  let response = `Your current attendance is **${attendance.percentage}%** (${attendance.attendedClasses}/${attendance.totalClasses} classes attended).`;

  if (attendance.isLow) {
    response += `\n\nYour attendance is below the recommended level of ${ATTENDANCE_THRESHOLD}%. I suggest attending more classes to stay on track.`;
  } else {
    response += '\n\nYour attendance is good. Try to maintain it above 75%.';
  }

  if (subjectLines) {
    response += `\n\n**Subject-wise attendance:**\n${subjectLines}`;
  }

  return response;
}

function buildCoursesResponse(context) {
  if (!context.courses.count) {
    return 'You are not enrolled in any courses yet. Browse available courses from the Courses section to get started.';
  }

  const courseLines = context.courses.enrolled
    .map(
      (course) =>
        `- **${course.title}** (${course.category}) — ${course.progress}% complete, status: ${course.status}`
    )
    .join('\n');

  return `You are enrolled in **${context.courses.count}** course${context.courses.count > 1 ? 's' : ''}:\n\n${courseLines}\n\n**Summary:** ${context.courses.inProgress} in progress, ${context.courses.completed} completed.`;
}

function buildAssignmentsResponse(context) {
  const { assignments } = context;

  if (!assignments.total) {
    return 'No assignments are recorded for your enrolled courses yet.';
  }

  const pendingItems = assignments.items
    .filter((item) => !item.submitted)
    .map((item) => {
      const deadline = item.dueDate ? `, due ${formatDate(item.dueDate)}` : '';
      return `- ${item.title} (${item.course})${deadline}`;
    })
    .join('\n');

  let response = `You have **${assignments.pending}** pending and **${assignments.completed}** completed assignment${assignments.total > 1 ? 's' : ''} out of ${assignments.total} total.`;

  if (assignments.upcomingDeadlines.length) {
    const nextDeadline = assignments.upcomingDeadlines[0];
    response += `\n\nYour next deadline is **${nextDeadline.title}** in ${nextDeadline.course} on ${formatDate(nextDeadline.dueDate)}.`;
  }

  if (pendingItems) {
    response += `\n\n**Pending assignments:**\n${pendingItems}`;
  } else {
    response += '\n\nYou have no pending assignments right now. Great job staying on top of your work!';
  }

  return response;
}

function buildPerformanceResponse(context) {
  const { tests } = context;

  if (!tests.testsAttempted) {
    return 'No test or quiz attempts are recorded yet. Once you complete tests, I can analyze your performance here.';
  }

  const subjectLines = tests.subjectWise
    .map(
      (item) =>
        `- ${item.subject}: ${item.averageMarks}% average across ${item.testsAttempted} test${item.testsAttempted > 1 ? 's' : ''}`
    )
    .join('\n');

  let response = `You have attempted **${tests.testsAttempted}** tests with an overall average of **${tests.averageMarks}%**.`;

  if (tests.weakestSubject) {
    response += `\n\n**Needs improvement:** ${tests.weakestSubject}`;
  }

  if (tests.strongestSubject && tests.strongestSubject !== tests.weakestSubject) {
    response += `\n**Strongest area:** ${tests.strongestSubject}`;
  }

  response += `\n\n**Subject-wise performance:**\n${subjectLines}`;
  return response;
}

function buildProgressResponse(context) {
  if (!context.learningProgress.length) {
    return 'No learning progress is recorded yet. Start watching course videos to build your progress.';
  }

  const progressLines = context.learningProgress
    .map(
      (item) =>
        `- **${item.course}**: ${item.completionPercentage}% complete (${item.completedVideos}/${item.totalVideos} videos, ${item.completedModules}/${item.totalModules} modules)`
    )
    .join('\n');

  let response = `Here is your learning progress:\n\n${progressLines}`;

  if (context.weakAreas.length) {
    response += `\n\n**Areas to improve:** ${context.weakAreas.join(', ')}`;
  }

  const suggestion = context.suggestions.find((item) => item.includes('progress') || item.includes('improving'));
  if (suggestion) {
    response += `\n\n**Suggestion:** ${suggestion}`;
  }

  return response;
}

function buildScheduleResponse(context) {
  const { timetable } = context;

  if (!timetable.nextClass) {
    return 'No upcoming classes are scheduled for your enrolled courses right now.';
  }

  const nextClass = timetable.nextClass;
  let response = `Your next class is **${nextClass.title}** (${nextClass.course}) on ${formatDate(nextClass.startTime)}.`;

  if (timetable.upcomingClasses.length > 1) {
    const upcomingLines = timetable.upcomingClasses
      .slice(0, 5)
      .map(
        (item) =>
          `- ${item.title} (${item.course}) — ${formatDate(item.startTime)}`
      )
      .join('\n');

    response += `\n\n**Upcoming schedule:**\n${upcomingLines}`;
  }

  if (timetable.examSchedule.length) {
    const examLines = timetable.examSchedule
      .slice(0, 3)
      .map((item) => `- ${item.title} (${item.course}) — ${formatDate(item.startTime)}`)
      .join('\n');
    response += `\n\n**Exam schedule:**\n${examLines}`;
  }

  return response;
}

function buildNotificationsResponse(context) {
  if (!context.notifications.length) {
    return 'You have no new notifications right now.';
  }

  const lines = context.notifications
    .slice(0, 8)
    .map((item) => `- ${item.message}`)
    .join('\n');

  return `Here are your latest updates:\n\n${lines}`;
}

function buildProfileResponse(context) {
  const { profile } = context;

  return [
    `**Student profile**`,
    `- Name: ${profile.name}`,
    `- Student ID: ${profile.studentId}`,
    `- Email: ${profile.email}`,
    `- Program: ${profile.program}`,
    `- Department: ${profile.department}`,
    `- Enrollments: ${profile.enrollmentCount}`,
    profile.enrollments.length
      ? `- Courses: ${profile.enrollments.map((item) => item.title).join(', ')}`
      : '- Courses: None yet'
  ].join('\n');
}

function buildSuggestionsResponse(context) {
  if (!context.suggestions.length) {
    return 'You are doing well overall. Keep learning consistently and check back after completing more classes and tests.';
  }

  const lines = context.suggestions.map((item) => `- ${item}`).join('\n');
  return `Based on your current ERP data, here are my recommendations:\n\n${lines}`;
}

function buildHelpResponse() {
  return `I can help you with:\n\n- Attendance ("How is my attendance?")\n- Courses ("What courses am I enrolled in?")\n- Assignments ("Do I have pending assignments?")\n- Tests ("How is my performance?")\n- Progress ("Show my learning progress")\n- Schedule ("What is my next class?")\n- Notifications ("Any important updates?")\n- Suggestions ("What should I improve?")`;
}

export function generateChatbotResponse(message, context) {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return buildGreeting(context);
  }

  if (
    matchesIntent(normalizedMessage, ['hi', 'hello', 'hey', 'good morning', 'good evening']) &&
    normalizedMessage.length < 20
  ) {
    return buildGreeting(context);
  }

  if (matchesIntent(normalizedMessage, ['attendance', 'present', 'absent', 'classes attended'])) {
    return buildAttendanceResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'course',
      'courses',
      'enrolled',
      'subjects',
      'subject',
      'program'
    ])
  ) {
    return buildCoursesResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'assignment',
      'assignments',
      'pending',
      'deadline',
      'submit',
      'homework'
    ])
  ) {
    return buildAssignmentsResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'performance',
      'test',
      'tests',
      'exam',
      'marks',
      'score',
      'quiz',
      'improvement'
    ])
  ) {
    return buildPerformanceResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'progress',
      'learning',
      'module',
      'modules',
      'skill',
      'skills',
      'weak'
    ])
  ) {
    return buildProgressResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'schedule',
      'timetable',
      'next class',
      'class timing',
      'upcoming class',
      'when is my class'
    ])
  ) {
    return buildScheduleResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'notification',
      'notifications',
      'announcement',
      'updates',
      'important'
    ])
  ) {
    return buildNotificationsResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'profile',
      'my details',
      'student id',
      'who am i',
      'my information'
    ])
  ) {
    return buildProfileResponse(context);
  }

  if (
    matchesIntent(normalizedMessage, [
      'suggest',
      'suggestion',
      'recommend',
      'advice',
      'help me improve',
      'what should i'
    ])
  ) {
    return buildSuggestionsResponse(context);
  }

  if (matchesIntent(normalizedMessage, ['help', 'what can you do', 'commands'])) {
    return buildHelpResponse();
  }

  const fallbackParts = [
    `I understand you're asking about "${message}".`,
    buildSuggestionsResponse(context)
  ];

  return fallbackParts.join('\n\n');
}

export { buildGreeting };
