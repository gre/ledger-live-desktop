// @flow

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { Trans } from "react-i18next";
import SelectAccount from "~/renderer/components/SelectAccount";
import InputCurrency from "~/renderer/components/InputCurrency";
import React from "react";
import type { AccountLike, CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;

const Wrapper = styled(Box)`
  margin-left: 0; //Nb needed because of https://github.com/LedgerHQ/ledger-live-desktop/blob/19b092792100ec2944e2f55569054b91d8c30192/src/renderer/components/Box/Box.js#L84
  flex: 1;
`;

const SwapInputGroup = ({
  title,
  currencies,
  validAccounts,
  currency,
  account,
  amount,
  onCurrencyChange,
  onAccountChange,
  onAmountChange,
  readOnlyAmount,
  isLoading,
  error,
}: {
  title?: string,
  currencies: Currency[],
  currency: CryptoCurrency | TokenCurrency,
  account: AccountLike,
  validAccounts: AccountLike[],
  amount: BigNumber,
  onCurrencyChange: (CryptoCurrency | TokenCurrency) => undefined,
  onAccountChange: AccountLike => undefined,
  onAmountChange?: BigNumber => undefined,
  readOnlyAmount?: boolean,
  isLoading?: boolean,
  error?: Error,
}) => {
  const unit = currency && currency.units[0];
  return (
    <Wrapper flow={1} mb={3}>
      {title ? (
        <Text mb={15} color="palette.text.shade100" ff="Inter|SemiBold" fontSize={5}>
          {title}
        </Text>
      ) : null}
      <Box>
        <Label mb={4}>
          <Trans i18nKey="swap.start.from_currency" />
        </Label>
        <SelectCurrency
          currencies={currencies}
          enforceHideEmptySubAccounts
          autoFocus={true}
          onChange={onCurrencyChange}
          value={currency}
        />
      </Box>
      <Box>
        <Label mb={4} mt={25}>
          <Trans i18nKey="swap.start.from" />
        </Label>
        <SelectAccount
          hideAmount
          withSubAccounts
          filter={a => validAccounts.some(b => b.id === a.id)}
          enforceHideEmptySubAccounts
          autoFocus={true}
          onChange={onAccountChange}
          value={account}
        />
      </Box>
      <Box>
        <Label mb={4} mt={25}>
          <Trans i18nKey="swap.start.from_amount" />
        </Label>
        {unit && (
          <InputCurrency
            error={error}
            readOnly={readOnlyAmount}
            loading={isLoading}
            key={unit.code}
            defaultUnit={unit}
            value={isLoading ? "" : amount}
            onChange={onAmountChange}
            renderRight={<InputRight>{unit.code}</InputRight>}
          />
        )}
      </Box>
    </Wrapper>
  );
};

export default SwapInputGroup;
