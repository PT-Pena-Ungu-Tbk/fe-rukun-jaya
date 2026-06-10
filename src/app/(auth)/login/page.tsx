"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Lock, Building2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "create">("signin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(form);
      saveAuth(res.data.token, res.data.user);
      toast.success(`Selamat datang, ${res.data.user.name}!`);
      if (res.data.user.role === "CASHIER") {
        router.push("/pos");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Email atau password salah.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (role: "owner" | "cashier") => {
    setLoading(true);
    const credentials = {
      owner: { email: "owner@toko-rukunjaya.com", password: "password_rahasia" },
      cashier: { email: "cashier@toko-rukunjaya.com", password: "password_rahasia" },
    };
    try {
      const res = await authApi.login(credentials[role]);
      saveAuth(res.data.token, res.data.user);
      toast.success(`Login sebagai ${role === "owner" ? "Owner" : "Kasir"}`);
      router.push(role === "owner" ? "/dashboard" : "/pos");
    } catch {
      // fallback mock for demo
      const mockUser = {
        id: "mock-id",
        name: role === "owner" ? "Owner Demo" : "Cashier Demo",
        email: credentials[role].email,
        role: role === "owner" ? ("OWNER" as const) : ("CASHIER" as const),
      };
      saveAuth("mock-token", mockUser);
      router.push(role === "owner" ? "/dashboard" : "/pos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="w-5/12 bg-blue-600 flex flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold">Toko Bangunan</p>
            <p className="text-xl font-bold">Ci Ailing</p>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Enterprise Inventory &amp; POS Management System
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Streamline your warehouse operations, track materials with precision, and manage retail
            sales from a single, robust platform designed for building supply enterprises.
          </p>
        </div>
        <p className="text-blue-300 text-xs">
          © 2024 TimberFlow ERP Systems. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                tab === "signin"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("create")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                tab === "create"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Create Account
            </button>
          </div>

          {tab === "signin" ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">Welcome back</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please enter your credentials to access the system.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="admin@ciailing.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300" />
                    Remember me
                  </label>
                  <button type="button" className="text-sm text-blue-600 hover:underline">
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  Sign In →
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">Or quick login for demo</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Demo buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => loginAsDemo("owner")}
                  disabled={loading}
                  className="py-2.5 border border-slate-300 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Login as Owner
                </button>
                <button
                  onClick={() => loginAsDemo("cashier")}
                  disabled={loading}
                  className="py-2.5 border border-slate-300 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Login as Cashier
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-5">
                Need help accessing your account?{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Contact System Admin
                </a>
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">
                Pembuatan akun dilakukan oleh System Admin.
                <br />
                Hubungi admin untuk mendapatkan akses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
