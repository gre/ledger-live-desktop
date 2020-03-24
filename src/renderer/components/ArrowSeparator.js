// @flow

import React from "react";
import styled from "styled-components";
import IconArrowDown from "~/renderer/icons/ArrowDown";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

const ArrowSeparatorWrapper: ThemedComponent<{}> = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0px;
  & > div {
    flex: 1;
    height: 1px;
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
      <IconArrowDown size={16} />
    </div>
    <div />
  </ArrowSeparatorWrapper>
);

export default ArrowSeparator;
