import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack
} from '@chakra-ui/react';
import { WidgetHeight, heightConfig } from './types';
import { SpatialBarChart, LineChart, BarChart } from '../Map/RightSide/AnalysisResult';

// Chart Widget Component
const ChartWidget: React.FC<{ data: any, height: WidgetHeight, config?: any }> = ({ data, height, config }) => {
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
      <Box h={chartHeight} position="relative" overflowY="auto" pr={2}>
        {renderChart()}
      </Box>
    </VStack>
  );
};

export default ChartWidget;
