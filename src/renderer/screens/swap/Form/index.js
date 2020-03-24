// @flow

import React, { useCallback, useEffect, useReducer, useMemo } from "react";
import uniq from "lodash/uniq";
import { connect } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { Trans, withTranslation } from "react-i18next";
import Card from "~/renderer/components/Box/Card";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import type { Account } from "@ledgerhq/live-common/lib/types";
import getExchangeRates from "@ledgerhq/live-common/lib/swap/getExchangeRates";
import ArrowSeparator from "~/renderer/components/ArrowSeparator";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { flattenSortAccountsSelector } from "~/renderer/actions/general";
import { findTokenByTicker } from "@ledgerhq/live-common/lib/data/tokens";
import {
  findCryptoCurrencyByTicker,
  isCurrencySupported,
} from "@ledgerhq/live-common/lib/data/cryptocurrencies";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { initState, reducer } from "./logic";
import { UserDoesntHaveApp } from "~/renderer/screens/swap/Form/placeholders";
import Top from "~/renderer/screens/swap/Form/Top";
import Bottom from "~/renderer/screens/swap/Form/Bottom";
import { BigNumber } from "bignumber.js";

const Form = ({
  accounts,
  validFrom,
  selectableCurrencies,
  installedApps,
}: {
  accounts: Account[],
  validFrom: Account[],
  onContinue: any,
  selectableCurrencies: [],
  installedApps: App[],
}) => {
  const [state, dispatch] = useReducer(reducer, validFrom, initState);
  const patchExchange = useCallback(payload => dispatch({ type: "patchExchange", payload }), [
    dispatch,
  ]);
  const { swap, toCurrency } = state;
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount } = exchange;

  const validTo = useMemo(() => {
    if (!toCurrency) return [];
    const accounts = validFrom.filter(a => {
      const mainToCurrency = toCurrency.parentCurrency || toCurrency;
      return getAccountCurrency(a).id === mainToCurrency.id;
    });

    return accounts.map(a => accountWithMandatoryTokens(a, [toCurrency]));
  }, [validFrom, toCurrency]);

  const getParentAccount = useCallback(
    c => (c.parentId ? accounts.find(a => a.id === c.parentId) : null),
    [accounts],
  );

  const validateSwapLocally = useCallback(() => {
    if (fromAmount && fromAmount.gt(fromAccount.balance)) {
      // TODO use EstimateMaxSpendable logic once we have it on the bridge
      // cc @gre
      const error = new NotEnoughBalance();
      dispatch({ type: "setError", payload: { error } });
      return false;
    } else if (exchangeRate || !toCurrency || !toAccount) {
      return false;
    } else if (fromAmount.gt(0)) {
      return true;
    }
    return false;
  }, [exchangeRate, dispatch, fromAccount, fromAmount, toAccount, toCurrency]);

  const onFromAccountChange = useCallback(
    fromAccount =>
      patchExchange({
        fromAccount,
        fromParentAccount: getParentAccount(fromAccount),
        toAccount: null,
        fromAmount: BigNumber(0),
      }),
    [getParentAccount, patchExchange],
  );

  useEffect(() => {
    if (!toCurrency || !validTo || !validTo.length || toAccount) {
      return;
    }
    patchExchange({
      toAccount: flattenAccounts(validTo).find(a => getAccountCurrency(a).id === toCurrency.id),
    });
  }, [toAccount, validTo, toCurrency, patchExchange]);

  useEffect(() => {
    let ignore = false;
    async function getRates() {
      getExchangeRates(exchange).then(
        rates => {
          if (ignore) return;
          dispatch({ type: "setRate", payload: { rate: rates[0] } });
        },
        error => {
          if (ignore) return;
          dispatch({ type: "setError", payload: { error } });
        },
      );
    }
    if (!ignore && validateSwapLocally()) {
      getRates();
      dispatch({ type: "fetchRates" });
    }

    return () => {
      ignore = true;
    };
  }, [exchange, validateSwapLocally, fromAccount, toAccount, fromAmount]);

  const hasUpToDateFromApp = installedApps.some(a => {
    const fromCurrency = fromAccount && getAccountCurrency(fromAccount);
    const mainCurrency = fromCurrency.parentCurrency || fromCurrency;
    return a.name === mainCurrency.managerAppName && a.updated;
  });

  return (
    <Box flow={4}>
      <TrackPage category="Swap form" />
      <Box horizontal style={{ paddingBottom: 32 }}>
        <Box
          grow
          ff="Inter|SemiBold"
          fontSize={7}
          color="palette.text.shade100"
          data-e2e="swapPage_title"
        >
          <Trans i18nKey="swap.title" />
        </Box>
      </Box>
      <Card p={32} flow={1}>
        <Top
          fromAccount={fromAccount}
          fromAmount={fromAmount}
          onFromAccountChange={onFromAccountChange}
          onFromAmountChange={fromAmount => patchExchange({ fromAmount })}
          validFrom={validFrom}
        />
        <ArrowSeparator />
        {!hasUpToDateFromApp ? (
          <UserDoesntHaveApp />
        ) : (
          <Bottom
            state={state}
            onToAccountChange={toAccount => patchExchange({ toAccount })}
            selectableCurrencies={selectableCurrencies}
            setToCurrency={toCurrency =>
              dispatch({ type: "setToCurrency", payload: { toCurrency } })
            }
            validTo={validTo}
          />
        )}
      </Card>
    </Box>
  );
};

const validFromSelector = createSelector(
  flattenSortAccountsSelector,
  (_, { providers }) =>
    uniq(providers.reduce((ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies], [])),
  (accounts, supportedCurrencies) =>
    accounts.filter(a => supportedCurrencies.includes(getAccountCurrency(a).ticker.toUpperCase())),
);

// TODO remove/fixZ this once we have real currency ids
const selectableCurrenciesSelector = (state, props) => {
  const { providers } = props;
  const allTickers = uniq(
    providers.reduce((ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies], []),
  );

  const tokenCurrencies = allTickers.map(ticker => findTokenByTicker(ticker)).filter(Boolean);
  const cryptoCurrencies = allTickers
    .map(ticker => findCryptoCurrencyByTicker(ticker))
    .filter(Boolean)
    .filter(c => isCurrencySupported(c));
  return [...cryptoCurrencies, ...tokenCurrencies];
};

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  validFrom: validFromSelector,
  selectableCurrencies: selectableCurrenciesSelector,
});

export default withTranslation()(connect(mapStateToProps)(Form));
