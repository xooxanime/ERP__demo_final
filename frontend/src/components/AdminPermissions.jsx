import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Lock, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPermissions, setLocalPermissions] = useState({});

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    const rolePerms = permissions.find(p => p.role === selectedRole);
    if (rolePerms) {
      setLocalPermissions(JSON.parse(JSON.stringify(rolePerms)));
    }
  }, [selectedRole, permissions]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPermissions();
      setPermissions(response.data.data.permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module, action) => {
    setLocalPermissions({
      ...localPermissions,
      permissions: {
        ...localPermissions.permissions,
        [module]: {
          ...localPermissions.permissions[module],
          [action]: !localPermissions.permissions[module]?.[action]
        }
      }
    });
  };

  const handleSavePermissions = async () => {
    if (selectedRole === 'admin') {
      toast.error('Admin permissions are immutable superuser permissions and cannot be modified.');
      return;
    }
    try {
      setSaving(true);
      await adminAPI.updatePermissions(selectedRole, { permissions: localPermissions.permissions });
      await fetchPermissions();
      toast.success('Permissions updated successfully!');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roles = ['student', 'teacher', 'parent'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lock className="w-6 h-6" />
          Permissions Management
        </h2>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Select Role</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                selectedRole === role
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {localPermissions.permissions && (
        <div className="space-y-4">
          {Object.entries(localPermissions.permissions).map(([module, actions]) => (
            <div key={module} className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4 capitalize">{module}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(actions).map(([action, allowed]) => (
                  <label key={`${module}-${action}`} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={() => handlePermissionChange(module, action)}
                      className="w-5 h-5 rounded border-border cursor-pointer"
                    />
                    <span className="capitalize text-sm">{action}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSavePermissions}
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
        <button
          onClick={fetchPermissions}
          className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>
    </div>
  );
}
