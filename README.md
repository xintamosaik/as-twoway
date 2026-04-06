# ass

Tiny AssemblyScript + WebAssembly playground that renders a minimal Pong-like scene in a browser.

The project demonstrates a simple shared-memory protocol between JavaScript and WASM:
- JavaScript writes input bytes.
- WASM updates game state.
- WASM writes RGBA pixels to a framebuffer.
- JavaScript reads state + framebuffer and draws to a `<canvas>`.

## How memory layout works

The WASM module uses one contiguous linear-memory block that starts at byte offset `1024`.

Region order:
- `FRAME` (RGBA pixel buffer)
- `INPUT` (control bytes written by JS)
- `STATE` (telemetry integers written by WASM)

Current layout (from `assembly/index.ts`):

| Region | Start | End (exclusive) | Size | Producer | Consumer |
| --- | ---: | ---: | ---: | --- | --- |
| FRAME | 1024 | 65024 | 64000 bytes | WASM | JS |
| INPUT | 65024 | 65040 | 16 bytes | JS | WASM |
| STATE | 65040 | 65056 | 16 bytes | WASM | JS |

Notes:
- Framebuffer is `160 x 100 x 4` bytes (`RGBA8`), so `64000` bytes total.
- `INPUT` currently uses these byte indices: `0=left up`, `1=left down`, `2=right up`, `3=right down`.
- `STATE` stores 4 little-endian `i32` values: `ballX`, `ballY`, `leftY`, `rightY`.

Per animation frame in `index.html`:
1. JS writes current key states into `INPUT`.
2. JS calls `tick()` (WASM reads input, updates simulation, writes `STATE`).
3. JS calls `render()` (WASM writes pixels into `FRAME`).
4. JS reads `STATE` for debug text and copies `FRAME` to `<canvas>`.

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Build

Compile both debug and release WASM targets:

```bash
npm run asbuild
```

Available build scripts:
- `npm run asbuild:debug`
- `npm run asbuild:release`

Build output is written to `build/`.

## Run locally

Start a static server:

```bash
npm start
```

Then open the local URL shown by `serve` (usually <http://localhost:3000>). The page loads `build/release.wasm`.

## Controls

- Left paddle: `W` / `S`
- Right paddle: `ArrowUp` / `ArrowDown`

## Test

```bash
npm test
```

Current test coverage is intentionally small and includes smoke checks for:
- exported dimensions (`width`, `height`)
- contiguous lane layout (`FRAME -> INPUT -> STATE`)
- lane bounds fitting inside WASM memory

## Project layout

- `assembly/index.ts`: AssemblyScript module (simulation + memory lanes + rendering)
- `index.html`: Browser host and game loop
- `build/`: generated JS bindings, WASM binaries, and WAT output
- `test/index.js`: node test for generated debug bindings
- `asconfig.json`: AssemblyScript build target config
