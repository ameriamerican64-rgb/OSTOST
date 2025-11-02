const zStack = {
  next: 10,
  bump(element) {
    this.next += 1;
    element.style.zIndex = this.next;
  },
};

const WindowManager = {
  windows: new Map(),
  register(win) {
    this.windows.set(win.id, win);
  },
  get(id) {
    return this.windows.get(id);
  },
  clearActive() {
    this.windows.forEach((other) => other.classList.remove('active'));
  },
  bringToFront(win) {
    this.clearActive();
    win.classList.add('active');
    zStack.bump(win);
  },
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const STORAGE_PROFILES = {
  nvme: { label: 'NVMe SSD', read: 7100, write: 6500, latency: 0.02 },
  sata: { label: 'SATA SSD', read: 560, write: 520, latency: 0.1 },
  hdd: { label: '7200 RPM HDD', read: 180, write: 160, latency: 8.5 },
  custom: { label: 'Custom Mix', read: 1200, write: 900, latency: 1.4 },
};

const WORKLOAD_FACTORS = {
  balanced: { read: 1, write: 1, latency: 1 },
  read: { read: 1.15, write: 0.88, latency: 0.92 },
  write: { read: 0.92, write: 1.18, latency: 1.08 },
  burst: { read: 0.85, write: 0.8, latency: 1.35 },
};

const DEFAULT_MARKUP = `<!-- Responsive layout harness -->
<header>
  <h1>OSTOST HTML Studio</h1>
  <p>Experiment with live HTML and CSS rendering.</p>
</header>
<main class="grid">
  <article>
    <h2>Storage Bench</h2>
    <p>
      Design tests for your storage stack. Toggle queue depth and variance to
      simulate unusual loads and observe how the UI reacts.
    </p>
  </article>
  <article>
    <h2>HTML Playground</h2>
    <p>
      Try flexbox, grid or animation snippets here. Updates show instantly in
      the preview pane.
    </p>
  </article>
  <article>
    <h2>Next steps</h2>
    <ul>
      <li>Add your own components</li>
      <li>Test them against OSTOST themes</li>
      <li>Share a snapshot with your team</li>
    </ul>
  </article>
</main>`;

const DEFAULT_STYLES = `:root {
  color-scheme: light dark;
  font-family: 'Inter', system-ui, sans-serif;
  accent-color: #2563eb;
}

body {
  margin: 0;
  min-height: 100vh;
  padding: 32px;
  background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.1), transparent 55%),
    #0f172a;
  color: #f8fafc;
  display: grid;
  gap: 24px;
}

header {
  display: grid;
  gap: 8px;
}

h1 {
  font-size: clamp(2rem, 5vw, 2.8rem);
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

article {
  background: rgba(15, 23, 42, 0.65);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}

article h2 {
  margin-top: 0;
  color: #38bdf8;
}`;

function initTaskbar() {
  const startButton = qs('#startButton');
  const startMenu = qs('#startMenu');
  const closeStart = qs('.close-start');

  const toggleStart = (force) => {
    const shouldOpen = typeof force === 'boolean' ? force : !startMenu.classList.contains('open');
    startMenu.classList.toggle('open', shouldOpen);
    startMenu.setAttribute('aria-hidden', !shouldOpen);
    if (shouldOpen) {
      zStack.bump(startMenu);
    }
  };

  startButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleStart();
  });

  closeStart.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleStart(false);
  });

  document.addEventListener('click', (event) => {
    if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
      toggleStart(false);
    }
  });

  qsa('[data-app]').forEach((element) => {
    element.addEventListener('click', () => {
      const app = element.dataset.app;
      openWindow(app);
      toggleStart(false);
    });
  });
}

function initWindows() {
  const windows = qsa('.window');
  const setupDrag = (win) => {
    const titlebar = qs('.window-titlebar', win);
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    const onPointerMove = (event) => {
      if (!dragging) return;
      const x = event.clientX - offsetX;
      const y = Math.max(40, event.clientY - offsetY);
      win.style.left = `${x}px`;
      win.style.top = `${y}px`;
    };

    const onPointerUp = () => {
      dragging = false;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    titlebar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      dragging = true;
      WindowManager.bringToFront(win);
      const rect = win.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  };

  windows.forEach((win, index) => {
    WindowManager.register(win);
    const isDefaultOpen = win.id === 'storageWindow';
    win.style.left = `${520 + index * 32}px`;
    win.style.top = `${80 + index * 24}px`;
    if (isDefaultOpen) {
      openWindow('storage');
    }
    qs('.window-body', win).addEventListener('click', () => WindowManager.bringToFront(win));
    setupDrag(win);

    qsa('.window-action', win).forEach((button) => {
      button.addEventListener('click', (event) => {
        const action = event.currentTarget.dataset.action;
        if (action === 'close') {
          closeWindow(win.id);
        } else if (action === 'minimize') {
          minimizeWindow(win.id);
        }
      });
    });
  });
}

function openWindow(app) {
  const idMap = {
    storage: 'storageWindow',
    html: 'htmlWindow',
    notes: 'notesWindow',
  };
  const windowId = idMap[app];
  if (!windowId) return;
  const win = WindowManager.get(windowId);
  win.classList.add('open');
  WindowManager.bringToFront(win);
  win.setAttribute('aria-hidden', 'false');
  qsa(`.taskbar-button[data-app]`).forEach((button) => {
    button.classList.toggle('active', button.dataset.app === app);
  });
}

function closeWindow(windowId) {
  const win = WindowManager.get(windowId);
  if (!win) return;
  win.classList.remove('open');
  win.classList.remove('active');
  win.setAttribute('aria-hidden', 'true');
  qsa(`.taskbar-button[data-app]`).forEach((button) => {
    if (button.dataset.app && `${button.dataset.app}Window` === windowId) {
      button.classList.remove('active');
    }
  });
}

function minimizeWindow(windowId) {
  const win = WindowManager.get(windowId);
  if (!win) return;
  win.classList.remove('open');
  win.classList.remove('active');
  win.setAttribute('aria-hidden', 'true');
}

function initStorageLab() {
  const form = qs('#storageForm');
  const outputs = qsa('output[data-for]', form);
  const tbody = qs('#storageResults');
  const throughputSummary = qs('#throughputSummary');
  const latencySummary = qs('#latencySummary');

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('input[type="range"]')) {
      const output = outputs.find((out) => out.dataset.for === target.name);
      if (output) {
        const suffix = target.name === 'variance' ? '%' : '';
        output.textContent = `${target.value}${suffix}`;
      }
    }
  });

  const createRow = (result) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${result.profile}</td>
      <td>${result.size} GB</td>
      <td>${result.queue}</td>
      <td>${result.read.toFixed(0)}</td>
      <td>${result.write.toFixed(0)}</td>
      <td>${result.latency.toFixed(2)} ms</td>
    `;
    return row;
  };

  const computeMetrics = ({ profile, size, queue, workload, variance }) => {
    const base = STORAGE_PROFILES[profile];
    const workloadFactor = WORKLOAD_FACTORS[workload];
    const varianceFactor = 1 - variance / 100;
    const queueBoost = Math.log(queue + 1) / Math.log(64);
    const sizeFactor = Math.min(1.2, 0.65 + size / 512);

    const read = base.read * workloadFactor.read * (0.75 + queueBoost * 0.35) * sizeFactor * varianceFactor;
    const write = base.write * workloadFactor.write * (0.75 + queueBoost * 0.32) * sizeFactor * varianceFactor;
    const latency = base.latency * workloadFactor.latency / (0.55 + queueBoost * 0.4) / varianceFactor;

    const jitter = (value) => {
      const spread = value * (variance / 100 + 0.03);
      const delta = (Math.random() * 2 - 1) * spread;
      return Math.max(0, value + delta);
    };

    return {
      profile: base.label,
      read: jitter(read),
      write: jitter(write),
      latency: jitter(latency),
    };
  };

  const summarize = (rows) => {
    if (!rows.length) {
      throughputSummary.textContent = '—';
      latencySummary.textContent = '—';
      return;
    }
    const avg = rows.reduce(
      (acc, row) => {
        acc.read += row.read;
        acc.write += row.write;
        acc.latency += row.latency;
        return acc;
      },
      { read: 0, write: 0, latency: 0 }
    );
    throughputSummary.textContent = `${(avg.read / rows.length).toFixed(0)} MB/s ↔ ${(avg.write / rows.length).toFixed(0)} MB/s`;
    latencySummary.textContent = `${(avg.latency / rows.length).toFixed(2)} ms`;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = {
      profile: formData.get('profile'),
      size: Number(formData.get('size')),
      queue: Number(formData.get('queue')),
      workload: formData.get('workload'),
      variance: Number(formData.get('variance')),
    };

    const metrics = computeMetrics(data);
    const row = createRow({ ...metrics, size: data.size, queue: data.queue });
    tbody.prepend(row);

    const rows = [...tbody.querySelectorAll('tr')].map((tr) => ({
      read: Number(tr.children[3].textContent),
      write: Number(tr.children[4].textContent),
      latency: Number(tr.children[5].textContent.replace(' ms', '')),
    }));
    summarize(rows);
  });
}

function initHtmlStudio() {
  const htmlInput = qs('#htmlInput');
  const cssInput = qs('#cssInput');
  const frame = qs('#previewFrame');
  const resetButton = qs('#resetHtml');

  const render = () => {
    const doc = frame.contentDocument || frame.contentWindow.document;
    const markup = htmlInput.value;
    const styles = cssInput.value;
    doc.open();
    doc.write(`<!DOCTYPE html><html lang="en"><head><style>${styles}</style></head><body>${markup}</body></html>`);
    doc.close();
  };

  const loadDefaults = () => {
    htmlInput.value = DEFAULT_MARKUP;
    cssInput.value = DEFAULT_STYLES;
    render();
  };

  htmlInput.addEventListener('input', render);
  cssInput.addEventListener('input', render);
  resetButton.addEventListener('click', loadDefaults);

  loadDefaults();
}

function initNotes() {
  const pad = qs('#notesPad');
  const clear = qs('#clearNotes');
  const exportBtn = qs('#exportNotes');
  const status = qs('#notesStatus');
  const STORAGE_KEY = 'ostost-notes';

  const load = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      pad.value = saved;
    }
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, pad.value);
  };

  const flashStatus = (message) => {
    status.textContent = message;
    status.classList.add('visible');
    setTimeout(() => {
      status.textContent = '';
      status.classList.remove('visible');
    }, 1800);
  };

  pad.addEventListener('input', save);

  clear.addEventListener('click', () => {
    pad.value = '';
    save();
    flashStatus('Cleared');
  });

  exportBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pad.value);
      flashStatus('Copied to clipboard');
    } catch (error) {
      flashStatus('Clipboard unavailable');
    }
  });

  load();
}

function initClock() {
  const clock = qs('#clock');
  const update = () => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    clock.textContent = `${time}  •  ${date}`;
  };
  update();
  setInterval(update, 15000);
}

window.addEventListener('DOMContentLoaded', () => {
  initTaskbar();
  initWindows();
  initStorageLab();
  initHtmlStudio();
  initNotes();
  initClock();
  // Auto-open Storage Lab at launch for quick benchmarking.
  openWindow('storage');
});
