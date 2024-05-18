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
    this.instance = null;
  }

  async initialize() {
    this.instance = await loadWasmModule();
    this.instance.createKeccak(this.bits);
  }

  update(message) {
    this.instance.updateKeccak(message);
  }

  finalize() {
    this.instance.finalizeKeccak();
    return this.instance.keccakToHex();
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
