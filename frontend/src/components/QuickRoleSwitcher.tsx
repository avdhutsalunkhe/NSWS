import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { api } from '../services/api';
import { UserCog, ArrowRightLeft, ShieldAlert, Loader2, Search } from 'lucide-react';

interface SwitchableUser {
  id: number;
  username: string;
  role: 'ADMIN' | 'CLERK';
  full_name: string;
  email?: string;
  plant_id?: number;
  plant_code?: string;
  plant_name?: string;
  plant_state?: string;
  capacity_tcd?: number;
}

export const QuickRoleSwitcher: React.FC = () => {
  const { user, login } = useAuth();
  const dialog = useDialog();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState<SwitchableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getSwitchableUsers();
      setUsersList(res.users ? res.users : []);
    } catch (err: any) {
      console.error('Failed to fetch switchable users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const handleSwitch = async (account: SwitchableUser) => {
    try {
      setSwitching(true);
      const res = await api.quickSwitch({ userId: account.id });
      login(res.token, res.user);
      setOpen(false);
    } catch (err: any) {
      await dialog.alert({
        title: 'Switch Role Failed',
        message: `Failed to switch user account: ${err.message}`,
        variant: 'danger',
      });
    } finally {
      setSwitching(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (u.username.toLowerCase().includes(term)) return true;
    if (u.full_name && u.full_name.toLowerCase().includes(term)) return true;
    if (u.plant_name && u.plant_name.toLowerCase().includes(term)) return true;
    if (u.plant_code && u.plant_code.toLowerCase().includes(term)) return true;
    if (u.role.toLowerCase().includes(term)) return true;
    return false;
  });

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="bg-white border-2 border-red-500 rounded-xl shadow-2xl p-4 w-88 text-left animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <UserCog className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-slate-900 uppercase">Active Role Switcher</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
            Switch between active accounts dynamically loaded from the database to test role-based permissions and workflows.
          </p>

          {/* Quick search filter if multiple users */}
          {usersList.length > 3 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search user, mill or plant code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2 py-1.5 focus:outline-none focus:border-red-400"
              />
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-red-600 mb-2" />
              <span className="text-xs">Loading accounts...</span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">No matching accounts found</div>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = Boolean(user && String(user.username) === String(u.username));
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <button
                      key={u.id}
                      disabled={switching ? true : isCurrent}
                      onClick={() => handleSwitch(u)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                        isCurrent
                          ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                          : 'bg-slate-50 hover:bg-red-50/50 text-slate-800 border-slate-200 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold truncate">
                          {isAdmin ? (u.full_name ? u.full_name : 'Directorate Admin') : (u.plant_name ? `${u.plant_name} Factory Clerk` : u.full_name)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {isAdmin
                            ? 'Full Access | All Mills & Approvals'
                            : (u.plant_code
                                ? `Locked to Plant ${u.plant_code} (${u.plant_name ? u.plant_name : 'Mill'})`
                                : 'Factory Clerk')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        {isCurrent && (
                          <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                            Active
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">
                          {u.username}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center">
              <ShieldAlert className="w-3 h-3 text-amber-500 mr-1 shrink-0" />
              <span>Clerk User ID is Plant Code</span>
            </div>
            <span className="font-semibold text-slate-500">{usersList.length} accounts</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-full shadow-lg border border-red-700 font-semibold text-xs transition-all cursor-pointer hover:scale-105"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Switch Role ({user ? user.role : 'Guest'})</span>
        </button>
      )}
    </div>
  );
};
