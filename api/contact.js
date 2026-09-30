// Vercel Serverless Function: api/contact.js
// Handles contact form submissions for kiltura.com

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !message) {
      return res.status(400).json({ error: 'Please provide your name and a message.' });
    }

    const destinationEmail = process.env.CONTACT_EMAIL || 'theodore@kiltura.com';
    const resendApiKey = process.env.RESEND_API_KEY;

    // 1. Dispatch via Resend API (Zero dependencies, works natively on Vercel)
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Kiltura Website <onboarding@resend.dev>',
          to: [destinationEmail],
          reply_to: email || undefined,
          subject: `[Kiltura Contact] ${subject || 'New message from ' + name}`,
          text: `Name: ${name}\nEmail: ${email || 'Not provided'}\nSubject: ${subject || 'None'}\n\nMessage:\n${message}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #2140a5; margin-top: 0;">New Message from Kiltura Website</h2>
              <p><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> ${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : 'Not provided'}</p>
              <p><strong>Subject:</strong> ${escapeHtml(subject || 'None')}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <h3 style="font-size: 14px; text-transform: uppercase; color: #888;">Message</h3>
              <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.5; color: #111;">${escapeHtml(message)}</p>
            </div>
          `
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error delivering email via Resend');
      }
      return res.status(200).json({ success: true, messageId: data.id });
    }

    // 2. Dispatch via SMTP if configured
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"Kiltura Contact" <${process.env.SMTP_USER}>`,
        to: destinationEmail,
        replyTo: email || undefined,
        subject: `[Kiltura Contact] ${subject || 'New message from ' + name}`,
        text: `Name: ${name}\nEmail: ${email || 'Not provided'}\nSubject: ${subject || 'None'}\n\nMessage:\n${message}`,
      });

      return res.status(200).json({ success: true });
    }

    // 3. Fallback: Log submission and notify configuration requirement
    console.log('[Kiltura Contact] Submission received:', { name, email, subject, message });
    return res.status(200).json({
      success: true,
      delivered: false,
      note: 'Message received by server! Set RESEND_API_KEY in Vercel project environment variables to forward directly to your inbox.'
    });

  } catch (error) {
    console.error('[Kiltura Contact] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
