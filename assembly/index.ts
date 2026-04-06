// Fixed layout for first experiment.
// Keep it stupid and obvious.

const WIDTH: i32 = 160;
const HEIGHT: i32 = 100;
const BYTES_PER_PIXEL: i32 = 4;

const PADDLE_W: i32 = 4;
const PADDLE_H: i32 = 20;
const PADDLE_MARGIN: i32 = 6;
const BALL_SIZE: i32 = 4;
const PADDLE_SPEED: i32 = 1;
const BALL_SPEED_X: i32 = 1;
const BALL_SPEED_Y: i32 = 1;

// memory map
// [FRAME region][INPUT region][STATE region]
const MEMORY_BASE_PTR: usize = 1024;

const FRAME_LEN: i32 = WIDTH * HEIGHT * BYTES_PER_PIXEL;
const INPUT_LEN: i32 = 16;
const STATE_LEN: i32 = 16;

const FRAME_PTR: usize = MEMORY_BASE_PTR;
const FRAME_END: usize = FRAME_PTR + <usize>FRAME_LEN;

const INPUT_PTR: usize = FRAME_END;
const INPUT_END: usize = INPUT_PTR + <usize>INPUT_LEN;

const STATE_PTR: usize = INPUT_END;
const STATE_END: usize = STATE_PTR + <usize>STATE_LEN;

const IN_LEFT_UP: i32 = 0;
const IN_LEFT_DOWN: i32 = 1;
const IN_RIGHT_UP: i32 = 2;
const IN_RIGHT_DOWN: i32 = 3;

// Metadata exports
export function width(): i32 { return WIDTH; }
export function height(): i32 { return HEIGHT; }

export function framePtr(): usize { return FRAME_PTR; }
export function frameLen(): i32 { return FRAME_LEN; }
export function frameEnd(): usize { return FRAME_END; }

export function inputPtr(): usize { return INPUT_PTR; }
export function inputLen(): i32 { return INPUT_LEN; }
export function inputEnd(): usize { return INPUT_END; }

export function statePtr(): usize { return STATE_PTR; }
export function stateLen(): i32 { return STATE_LEN; }
export function stateEnd(): usize { return STATE_END; }

// JS writes input bytes here.
// WASM reads them here.
function readInput(index: i32): u8 {
  return load<u8>(INPUT_PTR + <usize>index);
}

// WASM writes state here.
// JS reads it here.
function writeStateI32(byteOffset: i32, value: i32): void {
  store<i32>(STATE_PTR + <usize>byteOffset, value);
}

function publishState(): void {
  writeStateI32(0, ballX);
  writeStateI32(4, ballY);
  writeStateI32(8, leftY);
  writeStateI32(12, rightY);
}

// WASM writes framebuffer here.
// JS reads it here.
function writePixel32(offset: usize, rgba: u32): void {
  store<u32>(offset, rgba);
}

function packRGBA(r: u8, g: u8, b: u8, a: u8): u32 {
  return <u32>r | (<u32>g << 8) | (<u32>b << 16) | (<u32>a << 24);
}

const BG_RGBA: u32 = packRGBA(8, 12, 20, 255);
const FG_RGBA: u32 = packRGBA(235, 235, 235, 255);

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

// Advance simulation by one frame using input protocol bytes.
export function tick(): void {
  let leftUp = readInput(IN_LEFT_UP) != 0;
  let leftDown = readInput(IN_LEFT_DOWN) != 0;
  let rightUp = readInput(IN_RIGHT_UP) != 0;
  let rightDown = readInput(IN_RIGHT_DOWN) != 0;

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

  publishState();
}

// Render current simulation state into framebuffer memory.
export function render(): void {
  const leftX = PADDLE_MARGIN;
  const rightX = WIDTH - PADDLE_MARGIN - PADDLE_W;

  clearFrame(BG_RGBA);
  drawRect(leftX, leftY, PADDLE_W, PADDLE_H, FG_RGBA);
  drawRect(rightX, rightY, PADDLE_W, PADDLE_H, FG_RGBA);
  drawRect(ballX, ballY, BALL_SIZE, BALL_SIZE, FG_RGBA);
}

function clearFrame(rgba: u32): void {
  let p = FRAME_PTR;
  const end = FRAME_END;
  while (p < end) {
    writePixel32(p, rgba);
    p += 4;
  }
}

function drawRect(x: i32, y: i32, w: i32, h: i32, rgba: u32): void {
  const x0 = clamp(x, 0, WIDTH);
  const y0 = clamp(y, 0, HEIGHT);
  const x1 = clamp(x + w, 0, WIDTH);
  const y1 = clamp(y + h, 0, HEIGHT);

  if (x0 >= x1 || y0 >= y1) return;

  for (let yy: i32 = y0; yy < y1; yy++) {
    let p = FRAME_PTR + <usize>((yy * WIDTH + x0) * BYTES_PER_PIXEL);
    for (let xx: i32 = x0; xx < x1; xx++) {
      writePixel32(p, rgba);
      p += 4;
    }
  }
}