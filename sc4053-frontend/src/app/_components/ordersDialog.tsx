import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useSettingStore } from "@/store/setting";
import { useWalletStore } from "@/store/wallet";
import { Token } from "@/types/token.type";
import { encodeCancelOrder } from "@/web3/dex/cancelOrder";
import { getUserOrders } from "@/web3/dex/getUserOrders";
import { SDKProvider } from "@metamask/sdk-react";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

type SettingsDialogProps = {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  provider?: SDKProvider;
};

export function OrdersDialog({
  openDialog,
  setOpenDialog,
  provider,
}: SettingsDialogProps) {
  const { tokens, DEXAddress, RPCUrl } = useSettingStore();
  const { selectedAccount } = useWalletStore();

  const tokenHashMap = useMemo(
    () =>
      tokens.reduce((acc, token) => {
        acc[token.address] = token;
        return acc;
      }, {} as Record<string, Token>),
    [tokens]
  );

  const cancelHandler = async ({
    orderID,
    RPCUrl,
    DEXAddress,
    accountAddress,
  }: {
    orderID: number;
    RPCUrl: string;
    DEXAddress: string;
    accountAddress: string;
  }) => {
    const tx = encodeCancelOrder(RPCUrl, DEXAddress, orderID);

    if (!provider) return;

    await provider.request({
      method: "eth_sendTransaction",
      params: [{ from: accountAddress, to: DEXAddress, data: tx }],
    });
  };
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useMutation({
    mutationFn: cancelHandler,
    onSuccess: () => {
      queryClient.invalidateQueries(["orders", selectedAccount]);
    },
  });

  const { data } = useQuery(
    ["orders", selectedAccount],
    () => getUserOrders(DEXAddress ?? "", selectedAccount ?? ""),
    {
      enabled: !!selectedAccount,
    }
  );
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Active Orders</DialogTitle>
          <DialogDescription>View your unfinished order here</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto flex flex-col gap-4">
          {data
            ?.sort((a, b) => parseInt(a.orderID) - parseInt(b.orderID))
            .map((order) => {
              const formattedQuantity = Number(order.quantity) / 10 ** 18;
              const formattedPrice = Number(order.price) / 10 ** 18;

              const quantityLeft =
                Number((order.quantity * order.price) / BigInt(10 ** 18)) /
                10 ** 18;

              const orderType =
                order.orderType === 0
                  ? "Market"
                  : order.orderType === 1
                  ? "Limit"
                  : "Stop";

              return (
                <div
                  key={order.orderID}
                  className="border border-slate-300 p-4 rounded-2xl"
                >
                  <p>Order ID: {order.orderID}</p>
                  <p>
                    Token:{" "}
                    <span className="font-mono bg-slate-100 px-1">
                      {tokenHashMap[order.tokenPair0]?.symbol}
                    </span>{" "}
                    to{" "}
                    <span className="font-mono bg-slate-100 px-1">
                      {tokenHashMap[order.tokenPair1]?.symbol}
                    </span>
                  </p>
                  <p>Price: {formattedPrice}</p>
                  <p>Quantity: {formattedQuantity}</p>
                  <p>Token left to fulfill: {quantityLeft}</p>
                  <p>Order Type: {orderType}</p>
                  <Button
                    variant="destructive"
                    className="mt-2 disabled:opacity-75"
                    disabled={isLoading}
                    onClick={() => {
                      const intId = parseInt(order.orderID);
                      mutate({
                        accountAddress: selectedAccount ?? "",
                        orderID: intId,
                        RPCUrl,
                        DEXAddress,
                      });
                    }}
                  >
                    Cancel Order {order.orderID}
                  </Button>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
