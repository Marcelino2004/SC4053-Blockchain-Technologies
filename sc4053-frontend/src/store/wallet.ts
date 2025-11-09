import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

interface WalletStoreType {
  selectedAccount: string | undefined;
  accounts: string[];
  authenticated: boolean;
  login: (account: string[]) => void;
  setSelectedAccount: (account: string) => void;
  logout: () => void;
  _hasHydrated: boolean;
  _setHasHydrated: () => void;
}

const useWalletStoreBase: StateCreator<WalletStoreType> = (set) => ({
  selectedAccount: undefined,
  accounts: [],
  authenticated: false,
  _hasHydrated: false,
  login: (accounts: string[]) => {
    set(
      produce<WalletStoreType>((state) => {
        state.accounts = accounts;
        state.selectedAccount = accounts[0];
        state.authenticated = true;
      })
    );
  },
  logout: () => {
    set(
      produce<WalletStoreType>((state) => {
        state.accounts = [];
        state.selectedAccount = undefined;
        state.authenticated = false;
      })
    );
  },
  setSelectedAccount: (account: string) => {
    set(
      produce<WalletStoreType>((state) => {
        state.selectedAccount = account;
      })
    );
  },
  _setHasHydrated: () => {
    set(
      produce<WalletStoreType>((state) => {
        state._hasHydrated = true;
      })
    );
  },
});

const persistMiddleware = (creator: StateCreator<WalletStoreType>) =>
  persist<WalletStoreType>(creator, {
    name: "wallet",
    skipHydration: true,
    onRehydrateStorage: (state) => {
      return () => state._setHasHydrated();
    },
  });

export const useWalletStore = create<WalletStoreType>()(
  persistMiddleware(useWalletStoreBase)
);
