const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'Alesiamay231!';

console.log('Generating hash for password:', password);
console.log('Using salt rounds: 12');

bcrypt.genSalt(12, (err, salt) => {
  if (err) {
    console.error('Error generating salt:', err);
    process.exit(1);
  }
  
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      console.error('Error hashing:', err);
      process.exit(1);
    }
    
    console.log('\n✅ Hash generated successfully!');
    console.log('\nHash:', hash);
    console.log('\nSQL to update database:');
    console.log(`UPDATE users SET password_hash = '${hash}', failed_login_count = 0, locked_until = NULL WHERE email = 'shaun@siamoon.com';`);
    
    // Verify it works
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        console.error('Error verifying:', err);
        process.exit(1);
      }
      console.log('\nVerification test:', result ? '✅ PASS' : '❌ FAIL');
      process.exit(0);
    });
  });
});
