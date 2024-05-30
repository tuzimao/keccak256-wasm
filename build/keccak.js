async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    keccak_256(message) {
      // assembly/keccak1/keccak_256(~lib/string/String) => ~lib/string/String
      message = __lowerString(message) || __notnull();
      return __liftString(exports.keccak_256(message) >>> 0);
    },
    getBlocks() {
      // assembly/keccak1/getBlocks() => ~lib/typedarray/Uint32Array
      return __liftTypedArray(Uint32Array, exports.getBlocks() >>> 0);
    },
    testFormatStringMessage(message) {
      // assembly/keccak1/testFormatStringMessage(~lib/string/String) => ~lib/typedarray/Uint32Array
      message = __lowerString(message) || __notnull();
      return __liftTypedArray(Uint32Array, exports.testFormatStringMessage(message) >>> 0);
    },
    testUpdateString(message) {
      // assembly/keccak1/testUpdateString(~lib/string/String) => ~lib/typedarray/Uint32Array
      message = __lowerString(message) || __notnull();
      return __liftTypedArray(Uint32Array, exports.testUpdateString(message) >>> 0);
    },
    debug_blockCount(message) {
      // assembly/keccak1/debug_blockCount(~lib/string/String) => u32
      message = __lowerString(message) || __notnull();
      return exports.debug_blockCount(message) >>> 0;
    },
    debug_byteCount(message) {
      // assembly/keccak1/debug_byteCount(~lib/string/String) => u32
      message = __lowerString(message) || __notnull();
      return exports.debug_byteCount(message) >>> 0;
    },
    testblocks0(message) {
      // assembly/keccak1/testblocks0(~lib/string/String) => ~lib/typedarray/Uint32Array
      message = __lowerString(message) || __notnull();
      return __liftTypedArray(Uint32Array, exports.testblocks0(message) >>> 0);
    },
    testblocks1(message) {
      // assembly/keccak1/testblocks1(~lib/string/String) => ~lib/typedarray/Uint32Array
      message = __lowerString(message) || __notnull();
      return __liftTypedArray(Uint32Array, exports.testblocks1(message) >>> 0);
    },
    testblocks2(message) {
      // assembly/keccak1/testblocks2(~lib/string/String) => ~lib/typedarray/Uint32Array
      message = __lowerString(message) || __notnull();
      return __liftTypedArray(Uint32Array, exports.testblocks2(message) >>> 0);
    },
    testFinalize(message) {
      // assembly/keccak1/testFinalize(~lib/string/String) => ~lib/typedarray/Uint32Array
      message = __lowerString(message) || __notnull();
      return __liftTypedArray(Uint32Array, exports.testFinalize(message) >>> 0);
    },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __lowerString(value) {
    if (value == null) return 0;
    const
      length = value.length,
      pointer = exports.__new(length << 1, 2) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  function __liftTypedArray(constructor, pointer) {
    if (!pointer) return null;
    return new constructor(
      memory.buffer,
      __getU32(pointer + 4),
      __dataview.getUint32(pointer + 8, true) / constructor.BYTES_PER_ELEMENT
    ).slice();
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __getU32(pointer) {
    try {
      return __dataview.getUint32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint32(pointer, true);
    }
  }
  return adaptedExports;
}
export const {
  memory,
  keccak_256,
  getBlocks,
  testFormatStringMessage,
  testUpdateString,
  debug_blockCount,
  debug_byteCount,
  testblocks0,
  testblocks1,
  testblocks2,
  testFinalize,
} = await (async url => instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {
  }
))(new URL("keccak.wasm", import.meta.url));
