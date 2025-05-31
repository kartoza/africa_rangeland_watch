import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge} from '@chakra-ui/react';
import { WidgetHeight, heightConfig } from './types';
import { BaselineTable } from '../Map/RightSide/AnalysisResult';


// Table Widget Component
const TableWidget: React.FC<{ data: any; height: WidgetHeight }> = ({ data, height }) => {
  const tableHeight = height === 'small' ? '120px' : height === 'medium' ? '200px' : height === 'large' ? '300px' : '400px';
  
  return (
    <Box overflowY="auto" h={tableHeight}>
      <BaselineTable analysis={data}/>
    </Box>
  );
};

export default TableWidget;
