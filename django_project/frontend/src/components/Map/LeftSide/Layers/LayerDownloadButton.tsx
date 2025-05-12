import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@chakra-ui/react";
import axios from "axios";
import { setCSRFToken } from "../../../../utils/csrfUtils";

interface Props {
  layerId: string;
  isSelected: boolean;
  layerUrl?: string;
  landscapeId?: string;
}

export default function CogDownloadButton({ layerId, isSelected, layerUrl, landscapeId }: Props) {
  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkLayerReady = async () => {
    const res = await axios.get(`/user-input-layers/`);
    const layers = res.data.grouped_layers["user-defined"] || [];
    const layer = layers.find((l: any) => l.uuid === layerId);

    if (layer?.metadata?.cog_downloaded) {
      setStatus("ready");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const handleExport = async () => {
    setCSRFToken();
    setStatus("processing");
  
    await axios.post(`/nrt-layer/${layerId}/export/`,
      {
        landscape_id: landscapeId,
      },
    );
  
    const interval = setInterval(async () => {
      const res = await fetch(`/user-input-layers/`);
      const data = await res.json();
  
      const layers = data.grouped_layers["user-defined"] || [];
      const layer = layers.find((l: any) => l.uuid === layerId);
  
      if (layer && layer.metadata?.cog_downloaded && layer.url) {
        clearInterval(interval);
        setStatus("ready");
  
        // Auto download when ready
        const response = await fetch(layer.url);
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = layer.url.split("/").pop() || `${layerId}.tif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 10000); // check every 10 seconds
  };

  const handleDownload = () => {
    if (layerUrl) {
      window.location.href = layerUrl;
    } else {
      alert("Download URL not available.");
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!isSelected) return null;

  return (
    <Button
      size="xs"
      colorScheme="blue"
      onClick={
        status === "idle"
          ? handleExport
          : status === "ready"
          ? handleDownload
          : undefined
      }
      isLoading={status === "processing"}
      isDisabled={status === "processing"}
    >
      {status === "idle" && "Export COG"}
      {status === "processing" && "Processing..."}
      {status === "ready" && "Download"}
    </Button>
  );
}
