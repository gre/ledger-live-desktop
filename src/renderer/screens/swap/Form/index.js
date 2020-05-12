// @flow

import React, { useCallback, useEffect, useReducer, useMemo } from "react";
import uniq from "lodash/uniq";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
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
import { findTokenById } from "@ledgerhq/live-common/lib/data/tokens";
import {
  findCryptoCurrencyById,
  isCurrencySupported,
} from "@ledgerhq/live-common/lib/data/cryptocurrencies";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { initState, reducer } from "./logic";
import { UserDoesntHaveApp } from "~/renderer/screens/swap/Form/placeholders";
import SwapInputGroup from "~/renderer/screens/swap/Form/SwapInputGroup";
import { BigNumber } from "bignumber.js";
import TranslatedError from "~/renderer/components/TranslatedError";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { urls } from "~/config/urls";
import ExternalLinkButton from "~/renderer/components/ExternalLinkButton";
import FakeLink from "~/renderer/components/FakeLink";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";

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
  const { swap, validFrom, validTo, isLoading, error } = state;
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount, fromCurrency, toCurrency } = exchange;

  const validateSwapLocally = useCallback(() => {
    if (fromAccount && fromAmount && fromAmount.gt(fromAccount.balance)) {
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
    if (!fromCurrency) return false;
    const mainCurrency = fromCurrency.parentCurrency || fromCurrency;
    return a.name === mainCurrency.managerAppName && a.updated;
  });

  return (
    <>
      <Card mt={6} flow={1}>
        <Box horizontal p={32}>
          <SwapInputGroup
            title={"From"}
            account={fromAccount}
            amount={fromAmount}
            currency={fromCurrency}
            error={error}
            currencies={selectableCurrencies}
            onCurrencyChange={fromCurrency =>
              dispatch({ type: "setFromCurrency", payload: { fromCurrency } })
            }
            onAccountChange={fromAccount =>
              dispatch({ type: "setFromAccount", payload: { fromAccount } })
            }
            onAmountChange={fromAmount => patchExchange({ fromAmount })}
            validAccounts={validFrom}
          />
          <ArrowSeparator />
          {!hasUpToDateFromApp ? (
            <UserDoesntHaveApp />
          ) : (
            <SwapInputGroup
              title={"To"}
              isLoading={isLoading}
              readOnlyAmount
              account={toAccount}
              amount={fromAmount && exchangeRate && fromAmount.times(BigNumber(exchangeRate.rate))}
              currency={toCurrency}
              currencies={selectableCurrencies.filter(c => c !== fromCurrency)}
              onCurrencyChange={toCurrency =>
                dispatch({ type: "setToCurrency", payload: { toCurrency } })
              }
              onAccountChange={toAccount => patchExchange({ toAccount })}
              validAccounts={validTo}
            />
          )}
        </Box>
        <Footer horizontal>
          <LabelWithExternalIcon
            color="wallet"
            ff="Inter|SemiBold"
            onClick={() => {
              openURL("");
              track("More info on swap");
            }}
            label={"What is swap?"}
          />
          <Button primary>{"Exchange"}</Button>
        </Footer>
      </Card>
    </>
  );
};

const selectableCurrenciesSelector = (state, props) => {
  const { providers } = props;
  const allIds = uniq(
    providers.reduce((ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies], []),
  );

  const tokenCurrencies = allIds.map(ticker => findTokenById(ticker)).filter(Boolean);
  const cryptoCurrencies = allIds
    .map(ticker => findCryptoCurrencyById(ticker))
    .filter(Boolean)
    .filter(c => isCurrencySupported(c));
  return [...cryptoCurrencies, ...tokenCurrencies];
};

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  selectableCurrencies: selectableCurrenciesSelector,
});

export default withTranslation()(connect(mapStateToProps)(Form));
