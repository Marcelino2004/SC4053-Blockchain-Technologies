import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSettingStore } from "@/store/setting";
import { Token } from "@/types/token.type";
import { getToken } from "@/web3/erc20/getToken";

type AddTokenDialogProps = {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  addToken: (token: Token) => void;
};

export function AddTokenDialog({
  openDialog,
  setOpenDialog,
  addToken,
}: AddTokenDialogProps) {
  const { RPCUrl } = useSettingStore();

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom ERC20 Token</DialogTitle>
          <DialogDescription>
            Enter the address and name of your new ERC20 token
          </DialogDescription>
        </DialogHeader>
        <div className="w-full">
          <form
            className="w-full flex flex-col gap-2"
            onSubmit={(e) => {
              (async (e) => {
                e.preventDefault();
                setOpenDialog(false);
                const address: string = e.currentTarget["address"].value;

                const details = await getToken(RPCUrl, address);

                console.log(details);

                addToken({
                  address,
                  name: details.name,
                  symbol: details.symbol,
                  decimals: details.decimals,
                });
              })(e);
            }}
          >
            <Input
              placeholder="Token Address (0x000...000)"
              maxLength={42}
              minLength={42}
              required={true}
              name="address"
            />

            <Button className="mt-4" type="submit">
              Add Token
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
