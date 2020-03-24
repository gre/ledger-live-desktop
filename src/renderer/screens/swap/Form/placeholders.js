// @flow
// TODO clean this up once we have a design

import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/Button";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import React, { useCallback } from "react";
import { openModal } from "~/renderer/actions/modals";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { useHistory } from "react-router-dom";

export const UserDoesntHaveApp = () => {
  const history = useHistory();
  const openManager = useCallback(() => {
    history.push("manager"); // TODO prefill to toCurrency app name
  }, [history]);

  return (
    <Box horizontal justifyContent="space-between">
      <Label>{`Missing currency app or app not up to date.`}</Label>
      <Button mt={3} primary onClick={openManager}>
        <Trans i18nKey="swap.start.openManager" />
      </Button>
    </Box>
  );
};

export const UserDoesntHaveAccounts = ({
  toCurrency,
}: {
  toCurrency: CryptoCurrency | TokenCurrency,
}) => {
  const dispatch = useDispatch();
  const showAddAccountModal = useCallback(
    () => dispatch(openModal("MODAL_ADD_ACCOUNTS", { currency: toCurrency || null })),
    [dispatch, toCurrency],
  );
  return (
    <Box flex={1} horizontal justifyContent="space-between">
      <Label>{`No selectable accounts for selected currency`}</Label>
      <Button primary onClick={showAddAccountModal}>
        <Trans i18nKey="swap.start.addAccount" />
      </Button>
    </Box>
  );
};
