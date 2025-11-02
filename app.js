const zStack = {
  next: 10,
  bump(element) {
    this.next += 1;
    element.style.zIndex = this.next;
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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
    win.classList.remove('animating-out');
    win.classList.add('active');
    zStack.bump(win);
  },
  clampPosition(win) {
    if (!win) return;
    const width = win.offsetWidth;
    const height = win.offsetHeight;
    const minLeft = 32;
    const minTop = 72;
    const maxLeft = Math.max(minLeft, window.innerWidth - width - 32);
    const maxTop = Math.max(minTop, window.innerHeight - height - 140);
    const currentLeft = parseFloat(win.style.left) || (window.innerWidth - width) / 2;
    const currentTop = parseFloat(win.style.top) || (window.innerHeight - height) / 2;
    const left = clamp(currentLeft, minLeft, Math.max(minLeft, maxLeft));
    const top = clamp(currentTop, minTop, Math.max(minTop, maxTop));
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
  },
  enforceBounds() {
    this.windows.forEach((win) => {
      if (win.classList.contains('open')) {
        this.clampPosition(win);
      }
    });
  },
  cascade() {
    const openWindows = [...this.windows.values()].filter((win) => win.classList.contains('open'));
    if (!openWindows.length) return;
    const step = 36;
    const baseLeft = Math.max(48, window.innerWidth * 0.1);
    const baseTop = 96;
    openWindows.forEach((win, index) => {
      const offset = index * step;
      const maxLeft = Math.max(32, window.innerWidth - win.offsetWidth - 48);
      const maxTop = Math.max(72, window.innerHeight - win.offsetHeight - 160);
      const left = clamp(baseLeft + offset, 32, maxLeft);
      const top = clamp(baseTop + offset, 72, maxTop);
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
      this.bringToFront(win);
    });
  },
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let toggleStartMenu;

const ThemeManager = (() => {
  const THEME_KEY = 'ostost-theme';
  const themes = ['default', 'aurora', 'sunrise'];
  const labels = {
    default: 'Horizon',
    aurora: 'Aurora Drift',
    sunrise: 'Sunrise Bloom',
  };
  let index = 0;

  const apply = (theme) => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Ignore persistence issues (private browsing, etc.)
    }
    index = themes.indexOf(theme);
    const networkStatus = qs('#networkStatus');
    if (networkStatus) {
      networkStatus.textContent = `Connected • ${labels[theme]}`;
    }
  };

  const cycle = () => {
    const next = themes[(index + 1) % themes.length];
    apply(next);
    return labels[next];
  };

  const load = () => {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (error) {
      stored = null;
    }
    if (stored && themes.includes(stored)) {
      apply(stored);
    } else {
      apply(themes[0]);
    }
  };

  const nextLabel = () => {
    const next = themes[(index + 1) % themes.length];
    return labels[next];
  };

  return { load, cycle, nextLabel, apply };
})();

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
    startButton.classList.toggle('active', shouldOpen);
    startButton.setAttribute('aria-expanded', shouldOpen);
    if (shouldOpen) {
      zStack.bump(startMenu);
    }
  };

  toggleStartMenu = toggleStart;

  startButton.setAttribute('aria-haspopup', 'menu');
  startButton.setAttribute('aria-expanded', 'false');

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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
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
      WindowManager.clampPosition(win);
    };

    titlebar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      WindowManager.bringToFront(win);
      win.classList.remove('animating-in');
      const rect = win.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  };

  windows.forEach((win, index) => {
    WindowManager.register(win);
    win.dataset.minimized = 'false';
    const baseLeft = 420 + index * 28;
    const baseTop = 104 + index * 22;
    win.style.left = `${baseLeft}px`;
    win.style.top = `${baseTop}px`;
    WindowManager.clampPosition(win);
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
  if (!win) return;
  win.dataset.minimized = 'false';
  WindowManager.bringToFront(win);
  WindowManager.clampPosition(win);
  win.classList.add('open');
  win.setAttribute('aria-hidden', 'false');
  win.classList.remove('animating-out');
  win.classList.remove('animating-in');
  void win.offsetWidth;
  win.classList.add('animating-in');
  win.addEventListener(
    'animationend',
    () => {
      win.classList.remove('animating-in');
    },
    { once: true }
  );
  syncTaskbarState();
}

function closeWindow(windowId) {
  const win = WindowManager.get(windowId);
  if (!win || !win.classList.contains('open')) {
    win?.setAttribute?.('aria-hidden', 'true');
    return;
  }
  win.dataset.minimized = 'false';
  win.classList.remove('animating-in');
  win.classList.add('animating-out');
  const handleClose = () => {
    win.classList.remove('animating-out');
    win.classList.remove('open');
    win.classList.remove('active');
    win.setAttribute('aria-hidden', 'true');
    syncTaskbarState();
  };
  win.addEventListener('animationend', handleClose, { once: true });
}

function minimizeWindow(windowId) {
  const win = WindowManager.get(windowId);
  if (!win || !win.classList.contains('open')) return;
  win.dataset.minimized = 'true';
  win.classList.remove('animating-in');
  win.classList.add('animating-out');
  const handleMinimize = () => {
    win.classList.remove('animating-out');
    win.classList.remove('open');
    win.classList.remove('active');
    win.setAttribute('aria-hidden', 'true');
    syncTaskbarState();
  };
  win.addEventListener('animationend', handleMinimize, { once: true });
}

function syncTaskbarState() {
  qsa(`.taskbar-button[data-app]`).forEach((button) => {
    const targetId = `${button.dataset.app}Window`;
    const targetWindow = WindowManager.get(targetId);
    const isActive =
      targetWindow &&
      (targetWindow.classList.contains('open') || targetWindow.dataset.minimized === 'true');
    button.classList.toggle('active', Boolean(isActive));
  });
}

function initContextMenu() {
  const desktop = qs('.desktop');
  const menu = qs('#desktopContextMenu');
  if (!desktop || !menu) return;

  const themeLabel = qs('[data-action="cycle-theme"] .label', menu);

  const updateThemeLabel = () => {
    if (themeLabel) {
      themeLabel.textContent = `Cycle ambient theme (${ThemeManager.nextLabel()})`;
    }
  };

  updateThemeLabel();

  const hideMenu = () => {
    if (!menu.classList.contains('visible')) return;
    menu.classList.remove('visible');
    menu.setAttribute('aria-hidden', 'true');
  };

  const showMenu = (x, y) => {
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.add('visible');
    menu.setAttribute('aria-hidden', 'false');
    const rect = menu.getBoundingClientRect();
    let adjustedX = rect.left;
    let adjustedY = rect.top;
    if (rect.right > window.innerWidth) {
      adjustedX = window.innerWidth - rect.width - 12;
    }
    if (rect.bottom > window.innerHeight) {
      adjustedY = window.innerHeight - rect.height - 12;
    }
    menu.style.left = `${Math.max(12, adjustedX)}px`;
    menu.style.top = `${Math.max(12, adjustedY)}px`;
    updateThemeLabel();
    const firstItem = qs('.context-item', menu);
    firstItem?.focus();
  };

  desktop.addEventListener('contextmenu', (event) => {
    if (!desktop.contains(event.target)) return;
    if (event.target.closest('input, textarea, [contenteditable="true"]')) {
      hideMenu();
      return;
    }
    if (event.target.closest('.start-menu')) {
      hideMenu();
      return;
    }
    if (event.target.closest('.window')) {
      hideMenu();
      return;
    }
    event.preventDefault();
    hideMenu();
    toggleStartMenu?.(false);
    showMenu(event.clientX, event.clientY);
  });

  menu.addEventListener('contextmenu', (event) => event.preventDefault());
  menu.addEventListener('click', (event) => event.stopPropagation());

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) {
      hideMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideMenu();
    }
  });

  window.addEventListener('resize', hideMenu);
  document.addEventListener('scroll', hideMenu, true);

  qsa('.context-item', menu).forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'cycle-theme') {
        ThemeManager.cycle();
        updateThemeLabel();
        hideMenu();
      } else if (action === 'cascade') {
        WindowManager.cascade();
        hideMenu();
      } else if (action === 'refresh') {
        hideMenu();
        window.location.reload();
      }
    });
  });
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
  ThemeManager.load();
  initTaskbar();
  initWindows();
  initContextMenu();
  initStorageLab();
  initHtmlStudio();
  initNotes();
  initClock();
  window.addEventListener('resize', () => WindowManager.enforceBounds());
  // Auto-open Storage Lab at launch for quick benchmarking.
  openWindow('storage');
  WindowManager.enforceBounds();
});
