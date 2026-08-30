import React from 'react';
import {
  Building2,
  Package,
  BarChart3,
  Users,
  Printer,
  LogOut,
  Radio,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export type TabKey = 'branches' | 'inventory' | 'sales' | 'payroll' | 'reports';

interface Props {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  currentUser: { email: string; role: string };
  onLogout: () => void;
  branchesCount: number;
  productsCount: number;
}

export const SidebarMenuBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  branchesCount,
  productsCount
}) => {
  const menuSections = [
    {
      title: 'STORE CONFIGURATION',
      items: [
        {
          key: 'branches' as TabKey,
          label: 'Branches & Import Codes',
          icon: Building2,
          badge: `${branchesCount} Branches`,
          badgeColor: 'bg-blue-950 text-blue-400 border-blue-800'
        },
        {
          key: 'inventory' as TabKey,
          label: 'Products & Stock Matrix',
          icon: Package,
          badge: `${productsCount} Items`,
          badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800'
        }
      ]
    },
    {
      title: 'OPERATIONS & REVENUE',
      items: [
        {
          key: 'sales' as TabKey,
          label: 'Live Sales & Analytics',
          icon: BarChart3,
          badge: 'Cloud Sync',
          badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-800'
        },
        {
          key: 'payroll' as TabKey,
          label: 'Staff Timeclock & Payroll',
          icon: Users,
          badge: 'Wage Calc',
          badgeColor: 'bg-purple-950 text-purple-400 border-purple-800'
        }
      ]
    },
    {
      title: 'DATA RETRIEVAL & AUDIT',
      items: [
        {
          key: 'reports' as TabKey,
          label: 'Exports & Print Center',
          icon: Printer,
          badge: 'CSV / PDF',
          badgeColor: 'bg-amber-950 text-amber-400 border-amber-800'
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 h-screen sticky top-0 no-print">
      {/* 1. Header Branding */}
      <div>
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg">
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight leading-tight">KuyaVince POS</h1>
              <span className="text-[10px] text-slate-400 font-medium">Multi-Branch Cloud Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-400 font-bold" title="Supabase Connected">
            <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
          </div>
        </div>

        {/* 2. Menu Navigation Containers */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h2 className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {section.title}
              </h2>
              <div className="space-y-1 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectTab(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        isActive ? 'bg-blue-700/80 text-white border-blue-500' : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
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
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
              KV
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{currentUser.email}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> {currentUser.role}
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
      </div>
    </aside>
  );
};
