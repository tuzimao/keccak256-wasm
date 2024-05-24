
// 定义字符串消息格式类
export class StringMessageFormat {
  constructor(public data: Uint8Array, public isString: bool) {}
}

// 定义 Uint8Array 消息格式类
export class Uint8ArrayMessageFormat {
  constructor(public data: Uint8Array, public isString: bool) {}
}
