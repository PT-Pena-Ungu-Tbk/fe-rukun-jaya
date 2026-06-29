"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { saveAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      toast.error("Email/username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const json = await authApi.login({
        email_or_username: emailOrUsername,
        password,
        remember_me: true,
      });
      // Real API response: { data: { access_token, user: { id, name/nama_lengkap, email, role } } }
      const payload = json.data ?? json;
      const token = payload.access_token;
      if (!token) throw new Error("Token tidak ditemukan dalam response login");
      const user = payload.user;
      const displayName = user.nama_lengkap ?? user.email ?? "User";
      const role = user.role ?? "CASHIER";
      saveAuth(token, { id: user.id ?? "0", name: displayName, email: user.email ?? emailOrUsername, role });
      toast.success(`Selamat datang, ${displayName}!`);
      router.push(role === "OWNER" ? "/dashboard" : "/pos");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message;
      toast.error(msg ?? "Email/username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role: "OWNER" | "CASHIER") => {
    const mockUser = role === "OWNER"
      ? { id: "STF001", name: "Andi Wijaya", email: "owner@rukunajaya.id", role: "OWNER" as const }
      : { id: "STF002", name: "Siti Aminah", email: "kasir@rukunajaya.id", role: "CASHIER" as const };
    saveAuth("demo-token-" + role, mockUser);
    toast.success(`Demo login sebagai ${role === "OWNER" ? "Owner" : "Kasir"}`);
    router.push(role === "OWNER" ? "/dashboard" : "/pos");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-[40%] bg-blue-600 flex flex-col justify-between p-10 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-blue-600 font-extrabold text-lg">RJ</span>
          </div>
          <span className="text-white font-bold text-xl">Toko Rukun Jaya</span>
        </div>

        <div className="animate-slide-up stagger-2">
          <h2 className="text-white font-bold text-2xl leading-snug mb-3">
            Enterprise Inventory &<br />POS Management System
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Streamline your warehouse operations, track materials with
            precision, and manage retail sales from a single, robust
            platform designed for building supply enterprises.
          </p>
        </div>
        <div />
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex items-center justify-center px-10">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h3>
            <p className="text-sm text-gray-500 mb-6">Please enter your credentials to access the system.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Email or Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="admin@ciailing.com"
                    className="form-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={15} /></>}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">Demo login</p>
              <div className="flex gap-2">
                <button onClick={() => demoLogin("OWNER")}
                  className="flex-1 py-2 text-xs font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  Owner
                </button>
                <button onClick={() => demoLogin("CASHIER")}
                  className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Kasir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
