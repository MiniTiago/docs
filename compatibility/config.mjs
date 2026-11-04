// Bump this explicit revision when the meaning of a compatibility check changes.
export const suiteVersion = '2-live';
export const runtimeVersions = { bun: '1.4.4', deno: '2.9.6' };
export const frameworkVersions = { vite: '5.4.21', next: '16.4.5', react: '19.2.0' };
export const targets = ['node', 'bun', 'deno', 'vite', 'browser', 'browser-configured', 'browser-bundle', 'next', 'react-native', 'react-native-ios', 'react-native-configured', 'react-native-ios-configured'];
export const labels = { node: 'Node.js', bun: 'Bun', deno: 'Deno', vite: 'Vite build', browser:'Browser / default Vite', 'browser-configured':'Browser / configured Vite', 'browser-bundle':'Browser / published bundle', next: 'Next.js server', 'react-native': 'React Native / default Android', 'react-native-ios':'React Native / default iOS', 'react-native-configured':'React Native / Android with polyfills', 'react-native-ios-configured':'React Native / iOS with polyfills' };
export const nativeVersions={expo:'58.0.23',react:'19.3.0',reactNative:'0.88.1',expoGo:'0.2.0'};
export function runtimeChecks() { return ['import','commonjs','rest','websocket','cleanup','types']; }
export function completeRuntimeResult(checks, execution) {
  return execution.code===0 && !execution.timedOut && Array.isArray(checks)
    && checks.every(c=>c.status==='passed') && runtimeChecks().every(id=>checks.some(c=>c.id===id));
}
export const names = {
  'browser-import':'Browser package import', 'native-bundle-ios':'iOS Metro bundle', 'native-bundle-android':'Android Metro bundle',
  'native-execution':'Native app execution',
  'native-import':'Native package import', 'native-control':'Android/Hermes environment',
  execution: 'Runtime execution',
  import: 'ES module import', commonjs: 'CommonJS import', types: 'TypeScript consumer',
  rest: 'Live exchange REST price', websocket: 'Live exchange market-data subscription',
  cleanup: 'Close WebSocket client',
  bundle: 'Production bundle', route: 'Server route execution',
};
