import axios from 'axios';

const testNewAdminLogin = async () => {
  try {
    console.log('🧪 Testing new admin credentials...\n');
    
    const response = await axios.post('http://localhost:10000/api/auth/login', {
      email: 'admin@ca.com',
      password: 'admin123'
    });

    console.log('✅ Login Successful!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', response.data.data.user.email);
    console.log('👤 Name:', response.data.data.user.name);
    console.log('🎭 Role:', response.data.data.user.role);
    console.log('🎫 Token:', response.data.data.token ? 'Received ✅' : 'Missing ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎉 Admin login is working perfectly!');
    console.log('\n📝 Use these credentials to login:');
    console.log('   Email: admin@ca.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Login Failed!\n');
    console.error('Error:', error.response?.data || error.message);
  }
};

testNewAdminLogin();
