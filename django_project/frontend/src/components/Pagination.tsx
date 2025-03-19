import { Box, Flex, Button, Text, Spacer, HStack, Select } from "@chakra-ui/react";
import React from "react";
import "../styles/pagination.css";


interface PaginationProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  pageSize?: number | null; // Optional page size
  totalCount?: number | null; // Optional total count
  onPageSizeChange?: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  handlePageChange,
  pageSize,
  totalCount,
  onPageSizeChange
}) => {
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    } else if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    } else {
      return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
    }
  };
  const startItem = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalCount ? Math.min(currentPage * pageSize, totalCount) : 0;

  return (
    <Flex justifyContent="flex-end" mt={4}>
      <HStack className="pagination-wrapper" spacing={3}>
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <Select 
            value={pageSize} 
            onChange={(e) => onPageSizeChange(Number(e.target.value))} 
            width="80px" 
            size="sm"
            borderRadius="md"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Select>
        )}
        {onPageSizeChange && <Spacer />}
        {/* Total Count Text */}
        {totalCount !== null && totalCount !== undefined && (
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            {`${startItem}-${endItem} of ${totalCount}`}
          </Text>
        )}
        {totalCount !== null && totalCount !== undefined && <Spacer />}
        <Flex className="pagination">
          <Button
            className="page-numbers prev"
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
          >
            prev
          </Button>
          {getPageNumbers(currentPage, totalPages).map((page, index) => 
          page === "..." ? (
            <Button
              key={index}
              className="page-numbers"
              onClick={() => {}}
            >
              ...
            </Button>
          ) :
          (
            <Button
              key={index}
              className={`page-numbers ${
                currentPage == page ? "current" : ""
              }`}
              onClick={() => handlePageChange(typeof page === 'string' ? Number.parseInt(page) : page)}
            >
              {page}
            </Button>
          ))}
          <Button
            className="page-numbers next"
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages}
          >
            next
          </Button>
        </Flex>
      </HStack>
    </Flex>
  );
};

export default Pagination;
