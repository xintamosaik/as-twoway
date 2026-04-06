// Fixed layout for first experiment.
// Keep it stupid and obvious.

const WIDTH: i32 = 160;
const HEIGHT: i32 = 100;
const BYTES_PER_PIXEL: i32 = 4;

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

// Render using the input region.
// Example:
// input[0] = x offset
// input[1] = y offset
// input[2] = mode
export function render(): void {
  let xOff = <i32>readInput(0);
  let yOff = <i32>readInput(1);
  let mode = <i32>readInput(2);

  let p = FRAME_PTR;

  for (let y: i32 = 0; y < HEIGHT; y++) {
    for (let x: i32 = 0; x < WIDTH; x++) {
      let r = <u8>((x + xOff) & 255);
      let g = <u8>((y + yOff) & 255);
      let b = <u8>((mode == 0 ? x ^ y : x + y) & 255);
      writePixel(p, r, g, b, 255);
      p += 4;
    }
  }
}