// @flow
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { command } from "~/renderer/commands";
import { toExchangeRaw } from "@ledgerhq/live-common/lib/swap/serialization";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";

const StepDevice = ({ swap, onContinue }: { swap: SwapOperation, onContinue: any }) => {
  const device = useSelector(getCurrentDevice);
  const [running, setRunning] = useState(false);

  // TODO do we need a deviceAction for this?
  useEffect(() => {
    const { exchange, exchangeRate } = swap;
    if (device && !running) {
      setRunning(true);
      command("initSwap")({ exchange: toExchangeRaw(exchange), exchangeRate, device })
        .toPromise()
        .then(
          data => {
            onContinue({ data });
          },
          error => {
            onContinue({ error }); // FIXME well, yeah
          },
        );
    }
  }, [swap, running, setRunning, device, onContinue]);

  return (
    <Box>
      <Text>{"initSwap is running, validate on device"}</Text>
    </Box>
  );
};

export default StepDevice;
