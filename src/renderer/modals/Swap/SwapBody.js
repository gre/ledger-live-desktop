// @flow
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { ModalBody } from "~/renderer/components/Modal";
import type { SwapOperation } from "@ledgerhq/live-common/lib/swap/types";
import StepSummary, { StepSummaryFooter } from "~/renderer/modals/Swap/steps/StepSummary";
import StepDevice from "~/renderer/modals/Swap/steps/StepDevice";
import StepFinished from "~/renderer/modals/Swap/steps/StepFinished";
import Button from "~/renderer/components/Button";

type SwapSteps = "summary" | "device" | "finished";
const SwapBody = ({ swap, onClose }: { swap: SwapOperation, onClose: any }) => {
  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false);
  const [activeStep, setActiveStep] = useState<SwapSteps>("summary");
  const [swapResult, setSwapResult] = useState(null);
  const onAcceptTOS = useCallback(() => setActiveStep("device"), [setActiveStep]);
  const onDeviceInteraction = useCallback(
    swapResult => {
      setActiveStep("finished");
      setSwapResult(swapResult);
    },
    [setActiveStep, setSwapResult],
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
            setCheckedDisclaimer={setCheckedDisclaimer}
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
