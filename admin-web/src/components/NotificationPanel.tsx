import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  CloudUpload, 
  AlertTriangle, 
  Clock, 
  Info, 
  ExternalLink,
  ShoppingBag,
  Package,
  Users
} from "lucide-react";
import { AppNotification } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onAction?: (notification: AppNotification) => void;
}

type FilterCategory = "all" | "sync" | "stock" | "staff";

export const NotificationPanel: React.FC<Props> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onAction
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterCategory>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Outside Click or Esc Key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "sync") return item.type === "batch_sync";
    if (filter === "stock") return item.type === "low_stock";
    if (filter === "staff") return item.type === "staff_shift";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatRelativeTime = (timestamp: string) => {
    try {
      const now = Date.now();
      const date = new Date(timestamp).getTime();
      const diffSec = Math.floor((now - date) / 1000);

      if (isNaN(diffSec) || diffSec < 45) return t("syncedJustNow");
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return timestamp;
    }
  };

  const getItemIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "batch_sync":
        return <CloudUpload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "low_stock":
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "staff_shift":
        return <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getItemBadgeBg = (type: AppNotification["type"]) => {
    switch (type) {
      case "batch_sync":
        return "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60";
      case "low_stock":
        return "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60";
      case "staff_shift":
        return "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/60";
      default:
        return "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60";
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 sm:w-[420px] max-w-[92vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
      style={{ top: "100%" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("notificationsTimeline")}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
                    {t("unreadCount", { count: unreadCount })}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("notificationsDesc")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Category Tabs */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("allNotifications")} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("sync")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 ${
                filter === "sync"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              {t("syncAndSales")}
            </button>
            <button
              onClick={() => setFilter("stock")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 ${
                filter === "stock"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Package className="w-3 h-3" />
              {t("inventoryAlerts")}
            </button>
            <button
              onClick={() => setFilter("staff")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 ${
                filter === "staff"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3 h-3" />
              {t("staffEvents")}
            </button>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={t("markAllAsRead")}
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={t("clearAll")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Timeline List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <CheckCheck className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("noNotifications")}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {t("noNotificationsDesc")}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onMarkAsRead(n.id);
                if (onAction) onAction(n);
              }}
              className={`p-3 rounded-xl transition-all cursor-pointer group flex items-start gap-3 ${
                n.read
                  ? "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80"
                  : "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40"
              }`}
            >
              {/* Type Badge */}
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${getItemBadgeBg(
                  n.type
                )}`}
              >
                {getItemIcon(n.type)}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {n.branch_name && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        🏢 {n.branch_name}
                      </span>
                    )}
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {n.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {formatRelativeTime(n.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {/* Additional Metadata / Quick Action */}
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-1 group-hover:underline">
                    {n.type === "batch_sync"
                      ? t("viewBranch")
                      : n.type === "low_stock"
                      ? t("viewItem")
                      : t("viewBranch")}
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-center">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          {t("liveBranchFeed")}
        </span>
      </div>
    </div>
  );
};
