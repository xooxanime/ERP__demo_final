import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import schoolBg from '../assets/school-bg.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      const role = result.user?.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'teacher') navigate('/teacher/dashboard');
      else if (role === 'parent') navigate('/parent/dashboard');
      else navigate('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background Image with Blur and Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-all duration-700"
        style={{ backgroundImage: `url(${schoolBg})` }}
      />
      <div className="absolute inset-0 bg-slate-900/65 dark:bg-slate-950/75 backdrop-blur-[3px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/95 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30 border border-primary/20 backdrop-blur-md">
            <span className="text-3xl font-bold text-white font-display">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight drop-shadow-md">Welcome back</h1>
          <p className="text-slate-200 text-sm mt-1 drop-shadow-sm font-medium">Sign in to Shri Education ERP</p>
        </div>

        {/* Form Card with subtle glassmorphism */}
        <div className="bg-white/95 dark:bg-card/90 backdrop-blur-md border border-white/20 dark:border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                icon={Lock}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-base shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
