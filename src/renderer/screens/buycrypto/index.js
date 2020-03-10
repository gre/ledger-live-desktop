// @flow
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import invariant from "invariant";
import styled from "styled-components";
import querystring from "querystring";
import type { Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { command } from "~/renderer/commands";
import { openModal, closeModal } from "~/renderer/actions/modals";
import { isModalOpened } from "~/renderer/reducers/modals";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Box from "~/renderer/components/Box";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import useTheme from "~/renderer/hooks/useTheme";
import { activeAccountsSelector } from "~/renderer/reducers/accounts";
import SelectAccount from "~/renderer/components/SelectAccount";
import Button from "~/renderer/components/Button";
import Link from "~/renderer/components/Link";
import FormattedVal from "~/renderer/components/FormattedVal";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";

// TODO we would need to fetch this
const prodSupported = ["BTC", "ETH"];

const sandboxAddresses = {
  BTC: "mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy",
};

const sandboxEnabled = !!process.env.BUY_CRYPTO_SANDBOX_MODE;
const supportedTickers = sandboxEnabled ? Object.keys(sandboxAddresses) : prodSupported;

const Widget = ({
  account,
  onVerifyAddress,
  targetPage,
}: {
  account: ?Account,
  onVerifyAddress: string => any,
  targetPage: string,
}) => {
  const primaryColor = useTheme("colors.wallet");
  const fontColor = useTheme("colors.black");
  const url = sandboxEnabled
    ? "https://trade-ui.sandbox.coinify.com"
    : "https://trade-ui.coinify.com";
  const partnerId = sandboxEnabled ? 104 : 119;

  const cryptoCurrencies = account && account.currency.ticker;
  const address =
    !account || !cryptoCurrencies
      ? undefined
      : sandboxEnabled
      ? sandboxAddresses[cryptoCurrencies]
      : account.freshAddress;

  useEffect(() => {
    if (!address) return;

    function onMessage(e) {
      if (e.origin !== url || !e.data) return;
      console.log(e.data);
      const { type, event, context } = e.data;
      if (type !== "event") return;
      switch (event) {
        case "trade.receive-account-changed":
          if (context.address === address) {
            onVerifyAddress(context.address);
          } else {
            // TODO this is a problem, it should not occur.
          }
          break;
      }
    }

    window.addEventListener("message", onMessage, false);
    return () => window.removeEventListener("message", onMessage, false);
  }, [address, url, onVerifyAddress]);

  return (
    <iframe
      style={{
        border: "none",
        width: "100%",
        flex: 1,
      }}
      src={
        url +
        "?" +
        querystring.stringify({
          fontColor,
          primaryColor,
          partnerId,
          cryptoCurrencies,
          address,
          targetPage,
          transferInMedia: targetPage === "buy" ? undefined : "blockchain",
          transferOutMedia: targetPage === "sell" ? undefined : "blockchain",
        })
      }
      sandbox
      allow="camera"
    ></iframe>
  );
};

const HeaderAccountContext = ({ account }: { account: Account }) => {
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const name = getAccountName(account);
  return (
    <>
      <CryptoCurrencyIcon currency={currency} size={16} />
      <div style={{ flex: 1 }}>
        <Ellipsis ff="Inter|SemiBold" fontSize={4}>
          {name}
        </Ellipsis>
      </div>
      <Box>
        <FormattedVal
          color="palette.text.shade60"
          val={account.balance}
          unit={unit}
          showCode
          disableRounding
        />
      </Box>
    </>
  );
};

const ContextualHeader = ({ account, onClose }: { account: ?Account, onClose: () => void }) => {
  return (
    <Box horizontal alignItems="center" flow={2}>
      <Box
        style={{ cursor: "pointer" }}
        onClick={onClose}
        ff="Inter|SemiBold"
        color="palette.text.shade80"
        fontSize={6}
      >
        Buy Crypto /
      </Box>
      {account ? <HeaderAccountContext account={account} /> : null}
    </Box>
  );
};

const filterAccount = a => supportedTickers.includes(a.currency.ticker);

const InitialSelectAccount = ({
  selectAccount,
  onAccessAccount,
}: {
  selectAccount: Account => void,
  onAccessAccount: () => void,
}) => {
  const accounts = useSelector(activeAccountsSelector);
  const [account, setAccount] = useState<Account>(accounts.filter(filterAccount)[0]);

  return (
    <Box>
      <Box pb={2} ff="Inter|SemiBold" color="palette.text.shade100" fontSize={6}>
        Buy Crypto on account
      </Box>
      {!account ? (
        <Box alignItems="center">
          <Box pb={2} ff="Inter" color="palette.text.shade100" fontSize={4}>
            No account supported. Supported currencies are {supportedTickers.join(", ")}
          </Box>
          <Button primary>Add Account</Button>
        </Box>
      ) : (
        <Box horizontal flow={2} style={{ minWidth: 400 }}>
          <Box grow>
            <SelectAccount filter={filterAccount} value={account} onChange={setAccount} />
          </Box>
          <Button primary onClick={() => selectAccount(account)}>
            Continue
          </Button>
        </Box>
      )}

      <Box pt={4}>
        <Link onClick={onAccessAccount}>Access my Coinify.com account</Link>
      </Box>
    </Box>
  );
};

const RequiresDeviceMatchesAccount = ({ account }: { account: Account }) => {
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const opened = useSelector(s => isModalOpened(s, "MODAL_BUY_CRYPTO_DEVICE"));
  const openedRef = useRef(opened);
  useEffect(() => {
    openedRef.current = opened;
  }, [opened]);

  useEffect(() => {
    if (!openedRef.current) {
      dispatch(openModal("MODAL_BUY_CRYPTO_DEVICE", { account }));
    }
    return () => {
      if (openedRef.current) {
        dispatch(closeModal("MODAL_BUY_CRYPTO_DEVICE"));
      }
    };
  }, [account, device, dispatch]);

  return null;
};

const Root = () => {
  const [{ account, widgetEntered }, setContext] = useState({
    widgetEntered: false,
    account: null,
  });
  const device = useSelector(getCurrentDevice);

  const onVerifyAddress = useCallback(async () => {
    const mainAccount = account;
    if (!mainAccount || !device) return;
    await command("getAddress")({
      derivationMode: mainAccount.derivationMode,
      currencyId: mainAccount.currency.id,
      devicePath: device.path,
      path: mainAccount.freshAddressPath,
      verify: true,
    }).toPromise();
  }, [account, device]);

  if (widgetEntered) {
    return (
      <Box grow alignSelf="stretch">
        {account ? <RequiresDeviceMatchesAccount account={account} /> : null}
        <ContextualHeader
          account={account}
          onClose={() =>
            setContext({
              account: null,
              widgetEntered: false,
            })
          }
        />
        <Widget
          targetPage={account ? "buy" : "login"}
          account={account}
          onVerifyAddress={onVerifyAddress}
        />
      </Box>
    );
  }

  return (
    <InitialSelectAccount
      onAccessAccount={() =>
        setContext({
          account: null,
          widgetEntered: true,
        })
      }
      selectAccount={account =>
        setContext({
          account,
          widgetEntered: true,
        })
      }
    />
  );
};

const Container: ThemedComponent<{}> = styled(Box)`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Partners = () => {
  return (
    <Container pb={6}>
      <Root />
    </Container>
  );
};

export default Partners;
