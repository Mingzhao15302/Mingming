const AUTH_KEY = 'hyos-authenticated';
const DEFAULT_CREDENTIALS = {
  username: 'hxadmin',
  password: 'hx84556793',
};

// Redirect to dashboard if already logged in
if (localStorage.getItem(AUTH_KEY) === 'true') {
  window.location.href = '/dashboard';
}

document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const username = event.target.username.value.trim();
  const password = event.target.password.value.trim();
  const errorMsg = document.getElementById('errorMsg');

  errorMsg.textContent = '';

  if (username === DEFAULT_CREDENTIALS.username && password === DEFAULT_CREDENTIALS.password) {
    localStorage.setItem(AUTH_KEY, 'true');
    errorMsg.textContent = '';
    event.target.reset();
    window.location.href = '/dashboard';
  } else {
    errorMsg.textContent = '账号或密码错误，请重新输入。';
  }
});
