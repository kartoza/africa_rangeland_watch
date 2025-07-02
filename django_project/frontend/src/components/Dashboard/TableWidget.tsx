import React from 'react';
import {
  Box} from '@chakra-ui/react';
import { WidgetHeight } from '../../store/dashboardSlice';
import { BaselineTable } from '../Map/RightSide/AnalysisResult';


// Table Widget Component
const TableWidget: React.FC<{ widgetId: string, data: any; height: WidgetHeight }> = ({ widgetId, data, height }) => {
  const tableHeight = height === 'small' ? '120px' : height === 'medium' ? '200px' : height === 'large' ? '300px' : '400px';
  
  return (
    <Box id={`table-${widgetId}`} overflowY="auto" h={tableHeight}>
      <BaselineTable analysis={data}/>
    </Box>
  );
};

export default TableWidget;
