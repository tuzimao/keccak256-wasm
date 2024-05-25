const { Keccak } = require('./keccak_wrapper.cjs');

function testKeccak256() {
  const message = '12345';
  const keccakjs = new Keccak(256, [1, 256, 65536, 16777216], 256);  // 注意这里的参数需要和你的实现一致
  const hash = keccakjs.update(message);  // 调用 update 方法传递字符串
  console.log(`Keccak-256("${message}") = ${hash}`);
}

testKeccak256();