import { Keccak, Kmac } from "./keccak";
import {
  KECCAK_PADDING,
  PADDING,
  SHAKE_PADDING,
  CSHAKE_PADDING,
  BITS,
  SHAKE_BITS,
  CSHAKE_BYTEPAD,
  OUTPUT_TYPES,
} from "./constants";
import { empty } from "./utils";

function createOutputMethod(bits: i32, padding: u32, outputType: string) {
  return function (message: string): string {
    return new Keccak(bits, padding, bits).update(message)[outputType]();
  };
}

function createShakeOutputMethod(bits: i32, padding: u32, outputType: string) {
  return function (message: string, outputBits: i32): string {
    return new Keccak(bits, padding, outputBits).update(message)[outputType]();
  };
}

function createCshakeOutputMethod(bits: i32, padding: u32, outputType: string) {
  return function (
    message: string,
    outputBits: i32,
    n: string,
    s: string
  ): string {
    return methods["cshake" + bits]
      .update(message, outputBits, n, s)
      [outputType]();
  };
}

function createKmacOutputMethod(bits: i32, padding: u32, outputType: string) {
  return function (
    key: string,
    message: string,
    outputBits: i32,
    s: string
  ): string {
    return methods["kmac" + bits]
      .update(key, message, outputBits, s)
      [outputType]();
  };
}

function createOutputMethods(
  method: any,
  createMethod: any,
  bits: i32,
  padding: u32
) {
  for (let i = 0; i < OUTPUT_TYPES.length; ++i) {
    const type = OUTPUT_TYPES[i];
    method[type] = createMethod(bits, padding, type);
  }
  return method;
}

function createMethod(bits: i32, padding: u32) {
  const method = createOutputMethod(bits, padding, "hex");
  method.create = function () {
    return new Keccak(bits, padding, bits);
  };
  method.update = function (message: string) {
    return method.create().update(message);
  };
  return createOutputMethods(method, createOutputMethod, bits, padding);
}

function createShakeMethod(bits: i32, padding: u32) {
  const method = createShakeOutputMethod(bits, padding, "hex");
  method.create = function (outputBits: i32) {
    return new Keccak(bits, padding, outputBits);
  };
  method.update = function (message: string, outputBits: i32) {
    return method.create(outputBits).update(message);
  };
  return createOutputMethods(method, createShakeOutputMethod, bits, padding);
}

function createCshakeMethod(bits: i32, padding: u32) {
  const w = CSHAKE_BYTEPAD[bits];
  const method = createCshakeOutputMethod(bits, padding, "hex");
  method.create = function (outputBits: i32, n: string, s: string) {
    if (empty(n) && empty(s)) {
      return methods["shake" + bits].create(outputBits);
    } else {
      return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
    }
  };
  method.update = function (
    message: string,
    outputBits: i32,
    n: string,
    s: string
  ) {
    return method.create(outputBits, n, s).update(message);
  };
  return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
}

function createKmacMethod(bits: i32, padding: u32) {
  const w = CSHAKE_BYTEPAD[bits];
  const method = createKmacOutputMethod(bits, padding, "hex");
  method.create = function (key: string, outputBits: i32, s: string) {
    return new Kmac(bits, padding, outputBits)
      .bytepad(["KMAC", s], w)
      .bytepad([key], w);
  };
  method.update = function (
    key: string,
    message: string,
    outputBits: i32,
    s: string
  ) {
    return method.create(key, outputBits, s).update(message);
  };
  return createOutputMethods(method, createKmacOutputMethod, bits, padding);
}

const algorithms = [
  {
    name: "keccak",
    padding: KECCAK_PADDING,
    bits: BITS,
    createMethod: createMethod,
  },
  { name: "sha3", padding: PADDING, bits: BITS, createMethod: createMethod },
  {
    name: "shake",
    padding: SHAKE_PADDING,
    bits: SHAKE_BITS,
    createMethod: createShakeMethod,
  },
  {
    name: "cshake",
    padding: CSHAKE_PADDING,
    bits: SHAKE_BITS,
    createMethod: createCshakeMethod,
  },
  {
    name: "kmac",
    padding: CSHAKE_PADDING,
    bits: SHAKE_BITS,
    createMethod: createKmacMethod,
  },
];

const methods: any = {};
const methodNames: string[] = [];

for (let i = 0; i < algorithms.length; ++i) {
  const algorithm = algorithms[i];
  const bits = algorithm.bits;
  for (let j = 0; j < bits.length; ++j) {
    const methodName = algorithm.name + "_" + bits[j];
    methodNames.push(methodName);
    methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
    if (algorithm.name !== "sha3") {
      const newMethodName = algorithm.name + bits[j];
      methodNames.push(newMethodName);
      methods[newMethodName] = methods[methodName];
    }
  }
}

export { methods, methodNames };
