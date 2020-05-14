// @flow

import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import uniq from "lodash/uniq";
import { connect, useDispatch } from "react-redux";
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
import { canRequestRates } from "~/renderer/screens/swap/Form/logic";
import { openModal } from "~/renderer/actions/modals";

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
  const reduxDispatch = useDispatch();
  const [state, dispatch] = useReducer(reducer, { accounts, selectableCurrencies }, initState);
  const patchExchange = useCallback(payload => dispatch({ type: "patchExchange", payload }), [
    dispatch,
  ]);
  const { swap, validFrom, validTo, isLoading, error } = state;
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount, fromCurrency, toCurrency } = exchange;

  const onStartSwap = useCallback(() => reduxDispatch(openModal("MODAL_SWAP", { swap })), [
    swap,
    reduxDispatch,
  ]);

  useEffect(() => {
    let ignore = false;
    async function getRates() {
      getExchangeRates(exchange).then(
        rates => {
          console.log({ rates });
          if (ignore) return;
          dispatch({ type: "setRate", payload: { rate: rates[0] } });
        },
        error => {
          if (ignore) return;
          dispatch({ type: "setError", payload: { error } });
        },
      );
    }
    if (!ignore && canRequestRates(state)) {
      console.log("fetch rates");
      getRates();
    }

    return () => {
      ignore = true;
    };
  }, [state, exchange, fromAccount, toAccount, fromAmount]);

  const { magnitudeAwareRate } = exchangeRate || {};
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
      let status = "no-app";
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
            useAllAmount={false}
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
            amount={fromAmount.times(magnitudeAwareRate)}
            currency={toCurrency}
            fromCurrency={fromCurrency}
            rate={magnitudeAwareRate}
            currencies={selectableCurrencies.filter(c => c !== fromCurrency)}
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
          <Button onClick={onStartSwap} primary disabled={!exchangeRate}>
            {"Exchange"}
          </Button>
        </Footer>
      </Card>
    </>
  );
};

type CurrencyOptionStatus = "ok" | "no-accounts" | "no-apps";
export const CurrencyOptionRow = ({
  status,
  circle,
  currency,
}: {
  status: CurrencyOptionStatus,
  circle?: boolean,
  currency: TokenCurrency | CryptoCurrency,
}) => {
  const notOK = status !== "ok";

  return (
    <Box grow horizontal alignItems="center" flow={2}>
      <CryptoCurrencyIcon
        inactive={notOK}
        circle={circle}
        currency={currency}
        size={circle ? 26 : 16}
      />
      <Box
        grow
        ff="Inter|SemiBold"
        color="palette.text.shade100"
        fontSize={4}
        style={{ opacity: notOK ? 0.2 : 1 }}
      >
        {`${currency.name} (${currency.ticker})`}
      </Box>
      {notOK ? (
        <Box style={{ marginRight: -23 }} alignItems={"flex-end"}>
          <Tooltip
            content={
              <Trans i18nKey={`swap.form.${status}`} values={{ currencyName: currency.name }} />
            }
          >
            <IconExclamationCircle color={colors.orange} size={16} />
          </Tooltip>
        </Box>
      ) : null}
    </Box>
  );
};

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
