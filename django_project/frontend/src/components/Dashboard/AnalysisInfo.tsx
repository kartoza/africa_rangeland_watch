import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { formatMonthYear } from '../../utils/chartUtils';


type AnalysisInfoProps = {
    data: any;
};


const getReferencePeriod = ({
    year,
    month,
    quarter,
}: { year?: number; month?: number; quarter?: number }) => {
    if (!year && !month && !quarter) {
        return 'N/A';
    }

    if (year && month) {
        return formatMonthYear(month, year);
    } else if (year && quarter) {
        return `Q${quarter} ${year}`;
    } else {
        return year ? `${year}` : 'N/A';
    }
}

const AnalysisInfo: React.FC<AnalysisInfoProps> = ({ data }) => {
    const analysisData = data.data || data.analysis;
    const period = analysisData?.period || {
        year: analysisData?.year,
        month: analysisData?.month,
        quarter: analysisData?.quarter,
    };
    const isValidTemporalResolution = analysisData?.temporalResolution && period?.year;
    let comparisonPeriod = [];
    if (analysisData?.comparisonPeriod && analysisData?.comparisonPeriod?.year) {
        for (let ci=0; ci < analysisData?.comparisonPeriod.year.length; ci++) {
            const year = analysisData?.comparisonPeriod.year[ci];
            const month = analysisData?.comparisonPeriod.month ? analysisData?.comparisonPeriod.month[ci] : null;
            const quarter = analysisData?.comparisonPeriod.quarter ? analysisData?.comparisonPeriod.quarter[ci] : null;
            comparisonPeriod.push(getReferencePeriod({ year, month, quarter }));
        }
    }
    return (
        <Box p={4}>
            <VStack align="start" spacing={1}>
                <Box>
                    <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                        Analysis Type: {analysisData?.analysisType}
                    </Text>
                </Box>

                { analysisData?.analysisType !== 'Baseline' && (
                <Box>
                    <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                        Variable: {analysisData?.variable}
                    </Text>
                </Box>
                )}
                
                { analysisData?.analysisType === 'Baseline' && analysisData?.baselineStartDate && analysisData?.baselineEndDate && (
                    <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                            Start Date: {analysisData?.baselineStartDate}
                        </Text>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                            End Date: {analysisData?.baselineEndDate}
                        </Text>
                    </VStack>
                )}

                { analysisData?.analysisType !== 'Baseline' && analysisData?.temporalResolution && (
                    <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                            Temporal Resolution: {isValidTemporalResolution ? analysisData?.temporalResolution : 'N/A'}
                        </Text>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                            Period: {getReferencePeriod(period)}
                        </Text>
                    </VStack>
                )}

                { analysisData?.analysisType !== 'Baseline' && comparisonPeriod && (
                    <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                            Comparison Period: {comparisonPeriod.length > 0 ? comparisonPeriod.join(', ') : 'N/A'}
                        </Text>
                    </VStack>                
                )}

                <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" fontSize="xs" color="gray.600">
                        Landscape: {analysisData?.landscape}
                    </Text>
                    <Text fontWeight="semibold" fontSize="xs" color="gray.600" mb={1}>
                        Locations:
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                        {analysisData?.locations.map((location: any, index: number) => (
                        <Text key={index} fontSize="xs" color="gray.600">
                            • {location?.communityName}
                        </Text>
                        ))}
                    </Text>
                </VStack>
                
            </VStack>
        </Box>
    );
};

export default AnalysisInfo;
