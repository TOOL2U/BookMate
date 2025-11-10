// Test SendGrid email sending
const sgMail = require('@sendgrid/mail');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'shaunducker1@gmail.com',
  from: 'shaunducker1@gmail.com', // Must match verified sender
  subject: 'SendGrid Test Email',
  text: 'This is a test email from BookMate',
  html: '<strong>This is a test email from BookMate</strong>',
};

console.log('Attempting to send email...');
console.log('API Key:', process.env.SENDGRID_API_KEY.substring(0, 20) + '...');
console.log('From:', msg.from);
console.log('To:', msg.to);

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
  })
  .catch((error) => {
    console.error('❌ SendGrid Error:');
    console.error('Status:', error.code);
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Response Body:', JSON.stringify(error.response.body, null, 2));
    }
    
    // Check specific error
    if (error.code === 403) {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
      console.log('2. Verify that "shaunducker1@gmail.com" is verified (green checkmark)');
      console.log('3. If not, check your email for a verification link from SendGrid');
      console.log('4. Click the verification link to verify your sender email');
      console.log('5. Wait a few minutes and try again');
    }
  });
