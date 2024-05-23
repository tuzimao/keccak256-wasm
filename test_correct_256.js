import pkg from 'js-sha3';
const { keccak256 } = pkg;

const message = "12345";
const hash = keccak256(message);
console.log(`Keccak-256("${message}") = ${hash}`);
