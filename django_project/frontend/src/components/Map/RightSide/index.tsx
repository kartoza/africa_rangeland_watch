import React from 'react';
import { Box } from "@chakra-ui/react";
import AnalysisResult from "./AnalysisResult";


/** RightSide component of map. */
export default function RightSide() {
  return (
    <Box position='absolute' top={51} right={0} p={4} pointerEvents='none'>
      <AnalysisResult/>
    </Box>
  )
}

