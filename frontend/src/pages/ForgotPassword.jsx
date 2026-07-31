import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import schoolBg from '../assets/school-bg.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
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
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/95 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30 border border-primary/20 backdrop-blur-md">
            <span className="text-3xl font-bold text-white font-display">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight drop-shadow-md">Reset Password</h1>
          <p className="text-slate-200 text-sm mt-1 drop-shadow-sm font-medium">Enter your email to receive a reset link</p>
        </div>
        <div className="bg-white/95 dark:bg-card/90 backdrop-blur-md border border-white/20 dark:border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-muted-foreground text-sm mb-6">We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to reset your password.</p>
              <Link to="/login"><Button variant="outline" className="w-full"><ArrowLeft className="w-4 h-4" />Back to Login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email Address" icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
