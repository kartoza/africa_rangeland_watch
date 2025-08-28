import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
    Widget,
    heightConfig
} from '../store/dashboardSlice';

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

function pxToMm(px: number): number {
  return px * 0.264583; // mm
}

function mmToPx(mm: number): number {
  return mm / 0.264583; // px
}

export const downloadDashboardPDF = async (
  containerRef: React.MutableRefObject<HTMLDivElement>,
  dashboardName: string,
  widgets: Widget[] = [],
  elementToHideIds: string[] = []
) => {
  if (!containerRef.current) return;

  const clone = containerRef.current.cloneNode(true) as HTMLDivElement;
  clone.style.background = "white";

  // hide unwanted elements
  elementToHideIds.forEach((id) => {
    const el = clone.querySelector(`#${id}`) as HTMLDivElement;
    if (el) el.style.display = "none";
  });

  // cleanup clone
  clone.style.boxShadow = "none";
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = '100%';
  document.body.appendChild(clone);

  // fix sticky header
  const header = clone.querySelector("#dashboard-header") as HTMLDivElement; 
  let headerHeightMm = 0;
  if (header) {
    header.style.position = "static";
    header.style.top = "0";
    header.style.background = "white";
    const headerPx = header.offsetHeight;
    headerHeightMm = (headerPx + 25) * 0.264583; // px → mm
  }

  const description = clone.querySelector("#dashboard-info") as HTMLDivElement; 
  if (description) {
    description.style.width = '100%';
  }


  // copy charts
  const originalCanvases = containerRef.current.querySelectorAll("canvas");
  const clonedCanvases = clone.querySelectorAll("canvas");
  originalCanvases.forEach((origCanvas, i) => {
    const ctx = clonedCanvases[i].getContext("2d");
    ctx?.drawImage(origCanvas, 0, 0);
  });

  const fullCanvas = await html2canvas(clone, {
    backgroundColor: "white",
    // scale: EXPORT_SCALE,
    scrollY: 0,
  });

  document.body.removeChild(clone);

  // PDF setup
  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidthMm = pxToMm(fullCanvas.width);
  const imgHeightMm = pxToMm(fullCanvas.height);

  // Scale image to fit page width
  const scale = pageWidth / imgWidthMm;
  const finalImgWidth = pageWidth;
  const finalImgHeight = imgHeightMm * scale;

  // Loop over charts
  const charts = widgets
  let renderedHeightMm = headerHeightMm;
  let yOffsetPx = 0;
  for (let i = 0; i < charts.length; ) {
    let newRenderedHeightMm = renderedHeightMm;

    const chart = charts[i];
    const widthCols = parseInt(chart.config.size); // assume chart stores width in cols
    const chartPxHeight: number = parseInt(heightConfig[chart.height].minH.replace('px', ''));
    const chartMmHeight: number = (chartPxHeight + 25) * 0.264583;
    
    if (widthCols > 2) {
      newRenderedHeightMm += chartMmHeight;
    } else {
      const nextChart = charts[i + 1];
      if (nextChart) {
        const nextWidth = parseInt(chart.config.size);
        if (nextWidth === 2) {
          const nextPxHeight: number = parseInt(heightConfig[nextChart.height].minH.replace('px', ''));
          const nextMmHeight = (nextPxHeight + 25) * 0.264583;
          newRenderedHeightMm += Math.max(chartMmHeight, nextMmHeight);
          i++; // skip next since paired
        } else {
          newRenderedHeightMm += chartMmHeight;
        }
      } else {
        newRenderedHeightMm += chartMmHeight;
      }
    }

    if (newRenderedHeightMm > pageHeight) {
      let sliceHeightPx = (((renderedHeightMm) / finalImgHeight) * fullCanvas.height) - 30;

      if (i == charts.length - 1) {
        sliceHeightPx = (newRenderedHeightMm / finalImgHeight) * fullCanvas.height;
      }
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext("2d")!;
      ctx.drawImage(fullCanvas, 0, yOffsetPx, fullCanvas.width, sliceHeightPx, 0, 0, fullCanvas.width, sliceHeightPx);

      const sliceHeightMm = (sliceHeightPx / fullCanvas.height) * finalImgHeight;

      pdf.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        finalImgWidth,
        sliceHeightMm
      );
      if (i < charts.length - 1 ) {
        pdf.addPage();
      }
      renderedHeightMm = 0;
      yOffsetPx += sliceHeightPx;
    } else {
      renderedHeightMm = newRenderedHeightMm;
      i++;
    }

  }

  pdf.save(`${dashboardName}.pdf`);
};

