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
import { Landscape } from '../../../../store/landscapeSlice';


interface Props {
  data: AnalysisData;
  landscapes?: Landscape[];
  onSelected: (value: string) => void;
}

/** Landscape selector. */
export default function AnalysisLandscapeSelector(
  { data, landscapes, onSelected }: Props
) {

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
            1) Select landscape
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
          value={data.landscape ? data.landscape : ''}
          onChange={
            evt => onSelected(evt.target.value)
          }
        >
          {
            landscapes.map(landscape => {
              return <option
                key={landscape.id}
                value={landscape.name}
              >
                {landscape.name}
              </option>
            })
          }
        </Select>
      </AccordionPanel>
    </AccordionItem>
  )
}

