import { INPUT_ERROR, ARRAY_BUFFER, OUTPUT_TYPES, HEX_CHARS, SHAKE_PADDING, CSHAKE_PADDING, KECCAK_PADDING, PADDING, SHIFT, RC, BITS, SHAKE_BITS, CSHAKE_BYTEPAD } from "./constants1";
import { Keccak } from "./keccak1";
import { MessageFormat } from "./types";

// 判断是否是数组
export function isArray(obj: any): bool {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

// 判断是否是视图
export function isView(obj: any): bool {
  return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
}

// 格式化消息
export function formatMessage(message: any): MessageFormat {
  const type: string = typeof message;
  if (type === 'string') {
    return [message, true];
  }
  if (type !== 'object' || message === null) {
    throw new Error(INPUT_ERROR);
  }
  if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
    return [new Uint8Array(message), false];
  }
  if (!isArray(message) && !isView(message)) {
    throw new Error(INPUT_ERROR);
  }
  return [message, false];
}

// 判断消息是否为空
export function empty(message: any): bool {
  return (formatMessage(message)[0] as Uint8Array).length === 0;
}

// 克隆数组
export function cloneArray(array: Uint8Array): Uint8Array {
  const newArray = new Uint8Array(array.length);
  for (let i = 0; i < array.length; ++i) {
    newArray[i] = array[i];
  }
  return newArray;
}

// 创建输出方法
export function createOutputMethod(bits: i32, padding: u32[], outputType: string): (message: any) => any {
  return (message: any): any => {
    return new Keccak(bits, padding, bits).update(message)[outputType]();
  };
}

// 创建 Shake 输出方法
export function createShakeOutputMethod(bits: i32, padding: u32[], outputType: string): (message: any, outputBits: i32) => any {
  return (message: any, outputBits: i32): any => {
    return new Keccak(bits, padding, outputBits).update(message)[outputType]();
  };
}

// 创建 Cshake 输出方法
export function createCshakeOutputMethod(bits: i32, padding: u32[], outputType: string): (message: any, outputBits: i32, n: string, s: string) => any {
  return (message: any, outputBits: i32, n: string, s: string): any => {
    return methods.get('cshake' + bits)!.update(message, outputBits, n, s)[outputType]();
  };
}

// 创建 Kmac 输出方法
export function createKmacOutputMethod(bits: i32, padding: u32[], outputType: string): (key: any, message: any, outputBits: i32, s: string) => any {
  return (key: any, message: any, outputBits: i32, s: string): any => {
    return methods.get('kmac' + bits)!.update(key, message, outputBits, s)[outputType]();
  };
}

// 创建输出方法集合
export function createOutputMethods(method: any, createMethod: (bits: i32, padding: u32[], outputType: string) => any, bits: i32, padding: u32[]): any {
  for (let i = 0; i < OUTPUT_TYPES.length; ++i) {
    const type = OUTPUT_TYPES[i];
    method[type] = createMethod(bits, padding, type);
  }
  return method;
}

// 创建方法
export function createMethod(bits: i32, padding: u32[]): any {
  const method = createOutputMethod(bits, padding, 'hex');
  method.create = (): Keccak => {
    return new Keccak(bits, padding, bits);
  };
  method.update = (message: any): any => {
    return method.create().update(message);
  };
  return createOutputMethods(method, createOutputMethod, bits, padding);
}

// 创建 Shake 方法
export function createShakeMethod(bits: i32, padding: u32[]): any {
  const method = createShakeOutputMethod(bits, padding, 'hex');
  method.create = (outputBits: i32): Keccak => {
    return new Keccak(bits, padding, outputBits);
  };
  method.update = (message: any, outputBits: i32): any => {
    return method.create(outputBits).update(message);
  };
  return createOutputMethods(method, createShakeOutputMethod, bits, padding);
}

// 创建 Cshake 方法
export function createCshakeMethod(bits: i32, padding: u32[]): any {
  const w = CSHAKE_BYTEPAD.get(bits.toString())!;
  const method = createCshakeOutputMethod(bits, padding, 'hex');
  method.create = (outputBits: i32, n: string, s: string): Keccak => {
    if (empty(n) && empty(s)) {
      return methods.get('shake' + bits)!.create(outputBits);
    } else {
      return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
    }
  };
  method.update = (message: any, outputBits: i32, n: string, s: string): any => {
    return method.create(outputBits, n, s).update(message);
  };
  return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
}

// 创建 Kmac 方法
export function createKmacMethod(bits: i32, padding: u32[]): any {
  const w = CSHAKE_BYTEPAD.get(bits.toString())!;
  const method = createKmacOutputMethod(bits, padding, 'hex');
  method.create = (key: any, outputBits: i32, s: string): any => {
    return new Kmac(bits, padding, outputBits).bytepad(['KMAC', s], w).bytepad([key], w);
  };
  method.update = (key: any, message: any, outputBits: i32, s: string): any => {
    return method.create(key, outputBits, s).update(message);
  };
  return createOutputMethods(method, createKmacOutputMethod, bits, padding);
}

// 定义算法集合
export const algorithms = [
  { name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod },
  { name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod },
  { name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod },
  { name: 'cshake', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createCshakeMethod },
  { name: 'kmac', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createKmacMethod }
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
