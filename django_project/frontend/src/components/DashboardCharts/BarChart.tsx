import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type DataObject = {
  data: {
    latitude: number;
    community: string;
    landscape: string;
    longitude: number;
    analysisType: string;
  };
  results: {
    id: string;
    type: string;
    columns: { [key: string]: string };
    version: number;
    features: {
      id: string;
      type: string;
      geometry?: any[];
      properties: { [key: string]: any };
    }[];
  };
};

type BarChartProps = {
  inputData: DataObject;
};

const BarChart: React.FC<BarChartProps> = ({ inputData }) => {
  const features = inputData.results.features;

  // Extract property keys for bar chart labels
  const propertyKeys = Object.keys(features[0]?.properties || {});

  // Prepare chart data
  const chartData = {
    labels: propertyKeys.filter((key) => typeof features[0].properties[key] === "number"),
    datasets: features.map((feature, index) => ({
      label: feature.properties.Name || `Feature ${index + 1}`,
      data: propertyKeys
        .filter((key) => typeof feature.properties[key] === "number")
        .map((key) => feature.properties[key]),
      backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255
      )}, ${Math.floor(Math.random() * 255)}, 0.6)`,
      borderColor: "rgba(0, 0, 0, 0.8)",
      borderWidth: 1,
    })),
  };

  return (
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Properties",
              },
            },
            y: {
              title: {
                display: true,
                text: "Values",
              },
              beginAtZero: true,
            },
          },
        }}
      />
  );
};

export default BarChart;
