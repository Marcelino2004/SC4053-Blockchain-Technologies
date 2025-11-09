"use client";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSDK } from "@metamask/sdk-react";
import { useEffect } from "react";
import { useWalletStore } from "@/store/wallet";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const { authenticated, login } = useWalletStore();
  const { sdk, connected } = useSDK();

  useEffect(() => {
    if (authenticated && connected) {
      router.push("/");
    }
  }, [authenticated, router, connected]);

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      if (!accounts?.[0]) {
        throw new Error("No account found");
      }
      login(accounts);
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Connect to MetaMask
            </CardTitle>
            <CardDescription>
              Click the button bellow to connect your MetaMask wallet to our
              application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connect}>
              <Wallet size={16} /> Connect
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
