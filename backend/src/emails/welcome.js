function getWelcomeEmailTemplate({ name, companyName, loginUrl }) {
  return {
    subject: `Welcome to ${companyName} on Multi-Tenant SaaS CRM`,
    text: `Hello ${name},\n\nWelcome to ${companyName}! Your CRM account is active. You can sign in at: ${loginUrl}\n\nBest regards,\nCRM Admin Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #3b82f6;">Welcome to Multi-Tenant SaaS CRM</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account for <strong>${companyName}</strong> has been created and is now active.</p>
        <div style="margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Sign In to Dashboard</a>
        </div>
        <p style="color: #64748b; font-size: 0.85rem;">If you have any questions, please contact your company administrator.</p>
      </div>
    `
  };
}

module.exports = getWelcomeEmailTemplate;
