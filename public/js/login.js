const LOGIN_STATE_KEY = 'huiyun_login_state';

function isLoggedIn() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_STATE_KEY) || 'false') === true;
  } catch (error) {
    console.warn('Failed to parse login state', error);
    return false;
  }
}

function saveLoginState(state) {
  localStorage.setItem(LOGIN_STATE_KEY, JSON.stringify(state));
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('error');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      errorBox.textContent = '请输入账号和密码';
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: '登录失败' }));
        throw new Error(data.message || '登录失败');
      }

      saveLoginState(true);
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Login failed:', error);
      errorBox.textContent = error.message || '网络异常，请稍后再试';
      saveLoginState(false);
    }
  });
});
