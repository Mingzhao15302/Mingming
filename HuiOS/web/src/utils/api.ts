export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...init
  })
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }
  return (await response.json()) as T
}

export async function uploadFormData<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`)
  }
  return (await response.json()) as T
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }
  return (await response.json()) as T
}
