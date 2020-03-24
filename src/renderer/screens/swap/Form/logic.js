// @flow

import { BigNumber } from "bignumber.js";
import type { Exchange, ExchangeRate } from "@ledgerhq/live-common/lib/swap/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";

export type SwapState = {
  swap: {
    exchange: Exchange,
    exchangeRate: ExchangeRate,
    validFrom: AccountLike[],
    toCurrency: ?CryptoCurrency | TokenCurrency,
    error: ?Error,
    isLoading: boolean,
  },
};
export const initState: (AccountLike[]) => SwapState = validFrom => ({
  swap: {
    exchange: {
      fromAccount: validFrom && validFrom.length ? validFrom[0] : null,
      toAccount: null,
      fromAmount: BigNumber(0),
    },
    exchangeRate: null,
  },
  toCurrency: null,
  validFrom,
  error: null,
  isLoading: false,
});

export const reducer = (state, { type, payload }) => {
  switch (type) {
    case "patchExchange":
      return {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: { ...state.swap.exchange, ...payload },
        },
        error: null,
      };
    case "fetchRates":
      return { ...state, isLoading: true, error: null };
    case "setRate":
      return {
        ...state,
        swap: { ...state.swap, exchangeRate: payload.rate },
        isLoading: false,
        error: null,
      };
    case "setToCurrency":
      return {
        ...state,
        swap: { ...state.swap, exchange: { ...state.swap.exchange, toAccount: null } },
        toCurrency: payload.toCurrency,
      };
    case "setError":
      return { ...state, isLoading: false, error: payload.error };
    default:
      throw new Error();
  }
};
