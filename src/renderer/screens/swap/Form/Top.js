// @flow

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { Trans } from "react-i18next";
import SelectAccount from "~/renderer/components/SelectAccount";
import InputCurrency from "~/renderer/components/InputCurrency";
import React from "react";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;

const Top = ({
  validFrom,
  fromAccount,
  fromAmount,
  onFromAccountChange,
  onFromAmountChange,
}: {
  validFrom: AccountLike[],
  fromAccount: AccountLike,
  fromAmount: BigNumber,
  onFromAccountChange: AccountLike => undefined,
  onFromAmountChange: BigNumber => undefined,
}) => {
  const fromUnit = fromAccount && getAccountUnit(fromAccount);

  return (
    <Box flow={1} mb={3} horizontal alignItems="flex-end">
      <Box flex={1}>
        <Label mb={4}>
          <Trans i18nKey="swap.start.from" />
        </Label>
        <SelectAccount
          withSubAccounts
          filter={a => validFrom.includes(a)}
          enforceHideEmptySubAccounts
          autoFocus={true}
          onChange={onFromAccountChange}
          value={fromAccount}
        />
      </Box>
      <Box flex={1}>
        <InputCurrency
          key={fromUnit.code}
          defaultUnit={fromUnit}
          value={fromAmount}
          onChange={onFromAmountChange}
          renderRight={<InputRight>{fromUnit.code}</InputRight>}
        />
      </Box>
    </Box>
  );
};

export default Top;
