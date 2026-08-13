function getTaskAssignedEmailTemplate({ name, taskTitle, priority, dueDate, taskUrl }) {
  return {
    subject: `New Task Assigned: ${taskTitle}`,
    text: `Hello ${name},\n\nYou have been assigned a new task: "${taskTitle}". Priority: ${priority || 'MEDIUM'}. Due Date: ${dueDate || 'Not specified'}.\n\nView task details: ${taskUrl}\n\nBest regards,\nCRM Productivity System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #8b5cf6;">New Task Assigned</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been assigned a new task in CRM:</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #8b5cf6; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${taskTitle}</h3>
          <p style="margin: 4px 0; font-size: 0.9rem; color: #475569;">Priority: <strong>${priority || 'MEDIUM'}</strong></p>
          <p style="margin: 4px 0; font-size: 0.9rem; color: #475569;">Due Date: <strong>${dueDate || 'Not specified'}</strong></p>
        </div>
        <div style="margin: 20px 0;">
          <a href="${taskUrl}" style="background-color: #8b5cf6; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 0.9rem;">View Task Details</a>
        </div>
      </div>
    `
  };
}

module.exports = getTaskAssignedEmailTemplate;
