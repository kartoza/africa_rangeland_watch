import React from 'react';
import {
  Box,
  Text,
  VStack} from '@chakra-ui/react';
import { WidgetHeight } from '../../store/dashboardSlice';
import { SpatialBarChart, LineChart, BarChart } from '../Map/RightSide/AnalysisResult';

// Chart Widget Component
const ChartWidget: React.FC<{ widgetId: string, data: any, height: WidgetHeight, config?: any }> = ({ widgetId, data, height, config }) => {
  const chartHeight = height === 'small' ? '120px' : height === 'medium' ? '180px' : height === 'large' ? '280px' : '380px';
  const analysisType = data.data.analysisType;
  const chartType = config?.chartType || 'bar'; // Default to bar chart if not specified

  const renderChart = () => {
    switch (analysisType) {
      case 'Spatial':
        return <SpatialBarChart analysis={data}/>;
      case 'Temporal':
        if (chartType === 'bar') {
          return <BarChart analysis={data} />;
        }
        return <LineChart analysis={data} />;
      default:
        return <Text color="red.500">Unsupported chart type</Text>;
    }
  };

  return (
    <VStack spacing={4} align="stretch" h="full" overflow="hidden">
      <Box id={`chart-${widgetId}`} h={chartHeight} position="relative" overflowY="auto" pr={2}>
        {renderChart()}
      </Box>
    </VStack>
  );
};

export default ChartWidget;
