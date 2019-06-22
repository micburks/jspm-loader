#!/usr/bin/env node --experimental-modules
import puppeteer from 'puppeteer'
import handler from 'serve-handler';
import http from 'http';
import assert from 'assert';
import {sayHello} from './fixture/greet.js'

let server;
const port = 3000;

async function startServer() {
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      return handler(req, res, {public:'./fixture'});
    });
    server.listen(port, () => {
      resolve(port);
    });
  });
}

async function stopServer() {
  return new Promise(resolve => {
    server.close(resolve);
  });
}

(async () => {
  const port = await startServer();
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    await page.waitForSelector('#root');

    const content = await page.content();
    assert.ok(content.includes(sayHello()), 'page content includes greeting');
    console.log('test passed');
  } catch (e) {
    console.error('test failed');
    console.error(e);
  }
  await browser.close();
  await stopServer();
})();
