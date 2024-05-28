import { INPUT_ERROR, FINALIZE_ERROR, HEX_CHARS, KECCAK_PADDING, SHIFT, RC, BITS, OUTPUT_TYPES } from "./constants1";
import {  Uint8ArrayMessageFormat } from "./types";

// 格式化消息（字符串）
export function formatStringMessage(message: string): Uint32Array {
  const msg = new Uint32Array(message.length);
  for (let i = 0; i < message.length; i++) {
    msg[i] = message.charCodeAt(i);
  }
  return msg;
}


// 格式化消息（Uint8Array）
export function formatUint8ArrayMessage(message: Uint8Array): Uint8ArrayMessageFormat {
  return new Uint8ArrayMessageFormat(message, false);
}

// 克隆数组
export function cloneArray(array: Uint32Array): Uint32Array {
  const newArray = new Uint32Array(array.length);
  for (let i = 0; i < array.length; ++i) {
    newArray[i] = array[i];
  }
  return newArray;
}
