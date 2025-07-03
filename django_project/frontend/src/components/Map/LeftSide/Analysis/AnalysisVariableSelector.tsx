import React from 'react';
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Select
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import { AnalysisData } from "../../DataTypes";


interface Props {
  data: AnalysisData;
  analysisType: string;
  onSelected: (value: string) => void;
}

/** Variable selector. */
export default function AnalysisVariableSelector(
  { data, analysisType, onSelected }: Props
) {
  const { indicators } = useSelector((state: RootState) => state.analysis);

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
            4) Select variable
          </Box>
          <AccordionIcon/>
        </AccordionButton>
      </h2>
      <AccordionPanel
        pb={4}
        pl={8}
        fontSize='13px'
      >
        <Select
          fontSize='13px'
          height='2rem'
          placeholder="Select a value"
          value={data.variable ? data.variable : ''}
          onChange={
            evt => onSelected(evt.target.value)
          }
        >
          {
            indicators.filter(
                indicator => indicator.analysis_types.includes(analysisType) && ((indicator.temporal_resolutions.includes(data.temporalResolution) && data.temporalResolution === 'Temporal') || true)
            ).map(indicator => {
              return <option
                key={indicator.variable}
                value={indicator.variable}
              >
                {indicator.name}
              </option>
            })
          }
        </Select>
      </AccordionPanel>
    </AccordionItem>
  )
}

