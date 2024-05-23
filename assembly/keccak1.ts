import {
    INPUT_ERROR,
    FINALIZE_ERROR,
    WINDOW,
    root,
    WEB_WORKER,
    NODE_JS,
    COMMON_JS,
    AMD,
    ARRAY_BUFFER,
    HEX_CHARS,
    SHAKE_PADDING,
    CSHAKE_PADDING,
    KECCAK_PADDING,
    PADDING,
    SHIFT,
    RC,
    BITS,
    SHAKE_BITS,
    OUTPUT_TYPES,
    CSHAKE_BYTEPAD
  } from "./constants1";

  import {
    formatStringMessage,formatUint8ArrayMessage,formatArrayBufferMessage, cloneArray, createOutputMethod, createShakeOutputMethod,
    createCshakeOutputMethod, createKmacOutputMethod, createOutputMethods, createMethod,
    createShakeMethod, createCshakeMethod, createKmacMethod, algorithms, methods, methodNames
  } from "./method1";
  import { MessageFormat } from "./types";

class Keccak {
  private blocks: Uint32Array;
  private s: Uint32Array;
  private padding: StaticArray<u32>;
  private outputBits: i32;
  private reset: bool;
  private finalized: bool;
  private block: i32;
  private start: i32;
  private blockCount: i32;
  private byteCount: i32;
  private outputBlocks: i32;
  private extraBytes: i32;
  private lastByteIndex: i32;

  constructor(bits: i32, padding: StaticArray<u32>, outputBits: i32) {
    this.blocks = new Uint32Array(50);
    this.s = new Uint32Array(50);
    this.padding = padding;
    this.outputBits = outputBits;
    this.reset = true;
    this.finalized = false;
    this.block = 0;
    this.start = 0;
    this.blockCount = (1600 - (bits << 1)) >> 5;
    this.byteCount = this.blockCount << 2;
    this.outputBlocks = outputBits >> 5;
    this.extraBytes = (outputBits & 31) >> 3;

    for (let i = 0; i < 50; ++i) {
      this.s[i] = 0;
    }
  }

  updateString(message: string): Keccak {
    if (this.finalized) {
      throw new Error(FINALIZE_ERROR);
    }

    const msg = formatMessage(message);
    const blocks = this.blocks;
    const byteCount = this.byteCount;
    const length = msg.length;
    const blockCount = this.blockCount;
    let index = 0;
    let s = this.s;
    let i: i32;
    let code: i32;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }

      for (i = this.start; index < length && i < byteCount; ++index) {
        code = msg[index];
        if (code < 0x80) {
          blocks[i >> 2] |= code << SHIFT[i & 3];
        } else if (code < 0x800) {
          blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i & 3];
        } else if (code < 0xd800 || code >= 0xe000) {
          blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i & 3];
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (msg[++index] & 0x3ff));
          blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i & 3];
        }
      }

      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        f(s);
        this.reset = true;
      } else {
        this.start = i;
      }
    }
    return this;
  }

  updateUint8Array(message: Uint8Array): Keccak {
    if (this.finalized) {
      throw new Error(FINALIZE_ERROR);
    }

    const blocks = this.blocks;
    const byteCount = this.byteCount;
    const length = message.length;
    const blockCount = this.blockCount;
    let index = 0;
    let s = this.s;
    let i: i32;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }

      for (i = this.start; index < length && i < byteCount; ++index) {
        blocks[i >> 2] |= message[index] << SHIFT[i & 3];
      }

      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        f(s);
        this.reset = true;
      } else {
        this.start = i;
      }
    }
    return this;
  }

  encode(x: i32, right: bool): i32 {
    let o = x & 255;
    let n = 1;
    let bytes: u8[] = [o];
    x = x >> 8;
    o = x & 255;

    while (o > 0) {
      // 使用新的数组存储字节
      let newBytes: u8[] = [o];
      newBytes.push(...bytes);
      bytes = newBytes;

      x = x >> 8;
      o = x & 255;
      ++n;
    }

    if (right) {
      bytes.push(n);
    } else {
      // 使用新的数组存储长度
      let newBytes: u8[] = [n];
      newBytes.push(...bytes);
      bytes = newBytes;
    }

    this.updateUint8Array(new Uint8Array(bytes));
    return bytes.length;
  }

  encodeString(str: string): i32 {
    const result = formatStringMessage(str);
    const msg = result[0];
    const isString = result[1];
    let bytes = 0;
    const length = msg.length;

    if (isString) {
      for (let i = 0; i < msg.length; ++i) {
        let code = msg[i];
        if (code < 0x80) {
          bytes += 1;
        } else if (code < 0x800) {
          bytes += 2;
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes += 3;
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (msg[++i] & 0x3ff));
          bytes += 4;
        }
      }
    } else {
      bytes = length;
    }

    bytes += this.encode(bytes * 8, false);
    this.updateUint8Array(msg);
    return bytes;
  }

  bytepad(strs: Array<string>, w: u32): Keccak {
    let bytes = this.encode(w as i32, false);
    for (let i = 0; i < strs.length; ++i) {
      bytes += this.encodeString(strs[i]);
    }
    let paddingBytes = (w - bytes % w) % w;
    let zeros = new Uint8Array(paddingBytes);
    this.updateUint8Array(zeros);
    return this;
  }

  finalize(): void {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    let blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
    blocks[i >> 2] |= this.padding[i & 3];
    if (this.lastByteIndex === this.byteCount) {
      blocks[0] = blocks[blockCount];
      for (i = 1; i < blockCount + 1; ++i) {
        blocks[i] = 0;
      }
    }
    blocks[blockCount - 1] |= 0x80000000;
    for (i = 0; i < blockCount; ++i) {
      s[i] ^= blocks[i];
    }
    this.f(s);
  }

  hex(): string {
    this.finalize();

    let blockCount = this.blockCount;
    let s = this.s;
    let outputBlocks = this.outputBlocks;
    let extraBytes = this.extraBytes;
    let i = 0, j = 0;
    let hex = '';
    let block: u32;

    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        block = s[i];
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
               HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
               HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
               HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
      }
      if (j % blockCount === 0) {
        s = cloneArray(s);
        f(s);
        i = 0;
      }
    }
    if (extraBytes > 0) {
      block = s[i];
      hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
      if (extraBytes > 1) {
        hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
      }
      if (extraBytes > 2) {
        hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
      }
    }
    return hex;
  }

  arrayBuffer(): ArrayBuffer {
    this.finalize();

    let blockCount = this.blockCount;
    let s = this.s;
    let outputBlocks = this.outputBlocks;
    let extraBytes = this.extraBytes;
    let i = 0, j = 0;
    let bytes = this.outputBits >> 3;
    let buffer: ArrayBuffer;
    
    if (extraBytes > 0) {
      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
    } else {
      buffer = new ArrayBuffer(bytes);
    }
    
    let array = new Uint32Array(buffer);
    
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        array[j] = s[i];
      }
      if (j % blockCount === 0) {
        s = cloneArray(s);
        f(s);
      }
    }
    
    if (extraBytes > 0) {
      array[j] = s[i];
      buffer = buffer.slice(0, bytes);
    }
    
    return buffer;
  }

  array(): Array<u32> {
    this.finalize();

    let blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
      extraBytes = this.extraBytes, i = 0, j = 0;
    let array = new Array<u32>(), offset: u32, block: u32;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        offset = j << 2;
        block = s[i];
        array[offset] = block & 0xFF;
        array[offset + 1] = (block >> 8) & 0xFF;
        array[offset + 2] = (block >> 16) & 0xFF;
        array[offset + 3] = (block >> 24) & 0xFF;
      }
      if (j % blockCount == 0) {
        s = cloneArray(s);
        this.f(s);
      }
    }
    if (extraBytes) {
      offset = j << 2;
      block = s[i];
      array[offset] = block & 0xFF;
      if (extraBytes > 1) {
        array[offset + 1] = (block >> 8) & 0xFF;
      }
      if (extraBytes > 2) {
        array[offset + 2] = (block >> 16) & 0xFF;
      }
    }
    return array;
  }

  f(s: Array<u32>): void {
    // Keccak-f implementation goes here
  }
}

export let keccakInstance: Keccak | null = null;

export function createKeccak(bits: i32): void {
  const padding: StaticArray<u32> = new StaticArray<u32>(4);
  padding[0] = 0x01;
  padding[1] = 0x01;
  padding[2] = 0x01;
  padding[3] = 0x01;
  keccakInstance = new Keccak(bits, padding, bits);
}

export function updateKeccakWithString(message: string): void {
  if (keccakInstance !== null) {
    (keccakInstance as Keccak).updateString(message);
  }
}

export function updateKeccakWithUint8Array(message: Uint8Array): void {
  if (keccakInstance !== null) {
    (keccakInstance as Keccak).updateUint8Array(message);
  }
}

export function finalizeKeccak(): void {
  if (keccakInstance !== null) {
    (keccakInstance as Keccak).finalize();
  }
}

export function keccakToHex(): string {
  if (keccakInstance !== null) {
    return (keccakInstance as Keccak).hex();
  }
  return "";
}
