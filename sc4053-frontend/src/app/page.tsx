"use client";
import { Combobox } from "@/components/token-combobox";
import { Button } from "@/components/ui/button";
import Web3 from "web3";
import dexABI from "@/web3/dex/dex.abi.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTokenBalance } from "@/web3/erc20/getBalance";
import { useWalletStore } from "@/store/wallet";
import { formatAddress } from "@/utils/format";
import { SDKProvider, useSDK } from "@metamask/sdk-react";
import { CircleHelp, ClipboardList, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSettingStore } from "@/store/setting";
import { matchTrade } from "@/web3/dex/matchTrade";

import { AddTokenDialog } from "./_components/addTokenDialog";
import { SettingsDialog } from "./_components/settingsDialog";
import { encodeAddOrder } from "@/web3/dex/addOrder";
import { encodeApprove } from "@/web3/erc20/approve";
import matchOrderABI from "@/web3/dex/matchTrade.abi.json"; 
import { OrdersDialog } from "./_components/ordersDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMarketPrice } from "@/web3/dex/getPrice";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

const tryMatchOrders = async ({
  provider,
  account,
  DEXAddress,
}: {
  provider?: SDKProvider;
  account: string;
  DEXAddress: string;
}) => {
  await provider?.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to: DEXAddress,
        data: "0x3d18b912", // matchOrders() selector (placeholder)
      },
    ],
  });
};

const executeOrder = async ({
  provider,
  account,
  orderType,
  haveToken,
  wantToken,
  haveAmount,
  wantAmount,
}: {
  provider?: any; // SDK provider
  account: string;
  orderType: number;
  haveToken: string;
  wantToken: string;
  haveAmount: number;
  wantAmount: number;
}) => {
  const { RPCUrl, DEXAddress } = useSettingStore.getState(); // grab store values here

  if (!RPCUrl || !DEXAddress) throw new Error("RPCUrl or DEXAddress not set");

  const have = Number(haveAmount);
  const want = Number(wantAmount);

  if (!have || !want || have <= 0 || want <= 0) {
    throw new Error("Invalid order amounts");
  }

  const price = BigInt(Math.floor((want / have) * 1e18));
  const quantity = BigInt(Math.floor(have * 1e18));


  // Approve token
  await provider?.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to: haveToken,
        data: encodeApprove(RPCUrl, haveToken, DEXAddress, quantity),
      },
    ],
  });

  // Add order
  await provider?.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to: DEXAddress,
        data: encodeAddOrder(RPCUrl, DEXAddress, {
          orderType,
          price,
          quantity,
          tokenPair0: haveToken,
          tokenPair1: wantToken,
        }),
      },
    ],
  });

  // Now try matching orders
  const orderIDs = [/* put your order IDs here */];
  const quantities = orderIDs.map(() => quantity); // example: same quantity for each order
  await matchTrade(RPCUrl, DEXAddress, orderIDs, quantities, account);
};

export default function Home() {
  
  const { selectedAccount, authenticated, logout, _hasHydrated } =
    useWalletStore();
  const { tokens, addToken, RPCUrl, DEXAddress } = useSettingStore();
  const queryClient = useQueryClient();
  const [nextOrderId, setNextOrderId] = useState(1);

  const { sdk, provider } = useSDK();
  const router = useRouter();
  const hasHydrated = useSettingStore(state => state._hasHydrated);
if (!hasHydrated) return null; // prevents hydration mismatch
  useEffect(() => {
    if (_hasHydrated && !authenticated) {
      router.push("/login");
    }
  }, [authenticated, router, _hasHydrated]);

  const handleLogout = () => {
    sdk?.disconnect();
    logout();
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const haveAmount = parseFloat(e.currentTarget["haveAmount"].value);
    const wantAmount = parseFloat(e.currentTarget["wantAmount"].value);
    mutate({
    provider,
    account: selectedAccount ?? "",
    orderType: parseInt(e.currentTarget["orderType"].value),
    haveToken: haveToken ?? "",
    wantToken: wantToken ?? "",
    haveAmount,
    wantAmount,
  });
  };

  const { mutate, isLoading } = useMutation({
  mutationFn: executeOrder,
  onSuccess: (_data, variables) => {
    queryClient.invalidateQueries(["orders", selectedAccount]);
  },
});


  const options = (tokens ?? []).map((token) => ({
    label: `${token.name} (${formatAddress(token.address)})`,
    value: token.address,
  }));

  const [openTokenDialog, setOpenTokenDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [openOrdersDialog, setOpenOrdersDialog] = useState(false);

  const [orderType, setOrderType] = useState<string>("0");

  const [buyAmount, setBuyAmount] = useState<string>("0");
  const [buyAmountDebounced, setBuyAmountDebounced] = useState<string>();
  const [sellAmount, setSellAmount] = useState<string>("0");

  const [haveToken, setHaveToken] = useState<string | undefined>(undefined);
  const [wantToken, setWantToken] = useState<string | undefined>(undefined);
  

  const { data: priceData, isLoading: priceDataLoading } = useQuery(
    ["wantAmount", haveToken, wantToken, buyAmountDebounced],
    () =>
      getMarketPrice(
        RPCUrl,
        DEXAddress,
        haveToken ?? "",
        wantToken ?? "",
        BigInt(
          parseFloat(buyAmountDebounced ?? "0") * 1_000_000_000_000_000_000
        )
      ),
    {
      enabled: !!haveToken && !!wantToken,
    }
  );

  // debounce logic
  useEffect(() => {
    if (orderType === "0") {
      const timeout = setTimeout(() => {
        setBuyAmountDebounced(buyAmount);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [haveToken, wantToken, buyAmount, orderType]);

  // updating sellAmount based on buyAmount
  useEffect(() => {
    if (orderType === "0") {
      const priceFloat = parseFloat(priceData?.price?.toString() ?? "0");
      const priceNum = priceFloat / 1_000_000_000_000_000_000;
      setSellAmount(priceNum.toString());
    }
  }, [priceData, orderType]);

  const enableTokenBalance = !!selectedAccount && !!haveToken;

  const { data: tokenBalance, isLoading: tokenBalanceLoading } = useQuery(
    ["tokenBalance", selectedAccount, haveToken],
    () => getTokenBalance(RPCUrl, selectedAccount ?? "", haveToken ?? ""),
    {
      enabled: enableTokenBalance,
      cacheTime: 10000,
      refetchInterval: 2000,
    }
  );

  const balance = parseFloat(tokenBalance?.formattedBalance ?? "0.0");
  const errorMsg =
    priceData?.error === "LPNotFound"
      ? "LP is not found for the particular token pair"
      : priceData?.error === "LPNoLiquidity"
      ? "No liquidity in pool"
      : priceData?.error === "LPAmountTooLow"
      ? "Amount must be greater than 0"
      : "Unknown error";

  const haveTokenSymbol = tokens?.find((x) => x.address === haveToken)?.symbol;
  const wantTokenSymbol = tokens?.find((x) => x.address === wantToken)?.symbol;
  const price =
    parseFloat(priceData?.price?.toString() ?? "0") /
    parseFloat(buyAmountDebounced ?? "0") /
    1_000_000_000_000_000_000;


  const fetchUserOrders = async () => {
  console.log("fetchUserOrders called with:", { RPCUrl, DEXAddress, selectedAccount });
  
  const web3 = new Web3(RPCUrl);
  const dexContract = new web3.eth.Contract(dexABI as any, DEXAddress);
  
  try {
    const orders = await dexContract.methods.getUserOrders(selectedAccount).call();
    console.log("Raw orders from contract:", orders);
    
    const mappedOrders = orders.map((order: any, index: number) => {
      console.log(`\nMapping order ${index}:`, {
        orderID: order.orderID,
        orderType: order.orderType,
        price: order.price?.toString(),
        quantity: order.quantity?.toString(),
        tokenPair0: order.tokenPair0,
        tokenPair1: order.tokenPair1,
      });

      const priceNum = Number(order.price);
      const quantityNum = Number(order.quantity);
      
      console.log(`Converted values:`, {
        priceNum,
        quantityNum,
        priceIsNaN: isNaN(priceNum),
        quantityIsNaN: isNaN(quantityNum),
      });

      const mapped = {
        id: Number(order.orderID),
        orderType: Number(order.orderType),
        limitPrice: priceNum / 1e18,
        quantity: quantityNum / 1e18,
        tokenPair0: order.tokenPair0,
        tokenPair1: order.tokenPair1,
      };
      
      console.log("Mapped order:", mapped);
      
      // Validate the mapped order
      if (isNaN(mapped.limitPrice)) {
        console.error("⚠️ WARNING: limitPrice is NaN!");
      }
      if (isNaN(mapped.quantity)) {
        console.error("⚠️ WARNING: quantity is NaN!");
      }
      
      return mapped;
    });
    
    console.log("All mapped orders:", mappedOrders);
    return mappedOrders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};


  
  useEffect(() => {
  const interval = setInterval(async () => {
    if (!selectedAccount || !RPCUrl || !DEXAddress) return;

    try {
      console.log("\n=== Watcher Cycle Start ===");
      const orders = await fetchUserOrders();
      
      if (orders.length === 0) {
        console.log("No orders found");
        return;
      }

      console.log(`Found ${orders.length} order(s)`);

      for (const order of orders) {
        console.log(`\n--- Processing Order ${order.id} ---`);
        
        // Skip market orders
        if (order.orderType === 0) {
          console.log("Skipping market order");
          continue;
        }

        // CRITICAL: Validate order data
        if (!order.tokenPair0 || !order.tokenPair1) {
          console.error("❌ Invalid token pair:", order);
          continue;
        }

        if (isNaN(order.quantity) || order.quantity <= 0) {
          console.error("❌ Invalid quantity:", order.quantity);
          continue;
        }

        if (isNaN(order.limitPrice)) {
          console.error("❌ Invalid limitPrice:", order.limitPrice);
          continue;
        }

        console.log("Order data:", {
          id: order.id,
          type: order.orderType === 1 ? "Limit" : "Stop",
          limitPrice: order.limitPrice,
          quantity: order.quantity,
          tokens: `${order.tokenPair0.slice(0, 6)}...${order.tokenPair0.slice(-4)} → ${order.tokenPair1.slice(0, 6)}...${order.tokenPair1.slice(-4)}`
        });

        try {
          // Get market price
          const priceData = await getMarketPrice(
            RPCUrl,
            DEXAddress,
            order.tokenPair0,
            order.tokenPair1,
            BigInt(1e18)
          );

          if (!priceData || !priceData.price) {
            console.error("❌ Invalid price data:", priceData);
            continue;
          }

          const marketPrice = parseFloat(priceData.price.toString()) / 1e18;
          const orderPrice = order.limitPrice;

          console.log("Price check:", {
            marketPrice: marketPrice.toFixed(6),
            orderPrice: orderPrice.toFixed(6),
          });

          // Check if NaN before comparing
          if (isNaN(marketPrice) || isNaN(orderPrice)) {
            console.error("❌ NaN in price comparison:", { marketPrice, orderPrice });
            continue;
          }

          let shouldExecute = false;
          if (order.orderType === 1) {
            shouldExecute = marketPrice >= orderPrice;
            console.log(`Limit: ${marketPrice.toFixed(6)} >= ${orderPrice.toFixed(6)} = ${shouldExecute}`);
          } else if (order.orderType === 2) {
            shouldExecute = marketPrice <= orderPrice;
            console.log(`Stop: ${marketPrice.toFixed(6)} <= ${orderPrice.toFixed(6)} = ${shouldExecute}`);
          }

          if (shouldExecute) {
            console.log(`✓ Executing order ${order.id}`);
            
            // CRITICAL: Validate quantity before converting to BigInt
            const executeQuantity = order.quantity * 0.5; // 50% partial fill
            
            if (isNaN(executeQuantity) || executeQuantity <= 0) {
              console.error("❌ Invalid execute quantity:", executeQuantity);
              continue;
            }

            console.log(`Quantity: ${executeQuantity} (50% of ${order.quantity})`);
            
            // Safe conversion to BigInt
            const quantityInWei = BigInt(Math.floor(executeQuantity * 1e18));
            console.log(`Quantity in wei: ${quantityInWei.toString()}`);

            try {
              const result = await matchTrade(
                RPCUrl, 
                DEXAddress, 
                [order.id], 
                [quantityInWei], 
                selectedAccount
              );
              
              console.log(`✓ Order ${order.id} executed successfully`);
              queryClient.invalidateQueries(["orders", selectedAccount]);
              
            } catch (error: any) {
              console.error(`✗ matchTrade failed for order ${order.id}`);
              
              if (error.message?.includes("Price") || error.message?.includes("requirement")) {
                console.log(`⏳ Price condition no longer met, will retry`);
              } else if (error.message?.includes("orderID doesn't exist")) {
                console.log(`⏳ Order was already executed/cancelled`);
              } else {
                console.error(`Error:`, error.message);
                console.error(`Full error:`, error);
              }
            }
          } else {
            console.log(`⏸️ Order ${order.id} not ready yet`);
          }
          
        } catch (priceError) {
          console.error(`❌ Failed to get price for order ${order.id}:`, priceError);
        }
      }
      
      console.log("=== Watcher Cycle End ===\n");
      
    } catch (error) {
      console.error("❌ Watcher error:", error);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [selectedAccount, RPCUrl, DEXAddress, queryClient]);



  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl text-blue-600 font-extrabold leading-normal">
        SC4053 Project
      </h1>

      <p className="text-xl font-semibold text-slate-600 -mt-2">Decentralised Exchange System</p>
      <AddTokenDialog
        openDialog={openTokenDialog}
        setOpenDialog={setOpenTokenDialog}
        addToken={addToken}
      />
      <SettingsDialog
        openDialog={openSettingsDialog}
        setOpenDialog={setOpenSettingsDialog}
      />
      <OrdersDialog
        provider={provider}
        openDialog={openOrdersDialog}
        setOpenDialog={setOpenOrdersDialog}
      />
      <Card className="relative mt-4 w-full max-w-[768px]">
        <CardHeader className="w-full">
          <CardTitle className="text-3xl font-bold w-full">Tokens Swap</CardTitle>
          <CardDescription>
            Create a new order by choosing the tokens and the amount to swap.
            <br />
            Currently logged in as{" "}
            <span className="inline font-mono">
              {formatAddress(selectedAccount ?? "")}
            </span>
            .{" "}
            <a
              className="text-white hover:text-white/60 underline transition-opacity duration-300 cursor-pointer"
              onClick={handleLogout}
            >
              Logout?
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row gap-2 justify-end absolute top-0 right-0 px-6 py-6">
            <Button
              variant="outline"
              className="px-2 py-2 aspect-square"
              onClick={() => setOpenSettingsDialog(true)}
            >
              <SettingsIcon />
            </Button>
            <Button
              variant="outline"
              className="px-2 py-2 aspect-square"
              onClick={() => setOpenOrdersDialog(true)}
            >
              <ClipboardList />
            </Button>
          </div>
          <form className="flex flex-col gap-4 " onSubmit={submitHandler}>
            <div className="border bg-white border-slate-500 rounded-xl p-4 mt-0">
              <div className="flex flex-row items-center gap-2 justify-between">
                <div className="w-full flex flex-row items-center font-semibold text-lg">
                  <h6 className="p-1 mr-8">From</h6>
                  <Combobox
                    value={haveToken}
                    onChange={setHaveToken}
                    onAddCustom={() => setOpenTokenDialog(true)}
                    options={options}
                    placeholder="Select a token"
                    searchPlaceholder="Search for a token"
                    emptySearchPlaceholder="No tokens found"
                  />
                </div>
              </div>

              <div className="flex flex-row items-center font-semibold text-lg">
              <h6 className="p-1 mr-3">Balance</h6>
                  <p className="text-sm font-medium text-slate-800">
                    {!enableTokenBalance
                      ? ""
                      : tokenBalanceLoading
                      ? "Loading..."
                      : `${tokenBalance?.formattedBalance?.substring(
                          0,
                          5
                        )}`}
                  </p>
                </div>

              <div className="mt-4 ">
                <Input
                  disabled={!haveToken}
                  value={buyAmount}
                  onChange={(e) => {
                    setBuyAmount(e.target.value);
                  }}
                  type="number"
                  name="haveAmount"
                  required
                  step={0.000_000_000_000_000_001}
                  placeholder={
                    haveToken
                      ? `Enter the number of ${haveTokenSymbol} tokens`
                      : ""
                  }
                  max={balance}
                />
              </div>
            </div>

            <div className="border bg-white border-slate-500 rounded-xl p-4 mt-2">
              <div className="w-full flex flex-row items-center gap-2 font-semibold text-lg">
                <h6 className="p-1 mr-8">To</h6>
                <Combobox
                  value={wantToken}
                  onChange={setWantToken}
                  onAddCustom={() => setOpenTokenDialog(true)}
                  options={options.filter((x) => x.value !== haveToken)}
                  placeholder="Select a token"
                  searchPlaceholder="Search for a token"
                  emptySearchPlaceholder="No tokens found"
                  disabled={!haveToken}
                />
              </div>
              <div className="mt-4">
                <Input
                  type="number"
                  disabled={!wantToken || priceDataLoading || orderType === "0"}
                  name="wantAmount"
                  value={sellAmount}
                  onChange={(e) => {
                    if (orderType !== "0") setSellAmount(e.target.value);
                  }}
                  step={0.000_000_000_000_000_001}
                  required
                  placeholder={
                    wantToken
                      ? `Enter the number of ${wantTokenSymbol} tokens`
                      : ""
                  }
                />
              </div>
            </div>
            <div className="flex flex-row items-center gap-4">
              <h6 className="w-fit font-semibold text-white text-lg">Order type</h6>
              <Select
                required
                name="orderType"
                value={orderType}
                onValueChange={(x) => setOrderType(x)}
              >
                <SelectTrigger className="w-[250px] font-semibold bg-white">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Market Order</SelectItem>
                  <SelectItem value="1">Limit Order</SelectItem>
                  <SelectItem value="2">Stop Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === "0" &&
              !priceData?.error &&
              haveToken &&
              wantToken &&
              buyAmountDebounced && (
                <div className="bg-blue-700 p-2 pl-4 rounded-sm -mb-5">
                  <p className="text-sm text-slate-100">
                    Market Price: 1 {haveTokenSymbol} ≈ {price}{" "}
                    {wantTokenSymbol}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="w-fit -mt-4">
                        <div className="text-xs text-slate-50 flex flex-row gap-1 items-center">
                          <CircleHelp className="inline" size={16} />
                          <p className="underline">
                            Why is the price changing with my purchasing amount?
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          Market price is calculated based on the current
                          liquidity in the pool. As more trades are made, the
                          price may change.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            <div>
              <p className={`text-sm p-2 rounded-sm font-semibold text-semilight ${priceData?.error? "bg-rose-500 text-white": "bg-transparent text-gray-700"}`}>
                {priceData?.error && errorMsg}
                </p>
            </div>
            <Button
              className="bg-blue-900 text-white"
              disabled={isLoading || (!priceData?.success && orderType === "0")}
              type="submit"
            >
              {isLoading ? "Executing..." : "Execute"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
