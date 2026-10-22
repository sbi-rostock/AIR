/* OLCIR application: the only application script loaded by plugin.js.
 * Dependencies: modern browser APIs only (fetch, File, DecompressionStream).
 * MINERVA API: registerPlugin is in plugin.js; overlays are created here.
 */
(() => {
  'use strict';

  const ctx = window.OLCIR_CONTEXT;
  if (!ctx?.minerva) {
    document.body.textContent = 'OLCIR was not started by plugin.js.';
    return;
  }

  const SERVER = ctx.serverBase.replace(/\/+$/, '') + '/';
  const VALID_FILE = /\.(txt|tsv|csv|tab|data|xlsx|xls|vcf|maf|bed|vcf\.gz)$/i;
  const MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAX_UNPACKED_BYTES = 250 * 1024 * 1024;
  const MAX_FILES = 250;
  const state = { files: [], results: [], busy: false, ready: null, nextId: 0 };

  const node = (tag, options = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [name, value] of Object.entries(options)) {
      if (name === 'className') el.className = value;
      else if (name === 'text') el.textContent = value;
      else if (name === 'attrs') {
        for (const [attr, attrValue] of Object.entries(value)) el.setAttribute(attr, attrValue);
      } else el[name] = value;
    }
    for (const child of children) el.append(child);
    return el;
  };
  const $ = id => document.getElementById(id);
  const prettySize = bytes => bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;

  function createUI() {
    const main = node('main', { className: 'olcir' });
    main.innerHTML = `
      <div class="olcir-header">
        <div><h1>OLCIR</h1><p class="olcir-lead">Process datasets and add them as Disease Map overlays.</p></div>
        ${ctx.test ? '<span class="olcir-mode">Local assets</span>' : ''}
      </div>
      <section class="olcir-card" aria-label="Upload files">
        <h2>1. Select files</h2>
        <input id="olcir-upload" class="olcir-fileinput" type="file" multiple
               accept=".txt,.tsv,.csv,.tab,.data,.xlsx,.xls,.vcf,.vcf.gz,.maf,.bed,.zip">
        <p class="olcir-hint" style="margin-top:8px">Multiple files or ZIP archives. ZIP contents are listed as individual files.</p>
        <div id="olcir-file-area" class="olcir-hidden">
          <table class="olcir-table"><thead><tr>
            <th class="olcir-select-col"><input id="olcir-all" type="checkbox" checked title="Select or deselect all files" aria-label="Select all"></th>
            <th>File</th><th class="olcir-type-col">Type</th><th class="olcir-state-col">Status</th>
          </tr></thead><tbody id="olcir-files"></tbody></table>
        </div>
        <div class="olcir-actions">
          <label class="olcir-check"><input id="olcir-pvalues" type="checkbox"> Data contains p-values</label>
          <button id="olcir-clear" class="olcir-btn olcir-btn-secondary" type="button">Clear list</button>
        </div>
        <div class="olcir-actions">
          <button id="olcir-process" class="olcir-btn" type="button" disabled>Process selected files</button>
          <span id="olcir-status" class="olcir-status" role="status" aria-live="polite">Starting server session…</span>
        </div>
        <div id="olcir-notice" class="olcir-notice olcir-hidden" role="alert"></div>
      </section>
      <section class="olcir-card" aria-label="Processed overlays">
        <h2>2. Add processed overlays</h2>
        <p class="olcir-hint" style="margin-bottom:10px">Each numeric result column can be added to MINERVA as a separate overlay.</p>
        <div id="olcir-results" class="olcir-list"><p class="olcir-empty">No processed overlays yet.</p></div>
        <div class="olcir-actions">
          <button id="olcir-addall" class="olcir-btn olcir-btn-secondary" type="button" disabled>Add all to map</button>
        </div>
      </section>`;
    document.body.replaceChildren(main);

    $('olcir-upload').addEventListener('change', async event => {
      await addFiles(Array.from(event.target.files ?? []));
      event.target.value = ''; // selecting the same file again is allowed
    });
    $('olcir-all').addEventListener('change', event => {
      for (const item of state.files) item.selected = event.target.checked;
      renderFiles();
    });
    $('olcir-clear').addEventListener('click', () => {
      if (state.busy) return;
      state.files.length = 0;
      renderFiles();
      notice('');
    });
    $('olcir-process').addEventListener('click', processSelected);
    $('olcir-addall').addEventListener('click', addAllOverlays);
    renderFiles();
    renderResults();
  }

  function status(message, kind = '') {
    const target = $('olcir-status');
    target.textContent = message;
    target.dataset.kind = kind;
  }
  function notice(message, kind = 'error') {
    const target = $('olcir-notice');
    target.textContent = message;
    target.dataset.kind = kind;
    target.classList.toggle('olcir-hidden', !message);
  }
  function setBusy(value) {
    state.busy = value;
    $('olcir-upload').disabled = value;
    $('olcir-clear').disabled = value;
    $('olcir-pvalues').disabled = value;
    $('olcir-all').disabled = value;
    updateButtons();
    for (const el of document.querySelectorAll('.olcir-file-check, .olcir-type')) el.disabled = value;
  }
  function updateButtons() {
    const selected = state.files.filter(x => x.selected);
    $('olcir-process').disabled = state.busy || !selected.length || !state.ready;
    $('olcir-addall').disabled = state.busy || !state.results.some(x => x.status !== 'added');
  }

  async function addFiles(files) {
    if (state.busy || !files.length) return;
    notice('');
    setBusy(true);
    try {
      for (const file of files) {
        if (state.files.length >= MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files per selection.`);
        if (/\.zip$/i.test(file.name)) {
          status(`Extracting ${file.name}…`);
          const extracted = await extractZip(file);
          for (const entry of extracted) enqueue(entry.file, `${file.name} / ${entry.name}`);
        } else if (VALID_FILE.test(file.name)) {
          if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds ${prettySize(MAX_FILE_BYTES)}.`);
          enqueue(file, file.name);
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }
      }
      status(state.ready ? 'Ready to process' : 'Server initialization pending…');
    } catch (error) {
      console.error('[OLCIR] File selection error', error);
      notice(error.message);
      status('Some files could not be added', 'error');
    } finally {
      setBusy(false);
      renderFiles();
    }
  }

  function enqueue(file, displayName) {
    if (state.files.length >= MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files per selection.`);
    state.files.push({ id: ++state.nextId, file, displayName, selected: true, type: '', status: 'Queued' });
  }

  function renderFiles() {
    const table = $('olcir-files');
    table.replaceChildren();
    $('olcir-file-area').classList.toggle('olcir-hidden', !state.files.length);
    for (const item of state.files) {
      const check = node('input', { type: 'checkbox', checked: item.selected, className: 'olcir-file-check' });
      check.setAttribute('aria-label', `Select ${item.displayName}`);
      check.disabled = state.busy;
      check.addEventListener('change', () => {
        item.selected = check.checked;
        $('olcir-all').checked = state.files.every(x => x.selected);
        updateButtons();
      });
      const select = node('select', { className: 'olcir-select olcir-type' });
      select.setAttribute('aria-label', `Data type for ${item.displayName}`);
      for (const [value, title] of [
        ['', 'Select type…'], ['expression', 'Expression'],
        ['methylation', 'Methylation'], ['variants', 'Variants']
      ]) {
        select.append(node('option', { value, text: title }));
      }
      select.value = item.type;
      select.disabled = state.busy;
      select.addEventListener('change', () => { item.type = select.value; updateButtons(); });
      table.append(node('tr', {}, [
        node('td', { className: 'olcir-select-col' }, [check]),
        node('td', {}, [
          node('div', { className: 'olcir-filename', text: item.displayName }),
          node('div', { className: 'olcir-small', text: prettySize(item.file.size) })
        ]),
        node('td', {}, [select]),
        node('td', { className: 'olcir-small', text: item.status })
      ]));
    }
    $('olcir-all').checked = state.files.length > 0 && state.files.every(x => x.selected);
    updateButtons();
  }

  // A small self-contained ZIP reader: standard single-disk ZIP, STORE/DEFLATE.
  // No additional JS libraries or asset requests are required.
  async function extractZip(file) {
    if (file.size > MAX_ZIP_BYTES) throw new Error('ZIP exceeds the 100 MB archive limit.');
    if (typeof DecompressionStream !== 'function') {
      throw new Error('ZIP extraction requires a browser with DecompressionStream support.');
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const u16 = at => view.getUint16(at, true);
    const u32 = at => view.getUint32(at, true);
    let end = -1;
    const earliest = Math.max(0, bytes.length - 65557);
    for (let i = bytes.length - 22; i >= earliest; i--) {
      if (u32(i) === 0x06054b50 && i + 22 + u16(i + 20) === bytes.length) { end = i; break; }
    }
    if (end < 0) throw new Error('Invalid ZIP: end-of-directory record not found.');
    const count = u16(end + 10);
    const centralSize = u32(end + 12);
    let offset = u32(end + 16);
    if (count === 0xffff || offset === 0xffffffff || u16(end + 8) !== count || u16(end + 4) !== 0) {
      throw new Error('Multi-disk and ZIP64 archives are not supported.');
    }
    if (count > MAX_FILES || offset + centralSize > end) throw new Error('ZIP archive is too large or malformed.');
    const decoder = new TextDecoder('utf-8');
    const out = [];
    let unpacked = 0;
    for (let i = 0; i < count; i++) {
      if (offset + 46 > bytes.length || u32(offset) !== 0x02014b50) throw new Error('Malformed ZIP directory.');
      const flags = u16(offset + 8);
      const method = u16(offset + 10);
      const crc = u32(offset + 16);
      const compressed = u32(offset + 20);
      const original = u32(offset + 24);
      const nameLen = u16(offset + 28);
      const extraLen = u16(offset + 30);
      const commentLen = u16(offset + 32);
      const localAt = u32(offset + 42);
      const after = offset + 46 + nameLen + extraLen + commentLen;
      if (after > bytes.length) throw new Error('Malformed ZIP entry.');
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
      offset = after;
      if (name.endsWith('/') || name.startsWith('__MACOSX/') || !VALID_FILE.test(name)) continue;
      if (flags & 1) throw new Error(`${name}: encrypted ZIP entries are not supported.`);
      if (method !== 0 && method !== 8) throw new Error(`${name}: unsupported ZIP compression method ${method}.`);
      if (original > MAX_FILE_BYTES) throw new Error(`${name} exceeds the per-file limit.`);
      unpacked += original;
      if (unpacked > MAX_UNPACKED_BYTES) throw new Error('ZIP exceeds the 250 MB extracted-size limit.');
      if (localAt + 30 > bytes.length || u32(localAt) !== 0x04034b50) throw new Error('Malformed ZIP file header.');
      const dataAt = localAt + 30 + u16(localAt + 26) + u16(localAt + 28);
      if (dataAt + compressed > bytes.length) throw new Error('Truncated ZIP data.');
      const payload = bytes.slice(dataAt, dataAt + compressed);
      let extracted = payload;
      if (method === 8) {
        try {
          const stream = new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
          extracted = new Uint8Array(await new Response(stream).arrayBuffer());
        } catch (error) {
          throw new Error(`${name}: could not decompress ZIP entry (${error.message}).`);
        }
      }
      if (extracted.length !== original || crc32(extracted) !== crc) throw new Error(`${name}: ZIP size or CRC check failed.`);
      const baseName = name.split('/').pop();
      out.push({ name, file: new File([extracted], baseName, { type: mimeType(baseName) }) });
      if (state.files.length + out.length > MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files.`);
    }
    if (!out.length) throw new Error('ZIP archive contains no supported data files.');
    return out;
  }

  function crc32(data) {
    let crc = -1;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }
  function mimeType(filename) {
    if (/\.csv$/i.test(filename)) return 'text/csv';
    if (/\.xlsx$/i.test(filename)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (/\.xls$/i.test(filename)) return 'application/vnd.ms-excel';
    if (/\.gz$/i.test(filename)) return 'application/gzip';
    return 'text/plain';
  }

  async function request(endpoint, payload, multipart = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300000);
    try {
      const response = await fetch(SERVER + endpoint, {
        method: 'POST',
        mode: 'cors',
        body: multipart ? payload : JSON.stringify(payload),
        ...(multipart ? {} : { headers: { 'Content-Type': 'application/json' } }),
        signal: controller.signal
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 400);
        throw new Error(`${endpoint}: HTTP ${response.status}${detail ? ` – ${detail}` : ''}`);
      }
      const text = await response.text();
      try { return JSON.parse(text); }
      catch { throw new Error(`${endpoint} returned non-JSON data.`); }
    } catch (error) {
      if (error.name === 'AbortError') throw new Error(`${endpoint} timed out after 5 minutes.`);
      throw error;
    } finally { clearTimeout(timer); }
  }

  async function initServer() {
    try {
      const minerva = ctx.minerva;
      const projectId = minerva.project?.data?.getProjectId?.();
      if (projectId == null) throw new Error('MINERVA project ID is unavailable.');
      status('Initializing server session…');
      const session = await request('initialize_session', [window.parent.location.origin, projectId]);
      if (!session?.hash || !session?.project_hash) throw new Error('Session response lacks hash or project_hash.');
      status('Initializing processing model…');
      await request('initialize_model', { session: session.hash, project_hash: session.project_hash });
      state.ready = { session: session.hash, projectHash: session.project_hash };
      status('Ready to process', 'success');
    } catch (error) {
      console.error('[OLCIR] Server initialization failed', error);
      state.ready = null;
      status('Server unavailable', 'error');
      notice(`Server initialization failed: ${error.message}`);
    } finally { updateButtons(); }
  }

  async function processSelected() {
    if (state.busy || !state.ready) return;
    const selected = state.files.filter(x => x.selected);
    if (!selected.length) return;
    if (selected.some(x => !x.type)) {
      notice('Choose a file type (Expression, Methylation or Variants) for every selected file.');
      return;
    }
    notice('');
    setBusy(true);
    let succeeded = 0;
    let failed = 0;
    const problems = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        const item = selected[i];
        item.status = 'Processing';
        renderFiles();
        status(`Processing ${i + 1} of ${selected.length}: ${item.displayName}`);
        try {
          const form = new FormData();
          form.append('file', item.file, item.file.name);
          form.append('name', item.file.name);
          form.append('session', state.ready.session);
          form.append('has_pvalues', $('olcir-pvalues').checked ? 'true' : 'false');
          // The original endpoint only requires file/name/session/has_pvalues.
          // data_type carries the OLCIR choice for backends that support it.
          form.append('data_type', item.type);
          const response = await request('sylobio/process_omics', form, true);
          const overlays = await convertResponse(response, item);
          if (!overlays.length) throw new Error('Server returned no overlay-compatible data.');
          state.results.push(...overlays);
          item.status = 'Processed';
          succeeded++;
        } catch (error) {
          console.error(`[OLCIR] ${item.displayName}: processing failed`, error);
          item.status = 'Failed';
          failed++;
          problems.push(`${item.displayName}: ${error.message}`);
        }
        renderFiles();
        renderResults();
      }
      status(`${succeeded} file(s) processed${failed ? `, ${failed} failed` : ''}`, failed ? 'error' : 'success');
      if (problems.length) notice(problems.join('\n'));
    } finally { setBusy(false); renderResults(); }
  }

  function normalizeDatasets(response) {
    if (Array.isArray(response)) return response;
    if (response?.error) throw new Error(String(response.error));
    if (Array.isArray(response?.datasets)) return response.datasets;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.files)) return response.files;
    return response && typeof response === 'object' ? [response] : [];
  }

  async function convertResponse(response, item) {
    const datasets = normalizeDatasets(response);
    const results = [];
    for (const dataset of datasets) {
      if (dataset?.error) throw new Error(String(dataset.error));
      if (!dataset || typeof dataset !== 'object') continue;
      const datasetName = String(dataset.name || dataset.filename || item.file.name);
      let table = dataset;
      if (!Array.isArray(table.columns) || !Array.isArray(table.data)) {
        // Same workflow as LUMINAR: process_omics returns dataset descriptors,
        // and get_omics_data returns the mapped numeric table.
        if (dataset.data_id == null) {
          const content = dataset.fileContent ?? dataset.file_content ?? dataset.content ?? dataset.text;
          if (typeof content !== 'string' || !content.trim()) {
            throw new Error('Unrecognized server response (expected data_id or overlay text).');
          }
          results.push({
            name: `OLCIR · ${item.type} · ${datasetName}`,
            type: dataset.type === 'GENETIC_VARIANT' ? 'GENETIC_VARIANT' : 'GENERIC',
            content, source: item.displayName, status: 'ready', id: ++state.nextId,
            records: null
          });
          continue;
        }
        table = await request('sylobio/get_omics_data', {
          session: state.ready.session, data_id: dataset.data_id
        });
      }
      results.push(...tableToOverlays(table, datasetName, item));
    }
    return results;
  }

  function tableToOverlays(table, datasetName, item) {
    if (!Array.isArray(table?.columns) || !Array.isArray(table?.data)) {
      throw new Error('get_omics_data did not return columns and data arrays.');
    }
    const columns = table.columns.map(String);
    const pvals = new Set((table.pvalue_columns || []).map(String));
    const result = [];
    for (let c = 1; c < columns.length; c++) {
      const label = columns[c];
      if (/^(minerva[_ -]?ids?|mapped[_ -]?ids?)$/i.test(label) ||
          /p[-_ ]?val(ue)?/i.test(label) || pvals.has(label) || pvals.has(String(c))) continue;
      const pairs = [];
      for (const row of table.data) {
        if (!Array.isArray(row)) continue;
        const name = String(row[0] ?? '').trim();
        const numeric = Number(row[c]);
        if (!name || !Number.isFinite(numeric) || row[c] === '' || row[c] == null) continue;
        pairs.push([name, numeric]);
      }
      if (!pairs.length) continue;
      let maxAbs = 0;
      for (const [, value] of pairs) maxAbs = Math.max(maxAbs, Math.abs(value));
      // MINERVA basic generic overlay: no header, Name\tValue, values in [-1, 1].
      const text = pairs.map(([name, value]) =>
        `${name.replace(/[\t\r\n]/g, ' ')}\t${maxAbs ? Math.max(-1, Math.min(1, value / maxAbs)).toFixed(6) : '0'}`
      ).join('\n') + '\n';
      result.push({
        id: ++state.nextId,
        name: `OLCIR · ${item.type} · ${datasetName} · ${label}`,
        source: item.displayName,
        content: text,
        type: 'GENERIC', // Numeric gene-associated values, including methylation/variants.
        records: pairs.length,
        status: 'ready'
      });
    }
    if (!result.length) throw new Error(`No numeric data columns found in ${datasetName}.`);
    return result;
  }

  function renderResults() {
    const container = $('olcir-results');
    container.replaceChildren();
    if (!state.results.length) {
      container.append(node('p', { className: 'olcir-empty', text: 'No processed overlays yet.' }));
    }
    for (const result of state.results) {
      const action = node('button', {
        className: 'olcir-btn olcir-btn-secondary olcir-btn-mini',
        type: 'button',
        text: result.status === 'added' ? 'Added' : result.status === 'adding' ? 'Adding…' : 'Add overlay',
        disabled: state.busy || result.status === 'added' || result.status === 'adding'
      });
      action.addEventListener('click', async () => {
        if (state.busy) return;
        setBusy(true);
        try { await addOverlay(result); }
        catch (error) { console.error('[OLCIR] Overlay error', error); notice(`${result.name}: ${error.message}`); }
        finally { setBusy(false); renderResults(); }
      });
      container.append(node('div', { className: 'olcir-result' }, [
        node('div', { className: 'olcir-result-info' }, [
          node('div', { className: 'olcir-result-name', text: result.name }),
          node('div', { className: 'olcir-result-status', text:
            `${result.source}${result.records === null ? '' : ` · ${result.records} entries`} · ${result.status}` })
        ]), action
      ]));
    }
    updateButtons();
  }

  const overlayId = overlay => overlay?.id ?? overlay?.idObject ?? overlay?.overlay?.id ?? overlay?.overlay?.idObject;
  async function addOverlay(result) {
    const api = ctx.minerva.overlays;
    if (typeof api?.addDataOverlay !== 'function') {
      throw new Error('MINERVA addDataOverlay API is unavailable.');
    }
    result.status = 'adding';
    renderResults();
    try {
      const before = await Promise.resolve(api.data?.getDataOverlays?.() ?? []);
      const idSet = new Set(before.map(x => String(overlayId(x))).filter(x => x !== 'undefined'));
      const created = await api.addDataOverlay({
        name: result.name,
        description: `Processed with OLCIR from ${result.source}`,
        filename: `${result.name.replace(/[^a-z0-9._-]+/gi, '_')}.txt`,
        fileContent: result.content,
        type: result.type
      });
      let id = overlayId(created);
      if (id == null) {
        const after = await Promise.resolve(api.data?.getDataOverlays?.() ?? []);
        const match = after.find(x => x.name === result.name && !idSet.has(String(overlayId(x))));
        id = overlayId(match);
      }
      result.status = 'added';
      if (id != null && typeof api.showDataOverlay === 'function') {
        try { await api.showDataOverlay(id); }
        catch (error) { notice(`Overlay added, but could not show it automatically: ${error.message}`); }
      } else {
        notice('Overlay added. Open the MINERVA Overlays panel to show it.', 'success');
      }
      status(`Added ${result.name}`, 'success');
    } catch (error) {
      result.status = 'ready';
      throw error;
    } finally { renderResults(); }
  }

  async function addAllOverlays() {
    if (state.busy) return;
    const pending = state.results.filter(x => x.status !== 'added');
    if (!pending.length) return;
    setBusy(true);
    const errors = [];
    try {
      for (const result of pending) {
        try { await addOverlay(result); }
        catch (error) { errors.push(`${result.name}: ${error.message}`); }
      }
      if (errors.length) notice(errors.join('\n'));
      else notice(`${pending.length} overlay(s) added to MINERVA.`, 'success');
    } finally { setBusy(false); renderResults(); }
  }

  createUI();
  void initServer();
})();
