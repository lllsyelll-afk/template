/**
 * Email templates for security notifications
 */

export interface OtpTemplateArgs {
  code: string;
  purpose: "email_change" | "login" | "register" | "forgot_password";
  expiresInMinutes?: number;
}

export interface LockAccountTemplateArgs {
  name: string;
  hours: string;
  mins: string;
  lockoutDurationMins: number;
}

/**
 * Get purpose display text for OTP email
 */
function getOtpPurposeText(purpose: OtpTemplateArgs["purpose"]): string {
  switch (purpose) {
    case "email_change":
      return "verify your email change request";
    case "login":
      return "complete your login";
    case "register":
      return "complete your registration";
    case "forgot_password":
      return "reset your password";
    default:
      return "verify your identity";
  }
}

/**
 * Generates HTML and text content for OTP verification email
 */
export function otpTemplate({
  code,
  purpose,
  expiresInMinutes = 10,
}: OtpTemplateArgs): { html: string; text: string; subject: string } {
  const purposeText = getOtpPurposeText(purpose);
  const subject = `Your Verification Code - ${code}`;

  const html = `<div style="font-family: Nunito, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #0088ff 0%, #0066cc 100%); border-radius: 12px; color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Verification Code</h1>
    <p style="color: #b3d9ff; font-size: 14px; margin: 10px 0 0 0;">Secure your account</p>
  </div>
  
  <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); margin: 25px 0;">
    <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">Use the code below to <strong style="color: #ffffff;">${purposeText}</strong>:</p>
    
    <div style="background: #ffffff; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
      <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #0088ff; font-family: monospace;">${code}</span>
    </div>
    
    <p style="color: #b3d9ff; font-size: 14px; text-align: center; margin: 20px 0 0 0;">⏱️ Expires in <strong style="color: #ffffff;">${expiresInMinutes} minutes</strong></p>
  </div>
  
  <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 25px; margin-top: 25px;">
    <p style="color: #b3d9ff; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">🔒 If you didn't request this code, you can safely ignore this email.<br>Someone may have entered your email by mistake.</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px;">
    <p style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0;">Security Team</p>
    <p style="color: #b3d9ff; font-size: 12px; margin: 5px 0 0 0;">Keeping your account safe</p>
  </div>
</div>`;

  const text = `Verification Code

Use the code below to ${purposeText}:

${code}

This code will expire in ${expiresInMinutes} minutes.

If you didn't request this code, you can safely ignore this email.

Best regards,
Security Team`;

  return { html, text, subject };
}

/**
 * Generates HTML and text content for account lockout email
 */
export function lockAccountTemplate({
  name,
  hours,
  mins,
  lockoutDurationMins,
}: LockAccountTemplateArgs): { html: string; text: string } {
  const html = `<div style="font-family: Nunito, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #e53935 0%, #c62828 100%); border-radius: 12px; color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="background: rgba(255, 255, 255, 0.2); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
      <span style="font-size: 30px;">🔒</span>
    </div>
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Account Locked</h1>
    <p style="color: #ffcdd2; font-size: 14px; margin: 10px 0 0 0;">Security Alert</p>
  </div>
  
  <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); margin: 25px 0;">
    <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear <strong style="color: #ffffff;">${name}</strong>,</p>
    
    <p style="color: #ffcdd2; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">Your account has been temporarily locked due to <strong style="color: #ffffff;">5 consecutive failed login attempts</strong>.</p>
    
    <div style="background: #ffffff; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
      <h3 style="color: #e53935; font-size: 16px; font-weight: 700; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">🔐 Lockout Details</h3>
      <div style="border-left: 3px solid #e53935; padding-left: 15px; margin: 15px 0;">
        <p style="color: #333; font-size: 14px; margin: 8px 0;"><strong>Locked until:</strong> <span style="color: #e53935; font-weight: 700;">${hours}:${mins}</span> (${lockoutDurationMins} minutes)</p>
        <p style="color: #333; font-size: 14px; margin: 8px 0;"><strong>Retry login at:</strong> <span style="color: #e53935; font-weight: 700;">${hours}:${mins}</span></p>
      </div>
    </div>
    
    <div style="background: rgba(255, 193, 7, 0.15); border-left: 3px solid #ffc107; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="color: #ffecb3; font-size: 13px; margin: 0; line-height: 1.5;">⚠️ <strong style="color: #ffffff;">Security Notice:</strong> If you did not attempt to log in, someone may be trying to access your account.</p>
    </div>
    
    <h4 style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 25px 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">We recommend:</h4>
    <ol style="color: #ffcdd2; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
      <li>Ensuring you remember your correct password</li>
      <li>Using the "Forgot Password" feature if needed</li>
      <li>Contacting support if you suspect unauthorized access</li>
    </ol>
  </div>
  
  <div style="text-align: center; margin-top: 30px;">
    <p style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0;">Security Team</p>
    <p style="color: #ffcdd2; font-size: 12px; margin: 5px 0 0 0;">Protecting your account</p>
  </div>
</div>`;

  const text = `Dear ${name},

Your account has been temporarily locked due to 5 consecutive failed login attempts.

Lockout Details:
- Locked until: ${hours}:${mins} (${lockoutDurationMins} minutes from now)
- You can retry logging in at: ${hours}:${mins}

If you did not attempt to log in, someone may be trying to access your account. We recommend:
1. Ensuring you remember your correct password
2. Using the "Forgot Password" feature if needed
3. Contacting support if you suspect unauthorized access

Best regards,
Security Team`;

  return { html, text };
}
