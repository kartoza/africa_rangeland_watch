import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Radio,
  RadioGroup
} from "@chakra-ui/react";
import React, { useEffect } from 'react';
import { AnalysisData } from "../../DataTypes";
import { TemporalResolution } from "../../fixtures/analysis";

interface Props {
  data: AnalysisData;
  onSelected: (landscape: string) => void;
}

/** Temporal/Spatial resolution . */
export default function AnalysisResolutionSelector(
  { data, onSelected }: Props
) {

  /** Default data */
  useEffect(() => {
    if (!data.temporalResolution) {
      onSelected(TemporalResolution.ANNUAL)
    }
  }, [data.temporalResolution]);

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
            3) Select resolution
          </Box>
          <AccordionIcon/>
        </AccordionButton>
      </h2>
      <AccordionPanel
        pb={4}
        pl={8}
        fontSize='13px'
      >
        <RadioGroup
          defaultValue="1"
          onChange={(value) => onSelected(value)}
          value={data.temporalResolution ? data.temporalResolution : TemporalResolution.ANNUAL}
        >
          <Flex gap={4} flexDirection='column'>
            <Radio value={TemporalResolution.ANNUAL}>
              <Box fontSize="13px">{TemporalResolution.ANNUAL}</Box>
            </Radio>
            <Radio value={TemporalResolution.QUARTERLY}>
              <Box fontSize="13px">{TemporalResolution.QUARTERLY}</Box>
            </Radio>
            <Radio value={TemporalResolution.MONTHLY}>
              <Box fontSize="13px">{TemporalResolution.MONTHLY}</Box>
            </Radio>
          </Flex>
        </RadioGroup>
      </AccordionPanel>
    </AccordionItem>
  )
}

