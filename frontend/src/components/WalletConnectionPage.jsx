import React, { useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CheckCircle, AlertTriangle, Loader } from "lucide-react";

export default function WalletConnectionPage({ onWalletConnected, userName, userRole, notification, userEmail }) {
  const [isConnecting, setIsConnecting] = useState(false);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#0f172a]">
      <div className="w-full max-w-md">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`fixed top-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center space-x-4 text-white transform transition-all animate-in slide-in-from-bottom duration-500 border ${
              notification.type === "success"
                ? "bg-emerald-900/90 border-emerald-500"
                : "bg-red-900/90 border-red-500"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                notification.type === "success"
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">
                {notification.type === "success" ? "Success" : "Error"}
              </p>
              <p className="text-xs opacity-90">{notification.msg}</p>
            </div>
          </div>
        )}

        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-400 text-sm">Complete your registration by connecting your wallet</p>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-1 h-6 bg-indigo-500 rounded"></div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Account Type</p>
                <p className="text-white font-semibold capitalize">{userRole}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-1 h-6 bg-purple-500 rounded"></div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-white font-semibold text-sm truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Wallet Connection Section */}
          <div className="mb-6">
            <p className="text-slate-300 text-sm mb-4">
              Your wallet will be securely linked to your account and used for transaction verification.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300 leading-relaxed">
              <span className="font-bold">Note:</span> Your wallet address will be saved and verified on future logins. Make sure to use the same wallet you're connecting now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
