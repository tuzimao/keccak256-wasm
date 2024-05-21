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
    formatMessageStringWrapper(message) {
      // assembly/keccak/formatMessageStringWrapper(~lib/string/String) => ~lib/staticarray/StaticArray<~lib/string/String>
      message = __lowerString(message) || __notnull();
      return __liftStaticArray(pointer => __liftString(__getU32(pointer)), 2, exports.formatMessageStringWrapper(message) >>> 0);
    },
    formatMessageUint8ArrayWrapper(message) {
      // assembly/keccak/formatMessageUint8ArrayWrapper(~lib/typedarray/Uint8Array) => ~lib/staticarray/StaticArray<~lib/typedarray/Uint8Array>
      message = __lowerTypedArray(Uint8Array, 13, 0, message) || __notnull();
      return __liftStaticArray(pointer => __liftTypedArray(Uint8Array, __getU32(pointer)), 2, exports.formatMessageUint8ArrayWrapper(message) >>> 0);
    },
    emptyStringWrapper(message) {
      // assembly/keccak/emptyStringWrapper(~lib/string/String) => bool
      message = __lowerString(message) || __notnull();
      return exports.emptyStringWrapper(message) != 0;
    },
    emptyUint8ArrayWrapper(message) {
      // assembly/keccak/emptyUint8ArrayWrapper(~lib/typedarray/Uint8Array) => bool
      message = __lowerTypedArray(Uint8Array, 13, 0, message) || __notnull();
      return exports.emptyUint8ArrayWrapper(message) != 0;
    },
    updateKeccakWithString(message) {
      // assembly/keccak/updateKeccakWithString(~lib/string/String) => void
      message = __lowerString(message) || __notnull();
      exports.updateKeccakWithString(message);
    },
    updateKeccakWithUint8Array(message) {
      // assembly/keccak/updateKeccakWithUint8Array(~lib/typedarray/Uint8Array) => void
      message = __lowerTypedArray(Uint8Array, 13, 0, message) || __notnull();
      exports.updateKeccakWithUint8Array(message);
    },
    keccakToHex() {
      // assembly/keccak/keccakToHex() => ~lib/string/String
      return __liftString(exports.keccakToHex() >>> 0);
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
  function __lowerTypedArray(constructor, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__new(12, id) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    new constructor(memory.buffer, buffer, length).set(values);
    exports.__unpin(buffer);
    return header;
  }
  function __liftStaticArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      length = __getU32(pointer - 4) >>> align,
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(pointer + (i << align >>> 0));
    return values;
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __setU32(pointer, value) {
    try {
      __dataview.setUint32(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setUint32(pointer, value, true);
    }
  }
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
  formatMessageStringWrapper,
  formatMessageUint8ArrayWrapper,
  emptyStringWrapper,
  emptyUint8ArrayWrapper,
  createKeccak,
  updateKeccakWithString,
  updateKeccakWithUint8Array,
  finalizeKeccak,
  keccakToHex,
} = await (async url => instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {
  }
))(new URL("keccak.wasm", import.meta.url));
