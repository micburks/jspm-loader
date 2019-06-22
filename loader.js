import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import https from 'https';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const dir = new URL(`file://${process.cwd()}`).pathname;
const cacheDir = '/tmp/loader-cache/jspm'; // path.join(dir, '.loader_cache/jspm');
const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;
const fullUrlRegex = /^https\:\/\/.*/;
const relativeRegex = /^\/npm\:/;

/**
 * encode/decode
 * 
 * Requests can point to a single file or to a context (directory)
 *  - We cannot use the raw url path to create a file structure
 * We need to reversible convert between url and file paths
 *  - URL encoding is incompatible with file paths
 *
 * For these reasons, I'm converting specific characters to their character
 * code for the file path, and decoding back into the given character for use
 * in the request url
 *
 * The result is that all modules are stored in a flat structure in the cache directory
 */
function encode(str) {
  return str && str.replace(/[/?]/g, char => {
    return `[${char.charCodeAt(0)}]`;
  });
}
function decode(str) {
  return str && str.replace(/\[(\d+)\]/g, (_, code) => {
    return String.fromCharCode(code);
  });
}

function getRequestFromCachePath(path) {
  const [, relative] = path.split(cacheDir);
  const decoded = decode(relative);
  return decoded;
}

function getUrlCachePath(url) {
  const urlCachePath = path.join(cacheDir, encode(url));
  return urlCachePath;
}

async function writeToCache(url, module) {
  await mkdir(path.dirname(url), {recursive: true});
  await writeFile(url, module);
}

function getRequestUrl(path) {
  return `https://dev.jspm.io/${path}`;
}

function getJspmModuleSpecifier(specifier) {
  if (fullUrlRegex.test(specifier) || relativeRegex.test(specifier)) {
    return specifier.replace(/^((https\:\/)?\/dev.jspm.io)?\//, '');
  } else {
    return null;
  }
}

async function httpsGet(url) {
  return new Promise(resolve => {
    https.get(url, res => {
      let response = '';
      res.on('data', d => {
        response += d;
      });
      res.on('end', () => {
        resolve(response);
      });
    });
  });
}

export default async function resolve(
  specifier,
  parentModuleURL = baseURL,
  defaultResolver
) {
  /**
   * TODO:
   * - check that async work properly
   * - pipe request stream to fs.writeFile
   * - find alternative to existsSync
   */
  let url = new URL(specifier, parentModuleURL).href;

  /*
   * If path is relative and parent was a jspm module
   * - convert to absolute jspm module
   */
  const isRelativePath = /^\./.test(specifier);
  if (isRelativePath) {
    const parentJspmPath = getRequestFromCachePath(parentModuleURL) || '';
    if (parentJspmPath) {
      specifier = path.join(path.dirname(parentJspmPath), specifier);
    }
  }

  /**
   * If jspm module
   * - get cache path and absolute url
   * - if not cached
   *   - make request to jspm.io
   *   - cache the result
   * - return cache path
   */
  const jspmModuleSpecifier = getJspmModuleSpecifier(specifier);
  if (jspmModuleSpecifier) {
    const urlCachePath = getUrlCachePath(jspmModuleSpecifier);
    const absoluteUrl = getRequestUrl(jspmModuleSpecifier);
    url = new URL(urlCachePath, parentModuleURL).href;
    const exists = await fs.existsSync(urlCachePath);
    if (!exists) {
      const result = await httpsGet(absoluteUrl);
      await writeToCache(urlCachePath, result);
    }
    return {url, format: 'module'};
  } else {
    return false;
  }
}
