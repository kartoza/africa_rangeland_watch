import React, { useEffect } from 'react';
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
import { Types } from "../../fixtures/analysis";
import { AnalysisData } from "../../DataTypes";


interface Props {
  data: AnalysisData;
  onSelected: (value: string) => void;
}

/** Analysis type selector. */
export default function AnalysisTypeSelector({ data, onSelected }: Props) {

  /** Default data */
  useEffect(() => {
    if (!data.analysisType) {
      onSelected(Types.BASELINE)
    }
  }, [data.analysisType]);

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
            2) Select analysis type
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
          value={data.analysisType ? data.analysisType : Types.BASELINE}
        >
          <Flex gap={4} flexDirection='column'>
            <Radio value={Types.BASELINE}>
              <Box fontSize="13px">{Types.BASELINE}</Box>
            </Radio>
            <Radio value={Types.TEMPORAL}>
              <Box fontSize="13px">{Types.TEMPORAL}</Box>
            </Radio>
            <Radio value={Types.SPATIAL}>
              <Box fontSize="13px">{Types.SPATIAL}</Box>
            </Radio>
            <Radio value={Types.BACI}>
              <Box fontSize="13px">{Types.BACI}</Box>
            </Radio>
          </Flex>
        </RadioGroup>
      </AccordionPanel>
    </AccordionItem>
  )
}

