import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

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
      geometry?: any;
      properties: { [key: string]: any };
    }[];
  };
};

type PieChartProps = {
  inputData: DataObject;
};

const PieChart: React.FC<PieChartProps> = ({ inputData }) => {
  const features = inputData.results.features;

  // Combine the numeric properties from all features for the pie chart
  const numericProperties = features.reduce<{ [key: string]: number }>((acc, feature) => {
    Object.entries(feature.properties).forEach(([key, value]) => {
      if (typeof value === "number") {
        acc[key] = (acc[key] || 0) + value;
      }
    });
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(numericProperties),
    datasets: [
      {
        data: Object.values(numericProperties),
        backgroundColor: Object.keys(numericProperties).map(
          () =>
            `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
              Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, 0.6)`
        ),
        borderColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 1,
      },
    ],
  };

  return (
      <Pie
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
        }}
      />
  );
};

export default PieChart;
