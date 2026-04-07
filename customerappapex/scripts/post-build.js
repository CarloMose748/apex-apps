#!/usr/bin/env node

/**
 * Post-build script to ensure proper cache busting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../../dist');
const indexPath = path.join(distPath, 'index.html');

// Add additional cache-busting meta tags to the built HTML
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Add build timestamp
  const buildTime = new Date().toISOString();
  const version = process.env.npm_package_version || '1.0.0';
  
  // Insert additional meta tags before closing head
  const metaTags = `
    <meta name="build-time" content="${buildTime}">
    <meta name="app-version" content="${version}">
    <meta name="cache-control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="last-modified" content="${buildTime}">
  </head>`;
  
  html = html.replace('</head>', metaTags);
  
  fs.writeFileSync(indexPath, html);
  
  console.log(`✅ Added cache-busting headers to index.html (v${version} - ${buildTime})`);
} else {
  console.warn('⚠️  index.html not found in dist folder');
}

// Ensure _headers file is copied
const sourceHeaders = path.join(__dirname, '../../public/_headers');
const destHeaders = path.join(distPath, '_headers');

if (fs.existsSync(sourceHeaders)) {
  fs.copyFileSync(sourceHeaders, destHeaders);
  console.log('✅ Copied _headers file to dist');
}