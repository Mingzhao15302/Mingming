import { useCallback, useMemo } from 'react';

const jsonHeaders = { 'Content-Type': 'application/json' };

export function useApi() {
  const request = useCallback(async (url, options = {}) => {
    const finalOptions = { ...options };
    finalOptions.headers = {
      ...(options.headers || {}),
      ...(options.body && !(options.body instanceof FormData) ? jsonHeaders : {})
    };
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }, []);

  return useMemo(
    () => ({
      request,
      get: (url) => request(url, { method: 'GET' }),
      post: (url, body, headers) =>
        request(url, {
          method: 'POST',
          body: body instanceof FormData ? body : JSON.stringify(body),
          headers
        }),
      put: (url, body, headers) =>
        request(url, {
          method: 'PUT',
          body: body instanceof FormData ? body : JSON.stringify(body),
          headers
        }),
      delete: (url, body, headers) =>
        request(url, {
          method: 'DELETE',
          body: body instanceof FormData ? body : JSON.stringify(body),
          headers
        })
    }),
    [request]
  );
}
