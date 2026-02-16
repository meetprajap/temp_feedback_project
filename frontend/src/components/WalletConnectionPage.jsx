import React, { useState, useEffect, useRef } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { CheckCircle, AlertTriangle, Loader, Wallet, ArrowLeft } from "lucide-react";

export default function WalletConnectionPage({ onWalletConnected, userName, userRole, notification, userEmail, onBackToLogin, isNewRegistration = false, registeredWallet = null }) {
  const { address: walletAddress, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);

  // Auto-trigger wallet connection callback when wallet is connected
  useEffect(() => {
    if (isConnected && walletAddress && onWalletConnected && !hasProcessed.current) {
      hasProcessed.current = true;
      setIsProcessing(true);
      onWalletConnected(walletAddress);
    }
    
    // Reset processing state if wallet disconnects
    if (!isConnected && hasProcessed.current) {
      hasProcessed.current = false;
      setIsProcessing(false);
    }
  }, [isConnected, walletAddress, onWalletConnected]);

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
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isNewRegistration ? "Connect Your Wallet" : "Verify Your Wallet"}
            </h2>
            <p className="text-slate-400 text-sm">
              {isConnected 
                ? "Wallet connected! Securing your account..." 
                : isNewRegistration
                  ? "Connect your wallet to complete registration and secure your account"
                  : "Connect your registered wallet to login"
              }
            </p>
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
              <div className="w-full overflow-hidden">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-white font-semibold text-sm truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Wallet Connection Section */}
          <div className="mb-6">
            <p className="text-slate-300 text-sm mb-4">
              {isConnected 
                ? "Click your wallet to view options or switch accounts"
                : isNewRegistration
                  ? "Choose your preferred wallet to connect"
                  : registeredWallet 
                    ? `Please connect: ${registeredWallet.slice(0, 6)}...${registeredWallet.slice(-4)}`
                    : "Connect your registered wallet to continue"
              }
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
            {isProcessing && isConnected && (
              <div className="flex items-center justify-center space-x-2 text-indigo-400 mt-4">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Linking to your account...</span>
              </div>
            )}
          </div>

          {/* Connected Wallet Info */}
          {isConnected && walletAddress && (
            <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <p className="text-xs text-emerald-300 mb-2 font-semibold">Connected Wallet</p>
              <p className="text-xs text-emerald-200 font-mono break-all">{walletAddress}</p>
            </div>
          )}

          {/* Info Box */}
          <div className={`p-4 rounded-lg ${
            isNewRegistration 
              ? "bg-emerald-900/20 border border-emerald-500/20"
              : "bg-amber-900/20 border border-amber-500/20"
          }`}>
            <p className={`text-xs leading-relaxed ${
              isNewRegistration ? "text-emerald-300" : "text-amber-300"
            }`}>
              <span className="font-bold">Important:</span> {isConnected 
                ? isNewRegistration
                  ? "This wallet will be saved to your account. Always use this same wallet to login in the future."
                  : "Make sure this is the wallet you registered with. Login requires the same wallet address."
                : isNewRegistration
                  ? "You can choose from MetaMask, WalletConnect, Coinbase Wallet, and more. This wallet will be permanently linked to your account."
                  : registeredWallet
                    ? `You must connect your registered wallet (${registeredWallet.slice(0, 10)}...) to login.`
                    : "You must connect your registered wallet to login. This ensures account security."}
            </p>
          </div>

          {/* Back to Login Button */}
          {onBackToLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={onBackToLogin}
                className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
