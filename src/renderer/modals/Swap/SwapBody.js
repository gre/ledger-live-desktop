// @flow
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import CheckBox from "~/renderer/components/CheckBox";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import ArrowSeparator from "~/renderer/components/ArrowSeparator";
import type { SwapOperation } from "@ledgerhq/live-common/lib/swap/types";
import { toExchangeRaw } from "@ledgerhq/live-common/lib/swap/serialization";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import { BigNumber } from "bignumber.js";
import { command } from "~/renderer/commands";
import { useSelector } from "react-redux"
import { getCurrentDevice } from '~/renderer/reducers/devices'

const SwapBody = ({ swap, onClose }: { swap: SwapOperation, onClose: any }) => {
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, fromAmount } = exchange;

  const fromCurrency = getAccountCurrency(fromAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const fromUnit = getAccountUnit(fromAccount);
  const toUnit = getAccountUnit(toAccount);

  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false);
  const [swapResult, setSwapResult] = useState(null);
  const device = useSelector(getCurrentDevice);

  const onContinue = useCallback(() => {
    // FIXME probably don't want to init this here?
    console.log({device})
    const { exchange, exchangeRate } = swap;
    command("initSwap")({ exchange: toExchangeRaw(exchange), exchangeRate, device })
      .toPromise()
      .then(
        result => {
          setSwapResult(result);
          console.error({ result });
        },
        fail => {
          console.error({ fail });
        },
      );
  }, [swap, device] );

  // TODO this seems pretty stupid to have to do this, perhaps put this in the exchange or something
  // I hate looking at it
  const toAmount = fromAmount
    .div(BigNumber(10).pow(fromUnit.magnitude))
    .times(exchangeRate.rate)
    .times(BigNumber(10).pow(toUnit.magnitude));

  return (
    <ModalBody
      onClose={onClose}
      title={<Trans i18nKey="swap.modal.title" />}
      render={() =>
        swapResult ? (
          <pre>{JSON.stringify(swapResult, null, "  ")}</pre>
        ) : (
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
                <LinkWithExternalIcon onClick={undefined} label={swap.exchangeRate.provider} />
              </Text>
            </Box>
            <Box
              mt={6}
              horizontal
              alignItems="center"
              onClick={() => setCheckedDisclaimer(!checkedDisclaimer)}
            >
              <CheckBox isChecked={checkedDisclaimer} />
              <Text ff="Inter|SemiBold" fontSize={4} style={{ marginLeft: 12, flex: 1 }}>
                <Trans i18nKey="swap.modal.disclaimer" />
              </Text>
            </Box>
          </Box>
        )
      }
      renderFooter={() => (
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
          <Button
            onClick={onContinue}
            disabled={!checkedDisclaimer}
            primary
            data-e2e="modal_buttonContinue_swap"
          >
            <Trans i18nKey="common.continue" />
          </Button>
        </>
      )}
    />
  );
};

export default SwapBody;
