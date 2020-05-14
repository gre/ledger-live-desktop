// @flow

import { BigNumber } from "bignumber.js";
import type { Exchange, ExchangeRate } from "@ledgerhq/live-common/lib/swap/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { accountWithMandatoryTokens, getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { NotEnoughBalance } from "@ledgerhq/errors";

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

export const canRequestRates = state => {
  const { swap, error } = state;
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount } = exchange;
  return !!(fromAccount && toAccount && fromAmount && !exchangeRate && !error);
};

export const reducer = (state, { type, payload }) => {
  let newState;

  switch (type) {
    case "patchExchange":
      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: { ...state.swap.exchange, ...payload },
        },
        error: null,
      };
      break;
    case "fetchRates":
      newState = { ...state, isLoading: true, error: null };
      break;
    case "setRate":
      newState = {
        ...state,
        swap: { ...state.swap, exchangeRate: payload.rate },
        isLoading: false,
        error: null,
      };
      break;
    case "setFromCurrency": {
      const fromAccount = state.accounts.find(a => a.currency === payload.fromCurrency);
      const toCurrency = state.selectableCurrencies.find(c => c !== payload.fromCurrency);
      const toAccount = state.accounts.find(a => a.currency === toCurrency);

      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            fromCurrency: payload.fromCurrency,
            fromAccount,
            fromAmount: BigNumber(0),
            toCurrency,
            toAccount,
          },
        },
        validFrom: state.accounts.filter(a => payload.fromCurrency === a.currency),
        validTo: state.accounts.filter(a => toCurrency === a.currency),
        error: null,
      };
      break;
    }
    case "setFromAccount": {
      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchange: {
            ...state.swap.exchange,
            fromAccount: payload.fromAccount,
          },
        },
      };
      break;
    }
    case "setFromAmount": {
      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            fromAmount: payload.fromAmount,
          },
        },
        error: payload.fromAmount.gt(state.swap.exchange.fromAccount.balance)
          ? new NotEnoughBalance()
          : undefined,
      };
      break;
    }
    case "setToCurrency": {
      const accounts = state.accounts.filter(a => {
        const mainToCurrency = payload.toCurrency.parentCurrency || payload.toCurrency;
        return getAccountCurrency(a).id === mainToCurrency.id;
      });
      // FIXME probably need to do this for FROM too
      const accountWithTokens = accounts.map(a =>
        accountWithMandatoryTokens(a, [payload.toCurrency]),
      );

      newState = {
        ...state,
        validTo: accountWithTokens,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            toCurrency: payload.toCurrency,
            toAccount: state.accounts.find(a => a.currency === payload.toCurrency),
          },
        },
      };
      break;
    }
    case "setError":
      return { ...state, error: payload.error };
    default:
      return state;
  }
  return newState;
};
