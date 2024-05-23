import { HEX_CHARS, SHIFT, RC, FINALIZE_ERROR, KECCAK_PADDING } from "./constants";

function cloneUint32Array(array: Uint32Array): Uint32Array {
  let newArray = new Uint32Array(array.length);
  for (let i = 0; i < array.length; ++i) {
    newArray[i] = array[i];
  }
  return newArray;
}

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

    let blocks = this.blocks;
    let byteCount = this.byteCount;
    let length = message.length;
    let blockCount = this.blockCount;
    let index: i32 = 0;
    let s = this.s;
    let i: i32 = 0, code: i32;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }
      for (i = this.start; index < length && i < byteCount; ++index) {
        code = message.charCodeAt(index);
        if (code < 0x80) {
          blocks[i >> 2] |= code << SHIFT[i & 3];
        } else if (code < 0x800) {
          blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[(i + 1) & 3];
        } else if (code < 0xd800 || code >= 0xe000) {
          blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[(i + 1) & 3];
          blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[(i + 2) & 3];
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
          blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i & 3];
          blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[(i + 1) & 3];
          blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[(i + 2) & 3];
          blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[(i + 3) & 3];
        }
        i++;
      }

      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        this.permute(s);
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

    let blocks = this.blocks;
    let byteCount = this.byteCount;
    let length = message.length;
    let blockCount = this.blockCount;
    let index: i32 = 0;
    let s = this.s;
    let i: i32 = 0, code: i32;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }
      for (i = this.start; index < length && i < byteCount; ++index) {
        code = message[index];
        blocks[i >> 2] |= code << SHIFT[i & 3];
        i++;
      }

      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        this.permute(s);
        this.reset = true;
      } else {
        this.start = i;
      }
    }
    return this;
  }

  encode(x: i32, right: bool): i32 {
    let o: i32 = x & 255;
    let n: i32 = 1;
    let bytes: u8[] = [<u8>o];
    x = x >> 8;
    o = x & 255;
    while (o > 0) {
      bytes.unshift(<u8>o);
      x = x >> 8;
      o = x & 255;
      ++n;
    }
    if (right) {
      bytes.push(<u8>n);
    } else {
      bytes.unshift(<u8>n);
    }
    this.updateBytes(bytes);
    return bytes.length;
  }

  encodeString(str: string): i32 {
    let result = this.formatMessage(str);
    str = result[0] as string;
    let isString: bool = result[1];
    let bytes: i32 = 0;
    let length: i32 = str.length;

    if (isString) {
      for (let i = 0; i < length; ++i) {
        let code: i32 = str.charCodeAt(i);
        if (code < 0x80) {
          bytes += 1;
        } else if (code < 0x800) {
          bytes += 2;
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes += 3;
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
          bytes += 4;
        }
      }
    } else {
      bytes = length;
    }
    bytes += this.encode(bytes * 8, false);
    this.updateString(str);
    return bytes;
  }

  bytepad(strs: string[], w: i32): Keccak {
    let bytes: i32 = this.encode(w, false);
    for (let i = 0; i < strs.length; ++i) {
      bytes += this.encodeString(strs[i]);
    }
    let paddingBytes: i32 = (w - (bytes % w)) % w;
    let zeros: u8[] = new Array<u8>(paddingBytes);
    this.updateBytes(zeros);
    return this;
  }

  updateBytes(bytes: u8[]): void {
    for (let i = 0; i < bytes.length; i++) {
      this.updateString(String.fromCharCode(bytes[i]));
    }
  }

  finalize(): void {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    let blocks = this.blocks;
    let i = this.lastByteIndex;
    let blockCount = this.blockCount;
    let s = this.s;

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
    this.permute(s);
  }

  permute(s: Uint32Array): void {
   // s
  }

  toString(): string {
    return this.hex();
  }

  hex(): string {
    this.finalize();
    let blockCount = this.blockCount;
    let s = this.s;
    let outputBlocks = this.outputBlocks;
    let extraBytes = this.extraBytes;
    let hex = "";
    let block: i32;
    let j: i32 = 0;

    while (j < outputBlocks) {
      for (let i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        block = s[i];
        hex +=
          HEX_CHARS[(block >> 4) & 0x0f] +
          HEX_CHARS[block & 0x0f] +
          HEX_CHARS[(block >> 12) & 0x0f] +
          HEX_CHARS[(block >> 8) & 0x0f] +
          HEX_CHARS[(block >> 20) & 0x0f] +
          HEX_CHARS[(block >> 16) & 0x0f] +
          HEX_CHARS[(block >> 28) & 0x0f] +
          HEX_CHARS[(block >> 24) & 0x0f];
      }
      if (j % blockCount === 0) {
        s = cloneUint32Array(s);
        this.permute(s);
        j = 0;
      }
    }
    if (extraBytes) {
      block = s[j];
      hex += HEX_CHARS[(block >> 4) & 0x0f] + HEX_CHARS[block & 0x0f];
      if (extraBytes > 1) {
        hex += HEX_CHARS[(block >> 12) & 0x0f] + HEX_CHARS[(block >> 8) & 0x0f];
      }
      if (extraBytes > 2) {
        hex +=
          HEX_CHARS[(block >> 20) & 0x0f] + HEX_CHARS[(block >> 16) & 0x0f];
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
    let bytes = this.outputBits >> 3;
    let buffer: ArrayBuffer;

    if (extraBytes) {
      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
    } else {
      buffer = new ArrayBuffer(bytes);
    }
    let array = new Uint32Array(buffer);
    let j: i32 = 0;

    while (j < outputBlocks) {
      for (let i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        array[j] = s[i];
      }
      if (j % blockCount === 0) {
        s = cloneUint32Array(s);
        this.permute(s);
      }
    }
    if (extraBytes) {
      array[j] = s[j];
      buffer = buffer.slice(0, bytes);
    }
    return buffer;
  }

  digest(): Uint8Array {
    this.finalize();
    let blockCount = this.blockCount;
    let s = this.s;
    let outputBlocks = this.outputBlocks;
    let extraBytes = this.extraBytes;
    let array = new Uint8Array(this.outputBits >> 3);
    let offset: i32;
    let block: i32;
    let j: i32 = 0;

    while (j < outputBlocks) {
      for (let i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        offset = j << 2;
        block = s[i];
        array[offset] = block & 0xff;
        array[offset + 1] = (block >> 8) & 0xff;
        array[offset + 2] = (block >> 16) & 0xff;
        array[offset + 3] = (block >> 24) & 0xff;
      }
      if (j % blockCount === 0) {
        s = cloneUint32Array(s);
        this.permute(s);
      }
    }
    if (extraBytes) {
      offset = j << 2;
      block = s[j];
      array[offset] = block & 0xff;
      if (extraBytes > 1) {
        array[offset + 1] = (block >> 8) & 0xff;
      }
      if (extraBytes > 2) {
        array[offset + 2] = (block >> 16) & 0xff;
      }
    }
    return array;
  }
}

class Kmac extends Keccak {
  constructor(bits: i32, padding: StaticArray<u32>, outputBits: i32) {
    super(bits, padding, outputBits);
  }

  finalize(): void {
    this.encode(this.outputBits, true);
    super.finalize();
  }
}

let keccakInstance: Keccak | null = null;
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
