export const INPUT_ERROR: string = "input is invalid type";
export const FINALIZE_ERROR: string = "finalize already called";

// 默认情况下假设没有 window 对象
export const WINDOW: bool = false;
export const WEB_WORKER: bool = false;
export const NODE_JS: bool = false;
export const COMMON_JS: bool = false;
export const AMD: bool = false;
export const ARRAY_BUFFER: bool = false;

export const root: Map<string, bool> = new Map<string, bool>();

// 其他常量定义
export const HEX_CHARS: string[] = "0123456789abcdef".split("");
export const SHAKE_PADDING: i32[] = [31, 7936, 2031616, 520093696];
export const CSHAKE_PADDING: i32[] = [4, 1024, 262144, 67108864];
export const KECCAK_PADDING: i32[] = [1, 256, 65536, 16777216];
export const PADDING: i32[] = [6, 1536, 393216, 100663296];
export const SHIFT: i32[] = [0, 8, 16, 24];
export const RC: i64[] = [
  1, 0, 32898, 0, 32906, -2147483648, 2147516416, -2147483648, 32907, 0,
  -2147483647, 0, 2147516545, -2147483648, 32777, -2147483648, 138, 0, 136, 0,
  2147516425, 0, -2147483640, 0, 2147516555, 0, 139, -2147483648, 32905,
  -2147483648, 32771, -2147483648, 32770, -2147483648, 128, -2147483648, 32778,
  0, -2147483640, -2147483648, 2147516545, -2147483648, 32896, -2147483648,
  -2147483647, 0, 2147516424, -2147483648,
];
export const BITS: i32[] = [224, 256, 384, 512];
export const SHAKE_BITS: i32[] = [128, 256];
export const OUTPUT_TYPES: string[] = [
  "hex",
  "buffer",
  "arrayBuffer",
  "array",
  "digest",
];
export const CSHAKE_BYTEPAD: StaticArray<i32> = [168, 136];

// 模拟不同环境的检测
function detectEnvironment(): void {
  const hasWindow: bool = false;
  const hasSelf: bool = false;
  const hasProcess: bool = false;
  const hasModule: bool = false;
  const hasDefine: bool = false;
  const hasArrayBuffer: bool = true;

  if (hasWindow) {
    root.set("WINDOW", true);
  } else {
    root.set("WINDOW", false);
  }

  root.set("WEB_WORKER", !root.get("WINDOW") && hasSelf);
  root.set("NODE_JS", !root.get("WINDOW") && hasProcess);

  if (root.get("NODE_JS")) {
    // 模拟 global 对象
    root.set("global", true);
  } else if (root.get("WEB_WORKER")) {
    root.set("self", true);
  }

  root.set("COMMON_JS", !root.get("WINDOW") && hasModule);
  root.set("AMD", hasDefine);
  root.set("ARRAY_BUFFER", hasArrayBuffer);
}

detectEnvironment();
