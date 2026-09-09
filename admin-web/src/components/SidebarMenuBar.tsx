import React from 'react';
import {
  Settings,
  Building2,
  Package,
  BarChart3,
  Users,
  Printer,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../i18n/translations';

export type TabKey = 'branches' | 'inventory' | 'sales' | 'payroll' | 'reports' | 'settings';

interface Props {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  currentUser: { email: string; role: string };
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarMenuBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse
}) => {
  const { t } = useLanguage();

  const menuSections = [
    {
      titleKey: 'storeSetup' as TranslationKey,
      items: [
        {
          key: 'branches' as TabKey,
          labelKey: 'branchesHub' as TranslationKey,
          icon: Building2
        },
        {
          key: 'inventory' as TabKey,
          labelKey: 'productCatalog' as TranslationKey,
          icon: Package
        }
      ]
    },
    {
      titleKey: 'consolidated' as TranslationKey,
      items: [
        {
          key: 'sales' as TabKey,
          labelKey: 'centralizedSales' as TranslationKey,
          icon: BarChart3
        },
        {
          key: 'payroll' as TabKey,
          labelKey: 'staffPayroll' as TranslationKey,
          icon: Users
        }
      ]
    },
    {
      titleKey: 'audit' as TranslationKey,
      items: [
        {
          key: 'reports' as TabKey,
          labelKey: 'exportsReports' as TranslationKey,
          icon: Printer
        }
      ]
    },
    {
      titleKey: 'system' as TranslationKey,
      items: [
        {
          key: 'settings' as TabKey,
          labelKey: 'profileSettings' as TranslationKey,
          icon: Settings
        }
      ]
    }
  ];

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between flex-shrink-0 h-screen sticky top-0 transition-all duration-200 no-print z-20 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* 1. Header Branding & Collapse Toggle */}
      <div>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                KV
              </div>
              <div className="truncate">
                <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate">KuyaVince POS</h1>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{t('appSubtitle')}</span>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-xs mx-auto">
              KV
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Menu Navigation */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuSections.map((section) => (
            <div key={section.titleKey} className="space-y-1">
              {!isCollapsed && (
                <h2 className="px-2 text-xs font-medium text-slate-500 dark:text-slate-500">
                  {t(section.titleKey)}
                </h2>
              )}
              <div className="space-y-0.5 pt-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  const label = t(item.labelKey);

                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectTab(item.key)}
                      title={isCollapsed ? label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isCollapsed ? 'justify-center' : 'justify-start'
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* 3. Bottom Admin Profile & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="truncate">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{currentUser.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-slate-400" /> {currentUser.role}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title={t('signOut')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="w-full py-2 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`${t('signOut')} (${currentUser.email})`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
