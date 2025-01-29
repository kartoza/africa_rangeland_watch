import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DataObject {
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
    features: Array<{
      id: string;
      type: string;
      geometry: any;
      properties: { [key: string]: any };
    }>;
  };
}

interface Props {
  inputData: DataObject;
}

const LineChart: React.FC<Props> = ({ inputData }) => {
  const { features, columns } = inputData.results;

  // Extract labels (feature names or IDs)
  const labels = features.map((feature, index) => feature.properties.Name || `Feature ${index + 1}`);

  // Dynamically create datasets for each numerical column
  const numericKeys = Object.keys(columns).filter(
    (key) => columns[key] === "Float" || columns[key] === "Integer"
  );

  const datasets = numericKeys.map((key) => ({
    label: key, // Label for the dataset (e.g., "NDVI", "EVI")
    data: features.map((feature) => feature.properties[key] || 0), // Extract data for the key from all features
    borderColor: getRandomColor(),
    backgroundColor: getRandomColor(0.2),
    borderWidth: 2,
    fill: true,
  }));

  // Chart data configuration
  const data = {
    labels, // Use feature names or IDs as labels
    datasets, // Dynamically generated datasets
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Dynamic Feature Metrics Comparison",
      },
    },
  };

  // Utility function to generate random colors
  function getRandomColor(alpha = 1): string {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
      <Line data={data} options={options} />
  );
};

export default LineChart;
