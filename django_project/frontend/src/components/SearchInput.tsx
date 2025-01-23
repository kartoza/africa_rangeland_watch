import React, { useState, useEffect } from "react";
import { Input } from "@chakra-ui/react";

interface SearchInputProps<T extends Record<string, any>> {
  placeholder: string;
  data: T[];
  filterKeys: (keyof T)[]; // Accept multiple keys for filtering
  onFilteredData: (filteredData: T[]) => void;
  isDisabled?: boolean;
}

const SearchInput = <T extends Record<string, any>>({
  placeholder,
  data,
  filterKeys,
  onFilteredData,
  isDisabled = false,
}: SearchInputProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Handle filtering whenever searchTerm or data changes
  useEffect(() => {
    
    const filteredData = data.filter((item) =>
      filterKeys.some((key) => {
        const value = item[key];
        return (
          value &&
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    );

    onFilteredData(filteredData);
  }, [searchTerm, data]);

  return (
    <Input
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      borderColor="gray.400"
      width="100%"
      isDisabled={isDisabled}
    />
  );
};

export default SearchInput;
