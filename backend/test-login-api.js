import axios from 'axios';

console.log('🧪 Testing Admin Login API...\n');

const testLogin = async () => {
  try {
    console.log('📧 Email: admin@ca.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 API URL: http://localhost:10000/api/auth/login\n');
    
    const response = await axios.post('http://localhost:10000/api/auth/login', {
      email: 'admin@ca.com',
      password: 'admin123'
    });

    console.log('✅ LOGIN SUCCESSFUL!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('👤 User Details:');
    console.log('   Name:', response.data.data.user.name);
    console.log('   Email:', response.data.data.user.email);
    console.log('   Role:', response.data.data.user.role);
    console.log('   Token:', response.data.data.token ? 'Received ✅' : 'Missing ❌');
    
  } catch (error) {
    console.log('❌ LOGIN FAILED!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Error Status:', error.response?.status);
    console.log('Error Message:', error.response?.data?.message || error.message);
    console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Backend server is not running!');
      console.log('   Run: cd backend && npm start\n');
    }
  }
};

testLogin();
