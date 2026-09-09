import React from "react";
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

  // Toggle Active/Disabled Status
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Cashier Roster & PIN Access ({branchStaff.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Employees currently assigned to {branchName} who can log into the POS.
          </p>
        </div>
      </div>

      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Manage staff from Staff & Payroll tab</p>
        <p className="mt-0.5">
          To add cashiers, reset PINs, or update roles, go to <strong className="text-white">Staff & Payroll</strong> in the sidebar. Changes sync here automatically.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Employee Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Rate (₱)</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {branchStaff.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No staff members currently assigned to {branchName}.
                </td>
              </tr>
            ) : (
              branchStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                        {staff.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{staff.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-400 capitalize">{staff.role}</td>
                  <td className="p-3 font-mono font-medium text-white">₱{Number(staff.hourly_rate || 85).toFixed(2)}/hr</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-medium ${staff.is_active ? "text-emerald-400" : "text-slate-500"}`}>
                      {staff.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      title={staff.is_active ? "Disable POS Access" : "Enable POS Access"}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
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
