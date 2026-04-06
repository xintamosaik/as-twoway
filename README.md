# ass

Tiny AssemblyScript + WebAssembly playground that renders a minimal Pong-like scene in a browser.

The project demonstrates a simple shared-memory protocol between JavaScript and WASM:
- JavaScript writes input bytes.
- WASM updates game state.
- WASM writes RGBA pixels to a framebuffer.
- JavaScript reads state + framebuffer and draws to a `<canvas>`.

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

Current test coverage is intentionally small and includes a basic exported function check.

## Project layout

- `assembly/index.ts`: AssemblyScript module (simulation + memory lanes + rendering)
- `index.html`: Browser host and game loop
- `build/`: generated JS bindings, WASM binaries, and WAT output
- `test/index.js`: node test for generated debug bindings
- `asconfig.json`: AssemblyScript build target config
