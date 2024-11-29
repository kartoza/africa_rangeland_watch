import { Box, Flex, Button } from "@chakra-ui/react";
import React from "react";
import "../styles/pagination.css";


interface PaginationProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  handlePageChange,
}) => {
  return (
    <Flex justifyContent="flex-end" mt={4}>
      <Box className="pagination-wrapper">
        <Flex className="pagination">
          <Button
            className="page-numbers prev"
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
          >
            prev
          </Button>
          {Array.from({ length: totalPages }).map((_, index) => (
            <Button
              key={index}
              className={`page-numbers ${
                currentPage === index + 1 ? "current" : ""
              }`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
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
      </Box>
    </Flex>
  );
};

export default Pagination;
