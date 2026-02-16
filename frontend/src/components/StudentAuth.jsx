import React, { useState } from "react";
import {
  ShieldCheck,
  Database,
  Hexagon,
  User,
  Lock,
  Mail,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Building2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api/v1/user";

export default function StudentAuth({ onLogin, onBackToRole }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Registration fields
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");

  const departments = ["CE", "IT", "EC", "ME", "Civil"];

  // Clear messages on input change
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Debug: Log the response structure
      console.log("🔑 Login response received:", {
        statusCode: data.statusCode,
        hasAccessToken: !!data.data?.accessToken,
        hasUser: !!data.data?.user,
        userData: data.data?.user ? { id: data.data.user._id, email: data.data.user.email } : null
      });

      // Validate response structure
      if (!data.data?.accessToken || !data.data?.user) {
        throw new Error("Invalid response: Missing token or user data");
      }

      setSuccess("Login successful!");
      setTimeout(() => {
        onLogin("student", data.data.user._id, data.data.accessToken, data.data.user.department, data.data.user.email, false);
      }, 1000);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!fullName || !regEmail || !regPassword || !confirmPassword || !department) {
      setError("All fields are required");
      return;
    }

    if (regPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate email format
    if (!/^23[a-zA-Z0-9]*@ddu\.ac\.in$/.test(regEmail)) {
      setError("Invalid email. Must be in format: 23xxxxx@ddu.ac.in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName,
          email: regEmail,
          password: regPassword,
          confirmPassword,
          department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Debug: Log the response structure
      console.log("🔑 Registration response received:", {
        statusCode: data.statusCode,
        hasAccessToken: !!data.data?.accessToken,
        hasUser: !!data.data?.user,
        userData: data.data?.user ? { id: data.data.user._id, email: data.data.user.email } : null
      });

      // Validate response structure
      if (!data.data?.accessToken || !data.data?.user) {
        throw new Error("Invalid response: Missing token or user data");
      }

      setSuccess("Registration successful! Please connect your wallet...");
      setTimeout(() => {
        onLogin("student", data.data.user._id, data.data.accessToken, data.data.user.department, data.data.user.email, true);
      }, 1000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Right Side: Auth Form */}
          <div className="glass p-8 rounded-3xl w-full border border-slate-700/50 bg-[#1e293b]/60">
            {/* Back Button */}
            <button
              onClick={onBackToRole}
              className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Role Selection</span>
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
                <Hexagon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isRegistering ? "Create Account" : "Student Login"}
              </h2>
              <p className="text-slate-400">
                {isRegistering
                  ? "Register to access the DApp"
                  : "Sign in to access the DApp"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-500 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 p-4 bg-emerald-900/30 border border-emerald-500 rounded-xl mb-6">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-200 text-sm">{success}</span>
              </div>
            )}

            {/* Login Form */}
            {!isRegistering ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setLoginEmail("");
                    setLoginPassword("");
                    clearMessages();
                  }}
                  className="w-full py-3 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                >
                  Don't have an account? Register here
                </button>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-4">
                  {/* Full Name Input */}
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* Email Input */}
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="23xxxxx@ddu.ac.in"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                  </div>

                  {/* Confirm Password Input */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  {/* Department Select */}
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                    <select
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        clearMessages();
                      }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select your department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setFullName("");
                    setRegEmail("");
                    setRegPassword("");
                    setConfirmPassword("");
                    setDepartment("");
                    clearMessages();
                  }}
                  className="w-full py-3 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                >
                  Already have an account? Login here
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
