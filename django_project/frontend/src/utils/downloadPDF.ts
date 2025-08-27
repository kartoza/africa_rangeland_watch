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

function pxToMm(px: number): number {
  return px * 0.264583; // mm
}


export const downloadDashboardPDF = async (
  containerRef: React.MutableRefObject<HTMLDivElement>,
  dashboardName: string,
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
  document.body.appendChild(clone);

  // fix sticky header
  const header = clone.querySelector("#dashboard-header") as HTMLDivElement;
  if (header) {
    header.style.position = "static";
    header.style.top = "0";
    header.style.background = "white";

    const headerHeightMm = pxToMm(header.offsetHeight);
    // console.log("Header height:", pxToMm(headerHeight));
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
    scale: EXPORT_SCALE,
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
  

  // Slice properly using scaled height
  const pageContentHeight = pageHeight;
  let renderedHeightMm = 0;

  console.log('imgWidthMm: ', imgWidthMm);
  console.log('imgHeightMm: ', imgHeightMm);

  console.log('scale: ', scale);
  console.log('finalImgWidth mm: ', finalImgWidth);
  console.log('finalImgHeight mm: ', finalImgHeight);
  console.log('pageContentHeight mm: ', pageContentHeight);
  console.log('-----------------------------')

  while (renderedHeightMm < finalImgHeight) {
    // slice in px equivalent of the current PDF window
    const sliceHeightPx = Math.floor(
      (pageContentHeight / finalImgHeight) * fullCanvas.height
    );

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = fullCanvas.width;
    sliceCanvas.height = sliceHeightPx;
    const sliceCtx = sliceCanvas.getContext("2d");

    const sourceY = Math.floor(
      (renderedHeightMm / finalImgHeight) * fullCanvas.height
    );

    sliceCtx?.drawImage(
      fullCanvas,
      0,
      sourceY,
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
      0,
      finalImgWidth,
      sliceHeightMm
    );

    renderedHeightMm += pageContentHeight;
    console.log('sliceHeightMm: ', sliceHeightMm);
    console.log('renderedHeightMm :', renderedHeightMm);
    if (renderedHeightMm < finalImgHeight) {
      pdf.addPage("a4", "landscape");
    }
    console.log('-----------------------------')
  }

  pdf.save(`${dashboardName}.pdf`);
};

