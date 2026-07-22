if (typeof __dirname === 'undefined') global.__dirname = '/'
if (typeof __filename === 'undefined') global.__filename = ''
if (typeof process === 'undefined') {
  global.process = require('process')
} else {
  const bProcess = require('process')
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p]
    }
  }
}

process.browser = false
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer

// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__
process.env['NODE_ENV'] = isDev ? 'development' : 'production'
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : ''
}

if (typeof BigInt === 'undefined') {
  // big-integer's single-argument string parser only recognizes plain
  // decimal digits (or hex short enough to round-trip precisely through
  // Number()); large 0x/0b/0o-prefixed literals - e.g. ethers' 256-bit
  // BigInt("0xffff...ffff") constants - fail with "Invalid integer".
  // Native BigInt() parses these directly, so pre-parse the prefix and
  // hand big-integer an explicit base instead.
  const bigInt = require('big-integer');
  global.BigInt = function BigInt(value) {
    if (typeof value === 'string') {
      const hex = /^[+-]?0[xX]([0-9a-fA-F]+)$/.exec(value);
      if (hex) return bigInt(hex[1], 16);
      const oct = /^[+-]?0[oO]([0-7]+)$/.exec(value);
      if (oct) return bigInt(oct[1], 8);
      const bin = /^[+-]?0[bB]([01]+)$/.exec(value);
      if (bin) return bigInt(bin[1], 2);
    }
    return bigInt(value);
  };
}

// If using the crypto shim, uncomment the following line to ensure
// crypto is loaded first, so it can populate global.crypto
// require('crypto')
