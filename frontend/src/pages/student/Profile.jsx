import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { User, Mail, Phone, Lock, Save, Camera, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [preferences, setPreferences] = useState({
    inApp: true,
    whatsapp: true,
    email: true,
    sms: false
  });
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' });
      if (user.notificationPreferences) {
        setPreferences({
          inApp: user.notificationPreferences.inApp ?? true,
          whatsapp: user.notificationPreferences.whatsapp ?? true,
          email: user.notificationPreferences.email ?? true,
          sms: user.notificationPreferences.sms ?? false
        });
      }
    }
  }, [user]);

  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ ...form, notificationPreferences: preferences });
      toast.success('Profile settings saved successfully');
    } catch (err) {
      toast.error('Failed to update profile settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your personal information and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar name={user?.name} size="xl" />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <Badge variant="default" className="mt-2 capitalize">{user?.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input label="Full Name" icon={User} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            <Input label="Email" icon={Mail} value={user?.email || ''} disabled />
            <Input label="Phone Number" icon={Phone} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit phone number" />
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader><CardTitle>Notification Channels & Preferences</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground mb-2">Choose how you want to receive academic alerts, live class reminders, and administrative notifications.</p>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <h4 className="text-sm font-semibold text-foreground">In-App Notifications</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Receive updates inside the ERP student/parent portal alerts panel.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences(p => ({ ...p, inApp: !p.inApp }))}
                className="focus:outline-none"
              >
                {preferences.inApp ? <ToggleRight className="w-9 h-9 text-blue-500" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <h4 className="text-sm font-semibold text-foreground">WhatsApp Notifications</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Receive real-time mobile notifications via Meta WhatsApp Business channel.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences(p => ({ ...p, whatsapp: !p.whatsapp }))}
                className="focus:outline-none"
              >
                {preferences.whatsapp ? <ToggleRight className="w-9 h-9 text-blue-500" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Email Notifications</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Receive detailed invoices, progress charts, and announcements in your inbox.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences(p => ({ ...p, email: !p.email }))}
                className="focus:outline-none"
              >
                {preferences.email ? <ToggleRight className="w-9 h-9 text-blue-500" /> : <ToggleLeft className="w-9 h-9 text-muted-foreground" />}
              </button>
            </div>

            <div className="pt-2">
              <Button type="button" onClick={handleUpdate} disabled={loading} className="w-full sm:w-auto">
                <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); toast.success('Password updated (demo)'); }}>
            <Input label="Current Password" icon={Lock} type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password" />
            <Input label="New Password" icon={Lock} type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} placeholder="Enter new password" />
            <Input label="Confirm New Password" icon={Lock} type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" />
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              <Lock className="w-4 h-4" />Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

