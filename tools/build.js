#!/usr/bin/env node
/*
  Minimal build script for PyroPlasm website.
  - Creates a dist folder
  - Copies static assets (index.html, style.css, app.js)
  - Copies content directory as-is (so drafts are available under dist/content)
  This is a lightweight fallback to make `npm run build` succeed without external CLIs.
*/

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  for (const entry of fs.readdirSync(target)) {
    const p = path.join(target, entry);
    const stat = fs.lstatSync(p);
    if (stat.isDirectory()) {
      rmrf(p);
    } else {
      fs.unlinkSync(p);
    }
  }
  fs.rmdirSync(target);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const stat = fs.lstatSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function main() {
  // Clean dist
  if (fs.existsSync(distDir)) {
    rmrf(distDir);
  }
  ensureDir(distDir);

  // Copy main static files
  const staticFiles = ['index.html', 'style.css', 'app.js', 'blog.html'];
  for (const file of staticFiles) {
    const src = path.join(root, file);
    if (fs.existsSync(src)) {
      const dest = path.join(distDir, path.basename(file));
      copyFile(src, dest);
    }
  }

  // Copy content folder (as-is)
  const contentSrc = path.join(root, 'content');
  const contentDest = path.join(distDir, 'content');
  copyDir(contentSrc, contentDest);

  // Generate a blog manifest with titles from front matter
  const blogDir = path.join(contentSrc, 'blog');
  const blogManifest = [];
  if (fs.existsSync(blogDir)) {
    const entries = fs.readdirSync(blogDir);
    for (const entry of entries) {
      const full = path.join(blogDir, entry);
      const stat = fs.lstatSync(full);
      if (stat.isFile() && entry.toLowerCase().endsWith('.md')) {
        const raw = fs.readFileSync(full, 'utf8');
        let title = entry.replace(/\.md$/i, '');
        // extract YAML front matter title
        const fmMatch = raw.match(/^---[\s\S]*?---/);
        if (fmMatch) {
          const titleMatch = fmMatch[0].match(/\btitle:\s*"?(.+?)"?(\r?\n|$)/i);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }
        }
        blogManifest.push({
          title,
          path: `content/blog/${entry}`
        });
      }
    }
  }
  // Write manifest in dist
  const manifestPath = path.join(distDir, 'blog.json');
  fs.writeFileSync(manifestPath, JSON.stringify(blogManifest, null, 2), 'utf8');

  // Basic index notice if missing
  const distIndex = path.join(distDir, 'index.html');
  if (!fs.existsSync(distIndex)) {
    fs.writeFileSync(
      distIndex,
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PyroPlasm</title></head><body><h1>PyroPlasm</h1><p>Build completed. Add an index.html at project root for custom homepage.</p></body></html>`
    );
  }

  console.log('Build completed. Output:', distDir);
}

main();
