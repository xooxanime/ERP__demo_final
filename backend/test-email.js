import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  console.log('📧 Starting Email Connection Test...');
  console.log('------------------------------------');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log('------------------------------------');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: EMAIL_USER or EMAIL_PASS is missing in .env');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    // Verify connection configuration
    console.log('🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ Success: Server is ready to take our messages!');

    // Send test email
    console.log(`📤 Sending test email to ${process.env.EMAIL_USER}...`);
    const info = await transporter.sendMail({
      from: `"Test Connection" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "📧 Email System Working!",
      text: "If you are reading this, your email configuration is correct!",
      html: "<b>Congratulations!</b><br><p>Your e-learning platform's email system is now established and working correctly.</p>"
    });

    console.log('✅ Success: Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('------------------------------------');
    console.log('Please check your inbox (and Spam folder).');

  } catch (error) {
    console.error('❌ Failed to establish email connection:');
    console.error(error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 TIP: This usually means your App Password is wrong or 2-Step Verification is not enabled.');
    }
  }
}

testEmail();
