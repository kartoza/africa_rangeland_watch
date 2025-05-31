import React, { useRef } from 'react';
import { Box, Center, Spinner, Table, Text, Flex, IconButton } from "@chakra-ui/react";
import { FiDownload } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { Analysis } from "../../../store/analysisSlice";
import { Bar, Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {FeatureCollection} from "geojson";
import 'chartjs-adapter-date-fns';
import { getTrendLineData, formatMonthYear } from "../../../utils/chartUtils";

import './style.css';

Chart.register(CategoryScale);

interface Props {
  analysis: Analysis;
  decimalPlaces?: number;
}

const DEFAULT_DECIMAL_PLACES = 3;
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

// Export Settings
const EXPORT_SCALE = 5.0; // scale to 500% of original size
const EXPORT_BASELINE_RATIO = 1.0; // no reduction
const EXPORT_CHART_RATIO = 0.85; // reduce to 85% of original size
const EXPORT_Y_POSITION = 10; // y position of the chart in mm

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


export function StatisticTable({analysis, decimalPlaces}: Props) {
  const statistics = analysis.results[0].statistics;
  const variable = analysis.data.variable;
  const _decimalPlaces = decimalPlaces || DEFAULT_DECIMAL_PLACES;

  const renderRows = () => {
    const rows: any[] = [];
    Object.keys(statistics).forEach(year => {
      Object.keys(statistics[year]).forEach(area => {
        const data = statistics[year][area][variable];
        rows.push(
          <tr key={`${year}-${area}`}>
            <td>{year}</td>
            <td>{area}</td>
            <td>{data.min !== null ? data.min.toFixed(_decimalPlaces) : 'N/A'}</td>
            <td>{data.max !== null ? data.max.toFixed(_decimalPlaces) : 'N/A'}</td>
            <td>{data.mean !== null ? data.mean.toFixed(_decimalPlaces) : 'N/A'}</td>
          </tr>
        );
      });
    });
    return rows;
  };

  return (
    <Box>
      <table id="Temporal-Statistics-Table" border={1} cellPadding={8}>
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

  return <Box height={"100%"}>
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
      backgroundColor: COLORS[i % COLORS.length],
      fill: false,
    };

    datasets[`trends_${i}`] = {
      label: '',
      data: getTrendLineData(data),
      borderColor: i % 2 === 0 ? "blue" : "red",
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
    }
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
        labels: {
          filter: function (item: any, chartData: any) {
            return item.text !== '';
          }
        }
      },
    },
  };

  return <Box height={"100%"}>
    <Line options={options} data={chartData}/>
  </Box>
}

export function SpatialBarChart({ analysis }: Props) {
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

  return <Box>
    <Bar options={options} data={chartData} />
  </Box>
}

export function BaselineTable({ analysis, decimalPlaces }: Props) {
  const _decimalPlaces = decimalPlaces || DEFAULT_DECIMAL_PLACES;
  const excludeColumns: string[] = [
    'system:index',
    'Project'
  ];
  let keys: string[] = ['Name'];
  const _keys = Object.keys(analysis.results.columns);
  for (let i = 0; i < _keys.length; i++) {
    const key = _keys[i];
    if (keys.includes(key)) {
      continue;
    }
    if (excludeColumns.includes(key)) {
      continue;
    }
    keys.push(key);
  }

  return <Table className='BaselineAnalysisResultTable' cellPadding={8}>
      <thead>
      <tr>
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
            {
              keys.map(
                (column: string) => <td key={column}>
                  {typeof properties[column] === 'number' ? properties[column].toFixed(_decimalPlaces) : properties[column]}
                </td>
              )
            }
          </tr>
        })
      }
      </tbody>
    </Table>
}

export function RenderBaseline({ analysis, decimalPlaces }: Props) {
  return <Box id="BaselineTableContainer" maxWidth={400} overflowX={"auto"}>
    <BaselineTable analysis={analysis} decimalPlaces={decimalPlaces}/>
  </Box>
}

export function RenderTemporal({ analysis, decimalPlaces }: Props) {
  return <Box maxWidth={400} overflowX={"auto"}>
    <BarChart analysis={analysis}></BarChart>
    <LineChart analysis={analysis}></LineChart>
    <StatisticTable analysis={analysis} decimalPlaces={decimalPlaces}/>
  </Box>
}

export function RenderSpatial({ analysis }: Props) {
  return <Box maxWidth={400} overflowX={"auto"}>
    <Text color='black' marginTop={2}>Relative % difference in {analysis.data.variable} between your reference area and selected camp/s:</Text>
    <SpatialBarChart analysis={analysis} />
  </Box>
}


export function RenderResult({ analysis, decimalPlaces }: Props) {
  switch (analysis.data.analysisType) {
    case "Baseline":
      return <RenderBaseline analysis={analysis} decimalPlaces={decimalPlaces}/>
    case "Temporal":
      return <RenderTemporal analysis={analysis}/>
    case "Spatial":
      return <RenderSpatial analysis={analysis} decimalPlaces={decimalPlaces}/>
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
  const { mapConfig } = useSelector((state: RootState) => state.mapConfig);
  const containerRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!containerRef.current) return;

    const clone = containerRef.current.cloneNode(true) as HTMLDivElement;

    // remove the download button
    const iconsElement = clone.querySelector("#download-button") as HTMLDivElement;
    if (iconsElement) iconsElement.style.display = "none";

    // remove box shadow
    clone.style.boxShadow = "none";

    // if Baseline, we need to expand the table
    if (analysis.data.analysisType === "Baseline") {
      const table = clone.querySelector("#BaselineTableContainer") as HTMLDivElement;
      if (table) {
        table.style.maxWidth = "none";
        table.style.overflowX = "visible";
      }
    }

    // Copy all canvas drawings
    const originalCanvases = containerRef.current.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');

    originalCanvases.forEach((origCanvas, i) => {
        const clonedCanvas = clonedCanvases[i];
        const ctx = clonedCanvas.getContext('2d');
        ctx.drawImage(origCanvas, 0, 0);
    });

    // Set styles to avoid showing the clone
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    // convert the clone to canvas
    const canvas = await html2canvas(clone, {
      backgroundColor: "white",
      scale: EXPORT_SCALE,
    });
    document.body.removeChild(clone); 
    const imgData = canvas.toDataURL("image/jpeg");
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Create a new jsPDF instance
    const pdfOrientation = analysis.data.analysisType === "Baseline" ? "l" : "p";
    const pdf = new jsPDF(pdfOrientation, "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions while preserving aspect ratio
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const reducedRatio = ratio * (analysis.data.analysisType === "Baseline" ? EXPORT_BASELINE_RATIO : EXPORT_CHART_RATIO);
    const finalImgWidth = imgWidth * reducedRatio;
    const finalImgHeight = imgHeight * reducedRatio;
    // center the image
    const x = (pageWidth - finalImgWidth) / 2;
    const y = EXPORT_Y_POSITION;

    // Add the chart image
    pdf.addImage(imgData, "JPEG", x, y, finalImgWidth, finalImgHeight);
  
    let fileName = '';
    if (analysis.data.analysisType === "Baseline") {
      fileName = 'Baseline Analysis';
    } else if (analysis.data.analysisType === "Temporal") {
      fileName = `${analysis.data.temporalResolution} Temporal Analysis on ${analysis.data.variable}`;
    } else if (analysis.data.analysisType === "Spatial") {
      fileName = `Spatial Analysis on ${analysis.data.variable}`;
    }

    pdf.save(`${fileName}.pdf`);
  }

  if (!loading && !error && !analysis) {
    return null
  }

  let header = null;
  if (analysis?.data.analysisType === "Baseline") {
    header = 'Baseline Analysis'
    if (analysis?.data.baselineStartDate && analysis.data.baselineEndDate) {
      let startDate = new Date(analysis.data.baselineStartDate);
      let endDate = new Date(analysis.data.baselineEndDate);
      const currentLocale = navigator.language || 'en-US';
      header += ` (${startDate.toLocaleDateString(currentLocale, { day: 'numeric', month: 'long', year: 'numeric' })} - ${endDate.toLocaleDateString(currentLocale, { day: 'numeric', month: 'long', year: 'numeric' })})`
    }
  } else if (analysis?.data.analysisType === "Temporal") {
    header = `${analysis.data.temporalResolution} Temporal Analysis on ${analysis.data.variable}`
  } else if (analysis?.data.analysisType === "Spatial") {
    header = `Spatial Analysis on ${analysis.data.variable}`
    if (analysis.data.spatialStartYear && analysis.data.spatialEndYear) {
      header += ` (${analysis.data.spatialStartYear} - ${analysis.data.spatialEndYear})`
    }
  }

  return (
    <Box ref={containerRef} backgroundColor='white'
         borderRadius={8}
         boxShadow="0px 0px 5px 0px #00000030"
         pointerEvents='auto'
         p={4}>
      <Flex width="100%" align="center" justify="space-between">
        <Text fontSize="1.5rem" fontWeight={600} color='green.600'>
          Statistics
        </Text>
        <IconButton
          id="download-button"
          icon={<FiDownload />} 
          onClick={downloadPDF} 
          colorScheme="teal" 
          aria-label="Download"
          size="sm"
          disabled={loading || error !== null}
        />
      </Flex>
      {header && (
        <Box id="analysis-header" marginTop={2} marginBottom={2}>
          <Text fontSize="1.0rem" fontWeight={600} color='green.600'>
            {header}
          </Text>
        </Box>
      )}
      
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
          </Box> : <RenderResult analysis={analysis} decimalPlaces={mapConfig.number_of_decimal_places}/>
      }
    </Box>
  )
}