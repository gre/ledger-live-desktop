// @flow

import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import uniq from "lodash/uniq";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Trans, withTranslation } from "react-i18next";
import Card from "~/renderer/components/Box/Card";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { Account, CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import getExchangeRates from "@ledgerhq/live-common/lib/swap/getExchangeRates";
import ArrowSeparator from "~/renderer/components/ArrowSeparator";
import { findTokenById } from "@ledgerhq/live-common/lib/data/tokens";
import {
  findCryptoCurrencyById,
  isCurrencySupported,
} from "@ledgerhq/live-common/lib/data/cryptocurrencies";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { initState, reducer } from "./logic";
import { BigNumber } from "bignumber.js";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";

import From from "~/renderer/screens/swap/Form/From";
import To from "~/renderer/screens/swap/Form/To";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Tooltip from "~/renderer/components/Tooltip";
import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import { colors } from "~/renderer/styles/theme";

const Footer: ThemedComponent<{}> = styled(Box)`
  align-items: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  justify-content: space-between;
  padding: 20px;
`;

const Form = ({
  accounts,
  selectableCurrencies,
  installedApps,
}: {
  accounts: Account[],
  onContinue: any,
  selectableCurrencies: [],
  installedApps: App[],
}) => {
  const [state, dispatch] = useReducer(reducer, { accounts, selectableCurrencies }, initState);
  const patchExchange = useCallback(payload => dispatch({ type: "patchExchange", payload }), [
    dispatch,
  ]);
  const { swap, canRequestRates, validFrom, validTo, isLoading, error } = state;
  const { exchange, exchangeRate, useAllAmount } = swap;
  const { fromAccount, toAccount, fromAmount, fromCurrency, toCurrency } = exchange;

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
    if (!ignore && canRequestRates) {
      getRates();
      dispatch({ type: "fetchRates" });
    }

    return () => {
      ignore = true;
    };
  }, [exchange, canRequestRates, fromAccount, toAccount, fromAmount]);

  const rate = fromAmount && exchangeRate && fromAmount.times(BigNumber(exchangeRate.rate));

  const currenciesWithAccounts = useMemo(() => accounts.map(({ currency }) => currency.id), [
    accounts,
  ]);

  const currenciesStatus = useMemo(() => {
    const statuses = {};
    for (const c of selectableCurrencies) {
      const installedApp = installedApps.some(a => {
        const mainCurrency = c.parentCurrency || c;
        return a.name === mainCurrency.managerAppName && a.updated;
      });
      let status = "not-installed";
      if (installedApp) {
        if (currenciesWithAccounts.includes(c.id)) {
          status = "ok";
        } else {
          status = "no-accounts";
        }
      }
      statuses[c.id] = status;
    }
    return statuses;
  }, [currenciesWithAccounts, installedApps, selectableCurrencies]);

  const onSetFromCurrency = useCallback(
    fromCurrency => {
      if (currenciesStatus[fromCurrency.id] === "ok") {
        dispatch({ type: "setFromCurrency", payload: { fromCurrency } });
      }
    },
    [currenciesStatus],
  );

  return (
    <>
      <Card flow={1}>
        <Box horizontal p={32}>
          <From
            currenciesStatus={currenciesStatus}
            account={fromAccount}
            amount={fromAmount}
            currency={fromCurrency}
            error={error}
            currencies={selectableCurrencies}
            onCurrencyChange={onSetFromCurrency}
            useAllAmount={useAllAmount}
            validAccounts={validFrom}
            onUseAllAmountToggle={() => dispatch({ type: "toggleUseAllAmount" })}
            onAccountChange={fromAccount =>
              dispatch({ type: "setFromAccount", payload: { fromAccount } })
            }
            onAmountChange={fromAmount =>
              dispatch({ type: "setFromAmount", payload: { fromAmount } })
            }
          />
          <ArrowSeparator />
          <To
            currenciesStatus={currenciesStatus}
            isLoading={isLoading}
            account={toAccount}
            amount={rate}
            currency={toCurrency}
            fromCurrency={fromCurrency}
            rate={rate}
            currencies={selectableCurrencies.filter(
              c => c !== fromCurrency && currenciesStatus[c.id] !== "no-accounts",
            )}
            onCurrencyChange={toCurrency =>
              dispatch({ type: "setToCurrency", payload: { toCurrency } })
            }
            onAccountChange={toAccount => patchExchange({ toAccount })}
            validAccounts={validTo}
          />
        </Box>
        <Footer horizontal>
          <LabelWithExternalIcon
            color="wallet"
            ff="Inter|SemiBold"
            onClick={() => {
              openURL("");
              track("More info on swap");
            }}
            label={<Trans i18nKey={`swap.form.helpCTA`} />}
          />
          <Button primary>{"Exchange"}</Button>
        </Footer>
      </Card>
    </>
  );
};

export const OptionOK = ({ currency }: { currency: TokenCurrency | CryptoCurrency }) => (
  <Box grow horizontal alignItems="center" flow={2}>
    <CryptoCurrencyIcon currency={currency} size={16} />
    <Box grow ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
      {`${currency.name} (${currency.ticker})`}
    </Box>
  </Box>
);

export const OptionNoAccounts = ({ currency }: { currency: TokenCurrency | CryptoCurrency }) => (
  <Box grow horizontal alignItems="center" flow={2}>
    <Box style={{ opacity: 0.2 }}>
      <CryptoCurrencyIcon currency={currency} size={16} />
    </Box>
    <Box
      style={{ opacity: 0.2 }}
      grow
      ff="Inter|SemiBold"
      color="palette.text.shade100"
      fontSize={4}
    >
      {`${currency.name} (${currency.ticker})`}
    </Box>
    <Box style={{ marginRight: -23 }} alignItems={"flex-end"}>
      <Tooltip
        content={<Trans i18nKey="swap.form.noAccount" values={{ currencyName: currency.name }} />}
      >
        <IconExclamationCircle color={colors.orange} size={16} />
      </Tooltip>
    </Box>
  </Box>
);

export const OptionNoApp = ({ currency }: { currency: TokenCurrency | CryptoCurrency }) => (
  <Box grow horizontal alignItems="center" flow={2}>
    <Box style={{ opacity: 0.2 }}>
      <CryptoCurrencyIcon currency={currency} size={16} />
    </Box>
    <Box
      style={{ opacity: 0.2 }}
      grow
      ff="Inter|SemiBold"
      color="palette.text.shade100"
      fontSize={4}
    >
      {`${currency.name} (${currency.ticker})`}
    </Box>
    <Box style={{ marginRight: -23 }} alignItems={"flex-end"}>
      <Tooltip
        content={<Trans i18nKey="swap.form.noApp" values={{ currencyName: currency.name }} />}
      >
        <IconExclamationCircle color={colors.orange} size={16} />
      </Tooltip>
    </Box>
  </Box>
);

const selectableCurrenciesSelector = (state, props) => {
  const { providers } = props;
  const allIds = uniq(
    providers.reduce((ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies], []),
  );

  const tokenCurrencies = allIds.map(findTokenById).filter(Boolean);
  const cryptoCurrencies = allIds
    .map(findCryptoCurrencyById)
    .filter(Boolean)
    .filter(isCurrencySupported);
  return [...cryptoCurrencies, ...tokenCurrencies];
};

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  selectableCurrencies: selectableCurrenciesSelector,
});

export default withTranslation()(connect(mapStateToProps)(Form));
