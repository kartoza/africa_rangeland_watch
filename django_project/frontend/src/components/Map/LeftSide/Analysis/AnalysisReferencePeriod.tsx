import React, { useState } from 'react';
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Select,
  Button,
} from "@chakra-ui/react";
import { AnalysisDataPeriod } from "../../DataTypes";

interface Props {
  title: string;
  value: AnalysisDataPeriod;
  isQuarter: boolean;
  isMonthly: boolean;
  multiple?: boolean;
  onSelectedYear: (year: number | number[]) => void;
  onSelectedQuarter: (quarter: number | number[]) => void;
  onSelectedMonth: (month: number | number[]) => void;
}

type DefaultPanel = {
  id: number, 
  year: number, 
  quarter: number | null, 
  month: number | null
}

/** Reference period. */
export default function AnalysisReferencePeriod(
  { title, value, isQuarter, isMonthly, multiple=false, onSelectedYear, onSelectedQuarter, onSelectedMonth }: Props
) {
  const nowYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i <= 10; i++) {
    years.push(nowYear - i);
  }
  years.reverse();

  // State to manage multiple AccordionPanels
  
  let defaultPanels: DefaultPanel[] = [];
  if (multiple && Array.isArray(value?.year) && Array.isArray(value?.quarter)) {
    for (let i = 0; i < value.year.length; i++) {
      defaultPanels.push({ id: i, year: value.year[i], quarter: value.quarter[i], month: null });
    }
  } else if (multiple && Array.isArray(value?.year) && Array.isArray(value?.month)) {
    for (let i = 0; i < value.year.length; i++) {
      defaultPanels.push({ id: i, year: value.year[i], quarter: null, month: value.month[i] });
    }
  } else if (!Array.isArray(value?.year) && !Array.isArray(value?.quarter) && !Array.isArray(value?.month)){
    defaultPanels = [{ id: 0, year: value?.year ? value?.year : null, quarter: value?.quarter ? value?.quarter : null, month: value?.month ? value?.month : null }]
  }
  const [panels, setPanels] = useState<DefaultPanel[]>(defaultPanels);

  // Add a new AccordionPanel
  const handleAddPanel = () => {
    setPanels([...panels, { id: panels.length + 1, year: null, quarter: null, month: null }]);
  };

  // Remove an AccordionPanel
  const handleDeletePanel = (id: number) => {
    const updatedPanels = panels.filter(panel => panel.id !== id);
    setPanels(updatedPanels);
    onSelectedYear(updatedPanels.map(panel => panel.year)); // Update the parent component
    onSelectedQuarter(updatedPanels.map(panel => panel.quarter)); // Update the parent component
    onSelectedMonth(updatedPanels.map(panel => panel.month)); // Update the parent component
  };

  // Handle year selection
  const handleYearChange = (id: number, year: number) => {
    const updatedPanels = panels.map(panel =>
      panel.id === id ? { ...panel, year } : panel
    );
    setPanels(updatedPanels);
    onSelectedYear(multiple ? updatedPanels.map(panel => panel.year) : updatedPanels[0].year); // Update the parent component
  };

  // Handle quarter selection
  const handleQuarterChange = (id: number, quarter: number) => {
    const updatedPanels = panels.map(panel =>
      panel.id === id ? { ...panel, quarter } : panel
    );
    setPanels(updatedPanels);
    onSelectedQuarter(multiple ? updatedPanels.map(panel => panel.quarter) : updatedPanels[0].quarter); // Update the parent component
  };

  // Handle month selection
  const handleMonthChange = (id: number, month: number) => {
    const updatedPanels = panels.map(panel =>
      panel.id === id ? { ...panel, month } : panel
    );
    setPanels(updatedPanels);
    onSelectedMonth(multiple ? updatedPanels.map(panel => panel.month) : updatedPanels[0].month); // Update the parent component
  };

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
            {title}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      {panels.map((panel) => (
        <AccordionPanel key={panel.id} pb={4} pl={8} fontSize='13px'>
          <Select
            fontSize='13px'
            height='2rem'
            placeholder="Select a year"
            value={panel.year || ''}
            onChange={(evt) => handleYearChange(panel.id, parseInt(evt.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
          {isQuarter && (
            <Select
              fontSize='13px'
              height='2rem'
              placeholder="Select a quarter"
              value={panel.quarter || ''}
              onChange={(evt) => handleQuarterChange(panel.id, parseInt(evt.target.value))}
            >
              {[1, 2, 3, 4].map(quarter => (
                <option key={quarter} value={quarter}>{quarter}</option>
              ))}
            </Select>
          )}
          {isMonthly && (
            <Select
              fontSize='13px'
              height='2rem'
              placeholder="Select a month"
              value={panel.month || ''}
              onChange={(evt) => handleMonthChange(panel.id, parseInt(evt.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </Select>
          )}
          {
            panels.length > 1 && <Button
              size="sm"
              colorScheme="red"
              mt={2}
              onClick={() => handleDeletePanel(panel.id)}
            >
              Delete
            </Button>}
        </AccordionPanel>
      ))}
      {multiple && <AccordionPanel pb={4} pl={8}>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleAddPanel}
        >
          Add more
        </Button>
      </AccordionPanel>}
    </AccordionItem>
  );
}