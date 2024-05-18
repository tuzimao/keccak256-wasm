import { INPUT_ERROR } from "./constants";

// 检查是否为数组
export function isArray(obj: any): bool {
  return Object.prototype.toString.call(obj) === "[object Array]";
}

// 检查是否为视图
export function isView(obj: any): bool {
  return (
    typeof obj === "object" && obj.buffer && obj.buffer instanceof ArrayBuffer
  );
}

// 格式化消息为字符串
function formatMessageString(message: string): StaticArray<any> {
  return [message, true];
}

// 格式化消息为Uint8Array
function formatMessageUint8Array(message: Uint8Array): StaticArray<any> {
  return [message, false];
}

// 格式化消息
export function formatMessageStringWrapper(message: string): StaticArray<any> {
  return formatMessageString(message);
}

export function formatMessageUint8ArrayWrapper(
  message: Uint8Array
): StaticArray<any> {
  return formatMessageUint8Array(message);
}

// 检查字符串是否为空
function emptyString(message: string): bool {
  return formatMessageString(message)[0].length === 0;
}

// 检查Uint8Array是否为空
function emptyUint8Array(message: Uint8Array): bool {
  return formatMessageUint8Array(message)[0].length === 0;
}

// 检查消息是否为空
export function emptyStringWrapper(message: string): bool {
  return emptyString(message);
}

export function emptyUint8ArrayWrapper(message: Uint8Array): bool {
  return emptyUint8Array(message);
}

// 克隆Uint32Array
export function cloneArray(array: Uint32Array): Uint32Array {
  const newArray = new Uint32Array(array.length);
  for (let i = 0; i < array.length; ++i) {
    newArray[i] = array[i];
  }
  return newArray;
}
