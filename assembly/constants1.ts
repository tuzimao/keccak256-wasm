export const INPUT_ERROR: string = 'input is invalid type';
export const FINALIZE_ERROR: string = 'finalize already called';

// 常量定义
export const HEX_CHARS: string[] = '0123456789abcdef'.split('');

export const SHAKE_PADDING: u32[] = [31, 7936, 2031616, 520093696];
export const CSHAKE_PADDING: u32[] = [4, 1024, 262144, 67108864];
export const KECCAK_PADDING: u32[] = [1, 256, 65536, 16777216];
export const PADDING: u32[] = [6, 1536, 393216, 100663296];
export const SHIFT: u32[] = [0, 8, 16, 24];
export const RC: u32[] = [
  1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
  0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
  2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
  2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
  2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648
];
export const BITS: u32[] = [224, 256, 384, 512];
export const SHAKE_BITS: u32[] = [128, 256];
export const OUTPUT_TYPES: string[] = ['hex', 'buffer', 'arrayBuffer', 'array', 'digest'];
export const CSHAKE_BYTEPAD: Map<string, u32> = new Map<string, u32>([
  ['128', 168],
  ['256', 136]
]);
