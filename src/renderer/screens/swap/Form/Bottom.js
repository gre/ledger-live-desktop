// @flow

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { Trans } from "react-i18next";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import { UserDoesntHaveAccounts } from "~/renderer/screens/swap/Form/placeholders";
import SelectAccount from "~/renderer/components/SelectAccount";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/lib/account";
import InputCurrency from "~/renderer/components/InputCurrency";
import Input from "~/renderer/components/Input";
import Price from "~/renderer/components/Price";
import Text from "~/renderer/components/Text";
import TranslatedError from "~/renderer/components/TranslatedError";
import Button from "~/renderer/components/Button";
import React, { useCallback } from "react";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import Card from "~/renderer/components/Box/Card";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";

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

const Bottom = ({
  state,
  selectableCurrencies,
  validTo,
  setToCurrency,
  onToAccountChange,
}: {
  state: SwapState,
  selectableCurrencies: any,
  validTo: any,
  setToCurrency: CryptoCurrency | (TokenCurrency => undefined),
  onToAccountChange: AccountLike => undefined,
}) => {
  const { swap, toCurrency, isLoading, error } = state;
  const { exchange, exchangeRate } = swap;
  const dispatch = useDispatch();
  const { fromAccount, toAccount, fromAmount } = exchange;
  const fromCurrency = fromAccount && getAccountCurrency(fromAccount);
  const toUnit = toAccount && getAccountUnit(toAccount);

  const toAmount =
    exchangeRate && toUnit
      ? fromAmount.times(exchangeRate.rate).times(BigNumber(10).pow(toUnit.magnitude))
      : BigNumber(0);

  const showModal = useCallback(() => dispatch(openModal("MODAL_SWAP", { swap })), [
    swap,
    dispatch,
  ]);

  return (
    <>
      <Box flow={1} mb={3} horizontal alignItems="flex-end">
        <Box flex={1}>
          <Label mb={4}>
            <Trans i18nKey="swap.start.currency" />
          </Label>
          <SelectCurrency
            small
            minWidth={200}
            value={toCurrency}
            onChange={setToCurrency}
            currencies={selectableCurrencies.filter(
              c => c.id !== getAccountCurrency(fromAccount).id,
            )}
          />
        </Box>
      </Box>
      <Box flow={1} horizontal alignItems="flex-end">
        {toCurrency ? (
          !validTo || !validTo.length ? (
            <UserDoesntHaveAccounts toCurrency={toCurrency} />
          ) : (
            <>
              <Box flex={1}>
                <Label mb={4}>
                  <Trans i18nKey="swap.start.to" />
                </Label>
                <SelectAccount
                  withSubAccounts
                  filter={a => getAccountCurrency(a).id === toCurrency.id}
                  accounts={validTo}
                  autoFocus={true}
                  onChange={onToAccountChange}
                  value={toAccount}
                />
              </Box>
              <Box flex={1}>
                {exchangeRate && toUnit ? (
                  <InputCurrency
                    key={toUnit ? toUnit.code : "placeholder"}
                    defaultUnit={toUnit || null}
                    value={toAmount}
                    disabled
                    renderRight={<InputRight>{toUnit.code}</InputRight>}
                  />
                ) : (
                  <Input disabled />
                )}
              </Box>
            </>
          )
        ) : null}
      </Box>
      {fromCurrency && exchangeRate && validTo && validTo.length ? (
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
        {validTo && validTo.length ? (
          <Button
            ml={10}
            isLoading={isLoading && !error}
            disabled={isLoading || error || !exchangeRate}
            primary
            onClick={showModal}
          >
            <Trans i18nKey="common.continue" />
          </Button>
        ) : null}
      </Box>
    </>
  );
};

export default Bottom;
