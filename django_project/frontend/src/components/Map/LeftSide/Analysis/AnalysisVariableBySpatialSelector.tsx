import React from 'react';
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Select
} from "@chakra-ui/react";
import { AnalysisData } from "../../DataTypes";


interface Props {
  data: AnalysisData;
  onSelected: (value: string) => void;
}

/** Variable selector. */
export default function AnalysisVariableBySpatialSelector(
  { data, onSelected }: Props
) {

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
            ["EVI", "NDVI", "Bare ground", "Woody cover", "Grass cover", "Grazing capacity", "Soil carbon", "Soil carbon change"].map(variable => {
              return <option
                key={variable}
                value={variable}
              >
                {variable}
              </option>
            })
          }
        </Select>
      </AccordionPanel>
    </AccordionItem>
  )
}

