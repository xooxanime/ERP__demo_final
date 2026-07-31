import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\shour\\.gemini\\antigravity-ide\\brain\\86540f06-0f18-45e6-a692-89f4ae883ca7';

const filesToCopy = [
  { src: 'faculty_page_1783012215619.png', dest: 'faculty_page.png' },
  { src: 'staff_roles_1783012395711.png', dest: 'staff_roles.png' },
  { src: 'live_classes_1783012411740.png', dest: 'live_classes.png' },
  { src: 'admin_announcement_1783012435179.png', dest: 'admin_announcement.png' },
  { src: 'teacher_announcement_1783012878558.png', dest: 'teacher_announcement.png' },
  { src: 'student_notifications_1783013251036.png', dest: 'student_notifications.png' },
  { src: 'parent_notifications_1783013369122.png', dest: 'parent_notifications.png' }
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(srcDir, src);
  const destPath = path.join(srcDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.log(`Source file not found: ${src}`);
  }
});
