import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import schoolBg from '../assets/school-bg.png';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, { password: formData.password });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
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
          <p className="text-slate-200 text-sm mt-1 drop-shadow-sm font-medium">Enter your new password below</p>
        </div>
        <div className="bg-white/95 dark:bg-card/90 backdrop-blur-md border border-white/20 dark:border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="New Password" icon={Lock} type="password" placeholder="Min. 6 characters" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required />
            <Input label="Confirm Password" icon={Lock} type="password" placeholder="Re-enter password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required />
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
