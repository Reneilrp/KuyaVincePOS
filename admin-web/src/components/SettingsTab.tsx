import React, { useState } from 'react';
import { Settings, Shield, User, Bell, Key, LogOut, Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface Props {
  currentUser: { email: string; role: string };
  onLogout: () => void;
}

export const SettingsTab: React.FC<Props> = ({ currentUser, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'security' | 'notifications'>('profile');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    const langName = lang === 'tl' ? 'Tagalog / Filipino' : 'English';
    setSavedNotice(t('languageChangedNotice', { lang: langName }));
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{t('systemSettings')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('settingsSubtitle')}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-60 flex-shrink-0 space-y-1.5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> {t('myProfile')}
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'language'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" /> {t('languagePref')}
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> {t('security')}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" /> {t('notifications')}
          </button>

          <div className="pt-3 mt-3 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" /> {t('signOut')}
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[380px]">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">{t('myProfile')}</h3>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-semibold text-xl">
                  {currentUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t('role')}</p>
                  <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3.5 h-3.5" /> {currentUser.role}
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-md pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">To change your email, contact system support or use the Supabase Dashboard.</p>
                </div>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-white">{t('languageSettingTitle')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('languageSettingSubtitle')}</p>
              </div>

              {savedNotice && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{savedNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* English Option */}
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className={`p-4 rounded-xl border text-left transition-colors relative flex flex-col justify-between h-32 ${
                    language === 'en'
                      ? 'bg-slate-950 border-blue-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🇺🇸</span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">English</h4>
                        <span className="text-xs text-slate-400">Default International</span>
                      </div>
                    </div>
                    {language === 'en' && (
                      <Check className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Standard terminology for sales, cash balancing, and inventory.
                  </p>
                </button>

                {/* Tagalog Option */}
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('tl')}
                  className={`p-4 rounded-xl border text-left transition-colors relative flex flex-col justify-between h-32 ${
                    language === 'tl'
                      ? 'bg-slate-950 border-blue-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🇵🇭</span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Tagalog / Filipino</h4>
                        <span className="text-xs text-slate-400">Lokal na Wika</span>
                      </div>
                    </div>
                    {language === 'tl' && (
                      <Check className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Madaling maintindihan: Panukli, Benta, Sakto, Kulang, Sobra.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">{t('security')}</h3>
              
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Change Password</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Password management is handled securely via Supabase Auth. To update your password, use the password reset link on the login screen or update it directly in the Supabase Dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Session Security</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Your session will automatically expire after 8 hours or 30 minutes of inactivity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">{t('notifications')}</h3>
              <p className="text-xs text-slate-400">No notification preferences configured yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
