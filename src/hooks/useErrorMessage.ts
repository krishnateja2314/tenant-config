import { useState, useEffect, useCallback } from "react";

interface UseErrorMessageOptions {
  timeout?: number;
  onClear?: () => void;
}

export function useErrorMessage(options: UseErrorMessageOptions = {}) {
  const { timeout = 5000, onClear } = options;
  const [error, setError] = useState<string | null>(null);

  const setErrorMessage = useCallback((message: string | null) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    onClear?.();
  }, [onClear]);

  useEffect(() => {
    if (error && timeout > 0) {
      const timer = setTimeout(() => {
        clearError();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [error, timeout, clearError]);

  return {
    error,
    setError: setErrorMessage,
    clearError,
  };
}
