import React, { useState } from "react";
import {
  ShieldCheck,
  Database,
  Hexagon,
  User,
  Lock,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import StudentAuth from "./StudentAuth";

export default function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!adminEmail || !adminPassword || !adminKey) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/v1/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          adminKey: adminKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Debug: Log the response structure
      console.log("🔑 Admin login response received:", {
        statusCode: data.statusCode,
        hasAccessToken: !!data.data?.accessToken,
        hasUser: !!data.data?.user,
        userData: data.data?.user ? { id: data.data.user._id, email: data.data.user.email } : null
      });

      // Validate response structure
      if (!data.data?.accessToken || !data.data?.user) {
        throw new Error("Invalid response: Missing token or user data");
      }

      onLogin("admin", data.data.user._id, data.data.accessToken, null, data.data.user.email, false);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("❌ Admin login error:", err);
      setLoading(false);
    }
  };

  // If student is selected, show StudentAuth component
  if (role === "student") {
    return (
      <StudentAuth
        onLogin={onLogin}
        onBackToRole={() => {
          setRole(null);
          setAdminKey("");
        }}
      />
    );
  }

  // If admin is selected, show admin login
  if (role === "admin") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex overflow-hidden relative font-sans text-slate-100">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-float"></div>
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container mx-auto flex items-center justify-center relative z-10 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-5xl items-center">
            {/* Left Side: Branding */}
            <div className="hidden lg:block space-y-8">
              <div className="inline-flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 text-sm font-medium tracking-wide">
                  Blockchain Mainnet Live
                </span>
              </div>

              <h1 className="text-6xl font-extrabold text-white leading-tight">
                Feedback that <br />
                <span className="text-gradient">Cannot be Deleted.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                A decentralized student feedback system powered by Ethereum smart
                contracts. Anonymous. Immutable. Transparent.
              </p>

              <div className="flex space-x-4">
                <div className="flex flex-col p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <ShieldCheck className="w-8 h-8 text-indigo-400 mb-2" />
                  <span className="text-slate-200 font-bold">Anonymous</span>
                  <span className="text-xs text-slate-500">
                    Zero-Knowledge Proofs
                  </span>
                </div>
                <div className="flex flex-col p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Database className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-slate-200 font-bold">Immutable</span>
                  <span className="text-xs text-slate-500">Permanent Ledger</span>
                </div>
              </div>
            </div>

            {/* Right Side: Admin Login Form */}
            <div className="glass p-8 rounded-3xl w-full border border-slate-700/50 bg-[#1e293b]/60">
              <button
                onClick={() => setRole(null)}
                className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span>Back to Role Selection</span>
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Admin Login</h2>
                <p className="text-slate-400">Sign in to access admin controls</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter Email"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter Password"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="text"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="Enter Admin Key"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-slate-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed border border-slate-600"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Connect Wallet</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex overflow-hidden relative font-sans text-slate-100">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-float"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container mx-auto flex items-center justify-center relative z-10 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-5xl items-center">
          {/* Left Side: Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="inline-flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-sm font-medium tracking-wide">
                Blockchain Mainnet Live
              </span>
            </div>

            <h1 className="text-6xl font-extrabold text-white leading-tight">
              Feedback that <br />
              <span className="text-gradient">Cannot be Deleted.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              A decentralized student feedback system powered by Ethereum smart
              contracts. Anonymous. Immutable. Transparent.
            </p>

            <div className="flex space-x-4">
              <div className="flex flex-col p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <ShieldCheck className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-slate-200 font-bold">Anonymous</span>
                <span className="text-xs text-slate-500">
                  Zero-Knowledge Proofs
                </span>
              </div>
              <div className="flex flex-col p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <Database className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="text-slate-200 font-bold">Immutable</span>
                <span className="text-xs text-slate-500">Permanent Ledger</span>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="glass p-8 rounded-3xl w-full border border-slate-700/50 bg-[#1e293b]/60">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
                <Hexagon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-slate-400">Sign in to access the DApp</p>
            </div>

            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-slate-300 text-lg">Select your role to continue</p>
              </div>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setRole("student")}
                  className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold text-xl shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  <User className="w-6 h-6" />
                  <span>Student</span>
                </button>
                
                <button
                  onClick={() => setRole("admin")}
                  className="w-full py-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl text-white font-bold text-xl shadow-lg hover:shadow-slate-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 border border-slate-600"
                >
                  <Lock className="w-6 h-6" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
