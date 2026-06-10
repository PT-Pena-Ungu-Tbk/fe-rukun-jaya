"use client";

import TopNav from "@/components/layout/TopNav";
import { mockStaff } from "@/lib/mockData";
import { timeAgo } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Users, UserCheck, Shield, UserPlus, Activity, Lock, Eye, Check } from "lucide-react";

const WORKFLOW_STEPS = [
  { label: "Staff Onboarding", icon: UserPlus, done: true },
  { label: "Role Assignment", icon: Shield, done: true },
  { label: "POS Access", icon: Lock, done: true },
  { label: "Activity Monitoring", icon: Activity, done: true },
  { label: "Security Audit", icon: Eye, active: true },
];

export default function UserManagementPage() {
  return (
    <div className="flex flex-col h-full">
      <TopNav title="Staff & Access Control" searchPlaceholder="Search staff..." showSearch />
      <div className="p-6 overflow-auto">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800">Staff & Access Control Overview</h2>
          <p className="text-sm text-slate-500">Active personnel monitoring and permission management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium mb-1">Total Registered Staff</p>
            <p className="text-3xl font-bold text-slate-800">12</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <UserCheck className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium mb-1">Active Cashiers</p>
            <p className="text-3xl font-bold text-slate-800">8</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium mb-1">Admin/Owner Accounts</p>
            <p className="text-3xl font-bold text-slate-800">2</p>
          </div>
        </div>

        {/* Access Control Workflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Access Control Workflow</h3>
          <div className="flex items-center gap-3">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    step.active ? "bg-blue-600 text-white" :
                    step.done ? "bg-green-100 text-green-600" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-center text-slate-500 max-w-[64px] font-medium">{step.label}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <div className="h-px bg-slate-200 w-8 mb-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex gap-2 items-center">
              <input placeholder="Search staff..." className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-40" />
              <button className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                All Roles
              </button>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
              <UserPlus className="w-3.5 h-3.5" />
              + Add New User
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Last Active</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {mockStaff.map((s) => (
                <tr key={s.id}>
                  <td className="text-xs font-mono text-slate-500">{s.employee_id}</td>
                  <td className="text-sm font-semibold text-slate-800">{s.full_name}</td>
                  <td>
                    <Badge variant={s.role === "OWNER" ? "blue" : "info"}>
                      {s.role === "OWNER" ? "Owner" : "Cashier"}
                    </Badge>
                  </td>
                  <td className="text-xs text-slate-500">{timeAgo(s.last_active)}</td>
                  <td>
                    <button className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                      s.is_active ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        s.is_active ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
