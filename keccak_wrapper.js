async function loadWasmModule() {
  const response = await fetch("build/keccak.wasm");
  const buffer = await response.arrayBuffer();
  const module = await WebAssembly.compile(buffer);
  const instance = await WebAssembly.instantiate(module);
  return instance.exports;
}

class KeccakWrapper {
  constructor(bits) {
    this.bits = bits;
  }

  async initialize() {
    this.wasm = await loadWasmModule();
    this.instance = new this.wasm.Keccak(
      this.bits,
      this.wasm.KECCAK_PADDING,
      this.bits
    );
  }

  update(message) {
    this.instance.update(message);
  }

  finalize() {
    this.instance.finalize();
    const result = new Uint8Array(this.bits / 8);
    for (let i = 0; i < result.length; i++) {
      result[i] = this.instance.s[i];
    }
    return this.toHex(result);
  }

  toHex(buffer) {
    return Array.prototype.map
      .call(buffer, (x) => ("00" + x.toString(16)).slice(-2))
      .join("");
  }
}

// Example usage
(async () => {
  const keccak = new KeccakWrapper(256);
  await keccak.initialize();
  keccak.update("hello");
  const hash = keccak.finalize();
  console.log("Keccak-256 Hash:", hash);
})();
