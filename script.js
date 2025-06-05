const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const paddleWidth = 10;
const paddleHeight = 80;
const player = { x: 10, y: canvas.height / 2 - paddleHeight / 2, dy: 5 };
const ai = { x: canvas.width - paddleWidth - 10, y: canvas.height / 2 - paddleHeight / 2, dy: 5 };
const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 7, dx: 4, dy: 4 };

let playerScore = 0;
let aiScore = 0;
const scoreEl = document.getElementById('score');

let upPressed = false;
let downPressed = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') upPressed = true;
  if (e.key === 'ArrowDown' || e.key === 's') downPressed = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') upPressed = false;
  if (e.key === 'ArrowDown' || e.key === 's') downPressed = false;
});

function update() {
  if (upPressed && player.y > 0) player.y -= player.dy;
  if (downPressed && player.y < canvas.height - paddleHeight) player.y += player.dy;

  if (ai.y + paddleHeight / 2 < ball.y) ai.y += ai.dy;
  else if (ai.y + paddleHeight / 2 > ball.y) ai.y -= ai.dy;
  ai.y = Math.max(Math.min(ai.y, canvas.height - paddleHeight), 0);

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) ball.dy = -ball.dy;

  if (ball.x - ball.radius < player.x + paddleWidth && ball.y > player.y && ball.y < player.y + paddleHeight) {
    ball.dx = -ball.dx;
    ball.x = player.x + paddleWidth + ball.radius;
  }
  if (ball.x + ball.radius > ai.x && ball.y > ai.y && ball.y < ai.y + paddleHeight) {
    ball.dx = -ball.dx;
    ball.x = ai.x - ball.radius;
  }

  if (ball.x - ball.radius < 0) {
    aiScore++;
    resetBall(-1);
  }
  if (ball.x + ball.radius > canvas.width) {
    playerScore++;
    resetBall(1);
  }

  scoreEl.textContent = `${playerScore} : ${aiScore}`;
}

function resetBall(direction) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = 4 * direction;
  ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
  ctx.fillRect(ai.x, ai.y, paddleWidth, paddleHeight);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
