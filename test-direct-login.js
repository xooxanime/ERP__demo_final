const http = require('http');

const data = JSON.stringify({
  email: 'admin@caelearning.com',
  password: 'Admin@123'
});

const options = {
  hostname: 'localhost',
  port: 10000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing login with:');
console.log('Email:', 'admin@caelearning.com');
console.log('Password:', 'Admin@123');
console.log('');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);
    
    try {
      const parsed = JSON.parse(responseData);
      if (parsed.status === 'success') {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('User:', parsed.data.user.name);
        console.log('Role:', parsed.data.user.role);
      } else {
        console.log('\n❌ LOGIN FAILED!');
        console.log('Message:', parsed.message);
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
