import "./globals.css";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  TonConnectButton,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAccountBalance, useTonRate } from "./hooks/use-account-balance";
import { beginCell, toNano, Address } from "@ton/ton";
import { useEffect, useState } from "react";

interface TransferTokenParams {
  jettonAmount: bigint;
  destinationAddress: Address;
}

const formSchema = z.object({
  wallet: z.string().min(2).max(50),
  amount: z.string().min(1),
});

export function createTransferBody(params: TransferTokenParams) {
  return beginCell()
    .storeUint(0xf8a7ea5, 32) // jetton transfer op code
    .storeUint(0, 64) // query_id:uint64
    .storeCoins(params.jettonAmount) // amount:(VarUInteger 16) -  Jetton amount for transfer (decimals = 6 - jUSDT, 9 - default)
    .storeAddress(params.destinationAddress) // destination:MsgAddress
    .storeAddress(params.destinationAddress) // response_destination:MsgAddress
    .storeUint(0, 1) // custom_payload:(Maybe ^Cell)
    .storeCoins(toNano(0.05)) // forward_ton_amount:(VarUInteger 16) - if >0, will send notification message
    .storeUint(0, 1) // forward_payload:(Either Cell ^Cell)
    .endCell();
}

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [isTon, setIsTon] = useState(true);
  const wallet = useTonWallet();
  const {
    data: accountBalance,
    isLoading,
    refetch,
  } = useAccountBalance(wallet?.account.address);
  const { data: tonRate } = useTonRate();

  useEffect(() => {
    refetch();
  }, [refetch, wallet]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wallet: "",
      amount: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const myTransaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [
        {
          address: values.wallet, // sender jetton wallet
          amount: toNano(values.amount), // for commission fees, excess will be returned
          payload: createTransferBody({
            destinationAddress: Address.parse(values.wallet),
            jettonAmount: toNano(values.amount),
          })
            .toBoc()
            .toString("base64"), // payload with jetton transfer body
        },
      ],
    };
    tonConnectUI.sendTransaction({
      validUntil: myTransaction.validUntil,
      messages: myTransaction.messages.map((message) => ({
        ...message,
        amount: message.amount.toString(),
      })),
    });
  }

  return (
    <div className="h-full w-full  flex items-center justify-center">
      <Card className="mt-10 min-w-[300px]">
        <CardHeader>
          <CardTitle>Ton Example Form</CardTitle>
          <CardDescription>
            Connect your wallet and transfer funds
          </CardDescription>
          <div className="my-4">
            <TonConnectButton />
            {wallet && (
              <div>
                {isLoading ? (
                  <div>Loading...</div>
                ) : (
                  <div className="mt-4">
                    {accountBalance?.balance && (
                      <div className="flex flex-col gap-2">
                        <span>
                          {" "}
                          Ton Balance:{" "}
                          {(accountBalance?.balance / 1000000000).toFixed(4)}
                        </span>
                        <span>
                          USDT Balance:{" $"}
                          {(
                            (accountBalance?.balance / 1000000000) *
                            // @ts-expect-error 111
                            tonRate?.data.data[0].asks[0][0]
                          ).toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="wallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your wallet address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.0" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is transaction amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Button
                  onClick={() => {
                    setIsTon(!isTon);
                  }}
                  disabled={true}
                  type="button"
                  style={{ backgroundColor: isTon ? "#22c55e" : "#3b82f6" }}
                >
                  {isTon ? (
                    <span>Switch to USDT</span>
                  ) : (
                    <span>Switch to TON</span>
                  )}
                </Button>
              </div>
              <Button disabled={!wallet ? true : false} type="submit">
                Send Transaction
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
