// @flow

import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { Trans } from "react-i18next";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import ArrowSeparator from "~/renderer/components/ArrowSeparator";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import CheckBox from "~/renderer/components/CheckBox";
import React from "react";
import type { SwapOperation } from "@ledgerhq/live-common/lib/swap/types";
import Button from "~/renderer/components/Button";

const StepSummary = ({
  swap,
  checkedDisclaimer,
  onSwitchAccept,
}: {
  swap: SwapOperation,
  checkedDisclaimer: boolean,
  onSwitchAccept: () => undefined,
}) => {
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount } = exchange;

  const fromCurrency = getAccountCurrency(fromAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const fromUnit = getAccountUnit(fromAccount);
  const toUnit = getAccountUnit(toAccount);

  const toAmount = fromAmount.times(exchangeRate.magnitudeAwareRate);

  return (
    <Box>
      <Box horizontal>
        <Box flex="50%">
          <Text mb={1} ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
            <Trans i18nKey="swap.modal.summary.from" />
          </Text>
          <Box horizontal>
            <CryptoCurrencyIcon size={16} currency={fromCurrency} />
            <Ellipsis ff={"Inter|SemiBold"} fontSize={4}>
              {getAccountName(fromAccount)}
            </Ellipsis>
          </Box>
        </Box>
        <Box flex="50%">
          <Text mb={1} ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
            <Trans i18nKey="swap.modal.summary.toExchange" />
          </Text>
          <Text fontSize={4}>
            <CurrencyUnitValue value={fromAmount} unit={fromUnit} showCode />
          </Text>
        </Box>
      </Box>
      <ArrowSeparator />
      <Box horizontal>
        <Box flex="50%">
          <Text mb={1} ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
            <Trans i18nKey="swap.modal.summary.to" />
          </Text>
          <Box horizontal mt={1}>
            <CryptoCurrencyIcon size={16} currency={toCurrency} />
            <Ellipsis ff={"Inter|SemiBold"} fontSize={4}>
              {getAccountName(toAccount)}
            </Ellipsis>
          </Box>
        </Box>
        <Box flex="50%">
          <Text mb={1} ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
            <Trans i18nKey="swap.modal.summary.toReceive" />
          </Text>
          <Text fontSize={4}>
            <CurrencyUnitValue value={toAmount} unit={toUnit} showCode />
          </Text>
        </Box>
      </Box>
      <Box mt={3}>
        <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={3}>
          <Trans i18nKey="swap.modal.summary.provider" />
        </Text>
        <Text>
          <LinkWithExternalIcon onClick={undefined} label={exchangeRate.provider} />
        </Text>
      </Box>
      <Box mt={6} horizontal alignItems="center" onClick={onSwitchAccept}>
        <CheckBox onClick={onSwitchAccept} isChecked={checkedDisclaimer} />
        <Text ff="Inter|SemiBold" fontSize={4} style={{ marginLeft: 12, flex: 1 }}>
          <Trans i18nKey="swap.modal.disclaimer" />
        </Text>
      </Box>
    </Box>
  );
};

export const StepSummaryFooter = ({
  onContinue,
  onClose,
  disabled,
}: {
  onContinue: any,
  onClose: any,
  disabled: boolean,
}) => (
  <>
    <Box flex={1} alignItems="flex-start">
      <LinkWithExternalIcon
        style={{ display: "inline-flex", marginLeft: "10px" }}
        onClick={undefined}
        label={<Trans i18nKey="swap.modal.tos" />}
      />
    </Box>
    <Button onClick={onClose} secondary data-e2e="modal_buttonClose_swap">
      <Trans i18nKey="common.close" />
    </Button>
    <Button onClick={onContinue} disabled={disabled} primary data-e2e="modal_buttonContinue_swap">
      <Trans i18nKey="common.continue" />
    </Button>
  </>
);

export default StepSummary;
