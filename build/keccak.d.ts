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
 * assembly/keccak/cloneArray
 * @param array `~lib/typedarray/Uint32Array`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function cloneArray(array: Uint32Array): Uint32Array;
