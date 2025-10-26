import '../../styles/base.css';
import '../../styles/login.css';

const AUTH_KEY = 'hyos-authenticated';
const DEFAULT_CREDENTIALS = {
  username: 'hxadmin',
  password: 'hx84556793',
};

if (localStorage.getItem(AUTH_KEY) === 'true') {
  window.location.href = '/dashboard';
}

const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = event.target.username.value.trim();
  const password = event.target.password.value.trim();

  if (username === DEFAULT_CREDENTIALS.username && password === DEFAULT_CREDENTIALS.password) {
    localStorage.setItem(AUTH_KEY, 'true');
    errorMsg.textContent = '';
    event.target.reset();
    window.location.href = '/dashboard';
  } else {
    errorMsg.textContent = '账号或密码错误，请重新输入。';
  }
});
