// @flow
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { ModalBody } from "~/renderer/components/Modal";
import type { SwapOperation } from "@ledgerhq/live-common/lib/swap/types";
import StepSummary, { StepSummaryFooter } from "~/renderer/modals/Swap/steps/StepSummary";
import StepDevice from "~/renderer/modals/Swap/steps/StepDevice";
import StepFinished from "~/renderer/modals/Swap/steps/StepFinished";
import Button from "~/renderer/components/Button";
import { first, map, tap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

type SwapSteps = "summary" | "device" | "finished";
const SwapBody = ({ swap, onClose }: { swap: SwapOperation, onClose: any }) => {
  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false);
  const [activeStep, setActiveStep] = useState<SwapSteps>("summary");
  const [swapResult, setSwapResult] = useState(null);
  const onAcceptTOS = useCallback(() => setActiveStep("device"), [setActiveStep]);
  const onSwitchAccept = useCallback(() => setCheckedDisclaimer(!checkedDisclaimer), [
    checkedDisclaimer,
  ]);

  const onDeviceInteraction = useCallback(
    async swapResult => {
      setActiveStep("finished");
      const { error, data } = swapResult;
      if (error) throw error;
      const { transaction, swapId } = data;
      const { exchange } = swap;
      console.log("got the tx, attempt to sign", { transaction, swapId });
      const bridge = getAccountBridge(exchange.fromAccount);
      const signedOperation = await bridge
        .signOperation({ account: exchange.fromAccount, deviceId: "", transaction })
        .pipe(
          tap(e => console.log(e)),
          first(e => e.type === "signed"),
          map(e => e.signedOperation),
        )
        .toPromise();

      console.log("tx signed successfully", { signedOperation });
      console.log("broadcasting");

      const operation = await bridge.broadcast({
        account: exchange.fromAccount,
        signedOperation,
      });

      console.log("resulting operation", { operation });
    },
    [swap, setActiveStep, setSwapResult],
  );

  return (
    <ModalBody
      onClose={onClose}
      title={<Trans i18nKey="swap.modal.title" />}
      render={() =>
        activeStep === "summary" ? (
          <StepSummary
            swap={swap}
            checkedDisclaimer={checkedDisclaimer}
            onSwitchAccept={onSwitchAccept}
          />
        ) : activeStep === "device" ? (
          <StepDevice swap={swap} onContinue={onDeviceInteraction} />
        ) : swapResult ? (
          <StepFinished swapResult={swapResult} />
        ) : null
      }
      renderFooter={() =>
        activeStep === "summary" ? (
          <StepSummaryFooter
            onContinue={onAcceptTOS}
            onClose={onClose}
            disabled={!checkedDisclaimer}
          />
        ) : (
          <Button onClick={onClose} secondary data-e2e="modal_buttonClose_swap">
            <Trans i18nKey="common.close" />
          </Button>
        )
      }
    />
  );
};

export default SwapBody;
