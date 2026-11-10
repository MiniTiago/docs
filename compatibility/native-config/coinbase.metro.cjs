const path = require('node:path');

module.exports = function configureSdkMetro(config, projectRoot) {
  const aliases = {
    https: require.resolve('https-browserify', { paths: [projectRoot] }),
    http: require.resolve('stream-http', { paths: [projectRoot] }),
    url: require.resolve('url/', { paths: [projectRoot] }),
  };
  const previousResolveRequest = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Replace only Coinbase's Node-only JWT implementation for public consumers.
    if (moduleName.endsWith('/jwtNode.js') &&
        context.originModulePath.startsWith(path.join(projectRoot, 'node_modules/coinbase-api') + path.sep)) {
      return { type: 'sourceFile', filePath: path.join(projectRoot, 'coinbase-public-auth.cjs') };
    }
    if (aliases[moduleName]) {
      return { type: 'sourceFile', filePath: aliases[moduleName] };
    }

    const resolveRequest = previousResolveRequest || context.resolveRequest;
    return resolveRequest(context, moduleName, platform);
  };

  return config;
};
