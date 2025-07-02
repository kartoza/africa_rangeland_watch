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

export const downloadPDF = async (
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
    const pdfOrientation = analysis.analysisType === "Baseline" ? "l" : "p";
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
    }

    pdf.save(`${fileName}.pdf`);
}
