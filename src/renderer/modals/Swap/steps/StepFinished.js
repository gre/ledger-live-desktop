// @flow
import React from "react";
import Box from "~/renderer/components/Box";
import TranslatedError from "~/renderer/components/TranslatedError";

const StepFinished = ({ swapResult }: { swapResult: any }) => {
  const { error, data } = swapResult;
  return (
    <Box>
      <TranslatedError error={error} />
      {JSON.stringify(data, null, "  ")}
    </Box>
  );
};

export default StepFinished;
