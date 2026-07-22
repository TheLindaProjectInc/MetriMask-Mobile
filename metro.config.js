const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Mirrors the "react-native"/"browser" Node-core-module shims declared in
 * package.json. Those package.json fields only redirect requires made from
 * files Metro considers part of *this* package; third-party packages nested
 * under node_modules that require Node core modules directly aren't covered
 * by them. Declaring the same shims here applies them globally regardless of
 * which package is doing the requiring.
 */
const nodeCoreModuleShims = {
  zlib: 'browserify-zlib',
  console: 'console-browserify',
  constants: 'constants-browserify',
  crypto: 'react-native-crypto',
  dns: 'dns.js',
  net: 'react-native-tcp',
  domain: 'domain-browser',
  http: '@tradle/react-native-http',
  https: 'https-browserify',
  os: 'react-native-os',
  path: 'path-browserify',
  querystring: 'querystring-es3',
  fs: 'react-native-level-fs',
  _stream_transform: 'readable-stream/transform',
  _stream_readable: 'readable-stream/readable',
  _stream_writable: 'readable-stream/writable',
  _stream_duplex: 'readable-stream/duplex',
  _stream_passthrough: 'readable-stream/passthrough',
  dgram: 'react-native-udp',
  stream: 'stream-browserify',
  timers: 'timers-browserify',
  tty: 'tty-browserify',
  vm: 'vm-browserify',
};

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // package_etc/ holds standalone reference package.json files (not part
    // of the app) whose "name" collides with the root package.json and
    // breaks Metro's Haste module map.
    blockList: [/package_etc\/.*/],
    extraNodeModules: Object.fromEntries(
      Object.entries(nodeCoreModuleShims).map(([core, shim]) => [
        core,
        path.resolve(__dirname, 'node_modules', shim),
      ]),
    ),
    sourceExts: ['js', 'json', 'ts', 'tsx', 'cjs', 'mjs'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
