import React from "react";
import { Box, FormControl, FormLabel, Input, Stack, Heading } from "@chakra-ui/react";

interface DateRangeProps {
  startDate?: string;
  endDate?: string;
  onChange: (name: "startDate" | "endDate", value: string) => void;
}

const BaselineDateRangeSelector: React.FC<DateRangeProps> = ({ startDate = "", endDate = "", onChange }) => {
    const handleChange = (name: "startDate" | "endDate") => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === "" ? null : e.target.value;
        onChange(name, value);
    };
    const today = new Date().toISOString().split("T")[0];
    return (
    <Box fontSize='13px' pt={4} pb={4} pl={8} pr={8}>
        <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px' pb={4}>
            Select Date Range for Baseline Analysis (Default to 2015-2020)
        </Box>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel fontSize='13px'>Start Date</FormLabel>
          <Input
            type="date"
            name="startDate"
            value={startDate ?? ""}
            height='2rem'
            fontSize='13px'
            onChange={handleChange("startDate")}
            max={today}
        />
        </FormControl>

        <FormControl>
          <FormLabel fontSize='13px'>End Date</FormLabel>
          <Input
            type="date"
            name="endDate"
            value={endDate ?? ""}
            height='2rem'
            fontSize='13px'
            onChange={handleChange("endDate")}
            max={today}
        />
        </FormControl>
      </Stack>
    </Box>
  );
};

export default BaselineDateRangeSelector;