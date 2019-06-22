import jspmResolve from './loader.js'

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;
const relativeRegex = /^\.{0,2}[/]/;

export async function resolve(
  specifier,
  parentModuleURL = baseURL,
  defaultResolver
) {
  const resolvedModule = await jspmResolve(
    specifier,
    parentModuleURL,
    defaultResolver
  );

  if (resolvedModule) {
    return resolvedModule;
  }

  if (!relativeRegex.test(specifier)) {
    // node_module
    return defaultResolver(specifier, parentModuleURL);
  } else {
    // relative file
    return {
      url: new URL(specifier, parentModuleURL).href,
      format: 'module'
    };
  }
}
