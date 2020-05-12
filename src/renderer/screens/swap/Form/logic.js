// @flow

import { BigNumber } from "bignumber.js";
import type { Exchange, ExchangeRate } from "@ledgerhq/live-common/lib/swap/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { accountWithMandatoryTokens, getAccountCurrency } from "@ledgerhq/live-common/lib/account";

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

export const initState: (AccountLike[]) => SwapState = ({ accounts, selectableCurrencies }) => {
  const fromCurrency = selectableCurrencies[0];
  const fromAccount = fromCurrency ? accounts.find(a => a.currency === fromCurrency) : null;
  const validFrom = accounts.filter(a => a.currency === fromCurrency);
  const toCurrency = selectableCurrencies.find(c => c !== fromCurrency);
  const validTo = accounts.filter(a => a.currency === toCurrency);
  const toAccount = toCurrency ? accounts.find(a => a.currency === toCurrency) : null;

  return {
    swap: {
      exchange: {
        fromCurrency,
        fromAccount,
        fromAmount: BigNumber(0),
        toCurrency,
        toAccount,
      },
      exchangeRate: null,
    },
    validFrom,
    validTo,
    error: null,
    isLoading: false,
    accounts,
    selectableCurrencies,
  };
};

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
    case "setFromCurrency": {
      const fromAccount = state.accounts.find(a => a.currency === payload.fromCurrency);
      const toCurrency = state.selectableCurrencies.find(c => c !== payload.fromCurrency);
      const toAccount = state.accounts.find(a => a.currency === toCurrency);

      return {
        ...state,
        swap: {
          ...state.swap,
          exchange: {
            ...state.swap.exchange,
            fromCurrency: payload.fromCurrency,
            fromAccount,
            toCurrency,
            toAccount,
          },
        },
        validFrom: state.accounts.filter(a => payload.fromCurrency === a.currency),
        validTo: state.accounts.filter(a => toCurrency === a.currency),
      };
    }
    case "setFromAccount": {
      return {
        ...state,
        swap: {
          ...state.swap,
          exchange: {
            ...state.swap.exchange,
            fromAccount: payload.fromAccount,
          },
        },
      };
    }
    case "setToCurrency": {
      const accounts = state.validFrom.filter(a => {
        const mainToCurrency = payload.toCurrency.parentCurrency || payload.toCurrency;
        return getAccountCurrency(a).id === mainToCurrency.id;
      });

      const validTo = accounts.map(a => accountWithMandatoryTokens(a, [payload.toCurrency]));

      return {
        ...state,
        validTo,
        swap: {
          ...state.swap,
          exchange: {
            ...state.swap.exchange,
            toCurrency: payload.toCurrency,
            toAccount: state.accounts.find(a => a.currency === payload.toCurrency),
          },
        },
      };
    }
    case "setError":
      return { ...state, isLoading: false, error: payload.error };
    default:
      throw new Error();
  }
};
