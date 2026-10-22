/* OLCIR bootstrap for MINERVA 20+/21+.
 * Only registers OLCIR and loads ONE application JS and ONE CSS file.
 * All UI, uploads, server communication and overlays live in olcir.js.
 */
(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const test = params.get('test') === 'true';
  const github = 'https://raw.githack.com/sbi-rostock/AIR/master/OLCIR/';
  const local = 'http://localhost:3000/OLCIR/';
  const base = test ? local : github;
  const version = test ? Date.now().toString() : '1.0.0';
  const asset = name => `${base}${name}?v=${encodeURIComponent(version)}`;

  if (!window.minerva?.plugins?.registerPlugin) {
    console.error('[OLCIR] MINERVA plugin API is unavailable.');
    return;
  }

  const { element, events } = window.minerva.plugins.registerPlugin({
    pluginName: test ? 'OLCIR Test' : 'OLCIR',
    pluginVersion: '1.0.0',
    pluginUrl: 'https://raw.githubusercontent.com/sbi-rostock/AIR/master/OLCIR/plugin.js'
  });

  // A blank same-origin iframe isolates the plugin's CSS from MINERVA.
  const frame = document.createElement('iframe');
  frame.setAttribute('title', 'OLCIR');
  Object.assign(frame.style, {
    width: '100%', height: '100%', minHeight: '480px',
    display: 'block', border: '0'
  });
  const host = element instanceof HTMLElement ? element : element?.[0];
  if (!host?.appendChild) {
    console.error('[OLCIR] Plugin container is unavailable.');
    return;
  }

  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    // Shared context is available to olcir.js; the loader has no app logic.
    win.OLCIR_CONTEXT = Object.freeze({
      minerva: window.minerva,
      events,
      serverBase: 'https://air.bio.informatik.uni-rostock.de/air-plugin/',
      test
    });

    const css = doc.createElement('link');
    css.rel = 'stylesheet';
    css.href = asset('olcir.css');
    css.addEventListener('error', () => {
      console.error('[OLCIR] Failed to load', css.href);
    });
    doc.head.appendChild(css);

    const js = doc.createElement('script');
    js.src = asset('olcir.js');
    js.addEventListener('error', () => {
      doc.body.textContent = 'Could not load OLCIR. Check the asset URLs and the browser console.';
      console.error('[OLCIR] Failed to load', js.src);
    });
    doc.body.appendChild(js);
  }, { once: true });

  // about:blank is same-origin with the host MINERVA page.
  frame.src = 'about:blank';
  host.appendChild(frame);
})();
