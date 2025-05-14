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


interface AnalysisSpatialYearFilterProps {
    initialStartYear?: number;
    initialEndYear?: number;
    disabled?: boolean;
    onYearChange: (startYear: number | null, endYear: number | null) => void;
}

const AnalysisSpatialYearFilter: React.FC<AnalysisSpatialYearFilterProps> = ({ initialStartYear, initialEndYear, disabled = false, onYearChange }) => {
    const startYear = initialStartYear;
    const endYear = initialEndYear;

    const handleStartYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onYearChange(event.target.value ? parseInt(event.target.value) : null, endYear);
    };

    const handleEndYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onYearChange(startYear, event.target.value ? parseInt(event.target.value) : null);
    };

    return (
        <AccordionItem>
            <h2>
                <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
                        4) Select year range (Optional)
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
            </h2>
            <AccordionPanel pb={4} pl={8} fontSize='13px'>
                <Select
                    fontSize='13px'
                    height='2rem'
                    placeholder="Select start year"
                    value={startYear ?? ''}
                    onChange={handleStartYearChange}
                    disabled={disabled}
                >
                    {/* Add options for years */}
                    {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </Select>
                <Select
                    fontSize='13px'
                    height='2rem'
                    placeholder="Select end year"
                    value={endYear ?? ''}
                    onChange={handleEndYearChange}
                    mt={4}
                    disabled={disabled}
                >
                    {/* Add options for years */}
                    {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </Select>
            </AccordionPanel>
        </AccordionItem>
    );
};

export default AnalysisSpatialYearFilter;