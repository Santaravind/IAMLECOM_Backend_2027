// src/services/email.service.js

import { resend, FROM_EMAIL } from '../config/resend.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send acknowledgment email right after registration is submitted.
 */
export async function sendAcknowledgmentEmail(registration) {
  const safeName = escapeHtml(registration.name);
  const safeRefId = escapeHtml(registration.refId);
  const safeCategory = escapeHtml(registration.categoryName);
  const safeFee = escapeHtml(registration.applicableFee);
  const safeUtr = escapeHtml(registration.utr);
  const safeInstitution = escapeHtml(registration.institution);

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [registration.email],
    subject: `Registration Received — ${safeRefId} | IAMLECON 2027`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
        
        <div style="text-align: center; padding: 24px 0; border-bottom: 3px solid #ff6b1a;">
          <h1 style="margin: 0; font-size: 22px; color: #0b1f3a; font-weight: 800; letter-spacing: 1px;">
            IAMLECON 2027
          </h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">
            International Conference Registration
          </p>
        </div>

        <div style="padding: 24px 0;">
          <h2 style="color: #0b1f3a; font-size: 18px; margin: 0 0 8px;">
            Dear ${safeName},
          </h2>
          
          <p style="color: #374151; font-size: 14px; line-height: 1.7;">
            Thank you for registering for <strong>IAMLECON 2027</strong>. Your registration 
            application has been <strong>successfully received</strong>.
          </p>

          <div style="background: #fff7ed; border: 2px solid #ff6b1a; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
              Your Reference Number
            </p>
            <p style="margin: 8px 0 0; font-size: 28px; color: #ff6b1a; font-weight: 900; letter-spacing: 3px; font-family: monospace;">
              ${safeRefId}
            </p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #6b7280;">
              Please quote this reference in all future correspondence
            </p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280;">Category:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right;">${safeCategory}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Fee Paid:</td><td style="padding: 6px 0; color: #ff6b1a; font-weight: 700; text-align: right;">${safeFee}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Transaction ID:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right; font-family: monospace;">${safeUtr}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Institution:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right;">${safeInstitution}</td></tr>
            </table>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
              ✅ What happens next?
            </p>
            <p style="margin: 8px 0 0; color: #047857; font-size: 13px; line-height: 1.6;">
              Your payment receipt is under review by the organising committee. Once your 
              transaction is verified, you will receive your <strong>Event Pass with a unique 
              ID number</strong> via email. Please allow 2–3 working days for verification.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin-top: 20px;">
            If you have any queries, contact the organising secretariat at 
            <a href="mailto:iamlecon2027@gmail.com" style="color: #ff6b1a;">iamlecon2027@gmail.com</a>
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            © 2027 IAMLECON. Bundelkhand University, Jhansi, India.
          </p>
        </div>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Send confirmation email with Event Pass ID on admin approval.
 */
export async function sendConfirmationEmail(registration) {
  const safeName = escapeHtml(registration.name);
  const safePassId = escapeHtml(registration.eventPassId);
  const safeRefId = escapeHtml(registration.refId);
  const safeCategory = escapeHtml(registration.categoryName);
  const safeFee = escapeHtml(registration.applicableFee);
  const safePeriod = escapeHtml(registration.period);
  const safePresentation = escapeHtml(registration.presentation);
  const safeInstitution = escapeHtml(registration.institution);

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [registration.email],
    subject: `🎉 Confirmed! Event Pass ${safePassId} — IAMLECON 2027`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
        
        <div style="text-align: center; padding: 24px 0; border-bottom: 3px solid #ff6b1a;">
          <h1 style="margin: 0; font-size: 22px; color: #0b1f3a; font-weight: 800;">
            IAMLECON 2027
          </h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">
            Registration Confirmed
          </p>
        </div>

        <div style="padding: 24px 0;">
          <h2 style="color: #0b1f3a; font-size: 18px; margin: 0 0 8px;">
            Dear ${safeName},
          </h2>
          
          <p style="color: #374151; font-size: 14px; line-height: 1.7;">
            Congratulations! Your payment has been <strong>successfully verified</strong> 
            by the organising committee. You are now <strong>confirmed</strong> for attending 
            <strong>IAMLECON 2027</strong>.
          </p>

          <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 11px; color: #065f46; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
              Your Event Pass ID
            </p>
            <p style="margin: 10px 0 0; font-size: 32px; color: #059669; font-weight: 900; letter-spacing: 3px; font-family: monospace;">
              ${safePassId}
            </p>
            <p style="margin: 10px 0 0; font-size: 12px; color: #047857; font-weight: 600;">
              Reference: ${safeRefId}
            </p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #6b7280;">
              Please carry this Pass ID for on-site registration and badge collection.
            </p>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280;">Delegate Name:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right;">${safeName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Category:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right;">${safeCategory}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Fee Verified:</td><td style="padding: 6px 0; color: #ff6b1a; font-weight: 700; text-align: right;">${safeFee} (${safePeriod})</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Presentation:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right;">${safePresentation}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Institution:</td><td style="padding: 6px 0; color: #0b1f3a; font-weight: 700; text-align: right;">${safeInstitution}</td></tr>
            </table>
          </div>

            <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin-top: 20px;">
            For any assistance, contact us at 
            <a href="mailto:iamlecon2027@gmail.com" style="color: #ff6b1a;">iamlecon2027@gmail.com</a>
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            © 2027 IAMLECON. Bundelkhand University, Jhansi, India.
          </p>
        </div>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Send rejection email explaining reason to applicant.
 */
export async function sendRejectionEmail(registration) {
  const safeName = escapeHtml(registration.name);
  const safeRefId = escapeHtml(registration.refId);
  const safeNotes = escapeHtml(registration.adminNotes || 'Payment details could not be validated.');

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [registration.email],
    subject: `Action Required — Registration ${safeRefId} | IAMLECON 2027`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
        
        <div style="text-align: center; padding: 24px 0; border-bottom: 3px solid #ff6b1a;">
          <h1 style="margin: 0; font-size: 22px; color: #0b1f3a; font-weight: 800;">IAMLECON 2027</h1>
        </div>

        <div style="padding: 24px 0;">
          <h2 style="color: #0b1f3a; font-size: 18px; margin: 0 0 8px;">Dear ${safeName},</h2>
          
          <p style="color: #374151; font-size: 14px; line-height: 1.7;">
            We regret to inform you that your registration 
            <strong>${safeRefId}</strong> could not be verified at this time.
          </p>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 13px; font-weight: 600;">Reason:</p>
            <p style="margin: 8px 0 0; color: #b91c1c; font-size: 13px; line-height: 1.6;">
              ${safeNotes}
            </p>
          </div>

          <p style="color: #374151; font-size: 14px; line-height: 1.7;">
            Please re-submit your payment details or contact the organising committee 
            at <a href="mailto:iamlecon2027@gmail.com" style="color: #ff6b1a;">iamlecon2027@gmail.com</a> 
            for clarification.
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            © 2027 IAMLECON. Bundelkhand University, Jhansi, India.
          </p>
        </div>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  return data;
}

