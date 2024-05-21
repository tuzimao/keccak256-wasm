/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/keccak/createKeccak
 * @param bits `i32`
 */
export declare function createKeccak(bits: number): void;
/**
 * assembly/keccak/updateKeccakWithString
 * @param message `~lib/string/String`
 */
export declare function updateKeccakWithString(message: string): void;
/**
 * assembly/keccak/updateKeccakWithUint8Array
 * @param message `~lib/typedarray/Uint8Array`
 */
export declare function updateKeccakWithUint8Array(message: Uint8Array): void;
/**
 * assembly/keccak/finalizeKeccak
 */
export declare function finalizeKeccak(): void;
/**
 * assembly/keccak/keccakToHex
 * @returns `~lib/string/String`
 */
export declare function keccakToHex(): string;
