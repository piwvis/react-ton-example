import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface AccountBalance {
  address: string;
  balance: number;
}

interface TonRate {
  data: [{ asks: [number[]]; bids: [number[]] }];
}

export const useAccountBalance = (address: string | undefined) => {
  const query = useQuery({
    queryKey: ["account-balance"],
    queryFn: () => queryApiTonConsole<AccountBalance | null>(address),
    retry: true,
    staleTime: 1000 * 60 * 5,
  });
  return query;
};

export const useTonRate = () => {
  const query = useQuery({
    queryKey: ["ton-rate"],
    queryFn: () =>
      axios.get<{ data: TonRate }>(
        "https://www.okx.com/api/v5/market/books?instId=TON-USDT"
      ),
    retry: true,
    staleTime: 1000 * 60 * 5,
  });
  return query;
};

export async function queryApiTonConsole<T>(
  endpoint: string | undefined
): Promise<T> {
  const url = `https://tonapi.io/v2/blockchain/accounts/${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP error " + response.status);
  }
  return response.json() as Promise<T>;
}
