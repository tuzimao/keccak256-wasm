import { INPUT_ERROR, FINALIZE_ERROR, HEX_CHARS, KECCAK_PADDING, SHIFT, RC, BITS, OUTPUT_TYPES } from "./constants1";
import { Keccak } from "./keccak1";
import { StringMessageFormat, Uint8ArrayMessageFormat } from "./types";

// 格式化消息（字符串）
export function formatStringMessage(message: string): StringMessageFormat {
  const msg = new Uint8Array(message.length);
  for (let i = 0; i < message.length; i++) {
    msg[i] = message.charCodeAt(i);
  }
  return new StringMessageFormat(msg, true);
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

// 创建输出方法
export function createOutputMethod(bits: i32, padding: u32[], outputType: string): (message: string) => string {
  return (message: string): string => {
    const keccak = new Keccak(bits, padding, bits);
    keccak.updateString(message);
    return keccak[outputType]();
  };
}

// 创建输出方法集合
export function createOutputMethods(method: any, createMethod: (bits: i32, padding: u32[], outputType: string) => (message: string) => string, bits: i32, padding: u32[]): any {
  for (let i = 0; i < OUTPUT_TYPES.length; ++i) {
    const type = OUTPUT_TYPES[i];
    method[type] = createMethod(bits, padding, type);
  }
  return method;
}

// 创建方法
export function createMethod(bits: i32, padding: u32[]): any {
  const method: any = createOutputMethod(bits, padding, 'hex');
  method.create = (): Keccak => {
    return new Keccak(bits, padding, bits);
  };
  method.update = (message: string): any => {
    return method.create().updateString(message);
  };
  return createOutputMethods(method, createOutputMethod, bits, padding);
}

// 定义算法集合类型
class Algorithm {
  constructor(
    public name: string,
    public padding: u32[],
    public bits: u32[],
    public createMethod: (bits: i32, padding: u32[]) => any
  ) {}
}

// 定义算法集合
export const algorithms: Algorithm[] = [
  new Algorithm('keccak', KECCAK_PADDING, BITS, createMethod)
];

// 初始化方法和方法名
export const methods: Map<string, any> = new Map<string, any>();
export const methodNames: string[] = [];

for (let i = 0; i < algorithms.length; ++i) {
  const algorithm = algorithms[i];
  const bits = algorithm.bits;
  for (let j = 0; j < bits.length; ++j) {
    const methodName = algorithm.name + '_' + bits[j].toString();
    methodNames.push(methodName);
    methods.set(methodName, algorithm.createMethod(bits[j], algorithm.padding));
    if (algorithm.name !== 'sha3') {
      const newMethodName = algorithm.name + bits[j].toString();
      methodNames.push(newMethodName);
      methods.set(newMethodName, methods.get(methodName));
    }
  }
}
