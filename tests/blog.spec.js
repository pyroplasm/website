/*
 E2E-like test to ensure blog.html renders the content of first-post.md
 Uses Node + JSDOM. Requires devDependency: jsdom.
*/

const { JSDOM } = require('jsdom');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function serveDir(rootDir) {
  const server = http.createServer((req, res) => {
    // sanitize path
    const urlPath = decodeURIComponent(req.url.split('?')[0].replace(/\\/g, '/'));
    let filePath = path.join(rootDir, urlPath === '/' ? '/blog.html' : urlPath);
    if (!filePath.startsWith(rootDir)) {
      res.statusCode = 403; res.end('Forbidden'); return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404; res.end('Not found'); return;
      }
      const ext = path.extname(filePath);
      const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : ext === '.json' ? 'application/json' : 'text/plain';
      res.setHeader('Content-Type', type);
      res.end(data);
    });
  });
  return new Promise(resolve => {
    server.listen(0, () => resolve(server));
  });
}

async function waitFor(cond, timeout = 5000, interval = 50) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (cond()) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
}

(async function run() {
  // Build site
  execSync('node tools/build.js', { stdio: 'inherit' });

  // Start static server from dist
  const distDir = path.join(process.cwd(), 'dist');
  const server = await serveDir(distDir);
  const { port } = server.address();
  const origin = `http://localhost:${port}`;

  // Load blog.html via JSDOM; we will intercept external CDN scripts by preloading stubs
  const html = fs.readFileSync(path.join(distDir, 'blog.html'), 'utf8');
  // Strip CDN scripts to avoid network
  const sanitized = html.replace(/<script[^>]*src="https:\/\/cdn[^>]*><\/script>/g, '');

  const dom = new JSDOM(sanitized, {
    url: origin + '/blog.html',
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });

  // Provide fetch in the window using Node's fetch (Node 18+)
  if (typeof fetch === 'function') {
    dom.window.fetch = (input, init) => {
      // If relative path, prefix origin
      const u = typeof input === 'string' && input.startsWith('http') ? input : origin + '/' + (typeof input === 'string' ? input.replace(/^\/?/, '') : input);
      return fetch(u, init);
    };
  } else {
    throw new Error('Global fetch not available in this Node. Requires Node 18+');
  }

  // Stub marked and DOMPurify used by app.js
  dom.window.marked = { parse: (md) => `<p>${md}</p>` };
  dom.window.DOMPurify = { sanitize: (html) => html };

  // Inject app.js
  const appJs = fs.readFileSync(path.join(distDir, 'app.js'), 'utf8');
  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = appJs;
  dom.window.document.body.appendChild(scriptEl);

  // Wait until an article is rendered
  const ok = await waitFor(() => dom.window.document.querySelector('#blog-posts article')); 
  if (!ok) {
    console.error('Test FAILED: No blog posts rendered');
    server.close();
    process.exit(1);
  }

  const text = dom.window.document.querySelector('#blog-posts').textContent.toLowerCase();
  const expected = 'article describing the waste management process'.toLowerCase();
  if (!text.includes(expected)) {
    console.error('Test FAILED: Blog content not found in blog.html');
    console.error('Got text snippet:', text.slice(0, 200));
    server.close();
    process.exit(1);
  }

  console.log('Test PASSED: Blog content from first-post.md is present on blog.html');
  server.close();
  process.exit(0);
})();
