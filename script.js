const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restart');
const scoreElement = document.getElementById('score');
const statusElement = document.getElementById('status');

const tileSize = 20;
const tiles = canvas.width / tileSize;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let loopId = null;
let isRunning = false;

function initGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  updateScore();
  statusElement.textContent = '';
  isRunning = true;
  spawnFood();
  startLoop();
}

function startLoop() {
  if (loopId) {
    clearInterval(loopId);
  }
  loopId = setInterval(step, 110);
}

function step() {
  if (!isRunning) {
    return;
  }

  direction = nextDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (isOutOfBounds(newHead) || isOnSnake(newHead)) {
    return gameOver();
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 10;
    updateScore();
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#3fb950';
  snake.forEach((segment, index) => {
    ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize - 2, tileSize - 2);

    if (index === 0) {
      ctx.fillStyle = '#2ea043';
      ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize - 2, tileSize - 2);
      ctx.fillStyle = '#3fb950';
    }
  });

  ctx.fillStyle = '#f85149';
  ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize - 2, tileSize - 2);
}

function isOutOfBounds(position) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= tiles ||
    position.y >= tiles
  );
}

function isOnSnake(position) {
  return snake.some(segment => segment.x === position.x && segment.y === position.y);
}

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tiles),
      y: Math.floor(Math.random() * tiles)
    };
  } while (isOnSnake(newFood));

  food = newFood;
}

function updateScore() {
  scoreElement.textContent = score.toString();
}

function gameOver() {
  isRunning = false;
  clearInterval(loopId);
  statusElement.textContent = 'Game over! Press Restart or Space to play again.';
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  switch (key) {
    case 'arrowup':
    case 'w':
      if (direction.y === 1) break;
      nextDirection = { x: 0, y: -1 };
      break;
    case 'arrowdown':
    case 's':
      if (direction.y === -1) break;
      nextDirection = { x: 0, y: 1 };
      break;
    case 'arrowleft':
    case 'a':
      if (direction.x === 1) break;
      nextDirection = { x: -1, y: 0 };
      break;
    case 'arrowright':
    case 'd':
      if (direction.x === -1) break;
      nextDirection = { x: 1, y: 0 };
      break;
    case ' ':
    case 'enter':
      if (!isRunning) {
        initGame();
      }
      break;
    default:
      break;
  }
}

restartButton.addEventListener('click', () => {
  initGame();
});

document.addEventListener('keydown', handleKeydown);

draw();
statusElement.textContent = 'Press Restart or Space to begin.';
