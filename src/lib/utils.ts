import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract error message from various error types
 * Handles Axios errors, Error objects, and unknown errors
 */
export function getErrorMessage(error: unknown): string {
  // Check for Axios error with response data
  if (axios.isAxiosError(error)) {
    // console.log("Axios error response:", error.response?.data);

    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    // Fallback to status text if no error message
    if (error.response?.statusText) {
      return error.response.statusText;
    }
  }

  // Check for regular Error object
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
