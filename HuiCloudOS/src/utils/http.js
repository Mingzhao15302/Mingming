export async function fetchJSON(input, init = {}) {
  const response = await fetch(input, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    ...init
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function uploadFormData(url, formData, onProgress) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText || '{}'));
      } else {
        reject(new Error(xhr.responseText || xhr.statusText));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
  });

  if (onProgress) {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
  }

  xhr.send(formData);
  return promise;
}
