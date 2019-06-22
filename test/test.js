import htm from 'https://dev.jspm.io/htm';
import React from 'https://dev.jspm.io/react';
import {sayHello} from './greet.js';

const html = htm.bind(React.createElement);

function Root() {
  return html`
    <div>${sayHello()}</div>
  `;
}

async function render () {
  let rendered;

  if (typeof window === 'undefined') {
    const {default: ReactDOMServer} = await import('https://dev.jspm.io/react-dom/server');

    rendered = ReactDOMServer.renderToString(
      html`<${Root}/>`,
    )
  } else {
    const {default: ReactDOM} = await import('https://dev.jspm.io/react-dom');
    const root = document.createElement('div');
    document.body.appendChild(root);
    ReactDOM.render(
      html`<${Root}/>`,
      root
    );
    rendered = root.innerHTML;
  }

  return rendered;
}

render().then(rendered => {
  console.log({rendered});
});

