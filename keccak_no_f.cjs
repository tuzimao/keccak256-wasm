(function () {
    'use strict';
  
    var INPUT_ERROR = 'input is invalid type';
    var FINALIZE_ERROR = 'finalize already called';
    var WINDOW = typeof window === 'object';
    var root = WINDOW ? window : {};
    if (root.JS_SHA3_NO_WINDOW) {
      WINDOW = false;
    }
    var WEB_WORKER = !WINDOW && typeof self === 'object';
    var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
    if (NODE_JS) {
      root = global;
    } else if (WEB_WORKER) {
      root = self;
    }
    var COMMON_JS = !root.JS_SHA3_NO_COMMON_JS && typeof module === 'object' && module.exports;
    var AMD = typeof define === 'function' && define.amd;
    var ARRAY_BUFFER = !root.JS_SHA3_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
    var HEX_CHARS = '0123456789abcdef'.split('');
    var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
    var CSHAKE_PADDING = [4, 1024, 262144, 67108864];
    var KECCAK_PADDING = [1, 256, 65536, 16777216];
    var PADDING = [6, 1536, 393216, 100663296];
    var SHIFT = [0, 8, 16, 24];
    var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
      0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
      2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
      2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
      2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
    var BITS = [224, 256, 384, 512];
    var SHAKE_BITS = [128, 256];
    var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array', 'digest'];
    var CSHAKE_BYTEPAD = {
      '128': 168,
      '256': 136
    };
  
  
    var isArray = root.JS_SHA3_NO_NODE_JS || !Array.isArray
      ? function (obj) {
          return Object.prototype.toString.call(obj) === '[object Array]';
        }
      : Array.isArray;
  
    var isView = (ARRAY_BUFFER && (root.JS_SHA3_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView))
      ? function (obj) {
          return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
        }
      : ArrayBuffer.isView;
  
    // [message: string, isString: bool]
    var formatMessage = function (message) {
      var type = typeof message;
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
  
    var empty = function (message) {
      return formatMessage(message)[0].length === 0;
    };
  
    var cloneArray = function (array) {
      var newArray = [];
      for (var i = 0; i < array.length; ++i) {
        newArray[i] = array[i];
      }
      return newArray;
    }
  
    var createOutputMethod = function (bits, padding, outputType) {
      return function (message) {
        return new Keccak(bits, padding, bits).update(message)[outputType]();
      };
    };
  
    var createShakeOutputMethod = function (bits, padding, outputType) {
      return function (message, outputBits) {
        return new Keccak(bits, padding, outputBits).update(message)[outputType]();
      };
    };
  
    var createCshakeOutputMethod = function (bits, padding, outputType) {
      return function (message, outputBits, n, s) {
        return methods['cshake' + bits].update(message, outputBits, n, s)[outputType]();
      };
    };
  
    var createKmacOutputMethod = function (bits, padding, outputType) {
      return function (key, message, outputBits, s) {
        return methods['kmac' + bits].update(key, message, outputBits, s)[outputType]();
      };
    };
  
    var createOutputMethods = function (method, createMethod, bits, padding) {
      for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
        var type = OUTPUT_TYPES[i];
        method[type] = createMethod(bits, padding, type);
      }
      return method;
    };
  
    var createMethod = function (bits, padding) {
      var method = createOutputMethod(bits, padding, 'hex');
      method.create = function () {
        return new Keccak(bits, padding, bits);
      };
      method.update = function (message) {
        return method.create().update(message);
      };
      return createOutputMethods(method, createOutputMethod, bits, padding);
    };
  
    var createShakeMethod = function (bits, padding) {
      var method = createShakeOutputMethod(bits, padding, 'hex');
      method.create = function (outputBits) {
        return new Keccak(bits, padding, outputBits);
      };
      method.update = function (message, outputBits) {
        return method.create(outputBits).update(message);
      };
      return createOutputMethods(method, createShakeOutputMethod, bits, padding);
    };
  
    var createCshakeMethod = function (bits, padding) {
      var w = CSHAKE_BYTEPAD[bits];
      var method = createCshakeOutputMethod(bits, padding, 'hex');
      method.create = function (outputBits, n, s) {
        if (empty(n) && empty(s)) {
          return methods['shake' + bits].create(outputBits);
        } else {
          return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
        }
      };
      method.update = function (message, outputBits, n, s) {
        return method.create(outputBits, n, s).update(message);
      };
      return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
    };
  
    var createKmacMethod = function (bits, padding) {
      var w = CSHAKE_BYTEPAD[bits];
      var method = createKmacOutputMethod(bits, padding, 'hex');
      method.create = function (key, outputBits, s) {
        return new Kmac(bits, padding, outputBits).bytepad(['KMAC', s], w).bytepad([key], w);
      };
      method.update = function (key, message, outputBits, s) {
        return method.create(key, outputBits, s).update(message);
      };
      return createOutputMethods(method, createKmacOutputMethod, bits, padding);
    };
  
    var algorithms = [
      { name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod },
      { name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod },
      { name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod },
      { name: 'cshake', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createCshakeMethod },
      { name: 'kmac', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createKmacMethod }
    ];
  
    var methods = {}, methodNames = [];
  
    for (var i = 0; i < algorithms.length; ++i) {
      var algorithm = algorithms[i];
      var bits = algorithm.bits;
      for (var j = 0; j < bits.length; ++j) {
        var methodName = algorithm.name + '_' + bits[j];
        methodNames.push(methodName);
        methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
        if (algorithm.name !== 'sha3') {
          var newMethodName = algorithm.name + bits[j];
          methodNames.push(newMethodName);
          methods[newMethodName] = methods[methodName];
        }
      }
    }
  
    function Keccak(bits, padding, outputBits) {
      this.blocks = [];
      this.s = [];
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
  
      for (var i = 0; i < 50; ++i) {
        this.s[i] = 0;
      }
    }
  
    Keccak.prototype.update = function (message) {
      if (this.finalized) {
        throw new Error(FINALIZE_ERROR);
      }
      var result = formatMessage(message);
      message = result[0];
      var isString = result[1];
      var blocks = this.blocks, byteCount = this.byteCount, length = message.length,
        blockCount = this.blockCount, index = 0, s = this.s, i, code;
  
      while (index < length) {
        if (this.reset) {
          this.reset = false;
          blocks[0] = this.block;
          for (i = 1; i < blockCount + 1; ++i) {
            blocks[i] = 0;
          }
        }
        if (isString) {
          for (i = this.start; index < length && i < byteCount; ++index) {
            code = message.charCodeAt(index);
            if (code < 0x80) {
              blocks[i >> 2] |= code << SHIFT[i++ & 3];
            } else if (code < 0x800) {
              blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
            } else if (code < 0xd800 || code >= 0xe000) {
              blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
            } else {
              code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
              blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
              blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
            }
          }
        } else {
          for (i = this.start; index < length && i < byteCount; ++index) {
            blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
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
    };
  
    Keccak.prototype.encode = function (x, right) {
      var o = x & 255, n = 1;
      var bytes = [o];
      x = x >> 8;
      o = x & 255;
      while (o > 0) {
        bytes.unshift(o);
        x = x >> 8;
        o = x & 255;
        ++n;
      }
      if (right) {
        bytes.push(n);
      } else {
        bytes.unshift(n);
      }
      this.update(bytes);
      return bytes.length;
    };
  
    Keccak.prototype.encodeString = function (str) {
      var result = formatMessage(str);
      str = result[0];
      var isString = result[1];
      var bytes = 0, length = str.length;
      if (isString) {
        for (var i = 0; i < str.length; ++i) {
          var code = str.charCodeAt(i);
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
      bytes += this.encode(bytes * 8);
      this.update(str);
      return bytes;
    };
  
    Keccak.prototype.bytepad = function (strs, w) {
      var bytes = this.encode(w);
      for (var i = 0; i < strs.length; ++i) {
        bytes += this.encodeString(strs[i]);
      }
      var paddingBytes = (w - bytes % w) % w;
      var zeros = [];
      zeros.length = paddingBytes;
      this.update(zeros);
      return this;
    };
  
    Keccak.prototype.finalize = function () {
      if (this.finalized) {
        return;
      }
      this.finalized = true;
      var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
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
      f(s);
    };
  
    Keccak.prototype.toString = Keccak.prototype.hex = function () {
      this.finalize();
  
      var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
      var hex = '', block;
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
      if (extraBytes) {
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
    };
  
    Keccak.prototype.arrayBuffer = function () {
      this.finalize();
  
      var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
      var bytes = this.outputBits >> 3;
      var buffer;
      if (extraBytes) {
        buffer = new ArrayBuffer((outputBlocks + 1) << 2);
      } else {
        buffer = new ArrayBuffer(bytes);
      }
      var array = new Uint32Array(buffer);
      while (j < outputBlocks) {
        for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
          array[j] = s[i];
        }
        if (j % blockCount === 0) {
          s = cloneArray(s);
          f(s);
        }
      }
      if (extraBytes) {
        array[j] = s[i];
        buffer = buffer.slice(0, bytes);
      }
      return buffer;
    };
  
    Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;
  
    Keccak.prototype.digest = Keccak.prototype.array = function () {
      this.finalize();
  
      var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
      var array = [], offset, block;
      while (j < outputBlocks) {
        for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
          offset = j << 2;
          block = s[i];
          array[offset] = block & 0xFF;
          array[offset + 1] = (block >> 8) & 0xFF;
          array[offset + 2] = (block >> 16) & 0xFF;
          array[offset + 3] = (block >> 24) & 0xFF;
        }
        if (j % blockCount === 0) {
          s = cloneArray(s);
          f(s);
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
    };
  
    function Kmac(bits, padding, outputBits) {
      Keccak.call(this, bits, padding, outputBits);
    }
  
    Kmac.prototype = new Keccak();
  
    Kmac.prototype.finalize = function () {
      this.encode(this.outputBits, true);
      return Keccak.prototype.finalize.call(this);
    };
  
    var f = function (s) {
    ...
    };
    if (COMMON_JS) {
      module.exports = {
        keccak_224: methods.keccak_224,
        keccak_256: methods.keccak_256,
        keccak_384: methods.keccak_384,
        keccak_512: methods.keccak_512,
      };
    } else {
      for (i = 0; i < methodNames.length; ++i) {
        root[methodNames[i]] = methods[methodNames[i]];
      }
      if (AMD) {
        define(function () {
          return methods;
        });
      }
    }
    
    })();
    