import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    console.log(`📧 Attempting to send email to: ${options.to} (Subject: ${options.subject})`);
    
    // Create transporter
    // If email configuration is missing, skip sending email to avoid runtime errors
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email configuration missing – skipping email send');
    return; // No-op when SMTP not configured
  }
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    secure: Number(process.env.EMAIL_PORT) === 465,
  });

    // Define email options
    const mailOptions = {
      from: `CA E-Learning <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ SMTP Error Details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      host: process.env.EMAIL_HOST,
      user: process.env.EMAIL_USER
    });
    throw error;
  }
};
