*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a0a;
  --surface: #111111;
  --surface2: #191919;
  --border: #222222;
  --border2: #2a2a2a;
  --text: #e8e8e8;
  --text2: #888888;
  --text3: #555555;
  --accent: #e8ff47;
  --accent2: #b8cc30;
  --danger: #ff4757;

  --cat-exterior-bg: #0f2a1a; --cat-exterior: #4dff91;
  --cat-interior-bg: #0d1f35; --cat-interior: #5ba8ff;
  --cat-aereo-bg: #1a1035; --cat-aereo: #a78bff;
  --cat-movimento-bg: #2a1800; --cat-movimento: #ffaa44;
  --cat-detalhe-bg: #2a0d1a; --cat-detalhe: #ff6b9d;
  --cat-anim-bg: #2a1205; --cat-anim: #ff7b45;
  --cat-geral-bg: #1a1a1a; --cat-geral: #888888;
  --cat-nano-bg: #1a1000; --cat-nano: #ffcc00;

  font-family: 'Syne', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

input, textarea, select, button {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  outline: none;
  border: none;
  background: none;
  color: var(--text);
}

input, textarea, select {
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 6px;
  padding: 9px 12px;
  color: var(--text);
  width: 100%;
  transition: border-color 0.15s;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--accent);
}

select option { background: var(--surface2); }

button {
  cursor: pointer;
  border-radius: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border2);
  background: var(--surface);
  color: var(--text2);
  transition: all 0.15s;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

button:disabled { opacity: 0.4; cursor: not-allowed; }

button.primary {
  background: var(--accent);
  color: #0a0a0a;
  border-color: var(--accent);
  font-weight: 600;
}
button.primary:hover:not(:disabled) {
  background: var(--accent2);
  border-color: var(--accent2);
  color: #0a0a0a;
}

textarea { resize: vertical; min-height: 100px; }

::placeholder { color: var(--text3); }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

pre {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: var(--text2);
}
