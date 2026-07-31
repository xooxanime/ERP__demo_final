import dotenv from 'dotenv';
dotenv.config();

const BASE = 'http://localhost:10000/api';
let passed = 0, failed = 0;

const log = (tag, ok, msg) => {
  const icon = ok ? '✅' : '❌';
  console.log(`  ${icon} [${tag}] ${msg}`);
  if (ok) passed++; else failed++;
};

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const r = await fetch(`${BASE}${path}`, opts);
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('   SHRI EDUCATION ERP — COMPREHENSIVE TEST');
  console.log('══════════════════════════════════════════════\n');

  // ── 1. HEALTH ──────────────────────────────────────────────
  console.log('📡 1. HEALTH CHECK');
  const health = await req('GET', '/health');
  log('HEALTH', health.data.status === 'success', `Server running – ${health.data.timestamp}`);

  // ── 2. AUTH: ADMIN ─────────────────────────────────────────
  console.log('\n👑 2. AUTH — ADMIN LOGIN');
  const adminLogin = await req('POST', '/auth/login', { email: 'admin@shri.com', password: 'Admin@123' });
  const adminOk = adminLogin.data.status === 'success' && adminLogin.data.data?.token;
  log('ADMIN-LOGIN', adminOk, adminOk ? `Token received, role=${adminLogin.data.data.user.role}` : adminLogin.data.message);
  const adminToken = adminLogin.data.data?.token;

  // ── 3. AUTH: TEACHER ───────────────────────────────────────
  console.log('\n👨‍🏫 3. AUTH — TEACHER LOGIN');
  const teacherLogin = await req('POST', '/auth/login', { email: 'teacher@shri.com', password: 'Teacher@123', role: 'teacher' });
  const teacherOk = teacherLogin.data.status === 'success' && teacherLogin.data.data?.token;
  log('TEACHER-LOGIN', teacherOk, teacherOk ? `Token received, role=${teacherLogin.data.data.user.role}` : teacherLogin.data.message);
  const teacherToken = teacherLogin.data.data?.token;

  // ── 4. AUTH: STUDENT ───────────────────────────────────────
  console.log('\n🎓 4. AUTH — STUDENT LOGIN');
  const studentLogin = await req('POST', '/auth/login', { email: 'student@shri.com', password: 'Student@123' });
  const studentOk = studentLogin.data.status === 'success' && studentLogin.data.data?.token;
  log('STUDENT-LOGIN', studentOk, studentOk ? `Token received, role=${studentLogin.data.data.user.role}` : studentLogin.data.message);
  const studentToken = studentLogin.data.data?.token;

  // ── 5. AUTH: WRONG CREDS ──────────────────────────────────
  console.log('\n🔒 5. AUTH — SECURITY (Wrong Credentials)');
  const badLogin = await req('POST', '/auth/login', { email: 'hacker@x.com', password: 'password' });
  log('WRONG-CREDS', badLogin.status === 401, `Expected 401, got ${badLogin.status}`);

  // ── 6. AUTH: GET ME ───────────────────────────────────────
  console.log('\n👤 6. AUTH — GET CURRENT USER (/auth/me)');
  if (adminToken) {
    const me = await req('GET', '/auth/me', null, adminToken);
    log('GET-ME', me.data.status === 'success', me.data.data?.user?.email || me.data.message);
  } else log('GET-ME', false, 'No admin token available');

  // ── 7. ADMIN DASHBOARD ────────────────────────────────────
  console.log('\n📊 7. ADMIN — DASHBOARD');
  if (adminToken) {
    const dash = await req('GET', '/admin/dashboard', null, adminToken);
    log('ADMIN-DASH', dash.data.status === 'success', `Stats: ${JSON.stringify(dash.data.data?.stats || {})}`);
  } else log('ADMIN-DASH', false, 'No admin token');

  // ── 8. ADMIN: GET STUDENTS ────────────────────────────────
  console.log('\n👨‍🎓 8. ADMIN — GET STUDENTS');
  if (adminToken) {
    const students = await req('GET', '/admin/students', null, adminToken);
    log('ADMIN-STUDENTS', students.data.status === 'success', `Found ${students.data.results} students`);
  } else log('ADMIN-STUDENTS', false, 'No admin token');

  // ── 9. ADMIN: GET ENROLLMENTS ─────────────────────────────
  console.log('\n📝 9. ADMIN — GET ENROLLMENTS');
  if (adminToken) {
    const enroll = await req('GET', '/admin/enrollments', null, adminToken);
    log('ADMIN-ENROLLMENTS', enroll.data.status === 'success', `Found ${enroll.data.results} enrollments`);
  } else log('ADMIN-ENROLLMENTS', false, 'No admin token');

  // ── 10. ADMIN: PENDING PAYMENTS ───────────────────────────
  console.log('\n💳 10. ADMIN — PENDING PAYMENTS');
  if (adminToken) {
    const payments = await req('GET', '/admin/payments/pending', null, adminToken);
    log('ADMIN-PAYMENTS', payments.data.status === 'success', `Found ${payments.data.results} pending payments`);
  } else log('ADMIN-PAYMENTS', false, 'No admin token');

  // ── 11. ADMIN: HERO SECTION ───────────────────────────────
  console.log('\n🏠 11. ADMIN — HERO SECTION');
  const hero = await req('GET', '/admin/hero-section');
  log('HERO-SECTION', hero.data.status === 'success', `Hero section retrieved`);

  // ── 12. ADMIN: APPROVALS ──────────────────────────────────
  console.log('\n🔑 12. ADMIN — APPROVAL REQUESTS');
  if (adminToken) {
    const approvals = await req('GET', '/approvals/requests', null, adminToken);
    log('APPROVALS', approvals.data.status === 'success', `Found ${approvals.data.data?.count} requests`);
  } else log('APPROVALS', false, 'No admin token');

  // ── 13. ADMIN: PERMISSIONS ────────────────────────────────
  console.log('\n🔐 13. ADMIN — PERMISSIONS MANAGEMENT');
  if (adminToken) {
    const perms = await req('GET', '/approvals/admin/permissions', null, adminToken);
    log('PERMISSIONS', perms.data.status === 'success', `Found ${perms.data.data?.count} permission sets`);
  } else log('PERMISSIONS', false, 'No admin token');

  // ── 14. TEACHER DASHBOARD ─────────────────────────────────
  console.log('\n👨‍🏫 14. TEACHER — DASHBOARD');
  if (teacherToken) {
    const tdash = await req('GET', '/teacher/dashboard', null, teacherToken);
    log('TEACHER-DASH', tdash.data.status === 'success', `Stats: ${JSON.stringify(tdash.data.data?.stats || {})}`);
  } else log('TEACHER-DASH', false, 'No teacher token');

  // ── 15. TEACHER: COURSES ──────────────────────────────────
  console.log('\n📚 15. TEACHER — COURSES');
  if (teacherToken) {
    const tcourses = await req('GET', '/teacher/courses', null, teacherToken);
    log('TEACHER-COURSES', tcourses.data.status === 'success', `Found ${tcourses.data.results} courses`);
  } else log('TEACHER-COURSES', false, 'No teacher token');

  // ── 16. TEACHER: STUDENTS ─────────────────────────────────
  console.log('\n👥 16. TEACHER — STUDENTS');
  if (teacherToken) {
    const tstudents = await req('GET', '/teacher/students', null, teacherToken);
    log('TEACHER-STUDENTS', tstudents.data.status === 'success', `Found ${tstudents.data.results} students`);
  } else log('TEACHER-STUDENTS', false, 'No teacher token');

  // ── 17. TEACHER: SCHEDULE ─────────────────────────────────
  console.log('\n📅 17. TEACHER — SCHEDULE');
  if (teacherToken) {
    const schedule = await req('GET', '/teacher/schedule', null, teacherToken);
    log('TEACHER-SCHEDULE', schedule.data.status === 'success', `Found ${schedule.data.data?.schedule?.length} schedule entries`);
  } else log('TEACHER-SCHEDULE', false, 'No teacher token');

  // ── 18. STUDENT DASHBOARD ─────────────────────────────────
  console.log('\n🎓 18. STUDENT — DASHBOARD');
  if (studentToken) {
    const sdash = await req('GET', '/student/dashboard', null, studentToken);
    log('STUDENT-DASH', sdash.data.status === 'success', `Data received`);
  } else log('STUDENT-DASH', false, 'No student token');

  // ── 19. STUDENT: MY COURSES ───────────────────────────────
  console.log('\n📖 19. STUDENT — MY COURSES');
  if (studentToken) {
    const mycourses = await req('GET', '/student/my-courses', null, studentToken);
    log('STUDENT-COURSES', mycourses.data.status === 'success', `Found ${mycourses.data.data?.enrollments?.length ?? 0} enrollments`);
  } else log('STUDENT-COURSES', false, 'No student token');

  // ── 20. PUBLIC: COURSES ───────────────────────────────────
  console.log('\n🌐 20. PUBLIC — COURSES API');
  const courses = await req('GET', '/courses');
  log('PUBLIC-COURSES', courses.data.status === 'success', `Found ${courses.data.results} courses`);

  // ── 21. PUBLIC: FACULTY ───────────────────────────────────
  console.log('\n👩‍🏫 21. PUBLIC — FACULTY API');
  const faculty = await req('GET', '/faculty');
  log('PUBLIC-FACULTY', faculty.data.status === 'success', `Found ${faculty.data.results} faculty members`);

  // ── 22. PROGRESS ──────────────────────────────────────────
  console.log('\n📈 22. STUDENT — PROGRESS TRACKING');
  if (studentToken) {
    const progress = await req('GET', '/progress', null, studentToken);
    log('PROGRESS', progress.data.status === 'success', `Progress data received`);
  } else log('PROGRESS', false, 'No student token');

  // ── 23. STUDY MATERIALS ───────────────────────────────────
  console.log('\n📄 23. PUBLIC — STUDY MATERIALS');
  const materials = await req('GET', '/study-materials');
  log('STUDY-MATERIALS', materials.data.status === 'success', `Found ${materials.data.results ?? 0} materials`);

  // ── 24. AUTH GUARD: Unauthorized Access ───────────────────
  console.log('\n🛡️  24. SECURITY — Unauthorized Access Guard');
  const noToken = await req('GET', '/admin/dashboard');
  log('AUTH-GUARD', noToken.status === 401, `Expected 401, got ${noToken.status}`);

  // ── 25. ROLE GUARD: Student cannot access Admin ───────────
  console.log('\n🛡️  25. SECURITY — Role Guard (Student → Admin route)');
  if (studentToken) {
    const roleGuard = await req('GET', '/admin/dashboard', null, studentToken);
    log('ROLE-GUARD', roleGuard.status === 403, `Expected 403, got ${roleGuard.status}`);
  } else log('ROLE-GUARD', false, 'No student token');

  // ── SUMMARY ───────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed / ${failed} failed / ${passed + failed} total`);
  const pct = Math.round((passed / (passed + failed)) * 100);
  console.log(`  SUCCESS RATE: ${pct}%`);
  if (failed === 0) {
    console.log('  🎉 ALL TESTS PASSED!');
  } else {
    console.log(`  ⚠️  ${failed} test(s) need attention.`);
  }
  console.log('══════════════════════════════════════════════\n');
}

main().catch(console.error);
