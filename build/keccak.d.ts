/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/keccak1/keccak_256
 * @param message `~lib/string/String`
 * @returns `~lib/string/String`
 */
export declare function keccak_256(message: string): string;
/**
 * assembly/keccak1/getBlocks
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function getBlocks(): Uint32Array;
/**
 * assembly/keccak1/testFormatStringMessage
 * @param message `~lib/string/String`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function testFormatStringMessage(message: string): Uint32Array;
/**
 * assembly/keccak1/testUpdateString
 * @param message `~lib/string/String`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function testUpdateString(message: string): Uint32Array;
/**
 * assembly/keccak1/debug_blockCount
 * @param message `~lib/string/String`
 * @returns `u32`
 */
export declare function debug_blockCount(message: string): number;
/**
 * assembly/keccak1/debug_byteCount
 * @param message `~lib/string/String`
 * @returns `u32`
 */
export declare function debug_byteCount(message: string): number;
/**
 * assembly/keccak1/testblocks0
 * @param message `~lib/string/String`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function testblocks0(message: string): Uint32Array;
/**
 * assembly/keccak1/testblocks1
 * @param message `~lib/string/String`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function testblocks1(message: string): Uint32Array;
/**
 * assembly/keccak1/testblocks2
 * @param message `~lib/string/String`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function testblocks2(message: string): Uint32Array;
/**
 * assembly/keccak1/testFinalize
 * @param message `~lib/string/String`
 * @returns `~lib/typedarray/Uint32Array`
 */
export declare function testFinalize(message: string): Uint32Array;
