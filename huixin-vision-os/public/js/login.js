const LOGIN_KEY = 'hxos-authenticated';

// Redirect to dashboard if session already stored
if (localStorage.getItem(LOGIN_KEY) === 'true') {
  window.location.href = 'dashboard.html';
}

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const formData = new FormData(form);
  const payload = {
    username: formData.get('username'),
    password: formData.get('password')
  };

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let result = null;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse login response', parseError);
    }

    if (response.ok && result?.success) {
      localStorage.setItem(LOGIN_KEY, 'true');
      localStorage.setItem('hxos-username', payload.username);
      window.location.href = 'dashboard.html';
      return;
    }

    // Display meaningful error for invalid credentials or server-side errors
    const message = result?.message || (response.ok ? '请检查账号或密码' : '登录失败，请稍后再试');
    errorBox.textContent = message;
  } catch (err) {
    errorBox.textContent = '网络异常，请稍后再试';
    console.error(err);
  }
});
