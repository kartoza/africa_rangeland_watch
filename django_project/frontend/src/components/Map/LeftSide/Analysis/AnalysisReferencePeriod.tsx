import React from 'react';
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Select
} from "@chakra-ui/react";
import { AnalysisDataPeriod } from "../../DataTypes";


interface Props {
  title: string;
  value: AnalysisDataPeriod;
  isQuarter: boolean;
  onSelectedYear: (year: number) => void;
  onSelectedQuarter: (quarter: number) => void;
}

/** Reference period. */
export default function AnalysisReferencePeriod(
  { title, value, isQuarter, onSelectedYear, onSelectedQuarter }: Props
) {
  const nowYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = 0; i <= 10; i++) {
    years.push(nowYear - i)
  }
  years.reverse()

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
            {title}
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
          placeholder="Select a year"
          value={value?.year ? value?.year : ''}
          onChange={
            evt => onSelectedYear(parseInt(evt.target.value))
          }
        >
          {
            years.map(year => {
              return <option key={year} value={year}>{year}</option>
            })
          }
        </Select>
        {
          isQuarter &&
          <Select
            fontSize='13px'
            height='2rem'
            placeholder="Select a quarter"
            value={value?.quarter ? value?.quarter : ''}
            onChange={
              evt => onSelectedQuarter(parseInt(evt.target.value))
            }
          >
            {
              [1, 2, 3, 4].map(quarter => {
                return <option key={quarter} value={quarter}>{quarter}</option>
              })
            }
          </Select>
        }
      </AccordionPanel>
    </AccordionItem>
  )
}

