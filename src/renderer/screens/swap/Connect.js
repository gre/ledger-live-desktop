// @flow

import React from "react";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { command } from "~/renderer/commands";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { mockedEventEmitter } from "~/renderer/components/DebugMock";

const connectManagerExec = command("connectManager");
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectManagerExec);

const Connect = ({ setResult }: { setResult: () => undefined }) => {
  return <DeviceAction onResult={setResult} action={action} request={null} />;
};

export default Connect;
