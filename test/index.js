import assert from "node:assert/strict";
import { it } from "node:test";
import {
  height,
  width,
  framePtr,
  frameLen,
  frameEnd,
  inputPtr,
  inputLen,
  inputEnd,
  statePtr,
  stateLen,
  stateEnd,
  memory,
} from "../build/debug.js";

it("exports expected dimensions", () => {
  assert.equal(width(), 160);
  assert.equal(height(), 100);
});

it("memory lanes are contiguous and sized correctly", () => {
  assert.equal(frameLen(), 160 * 100 * 4);
  assert.equal(inputLen(), 16);
  assert.equal(stateLen(), 16);

  assert.equal(framePtr(), 1024);
  assert.equal(frameEnd(), framePtr() + frameLen());
  assert.equal(inputPtr(), frameEnd());
  assert.equal(inputEnd(), inputPtr() + inputLen());
  assert.equal(statePtr(), inputEnd());
  assert.equal(stateEnd(), statePtr() + stateLen());
});

it("state lane fits inside wasm memory", () => {
  assert.ok(memory.buffer.byteLength >= stateEnd());
});
