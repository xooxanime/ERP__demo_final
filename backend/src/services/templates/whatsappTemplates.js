/**
 * Reusable WhatsApp Template Builders and Mappings.
 * Maps ERP events to Meta Business API template parameters and local fallback text strings.
 */

// Helper to wrap simple strings as body text parameters for Meta JSON payload
const toTextParams = (...args) => {
  return args.map(arg => ({
    type: 'text',
    text: String(arg || '')
  }));
};

export const whatsappTemplates = {
  // Authentication Templates
  welcome_verification: (data) => ({
    name: 'welcome_verification',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name, data.role, data.email)
      }
    ],
    fallback: `Welcome ${data.name}! Your CA ERP account has been created for the role of ${data.role}. You can log in with: ${data.email}`
  }),

  account_approved: (data) => ({
    name: 'account_approved',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name, data.role)
      }
    ],
    fallback: `Dear ${data.name}, your registration request for ${data.role} access has been approved. You may now log in.`
  }),

  password_reset: (data) => ({
    name: 'password_reset',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name, data.resetLink)
      }
    ],
    fallback: `Hello ${data.name}, you requested a password reset. Use this link: ${data.resetLink} (valid for 30 minutes).`
  }),

  account_activated: (data) => ({
    name: 'account_activated',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name)
      }
    ],
    fallback: `Hello ${data.name}, your account is now active and ready for use.`
  }),

  // Live Class Templates
  live_class_scheduled: (data) => ({
    name: 'live_class_scheduled',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.teacherName, data.date, data.time, data.meetingLink)
      }
    ],
    fallback: `New Live Class Scheduled!\nCourse: ${data.courseName}\nTeacher: ${data.teacherName}\nDate: ${data.date}\nTime: ${data.time}\nJoin: ${data.meetingLink}`
  }),

  live_class_reminder: (data) => ({
    name: 'live_class_reminder',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.time, data.meetingLink)
      }
    ],
    fallback: `Reminder: Live Class for "${data.courseName}" is starting in 15 mins at ${data.time}. Join here: ${data.meetingLink}`
  }),

  live_class_started: (data) => ({
    name: 'live_class_started',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.teacherName, data.meetingLink)
      }
    ],
    fallback: `Live Class for "${data.courseName}" is now LIVE! Instructor: ${data.teacherName}. Click to join now: ${data.meetingLink}`
  }),

  live_class_cancelled: (data) => ({
    name: 'live_class_cancelled',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.date, data.time)
      }
    ],
    fallback: `Notice: The live session for "${data.courseName}" scheduled on ${data.date} at ${data.time} has been cancelled.`
  }),

  live_class_completed: (data) => ({
    name: 'live_class_completed',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.summary || 'Visit portal')
      }
    ],
    fallback: `Class Completed: The live session for "${data.courseName}" is over. Thank you for attending.`
  }),

  recording_available: (data) => ({
    name: 'recording_available',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.recordingLink)
      }
    ],
    fallback: `Recording Alert: The video recording for "${data.courseName}" is now available at: ${data.recordingLink}`
  }),

  // Attendance Templates
  attendance_alert: (data) => ({
    name: 'attendance_alert',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.childName, data.date, data.status)
      }
    ],
    fallback: `Attendance Alert: ${data.childName} was marked ${data.status} on ${data.date}.`
  }),

  low_attendance_warning: (data) => ({
    name: 'low_attendance_warning',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.studentName, data.courseName, data.percentage)
      }
    ],
    fallback: `Low Attendance Alert: ${data.studentName}'s attendance in "${data.courseName}" is currently ${data.percentage}%, which is below the 75% threshold.`
  }),

  // Assignment Templates
  assignment_posted: (data) => ({
    name: 'assignment_posted',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.assignmentTitle, data.deadline)
      }
    ],
    fallback: `New Assignment in "${data.courseName}"! Title: ${data.assignmentTitle}. Submission deadline: ${data.deadline}`
  }),

  assignment_deadline: (data) => ({
    name: 'assignment_deadline',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.courseName, data.assignmentTitle, data.hoursLeft)
      }
    ],
    fallback: `Deadline Reminder: Only ${data.hoursLeft} left to submit the assignment "${data.assignmentTitle}" for "${data.courseName}".`
  }),

  // Fees Templates
  fee_reminder: (data) => ({
    name: 'fee_reminder',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name, data.amount, data.dueDate, data.link)
      }
    ],
    fallback: `Dear ${data.name}, this is a reminder for pending fees of ₹${data.amount} due on ${data.dueDate}. Pay at: ${data.link}`
  }),

  payment_success: (data) => ({
    name: 'payment_success',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name, data.courseName, data.amount, data.receiptId)
      }
    ],
    fallback: `Payment Confirmed! Thank you ${data.name}. We verified your payment of ₹${data.amount} for course "${data.courseName}". Receipt: ${data.receiptId}`
  }),

  payment_failed: (data) => ({
    name: 'payment_failed',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.name, data.courseName, data.reason || 'Verification failed')
      }
    ],
    fallback: `Dear ${data.name}, your payment verification for "${data.courseName}" failed. Reason: ${data.reason}.`
  }),

  // Announcements & general
  announcement: (data) => {
    const attachmentSuffix = data.attachment?.url ? `\nAttachment: ${data.attachment.url}` : '';
    return {
      name: 'announcement',
      language: 'en_US',
      components: [
        {
          type: 'body',
          parameters: toTextParams(data.title, data.message)
        }
      ],
      fallback: `Broadcasting Notice: [${data.title}] - ${data.message}${attachmentSuffix}`
    };
  },

  custom: (data) => ({
    name: 'custom_message',
    language: 'en_US',
    components: [
      {
        type: 'body',
        parameters: toTextParams(data.message)
      }
    ],
    fallback: data.message
  })
};

/**
 * Returns formatted Meta component payload and fallback text string for a given template/event.
 */
export const buildTemplate = (eventKey, data) => {
  const handler = whatsappTemplates[eventKey] || whatsappTemplates.custom;
  return handler(data);
};
