import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Package,
  BarChart3,
  Users,
  Printer,
  LogOut,
  Radio,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

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
  const menuSections = [
    {
      title: 'STORE SETUP',
      items: [
        {
          key: 'branches' as TabKey,
          label: 'Branches Hub',
          icon: Building2
        },
        {
          key: 'inventory' as TabKey,
          label: 'Master Product Catalog',
          icon: Package
        }
      ]
    },
    {
      title: 'CONSOLIDATED',
      items: [
        {
          key: 'sales' as TabKey,
          label: 'Centralized Sales',
          icon: BarChart3
        },
        {
          key: 'payroll' as TabKey,
          label: 'Staff & Payroll',
          icon: Users
        }
      ]
    },
    {
      title: 'AUDIT',
      items: [
        {
          key: 'reports' as TabKey,
          label: 'Exports & Reports',
          icon: Printer
        }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        {
          key: 'settings' as TabKey,
          label: 'Profile & Settings',
          icon: Settings
        }
      ]
    }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 h-screen sticky top-0 transition-all duration-300 no-print z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Header Branding & Collapse Toggle */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm flex-shrink-0">
                ⚡
              </div>
              <div className="truncate">
                <h1 className="text-xs font-black text-white tracking-tight leading-tight truncate">KuyaVince POS</h1>
                <span className="text-[9px] text-slate-400 font-medium">Multi-Branch Cloud</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm mx-auto">
              ⚡
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex-shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Menu Navigation Sections */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h2 className="px-3 text-[9px] font-bold text-slate-500 tracking-wider uppercase truncate">
                  {section.title}
                </h2>
              )}
              <div className="space-y-1 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectTab(item.key)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isCollapsed ? 'justify-center' : 'justify-start'
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* 3. Bottom Admin Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                KV
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.email}</p>
                <p className="text-[9px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Role: {currentUser.role} · {currentUser.role === 'Super Admin' ? 'Full access' : 'Read + Edit access'}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="w-full py-2 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
            title={`Sign Out (${currentUser.email})`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
