// @flow
import React from "react";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import { mockedAppExec } from "~/renderer/components/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import Box from "~/renderer/components/Box";
import { command } from "~/renderer/commands";

const connectAppExec = command("connectApp");

const action = createAction(getEnv("MOCK") ? mockedAppExec : connectAppExec);

const Root = ({
  data,
  onResult,
}: {
  data: ?{
    account: AccountLike,
    parentAccount: ?Account,
  },
  onResult: () => void,
}) => {
  if (!data) return <Box />;
  const { account, parentAccount } = data;
  const mainAccount = getMainAccount(account, parentAccount);
  const tokenCurrency = account.type === "TokenAccount" ? account.token : null;
  return (
    <Box flow={2}>
      <DeviceAction
        action={action}
        request={{ account: mainAccount, tokenCurrency }}
        onResult={onResult}
      />
    </Box>
  );
};

const BuyCrypto = () => {
  return (
    <Modal
      name="MODAL_BUY_CRYPTO_DEVICE"
      preventBackdropClick
      centered
      render={({ data, onClose }) => (
        <ModalBody
          onClose={onClose}
          title="Connect your device"
          render={() => <Root data={data} onResult={onClose} />}
        />
      )}
    />
  );
};

export default BuyCrypto;
