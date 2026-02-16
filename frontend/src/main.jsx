import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit';

import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const config = getDefaultConfig({
  appName: 'Student Feedback System',
  projectId: 'bd3d96fe9f320dfab810d9cb24d5c5f1',
  chains: [sepolia],
  ssr: false, // Disable server-side rendering
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="wide" initialChain={sepolia}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);