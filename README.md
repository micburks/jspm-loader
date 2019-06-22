# jspm-loader

Node loader for runtime dependency resolution from jspm.io

> It's about time for modules

*NOTE: I highly suggest not using this.*

### Installation

```bash
npm i @micburks/jspm-loader
```

### Usage

*NOTE: This is only supported in Node 12+*

You'll want some `package.json` fields. `"type": "module"` removes the need for
`.mjs` extensions.

```json
{
  "type": "module",
  "engines": {
    "node": "^12.0.0"
  }
}
```

```js
// index.js
import ReactDOMServer from 'https://dev.jspm.io/react-dom/server';

ReactDOMServer.renderToString(/* ... */);
```

Then you can...

```bash
node --experimental-modules --loader @micburks/jspm-loader index.js
```

### Troubleshooting

Recall note above about not using this package.

You will most likely run into issues where the exported API is not exactly what
you would expect. Inspect the module by visiting the url you're trying to
import. Also visit [jspm.io](https://jspm.io) for more information about DEW
and to file bugs about specific module format issues.

You will also run into issues with many node packages. jspm.io processes
files to target the browser. This package just benefits from the fact that many
dependencies will work in either environment.


### Isomorphic hyperscript example

```bash
# browser app
echo "<script src="index.js" type="module"></script>" > index.html
npx serve
```

```bash
# server app
node --experimental-modules --loader @micburks/jspm-loader index.js
```

```js
// index.js
import h from 'https://dev.jspm.io/hyperscript';

const rendered = (
  h('div#page',
    h('div#header', 'Hello world!'))
);

const renderString = rendered.outerHTML;

if (typeof window === 'undefined') {
  // node
  console.log({renderString});
} else {
  // browser
  document.body.innerHTML = renderString;
}
```

