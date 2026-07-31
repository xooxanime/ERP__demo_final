import http from 'http';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const loginAndFetch = () => {
  const loginData = JSON.stringify({
    email: 'teacher@shri.com',
    password: 'Teacher@123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 10000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const req = http.request(loginOptions, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.status !== 'success') {
          console.error('Login failed:', data.message);
          process.exit(1);
        }

        const token = data.token || data.data?.token;
        console.log('Login succeeded! Token retrieved.');

        // Now call the /api/teacher/courses endpoint
        const coursesOptions = {
          hostname: 'localhost',
          port: 10000,
          path: '/api/teacher/courses',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const coursesReq = http.request(coursesOptions, (coursesRes) => {
          let coursesBody = '';
          coursesRes.on('data', c => coursesBody += c);
          coursesRes.on('end', () => {
            console.log('Courses Status Code:', coursesRes.statusCode);
            console.log('Courses Response Payload:');
            console.log(coursesBody);
            process.exit(0);
          });
        });

        coursesReq.on('error', e => {
          console.error('Courses fetch error:', e);
          process.exit(1);
        });
        coursesReq.end();
      } catch (e) {
        console.error('Error parsing login response:', e.message);
        console.log('Raw body:', body);
        process.exit(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
    process.exit(1);
  });

  req.write(loginData);
  req.end();
};

loginAndFetch();
