/* ===================================================================
   Organogram — app.js
   Excel → Org Chart renderer with zoom, pan, snip & PNG export
   =================================================================== */

(function () {
  'use strict';

  // ───── DOM refs ─────
  const $ = (s) => document.querySelector(s);
  const uploadSection  = $('#upload-section');
  const chartSection   = $('#chart-section');
  const headerActions  = $('#header-actions');
  const fileInput      = $('#file-input');
  const uploadCard     = $('#upload-card');
  const chartViewport  = $('#chart-viewport');
  const chartCanvas    = $('#chart-canvas');
  const snipOverlay    = $('#snip-overlay');
  const snipSelection  = $('#snip-selection');
  const toastContainer = $('#toast-container');

  // ───── State ─────
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isPanning = false;
  let panStartX, panStartY;
  let isSnipping = false;
  let snipStartX, snipStartY;

  // ───── Dummy / Demo Data ─────
  const DEMO_DATA = [
    { Name: 'Ahmed Khan',       Title: 'CEO',                   ReportsTo: '',               Client: '—',              Location: 'Karachi' },
    { Name: 'Sara Ali',         Title: 'VP Engineering',        ReportsTo: 'Ahmed Khan',     Client: 'Acme Corp',      Location: 'Karachi' },
    { Name: 'Omar Farooq',      Title: 'VP Operations',         ReportsTo: 'Ahmed Khan',     Client: 'GlobalTech',     Location: 'Lahore' },
    { Name: 'Fatima Zahra',     Title: 'VP Sales',              ReportsTo: 'Ahmed Khan',     Client: 'MegaRetail',     Location: 'Dubai' },
    { Name: 'Hassan Raza',      Title: 'HR Director',           ReportsTo: 'Ahmed Khan',     Client: '—',              Location: 'KSA' },
    { Name: 'Bilal Siddiqui',   Title: 'Lead Engineer',         ReportsTo: 'Sara Ali',       Client: 'Acme Corp',      Location: 'Karachi' },
    { Name: 'Ayesha Tariq',     Title: 'Senior Developer',      ReportsTo: 'Sara Ali',       Client: 'Acme Corp',      Location: 'Lahore' },
    { Name: 'Zain Ul Abideen',  Title: 'DevOps Engineer',       ReportsTo: 'Sara Ali',       Client: 'CloudSync',      Location: 'KSA' },
    { Name: 'Nadia Hussain',    Title: 'QA Lead',               ReportsTo: 'Sara Ali',       Client: 'Acme Corp',      Location: 'Karachi' },
    { Name: 'Usman Ghani',      Title: 'Operations Manager',    ReportsTo: 'Omar Farooq',    Client: 'GlobalTech',     Location: 'Lahore' },
    { Name: 'Hira Sheikh',      Title: 'Logistics Lead',        ReportsTo: 'Omar Farooq',    Client: 'SwiftShip',      Location: 'Karachi' },
    { Name: 'Tariq Mehmood',    Title: 'Sales Manager',         ReportsTo: 'Fatima Zahra',   Client: 'MegaRetail',     Location: 'Dubai' },
    { Name: 'Amna Malik',       Title: 'Account Executive',     ReportsTo: 'Fatima Zahra',   Client: 'LuxeBrands',     Location: 'Dubai' },
    { Name: 'Imran Yousuf',     Title: 'Business Dev Lead',     ReportsTo: 'Fatima Zahra',   Client: 'MegaRetail',     Location: 'KSA' },
    { Name: 'Rabia Noor',       Title: 'HR Manager',            ReportsTo: 'Hassan Raza',    Client: '—',              Location: 'KSA' },
    { Name: 'Danish Iqbal',     Title: 'Recruitment Lead',      ReportsTo: 'Hassan Raza',    Client: '—',              Location: 'Lahore' },
    { Name: 'Sana Javed',       Title: 'Frontend Developer',    ReportsTo: 'Bilal Siddiqui', Client: 'Acme Corp',      Location: 'Karachi' },
    { Name: 'Kamran Akmal',     Title: 'Backend Developer',     ReportsTo: 'Bilal Siddiqui', Client: 'Acme Corp',      Location: 'Lahore' },
    { Name: 'Mehwish Hayat',    Title: 'QA Engineer',           ReportsTo: 'Nadia Hussain',  Client: 'Acme Corp',      Location: 'Karachi' },
    { Name: 'Faisal Qureshi',   Title: 'Sales Executive',       ReportsTo: 'Tariq Mehmood',  Client: 'MegaRetail',     Location: 'Dubai' },
  ];

  // ───── Initialization ─────
  function init() {
    // Upload interactions
    $('#btn-browse').addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    uploadCard.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    $('#btn-template').addEventListener('click', (e) => { e.stopPropagation(); downloadTemplate(); });
    $('#btn-load-demo').addEventListener('click', (e) => { e.stopPropagation(); loadDemoData(); });

    // Drag & drop
    uploadCard.addEventListener('dragover', (e) => { e.preventDefault(); uploadCard.classList.add('drag-over'); });
    uploadCard.addEventListener('dragleave', () => uploadCard.classList.remove('drag-over'));
    uploadCard.addEventListener('drop', handleDrop);

    // Header action buttons
    $('#btn-new-upload').addEventListener('click', showUpload);
    $('#btn-zoom-in').addEventListener('click', () => zoomBy(0.15));
    $('#btn-zoom-out').addEventListener('click', () => zoomBy(-0.15));
    $('#btn-fit').addEventListener('click', fitToScreen);
    $('#btn-export').addEventListener('click', exportPNG);
    $('#btn-screenshot').addEventListener('click', startSnip);

    // Pan
    chartViewport.addEventListener('mousedown', panStart);
    window.addEventListener('mousemove', panMove);
    window.addEventListener('mouseup', panEnd);

    // Mouse-wheel zoom
    chartViewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 0.08 : -0.08);
    }, { passive: false });

    // Snip interactions
    snipOverlay.addEventListener('mousedown', snipStart);
    window.addEventListener('mousemove', snipMove);
    window.addEventListener('mouseup', snipEnd);
  }

  // ───── File Handling ─────
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) parseExcel(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    uploadCard.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) parseExcel(file);
  }

  function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!data.length) { toast('No data found in the file.', 'error'); return; }
        const normalized = normalizeData(data);
        if (!normalized) return;
        buildChart(normalized);
        toast('Chart generated successfully!', 'success');
      } catch (err) {
        console.error(err);
        toast('Error parsing file. Please check the format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function normalizeData(rows) {
    // Try to auto-detect columns
    const first = rows[0];
    const keys = Object.keys(first);
    const find = (candidates) => keys.find(k => candidates.includes(k.toLowerCase().trim()));
    const nameCol     = find(['name', 'employee', 'employee name', 'full name', 'fullname']);
    const titleCol    = find(['title', 'designation', 'position', 'role', 'job title']);
    const reportsCol  = find(['reportsto', 'reports to', 'manager', 'supervisor', 'parent', 'reports_to']);
    const clientCol   = find(['client', 'client name', 'customer', 'account']);
    const locationCol = find(['location', 'city', 'office', 'site']);

    if (!nameCol) { toast('Could not find a "Name" column.', 'error'); return null; }

    return rows.map(r => ({
      Name:      (r[nameCol] || '').toString().trim(),
      Title:     (r[titleCol] || '').toString().trim(),
      ReportsTo: (r[reportsCol] || '').toString().trim(),
      Client:    (r[clientCol] || '').toString().trim(),
      Location:  (r[locationCol] || '').toString().trim(),
    })).filter(r => r.Name);
  }

  // ───── Tree Builder ─────
  function buildTree(data) {
    const map = {};
    data.forEach(d => { map[d.Name] = { ...d, children: [] }; });
    const roots = [];
    data.forEach(d => {
      if (d.ReportsTo && map[d.ReportsTo]) {
        map[d.ReportsTo].children.push(map[d.Name]);
      } else {
        roots.push(map[d.Name]);
      }
    });
    return roots;
  }

  // ───── Chart Rendering ─────
  function buildChart(data) {
    const roots = buildTree(data);
    chartCanvas.innerHTML = '';

    const treeEl = document.createElement('div');
    treeEl.className = 'org-tree';
    roots.forEach(root => treeEl.appendChild(renderNode(root, true)));
    chartCanvas.appendChild(treeEl);

    showChart();

    // Wait for layout, then draw connectors & fit
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawConnectors();
        fitToScreen();
      });
    });
  }

  function renderNode(node, isRoot = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'org-node-wrapper';

    // Node card
    const card = document.createElement('div');
    card.className = 'org-node' + (isRoot ? ' root-node' : '');
    card.innerHTML = `
      <div class="node-name" title="${esc(node.Name)}">${esc(node.Name)}</div>
      <div class="node-title" title="${esc(node.Title)}">${esc(node.Title)}</div>
      <div class="node-meta">
        ${node.Client && node.Client !== '—' ? `<span class="node-badge badge-client">🏢 ${esc(node.Client)}</span>` : ''}
        ${node.Location ? `<span class="node-badge badge-location ${locClass(node.Location)}">📍 ${esc(node.Location)}</span>` : ''}
      </div>
    `;
    wrapper.appendChild(card);

    // Children
    if (node.children.length) {
      const toggle = document.createElement('div');
      toggle.className = 'node-toggle';
      toggle.textContent = '−';
      toggle.title = 'Collapse';
      card.appendChild(toggle);

      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'org-children';
      node.children.forEach(child => childrenContainer.appendChild(renderNode(child)));
      wrapper.appendChild(childrenContainer);

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const collapsed = childrenContainer.style.display === 'none';
        childrenContainer.style.display = collapsed ? '' : 'none';
        toggle.textContent = collapsed ? '−' : '+';
        toggle.title = collapsed ? 'Collapse' : 'Expand';
        requestAnimationFrame(() => drawConnectors());
      });
    }

    return wrapper;
  }

  function locClass(loc) {
    const l = loc.toLowerCase().trim();
    if (l === 'karachi') return 'loc-karachi';
    if (l === 'ksa')     return 'loc-ksa';
    if (l === 'dubai')   return 'loc-dubai';
    if (l === 'lahore')  return 'loc-lahore';
    return 'loc-default';
  }

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  // ───── SVG Connectors ─────
  function drawConnectors() {
    // Remove old SVGs
    chartCanvas.querySelectorAll('.connector-svg').forEach(el => el.remove());

    // Temporarily reset transform so getBoundingClientRect gives us
    // coordinates in the canvas's own local coordinate space.
    const prevTransform = chartCanvas.style.transform;
    chartCanvas.style.transform = 'none';

    const canvasRect = chartCanvas.getBoundingClientRect();

    chartCanvas.querySelectorAll('.org-node-wrapper').forEach(wrapper => {
      const childrenContainer = wrapper.querySelector(':scope > .org-children');
      if (!childrenContainer || childrenContainer.style.display === 'none') return;

      const parentCard = wrapper.querySelector(':scope > .org-node');
      const childWrappers = childrenContainer.querySelectorAll(':scope > .org-node-wrapper');
      if (!childWrappers.length) return;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('connector-svg');
      svg.style.width = chartCanvas.scrollWidth + 'px';
      svg.style.height = chartCanvas.scrollHeight + 'px';

      const parentRect = parentCard.getBoundingClientRect();
      const px = (parentRect.left + parentRect.right) / 2 - canvasRect.left;
      const py = parentRect.bottom - canvasRect.top;

      const midY = py + 16; // midpoint for the horizontal bar

      childWrappers.forEach(cw => {
        const childCard = cw.querySelector(':scope > .org-node');
        const childRect = childCard.getBoundingClientRect();
        const cx = (childRect.left + childRect.right) / 2 - canvasRect.left;
        const cy = childRect.top - canvasRect.top;

        // Path: down from parent → horizontal at midY → down to child
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`);
        svg.appendChild(path);
      });

      chartCanvas.appendChild(svg);
    });

    // Restore the transform
    chartCanvas.style.transform = prevTransform;
  }

  // ───── View Toggle ─────
  function showChart() {
    uploadSection.style.display = 'none';
    chartSection.style.display = '';
    headerActions.style.display = 'flex';
  }

  function showUpload() {
    uploadSection.style.display = '';
    chartSection.style.display = 'none';
    headerActions.style.display = 'none';
    fileInput.value = '';
  }

  // ───── Zoom & Pan ─────
  function applyTransform() {
    chartCanvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    drawConnectors();
  }

  function zoomBy(delta) {
    scale = Math.min(3, Math.max(0.15, scale + delta));
    applyTransform();
  }

  function fitToScreen() {
    const vw = chartViewport.clientWidth;
    const vh = chartViewport.clientHeight;
    const cw = chartCanvas.scrollWidth;
    const ch = chartCanvas.scrollHeight;
    scale = Math.min(vw / cw, vh / ch, 1) * 0.9;
    translateX = (vw - cw * scale) / 2;
    translateY = (vh - ch * scale) / 2;
    applyTransform();
  }

  function panStart(e) {
    if (isSnipping) return;
    isPanning = true;
    panStartX = e.clientX - translateX;
    panStartY = e.clientY - translateY;
    chartViewport.classList.add('grabbing');
  }
  function panMove(e) {
    if (!isPanning) return;
    translateX = e.clientX - panStartX;
    translateY = e.clientY - panStartY;
    applyTransform();
  }
  function panEnd() {
    isPanning = false;
    chartViewport.classList.remove('grabbing');
  }

  // ───── Export Full PNG ─────
  function exportPNG() {
    toast('Rendering chart… please wait.', 'info');
    const prevTransform = chartCanvas.style.transform;
    chartCanvas.style.transform = 'none';
    html2canvas(chartCanvas, { backgroundColor: '#0b0d17', scale: 2, useCORS: true }).then(canvas => {
      chartCanvas.style.transform = prevTransform;
      const link = document.createElement('a');
      link.download = 'organogram.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('Chart exported as PNG!', 'success');
    }).catch((err) => {
      chartCanvas.style.transform = prevTransform;
      console.error(err);
      toast('Export failed.', 'error');
    });
  }

  // ───── Snip / Screenshot ─────
  function startSnip() {
    isSnipping = true;
    snipOverlay.style.display = '';
    snipSelection.style.width = '0';
    snipSelection.style.height = '0';
  }

  function snipStart(e) {
    snipStartX = e.clientX;
    snipStartY = e.clientY;
    snipSelection.style.left = e.clientX + 'px';
    snipSelection.style.top = (e.clientY - 60) + 'px'; // offset header
    snipSelection.style.width = '0';
    snipSelection.style.height = '0';
  }
  function snipMove(e) {
    if (!isSnipping || snipStartX == null) return;
    const x = Math.min(e.clientX, snipStartX);
    const y = Math.min(e.clientY, snipStartY) - 60;
    const w = Math.abs(e.clientX - snipStartX);
    const h = Math.abs(e.clientY - snipStartY);
    snipSelection.style.left = x + 'px';
    snipSelection.style.top = y + 'px';
    snipSelection.style.width = w + 'px';
    snipSelection.style.height = h + 'px';
  }
  function snipEnd(e) {
    if (!isSnipping || snipStartX == null) return;
    const x1 = Math.min(e.clientX, snipStartX);
    const y1 = Math.min(e.clientY, snipStartY);
    const w  = Math.abs(e.clientX - snipStartX);
    const h  = Math.abs(e.clientY - snipStartY);

    snipOverlay.style.display = 'none';
    isSnipping = false;
    snipStartX = null;

    if (w < 10 || h < 10) { toast('Selection too small. Try again.', 'error'); return; }

    toast('Capturing snippet…', 'info');

    // Capture the chart viewport area then crop
    const vpRect = chartViewport.getBoundingClientRect();
    const prevTransform = chartCanvas.style.transform;
    // We keep the transform to capture exactly what the user sees
    html2canvas(chartViewport, { backgroundColor: '#0b0d17', scale: 2, useCORS: true }).then(fullCanvas => {
      // Crop
      const sx = (x1 - vpRect.left) * 2;
      const sy = (y1 - vpRect.top) * 2;
      const sw = w * 2;
      const sh = h * 2;

      const crop = document.createElement('canvas');
      crop.width = sw;
      crop.height = sh;
      const ctx = crop.getContext('2d');
      ctx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      const link = document.createElement('a');
      link.download = 'organogram-snippet.png';
      link.href = crop.toDataURL('image/png');
      link.click();
      toast('Snippet saved!', 'success');
    }).catch((err) => {
      console.error(err);
      toast('Snip failed.', 'error');
    });
  }

  // ───── Template Download ─────
  function downloadTemplate() {
    const template = [
      { Name: 'John Smith',  Title: 'CEO',             ReportsTo: '',            Client: '—',         Location: 'Karachi' },
      { Name: 'Jane Doe',    Title: 'VP Engineering',   ReportsTo: 'John Smith',  Client: 'Acme Corp', Location: 'Dubai' },
      { Name: 'Bob Lee',     Title: 'Director Design',  ReportsTo: 'John Smith',  Client: 'TechCo',    Location: 'Lahore' },
      { Name: 'Alice Wang',  Title: 'Senior Engineer',  ReportsTo: 'Jane Doe',    Client: 'Acme Corp', Location: 'KSA' },
      { Name: 'Charlie Kim', Title: 'UI Designer',      ReportsTo: 'Bob Lee',     Client: 'TechCo',    Location: 'Lahore' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OrgData');
    XLSX.writeFile(wb, 'organogram_template.xlsx');
    toast('Template downloaded.', 'success');
  }

  // ───── Load Demo ─────
  function loadDemoData() {
    buildChart(DEMO_DATA);
    toast('Demo data loaded!', 'success');
  }

  // ───── Toast ─────
  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
  }

  // ───── Boot ─────
  init();
})();
