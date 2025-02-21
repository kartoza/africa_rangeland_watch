import React from 'react';
import { Box, Center, Spinner, Table, Text } from "@chakra-ui/react";
import { Analysis } from '../../store/analysisSlice';
import { Bar, Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { FeatureCollection } from "geojson";
import 'chartjs-adapter-date-fns';

Chart.register(CategoryScale);

interface Props {
  analysisResults: any[];
}

// helper function for extracting analysis data for charts
const getAnalysisJsonData = (analysis: any, index: number) => {
  const analysisData = analysis.analysis_results ?? analysis ?? [];

  if (!analysisData?.results || analysisData.results.length === 0) {
      return null; // Return null if no data is available
  }

  return analysisData.results[index] ?? null;
};


export function BarChart({ analysisResults }: Props) {
  if (!analysisResults || analysisResults.length === 0) {
    return;
  }

  let labels: number[] = [];
  let datasets: any[] = [];

  analysisResults.forEach((analysis, index) => {
    const analysisData = analysis.analysis_results ?? analysis ?? [];

    const jsonData = getAnalysisJsonData(analysis, 0);

    if (!jsonData || !jsonData.features || jsonData.features.length === 0) return;

    const name = jsonData.features[0]?.properties?.Name;
    const data = jsonData.features.map((feature: any) => feature?.properties?.[analysisData?.data?.variable] || 0);

    labels = jsonData.features.map((feature: any) => feature?.properties?.year);
    
    datasets.push({
      label: `${name} (Result ${index + 1})`,
      data,
      backgroundColor: index % 2 === 0 ? "blue" : "red"
    });
  });

  const chartData = { labels, datasets };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    }
  };

  return <Bar options={options} data={chartData} />;
}

export function LineChart({ analysisResults }: Props) {
  if (!analysisResults || analysisResults.length === 0) {
    return;
  }

  let labels: number[] = [];
  let datasets: any[] = [];


  analysisResults.forEach((analysis, index) => {
    const analysisData = analysis.analysis_results ?? analysis ?? [];

    const jsonData = getAnalysisJsonData(analysis, 1);

    if (!jsonData || !jsonData.features || jsonData.features.length === 0) return;

    const name = jsonData.features[0]?.properties?.Name;
    const data = jsonData.features.map((feature: any) => feature?.properties?.[analysisData?.data.variable] || 0);

    // Add labels only once, preserving unique dates
    labels = Array.from(new Set([...labels, ...jsonData.features.map((feature: any) => feature?.properties?.date)]));

    
    datasets.push({
      label: `${name} (Result ${index + 1})`,
      data,
      borderColor: index % 2 === 0 ? "blue" : "red",
      fill: false,
    });
  });

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'timeseries',
        title: {
          display: false
        },
        ticks: {
          callback: function (value: any, index: number, ticks: any) {
            const currentLabel = new Date(value).getFullYear();
            const previousLabel = index > 0 ? new Date(ticks[index - 1].value).getFullYear() : null;
            return currentLabel !== previousLabel ? currentLabel : '';
          },
        }
      },
      y: {
        title: {
          display: false
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const chartData = { labels, datasets };
  return <Line options={options} data={chartData} />;
}


function SpatialBarChart({ analysisResults }: { analysisResults: any[] }) {
  if (!analysisResults || analysisResults.length === 0) {
    return null;
  }

  let mergedFeatures: any[] = [];
  analysisResults.forEach((analysis) => {
    const results = analysis?.analysis_results?.results ?? analysis?.results;
    if (results?.features) {
      mergedFeatures = [...mergedFeatures, ...results.features];
    }
  });

  if (mergedFeatures.length === 0) {
    return null;
  }

  const labels = mergedFeatures.map((feature) => feature?.properties?.["Name"] || "Unknown");

  // Aggregate data for the bar chart
  const chartData: any = {
    labels,
    datasets: [
      {
        label: "% difference to reference area",
        data: mergedFeatures.map((feature) => feature?.properties?.["mean"] || 0),
        backgroundColor: "blue",
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Spatial Analysis Results",
      },
      subtitle: {
        display: true,
        text: "Feature (labeled by Name)",
        position: "bottom",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Mean",
        },
      },
    },
  };

  return <Box flex="0 0 auto"><Bar options={options} data={chartData} /></Box>;
}



export function RenderBaseline({ analysisResults }: Props) {
  return (
    <Box>
      {analysisResults.map((analysis, index) => {
        const results = analysis?.analysis_results?.results ?? analysis?.results;
        if (!results?.features) {
          return;
        }

        const keys = Object.keys(results?.columns || {});
        return (
          <Box key={index} marginBottom="20px" overflow="auto" maxW="100%">
            <Table className='BaselineAnalysisResultTable' cellPadding={8}>
              <thead>
                <tr>
                  <th>Name</th>
                  {keys.map((column: string) => <th key={column}>{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {results?.features.map((feature: any, idx: number) => {
                  const properties = feature?.properties || {};
                  return (
                    <tr key={idx}>
                      <td>{properties.Name || 'N/A'}</td>
                      {keys.map((column: string) => (
                        <td key={column}>{properties[column] || 'N/A'}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Box>
        );
      })}
    </Box>
  );
}


export function RenderTemporal({ analysisResults }: Props) {
  if (!analysisResults || analysisResults.length === 0) {
    return <Text color="black">No temporal analysis data available.</Text>;
  }

  const hasBarData = analysisResults.some((analysis) => 
    (analysis.analysis_results?.results?.[0]?.features?.length ?? 0) > 0 ||
    (analysis.results?.[0]?.features?.length ?? 0) > 0
  );
  
  const hasLineData = analysisResults.some((analysis) => 
    (analysis.analysis_results?.results?.[1]?.features?.length ?? 0) > 0 ||
    (analysis.results?.[1]?.features?.length ?? 0) > 0
  );
  

  const charts = [];

  if(hasLineData && hasBarData){
    charts.push(
      <Box flex="0 0 auto" overflow="auto" maxW="100%">
        <LineChart analysisResults={analysisResults} />
      </Box>
    );
    charts.push(
      <Box flex="0 0 auto">
           <BarChart key="bar" analysisResults={analysisResults} />
      </Box>
    );
  }else if (hasLineData) {
    charts.push(
      <LineChart analysisResults={analysisResults} />
    );
  }else if (hasBarData) {
    charts.push(
      <Box flex="0 0 auto">
        <BarChart key="bar" analysisResults={analysisResults} />
      </Box>
    );
  }

  if (charts.length === 0) {
    return <Text color="black" marginTop={2}>No chart data available.</Text>;
  }

  return (
    <Box display="flex" flexDirection="column" gap="4px" overflow="auto">
      {charts}
    </Box>
  );
}



export function RenderSpatial({ analysisResults }: Props) {
  return (
    <Box>
      {analysisResults.map((analysis, index) => (
        <Box key={index} marginBottom="20px">
          <Text color='black' marginTop={2}>
            Relative % difference in {analysis?.data?.variable} between your reference area and selected camp/s:
          </Text>
          {/* Pass analysis as an array */}
          <SpatialBarChart analysisResults={[analysis]} />
        </Box>
      ))}
    </Box>
  );
}



export function RenderResult({ analysisResults }: Props) {
  if (!analysisResults || analysisResults.length === 0) {
    return <Text color="black" fontSize="m">No analysis results available.</Text>;
  }

  const analysisType = (analysisResults[0]?.analysis_results?.data?.analysisType)? analysisResults[0]?.analysis_results?.data?.analysisType: analysisResults[0]?.data?.analysisType;

  

  switch (analysisType) {
    case "Baseline":
      return <RenderBaseline analysisResults={analysisResults} />;
    case "Temporal":
      return <RenderTemporal analysisResults={analysisResults} />;
    case "Spatial":
      return <RenderSpatial analysisResults={analysisResults} />;
    default:
      return <Text color="black" fontSize="m">Unknown analysis type.</Text>;
  }
}

