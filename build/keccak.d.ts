/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/keccak/formatMessageStringWrapper
 * @param message `~lib/string/String`
 * @returns `~lib/staticarray/StaticArray<~lib/string/String>`
 */
export declare function formatMessageStringWrapper(message: string): ArrayLike<string>;
/**
 * assembly/keccak/formatMessageUint8ArrayWrapper
 * @param message `~lib/typedarray/Uint8Array`
 * @returns `~lib/staticarray/StaticArray<~lib/typedarray/Uint8Array>`
 */
export declare function formatMessageUint8ArrayWrapper(message: Uint8Array): ArrayLike<Uint8Array>;
/**
 * assembly/keccak/emptyStringWrapper
 * @param message `~lib/string/String`
 * @returns `bool`
 */
export declare function emptyStringWrapper(message: string): boolean;
/**
 * assembly/keccak/emptyUint8ArrayWrapper
 * @param message `~lib/typedarray/Uint8Array`
 * @returns `bool`
 */
export declare function emptyUint8ArrayWrapper(message: Uint8Array): boolean;
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
