"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/lib/store/hook";
import { makeCurrencyFormatter } from "@/lib/utils/currencyFormat";

export function useCurrency() {
  const currencycode = useAppSelector((s) => s.store.data?.currencycode);
  return useMemo(() => makeCurrencyFormatter(currencycode), [currencycode]);
}
