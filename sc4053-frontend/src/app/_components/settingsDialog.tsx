import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingStore } from "@/store/setting";
import { useWalletStore } from "@/store/wallet";
import { formatAddress } from "@/utils/format";
import { useState } from "react";

type SettingsDialogProps = {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
};

export function SettingsDialog({
  openDialog,
  setOpenDialog,
}: SettingsDialogProps) {
  const { resetToken, RPCUrl, DEXAddress, setRPCUrl, setDEXAddress } =
    useSettingStore();
  const { accounts, selectedAccount, setSelectedAccount } = useWalletStore();

  const [rpcInput, setRPCInput] = useState(RPCUrl);
  const [dexInput, setDexInput] = useState(DEXAddress);

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            You can modify the decentralised exchange system settings and behavior here
          </DialogDescription>
        </DialogHeader>
        <div className="w-full flex flex-col gap-8">
          <div className="w-full flex flex-row justify-between items-center gap-2">
            <div className="w-fit flex flex-col">
              <h5 className="font-semibold">Reset Tokens</h5>
              <p className="text-xs text-slate-500">
                Reset the list of tokens that you have added
              </p>
            </div>
            <Button variant="destructive" onClick={resetToken}>
              Reset
            </Button>
          </div>
          <div className="w-full flex flex-col gap-2">
            <div className="w-fit flex flex-col">
              <h5 className="font-semibold">Switch Account</h5>
              <p className="text-xs text-slate-500">
                Select the account that you have granted access to this
                application
              </p>
            </div>
            <Select
              value={selectedAccount}
              onValueChange={(value) => {
                setSelectedAccount(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => {
                  return (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full flex flex-col gap-2">
            <div className="w-fit flex flex-row items-end gap-2">
              <h5 className="font-semibold">RPC URL</h5>
              <p className="text-xs text-slate-500 p-0.5">Web3 RPC URL</p>
            </div>
            <Input
              type="url"
              value={rpcInput}
              required
              onChange={(e) => {
                setRPCInput(e.target.value);
              }}
              onBlur={() => {
                setRPCUrl(rpcInput);
              }}
            />
          </div>
          <div className="w-full flex flex-col gap-2">
            <div className="w-fit flex flex-row items-end gap-2">
              <h5 className="font-semibold">DEX Address</h5>
              <p className="text-xs text-slate-500 p-0.5">
                Address of DEX Smart Contract
              </p>
            </div>
            <Input
              type="text"
              minLength={42}
              maxLength={42}
              required={true}
              value={dexInput}
              onChange={(e) => {
                setDexInput(e.target.value);
              }}
              onBlur={() => {
                setDEXAddress(dexInput);
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
