const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restart');
const scoreElement = document.getElementById('score');
const statusElement = document.getElementById('status');

const tileSize = 20;
const gridSize = Math.floor(canvas.width / tileSize);
const movesPerSecond = 8;
const frameInterval = 1000 / movesPerSecond;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const KEY_TO_DIRECTION = {
  arrowup: DIRECTIONS.up,
  w: DIRECTIONS.up,
  arrowdown: DIRECTIONS.down,
  s: DIRECTIONS.down,
  arrowleft: DIRECTIONS.left,
  a: DIRECTIONS.left,
  arrowright: DIRECTIONS.right,
  d: DIRECTIONS.right
};

let snake = [];
let direction = DIRECTIONS.right;
let nextDirection = DIRECTIONS.right;
let food = null;
let score = 0;
let animationId = null;
let lastFrameTime = 0;
let isRunning = false;

function initGame(initialDirection = DIRECTIONS.right) {
  cancelAnimationFrame(animationId);

  direction = initialDirection;
  nextDirection = initialDirection;
  snake = createInitialSnake(initialDirection);
  score = 0;
  updateScore();
  spawnFood();

  isRunning = true;
  lastFrameTime = 0;
  draw();
  updateStatus('');

  animationId = requestAnimationFrame(loop);
}

function createInitialSnake(initialDirection) {
  const startX = Math.floor(gridSize / 2);
  const startY = Math.floor(gridSize / 2);
  const tailDirection = { x: -initialDirection.x, y: -initialDirection.y };

  return Array.from({ length: 3 }, (_, index) => ({
    x: startX + tailDirection.x * index,
    y: startY + tailDirection.y * index
  }));
}

function loop(timestamp) {
  if (!isRunning) {
    return;
  }

  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }

  const delta = timestamp - lastFrameTime;

  if (delta >= frameInterval) {
    step();
    lastFrameTime = timestamp;
  }

  if (isRunning) {
    animationId = requestAnimationFrame(loop);
  }
}

function step() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (isOutOfBounds(head) || isOnSnake(head)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (food && head.x === food.x && head.y === food.y) {
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

  drawGrid();
  drawSnake();
  drawFood();
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(240, 246, 252, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let i = 1; i < gridSize; i += 1) {
    const position = i * tileSize;

    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
  }

  ctx.stroke();
}

function drawSnake() {
  if (!snake.length) {
    return;
  }

  ctx.fillStyle = '#3fb950';

  snake.forEach((segment, index) => {
    const x = segment.x * tileSize;
    const y = segment.y * tileSize;

    if (index === 0) {
      ctx.fillStyle = '#2ea043';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.fillStyle = '#3fb950';
    } else {
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  });
}

function drawFood() {
  if (!food) {
    return;
  }

  ctx.fillStyle = '#f85149';
  ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
}

function isOutOfBounds(position) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

function isOnSnake(position) {
  return snake.some(segment => segment.x === position.x && segment.y === position.y);
}

function spawnFood() {
  let newFood;

  do {
    newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
  } while (isOnSnake(newFood));

  food = newFood;
}

function updateScore() {
  scoreElement.textContent = score.toString();
}

function updateStatus(message) {
  statusElement.textContent = message;
}

function gameOver() {
  isRunning = false;
  updateStatus('Game over! Press Restart, Space, or Enter to play again.');
  cancelAnimationFrame(animationId);
  animationId = null;
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const newDirection = KEY_TO_DIRECTION[key];

  if (newDirection) {
    event.preventDefault();

    if (!isRunning) {
      initGame(newDirection);
      return;
    }

    if (!isOppositeDirection(newDirection, direction)) {
      nextDirection = newDirection;
    }

    return;
  }

  if ((key === ' ' || key === 'enter') && !isRunning) {
    event.preventDefault();
    initGame();
  }
}

function isOppositeDirection(dirA, dirB) {
  return dirA.x === -dirB.x && dirA.y === -dirB.y;
}

function setIdleState() {
  cancelAnimationFrame(animationId);
  animationId = null;
  isRunning = false;
  snake = createInitialSnake(DIRECTIONS.right);
  food = null;
  updateScore();
  draw();
  updateStatus('Press Restart, Space, Enter, or a direction key to begin.');
}

restartButton.addEventListener('click', () => {
  initGame();
});

document.addEventListener('keydown', handleKeydown);

setIdleState();
