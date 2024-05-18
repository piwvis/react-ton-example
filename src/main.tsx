import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </TonConnectUIProvider>
  </React.StrictMode>
);
