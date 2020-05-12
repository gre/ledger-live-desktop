// @flow

import React from "react";
import styled from "styled-components";
import IconTransfer from "~/renderer/icons/Transfer";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

const ArrowSeparatorWrapper: ThemedComponent<{}> = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 23px;
  & > div {
    flex: 1;
    width: 1px;
    background: ${p => p.theme.colors.palette.divider};
    &:nth-of-type(2) {
      color: ${p => p.theme.colors.palette.primary.main};
      flex: unset;
      display: flex;
      align-items: center;
      height: 36px;
      width: 36px;
      border-radius: 36px;
      background: transparent;
      justify-content: center;
      border: 1px solid ${p => p.theme.colors.palette.divider};
    }
  }
`;

const ArrowSeparator = () => (
  <ArrowSeparatorWrapper>
    <div />
    <div>
      <IconTransfer size={16} />
    </div>
    <div />
  </ArrowSeparatorWrapper>
);

export default ArrowSeparator;
