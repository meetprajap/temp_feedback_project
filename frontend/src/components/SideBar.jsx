import React from "react";
import {
  Hexagon,
  LayoutDashboard,
  LogOut,
  BookOpen,
  CheckCircle,
} from "lucide-react";

export default function Sidebar({
  user,
  currentView,
  setCurrentView,
  onLogout,
}) {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
      <div className="p-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Hexagon className="w-6 h-6 text-white" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight text-white">
          Feed<span className="text-indigo-400">lith</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Main Menu
        </p>

        <button
          onClick={() => setCurrentView("dashboard")}
          className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
            currentView === "dashboard"
              ? "bg-indigo-600 shadow-lg shadow-indigo-900/20 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>

        {user.role === "admin" && (
          <>
            <button
              onClick={() => setCurrentView("courses")}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                currentView === "courses"
                  ? "bg-indigo-600 shadow-lg shadow-indigo-900/20 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Course Management</span>
            </button>
            <button
              onClick={() => setCurrentView("feedbackReport")}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                currentView === "feedbackReport"
                  ? "bg-indigo-600 shadow-lg shadow-indigo-900/20 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Feedback Report</span>
            </button>
          </>
        )}
      </nav>

      {/* User Profile Mini Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-900 font-bold text-sm shadow-md">
              {user.id.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                User {user.id}
              </p>
              <p className="text-xs text-indigo-400 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Connected
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 text-slate-400 py-2 rounded-lg border border-transparent transition-all text-xs font-bold"
          >
            <LogOut className="w-3 h-3" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
