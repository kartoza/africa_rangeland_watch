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
  analysis: Analysis;
}

export function BarChart({ analysis }: Props) {
  const jsonData = analysis.results?.[0];

  if (!jsonData || !jsonData.features || jsonData.features.length === 0) {
    return;
  }

  const name1 = jsonData.features?.[0]?.properties?.Name;
  const name2 = jsonData.features?.[1]?.properties?.Name || null;

  const labels: number[] = jsonData.features?.length
    ? [jsonData.features?.[0]?.properties?.year, jsonData.features?.[jsonData.features.length - 1]?.properties?.year]
    : [];

  const dataBar1 = jsonData.features
    .filter((feature: any) => feature?.properties?.Name === name1)
    .map((feature: any) => feature?.properties?.[analysis.data.variable] || 0);

  let chartData: any = {
    labels,
    datasets: [
      {
        label: name1,
        data: dataBar1,
        backgroundColor: "blue"
      }
    ],
  };

  if (name2 !== null && name1 !== name2) {
    const dataBar2 = jsonData.features
      .filter((feature: any) => feature?.properties?.Name === name2)
      .map((feature: any) => feature?.properties?.[analysis.data.variable] || 0);

    chartData.datasets.push({
      label: name2,
      data: dataBar2,
      backgroundColor: "red"
    });
  }

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

export function LineChart({ analysis }: Props) {
  const jsonData = analysis.results?.[1];

  if (!jsonData || !jsonData.features || jsonData.features.length === 0) {
    return;
  }

  const name1 = jsonData.features?.[0]?.properties?.Name;
  const name2 = jsonData.features?.[1]?.properties?.Name || null;

  const labels: number[] = jsonData.features
    .filter((feature: any) => feature?.properties?.Name === name1)
    .map((feature: any) => feature?.properties?.date || '');

  const data1 = jsonData.features
    .filter((feature: any) => feature?.properties?.Name === name1)
    .map((feature: any) => feature?.properties?.[analysis.data.variable] || 0);

  let chartData: any = {
    labels,
    datasets: [
      {
        label: name1,
        data: data1,
        backgroundColor: "blue"
      }
    ],
  };

  if (name1 !== name2) {
    const data2 = jsonData.features
      .filter((feature: any) => feature?.properties?.Name === name2)
      .map((feature: any) => feature?.properties?.[analysis.data.variable] || 0);

    chartData.datasets.push({
      label: name2,
      data: data2,
      backgroundColor: "red"
    });
  }

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

  return <Line options={options} data={chartData} />;
}

function SpatialBarChart({ analysis }: Props) {
  const featureCollection: FeatureCollection | undefined = analysis.results;

  if (!featureCollection || !featureCollection.features || featureCollection.features.length === 0) {
    return;
  }

  const labels: string[] = featureCollection.features.map((feature) => feature?.properties?.['Name'] || 'Unknown');
  let chartData: any = {
    labels,
    datasets: [
      {
        label: '% difference to reference area',
        data: featureCollection.features.map((feature) => feature?.properties?.["mean"] || 0),
        backgroundColor: "blue"
      }
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
      },
      subtitle: {
        display: true,
        text: 'Feature (labeled by',
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'mean'
        }
      },
    }
  };

  return <Bar options={options} data={chartData} />;
}

export function RenderBaseline({ analysis }: Props) {
  if (!analysis.results?.features) {
    return;
  }

  const keys = Object.keys(analysis.results?.columns || {});
  return (
    <Box overflow="auto" maxW="100%">
      <Table className='BaselineAnalysisResultTable' cellPadding={8}>
        <thead>
          <tr>
            <th>Name</th>
            {keys.map((column: string) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {analysis.results.features.map((feature: any, index: number) => {
            const properties = feature?.properties || {};
            return (
              <tr key={index}>
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
}

export function RenderTemporal({ analysis }: Props) {
  const jsonDataLine = analysis.results?.[1];
  const jsonDataBar = analysis.results?.[0];

  const hasLineData = jsonDataLine?.features?.length > 0;
  const hasBarData = jsonDataBar?.features?.length > 0;

  const charts = [];

  if(hasLineData && hasBarData){
    charts.push(
      <Box flex="0 0 auto">
        <LineChart analysis={analysis} />
      </Box>
    );
    charts.push(
      <Box flex="0 0 auto">
           <BarChart key="bar" analysis={analysis} />
      </Box>
    );
  }else if (hasLineData) {
    charts.push(
      <LineChart analysis={analysis} />
    );
  }else if (hasBarData) {
    charts.push(
      <BarChart key="bar" analysis={analysis} />
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



export function RenderSpatial({ analysis }: Props) {
  return (
    <Box>
      <Text color='black' marginTop={2}>Relative % difference in {analysis.data.variable} between your reference area and selected camp/s:</Text>
      <SpatialBarChart analysis={analysis} />
    </Box>
  );
}

export function RenderResult({ analysis }: Props) {
  switch (analysis.data.analysisType) {
    case "Baseline":
      return <RenderBaseline analysis={analysis} />;
    case "Temporal":
      return <RenderTemporal analysis={analysis} />;
    case "Spatial":
      return <RenderSpatial analysis={analysis} />;
    default:
      return <Text>No analysis type selected.</Text>;
  }
}
