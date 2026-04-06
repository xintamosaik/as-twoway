// Fixed layout for first experiment.
// Keep it stupid and obvious.

const WIDTH: i32 = 160;
const HEIGHT: i32 = 100;
const BYTES_PER_PIXEL: i32 = 4;

const PADDLE_W: i32 = 4;
const PADDLE_H: i32 = 20;
const PADDLE_MARGIN: i32 = 6;
const BALL_SIZE: i32 = 4;
const PADDLE_SPEED: i32 = 2;
const BALL_SPEED_X: i32 = 2;
const BALL_SPEED_Y: i32 = 1;

const FRAME_LEN: i32 = WIDTH * HEIGHT * BYTES_PER_PIXEL;
const INPUT_LEN: i32 = 16;

// Put both regions after a small safety gap.
// Avoid low addresses and keep it visually obvious.
const FRAME_PTR: usize = 1024;
const INPUT_PTR: usize = FRAME_PTR + FRAME_LEN;

// Metadata exports
export function width(): i32 { return WIDTH; }
export function height(): i32 { return HEIGHT; }

export function framePtr(): usize { return FRAME_PTR; }
export function frameLen(): i32 { return FRAME_LEN; }

export function inputPtr(): usize { return INPUT_PTR; }
export function inputLen(): i32 { return INPUT_LEN; }

// JS writes input bytes here.
// WASM reads them here.
function readInput(index: i32): u8 {
  return load<u8>(INPUT_PTR + <usize>index);
}

// WASM writes framebuffer here.
// JS reads it here.
function writePixel(offset: usize, r: u8, g: u8, b: u8, a: u8): void {
  store<u8>(offset, r);
  store<u8>(offset + 1, g);
  store<u8>(offset + 2, b);
  store<u8>(offset + 3, a);
}

let leftY: i32 = (HEIGHT - PADDLE_H) / 2;
let rightY: i32 = (HEIGHT - PADDLE_H) / 2;
let ballX: i32 = (WIDTH - BALL_SIZE) / 2;
let ballY: i32 = (HEIGHT - BALL_SIZE) / 2;
let ballVX: i32 = BALL_SPEED_X;
let ballVY: i32 = BALL_SPEED_Y;

function clamp(value: i32, min: i32, max: i32): i32 {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// Advance simulation by one frame using input bytes.
// input[0] = left up (W)
// input[1] = left down (S)
// input[2] = right up (ArrowUp)
// input[3] = right down (ArrowDown)
export function tick(): void {
  let leftUp = readInput(0) != 0;
  let leftDown = readInput(1) != 0;
  let rightUp = readInput(2) != 0;
  let rightDown = readInput(3) != 0;

  if (leftUp && !leftDown) leftY -= PADDLE_SPEED;
  if (leftDown && !leftUp) leftY += PADDLE_SPEED;
  if (rightUp && !rightDown) rightY -= PADDLE_SPEED;
  if (rightDown && !rightUp) rightY += PADDLE_SPEED;

  leftY = clamp(leftY, 0, HEIGHT - PADDLE_H);
  rightY = clamp(rightY, 0, HEIGHT - PADDLE_H);

  ballX += ballVX;
  ballY += ballVY;

  if (ballY <= 0) {
    ballY = 0;
    ballVY = -ballVY;
  }
  if (ballY >= HEIGHT - BALL_SIZE) {
    ballY = HEIGHT - BALL_SIZE;
    ballVY = -ballVY;
  }

  const leftX = PADDLE_MARGIN;
  const rightX = WIDTH - PADDLE_MARGIN - PADDLE_W;

  let overlapsLeft = ballX <= leftX + PADDLE_W
    && ballX + BALL_SIZE >= leftX
    && ballY + BALL_SIZE >= leftY
    && ballY <= leftY + PADDLE_H;

  let overlapsRight = ballX + BALL_SIZE >= rightX
    && ballX <= rightX + PADDLE_W
    && ballY + BALL_SIZE >= rightY
    && ballY <= rightY + PADDLE_H;

  if (ballVX < 0 && overlapsLeft) {
    ballX = leftX + PADDLE_W;
    ballVX = BALL_SPEED_X;
  } else if (ballVX > 0 && overlapsRight) {
    ballX = rightX - BALL_SIZE;
    ballVX = -BALL_SPEED_X;
  }

  if (ballX < -BALL_SIZE) {
    ballX = (WIDTH - BALL_SIZE) / 2;
    ballY = (HEIGHT - BALL_SIZE) / 2;
    ballVX = BALL_SPEED_X;
    ballVY = BALL_SPEED_Y;
  } else if (ballX > WIDTH) {
    ballX = (WIDTH - BALL_SIZE) / 2;
    ballY = (HEIGHT - BALL_SIZE) / 2;
    ballVX = -BALL_SPEED_X;
    ballVY = BALL_SPEED_Y;
  }
}

// Render current simulation state into framebuffer memory.
export function render(): void {
  const leftX = PADDLE_MARGIN;
  const rightX = WIDTH - PADDLE_MARGIN - PADDLE_W;

  let p = FRAME_PTR;

  for (let y: i32 = 0; y < HEIGHT; y++) {
    for (let x: i32 = 0; x < WIDTH; x++) {
      let inLeftPaddle = x >= leftX && x < leftX + PADDLE_W && y >= leftY && y < leftY + PADDLE_H;
      let inRightPaddle = x >= rightX && x < rightX + PADDLE_W && y >= rightY && y < rightY + PADDLE_H;
      let inBall = x >= ballX && x < ballX + BALL_SIZE && y >= ballY && y < ballY + BALL_SIZE;

      let r: u8 = 8;
      let g: u8 = 12;
      let b: u8 = 20;

      if (inLeftPaddle || inRightPaddle || inBall) {
        r = 235;
        g = 235;
        b = 235;
      }

      writePixel(p, r, g, b, 255);
      p += 4;
    }
  }
}