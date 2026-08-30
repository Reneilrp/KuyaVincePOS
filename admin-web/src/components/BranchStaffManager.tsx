import React, { useState } from "react";
import { Users, UserX, UserCheck } from "lucide-react";
import { StaffRecord } from "../types";
import { supabase } from "../services/supabaseClient";

interface Props {
  branchId: number | string;
  branchName: string;
  staffList: StaffRecord[];
  onRefreshStaff: () => Promise<void>;
  triggerNotice: (msg: string) => void;
}

export const BranchStaffManager: React.FC<Props> = ({
  branchId,
  branchName,
  staffList,
  onRefreshStaff,
  triggerNotice,
}) => {
  const branchStaff = staffList.filter((s) => Number(s.branch_id) === Number(branchId) && !s.is_deleted);

  // Toggle Active/Disabled Status (Kept for quick operational override)
  const handleToggleStatus = async (staff: StaffRecord) => {
    try {
      const { error } = await supabase
        .from("staff_records")
        .update({ is_active: !staff.is_active })
        .eq("id", staff.id);

      if (error) throw error;
      triggerNotice(`Status for ${staff.name} changed to ${!staff.is_active ? "Active" : "Disabled"}.`);
      await onRefreshStaff();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Cashier Roster & PIN Access ({branchStaff.length})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Employees currently assigned to {branchName} who can log into the POS.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl">
        <div className="text-blue-400 mt-0.5">ℹ️</div>
        <div>
          <p className="text-xs font-bold text-blue-300">Manage staff from Staff & Payroll tab</p>
          <p className="text-xs text-slate-400 mt-1">
            To add cashiers, reset PINs, or update roles, go to the <strong className="text-white">Staff & Payroll</strong> section in the sidebar. Changes sync here automatically.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-500 border-b border-slate-800">
            <tr>
              <th className="p-3.5">Employee Name</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Rate (₱)</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-center">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {branchStaff.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                  No staff members currently assigned to {branchName}.
                </td>
              </tr>
            ) : (
              branchStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-800/50">
                        {staff.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-200">{staff.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-400 capitalize">{staff.role}</td>
                  <td className="p-3.5 font-bold text-slate-200">₱{Number(staff.hourly_rate || 85).toFixed(2)}/hr</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        staff.is_active
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                          : "bg-rose-950/80 text-rose-400 border-rose-800/60"
                      }`}
                    >
                      {staff.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      title={staff.is_active ? "Disable POS Access" : "Enable POS Access"}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition ml-2"
                    >
                      {staff.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
