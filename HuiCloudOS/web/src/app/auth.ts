const STORAGE_KEY = 'huicloud-auth';

export function isAuthenticated() {
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setAuthenticated(value: boolean) {
  window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
}
