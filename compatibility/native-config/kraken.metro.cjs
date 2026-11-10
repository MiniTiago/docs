module.exports = function configureSdkMetro(config, projectRoot) {
  const aliases = {
    https: require.resolve('https-browserify', { paths: [projectRoot] }),
    http: require.resolve('stream-http', { paths: [projectRoot] }),
    url: require.resolve('url/', { paths: [projectRoot] }),
  };
  const previousResolveRequest = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (aliases[moduleName]) {
      return { type: 'sourceFile', filePath: aliases[moduleName] };
    }

    const resolveRequest = previousResolveRequest || context.resolveRequest;
    return resolveRequest(context, moduleName, platform);
  };

  return config;
};
