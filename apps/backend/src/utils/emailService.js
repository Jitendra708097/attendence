/**
 * @module emailService
 * @description Email sending service (stub - configure with nodemailer/SES/Sendgrid).
 */
const { logger } = require('./logger.js');

/**
 * Send email (implement with actual email service)
 */
const sendEmail = async (to, subject, html, from = process.env.EMAIL_FROM || 'noreply@attendease.com') => {
  try {
    // TODO: Integrate with nodemailer, SendGrid, or AWS SES
    logger.info('Email queued', { to, subject });
    return { success: true, messageId: `email_${Date.now()}` };
  } catch (err) {
    logger.error('Email sending failed', { to, subject, error: err.message });
    throw err;
  }
};

/**
 * Send welcome email to new employee
 */
const sendWelcomeEmail = async (email, name, tempPassword) => {
  const html = `
    <h2>Welcome to AttendEase!</h2>
    <p>Hello ${name},</p>
    <p>Your account has been created. Use the following credentials to log in:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please change your password after first login.</p>
    <p>Download the app: <a href="https://attendease.app">https://attendease.app</a></p>
  `;
  return sendEmail(email, 'Welcome to AttendEase', html);
};

/**
 * Send leave request notification
 */
const sendLeaveRequestEmail = async (adminEmail, employeeName, leaveType, days) => {
  const html = `
    <h2>New Leave Request</h2>
    <p>${employeeName} has requested ${leaveType} leave for ${days} days.</p>
    <p>Please review and approve/reject in the admin portal.</p>
  `;
  return sendEmail(adminEmail, `New Leave Request - ${employeeName}`, html);
};

/**
 * Send employee invitation with sign-up link
 */
const sendEmployeeInvite = async (employeeData) => {
  const { email, firstName, employeeId } = employeeData;
  
  // Generate sign-up link (should include short-lived token)
  // TODO: Generate proper invite token with expiry
  const inviteLink = `${process.env.FRONTEND_URL || 'https://app.attendease.com'}/invite?employeeId=${employeeId}`;

  const html = `
    <h2>You're Invited to AttendEase</h2>
    <p>Hello ${firstName},</p>
    <p>You have been added to your organization's AttendEase system.</p>
    <p>Click the link below to create your account and set your password:</p>
    <p><a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
    <p>This link will expire in 7 days.</p>
    <p>Questions? Contact your HR administrator.</p>
  `;

  return sendEmail(email, 'Invitation to Join AttendEase', html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLeaveRequestEmail,
  sendEmployeeInvite,
};
