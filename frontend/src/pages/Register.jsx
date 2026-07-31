import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, User, Phone, Eye, EyeOff, Briefcase, Baby, BookOpen } from 'lucide-react';
import schoolBg from '../assets/school-bg.png';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
    teacherInfo: {
      qualifications: '',
      experience: '',
      specialization: '',
      department: ''
    },
    parentInfo: {
      studentName: '',
      studentEmail: '',
      relationship: 'guardian'
    }
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Valid email required';
    if (!/^[0-9]{10}$/.test(form.phone)) errs.phone = '10-digit phone number required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';

    // Teacher validation
    if (form.role === 'teacher') {
      if (!form.teacherInfo.qualifications.trim()) errs.qualifications = 'Qualifications required';
      if (!form.teacherInfo.experience.trim()) errs.experience = 'Experience required';
      if (!form.teacherInfo.specialization.trim()) errs.specialization = 'Specialization required';
      if (!form.teacherInfo.department.trim()) errs.department = 'Department required';
    }

    // Parent validation
    if (form.role === 'parent') {
      if (!form.parentInfo.studentName.trim()) errs.studentName = 'Student name required';
      if (!/^\S+@\S+\.\S+$/.test(form.parentInfo.studentEmail)) errs.studentEmail = 'Valid email required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      if (form.role === 'teacher' || form.role === 'parent') {
        navigate('/login', { state: { message: 'Your account has been created. Please wait for admin approval.' } });
      } else {
        navigate('/student/dashboard');
      }
    }
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  
  const setTeacherInfo = (key) => (e) => 
    setForm(p => ({ ...p, teacherInfo: { ...p.teacherInfo, [key]: e.target.value } }));
  
  const setParentInfo = (key) => (e) => 
    setForm(p => ({ ...p, parentInfo: { ...p.parentInfo, [key]: e.target.value } }));

  const roles = [
    { id: 'student', name: 'Student', icon: BookOpen, description: 'Direct access' },
    { id: 'teacher', name: 'Teacher', icon: Briefcase, description: 'Needs approval' },
    { id: 'parent', name: 'Parent', icon: Baby, description: 'Needs approval' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background Image with Blur and Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-all duration-700"
        style={{ backgroundImage: `url(${schoolBg})` }}
      />
      <div className="absolute inset-0 bg-slate-900/65 dark:bg-slate-950/75 backdrop-blur-[3px]" />

      <div className="w-full max-w-2xl relative z-10 my-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/95 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30 border border-primary/20 backdrop-blur-md">
            <span className="text-3xl font-bold text-white font-display">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight drop-shadow-md">Create your account</h1>
          <p className="text-slate-200 text-sm mt-1 drop-shadow-sm font-medium">Join Shri Education ERP</p>
        </div>

        <div className="bg-white/95 dark:bg-card/90 backdrop-blur-md border border-white/20 dark:border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map(role => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, role: role.id }))}
                      className={`p-4 rounded-lg border-2 transition ${
                        form.role === role.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold text-sm">{role.name}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 pt-4 border-t border-border">
              <Input
                label="Full Name"
                icon={User}
                placeholder="Your full name"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                required
              />
              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                required
              />
              <Input
                label="Phone Number"
                icon={Phone}
                placeholder="10-digit number"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                required
              />
              <div className="relative">
                <Input
                  label="Password"
                  icon={Lock}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Teacher Information */}
            {form.role === 'teacher' && (
              <div className="space-y-4 pt-4 border-t border-border bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-foreground">Teacher Information</h3>
                <Input
                  label="Qualifications"
                  placeholder="e.g., B.Tech, M.Tech"
                  value={form.teacherInfo.qualifications}
                  onChange={setTeacherInfo('qualifications')}
                  error={errors.qualifications}
                  required
                />
                <Input
                  label="Experience (in years)"
                  placeholder="e.g., 5"
                  value={form.teacherInfo.experience}
                  onChange={setTeacherInfo('experience')}
                  error={errors.experience}
                  required
                />
                <Input
                  label="Specialization"
                  placeholder="e.g., Mathematics, Physics"
                  value={form.teacherInfo.specialization}
                  onChange={setTeacherInfo('specialization')}
                  error={errors.specialization}
                  required
                />
                <Input
                  label="Department"
                  placeholder="e.g., Science, Commerce"
                  value={form.teacherInfo.department}
                  onChange={setTeacherInfo('department')}
                  error={errors.department}
                  required
                />
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  ℹ️ Your account will need admin approval before you can access the teacher dashboard.
                </p>
              </div>
            )}

            {/* Parent Information */}
            {form.role === 'parent' && (
              <div className="space-y-4 pt-4 border-t border-border bg-green-50/50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-foreground">Parent Information</h3>
                <Input
                  label="Student Name"
                  placeholder="Your child's name"
                  value={form.parentInfo.studentName}
                  onChange={setParentInfo('studentName')}
                  error={errors.studentName}
                  required
                />
                <Input
                  label="Student Email"
                  type="email"
                  placeholder="Your child's email"
                  value={form.parentInfo.studentEmail}
                  onChange={setParentInfo('studentEmail')}
                  error={errors.studentEmail}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Relationship</label>
                  <select
                    value={form.parentInfo.relationship}
                    onChange={setParentInfo('relationship')}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  ℹ️ Your account will need admin approval before you can access the parent dashboard.
                </p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
