# OSTOST Workbench

OSTOST Workbench is a Windows 11–inspired, browser-based testing surface designed for
storage benchmarking experiments and rapid HTML prototyping. The environment ships as a
single-page experience and can be opened directly in any modern browser.

## Getting started

1. Open `index.html` in a Chromium, Firefox, Edge, or Safari browser.
2. The Storage Lab window launches automatically so you can begin simulations right away
   (this behaviour can be toggled from Control Center > System).
3. Use the taskbar, Start menu, or **Ctrl + ,** to open additional tools such as HTML Studio,
   Quick Notes, or the Control Center settings suite.

## Included tools

- **Storage Lab** – Configure queue depth, workload mixes, and sample sizes to simulate
  throughput/latency behaviour across NVMe, SATA, HDD, and custom storage profiles. Results
  are logged to a persistent table for comparison.
- **HTML Studio** – Dual-pane HTML and CSS editor with a live iframe preview for layout and
  component testing.
- **Quick Notes** – Lightweight scratchpad that persists content to `localStorage` and
  provides quick clipboard export.
- **Control Center** – A full settings hub with theme selection, motion preferences, ambient
  lighting toggle, widget visibility, clock format, and launch behaviour controls. All
  preferences are persisted locally and can be reset with a single click.

## Interface highlights

- Right-click anywhere on the desktop wallpaper to reveal a context menu for cascading
  windows, opening Control Center, cycling ambient themes (Horizon, Aurora Drift, Sunrise
  Bloom), or refreshing the workspace.
- Windows and the Start menu animate with eased open/close transitions, glassmorphism, and
  elevated lighting. Reduced-motion mode softens these interactions without sacrificing
  clarity.
- A diagnostics widget continuously simulates storage load, cache residency, and controller
  temperature to give the desktop a living status pulse.
- Custom pointer sets, ambient lighting controls, and theme-aware taskbar/start menu styling
  give the workbench a professional Windows-inspired finish while preserving usability.

## Customisation ideas

- Extend the storage profiles in `app.js` with hardware-specific baselines from your lab.
- Tailor the default HTML/CSS snippet used by HTML Studio for your component libraries.
- Swap the wallpaper gradient in `styles.css` to match your brand or testing persona.
- Adjust the Control Center defaults in `app.js` if you want different starting preferences
  (e.g., open with reduced motion or hide quick tips by default).
