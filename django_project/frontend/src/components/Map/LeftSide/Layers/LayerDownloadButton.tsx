import * as React from "react";
import { Button } from "@chakra-ui/react";
import { setCSRFToken } from "../../../../utils/csrfUtils";

interface Props {
  layerId: string;
  isSelected: boolean;
}

export default function CogDownloadButton({ layerId, isSelected}: Props) {

  const handleDownload = () => {
    setCSRFToken();
    if (!layerId) return;

    const url = `/nrt-layer/${layerId}/download/`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${layerId}.tif`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isSelected) return null;

  return (
    <Button
      size="xs"
      colorScheme="green"
      onClick={handleDownload}
    >
      Download
    </Button>
  );
}
