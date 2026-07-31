const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    const response = await axios.post('http://localhost:10000/api/auth/login', {
      email: 'admin@caelearning.com',
      password: 'Admin@123'
    });
    
    console.log('✅ Login successful!');
    console.log('User:', response.data.data.user);
    console.log('Token:', response.data.data.token.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.response?.data?.message || error.message);
  }
}

testAdminLogin();
