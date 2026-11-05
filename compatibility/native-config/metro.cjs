const path = require('node:path');

module.exports = function configureSdkMetro(config, projectRoot) {
  const aliases = {
    https: require.resolve('https-browserify', { paths: [projectRoot] }),
    http: require.resolve('stream-http', { paths: [projectRoot] }),
    url: require.resolve('url/', { paths: [projectRoot] }),
  };
  const previousResolveRequest = config.resolver.resolveRequest;
  const binanceNodeSupport = path.join(
    projectRoot,
    'node_modules/binance/lib/util/node-support',
  );

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (aliases[moduleName]) {
      return { type: 'sourceFile', filePath: aliases[moduleName] };
    }

    if (
      moduleName.startsWith('.') &&
      path.resolve(path.dirname(context.originModulePath), moduleName)
        .replace(/\.js$/, '') === binanceNodeSupport
    ) {
      return {
        type: 'sourceFile',
        filePath: path.join(projectRoot, 'node_modules/binance/lib/util/browser-support.js'),
      };
    }

    const resolveRequest = previousResolveRequest || context.resolveRequest;
    return resolveRequest(context, moduleName, platform);
  };

  return config;
};
