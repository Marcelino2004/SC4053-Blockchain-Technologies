"use client";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { useWalletStore } from "@/store/wallet";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { useSettingStore } from "@/store/setting";

const queryClient = new QueryClient();

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    useWalletStore.persist.rehydrate();
    useSettingStore.persist.rehydrate();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <MetaMaskProvider
        debug={true}
        sdkOptions={{
          dappMetadata: {
            name: "SC4053 Project",
            url: process.env.NEXT_PUBLIC_APP_URL,
          },
        }}
      >
        {children}
      </MetaMaskProvider>
    </QueryClientProvider>
  );
}
