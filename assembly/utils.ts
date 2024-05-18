import { INPUT_ERROR, ARRAY_BUFFER } from "./constants";

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

// 新增的函数
export function formatMessage(
  message: string | Uint8Array | ArrayBuffer | null
): StaticArray<any> {
  let type = typeof message;
  if (type === "string") {
    return formatMessageString(message as string);
  }
  if (type !== "object" || message === null) {
    throw new Error(INPUT_ERROR);
  }
  if (ARRAY_BUFFER && (message as ArrayBuffer).constructor === ArrayBuffer) {
    return formatMessageUint8Array(new Uint8Array(message as ArrayBuffer));
  }
  if (!isArray(message) && !isView(message)) {
    throw new Error(INPUT_ERROR);
  }
  return [message, false];
}

// 新增的函数
export function empty(message: string | Uint8Array | ArrayBuffer | null): bool {
  return (formatMessage(message)[0] as string | Uint8Array).length === 0;
}

// 克隆Uint32Array
export function cloneArray(array: Uint32Array): Uint32Array {
  const newArray = new Uint32Array(array.length);
  for (let i = 0; i < array.length; ++i) {
    newArray[i] = array[i];
  }
  return newArray;
}

// 泛型克隆数组
export function cloneArrayGeneric<T>(array: StaticArray<T>): StaticArray<T> {
  let newArray = new StaticArray<T>(array.length);
  for (let i = 0; i < array.length; ++i) {
    unchecked((newArray[i] = array[i]));
  }
  return newArray;
}
