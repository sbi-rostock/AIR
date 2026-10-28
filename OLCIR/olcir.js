/* OLCIR v1.1.1 scroll fix application: the only application script loaded by plugin.js.
 * Dependencies: modern browser APIs only (fetch, File, DecompressionStream).
 * MINERVA API: registerPlugin is in plugin.js; overlays are created here.
 */
(() => {
  'use strict';

  // LUMINAR architecture: plugin.js publishes olcir_data on the MINERVA window.
  // plugin.js loads this script in its iframe, then explicitly calls initialize().
  let olcir_data = null;
  let minerva = null;
  let SERVER = '';
  let initialized = false;
  const VALID_FILE = /\.(txt|tsv|csv|tab|data|xlsx|xls|vcf|maf|bed)(?:\.gz)?$/i;
  const MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAX_UNPACKED_BYTES = 250 * 1024 * 1024;
  const MAX_FILES = 250;
  const state = { files: [], results: [], busy: false, nextId: 0 };
  const TYPES = [
    ['', 'Choose type…'],
    ['cnv', 'CNV'],
    ['gene_expression', 'Gene expression'],
    ['methyl', 'Methylation'],
    ['num_svs', 'Structural variants'],
    ['num_variants', 'Somatic variants']
  ];

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
        ${olcir_data.TESTING ? '<span class="olcir-mode">Local assets</span>' : ''}
      </div>
      <section class="olcir-card" aria-label="Upload files">
        <h2>1. Select datasets</h2>
        <input id="olcir-upload" class="olcir-fileinput" type="file" multiple
               accept=".txt,.tsv,.csv,.tab,.data,.xlsx,.xls,.vcf,.vcf.gz,.maf,.maf.gz,.bed,.zip">
        <p class="olcir-hint" style="margin-top:8px">Select multiple files or a ZIP. Matching RNA-seq and miRNA files are automatically grouped as one dataset.</p>
        <div id="olcir-file-area" class="olcir-hidden">
          <table class="olcir-table"><thead><tr>
            <th class="olcir-select-col"><input id="olcir-all" type="checkbox" checked title="Select or deselect all files" aria-label="Select all"></th>
            <th>Dataset / files</th><th class="olcir-type-col">Type</th><th class="olcir-state-col">Status</th>
          </tr></thead><tbody id="olcir-files"></tbody></table>
        </div>
        <div class="olcir-actions">
          <button id="olcir-clear" class="olcir-btn olcir-btn-secondary" type="button">Clear list</button>
        </div>
        <div class="olcir-actions">
          <button id="olcir-process" class="olcir-btn" type="button" disabled>Process selected files</button>
          <span id="olcir-status" class="olcir-status" role="status" aria-live="polite">Ready to process</span>
        </div>
        <div id="olcir-notice" class="olcir-notice olcir-hidden" role="alert"></div>
      </section>
      <section class="olcir-card" aria-label="Processed overlays">
        <h2>2. Add processed overlays</h2>
        <p class="olcir-hint" style="margin-bottom:10px">Each converted dataset produces one MINERVA overlay (name and value).</p>
        <div id="olcir-results" class="olcir-list"><p class="olcir-empty">No processed overlays yet.</p></div>
        <div class="olcir-actions">
          <button id="olcir-addall" class="olcir-btn olcir-btn-secondary" type="button" disabled>Add all to map</button>
        </div>
      </section>`;
    // Build inside the iframe container passed by the parent MINERVA plugin,
    // rather than replacing document.body (the iframe shell belongs to plugin.js).
    olcir_data.container.empty().append(main);

    $('olcir-upload').addEventListener('change', async event => {
      await addFiles(Array.from(event.target.files ?? []));
      event.target.value = ''; // selecting the same file again is allowed
    });
    $('olcir-all').addEventListener('change', event => {
      for (const item of getJobs()) if (!item.orphan) item.primary.selected = event.target.checked;
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
    $('olcir-all').disabled = value;
    updateButtons();
    for (const el of document.querySelectorAll('.olcir-file-check, .olcir-type')) el.disabled = value;
  }
  function updateButtons() {
    const selected = getJobs().filter(x => !x.orphan && x.primary.selected);
    $('olcir-process').disabled = state.busy || !selected.length;
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
          for (const entry of extracted) await enqueue(entry.file, `${file.name} / ${entry.name}`);
        } else if (VALID_FILE.test(file.name)) {
          if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds ${prettySize(MAX_FILE_BYTES)}.`);
          await enqueue(file, file.name);
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }
      }
      status('Ready to process', 'success');
    } catch (error) {
      console.error('[OLCIR] File selection error', error);
      notice(error.message);
      status('Some files could not be added', 'error');
    } finally {
      setBusy(false);
      renderFiles();
    }
  }

  // Recognize the original TCGA file names; inspect headers if the name is ambiguous.
  function detectByName(name) {
    const n = name.toLowerCase();
    if (/mirbase21\.mirnas\.quantification|mirnas?\.quantification|mirna.*quantification/.test(n)) return 'mirna';
    if (/rna_seq\.augmented_star_gene_counts|augmented.star.gene.counts|star_gene_counts/.test(n)) return 'gene_expression';
    if (/ascat3\.gene_level_copy_number|gene_level_copy_number|\bcnv\b|copy[_ .-]?number/.test(n)) return 'cnv';
    if (/methylation_array|level3betas|methylation|sesame/.test(n)) return 'methyl';
    if (/somatic_sv|structural[_ .-]?variants?|manta|\bsv\.vcf/.test(n)) return 'num_svs';
    if (/\.maf(?:\.gz)?$|\.wxs\.|mutect|varscan|pindel/.test(n)) return 'num_variants';
    return '';
  }

  async function detectFileType(file) {
    const byName = detectByName(file.name);
    if (byName) return byName;
    if (/\.gz$/i.test(file.name)) return ''; // compressed content cannot be sampled as plain text
    const text = (await file.slice(0, 12288).text()).toLowerCase();
    const header = text.split(/\r?\n/).find(x => x.trim() && !x.startsWith('#')) || '';
    if (/\bmirna_id\b/.test(header) && /reads_per_million_mirna_mapped/.test(header)) return 'mirna';
    if (/\btpm_unstranded\b/.test(header) && /\bgene_id\b/.test(header)) return 'gene_expression';
    if (/\bcopy_number\b/.test(header) && /\bgene_name\b/.test(header)) return 'cnv';
    if (/\bcpg_id\b/.test(header) && /\bbeta_value\b/.test(header)) return 'methyl';
    if (/hugo_symbol/i.test(header) && /variant_classification|\bgene\b/i.test(header)) return 'num_variants';
    if (/svtype[=;]|<bnd>|<del>|<dup>/.test(text)) return 'num_svs';
    return '';
  }

  // Both TCGA-T1.rna_seq... and TCGA-T1.mirbase21... become "tcga-t1".
  function sampleKey(name) {
    return name.split('/').pop().replace(/(?:\.rna_seq\..*|\.mirbase21\..*|\.ascat3\..*|\.methylation_array\..*|\.somatic_sv\..*|\.wxs\..*|\.(?:maf|vcf|tsv|csv|txt)(?:\.gz)?)$/i, '').toLowerCase();
  }

  async function enqueue(file, displayName) {
    if (state.files.length >= MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files.`);
    const detected = await detectFileType(file);
    state.files.push({
      id: ++state.nextId, file, displayName,
      sample: sampleKey(file.name),
      type: detected, selected: true, status: 'Queued'
    });
  }

  // Build logical datasets from physical files, without removing them from state.
  // A matching miRNA input is the companion to RNA-seq, never a separate job.
  function getJobs() {
    const jobs = [];
    const mirnas = state.files.filter(x => x.type === 'mirna');
    const paired = new Set();
    for (const item of state.files) {
      if (item.type === 'mirna') continue;
      let companion = null;
      if (item.type === 'gene_expression') {
        companion = mirnas.find(m => !paired.has(m.id) && m.sample === item.sample) || null;
        if (companion) paired.add(companion.id);
      }
      jobs.push({ primary: item, companion, orphan: false, id: item.id });
    }
    for (const item of mirnas) {
      if (!paired.has(item.id)) jobs.push({ primary: item, companion: null, orphan: true, id: item.id });
    }
    return jobs.sort((a, b) => a.id - b.id);
  }

  function renderFiles() {
    const table = $('olcir-files');
    table.replaceChildren();
    $('olcir-file-area').classList.toggle('olcir-hidden', !state.files.length);
    const jobs = getJobs();
    for (const job of jobs) {
      const item = job.primary;
      const check = node('input', {
        type: 'checkbox', checked: item.selected && !job.orphan,
        className: 'olcir-file-check'
      });
      check.setAttribute('aria-label', `Select ${item.displayName}`);
      check.disabled = state.busy || job.orphan;
      check.addEventListener('change', () => {
        item.selected = check.checked;
        $('olcir-all').checked = getJobs().filter(x => !x.orphan).every(x => x.primary.selected);
        updateButtons();
      });
      const select = node('select', { className: 'olcir-select olcir-type' });
      select.setAttribute('aria-label', `Data type for ${item.displayName}`);
      if (job.orphan) {
        select.append(node('option', { value: 'mirna', text: 'miRNA partner' }));
        select.disabled = true;
      } else {
        for (const [value, title] of TYPES) select.append(node('option', { value, text: title }));
        select.value = item.type;
        select.disabled = state.busy;
        select.addEventListener('change', () => {
          item.type = select.value;
          renderFiles(); // changing the type may create/remove a pairing
        });
      }
      const details = job.companion
        ? `RNA-seq + miRNA · ${prettySize(item.file.size)} + ${prettySize(job.companion.file.size)}`
        : job.orphan ? 'Awaiting RNA-seq file for the same sample' : prettySize(item.file.size);
      table.append(node('tr', {}, [
        node('td', { className: 'olcir-select-col' }, [check]),
        node('td', {}, [
          node('div', { className: 'olcir-filename', text: item.displayName }),
          ...(job.companion ? [node('div', { className: 'olcir-paired', text: `+ ${job.companion.displayName}` })] : []),
          node('div', { className: 'olcir-small', text: details })
        ]),
        node('td', {}, [select]),
        node('td', { className: 'olcir-small', text: job.orphan ? 'Awaiting pair' : item.status })
      ]));
    }
    const processable = jobs.filter(x => !x.orphan);
    $('olcir-all').checked = processable.length > 0 && processable.every(x => x.primary.selected);
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

  // Unlike LUMINAR's process_omics endpoint, /olcir/convert needs no session.
  // Use FileReader instead of btoa(String.fromCharCode(...)) to handle large uploads.
  function fileBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const split = dataUrl.indexOf(',');
        if (split < 0) reject(new Error(`Failed to encode ${file.name}`));
        else resolve(dataUrl.slice(split + 1));
      };
      reader.readAsDataURL(file);
    });
  }

  async function processSelected() {
    if (state.busy) return;
    const selected = getJobs().filter(x => !x.orphan && x.primary.selected);
    if (!selected.length) return;
    if (selected.some(x => !x.primary.type)) {
      notice('Choose a data type for each selected dataset that was not recognized automatically.');
      return;
    }
    notice('');
    setBusy(true);
    let succeeded = 0;
    const problems = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        const job = selected[i];
        const item = job.primary;
        item.status = 'Processing';
        renderFiles();
        status(`Converting ${i + 1}/${selected.length}: ${item.displayName}`);
        try {
          const options = {};
          if (job.companion) options.mirna_content = await fileBase64(job.companion.file);
          const payload = {
            files: [{
              filename: item.file.name,
              filetype: item.type,
              content: await fileBase64(item.file),
              options
            }]
          };
          const response = await request('olcir/convert', payload);
          if (response?.error) throw new Error(String(response.error));
          const returned = response?.converted_files;
          if (!Array.isArray(returned) || returned.length !== 1) {
            throw new Error('Unexpected /olcir/convert response: expected one converted file.');
          }
          const file = returned[0];
          if (file.error) throw new Error(file.error);
          const overlay = convertedToOverlay(file.content, item, job);
          // Replace stale, not-yet-added results from previous conversions of this dataset.
          state.results = state.results.filter(x => x.jobId !== job.id || x.status === 'added');
          state.results.push(overlay);
          item.status = 'Processed';
          succeeded++;
        } catch (error) {
          console.error(`[OLCIR] Failed to convert ${item.displayName}`, error);
          item.status = 'Failed';
          problems.push(`${item.displayName}: ${error.message}`);
        }
        renderFiles();
        renderResults();
      }
      status(`${succeeded} converted, ${problems.length} failed`, problems.length ? 'error' : 'success');
      if (problems.length) notice(problems.join('\n'));
    } finally {
      setBusy(false);
      renderResults();
    }
  }

  function convertedToOverlay(tsv, item, job) {
    if (typeof tsv !== 'string' || !tsv.trim()) throw new Error('Converter returned no TSV data.');
    const lines = tsv.replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x.trim());
    const headers = (lines.shift() || '').split('\t').map(x => x.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const valueIndex = headers.indexOf('value');
    if (nameIndex < 0 || valueIndex < 0) {
      throw new Error('Converted data is missing the NAME or VALUE column.');
    }
    const pairs = [];
    for (const line of lines) {
      const cells = line.split('\t');
      const name = (cells[nameIndex] || '').trim().replace(/[\t\r\n]/g, ' ');
      const valueRaw = cells[valueIndex];
      if (!name || !valueRaw || !valueRaw.trim()) continue;
      const value = Number(valueRaw);
      if (!Number.isFinite(value)) continue;
      // Converters already apply their biological scaling: never renormalize here.
      pairs.push(`${name}\t${Math.max(-1, Math.min(1, value))}`);
    }
    if (!pairs.length) throw new Error('Converter returned no usable NAME/VALUE pairs.');
    // The MINERVA upload parser REQUIRES a recognized header.
    // CUSTOM_LABEL is not an accepted MINERVA column, so omit it from the overlay.
    const content = 'name\tvalue\n' + pairs.join('\n') + '\n';
    return {
      id: ++state.nextId,
      jobId: job.id,
      name: `OLCIR · ${TYPES.find(x => x[0] === item.type)?.[1] || item.type} · ${item.sample || item.file.name}`,
      source: job.companion ? `${item.displayName} + ${job.companion.displayName}` : item.displayName,
      content, type: 'GENERIC', records: pairs.length, status: 'ready'
    };
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
    const api = minerva.overlays;
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

  // MINERVA places OLCIR in an iframe *below* its own plugin toolbar.
  // A fixed calc(100vh - 175px) overestimates the available space on some
  // maps and clips the lower controls. Size to the iframe's real screen position.
  function configureScrolling() {
    const scrollHost = document.getElementById('olcir_plugincontainer');
    if (!scrollHost) throw new Error('OLCIR scroll container was not found.');

    // The LUMINAR shell sets overflow:hidden on <html>/<body>, and other
    // versions set overflow:auto on the body. We use exactly ONE scroll host.
    document.documentElement.style.setProperty('height', '100%', 'important');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('height', '100%', 'important');
    document.body.style.setProperty('margin', '0', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    scrollHost.style.setProperty('height', '100%', 'important');
    scrollHost.style.setProperty('min-height', '0', 'important');
    scrollHost.style.setProperty('overflow-y', 'auto', 'important');
    scrollHost.style.setProperty('overflow-x', 'hidden', 'important');
    scrollHost.style.setProperty('overscroll-behavior', 'contain');
    scrollHost.scrollTop = 0;

    const frame = window.frameElement;
    if (frame) {
      const parentWindow = frame.ownerDocument.defaultView;
      let queued = false;
      const fitToVisibleArea = () => {
        queued = false;
        if (!frame.isConnected) return;
        const rect = frame.getBoundingClientRect();
        let visibleBottom = parentWindow.innerHeight - 8;

        // Respect MINERVA's visible clipping panels as well as the viewport.
        for (let ancestor = frame.parentElement;
          ancestor && ancestor !== frame.ownerDocument.documentElement;
          ancestor = ancestor.parentElement) {
          const style = parentWindow.getComputedStyle(ancestor);
          if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
            const edge = ancestor.getBoundingClientRect().bottom;
            if (Number.isFinite(edge)) visibleBottom = Math.min(visibleBottom, edge - 6);
          }
        }
        const available = Math.max(160, Math.floor(visibleBottom - Math.max(0, rect.top)));
        const previous = Number.parseFloat(frame.style.height);
        if (!Number.isFinite(previous) || Math.abs(previous - available) > 1) {
          frame.style.setProperty('height', `${available}px`, 'important');
        }
        frame.style.setProperty('min-height', '0', 'important');
        frame.style.setProperty('width', '100%', 'important');
        frame.style.setProperty('display', 'block');
        frame.style.setProperty('border', '0');
      };
      const scheduleFit = () => {
        if (!queued) {
          queued = true;
          parentWindow.requestAnimationFrame(fitToVisibleArea);
        }
      };
      fitToVisibleArea();
      parentWindow.addEventListener('resize', scheduleFit);
      parentWindow.addEventListener('scroll', scheduleFit, true);
      window.addEventListener('resize', scheduleFit);
      window.addEventListener('pagehide', () => {
        parentWindow.removeEventListener('resize', scheduleFit);
        parentWindow.removeEventListener('scroll', scheduleFit, true);
        window.removeEventListener('resize', scheduleFit);
      }, { once: true });
    }

    // Some MINERVA installations swallow the wheel's default scroll action.
    // Route vertical wheel/trackpad input explicitly to the scrollable OLCIR
    // container anywhere over its content (not just on the scrollbar thumb).
    // This runs in the iframe and does not intercept zooming on the map.
    window.addEventListener('wheel', event => {
      if (event.ctrlKey || !scrollHost.contains(event.target)) return;
      const multiplier = event.deltaMode === 1 ? 20 :
        event.deltaMode === 2 ? scrollHost.clientHeight : 1;
      if (event.cancelable) event.preventDefault();
      scrollHost.scrollTop += event.deltaY * multiplier;
    }, { capture: true, passive: false });
  }

  /** Entry point invoked by the current LUMINAR-style loader:
   * iframe.contentWindow.initialize_server()
   * The loader handles registration and loads only olcir.js + olcir.css.
   * All OLCIR UI, events, processing and overlays are implemented here.
   */
  async function initialize_server() {
    if (initialized) return;
    console.info('[OLCIR v1.1.1] initialize_server() called.');
    olcir_data = window.parent.olcir_data;
    minerva = window.parent.minerva;
    if (!olcir_data?.container?.empty || !olcir_data?.container?.append) {
      throw new Error('OLCIR iframe container is unavailable.');
    }
    if (!minerva) throw new Error('MINERVA API is unavailable.');
    if (!olcir_data.SBI_SERVER) throw new Error('OLCIR server URL is not configured.');
    SERVER = olcir_data.SBI_SERVER.replace(/\/+$/, '') + '/';
    initialized = true;
    createUI();
    configureScrolling();
    status('Ready to process', 'success');
  }

  // Publish the entry point on the iframe window for plugin.js.
  // No HTML is created until initialize_server() is called.
  window.initialize_server = initialize_server;
})();
