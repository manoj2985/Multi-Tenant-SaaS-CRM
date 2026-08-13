function getPasswordResetEmailTemplate({ name, resetUrl, expiresInMinutes = 60 }) {
  return {
    subject: 'Password Reset Request — Multi-Tenant SaaS CRM',
    text: `Hello ${name},\n\nYou requested a password reset for your account. Please visit the following link to reset your password: ${resetUrl}\n\nThis link will expire in ${expiresInMinutes} minutes. If you did not request a password reset, please ignore this email.\n\nBest regards,\nCRM Security Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444;">Password Reset Request</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #ef4444; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.85rem;">This link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
        <p style="color: #94a3b8; font-size: 0.8rem; margin-top: 20px;">If you did not request this reset, your account is safe and no action is needed.</p>
      </div>
    `
  };
}

module.exports = getPasswordResetEmailTemplate;
