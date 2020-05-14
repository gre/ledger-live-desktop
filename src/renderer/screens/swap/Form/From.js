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
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import type { Option } from "~/renderer/components/Select";
import Switch from "~/renderer/components/Switch";
import { CurrencyOptionRow } from "~/renderer/screens/swap/Form/index";

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

const From = ({
  currencies,
  validAccounts,
  currency,
  account,
  currenciesStatus,
  amount,
  onCurrencyChange,
  onAccountChange,
  onAmountChange,
  onUseAllAmountToggle,
  useAllAmount,
  isLoading,
  error,
}: {
  currencies: Currency[],
  currency: CryptoCurrency | TokenCurrency,
  account: AccountLike,
  currenciesStatus: { id: string, status: string }[],
  validAccounts: AccountLike[],
  amount: BigNumber,
  onCurrencyChange: (CryptoCurrency | TokenCurrency) => undefined,
  onAccountChange: AccountLike => undefined,
  onAmountChange?: BigNumber => undefined,
  onUseAllAmountToggle?: () => undefined,
  useAllAmount?: boolean,
  isLoading?: boolean,
  error?: Error,
}) => {
  const unit = currency && currency.units[0];
  const renderOptionOverride = ({ data: currency }: Option) => {
    const status = currenciesStatus[currency.id];
    return <CurrencyOptionRow circle currency={currency} status={status} />;
  };

  return (
    <Wrapper flow={1} mb={3}>
      <Text mb={15} color="palette.text.shade100" ff="Inter|SemiBold" fontSize={5}>
        <Trans i18nKey={`swap.form.from.title`} />
      </Text>
      <Box>
        <Label mb={4}>
          <Trans i18nKey={`swap.form.from.currency`} />
        </Label>
        <SelectCurrency
          rowHeight={47}
          renderOptionOverride={renderOptionOverride}
          currencies={currencies}
          autoFocus={true}
          onChange={onCurrencyChange}
          value={currency}
        />
      </Box>
      <Box>
        <Label mb={4} mt={25}>
          <Trans i18nKey={`swap.form.from.account`} />
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
      <Box style={{ minHeight: 120 }}>
        <Box mt={25} horizontal alignItems="center" justifyContent="space-between">
          <Label mb={4}>
            <Trans i18nKey={`swap.form.from.amount`} />
          </Label>
          <Box horizontal alignItems="center">
            <Text
              color="palette.text.shade40"
              ff="Inter|Medium"
              fontSize={10}
              style={{ paddingRight: 5 }}
              onClick={onUseAllAmountToggle}
            >
              <Trans i18nKey="send.steps.details.useMax" />
            </Text>
            <Switch small isChecked={useAllAmount} onChange={onUseAllAmountToggle} />
          </Box>
        </Box>
        {unit ? (
          <>
            <InputCurrency
              error={amount?.gt(0) && error}
              loading={isLoading}
              key={unit.code}
              defaultUnit={unit}
              value={isLoading ? "" : amount}
              disabled={useAllAmount}
              onChange={onAmountChange}
              renderRight={<InputRight>{unit.code}</InputRight>}
            />
            {!error ? (
              <Text mt={1} color="palette.text.shade60" ff="Inter|Regular" fontSize={2}>
                <Trans
                  i18nKey={"swap.form.from.balance"}
                  values={{
                    balance: formatCurrencyUnit(getAccountUnit(account), account.balance, {
                      showCode: true,
                    }),
                  }}
                />
              </Text>
            ) : null}
          </>
        ) : null}
      </Box>
    </Wrapper>
  );
};

export default From;
