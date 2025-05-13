import React from 'react';
import { Box, Table, Text } from "@chakra-ui/react";
import { Bar, Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import 'chartjs-adapter-date-fns';
import { getTrendLineData, formatMonthYear } from '../../utils/chartUtils';

Chart.register(CategoryScale);

interface Props {
  analysisResults: any[];
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

  let labels: string[] = [];
  let datasets: { [key: string]: any } = {};
  let itemIdx = 0;
  const analysisData = analysisResults[0].analysis_results.data;

  analysisResults.forEach((analysis, index) => {
    const jsonData = getAnalysisJsonData(analysis, 0);

    if (!jsonData || !jsonData.features || jsonData.features.length === 0) return;

    if (labels.length === 0) {
      if (analysisData.temporalResolution === 'Annual') {
        labels = jsonData.features.map((feature:any) => feature.properties.year)
      } else {
        labels = jsonData.features.map((feature:any) => formatMonthYear(feature.properties.month, feature.properties.year));
      }
      labels = labels.filter((item, index) => labels.indexOf(item) === index)
    }

    for (let i = 0; i < jsonData.features.length; i++) {
        const key: string = `${jsonData.features[i].properties.Name} (Result ${index + 1})`;
        if (datasets[key as string]) {
          continue;
        }
        const rawData = jsonData.features
        .filter((feature:any) => feature.properties.Name === jsonData.features[i].properties.Name);
        let data: number[] = new Array(labels.length).fill(null);
        for (let j = 0; j < rawData.length; j++) {
          let label = ''
          if (analysisData.temporalResolution === 'Annual') {
            label = rawData[j].properties.year
          } else {
            label = formatMonthYear(rawData[j].properties.month, rawData[j].properties.year)
          }
    
          let labelIdx = labels.indexOf(label)
          if (labelIdx > -1) {
            data[labelIdx] = rawData[j].properties[analysisData.variable]
          }
        }
        
        datasets[key] = {
          label: key,
          data: data,
          backgroundColor: COLORS[itemIdx % COLORS.length],
          borderColor: "#0000FF",
          errorBars: {
            color: 'black',
            width: 1
          }
        };
        itemIdx++;
      }
  });

  const chartData = { labels, datasets: Object.values(datasets) };

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

  let datasets: { [key: string]: any } = {};
  let labels: number[] = [];
  let itemIdx = 0;

  const analysisData = analysisResults[0].analysis_results.data;
  analysisResults.forEach((analysis, index) => {
    const jsonData = getAnalysisJsonData(analysis, 1);
    if (!jsonData || jsonData.features.length == 0) {
      return;
    }

    if (labels.length === 0) {
      labels = Array.from(new Set(jsonData.features
        .map((feature:any) => feature.properties.date)));
      labels = labels.filter((item, index) => labels.indexOf(item) === index)
    }
    
    for (let i = 0; i < jsonData.features.length; i++) {
      const key: string = `${jsonData.features[i].properties.Name} (Result ${index + 1})`;
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
          data[labelIdx] = rawData[j].properties[analysisData.variable]
        }
      }
      
      datasets[key] = {
        label: key,
        data: data,
        borderColor: COLORS[itemIdx % COLORS.length],
        fill: false,
      };

      datasets[`trends_${itemIdx}`] = {
        label: '',
        data: getTrendLineData(data),
        borderColor: COLORS[itemIdx % COLORS.length],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
      }
      itemIdx++;
    }
  })

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
        labels: {
          filter: function (item: any, chartData: any) {
            return item.text !== '';
          }
        }
      },
    },
  };

  const chartData = { labels, datasets: Object.values(datasets) };

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

