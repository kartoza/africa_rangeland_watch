import React, { useEffect, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Text,
  Progress,
  Stack,
  ButtonGroup,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { AppDispatch, RootState } from "../../store";
import { setLayerUuid, setPage, setPageSize } from '../../store/dataPreviewSlice';
import { fetchDataPreview } from '../../store/dataPreviewSlice';
import Pagination from '../Pagination';

const DatasetPreview: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { layer_uuid, data, status, error, page, pageSize, count, columns } = useSelector((state: RootState) => state.dataPreview);

    useEffect(() => {
        if (layer_uuid) {
            dispatch(fetchDataPreview({ layer_uuid, page, page_size: pageSize }));
        }
    }, [dispatch, layer_uuid, page, pageSize]);

    const handlePageChange = (newPage: number) => {
        dispatch(setPage(newPage));
    };

    const handlePageSizeChange = (pageSize: number) => {
        dispatch(setPageSize(pageSize));
    };

    return (
        <Box>
            {status === 'loading' && <Progress size="xs" isIndeterminate />}
            {error && <Text color="red.500">{error}</Text>}
            {data && (
                <TableContainer>
                    <Table variant="outline">
                        <Thead>
                            <Tr>
                                {columns.map((key) => (
                                    <Th key={key}>{key}</Th>
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
            {data && (
                <Pagination currentPage={page} totalPages={Math.ceil(count / pageSize)}
                handlePageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
            )}
        </Box>
    );
};

export default DatasetPreview;


