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

  buffer(): ArrayBuffer {
    return this.arrayBuffer();
  }

  array(): u8[] {
    this.finalize();

    let blockCount = this.blockCount;
    let s = this.s;
    let outputBlocks = this.outputBlocks;
    let extraBytes = this.extraBytes;
    let i = 0, j = 0;
    let array: u8[] = [];
    let offset: i32, block: u32;

    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        offset = j << 2;
        block = s[i];
        array[offset] = <u8>(block & 0xFF);
        array[offset + 1] = <u8>((block >> 8) & 0xFF);
        array[offset + 2] = <u8>((block >> 16) & 0xFF);
        array[offset + 3] = <u8>((block >> 24) & 0xFF);
      }
      if (j % blockCount === 0) {
        s = cloneArray(s);
        f(s);
      }
    }
    if (extraBytes > 0) {
      offset = j << 2;
      block = s[i];
      array[offset] = <u8>(block & 0xFF);
      if (extraBytes > 1) {
        array[offset + 1] = <u8>((block >> 8) & 0xFF);
      }
      if (extraBytes > 2) {
        array[offset + 2] = <u8>((block >> 16) & 0xFF);
      }
    }
    return array;
  }

  f(s: Uint32Array): void{
    let h: i32,
      l: i32,
      n: i32,
      c0: i32,
      c1: i32,
      c2: i32,
      c3: i32,
      c4: i32,
      c5: i32,
      c6: i32,
      c7: i32,
      c8: i32,
      c9: i32;
    let b0: i32,
      b1: i32,
      b2: i32,
      b3: i32,
      b4: i32,
      b5: i32,
      b6: i32,
      b7: i32,
      b8: i32,
      b9: i32;
    let b10: i32,
      b11: i32,
      b12: i32,
      b13: i32,
      b14: i32,
      b15: i32,
      b16: i32,
      b17: i32,
      b18: i32,
      b19: i32;
    let b20: i32,
      b21: i32,
      b22: i32,
      b23: i32,
      b24: i32,
      b25: i32,
      b26: i32,
      b27: i32,
      b28: i32,
      b29: i32;
    let b30: i32,
      b31: i32,
      b32: i32,
      b33: i32,
      b34: i32,
      b35: i32,
      b36: i32,
      b37: i32,
      b38: i32,
      b39: i32;
    let b40: i32,
      b41: i32,
      b42: i32,
      b43: i32,
      b44: i32,
      b45: i32,
      b46: i32,
      b47: i32,
      b48: i32,
      b49: i32;

    for (n = 0; n < 48; n += 2) {
      c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
      c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
      c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
      c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
      c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
      c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
      c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
      c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
      c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
      c9 = s[9] ^ s[19] ^ s[29] ^ s[39];

      h = c8 ^ ((c2 << 1) | (c3 >>> 31));
      l = c9 ^ ((c3 << 1) | (c2 >>> 31));
      s[0] ^= h;
      s[1] ^= l;
      s[10] ^= h;
      s[11] ^= l;
      s[20] ^= h;
      s[21] ^= l;
      s[30] ^= h;
      s[31] ^= l;
      s[40] ^= h;
      s[41] ^= l;
      h = c0 ^ ((c4 << 1) | (c5 >>> 31));
      l = c1 ^ ((c5 << 1) | (c4 >>> 31));
      s[2] ^= h;
      s[3] ^= l;
      s[12] ^= h;
      s[13] ^= l;
      s[22] ^= h;
      s[23] ^= l;
      s[32] ^= h;
      s[33] ^= l;
      s[42] ^= h;
      s[43] ^= l;
      h = c2 ^ ((c6 << 1) | (c7 >>> 31));
      l = c3 ^ ((c7 << 1) | (c6 >>> 31));
      s[4] ^= h;
      s[5] ^= l;
      s[14] ^= h;
      s[15] ^= l;
      s[24] ^= h;
      s[25] ^= l;
      s[34] ^= h;
      s[35] ^= l;
      s[44] ^= h;
      s[45] ^= l;
      h = c4 ^ ((c8 << 1) | (c9 >>> 31));
      l = c5 ^ ((c9 << 1) | (c8 >>> 31));
      s[6] ^= h;
      s[7] ^= l;
      s[16] ^= h;
      s[17] ^= l;
      s[26] ^= h;
      s[27] ^= l;
      s[36] ^= h;
      s[37] ^= l;
      s[46] ^= h;
      s[47] ^= l;
      h = c6 ^ ((c0 << 1) | (c1 >>> 31));
      l = c7 ^ ((c1 << 1) | (c0 >>> 31));
      s[8] ^= h;
      s[9] ^= l;
      s[18] ^= h;
      s[19] ^= l;
      s[28] ^= h;
      s[29] ^= l;
      s[38] ^= h;
      s[39] ^= l;
      s[48] ^= h;
      s[49] ^= l;

      b0 = s[0];
      b1 = s[1];
      b32 = (s[11] << 4) | (s[10] >>> 28);
      b33 = (s[10] << 4) | (s[11] >>> 28);
      b14 = (s[20] << 3) | (s[21] >>> 29);
      b15 = (s[21] << 3) | (s[20] >>> 29);
      b46 = (s[31] << 9) | (s[30] >>> 23);
      b47 = (s[30] << 9) | (s[31] >>> 23);
      b28 = (s[40] << 18) | (s[41] >>> 14);
      b29 = (s[41] << 18) | (s[40] >>> 14);
      b20 = (s[2] << 1) | (s[3] >>> 31);
      b21 = (s[3] << 1) | (s[2] >>> 31);
      b2 = (s[13] << 12) | (s[12] >>> 20);
      b3 = (s[12] << 12) | (s[13] >>> 20);
      b34 = (s[22] << 10) | (s[23] >>> 22);
      b35 = (s[23] << 10) | (s[22] >>> 22);
      b16 = (s[33] << 13) | (s[32] >>> 19);
      b17 = (s[32] << 13) | (s[33] >>> 19);
      b48 = (s[42] << 2) | (s[43] >>> 30);
      b49 = (s[43] << 2) | (s[42] >>> 30);
      b40 = (s[5] << 30) | (s[4] >>> 2);
      b41 = (s[4] << 30) | (s[5] >>> 2);
      b22 = (s[14] << 6) | (s[15] >>> 26);
      b23 = (s[15] << 6) | (s[14] >>> 26);
      b4 = (s[25] << 11) | (s[24] >>> 21);
      b5 = (s[24] << 11) | (s[25] >>> 21);
      b36 = (s[34] << 15) | (s[35] >>> 17);
      b37 = (s[35] << 15) | (s[34] >>> 17);
      b18 = (s[45] << 29) | (s[44] >>> 3);
      b19 = (s[44] << 29) | (s[45] >>> 3);
      b10 = (s[6] << 28) | (s[7] >>> 4);
      b11 = (s[7] << 28) | (s[6] >>> 4);
      b42 = (s[17] << 23) | (s[16] >>> 9);
      b43 = (s[16] << 23) | (s[17] >>> 9);
      b24 = (s[26] << 25) | (s[27] >>> 7);
      b25 = (s[27] << 25) | (s[26] >>> 7);
      b6 = (s[36] << 21) | (s[37] >>> 11);
      b7 = (s[37] << 21) | (s[36] >>> 11);
      b38 = (s[47] << 24) | (s[46] >>> 8);
      b39 = (s[46] << 24) | (s[47] >>> 8);
      b30 = (s[8] << 27) | (s[9] >>> 5);
      b31 = (s[9] << 27) | (s[8] >>> 5);
      b12 = (s[18] << 20) | (s[19] >>> 12);
      b13 = (s[19] << 20) | (s[18] >>> 12);
      b44 = (s[29] << 7) | (s[28] >>> 25);
      b45 = (s[28] << 7) | (s[29] >>> 25);
      b26 = (s[38] << 8) | (s[39] >>> 24);
      b27 = (s[39] << 8) | (s[38] >>> 24);
      b8 = (s[48] << 14) | (s[49] >>> 18);
      b9 = (s[49] << 14) | (s[48] >>> 18);

      s[0] = b0 ^ (~b2 & b4);
      s[1] = b1 ^ (~b3 & b5);
      s[10] = b10 ^ (~b12 & b14);
      s[11] = b11 ^ (~b13 & b15);
      s[20] = b20 ^ (~b22 & b24);
      s[21] = b21 ^ (~b23 & b25);
      s[30] = b30 ^ (~b32 & b34);
      s[31] = b31 ^ (~b33 & b35);
      s[40] = b40 ^ (~b42 & b44);
      s[41] = b41 ^ (~b43 & b45);
      s[2] = b2 ^ (~b4 & b6);
      s[3] = b3 ^ (~b5 & b7);
      s[12] = b12 ^ (~b14 & b16);
      s[13] = b13 ^ (~b15 & b17);
      s[22] = b22 ^ (~b24 & b26);
      s[23] = b23 ^ (~b25 & b27);
      s[32] = b32 ^ (~b34 & b36);
      s[33] = b33 ^ (~b35 & b37);
      s[42] = b42 ^ (~b44 & b46);
      s[43] = b43 ^ (~b45 & b47);
      s[4] = b4 ^ (~b6 & b8);
      s[5] = b5 ^ (~b7 & b9);
      s[14] = b14 ^ (~b16 & b18);
      s[15] = b15 ^ (~b17 & b19);
      s[24] = b24 ^ (~b26 & b28);
      s[25] = b25 ^ (~b27 & b29);
      s[34] = b34 ^ (~b36 & b38);
      s[35] = b35 ^ (~b37 & b39);
      s[44] = b44 ^ (~b46 & b48);
      s[45] = b45 ^ (~b47 & b49);
      s[6] = b6 ^ (~b8 & b0);
      s[7] = b7 ^ (~b9 & b1);
      s[16] = b16 ^ (~b18 & b10);
      s[17] = b17 ^ (~b19 & b11);
      s[26] = b26 ^ (~b28 & b20);
      s[27] = b27 ^ (~b29 & b21);
      s[36] = b36 ^ (~b38 & b30);
      s[37] = b37 ^ (~b39 & b31);
      s[46] = b46 ^ (~b48 & b40);
      s[47] = b47 ^ (~b49 & b41);
      s[8] = b8 ^ (~b0 & b2);
      s[9] = b9 ^ (~b1 & b3);
      s[18] = b18 ^ (~b10 & b12);
      s[19] = b19 ^ (~b11 & b13);
      s[28] = b28 ^ (~b20 & b22);
      s[29] = b29 ^ (~b21 & b23);
      s[38] = b38 ^ (~b30 & b32);
      s[39] = b39 ^ (~b31 & b33);
      s[48] = b48 ^ (~b40 & b42);
      s[49] = b49 ^ (~b41 & b43);

      s[0] ^= RC[n] as u32;
      s[1] ^= RC[n + 1] as u32;
    }
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
