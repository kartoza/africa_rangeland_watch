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
