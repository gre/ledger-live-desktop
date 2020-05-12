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

const To = ({
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
  // const fromCurrency = fromAccount && getAccountCurrency(fromAccount);
  // const toUnit = toAccount && getAccountUnit(toAccount);
  //
  // const toAmount =
  //   exchangeRate && toUnit
  //     ? fromAmount.times(exchangeRate.rate).times(BigNumber(10).pow(toUnit.magnitude))
  //     : BigNumber(0);
  //
  // const showModal = useCallback(() => dispatch(openModal("MODAL_SWAP", { swap })), [
  //   swap,
  //   dispatch,
  // ]);
  return (
    <Box
      flow={1}
      style={{ flex: 1, borderWidth: 1, borderColor: "black", borderStyle: "dashed" }}
      mb={3}
    >
      <Label mb={4}>
        <Trans i18nKey="swap.start.to" />
      </Label>
      <SelectAccount
        withSubAccounts
        filter={a => validTo.some(b=>b.id===a.id)}
        enforceHideEmptySubAccounts
        autoFocus={true}
        onChange={onToAccountChange}
        value={toAccount}
      />
    </Box>
  );
};

export default To;
