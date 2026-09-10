import React, { useState } from "react";
import { Building2, Calendar, RefreshCw, Printer, Sun, Moon, Bell } from "lucide-react";
import { Branch, AppNotification } from "../types";
import { TabKey } from "./SidebarMenuBar";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { NotificationPanel } from "./NotificationPanel";

interface Props {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  pageTitle: string;
  activeTab: TabKey;
  activeBranchDetail?: Branch | null;
  onOpenZReport?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onNotificationAction?: (notification: AppNotification) => void;
}

export const BranchFilterHeader: React.FC<Props> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  selectedRange,
  onSelectRange,
  onRefresh,
  isLoading,
  pageTitle,
  activeTab,
  activeBranchDetail,
  onOpenZReport,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onClearAllNotifications = () => {},
  onNotificationAction
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const showBranchFilter = !activeBranchDetail && ["sales", "payroll", "reports"].includes(activeTab);
  const showDateFilter = !activeBranchDetail && ["sales", "payroll", "reports"].includes(activeTab);

  const getPageTitle = () => {
    if (activeBranchDetail) {
      return `🏢 ${activeBranchDetail.name}`;
    }
    switch (activeTab) {
      case "branches":
        return `🏢 ${t("branchesHub")}`;
      case "inventory":
        return `📦 ${t("productCatalog")}`;
      case "sales":
        return `📊 ${t("centralizedSales")}`;
      case "payroll":
        return `👥 ${t("staffPayroll")}`;
      case "reports":
        return `📥 ${t("exportsReports")}`;
      case "settings":
        return `⚙️ ${t("profileSettings")}`;
      default:
        return pageTitle;
    }
  };

  const getFeatureDetail = () => {
    if (activeBranchDetail) {
      return t("branchDashboardOps", { address: activeBranchDetail.address || "Zamboanga City" });
    }
    switch (activeTab) {
      case "branches":
        return t("branchesHubDesc");
      case "inventory":
        return t("productCatalogDesc");
      case "sales":
        return t("centralizedSalesDesc");
      case "payroll":
        return t("staffPayrollDesc");
      case "reports":
        return t("exportsReportsDesc");
      case "settings":
        return t("profileSettingsDesc");
      default:
        return "";
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 py-3.5 no-print transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Clean Dynamic Page Title & Feature Detail */}
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {getFeatureDetail()}
          </p>
        </div>

        {/* Right: Context Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {activeBranchDetail && onOpenZReport && (
            <button
              onClick={onOpenZReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
              title={t("print58mmZReport")}
            >
              <Printer className="w-3.5 h-3.5" /> {t("print58mmZReport")}
            </button>
          )}

          {/* Branch Dropdown */}
          {showBranchFilter && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t("allActiveBranches")}</option>
                {branches.filter((b) => b.is_active !== false).map((b) => (
                  <option key={b.id} value={String(b.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {b.name} [{b.import_code || b.code}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Selector */}
          {showDateFilter && (
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-2 mr-1" />
              {(["today", "week", "month"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onSelectRange(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    selectedRange === r
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {r === "today" ? t("today") : r === "week" ? t("thisWeek") : t("thisMonth")}
                </button>
              ))}
            </div>
          )}

          {/* Notifications & Live Activity Feed Bell Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t("notificationsTimeline")}
              aria-label={t("notificationsTimeline")}
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <NotificationPanel
                notifications={notifications}
                onClose={() => setIsNotificationOpen(false)}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onClearAll={onClearAllNotifications}
                onAction={(notif) => {
                  setIsNotificationOpen(false);
                  if (onNotificationAction) onNotificationAction(notif);
                }}
              />
            )}
          </div>

          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t("toggleTheme")}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t("syncLatestData")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
