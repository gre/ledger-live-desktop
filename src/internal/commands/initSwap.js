// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import type { Exchange, ExchangeRate } from "@ledgerhq/live-common/lib/swap/types";
import initSwap from "@ledgerhq/live-common/lib/swap/initSwap";
import { fromExchangeRaw } from "@ledgerhq/live-common/lib/swap/serialization";

type Input = {
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  device: any,
};

type Result = {
  address: string,
  path: string,
  publicKey: string,
};

const cmd = ({ exchange, exchangeRate, device }: Input): Observable<Result> => {
  const deserializedExchange = fromExchangeRaw(exchange);
  return from(initSwap(deserializedExchange, exchangeRate, device.path));
};
export default cmd;
