// @flow

import React, { useCallback, useEffect, useState } from "react";
import { getProviders } from "@ledgerhq/live-common/lib/swap";
import Landing from "~/renderer/screens/swap/Landing";
import Form from "~/renderer/screens/swap/Form";
import Connect from "~/renderer/screens/swap/Connect";

const Swap = () => {
  const [providers, setProviders] = useState(null);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [skipDeviceAction, setSkipDeviceAction] = useState(false);
  const [installedApps, setInstalledApps] = useState(null); // TODO do we need more than this?

  useEffect(() => {
    async function fetchProviders() {
      const providers = await getProviders();
      setProviders(providers);
    }
    fetchProviders();
  }, [setProviders]);

  const onSetResult = useCallback(
    ({ result }) => {
      if (result) {
        const { installed } = result;
        setInstalledApps(installed);
      }
    },
    [setInstalledApps],
  );

  const showDeviceAction = !installedApps && !skipDeviceAction;
  const showInstallSwap =
    !showDeviceAction && installedApps && !installedApps.some(a => a.name === "Bitcoin");
  // ↑ FIXME Use swap once we have swap app for real

  const onContinue = useCallback(() => {
    setShowLandingPage(false);
  }, [setShowLandingPage]);

  return showLandingPage ? (
    <Landing providers={providers} onContinue={onContinue} />
  ) : showDeviceAction ? (
    <Connect setResult={onSetResult} setSkipDeviceAction={setSkipDeviceAction} />
  ) : showInstallSwap ? (
    <div> [Install the missing swap app illustration] </div>
  ) : (
    <Form
      providers={providers}
      installedApps={[
        { name: "Bitcoin", updated: true },
        { name: "Ethereum", updated: false },
        { name: "XRP", updated: true },
      ]}
    />
  );
};

export default Swap;
