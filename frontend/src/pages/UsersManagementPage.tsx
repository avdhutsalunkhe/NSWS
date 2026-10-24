import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User } from '../types';
import {
  Users,
  UserPlus,
  ShieldAlert,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Building2,
  RefreshCw,
  Power
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { user, allPlants } = useAuth();
  const isAdmin = user ? user.role === 'ADMIN' : false;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState<'ADMIN' | 'CLERK'>('CLERK');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password reset state
  const [resetModalUserId, setResetModalUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data.users ? data.users : []);
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Failed to load users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePlantChange = (plantIdStr: string) => {
    setSelectedPlantId(plantIdStr);
    if (newRole === 'CLERK') {
      const found = allPlants.find((p) => String(p.id) === String(plantIdStr));
      if (found) {
        setUsername(found.plant_code);
        setFullName(`${found.plant_name} Factory Clerk`);
        setEmail(`clerk.${found.plant_code}@sugarmills.gov.in`);
      }
    }
  };

  const handleRoleChange = (role: 'ADMIN' | 'CLERK') => {
    setNewRole(role);
    if (role === 'ADMIN') {
      setUsername('');
      setSelectedPlantId('');
    } else if (allPlants.length > 0) {
      handlePlantChange(String(allPlants[0].id));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await api.createUser({
        username: username.trim(),
        password: password.trim(),
        role: newRole,
        full_name: fullName.trim(),
        email: email.trim(),
        plant_id: newRole === 'CLERK' && selectedPlantId ? Number(selectedPlantId) : undefined
      });

      setMessage({ text: `User account '${username}' registered successfully`, type: 'success' });
      setShowAddModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      await loadUsers();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'User creation failed', type: 'error' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUserId) return;
    if (!newPassword.trim()) return;

    try {
      await api.resetUserPassword(resetModalUserId, newPassword.trim());
      setMessage({ text: 'Password reset successfully', type: 'success' });
      setResetModalUserId(null);
      setNewPassword('');
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Password reset failed', type: 'error' });
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    const nextStatus = targetUser.is_active === 1 ? 0 : 1;
    try {
      await api.updateUserStatus(targetUser.id, nextStatus);
      setMessage({
        text: `User ${targetUser.username} ${nextStatus === 1 ? 'activated' : 'deactivated'}`,
        type: 'success'
      });
      await loadUsers();
    } catch (err: any) {
      setMessage({ text: err.message ? err.message : 'Status update failed', type: 'error' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
        <ShieldAlert className="w-8 h-8 mx-auto text-red-600 mb-2" />
        <h2 className="text-sm font-bold text-red-900 uppercase">Access Denied</h2>
        <p className="text-xs text-red-700 mt-1">
          Only Directorate Administrators have permissions to manage user credentials and factory clerk assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              RBAC Directory
            </span>
            <span className="text-xs text-slate-500">Admin & Factory Clerk Credentials</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            User & Security Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage factory clerk logins (User ID is Plant Code) and Directorate administrators.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            handleRoleChange('CLERK');
          }}
          className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Create New User Account
        </button>
      </div>

      {/* Alert Banner */}
      {message ? (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
            ×
          </button>
        </div>
      ) : null}

      {/* Role Architecture Notice */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 shadow-2xs space-y-1">
        <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center text-red-600">
          <Building2 className="w-4 h-4 mr-1" />
          Strict Factory Plant Code Isolation:
        </div>
        <p className="leading-relaxed">
          Factory Clerks authenticate using their <strong>Factory Plant Code</strong> (e.g. <code>8901</code>, <code>102</code>).
          Session security restricts clerks exclusively to their assigned factory. Directorate Administrators maintain multi-mill oversight and gateway approval permissions.
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Registered System Accounts
            </h2>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="text-slate-500 hover:text-slate-800 text-xs font-bold inline-flex items-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User ID / Username</th>
                <th className="py-3 px-4">Full Name & Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Plant</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {u.username}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{u.full_name}</div>
                    <div className="text-[11px] text-slate-500">{u.email ? u.email : '-'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.plant_code ? (
                      <div>
                        <div className="font-bold text-slate-900">{u.plant_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Code: {u.plant_code}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">All Sugar Mills (Admin)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active === 1
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.is_active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setResetModalUserId(u.id);
                        setNewPassword('');
                      }}
                      className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3 h-3 mr-1" />
                      Reset Pass
                    </button>
                    {u.username !== 'admin' ? (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                          u.is_active === 1
                            ? 'bg-red-50 hover:bg-red-100 text-red-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {u.is_active === 1 ? 'Disable' : 'Enable'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900">Create New System Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign factory plant credentials or Directorate administrative roles.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Account Role *</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('CLERK')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      newRole === 'CLERK'
                        ? 'bg-red-50 text-red-700 border-red-500 ring-1 ring-red-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Factory Clerk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      newRole === 'ADMIN'
                        ? 'bg-red-50 text-red-700 border-red-500 ring-1 ring-red-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Directorate Admin
                  </button>
                </div>
              </div>

              {newRole === 'CLERK' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Assign Factory Plant *
                  </label>
                  <select
                    required
                    value={selectedPlantId}
                    onChange={(e) => handlePlantChange(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                  >
                    <option value="">-- Select Plant --</option>
                    {allPlants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plant_name} (Code: {p.plant_code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Username automatically matches Plant Code according to regulatory guidelines.
                  </p>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  User ID / Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={newRole === 'CLERK' ? 'Plant Code (e.g. 8901)' : 'e.g. admin_user'}
                  className="mt-1 w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set account password"
                  className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. clerk@sugar.gov.in"
                  className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Reset Password Modal */}
      {resetModalUserId ? (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Reset User Password</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter a new temporary or permanent password for this account.
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">New Password *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. FactoryPass@2024"
                  className="mt-1 w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResetModalUserId(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
