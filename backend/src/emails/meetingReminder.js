function getMeetingReminderEmailTemplate({ name, meetingTitle, meetingDate, meetingTime, meetingUrl }) {
  return {
    subject: `Meeting Reminder: ${meetingTitle}`,
    text: `Hello ${name},\n\nReminder: You have an upcoming meeting: "${meetingTitle}" scheduled for ${meetingDate} at ${meetingTime}.\n\nMeeting link: ${meetingUrl}\n\nBest regards,\nCRM Scheduling System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #06b6d4;">Upcoming Meeting Reminder</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>This is a reminder for your upcoming meeting:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #06b6d4; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${meetingTitle}</h3>
          <p style="margin: 4px 0; font-size: 0.9rem; color: #475569;">Date: <strong>${meetingDate}</strong></p>
          <p style="margin: 4px 0; font-size: 0.9rem; color: #475569;">Time: <strong>${meetingTime}</strong></p>
        </div>
        <div style="margin: 20px 0;">
          <a href="${meetingUrl}" style="background-color: #06b6d4; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 0.9rem;">Join / View Meeting</a>
        </div>
      </div>
    `
  };
}

module.exports = getMeetingReminderEmailTemplate;
