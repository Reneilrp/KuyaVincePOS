import React, { useState } from 'react';
import { Settings, Shield, User, Bell, Key, LogOut } from 'lucide-react';

interface Props {
  currentUser: { email: string; role: string };
  onLogout: () => void;
}

export const SettingsTab: React.FC<Props> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">System Settings</h2>
          <p className="text-sm text-slate-400">Manage your admin profile and system preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> My Profile
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/50 transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">Admin Profile</h3>
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-blue-900/50 border border-blue-800/50 flex items-center justify-center text-blue-400 font-bold text-3xl">
                  {currentUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Account Role</p>
                  <p className="text-lg font-bold text-emerald-400 flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4" /> {currentUser.role}
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-md pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">To change your email, contact system support or use the Supabase Dashboard.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">Security & Authentication</h3>
              
              <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/50 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Change Password</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Password management is handled securely via Supabase Auth. To update your password, use the password reset link on the login screen or update it directly in the Supabase Dashboard.
                    </p>
                    <button className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition border border-slate-700">
                      Request Password Reset Email
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Session Security</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Your session will automatically expire after 8 hours or 30 minutes of inactivity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">System Notifications</h3>
              <p className="text-sm text-slate-400 italic">No notification preferences configured yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
