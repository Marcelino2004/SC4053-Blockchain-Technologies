import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import { Token } from "@/types/token.type";

interface SettingStoreType {
  tokens: Token[];
  RPCUrl: string;
  DEXAddress: string;

  addToken: (token: Token) => void;
  resetToken: () => void;

  setRPCUrl: (url: string) => void;
  setDEXAddress: (address: string) => void;

  _hasHydrated: boolean;
  _setHasHydrated: () => void;
}

const useSettingStoreBase: StateCreator<SettingStoreType> = (set) => ({
  tokens: [],
  RPCUrl: process.env.NEXT_PUBLIC_WEB3_PROVIDER_URL ?? "",
  DEXAddress: process.env.NEXT_PUBLIC_DEX_ADDRESS ?? "",
  addToken: (token: Token) => {
    set(
      produce<SettingStoreType>((state) => {
        state.tokens.push(token);
      })
    );
  },
  resetToken: () => {
    set(
      produce<SettingStoreType>((state) => {
        state.tokens = [];
      })
    );
  },
  setRPCUrl: (url: string) => {
    set(
      produce<SettingStoreType>((state) => {
        state.RPCUrl = url;
      })
    );
  },
  setDEXAddress: (address: string) => {
    set(
      produce<SettingStoreType>((state) => {
        state.DEXAddress = address;
      })
    );
  },
  _hasHydrated: false,
  _setHasHydrated: () => {
    set(
      produce<SettingStoreType>((state) => {
        state._hasHydrated = true;
      })
    );
  },
});

const persistMiddleware = (creator: StateCreator<SettingStoreType>) =>
  persist<SettingStoreType>(creator, {
    name: "setting",
    skipHydration: true,
    onRehydrateStorage: (state) => {
      return () => state._setHasHydrated();
    },
  });

export const useSettingStore = create<SettingStoreType>()(
  persistMiddleware(useSettingStoreBase)
);
