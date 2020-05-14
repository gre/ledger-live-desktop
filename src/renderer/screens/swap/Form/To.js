// @flow

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { Trans } from "react-i18next";
import SelectAccount from "~/renderer/components/SelectAccount";
import InputCurrency from "~/renderer/components/InputCurrency";
import React, { useCallback } from "react";
import type { AccountLike, CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import Text from "~/renderer/components/Text";
import Price from "~/renderer/components/Price";
import IconPlusSmall from "~/renderer/icons/PlusSmall";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { CurrencyOptionRow } from "~/renderer/screens/swap/Form";

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

const AddAccount = styled.div`
  display: flex;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
  align-items: center;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  height: 48px;
  padding: 0 15px;
  border-radius: 4px;
  color: ${p => p.theme.colors.palette.primary.main};
`;

const SwapInputGroup = ({
  currencies,
  validAccounts,
  currency,
  fromCurrency,
  account,
  currenciesStatus,
  amount,
  onCurrencyChange,
  onAccountChange,
  onAmountChange,
  isLoading,
  rate,
  error,
}: {
  currencies: Currency[],
  currency: CryptoCurrency | TokenCurrency,
  fromCurrency: CryptoCurrency | TokenCurrency,
  account: AccountLike,
  currenciesStatus: { id: string, status: string }[],
  validAccounts: AccountLike[],
  amount: BigNumber,
  onCurrencyChange: (CryptoCurrency | TokenCurrency) => undefined,
  onAccountChange: AccountLike => undefined,
  onAmountChange?: BigNumber => undefined,
  isLoading?: boolean,
  rate?: BigNumber,
  error?: Error,
}) => {
  const unit = currency && currency.units[0];
  const renderOptionOverride = ({ data: currency }: CurrencyOptionRow) => {
    const status = currenciesStatus[currency.id];
    return <CurrencyOptionRow circle currency={currency} status={status} />;
  };

  const dispatch = useDispatch();
  const addAccount = useCallback(() => dispatch(openModal("MODAL_ADD_ACCOUNTS", { currency })), [
    currency,
    dispatch,
  ]);

  return (
    <Wrapper flow={1} mb={3}>
      <Text mb={15} color="palette.text.shade100" ff="Inter|SemiBold" fontSize={5}>
        <Trans i18nKey={`swap.form.to.title`} />
      </Text>
      <Box>
        <Label mb={4}>
          <Trans i18nKey={`swap.form.to.currency`} />
        </Label>
        <SelectCurrency
          currenciesStatus={currenciesStatus}
          renderOptionOverride={renderOptionOverride}
          currencies={currencies}
          autoFocus={true}
          onChange={onCurrencyChange}
          value={currency}
          rowHeight={47}
        />
      </Box>
      <Box>
        <Label mb={4} mt={25}>
          <Trans i18nKey={`swap.form.to.account`} />
        </Label>
        {validAccounts?.length ? (
          <SelectAccount
            hideAmount
            withSubAccounts
            filter={a => validAccounts.some(b => b.id === a.id)}
            enforceHideEmptySubAccounts
            autoFocus={true}
            onChange={onAccountChange}
            value={account}
          />
        ) : (
          <AddAccount onClick={addAccount}>
            <IconPlusSmall size={16} />
            <Text ml={1} ff="Inter|SemiBold" fontSize={4}>
              <Trans i18nKey={`swap.form.to.addAccountCTA`} />
            </Text>
          </AddAccount>
        )}
      </Box>
      <Box>
        <Label mb={4} mt={25}>
          <Trans i18nKey={`swap.form.to.amount`} />
        </Label>
        {unit ? (
          <>
            <InputCurrency
              error={error}
              disabled
              loading={isLoading}
              key={unit.code}
              defaultUnit={unit}
              value={isLoading ? "" : amount}
              onChange={onAmountChange}
              renderRight={<InputRight>{unit.code}</InputRight>}
            />
            {rate ? (
              <Box mt={1}>
                <Price
                  withEquality
                  from={fromCurrency}
                  to={currency}
                  rate={rate}
                  color="palette.text.shade60"
                  fontSize={2}
                />
              </Box>
            ) : null}
          </>
        ) : null}
      </Box>
    </Wrapper>
  );
};

export default SwapInputGroup;
