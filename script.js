const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let lives = 3;
const livesDisplay = document.getElementById('livesDisplay');
const gameOverScreen = document.getElementById('gameOverScreen');

let stage = 1;
const stageDisplay = document.createElement('div');
stageDisplay.id = 'stageDisplay';
document.body.insertBefore(stageDisplay, canvas); // Add stage display above canvas

canvas.width = 600;
canvas.height = 800;

const paddle = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 50 - 25,
  width: 100,
  height: 25
};

const ball = {
  x: paddle.x + paddle.width / 2,
  y: paddle.y - 10,
  radius: 10,
  dx: 0,
  dy: 0,
  stickyX: 0
};

// Block setup
const blockWidth = 50;
const blockHeight = 15;
const gridWidth = 12;
const gridHeight = 20;

// Power-up properties
const powerupSpeed = 2; // Adjust as needed
const powerupWidth = 20;
const powerupHeight = 30;
let isSticky = false;
let balls = [ball]; // Array to store multiple balls
let powerups = [];
let blocks = [];

function initializeBlocks() {
  blocks = [];
  powerups = []; // Clear power-ups
  
  const totalBlocks = gridWidth * gridHeight;
  const blocksToFill = Math.floor(totalBlocks * 0.6); // 60% of blocks
  const powerupCount = Math.floor(blocksToFill * 0.1); // 10% of filled blocks are power-ups

  let filledBlocks = 0;
  let addedPowerups = 0;
  while (filledBlocks < blocksToFill) {
    for (let i = 0; i < gridWidth; i++) {
      for (let j = 0; j < gridHeight; j++) {
        if (filledBlocks >= blocksToFill) {
          break;
        }
        if (Math.random() < 0.6) { // 60% chance to fill a block
          blocks.push({
            x: i * blockWidth,
            y: j * blockHeight,
            width: blockWidth,
            height: blockHeight,
            hasPowerup: addedPowerups < powerupCount && Math.random() < 0.1 // Add power-up based on chance
          });
          filledBlocks++;
          if (blocks[blocks.length - 1].hasPowerup) {
            addedPowerups++;
          }
        }
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'blue';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Draw balls
  balls.forEach(ball => {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw blocks
  blocks.forEach(block => {
    ctx.fillStyle = block.hasPowerup ? 'purple' : 'green'; // Purple for power-up blocks
    ctx.fillRect(block.x, block.y, block.width, block.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(block.x, block.y, block.width, block.height);
  });

  // Draw power-ups with color based on type
  powerups.forEach(powerup => {
    ctx.fillStyle = powerup.type === '+' ? 'blue' : (powerup.type === '-' ? 'red' : 'purple');
    ctx.fillRect(powerup.x, powerup.y, powerupWidth, powerupHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.type, powerup.x + powerupWidth / 2, powerup.y + powerupHeight / 2);
  });

}

canvas.addEventListener('mousemove', (e) => {
  paddle.x = e.clientX - canvas.offsetLeft - paddle.width / 2;
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && ball.dy === 0) {
    // Check if ball is on the paddle
    balls.forEach((ball, index) => {
      if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        // Launch ball (adjust angles as needed)
        ball.dx = (ball.x - (paddle.x + paddle.width / 2)) / 10; // Vary based on hit position
        ball.dy = -8; // Initial upward speed
      }
    });
  }
});


function updateLivesDisplay() {
  livesDisplay.textContent = `Lives: ${lives}`;
}

function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - 10;
  ball.dx = 0;
  ball.dy = 0;
  balls = [ball]; // Reset balls array to only one ball
  isSticky = false;
}

function startGame() {
  lives = 3;
  updateLivesDisplay();
  gameOverScreen.style.display = 'none';
  resetBall();
  initializeBlocks();
  stage = 1;
  stageDisplay.textContent = `Stage ${stage}`;
  requestAnimationFrame(update)
}

function update() {
  balls.forEach((ball, index) => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Basic collision detection (walls and paddle)
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    if (
      ball.y + ball.radius > paddle.y && 
      ball.x > paddle.x && 
      ball.x < paddle.x + paddle.width
    ) {
      if (!isSticky) {
        // Calculate hit position on the paddle (0 = center, -1 = left, 1 = right)
        const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); 

        // Adjust ball's horizontal angle based on hit position (max angle = 45 degrees)
        const maxAngle = Math.PI / 4; // 45 degrees in radians
        const newAngle = hitPosition * maxAngle;

        // Update ball's horizontal velocity (dx) using new angle
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy); // Total ball speed
        ball.dx = speed * Math.sin(newAngle); 
        ball.dy = -ball.dy;
      } else {
        if (ball.stickyX === 0) {
          ball.stickyX = ball.x - paddle.x
        }
      }
    }

    if (ball.stickyX > 0){
      ball.dx = 0;
      ball.dy = 0;
      ball.x = ball.stickyX + paddle.x;
      ball.y = paddle.y - ball.radius+1; // Position ball on top of paddle
    }

    document.addEventListener('keydown', (e) => {
    // Launch from sticky paddle
      if (e.code === 'Space' && isSticky) {
        isSticky = false; // Disable sticky mode
        ball.stickyX = 0;
        // Launch ball (adjust angles as needed)
        ball.dx = (ball.x - (paddle.x + paddle.width / 2)) / 10; // Vary based on hit position
        ball.dy = -8; // Initial upward speed
      }
    });

    // Check if ball is out of bounds
    if (ball.y - ball.radius > canvas.height) {
      if (balls.length > 1) {
        balls.splice(index,1);
        return false; // Remove this ball if there are others
      } else {
        lives--; // Only lose a life when all balls are gone
        updateLivesDisplay();
        if (lives === 0) {
          gameOverScreen.style.display = 'block';
        } else {
          resetBall(); // Reset the single ball when it's the last one
        }
        return false;
      }
    } 



    // Block collision detection
    blocks = blocks.filter(block => {
      if (
        ball.x < block.x + block.width &&
        ball.x > block.x &&
        ball.y - ball.radius < block.y + block.height &&
        ball.y + ball.radius > block.y
      ) {
        ball.dy = -ball.dy; // Reverse ball direction
        if (block.hasPowerup) {
          powerups.push({
            x: block.x + blockWidth / 2 - powerupWidth / 2,
            y: block.y,
            type: Math.random() < 0.25 ? '+' : (Math.random() < 0.5 ? '-' : (Math.random() < 0.75 ? 'S' : 'D')), // Assign +, -, S, or D
            dy: powerupSpeed
          });
        }
        return false; // Remove block from array
      }
      return true; // Keep block
    });
  });

  // Update power-up positions
  powerups = powerups.filter(powerup => {
    powerup.y += powerup.dy;

    // Check if power-up hits paddle
    if (
      powerup.y + powerupHeight > paddle.y &&
      powerup.x + powerupWidth > paddle.x &&
      powerup.x < paddle.x + paddle.width
    ) {
      // Apply power-up effect (adjust paddle width or stickiness)
      if (powerup.type === '+') {
        paddle.width += 20;
      } else if (powerup.type === '-') {
        paddle.width = Math.max(50, paddle.width - 20); // Minimum width of 50
      } else if (powerup.type === 'S') {
        isSticky = true;
      } else if (powerup.type === 'D') {
        balls = balls.flatMap(ball => [
          ball,
          { ...ball, dx: -ball.dx } // Create a new ball with reversed dx
        ]);
      }
      return false; // Remove power-up
    }
    return powerup.y < canvas.height; // Keep power-up if not off-screen
  });

  if (blocks.length === 0) {
    stage++;
    resetBall();
    initializeBlocks(); // Reset blocks
    stageDisplay.textContent = `Stage ${stage} Complete!`;
    stageDisplay.textContent = `Stage ${stage}`; // Reset stage display
  }


  draw();
  if (lives > 0) {
    requestAnimationFrame(update); 
  }

}

updateLivesDisplay();
startGame(); // Start the game initially