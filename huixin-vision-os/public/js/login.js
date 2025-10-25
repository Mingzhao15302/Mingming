// 登录脚本：负责表单提交与登录状态保持
const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

// 如果已经登录则直接跳转控制台
if (localStorage.getItem('huixin-auth') === 'active') {
  window.location.href = '/dashboard';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('账号或密码错误');
    }

    const result = await response.json();
    if (result.success) {
      localStorage.setItem('huixin-auth', 'active');
      window.location.href = '/dashboard';
    } else {
      errorMessage.textContent = result.message || '登录失败，请重试';
    }
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});
