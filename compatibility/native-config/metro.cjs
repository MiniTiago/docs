const path = require('node:path');

module.exports = function configureSdkMetro(config, projectRoot) {
  const resolve = name => require.resolve(name, {paths:[projectRoot]});
  const aliases = {
    https: resolve('https-browserify'),
    http: resolve('stream-http'),
    url: resolve('url/'),
  };
  const previous = config.resolver.resolveRequest;
  const binanceNodeSupport = path.join(projectRoot,'node_modules/binance/lib/util/node-support');
  config.resolver.resolveRequest = (context, name, platform) => {
    const resolveRequest = previous || context.resolveRequest;
    if (aliases[name]) return {type:'sourceFile',filePath:aliases[name]};
    if (name.startsWith('.') && path.resolve(path.dirname(context.originModulePath),name).replace(/\.js$/,'') === binanceNodeSupport) {
      return {type:'sourceFile',filePath:path.join(projectRoot,'node_modules/binance/lib/util/browser-support.js')};
    }
    return resolveRequest(context,name,platform);
  };
  return config;
};
