export const INPUT_ERROR: string = "input is invalid type";
export const FINALIZE_ERROR: string = "finalize already called";

// 其他常量定义
export const HEX_CHARS: string[] = "0123456789abcdef".split("");
export const KECCAK_PADDING: StaticArray<u32> = [1, 256, 65536, 16777216];
export const PADDING: u32[] = [6, 1536, 393216, 100663296];
export const SHIFT: u32[] = [0, 8, 16, 24];
export const RC: u64[] = [
  1, 0, 32898, 0, 32906, -2147483648, 2147516416, -2147483648, 32907, 0,
  -2147483647, 0, 2147516545, -2147483648, 32777, -2147483648, 138, 0, 136, 0,
  2147516425, 0, -2147483640, 0, 2147516555, 0, 139, -2147483648, 32905,
  -2147483648, 32771, -2147483648, 32770, -2147483648, 128, -2147483648, 32778,
  0, -2147483640, -2147483648, 2147516545, -2147483648, 32896, -2147483648,
  -2147483647, 0, 2147516424, -2147483648
];
export const BITS: u32[] = [224, 256, 384, 512];
export const OUTPUT_TYPES: string[] = [
  "hex",
  "buffer",
  "arrayBuffer",
  "array",
  "digest",
];
