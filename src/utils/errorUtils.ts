import { logger } from './logger';

export interface ErrorResponse {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: any;
  timestamp?: string;
}

export class ClientError extends Error {
  constructor(
    message: string,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

export const handleApiError = (error: any): ErrorResponse => {
  // Axios error with response
  if (error.response) {
    const { data, status } = error.response;
    
    logger.error(`API Error (${status})`, {
      response: data,
      url: error.config?.url,
      method: error.config?.method,
    });

    return {
      success: false,
      message: data.message || 'An error occurred while processing your request',
      errorCode: data.errorCode,
      details: data.details,
      timestamp: data.timestamp,
    };
  }

  // Network error
  if (error.request) {
    logger.error('Network Error', {
      request: error.request,
      message: error.message,
    });

    return {
      success: false,
      message: 'Unable to connect to the server. Please check your internet connection.',
      errorCode: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    };
  }

  // Client-side error
  logger.error('Client Error', {
    error: error.message,
    stack: error.stack,
  });

  return {
    success: false,
    message: 'An unexpected error occurred',
    errorCode: 'CLIENT_ERROR',
    timestamp: new Date().toISOString(),
  };
};

export const createErrorToast = (error: any) => {
  const errorResponse = handleApiError(error);
  return {
    title: errorResponse.errorCode || 'Error',
    description: errorResponse.message,
    variant: 'destructive' as const,
  };
};