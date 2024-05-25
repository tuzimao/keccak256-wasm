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
