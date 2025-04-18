import React from 'react';
import { Box, Center, Spinner, Table, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { Analysis } from "../../../store/analysisSlice";
import { Bar, Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import {FeatureCollection} from "geojson";
import 'chartjs-adapter-date-fns';

import './style.css';

Chart.register(CategoryScale);

interface Props {
  analysis: Analysis;
}

const COLORS = [
  "#FF0000", // Red
  "#0000FF", // Blue
  "#008000", // Green
  "#FFA500", // Orange
  "#800080", // Purple
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#FFFF00", // Yellow
  "#00FF00", // Lime
  "#008080"  // Teal
];

const splitAndTruncateString = (str: string, maxLength: number) => {
  const words = str.split(' ');
  const maxLines = 2;

  if (words.length <= maxLines) {
    return words;
  }

  // Take the first N-1 words and add "..." on the last line
  const truncated = words.slice(0, maxLines - 1);
  const lastLine = words.slice(maxLines - 1).join(' ');
  truncated.push(lastLine.length > maxLength ? lastLine.substring(0, maxLength) + '…' : lastLine + '…');

  return truncated;
}


export function StatisticTable({analysis}: Props) {
  const statistics = analysis.results[0].statistics;
  const variable = analysis.data.variable;

  const renderRows = () => {
    const rows: any[] = [];
    Object.keys(statistics).forEach(year => {
      Object.keys(statistics[year]).forEach(area => {
        const data = statistics[year][area][variable];
        rows.push(
          <tr key={`${year}-${area}`}>
            <td>{year}</td>
            <td>{area}</td>
            <td>{data.min !== null ? data.min.toFixed(3) : 'N/A'}</td>
            <td>{data.max !== null ? data.max.toFixed(3) : 'N/A'}</td>
            <td>{data.mean !== null ? data.mean.toFixed(3) : 'N/A'}</td>
          </tr>
        );
      });
    });
    return rows;
  };

  return (
    <Box>
      <table id="Temporal-Statistics-Table" border={1}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Area</th>
            <th>Min</th>
            <th>Max</th>
            <th>Avg</th>
          </tr>
        </thead>
        <tbody>
          {renderRows()}
        </tbody>
      </table>
    </Box>
  );
}

function formatMonthYear(month: number, year: number) {
  const date = new Date(year, month - 1); // Month is zero-based in JS Date
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}


export function BarChart({ analysis }: Props) {
  // Extracting data for the chart
  const jsonData = analysis.results[0];

  if (jsonData.features.length == 0) {
    return
  }

  let labels: string[] = [];
  if (analysis.data.temporalResolution === 'Annual') {
    labels = jsonData.features.map((feature:any) => feature.properties.year)
  } else {
    labels = jsonData.features.map((feature:any) => formatMonthYear(feature.properties.month, feature.properties.year));
  }
  labels = labels.filter((item, index) => labels.indexOf(item) === index)

  let datasets: { [key: string]: any } = {}
  for (let i = 0; i < jsonData.features.length; i++) {
    const key: string = jsonData.features[i].properties.Name;
    if (datasets[key as string]) {
      continue;
    }
    const rawData = jsonData.features
    .filter((feature:any) => feature.properties.Name === jsonData.features[i].properties.Name);
    let data: number[] = new Array(labels.length).fill(null);
    for (let j = 0; j < rawData.length; j++) {
      let label = ''
      if (analysis.data.temporalResolution === 'Annual') {
        label = rawData[j].properties.year
      } else {
        label = formatMonthYear(rawData[j].properties.month, rawData[j].properties.year)
      }

      let labelIdx = labels.indexOf(label)
      if (labelIdx > -1) {
        data[labelIdx] = rawData[j].properties[analysis.data.variable]
      }
    }
    
    datasets[key] = {
      label: key,
      data: data,
      backgroundColor: COLORS[i % COLORS.length],
      borderColor: "#0000FF",
      errorBars: {
        color: 'black',
        width: 1
      }
    };
  }

  let chartData:any = {
    labels,
    datasets: Object.values(datasets),
  };

  const options:any = {
    responsive: true,
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

  return <Box maxWidth={400} overflowX={"auto"}>
    <Bar options={options} data={chartData} />
  </Box>
}

export function LineChart({ analysis }: Props) {
  // Extracting data for the chart

  const jsonData = analysis.results[1];
  if (jsonData.features.length == 0) {
    return
  }

  let labels: number[] = jsonData.features
    .map((feature:any) => feature.properties.date);
  labels = labels.filter((item, index) => labels.indexOf(item) === index)
  let datasets: { [key: string]: any } = {}
  for (let i = 0; i < jsonData.features.length; i++) {
    const key: string = jsonData.features[i].properties.Name;
    if (datasets[key as string]) {
      continue;
    }
    const rawData = jsonData.features
    .filter((feature:any) => feature.properties.Name === jsonData.features[i].properties.Name);
    let data: number[] = new Array(labels.length).fill(null);
    for (let j = 0; j < rawData.length; j++) {
      let label = rawData[j].properties.date
      let labelIdx = labels.indexOf(label)
      if (labelIdx > -1) {
        data[labelIdx] = rawData[j].properties[analysis.data.variable]
      }
    }
    
    datasets[key] = {
      label: key,
      data: data,
      backgroundColor: COLORS[i % COLORS.length]
    };
  }

  let chartData:any = {
    labels,
    datasets: Object.values(datasets)
  }

  const options:any = {
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

  return <Box maxWidth={400} overflowX={"auto"}>
    <Line options={options} data={chartData}/>
  </Box>
}

function SpatialBarChart({ analysis }: Props) {
  const featureCollection: FeatureCollection = analysis.results;

  const labels: string[] = featureCollection.features.map((feature) => feature.properties['Name'])
  let chartData:any = {
    labels,
    datasets: [
      {
        label: '% difference to reference area',
        data: featureCollection.features.map((feature) => feature.properties["mean"]),
        backgroundColor: "blue"
      }
    ],
  };

  const options:any = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
      },
      subtitle: {
        display: true,
        text: 'Feature (labeled by Name)',
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
      x: {
        ticks: {
          callback: function(value: any, index: number, ticks: any[]) {
            const label = this.getLabelForValue(value);
            return splitAndTruncateString(label, 10);
          }
        }
      }
    }
  };

  return <Box maxWidth={400} overflowX={"auto"}>
    <Bar options={options} data={chartData} />
  </Box>
}


export function RenderBaseline({ analysis }: Props) {
  const keys = Object.keys(analysis.results.columns)
  return <Box maxWidth={400} overflowX={"auto"}>
    <Table className='BaselineAnalysisResultTable' cellPadding={8}>
      <thead>
      <tr>
        <th>Name</th>
        {
          keys.map(
            (column: string) => <th key={column}>{column}</th>
          )
        }
      </tr>
      </thead>
      <tbody>
      {
        analysis.results.features.map((feature: any, index: any) => {
          const properties = feature.properties;
          return <tr key={index}>
            <td>{properties.Name}</td>
            {
              keys.map(
                (column: string) => <td key={column}>
                  {properties[column]}
                </td>
              )
            }
          </tr>
        })
      }
      </tbody>
    </Table>
  </Box>
}

export function RenderTemporal({ analysis }: Props) {
  return <Box maxWidth={400} overflowX={"auto"}>
    <BarChart analysis={analysis}></BarChart>
    <LineChart analysis={analysis}></LineChart>
    <StatisticTable analysis={analysis}/>
  </Box>
}

export function RenderSpatial({ analysis }: Props) {
  return <Box maxWidth={400} overflowX={"auto"}>
    <Text color='black' marginTop={2}>Relative % difference in {analysis.data.variable} between your reference area and selected camp/s:</Text>
    <SpatialBarChart analysis={analysis} />
  </Box>
}


export function RenderResult({ analysis }: Props) {
  switch (analysis.data.analysisType) {
    case "Baseline":
      return <RenderBaseline analysis={analysis}/>
    case "Temporal":
      return <RenderTemporal analysis={analysis}/>
    case "Spatial":
      return <RenderSpatial analysis={analysis}/>
    default:
      return null
  }
}

/** AnalysisResult component of map. */
export default function AnalysisResult() {
  const {
    loading,
    error,
    analysis
  } = useSelector((state: RootState) => state.analysis);
  if (!loading && !error && !analysis) {
    return null
  }
  return (
    <Box backgroundColor='white'
         borderRadius={8}
         boxShadow="0px 0px 5px 0px #00000030"
         pointerEvents='auto'
         p={4}>
      <Text fontSize="1.5rem" fontWeight={600} color='green.600'>
        Statistics
      </Text>
      {
        loading ?
          <Box>
            <Center p={16}>
              <Spinner size="xl"/>
            </Center>
          </Box> : error ? <Box>
            <Center p={16} color={'red'}>
              {error}
            </Center>
          </Box> : <RenderResult analysis={analysis}/>
      }
    </Box>
  )
}