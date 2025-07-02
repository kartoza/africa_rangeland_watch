const STATUS_TEXTS: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    // Add more as needed
};


export interface ErrorResponse {
    message: string;
}

export const getErrorMessage = (error: any, defaultError?: string): string => {
    const defaultMessage = defaultError || 'An error occurred';
    const status = error.response.status;
    const statusText = STATUS_TEXTS[status] || 'Error';
    const serverMessage = error.response.data?.error || error.response.data?.message || defaultMessage;
    const fullMessage = `${statusText} ${status}: ${serverMessage}`;

    return fullMessage;
}


export const downloadCog = async (raster_output_id: string) => {
    let url = `user_analysis_results/download_raster_output/${raster_output_id}`;
    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error));
    }

    // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${raster_output_id}.tif`; // Default filename

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
}
