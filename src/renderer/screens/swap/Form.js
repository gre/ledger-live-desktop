// @flow

import React, { useCallback, useEffect, useReducer, useMemo } from "react";
import uniq from "lodash/uniq";
import { connect, useDispatch } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { Trans, withTranslation } from "react-i18next";
import Card from "~/renderer/components/Box/Card";
import SelectAccount from "~/renderer/components/SelectAccount";
import { accountsSelector } from "~/renderer/reducers/accounts";
import Label from "~/renderer/components/Label";
import styled from "styled-components";
import InputCurrency from "~/renderer/components/InputCurrency";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { openModal } from "~/renderer/actions/modals";
import type { Account } from "@ledgerhq/live-common/lib/types";
import getExchangeRates from "@ledgerhq/live-common/lib/swap/getExchangeRates";
import debounce from "lodash/debounce";
import { BigNumber } from "bignumber.js";
import TranslatedError from "~/renderer/components/TranslatedError";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Price from "~/renderer/components/Price";
import ArrowSeparator from "~/renderer/components/ArrowSeparator";
import { NotEnoughBalance } from "@ledgerhq/errors";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;

const ErrorDisplay = styled(Card)`
  background-color: #ea2e49;
  color: white;
  height: 40px;
  text-align: left;
  justify-content: center;
`;

const initState = validFrom => ({
  swap: {
    exchange: {
      fromAccount: validFrom && validFrom[0],
      toAccount: null,
      fromAmount: BigNumber(0),
    },
    exchangeRate: null,
    operation: null,
    swapStatus: {
      swapId: undefined,
    },
  },
  validFrom,
  error: null,
  isLoading: false,
});

const reducer = (state, { type, payload }) => {
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
    case "setError":
      return { ...state, isLoading: false, error: payload.error };
    default:
      throw new Error();
  }
};

const Form = ({
  accounts,
  validFrom,
}: {
  accounts: Account[],
  validFrom: Account[],
  onContinue: any,
}) => {
  const dispatchRedux = useDispatch();

  const [state, dispatch] = useReducer(reducer, validFrom, initState);
  const patchExchange = useCallback(payload => dispatch({ type: "patchExchange", payload }), [
    dispatch,
  ]);

  const { swap, isLoading, error } = state;
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount } = exchange;

  const validTo = useMemo(
    () => validFrom.filter(a => getAccountCurrency(a).id !== getAccountCurrency(fromAccount).id),
    [validFrom, fromAccount],
  );

  const showModal = useCallback(() => dispatchRedux(openModal("MODAL_SWAP", { swap })), [
    swap,
    dispatchRedux,
  ]);

  const validateSwapLocally = useCallback(() => {
    if (fromAmount.gt(fromAccount.balance)) {
      // TODO use EstimateMaxSpendable logic once we have it on the bridge
      const error = new NotEnoughBalance();
      dispatch({ type: "setError", payload: { error } });
      return false;
    } else if (fromAmount.gt(0)) {
      return true;
    }
    return false;
  }, [dispatch, fromAccount, fromAmount]);

  useEffect(() => {
    const newToAccount = validTo ? validTo[0] : null;
    if (!toAccount || toAccount.id !== newToAccount.id) {
      patchExchange({ toAccount: newToAccount });
    }
  }, [toAccount, validTo, patchExchange]);

  useEffect(
    debounce(
      () => {
        async function getRates() {
          const { swap } = state;
          const { exchange } = swap;

          // Populate parentAccounts in case they're needed (move this to common by passing accounts maybe?)
          exchange.fromParentAccount = fromAccount.parentId
            ? accounts.find(a => a.id === fromAccount.parentId)
            : null;
          exchange.toParentAccount = toAccount.parentId
            ? accounts.find(a => a.id === toAccount.parentId)
            : null;

          getExchangeRates(exchange).then(
            rates => dispatch({ type: "setRate", payload: { rate: rates[0] } }), // FIXME still only getting the first rate, eventually there'll be more,
            error => dispatch({ type: "setError", payload: { error } }),
          );
        }
        if (validateSwapLocally()) {
          dispatch({ type: "fetchRates" });
          getRates();
        }
      },
      1000,
      { trailing: true },
    ),
    [fromAccount, toAccount, fromAmount],
  );

  // TODO filter does not filter token accounts, which is a bit dafuq
  if (!fromAccount) {
    return "NO ELIGIBLE SOURCE ACCOUNTS";
  }
  if (!toAccount) {
    return "NO ELIGIBLE DESTINATION ACCOUNTS";
  }

  const fromUnit = getAccountUnit(fromAccount);
  const toUnit = getAccountUnit(toAccount);
  const fromCurrency = getAccountCurrency(fromAccount);
  const toCurrency = getAccountCurrency(toAccount);

  // TODO this seems very weird that I have to do this.
  const toAmount = exchangeRate
    ? fromAmount
        .div(BigNumber(10).pow(fromUnit.magnitude))
        .times(exchangeRate.rate)
        .times(BigNumber(10).pow(toUnit.magnitude))
    : BigNumber(0);

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
        <Box flow={1} horizontal alignItems="flex-end">
          <Box flex={1}>
            <Label mb={4}>
              <Trans i18nKey="swap.start.from" />
            </Label>
            <SelectAccount
              withSubAccounts
              filter={a => validFrom.includes(a)}
              enforceHideEmptySubAccounts
              autoFocus={true}
              onChange={fromAccount => patchExchange({ fromAccount })}
              value={fromAccount}
            />
          </Box>
          <InputCurrency
            key={fromUnit.code}
            defaultUnit={fromUnit}
            value={fromAmount}
            onChange={fromAmount => patchExchange({ fromAmount })}
            renderRight={<InputRight>{fromUnit.code}</InputRight>}
          />
        </Box>
        <ArrowSeparator />
        <Box flow={1} horizontal alignItems="flex-end">
          <Box flex={1}>
            <Label mb={4}>
              <Trans i18nKey="swap.start.to" />
            </Label>
            <SelectAccount
              withSubAccounts
              filter={a => validTo.includes(a)}
              enforceHideEmptySubAccounts
              autoFocus={true}
              onChange={toAccount => patchExchange({ toAccount })}
              value={toAccount}
            />
          </Box>
          <Box>
            <InputCurrency
              key={toUnit.code}
              defaultUnit={toUnit}
              readOnly
              disabled
              value={toAmount}
              renderRight={<InputRight>{toUnit.code}</InputRight>}
            />
          </Box>
        </Box>
        {fromCurrency && toCurrency && exchangeRate ? (
          <Box alignItems="flex-end">
            <Price
              fontSize={12}
              withEquality
              showAllDigits
              from={fromCurrency}
              to={toCurrency}
              rate={exchangeRate.rate}
            />
          </Box>
        ) : null}
        <Box alignItems="center" justifyContent="flex-end" horizontal style={{ marginTop: 30 }}>
          {error ? (
            <ErrorDisplay px={32} flex={1}>
              <Text ff="Inter|Medium" fontSize={3}>
                <TranslatedError error={error} />
              </Text>
            </ErrorDisplay>
          ) : null}
          <Button
            ml={10}
            isLoading={isLoading && !error}
            disabled={isLoading || error || !exchangeRate}
            primary
            onClick={showModal}
          >
            <Trans i18nKey="common.continue" />
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

const validFromSelector = createSelector(
  accountsSelector,
  (_, { providers }) =>
    uniq(providers.reduce((ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies], [])),
  (accounts, supportedCurrencies) =>
    accounts.filter(a => supportedCurrencies.includes(a.currency.ticker)),
);

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  validFrom: validFromSelector,
});

export default withTranslation()(connect(mapStateToProps)(Form));
