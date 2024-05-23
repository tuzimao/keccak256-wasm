const { keccak_256 } = require('./keccak.cjs');

function testKeccak256() {
  const message = '12345';
  const hash = keccak_256(message);
  console.log(`Keccak-256("${message}") = ${hash}`);
}

testKeccak256();
