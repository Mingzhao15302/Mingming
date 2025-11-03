export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  [key: string]: any;
  data?: T;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await safeMessage(response);
    throw new Error(message);
  }
  if (response.headers.get('content-type')?.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

async function safeMessage(response: Response) {
  try {
    const data = await response.json();
    return data.message ?? response.statusText;
  } catch (error) {
    return response.statusText;
  }
}

export const api = {
  login(payload: { username: string; password: string }) {
    return request<{ token: string; user: { name: string } }>('/api/login', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
  fetchDashboard() {
    return request('/api/dashboard');
  },
  fetchVideos(params: Record<string, string | number | undefined>) {
    const url = new URL('/api/videos', window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return request(url.toString());
  },
  uploadVideo(file: File) {
    const form = new FormData();
    form.append('file', file);
    return request('/api/videos/upload', {
      method: 'POST',
      body: form,
    });
  },
  updateVideo(id: string, payload: any) {
    return request(`/api/videos/${id}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
  deleteVideo(id: string) {
    return request(`/api/videos/${id}`, {
      method: 'DELETE',
    });
  },
  savePoster(id: string, dataUrl: string) {
    return request(`/api/videos/${id}/poster`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ dataUrl }),
    });
  },
  importCsv(file: File) {
    const form = new FormData();
    form.append('file', file);
    return request('/api/videos/import', {
      method: 'POST',
      body: form,
    });
  },
  exportCsv() {
    return fetch('/api/videos/export');
  },
  fetchProducts() {
    return request('/api/products');
  },
  createProduct(payload: any) {
    return request('/api/products', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
  updateProduct(id: string, payload: any) {
    return request(`/api/products/${id}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(id: string) {
    return request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },
  fetchOrders() {
    return request('/api/orders');
  },
  createOrder(payload: any) {
    return request('/api/orders', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
  fetchQuotes() {
    return request('/api/quotes');
  },
  createQuote(payload: any) {
    return request('/api/quotes', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
  fetchSettings() {
    return request('/api/settings');
  },
  updateSettings(payload: any) {
    return request('/api/settings', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });
  },
};
