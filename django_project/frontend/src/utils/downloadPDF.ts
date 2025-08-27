import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Export Settings
const EXPORT_SCALE = 5.0; // scale to 500% of original size
const EXPORT_BASELINE_RATIO = 1.0; // no reduction
const EXPORT_CHART_RATIO = 0.85; // reduce to 85% of original size
const EXPORT_Y_POSITION = 10; // y position of the chart in mm

export interface ExportAnalysis {
    analysisType: string;
    temporalResolution: string;
    variable: string;
}

export const downloadAnalysisPDF = async (
    containerRef: React.MutableRefObject<HTMLDivElement>,
    analysis: ExportAnalysis,
    baselineTableContainerId: string = "BaselineTableContainer",
    elementToHideIds: string[] = [],
) => {
    if (!containerRef.current) return;

    const clone = containerRef.current.cloneNode(true) as HTMLDivElement;

    // remove the element to hide
    elementToHideIds.forEach((id) => {
        const elementToHide = clone.querySelector(`#${id}`) as HTMLDivElement;
        if (elementToHide) {
            elementToHide.style.display = "none";
        }
    });

    // remove box shadow
    clone.style.boxShadow = "none";

    // if Baseline, we need to expand the table
    if (analysis.analysisType === "Baseline") {
      const table = clone.querySelector(`#${baselineTableContainerId}`) as HTMLDivElement;
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
    const pdfOrientation = analysis.analysisType === "Baseline" ? "landscape" : "portrait";
    const pdf = new jsPDF(pdfOrientation, "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions while preserving aspect ratio
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const reducedRatio = ratio * (analysis.analysisType === "Baseline" ? EXPORT_BASELINE_RATIO : EXPORT_CHART_RATIO);
    const finalImgWidth = imgWidth * reducedRatio;
    const finalImgHeight = imgHeight * reducedRatio;
    // center the image
    const x = (pageWidth - finalImgWidth) / 2;
    const y = EXPORT_Y_POSITION;

    // Add the chart image
    pdf.addImage(imgData, "JPEG", x, y, finalImgWidth, finalImgHeight);
  
    let fileName = '';
    if (analysis.analysisType === "Baseline") {
      fileName = 'Baseline Analysis';
    } else if (analysis.analysisType === "Temporal") {
      fileName = `${analysis.temporalResolution} Temporal Analysis on ${analysis.variable}`;
    } else if (analysis.analysisType === "Spatial") {
      fileName = `Spatial Analysis on ${analysis.variable}`;
    } else if (analysis.analysisType === "BACI") {
      fileName = `BACI Analysis on ${analysis.variable}`;
    }

    pdf.save(`${fileName}.pdf`);
}


export const downloadDashboardPDF = async (
  containerRef: React.MutableRefObject<HTMLDivElement>,
  dashboardName: string,
  elementToHideIds: string[] = []
) => {
  if (!containerRef.current) return;

  const clone = containerRef.current.cloneNode(true) as HTMLDivElement;
  clone.style.background = "white";

  // remove unwanted elements
  elementToHideIds.forEach((id) => {
    const el = clone.querySelector(`#${id}`) as HTMLDivElement;
    if (el) el.style.display = "none";
  });

  // cleanup styles
  clone.style.boxShadow = "none";
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.background = "white";

  // fix sticky header
  const header = clone.querySelector("#dashboard-header") as HTMLDivElement;
  if (header) {
    header.style.position = "static";
    header.style.top = "0";
    header.style.background = "white";
  }

  // copy over chart canvases
  const originalCanvases = containerRef.current.querySelectorAll("canvas");
  const clonedCanvases = clone.querySelectorAll("canvas");
  originalCanvases.forEach((origCanvas, i) => {
    const clonedCanvas = clonedCanvases[i];
    const ctx = clonedCanvas.getContext("2d");
    ctx?.drawImage(origCanvas, 0, 0);
  });

  document.body.appendChild(clone);

  const fullCanvas = await html2canvas(clone, {
    backgroundColor: "white",
    scale: EXPORT_SCALE,
    scrollY: 0,
  });

  document.body.removeChild(clone);

  // setup PDF
  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const pxToMm = (px: number) => (px * 25.4) / 96; // 96dpi
  const imgWidthMm = pxToMm(fullCanvas.width);
  const imgHeightMm = pxToMm(fullCanvas.height);

  const ratio = Math.min(pageWidth / imgWidthMm, 1);
  const finalImgWidth = imgWidthMm * ratio;
  const finalImgHeight = imgHeightMm * ratio;

  const pageContentHeight = pageHeight;
  let renderedHeight = 0;

  while (renderedHeight < finalImgHeight) {
    // calculate slice height in px
    const sliceHeightPx = Math.min(
      fullCanvas.height - (renderedHeight / finalImgHeight) * fullCanvas.height,
      (pageContentHeight / finalImgHeight) * fullCanvas.height
    );

    // create slice
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = fullCanvas.width;
    sliceCanvas.height = sliceHeightPx;
    const sliceCtx = sliceCanvas.getContext("2d");

    sliceCtx?.drawImage(
      fullCanvas,
      0,
      (renderedHeight / finalImgHeight) * fullCanvas.height,
      fullCanvas.width,
      sliceHeightPx,
      0,
      0,
      fullCanvas.width,
      sliceHeightPx
    );

    const sliceData = sliceCanvas.toDataURL("image/jpeg", 1.0);

    const sliceHeightMm =
      (sliceHeightPx / fullCanvas.height) * finalImgHeight;

    pdf.addImage(
      sliceData,
      "JPEG",
      0,
      renderedHeight === 0 ? EXPORT_Y_POSITION : 0,
      finalImgWidth,
      sliceHeightMm
    );

    renderedHeight += pageContentHeight;
    if (renderedHeight < finalImgHeight) {
      pdf.addPage("a4", "landscape");
    }
  }

  pdf.save(`${dashboardName}.pdf`);
};
