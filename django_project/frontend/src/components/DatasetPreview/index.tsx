import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Text,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalContent,
  ModalFooter,
  Input,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react';
import { CloseIcon } from "@chakra-ui/icons";
import { AppDispatch, RootState } from "../../store";
import { setLayerUuid, setPage, setPageSize, searchData } from '../../store/dataPreviewSlice';
import { fetchDataPreview } from '../../store/dataPreviewSlice';
import Pagination from '../Pagination';

const DatasetPreview: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [rawSearch, setRawSearch] = useState("");
    const { layer_uuid, layer_name, data, status, error, page, pageSize, count, columns, search } = useSelector((state: RootState) => state.dataPreview);

    useEffect(() => {
        const handler = setTimeout(() => {
            dispatch(searchData(rawSearch));
        }, 300);
        return () => clearTimeout(handler);
    }, [rawSearch]);

    useEffect(() => {
        if (layer_uuid) {
            dispatch(fetchDataPreview({ layer_uuid, page, page_size: pageSize, search }));
        }
    }, [dispatch, layer_uuid, page, pageSize, search]);

    const handlePageChange = (newPage: number) => {
        dispatch(setPage(newPage));
    };

    const handlePageSizeChange = (pageSize: number) => {
        dispatch(setPageSize(pageSize));
    };

    const handleCloseModal = () => {
        dispatch(setLayerUuid({ layer_uuid: null, layer_name: null }));
    }

    return (
        <Modal isOpen={layer_uuid !== null} onClose={handleCloseModal} scrollBehavior="inside" size="full">
            <ModalOverlay />
            <ModalContent bg="white">
                <ModalHeader>{layer_name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box>
                        {status === 'loading' && <Progress size="xs" isIndeterminate />}
                        {error && <Text color="red.500" mb={4}>{error}</Text>}
                        <InputGroup mb={4}>
                            <Input
                                placeholder="Search..."
                                value={rawSearch || ""}
                                onChange={(e) => setRawSearch(e.target.value || "")}
                                mb={4}
                            />
                            {rawSearch && (
                                <InputRightElement>
                                    <IconButton
                                        aria-label="Clear search"
                                        icon={<CloseIcon />}
                                        size="xs"
                                        onClick={() => setRawSearch("")}
                                    />
                                </InputRightElement>
                            )}
                        </InputGroup>
                        {data && (
                            <TableContainer>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            {columns.map((key) => (
                                                <Th key={key} color="black" fontWeight="bold">{key}</Th>
                                            ))}
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {data.map((row: any, index: number) => (
                                            <Tr key={index}>
                                                {columns.map((key) => (
                                                    <Td key={`${index}_${key}`}>{row[key]}</Td>
                                                ))}
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>                
                        )}
                    </Box>
                </ModalBody>
                <ModalFooter>
                    {data && (
                        <Pagination currentPage={page} totalPages={Math.ceil(count / pageSize)} totalCount={count}
                        handlePageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
        
    );
};

export default DatasetPreview;


