/* Kotak Fitur: 50 fitur tambahan. Dibuka lewat tombol 🎁 di bawah buku. */
(function () {
  "use strict";
  function boot() {
    const A = window.BookAPI; if (!A) return;
    const $ = (id) => document.getElementById(id), el = A.el, store = A.store, photos = A.photos, cfg = A.cfg;
    const reduce = A.reduceMotion, MONTHS = A.MONTHS;
    const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const rnd = (a, b) => a + Math.random() * (b - a), pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    const btn = (t, fn) => { const b = el("button", "fxm__btn", t); b.type = "button"; if (fn) b.onclick = fn; return b; };
    const json = (k, d) => { try { return JSON.parse(store.get(k) || d); } catch (e) { return JSON.parse(d); } };
    const dl = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
    const layer = el("div", "fxl"); document.body.appendChild(layer);
    const desk = document.querySelector(".desk"), book = $("book"), spread = $("bookSpread");
    const box = (cls, parent) => { const d = el("div", cls); (parent || layer).appendChild(d); return d; };

    /* ---------- audio ---------- */
    let ac = null;
    const ctx = () => { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = ac || new AC(); if (ac.state === "suspended") ac.resume(); return ac; };
    function noise(c, secs, brown) {
      const len = Math.floor(c.sampleRate * secs), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
      return b;
    }
    function loopNoise(c, freq, gain, brown) {
      const src = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain();
      src.buffer = noise(c, 2, brown); src.loop = true; lp.type = "lowpass"; lp.frequency.value = freq; g.gain.value = .0001;
      src.connect(lp); lp.connect(g); g.connect(c.destination); src.start(); g.gain.setTargetAtTime(gain, c.currentTime, 1);
      return { src, g, stop: () => { g.gain.setTargetAtTime(0, c.currentTime, .3); setTimeout(() => { try { src.stop(); } catch (e) { /* abaikan */ } }, 1200); } };
    }

    /* ---------- overlay & modal ---------- */
    const stack = [];
    function overlay(cls) {
      const o = el("div", "fxo " + cls), api = { o, sticky: false, onclose: null };
      api.close = () => { const i = stack.indexOf(api); if (i > -1) stack.splice(i, 1); o.remove(); if (api.onclose) api.onclose(); };
      o.addEventListener("click", (e) => { if (e.target === o && !api.sticky) api.close(); });
      document.body.appendChild(o); stack.push(api); return api;
    }
    function modal(title) {
      const ov = overlay("fxm"), card = el("div", "fxm__card"), x = el("button", "fxo__x", "✕"); x.type = "button"; x.setAttribute("aria-label", "Tutup"); x.onclick = ov.close;
      card.append(x, el("h3", "", title)); ov.o.appendChild(card); ov.body = card; return ov;
    }
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && stack.length) stack[stack.length - 1].close(); });

    /* ---------- tanggal spesial ---------- */
    function parseDM(label) { const m = /(\d+)\s+([A-Za-z]+)/.exec(label || ""), mo = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1; return mo < 0 ? null : { d: +m[1], m: mo }; }
    function specials() {
      const c = cfg.couple, r = cfg.relationship, list = [], b1 = parseDM(cfg.birthdays.person1), b2 = parseDM(cfg.birthdays.person2);
      if (b1) list.push({ d: b1.d, m: b1.m, t: "Ulang tahun " + c.short1, e: "🎂" });
      if (b2) list.push({ d: b2.d, m: b2.m, t: "Ulang tahun " + c.short2, e: "🎂" });
      list.push({ d: r.anniversary.day, m: r.anniversary.month - 1, t: "Hari jadi kita", e: "💍" });
      const fm = MONTHS.indexOf(String(r.firstDate.month).toLowerCase()); if (fm >= 0) list.push({ d: +r.firstDate.day, m: fm, t: "First date", e: "🌹" });
      return list;
    }
    function daysUntil(s) { const n = new Date(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate()); let d = new Date(n.getFullYear(), s.m, s.d); if (d < t) d = new Date(n.getFullYear() + 1, s.m, s.d); return Math.round((d - t) / 864e5); }

    /* ---------- registri fitur ---------- */
    const feats = [], cleanups = {};
    const def = (o) => { feats.push(o); };
    const isOn = (f) => !!cleanups[f.id];
    function setOn(f, v) {
      if (v && !cleanups[f.id]) {
        if (reduce && f.motion) { A.toast("Efek ini dimatikan karena gerak dikurangi"); return; }
        let r; try { r = f.make(); } catch (e) { console.warn(f.id, e); return; }
        if (r === false) return; cleanups[f.id] = r || (() => {});
      } else if (!v && cleanups[f.id]) { try { cleanups[f.id](); } catch (e) { /* abaikan */ } delete cleanups[f.id]; }
      store.set("fx:" + f.id, v ? "on" : "off");
    }
    const cycle = (key, n) => { const v = ((+store.get(key) || 0) + 1) % n; store.set(key, String(v)); return v; };

    /* ===== SUASANA (16) ===== */
    const rise = (cls, n, make) => () => { const b = box(cls); for (let k = 0; k < n; k++) { const i = make(k); i.style.left = rnd(2, 96) + "vw"; i.style.animationDuration = rnd(14, 30) + "s"; i.style.animationDelay = -rnd(0, 28) + "s"; i.style.setProperty("--sx", rnd(-80, 80) + "px"); b.appendChild(i); } return () => b.remove(); };
    def({ id: "snow", cat: "Suasana", icon: "❄️", name: "Salju turun", desc: "Butiran salju lembut", motion: true, make: () => { const b = box("fx-snow"); for (let k = 0; k < 44; k++) { const i = el("i"), s = rnd(3, 8); i.style.left = rnd(0, 100) + "vw"; i.style.width = i.style.height = s + "px"; i.style.animationDuration = rnd(9, 18) + "s"; i.style.animationDelay = -rnd(0, 18) + "s"; i.style.setProperty("--sx", rnd(-60, 60) + "px"); b.appendChild(i); } return () => b.remove(); } });
    def({ id: "fireflies", cat: "Suasana", icon: "✨", name: "Kunang-kunang", desc: "Cahaya kecil menari", motion: true, make: () => { const b = box("fx-ff"); for (let k = 0; k < 14; k++) { const i = el("i"); i.style.left = rnd(5, 95) + "vw"; i.style.top = rnd(20, 90) + "vh"; i.style.animationDuration = rnd(9, 17) + "s"; i.style.animationDelay = -rnd(0, 16) + "s"; ["x1", "y1", "x2", "y2", "x3", "y3"].forEach((v) => i.style.setProperty("--" + v, rnd(-130, 130) + "px")); b.appendChild(i); } return () => b.remove(); } });
    def({ id: "lantern", cat: "Suasana", icon: "🏮", name: "Lentera melayang", desc: "Lentera naik ke langit", motion: true, make: rise("fx-rise", 8, () => { const i = el("i", "", "🏮"); i.style.fontSize = rnd(22, 38) + "px"; return i; }) });
    def({ id: "bubbles", cat: "Suasana", icon: "🫧", name: "Gelembung sabun", desc: "Gelembung naik pelan", motion: true, make: rise("fx-bub", 16, () => { const i = el("i"), s = rnd(14, 46); i.style.width = i.style.height = s + "px"; return i; }) });
    def({ id: "fog", cat: "Suasana", icon: "🌫️", name: "Kabut lembut", desc: "Kabut tipis di meja", motion: true, make: () => { const b = box("fx-fogs", desk || layer); for (let k = 0; k < 3; k++) { const f = el("i"); f.style.top = 20 + k * 25 + "%"; f.style.animationDuration = 38 + k * 12 + "s"; b.appendChild(f); } return () => b.remove(); } });
    def({ id: "aurora", cat: "Suasana", icon: "🌌", name: "Aurora", desc: "Cahaya utara berkilau", motion: true, make: () => { const b = box("fx-aurora", desk || layer); return () => b.remove(); } });
    def({ id: "meteors", cat: "Suasana", icon: "🌠", name: "Hujan bintang", desc: "Bintang jatuh sering", motion: true, make: () => { const t = setInterval(() => { if (!desk || !document.body.animate) return; const s = el("i", "shoot"); s.style.left = rnd(40, 98) + "vw"; s.style.top = rnd(3, 40) + "vh"; desk.appendChild(s); s.animate([{ transform: "rotate(-28deg) translateX(0)", opacity: 0 }, { opacity: 1, offset: .15 }, { transform: "rotate(-28deg) translateX(-380px)", opacity: 0 }], { duration: 1400, easing: "ease-out" }).onfinish = () => s.remove(); }, 1600); return () => clearInterval(t); } });
    def({ id: "cine", cat: "Suasana", icon: "🎬", name: "Mode bioskop", desc: "Bingkai layar lebar sinematik", make: () => { document.body.classList.add("fx-cine"); const v = box("fx-vig"); return () => { document.body.classList.remove("fx-cine"); v.remove(); }; } });
    def({ id: "grain", cat: "Suasana", icon: "🎞️", name: "Grain film tebal", desc: "Tekstur film analog", make: () => { const g = box("fx-grain"); return () => g.remove(); } });
    def({ id: "flit", cat: "Suasana", icon: "🦋", name: "Kupu-kupu banyak", desc: "Kawanan kupu-kupu", motion: true, make: () => { const b = box("fx-flit"); for (let k = 0; k < 6; k++) { const i = el("i", "", "🦋"); i.style.left = rnd(5, 90) + "vw"; i.style.top = rnd(10, 80) + "vh"; i.style.animationDuration = rnd(12, 22) + "s"; i.style.animationDelay = -rnd(0, 20) + "s"; ["x1", "y1", "x2", "y2"].forEach((v) => i.style.setProperty("--" + v, rnd(-160, 160) + "px")); b.appendChild(i); } return () => b.remove(); } });
    def({ id: "walkers", cat: "Suasana", icon: "🐈", name: "Hewan berjalan", desc: "Hewan lucu lewat di bawah", motion: true, make: () => {
      let t; const go = () => {
        if (document.body.animate) {
          const a = el("i", "walker", pick(["🐈", "🐕", "🐇", "🦆", "🐢", "🐿️", "🐑"])), dir = Math.random() < .5 ? 1 : -1, pts = [];
          document.body.appendChild(a);
          for (let k = 0; k <= 14; k++) pts.push({ transform: "translate(" + (dir > 0 ? -10 + k * 8.6 : 110 - k * 8.6) + "vw," + (k % 2 ? "-8px" : "0px") + ") scaleX(" + (dir > 0 ? -1 : 1) + ")" });
          a.animate(pts, { duration: rnd(16000, 28000), easing: "linear" }).onfinish = () => a.remove();
        }
        t = setTimeout(go, rnd(14000, 28000));
      };
      t = setTimeout(go, 2500); return () => clearTimeout(t);
    } });
    const deskTone = () => { document.body.classList.remove("deskc-1", "deskc-2", "deskc-3"); const v = +store.get("deskc") || 0; if (v) document.body.classList.add("deskc-" + v); };
    def({ id: "deskc", cat: "Suasana", icon: "🎨", name: "Warna meja", desc: "Burgundy, biru, hutan, arang", init: deskTone, run: () => { const v = cycle("deskc", 4); deskTone(); A.toast(["Meja burgundy", "Meja biru malam", "Meja hutan", "Meja arang"][v]); } });
    const COVERS = [["#8c2545", "#5a1429", "#33091a"], ["#2f5aa8", "#1d3a6e", "#0e1f40"], ["#3d7a5a", "#245238", "#10281b"], ["#4a4a52", "#2a2a30", "#121216"]];
    const coverTone = () => { const c = COVERS[+store.get("covc") || 0]; book.style.setProperty("--cv1", c[0]); book.style.setProperty("--cv2", c[1]); book.style.setProperty("--cv3", c[2]); };
    def({ id: "covc", cat: "Suasana", icon: "📕", name: "Warna sampul", desc: "Ganti warna sampul buku", init: coverTone, run: () => { const v = cycle("covc", 4); coverTone(); A.toast(["Sampul burgundy", "Sampul biru", "Sampul hijau", "Sampul hitam"][v]); } });
    def({ id: "curtain", cat: "Suasana", icon: "🎭", name: "Tirai teater", desc: "Tirai panggung membuka (seperti Miss Tjitjih)", run: () => {
      const c = box("fx-curtain", document.body), l = el("i", "cl"), r = el("i", "cr"); c.append(l, r); void c.offsetWidth; c.classList.add("shut"); A.chime([392, 523]);
      setTimeout(() => { c.classList.remove("shut"); A.chime([523, 784, 1047]); }, 1500); setTimeout(() => c.remove(), 3200);
    } });
    const CUR = ["", "🌸", "💗", "🐾", "✨"];
    const setCursor = () => { const e = CUR[+store.get("cursor") || 0]; document.body.style.cursor = e ? "url(\"data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='24' font-size='24'>" + e + "</text></svg>") + "\") 16 16, auto" : ""; };
    def({ id: "cursor", cat: "Suasana", icon: "🐾", name: "Kursor lucu", desc: "Bunga, hati, jejak kaki, kilau", init: setCursor, run: () => { cycle("cursor", CUR.length); setCursor(); A.toast("Kursor diganti"); } });

    def({ id: "dbl", cat: "Suasana", icon: "💞", name: "Klik ganda hujan hati", desc: "Ketuk dua kali di mana saja", make: () => () => {} });

    /* ===== FOTO (11) ===== */
    const leafOf = (id) => A.leaves.find((l) => l.type === "photos" && l.ids.indexOf(id) !== -1);
    const none = () => { if (!photos.length) { A.toast("Belum ada foto"); return true; } return false; };
    def({ id: "reel", cat: "Foto", icon: "🎞️", name: "Pemutar kenangan", desc: "Slideshow sinematik layar penuh", close: true, run: () => {
      if (none()) return;
      const ov = overlay("fx-reel"), imgs = [el("img"), el("img")], cap = el("div", "fx-reel__cap"), x = el("button", "fxo__x", "✕"); x.type = "button"; x.onclick = ov.close;
      ov.sticky = true; ov.o.append(imgs[0], imgs[1], cap, x);
      let i = -1, w = 0, timer = 0;
      const step = (d) => {
        i = (i + d + photos.length) % photos.length; const p = photos[i]; w = 1 - w; const cur = imgs[w], old = imgs[1 - w];
        cur.src = p.image; cur.alt = p.title || "Foto kenangan"; cur.style.setProperty("--kx", rnd(-3, 3) + "%"); cur.style.setProperty("--ky", rnd(-3, 3) + "%");
        cur.classList.remove("on"); void cur.offsetWidth; cur.classList.add("on"); old.classList.remove("on");
        cap.textContent = [p.title, p.date].filter(Boolean).join(" · ");
      };
      const key = (e) => { if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); };
      document.addEventListener("keydown", key); ov.onclose = () => { clearInterval(timer); document.removeEventListener("keydown", key); };
      step(1); timer = setInterval(() => step(1), 5200);
      const pb = $("playBtn"), au = $("audio"); if (au && au.paused && pb && !$("player").hidden && store.get("music") !== "off") pb.click();
    } });
    def({ id: "today", cat: "Foto", icon: "📅", name: "Foto hari ini", desc: "Satu foto pilihan untuk hari ini", close: true, run: () => {
      if (none()) return; const id = Math.floor(Date.now() / 864e5) % photos.length, l = leafOf(id); if (l) A.goTo(l.n);
      A.toast("Foto hari ini: " + (photos[id].title || "kenangan #" + (id + 1))); A.chime([784, 1175]);
    } });
    def({ id: "sheet", cat: "Foto", icon: "🗂️", name: "Papan kenangan", desc: "Semua foto sekilas, ketuk untuk loncat", close: true, run: () => {
      if (none()) return; const m = modal("Papan kenangan"), g = el("div", "fx-sheet");
      photos.forEach((p, id) => { const b = el("button", "fx-sheet__t"); b.type = "button"; b.title = p.title || ""; const im = new Image(); im.loading = "lazy"; im.alt = p.title || "Foto"; im.src = p.image; b.appendChild(im); b.onclick = () => { m.close(); const l = leafOf(id); if (l) A.goTo(l.n); }; g.appendChild(b); });
      m.body.appendChild(g);
    } });
    const FILTERS = [["", "Asli"], ["sepia(.55) saturate(1.1)", "Sepia"], ["grayscale(1)", "Hitam putih"], ["saturate(1.35) contrast(1.05) brightness(1.03)", "Hangat cerah"], ["saturate(.7) brightness(1.08) contrast(.9)", "Pudar lembut"], ["hue-rotate(200deg) saturate(.6) brightness(1.05)", "Dingin"]];
    const setFilter = () => { document.documentElement.style.setProperty("--pf", FILTERS[+store.get("pfilter") || 0][0] || "none"); };
    def({ id: "filter", cat: "Foto", icon: "🖼️", name: "Filter foto", desc: "Sepia, hitam putih, hangat, pudar", init: setFilter, run: () => { const v = cycle("pfilter", FILTERS.length); setFilter(); A.toast("Filter: " + FILTERS[v][1]); } });
    const setFrame = () => { for (let k = 1; k <= 3; k++) document.body.classList.remove("frm-" + k); const v = +store.get("frame") || 0; if (v) document.body.classList.add("frm-" + v); };
    def({ id: "frame", cat: "Foto", icon: "🖼", name: "Gaya bingkai", desc: "Hitam, merah muda, minimal", init: setFrame, run: () => { const v = cycle("frame", 4); setFrame(); A.toast(["Bingkai putih", "Bingkai hitam", "Bingkai merah muda", "Bingkai minimal"][v]); } });
    def({ id: "collage", cat: "Foto", icon: "📥", name: "Unduh kolase", desc: "Kolase foto jadi gambar PNG", close: true, run: async () => {
      const favs = A.readFavs(), pool = favs.length ? photos.filter((p) => favs.indexOf(p.image) !== -1) : photos, list = pool.slice(0, 9);
      if (!list.length) { A.toast("Belum ada foto"); return; }
      A.toast("Membuat kolase…");
      const S = 1800, cv = document.createElement("canvas"); cv.width = cv.height = S; const g = cv.getContext("2d");
      g.fillStyle = "#f1e4cf"; g.fillRect(0, 0, S, S);
      const n = list.length, cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), pad = 70, gap = 36, cw = (S - pad * 2 - gap * (cols - 1)) / cols, ch = (S - pad * 2 - 120 - gap * (rows - 1)) / rows;
      const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
      const imgs = await Promise.all(list.map((p) => load(p.image)));
      imgs.forEach((im, i) => {
        if (!im) return; const x = pad + (i % cols) * (cw + gap), y = pad + Math.floor(i / cols) * (ch + gap);
        g.save(); g.fillStyle = "#fffaf2"; g.shadowColor = "rgba(60,28,20,.35)"; g.shadowBlur = 24; g.fillRect(x, y, cw, ch); g.restore();
        const iw = cw - 28, ih = ch - 68, s = Math.max(iw / im.width, ih / im.height), sw = iw / s, sh = ih / s;
        g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x + 14, y + 14, iw, ih);
      });
      g.fillStyle = "#7a1f3d"; g.font = "600 64px Georgia, serif"; g.textAlign = "center"; g.fillText(cfg.couple.short1 + " & " + cfg.couple.short2, S / 2, S - 50);
      try { cv.toBlob((b) => { if (b) { dl(b, "kolase-kita.png"); A.toast("Kolase tersimpan 📥"); } else A.toast("Gagal membuat kolase"); }, "image/png"); } catch (e) { A.toast("Unduh kolase butuh dibuka lewat GitHub Pages"); }
    } });
    /* zoom + miring 3D di lightbox */
    const lbImg = $("lbImg"), lb = $("lightbox"); let zm = { s: 1, x: 0, y: 0 }, pan = null;
    const applyZoom = () => { lbImg.style.transform = zm.s === 1 ? "" : "translate(" + zm.x + "px," + zm.y + "px) scale(" + zm.s + ")"; lbImg.style.cursor = zm.s > 1 ? "grab" : ""; };
    def({ id: "zoom", cat: "Foto", icon: "🔍", name: "Zoom foto", desc: "Putar roda mouse atau ketuk dua kali", defaultOn: true, make: () => {
      const wheel = (e) => { if (lb.hidden) return; e.preventDefault(); zm.s = Math.max(1, Math.min(4, zm.s * (e.deltaY < 0 ? 1.15 : .87))); if (zm.s === 1) { zm.x = zm.y = 0; } applyZoom(); };
      const dbl = () => { zm.s = zm.s > 1 ? 1 : 2.2; if (zm.s === 1) { zm.x = zm.y = 0; } applyZoom(); };
      const down = (e) => { if (zm.s > 1) pan = { x: e.clientX - zm.x, y: e.clientY - zm.y }; };
      const move = (e) => { if (pan) { zm.x = e.clientX - pan.x; zm.y = e.clientY - pan.y; applyZoom(); } };
      const up = () => { pan = null; }; const reset = () => { zm = { s: 1, x: 0, y: 0 }; applyZoom(); };
      lb.addEventListener("wheel", wheel, { passive: false }); lbImg.addEventListener("dblclick", dbl); lbImg.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); lbImg.addEventListener("load", reset);
      return () => { lb.removeEventListener("wheel", wheel); lbImg.removeEventListener("dblclick", dbl); lbImg.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); lbImg.removeEventListener("load", reset); reset(); };
    } });
    def({ id: "lbtilt", cat: "Foto", icon: "🧊", name: "Foto miring 3D", desc: "Foto di lightbox mengikuti kursor", make: () => {
      const h = (e) => { if (zm.s > 1 || e.pointerType !== "mouse" || lb.hidden) return; lbImg.style.transform = "perspective(1000px) rotateY(" + ((e.clientX / innerWidth - .5) * 10).toFixed(2) + "deg) rotateX(" + (-(e.clientY / innerHeight - .5) * 8).toFixed(2) + "deg)"; };
      lb.addEventListener("pointermove", h); return () => { lb.removeEventListener("pointermove", h); lbImg.style.transform = ""; };
    } });
    def({ id: "sky", cat: "Foto", icon: "⭐", name: "Langit kenangan", desc: "Tiap foto jadi bintang di rasi", close: true, run: () => {
      if (none()) return; const ov = overlay("fx-sky"), pts = photos.map((p, i) => [8 + ((i * 37 + 11) % 84), 14 + ((i * 53 + 7) % 68)]);
      const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("preserveAspectRatio", "none");
      const pl = document.createElementNS(NS, "polyline"); pl.setAttribute("points", pts.map((p) => p.join(",")).join(" ")); svg.appendChild(pl); ov.o.appendChild(svg);
      pts.forEach((pt, id) => { const s = el("button", "fx-sky__s", "✦"); s.type = "button"; s.style.left = pt[0] + "%"; s.style.top = pt[1] + "%"; s.style.animationDelay = -rnd(0, 3) + "s"; s.title = [photos[id].title, photos[id].date].filter(Boolean).join(" · "); s.onclick = () => { ov.close(); const l = leafOf(id); if (l) A.goTo(l.n); }; ov.o.appendChild(s); });
      const x = el("button", "fxo__x", "✕"); x.type = "button"; x.onclick = ov.close; ov.o.append(x, el("p", "fx-sky__h", "Ketuk bintang untuk membuka kenangannya"));
    } });
    def({ id: "guess", cat: "Foto", icon: "🤔", name: "Tebak bulan foto", desc: "Kuis: kapan foto ini diambil?", close: true, run: () => {
      const pool = photos.map((p, i) => i).filter((i) => photos[i].taken); if (!pool.length) { A.toast("Butuh foto bertanggal (field taken di gallery.js)"); return; }
      const id = pick(pool), p = photos[id], ok = +p.taken.slice(5, 7) - 1, yr = p.taken.slice(0, 4), set = [ok];
      while (set.length < 4) { const m = Math.floor(Math.random() * 12); if (set.indexOf(m) === -1) set.push(m); }
      const m = modal("Tebak bulan foto"), im = new Image(); im.src = p.image; im.alt = "Foto tebakan"; im.className = "fx-guess__img"; m.body.appendChild(im);
      const row = el("div", "fxm__row"); shuffle(set).forEach((mo) => row.appendChild(btn(MONTH_NAMES[mo] + " " + yr, () => {
        if (mo === ok) { A.burst(innerWidth / 2, innerHeight / 2, ["🎉", "✨", "💗"]); A.chime([784, 988, 1319]); A.toast("Benar! Itu " + (p.date || MONTH_NAMES[ok])); } else A.toast("Belum tepat. Jawabannya " + MONTH_NAMES[ok] + " " + yr);
        m.close();
      }))); m.body.appendChild(row);
    } });
    def({ id: "memory", cat: "Foto", icon: "🃏", name: "Pasangkan kenangan", desc: "Permainan kartu dari foto kalian", close: true, run: () => {
      if (photos.length < 2) { A.toast("Butuh minimal 2 foto"); return; }
      const ids = shuffle(photos.map((p, i) => i)).slice(0, Math.min(6, photos.length)), cards = shuffle(ids.concat(ids));
      const m = modal("Pasangkan kenangan"), g = el("div", "fx-mem"), info = el("p", "fxm__info", "Langkah: 0"); g.style.gridTemplateColumns = "repeat(" + (cards.length <= 4 ? 2 : 4) + ",1fr)";
      let first = null, lock = false, moves = 0, found = 0;
      cards.forEach((id) => {
        const b = el("button", "mcard"), fr = el("span", "mcard__f"), im = new Image(); b.type = "button"; im.src = photos[id].image; im.alt = ""; fr.appendChild(im); b.append(el("span", "mcard__b", "💗"), fr);
        b.onclick = () => {
          if (lock || b.classList.contains("up")) return; b.classList.add("up");
          if (!first) { first = { b, id }; return; }
          moves++; info.textContent = "Langkah: " + moves;
          if (first.id === id) { first.b.classList.add("ok"); b.classList.add("ok"); first = null; found++; A.chime([784, 1175]); if (found === ids.length) { A.petalRain(24); A.toast("Semua pasangan ketemu dalam " + moves + " langkah 🎉"); } }
          else { lock = true; const f = first; first = null; setTimeout(() => { f.b.classList.remove("up"); b.classList.remove("up"); lock = false; }, 800); }
        };
        g.appendChild(b);
      }); m.body.append(info, g);
    } });

    /* ===== SUARA (8) ===== */
    def({ id: "fire", cat: "Suara", icon: "🔥", name: "Api unggun", desc: "Gemeretak api yang hangat", gesture: true, make: () => {
      const c = ctx(); if (!c) { A.toast("Audio tidak didukung"); return false; }
      const n = loopNoise(c, 600, .5, true), cb = noise(c, .03, false);
      const t = setInterval(() => { const b = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain(); b.buffer = cb; hp.type = "highpass"; hp.frequency.value = 2500; g.gain.value = rnd(.03, .12); b.connect(hp); hp.connect(g); g.connect(c.destination); b.start(); }, 260);
      return () => { clearInterval(t); n.stop(); };
    } });
    def({ id: "waves", cat: "Suara", icon: "🌊", name: "Ombak", desc: "Deburan ombak yang naik turun", gesture: true, make: () => {
      const c = ctx(); if (!c) { A.toast("Audio tidak didukung"); return false; }
      const n = loopNoise(c, 900, .3, true), lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .11; lg.gain.value = .22; lfo.connect(lg); lg.connect(n.g.gain); lfo.start();
      return () => { n.stop(); try { lfo.stop(); } catch (e) { /* abaikan */ } };
    } });
    def({ id: "crickets", cat: "Suara", icon: "🌙", name: "Jangkrik malam", desc: "Jangkrik di malam yang tenang", gesture: true, make: () => {
      const c = ctx(); if (!c) { A.toast("Audio tidak didukung"); return false; }
      const t = setInterval(() => { const s = c.currentTime; for (let k = 0; k < 3; k++) { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = 4300 + rnd(-80, 80); g.gain.setValueAtTime(.0001, s + k * .07); g.gain.exponentialRampToValueAtTime(.012, s + k * .07 + .015); g.gain.exponentialRampToValueAtTime(.0001, s + k * .07 + .05); o.connect(g); g.connect(c.destination); o.start(s + k * .07); o.stop(s + k * .07 + .06); } }, 720);
      return () => clearInterval(t);
    } });
    def({ id: "heart", cat: "Suara", icon: "💓", name: "Detak jantung", desc: "Denyut lembut yang menenangkan", gesture: true, make: () => {
      const c = ctx(); if (!c) { A.toast("Audio tidak didukung"); return false; }
      const thump = (at, v) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(75, at); o.frequency.exponentialRampToValueAtTime(40, at + .18); g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(v, at + .02); g.gain.exponentialRampToValueAtTime(.0001, at + .22); o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + .25); };
      const beat = () => { const s = c.currentTime; thump(s, .22); thump(s + .24, .14); };
      beat(); const t = setInterval(beat, 1000); return () => clearInterval(t);
    } });
    def({ id: "slow", cat: "Suara", icon: "🐢", name: "Musik santai", desc: "Putar lagu sedikit lebih pelan", make: () => { const a = $("audio"); a.playbackRate = .85; return () => { a.playbackRate = 1; }; } });
    def({ id: "eq", cat: "Suara", icon: "🎚️", name: "Equalizer layar", desc: "Batang suara menari saat musik main", make: () => {
      const b = box("fx-eq"); for (let k = 0; k < 48; k++) { const i = el("i"); i.style.animationDuration = rnd(.6, 1.4) + "s"; i.style.animationDelay = -rnd(0, 1) + "s"; b.appendChild(i); }
      const pl = $("player"), sync = () => document.body.classList.toggle("playing", pl.classList.contains("is-playing")); sync();
      let mo = null; if (window.MutationObserver) { mo = new MutationObserver(sync); mo.observe(pl, { attributes: true, attributeFilter: ["class"] }); }
      return () => { if (mo) mo.disconnect(); b.remove(); document.body.classList.remove("playing"); };
    } });
    def({ id: "volume", cat: "Suara", icon: "🔉", name: "Volume lembut", desc: "Ganti volume: penuh, sedang, pelan", init: () => { const v = [1, .7, .4][+store.get("vol") || 0]; try { $("audio").volume = v; } catch (e) { /* abaikan */ } }, run: () => { const v = cycle("vol", 3), lv = [1, .7, .4][v]; try { $("audio").volume = lv; } catch (e) { /* abaikan */ } A.toast("Volume " + Math.round(lv * 100) + "%"); } });
    def({ id: "breathe", cat: "Suara", icon: "🫁", name: "Napas tenang", desc: "Latihan napas 4-4-6 yang menenangkan", close: true, run: () => {
      const ov = overlay("fx-breathe"), ring = el("div", "fx-breathe__ring"), txt = el("p", "fx-breathe__t", "Tarik napas…"), x = el("button", "fxo__x", "✕"); x.type = "button"; x.onclick = ov.close; ov.sticky = true; ov.o.append(ring, txt, x);
      let ph = 0, t; const words = ["Tarik napas…", "Tahan…", "Hembuskan perlahan…"], dur = [4000, 4000, 6000];
      const next = () => { txt.textContent = words[ph]; t = setTimeout(() => { ph = (ph + 1) % 3; next(); }, dur[ph]); }; next(); ov.onclose = () => clearTimeout(t);
    } });

    /* ===== ALAT (11) ===== */
    def({ id: "clock", cat: "Alat", icon: "🕰️", name: "Jam analog", desc: "Jam kecil di pojok layar", make: () => {
      const c = box("fx-clock", document.body), h = el("i", "h"), m = el("i", "m"), s = el("i", "s"); c.append(h, m, s, el("b"));
      const tick = () => { const d = new Date(); h.style.transform = "rotate(" + ((d.getHours() % 12) * 30 + d.getMinutes() / 2) + "deg)"; m.style.transform = "rotate(" + d.getMinutes() * 6 + "deg)"; s.style.transform = "rotate(" + d.getSeconds() * 6 + "deg)"; };
      tick(); const t = setInterval(tick, 1000); return () => { clearInterval(t); c.remove(); };
    } });
    def({ id: "calendar", cat: "Alat", icon: "🗓️", name: "Kalender kita", desc: "Tanggal spesial dan monthsary", close: true, run: () => {
      const m = modal("Kalender kita"), now = new Date(), sp = specials(), mday = cfg.relationship.anniversary.day; let y = now.getFullYear(), mo = now.getMonth();
      const head = el("div", "cal__head"), title = el("strong"), grid = el("div", "cal__grid");
      const draw = () => {
        title.textContent = MONTH_NAMES[mo] + " " + y; grid.innerHTML = "";
        ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].forEach((d) => grid.appendChild(el("span", "cal__dow", d)));
        const first = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
        for (let k = 0; k < first; k++) grid.appendChild(el("span"));
        for (let d = 1; d <= days; d++) {
          const c = el("span", "cal__d", String(d)), hit = sp.filter((s) => s.m === mo && s.d === d);
          if (hit.length) { c.classList.add("sp"); c.title = hit.map((h) => h.t).join(", "); c.appendChild(el("i", "", hit[0].e)); } else if (d === mday) { c.classList.add("ms"); c.appendChild(el("i", "", "💗")); }
          if (y === now.getFullYear() && mo === now.getMonth() && d === now.getDate()) c.classList.add("today");
          grid.appendChild(c);
        }
      };
      head.append(btn("‹", () => { mo--; if (mo < 0) { mo = 11; y--; } draw(); }), title, btn("›", () => { mo++; if (mo > 11) { mo = 0; y++; } draw(); }));
      m.body.append(head, grid, el("p", "fxm__info", "💗 monthsary (tiap tanggal " + mday + ") · 🎂 ulang tahun · 💍 hari jadi · 🌹 first date")); draw();
    } });
    def({ id: "board", cat: "Alat", icon: "🖍️", name: "Papan gambar", desc: "Corat-coret bebas, bisa disimpan", close: true, run: () => {
      const ov = overlay("fx-draw"), cv = el("canvas"); ov.sticky = true; ov.o.appendChild(cv);
      const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; const g = cv.getContext("2d"); g.scale(dpr, dpr);
      const wipe = () => { g.fillStyle = "#24101a"; g.fillRect(0, 0, innerWidth, innerHeight); }; wipe(); g.lineCap = "round"; g.lineJoin = "round";
      let color = "#f3d6bd", size = 4, down = false, lx = 0, ly = 0;
      const bar = el("div", "fx-draw__bar");
      ["#fff6ec", "#f3d6bd", "#ff9aa8", "#e0526f", "#9ad0ff", "#b6e3a8", "#24101a"].forEach((c) => { const b = el("button", "sw"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "Warna"); b.onclick = () => { color = c; }; bar.appendChild(b); });
      [["S", 3], ["M", 7], ["L", 14]].forEach(([t, s]) => bar.appendChild(btn(t, () => { size = s; })));
      bar.append(btn("Hapus", wipe), btn("Simpan", () => { try { cv.toBlob((b) => { if (b) { dl(b, "gambar-kita.png"); store.set("drew", "1"); A.toast("Gambar tersimpan"); } }); } catch (e) { A.toast("Menyimpan butuh GitHub Pages"); } }), btn("Tutup", ov.close)); ov.o.appendChild(bar);
      cv.addEventListener("pointerdown", (e) => { down = true; lx = e.clientX; ly = e.clientY; g.strokeStyle = color; g.lineWidth = size; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + .1, ly + .1); g.stroke(); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* abaikan */ } });
      cv.addEventListener("pointermove", (e) => { if (!down) return; g.strokeStyle = color; g.lineWidth = size; g.beginPath(); g.moveTo(lx, ly); g.lineTo(e.clientX, e.clientY); g.stroke(); lx = e.clientX; ly = e.clientY; });
      const end = () => { down = false; }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    } });
    const capsules = () => json("capsules", "[]");
    def({ id: "capsule", cat: "Alat", icon: "💌", name: "Kapsul waktu", desc: "Tulis pesan untuk dibuka nanti", close: true, run: () => {
      const m = modal("Kapsul waktu"), ta = el("textarea", "fxm__ta"), dt = el("input", "fxm__in"); ta.placeholder = "Tulis pesan untuk dibuka di masa depan…"; ta.maxLength = 400; dt.type = "date";
      const list = el("p", "fxm__info", "Kapsul tersimpan: " + capsules().length);
      m.body.append(ta, el("label", "fxm__info", "Dibuka pada tanggal:"), dt, btn("Simpan kapsul", () => {
        if (!ta.value.trim() || !dt.value) { A.toast("Isi pesan dan tanggalnya ya"); return; }
        const c = capsules(); c.push({ text: ta.value.trim(), date: dt.value, done: false }); store.set("capsules", JSON.stringify(c)); A.toast("Kapsul tersimpan 💌 Dibuka " + dt.value); A.chime(); m.close();
      }), list);
    } });
    const getCd = () => json("cd", "null");
    let chip2 = null;
    const paintCd = () => {
      const c = getCd(); if (!c) { if (chip2) { chip2.remove(); chip2 = null; } return; }
      const left = Math.ceil((new Date(c.date + "T00:00:00") - new Date(new Date().toDateString())) / 864e5);
      const chip = $("chip"); if (!chip2 && chip) { chip2 = el("span", "chip"); chip.after(chip2); }
      if (chip2) chip2.textContent = "⏳ " + c.label + (left > 0 ? " · " + left + " hari" : left === 0 ? " · hari ini!" : " · sudah lewat");
    };
    def({ id: "countdown", cat: "Alat", icon: "⏳", name: "Hitung mundur sendiri", desc: "Hitung mundur ke acara apa pun", init: paintCd, close: true, run: () => {
      const m = modal("Hitung mundur"), lab = el("input", "fxm__in"), dt = el("input", "fxm__in"); lab.placeholder = "Nama acara, misalnya Liburan"; lab.maxLength = 24; dt.type = "date";
      m.body.append(lab, dt, btn("Simpan", () => { if (!lab.value.trim() || !dt.value) { A.toast("Isi nama dan tanggalnya"); return; } store.set("cd", JSON.stringify({ label: lab.value.trim(), date: dt.value })); paintCd(); m.close(); A.toast("Hitung mundur dipasang ⏳"); }), btn("Hapus", () => { store.set("cd", "null"); paintCd(); m.close(); }));
    } });
    def({ id: "remind", cat: "Alat", icon: "🔔", name: "Pengingat hari spesial", desc: "Pemberitahuan 7 hari sebelumnya", defaultOn: true, make: () => {
      const day = new Date().toDateString(); if (store.get("remindDay") !== day) {
        const near = specials().map((s) => ({ s, left: daysUntil(s) })).filter((x) => x.left <= 7).sort((a, b) => a.left - b.left)[0];
        if (near) { store.set("remindDay", day); setTimeout(() => A.toast(near.s.e + " " + near.s.t + (near.left === 0 ? " hari ini!" : " " + near.left + " hari lagi")), 4000); }
      } return () => {};
    } });
    def({ id: "focus", cat: "Alat", icon: "🧘", name: "Mode fokus", desc: "Sembunyikan semua tombol", make: () => {
      document.body.classList.add("fx-focus"); const x = el("button", "fx-exit", "Keluar fokus"); x.type = "button"; x.onclick = () => { setOn(feats.find((f) => f.id === "focus"), false); }; document.body.appendChild(x);
      return () => { document.body.classList.remove("fx-focus"); x.remove(); };
    } });
    def({ id: "share", cat: "Alat", icon: "🔗", name: "Bagikan buku", desc: "Bagikan atau salin tautan", close: true, run: () => {
      const data = { title: cfg.couple.short1 + " & " + cfg.couple.short2, url: location.href };
      if (navigator.share) navigator.share(data).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(() => A.toast("Tautan disalin 🔗"), () => A.toast("Salin dari kolom alamat ya")); else A.toast("Salin dari kolom alamat ya");
    } });
    def({ id: "tilt", cat: "Alat", icon: "📱", name: "Miringkan HP", desc: "Buku ikut miring saat HP digerakkan", make: () => {
      const h = (e) => { const g = Math.max(-30, Math.min(30, e.gamma || 0)), b = Math.max(-30, Math.min(30, (e.beta || 45) - 45)); spread.style.transform = "rotateY(" + (g / 6).toFixed(2) + "deg) rotateX(" + (-b / 8).toFixed(2) + "deg)"; };
      const add = () => window.addEventListener("deviceorientation", h);
      if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") add(); else A.toast("Izin sensor ditolak"); }).catch(() => {}); else add();
      return () => { window.removeEventListener("deviceorientation", h); spread.style.transform = ""; };
    } });
    const stats = () => {
      const mine = json("stickers", "{}"); let st = 0, nt = 0; Object.keys(mine).forEach((k) => mine[k].forEach((s) => { if (s.note) nt++; else st++; }));
      return { days: Math.floor((Date.now() - new Date(cfg.relationship.startDate + "T00:00:00")) / 864e5), photos: photos.length, favs: A.readFavs().length, stickers: st, notes: nt, hugs: +store.get("hugs") || 0, popped: +store.get("popped") || 0, marks: json("marks", "[]").length, seen: json("seen", "[]").length, pages: A.leaves.length, drew: !!store.get("drew"), egg: !!store.get("egg"), chal: +store.get("chal") || 0, caps: capsules().length };
    };
    def({ id: "stats", cat: "Alat", icon: "📊", name: "Statistik kita", desc: "Ringkasan perjalanan di buku ini", close: true, run: () => {
      const s = stats(), m = modal("Statistik kita"), g = el("div", "fx-stat");
      [["💗", s.days, "hari bersama"], ["📸", s.photos, "foto"], ["♥", s.favs, "favorit"], ["🎀", s.stickers, "stiker"], ["✏️", s.notes, "catatan"], ["🤗", s.hugs, "peluk"], ["🎈", s.popped, "balon pecah"], ["🔖", s.marks, "penanda"], ["📖", s.seen + "/" + s.pages, "halaman dibuka"], ["💌", s.caps, "kapsul waktu"]].forEach(([i, v, l]) => { const c = el("div"); c.append(el("b", "", i), el("strong", "", String(v)), el("span", "", l)); g.appendChild(c); });
      m.body.appendChild(g);
    } });
    const BADGES = [
      ["📖", "Pembaca awal", "Membuka buku", (s) => s.seen > 1], ["🗺️", "Penjelajah", "Membuka 10 halaman", (s) => s.seen >= 10], ["🏁", "Sampai akhir", "Membuka semua halaman", (s) => s.seen >= s.pages],
      ["💗", "Hati berbunga", "1 foto favorit", (s) => s.favs >= 1], ["💞", "Hati penuh", "10 foto favorit", (s) => s.favs >= 10], ["🎀", "Tukang tempel", "5 stiker", (s) => s.stickers >= 5],
      ["✏️", "Penulis catatan", "1 catatan tulisan tangan", (s) => s.notes >= 1], ["🖍️", "Seniman", "Menyimpan gambar", (s) => s.drew], ["🤗", "Pemeluk", "5 peluk", (s) => s.hugs >= 5],
      ["🎈", "Pemecah balon", "20 balon", (s) => s.popped >= 20], ["🤫", "Penemu rahasia", "Menemukan rahasia kecil", (s) => s.egg], ["💪", "Penerima tantangan", "3 tantangan manis", (s) => s.chal >= 3], ["💌", "Penjaga kapsul", "Membuat kapsul waktu", (s) => s.caps >= 1]
    ];
    def({ id: "badges", cat: "Alat", icon: "🏅", name: "Lencana", desc: "Koleksi pencapaian manis", close: true, run: () => {
      const s = stats(), m = modal("Lencana"), g = el("div", "fx-badges"), got = json("badges", "[]");
      BADGES.forEach((b, i) => { const c = el("div", got.indexOf(i) !== -1 || b[3](s) ? "on" : ""); c.append(el("b", "", b[0]), el("strong", "", b[1]), el("span", "", b[2])); g.appendChild(c); });
      m.body.appendChild(g);
    } });

    /* ===== SERU (4) ===== */
    def({ id: "wheel", cat: "Seru", icon: "🎡", name: "Roda kencan", desc: "Putar untuk memilih kegiatan berdua", close: true, run: () => {
      const items = (cfg.wheel && cfg.wheel.length) ? cfg.wheel : ["Nonton film", "Piknik santai", "Makan es krim", "Jalan sore", "Masak bareng", "Main game", "Ke toko buku", "Nonton teater"];
      const m = modal("Roda kencan"), wrap = el("div", "wheel"), cv = el("canvas"), n = items.length, seg = 2 * Math.PI / n, cols = ["#a8505f", "#7a1f3d", "#c98f9b", "#5a1429"]; cv.width = cv.height = 320; const g = cv.getContext("2d");
      items.forEach((t, i) => { g.beginPath(); g.moveTo(160, 160); g.arc(160, 160, 156, i * seg - Math.PI / 2, (i + 1) * seg - Math.PI / 2); g.closePath(); g.fillStyle = cols[i % 4]; g.fill(); g.save(); g.translate(160, 160); g.rotate(i * seg + seg / 2 - Math.PI / 2); g.fillStyle = "#fff6ec"; g.font = "600 15px sans-serif"; g.textAlign = "right"; g.fillText(String(t).slice(0, 16), 146, 5); g.restore(); });
      wrap.append(cv, el("i", "wheel__pin")); const res = el("p", "fxm__res", "Putar rodanya!"); let rot = 0, busy = false;
      m.body.append(wrap, btn("Putar", () => {
        if (busy) return; busy = true; rot += 1800 + Math.random() * 360; cv.style.transform = "rotate(" + rot + "deg)";
        setTimeout(() => { const idx = Math.floor((((360 - rot % 360) % 360)) / (360 / n)) % n; res.textContent = "Hari ini: " + items[idx] + " 💗"; A.burst(innerWidth / 2, innerHeight / 2, ["🎉", "✨", "💗"]); A.chime([784, 1175]); busy = false; }, 4600);
      }), res);
    } });
    const FORT = ["Hal baik datang pada yang sabar menunggu.", "Hari ini akan ada kejutan manis.", "Senyummu membuat seseorang bahagia hari ini.", "Cinta tumbuh dari hal-hal kecil.", "Kamu lebih kuat dari yang kamu kira.", "Akan ada tawa besar sebelum malam.", "Seseorang sedang memikirkanmu sekarang.", "Petualangan berikutnya sudah dekat.", "Makan yang enak akan memperbaiki harimu.", "Peluk hangat sedang dalam perjalanan.", "Kenangan hari ini akan jadi favoritmu nanti.", "Mimpimu pelan-pelan jadi nyata.", "Yang tulus selalu menemukan jalannya.", "Hari ini cocok untuk mengatakan terima kasih.", "Bintangmu sedang bersinar terang."];
    def({ id: "fortune", cat: "Seru", icon: "🥠", name: "Kue keberuntungan", desc: "Ramalan manis untuk hari ini", close: true, run: () => {
      const m = modal("Kue keberuntungan"), c = el("p", "fxm__big", "🥠"), t = el("p", "fxm__res", "Ketuk kuenya untuk memecahkannya");
      const crack = () => { c.classList.add("shake"); setTimeout(() => { c.classList.remove("shake"); c.textContent = "📜"; t.textContent = pick(FORT); A.chime([659, 988]); }, 500); };
      c.onclick = crack; m.body.append(c, t, btn("Satu lagi", () => { c.textContent = "🥠"; t.textContent = "Ketuk kuenya untuk memecahkannya"; }));
    } });
    const SHELL = ["Ya.", "Tidak.", "Mungkin nanti.", "Pasti!", "Coba tanya lagi.", "Sepertinya iya.", "Jangan terlalu dipikirkan.", "Ikuti kata hatimu.", "Aku ragu.", "Tentu saja!"];
    def({ id: "shell", cat: "Seru", icon: "🐚", name: "Kerang ajaib", desc: "Tanyakan sesuatu, dapat jawaban", close: true, run: () => {
      const m = modal("Kerang ajaib"), c = el("p", "fxm__big", "🐚"), t = el("p", "fxm__res", "Pikirkan pertanyaannya, lalu ketuk kerangnya");
      c.onclick = () => { c.classList.add("shake"); t.textContent = "…"; setTimeout(() => { c.classList.remove("shake"); t.textContent = pick(SHELL); A.chime([523, 659]); }, 700); }; m.body.append(c, t);
    } });
    const CHAL = ["Kirim satu pesan manis hari ini.", "Peluk selama 20 detik.", "Pujilah tiga hal kecil dari pasanganmu.", "Buat minuman favorit untuknya.", "Kirim foto lama dan ceritakan kenangannya.", "Jalan sore tanpa HP.", "Tulis catatan kecil dan selipkan di tasnya.", "Nyanyikan satu lagu favorit berdua.", "Ceritakan hal yang kamu syukuri darinya.", "Rencanakan kencan berikutnya bersama.", "Pijat bahu selama lima menit.", "Dengarkan ceritanya tanpa menyela."];
    def({ id: "challenge", cat: "Seru", icon: "💪", name: "Tantangan manis", desc: "Satu tantangan romantis acak", close: true, run: () => {
      const m = modal("Tantangan manis"), t = el("p", "fxm__big2", pick(CHAL));
      m.body.append(t, btn("Acak lagi", () => { t.textContent = pick(CHAL); }), btn("Selesai ✓", () => { store.set("chal", String((+store.get("chal") || 0) + 1)); A.burst(innerWidth / 2, innerHeight / 2, ["💗", "✨", "🎉"]); A.chime([784, 1175]); A.toast("Tantangan selesai! Total " + store.get("chal")); m.close(); }));
    } });

    /* ---------- Kotak Fitur (UI) ---------- */
    const CATS = ["Suasana", "Foto", "Suara", "Alat", "Seru"];
    const lab = el("div", "lab"); lab.hidden = true; lab.setAttribute("role", "dialog"); lab.setAttribute("aria-label", "Kotak fitur");
    const labHead = el("div", "lab__head"), tabs = el("div", "lab__tabs"), gridEl = el("div", "lab__grid"), closeX = el("button", "fxo__x", "✕"); closeX.type = "button"; closeX.onclick = () => { lab.hidden = true; };
    labHead.append(el("h3", "", "Kotak fitur · " + feats.length), closeX); lab.append(labHead, tabs, gridEl); document.body.appendChild(lab);
    let curCat = CATS[0];
    function renderLab() {
      tabs.innerHTML = ""; gridEl.innerHTML = "";
      CATS.forEach((c) => { const t = el("button", c === curCat ? "is-on" : "", c); t.type = "button"; t.onclick = () => { curCat = c; renderLab(); }; tabs.appendChild(t); });
      feats.filter((f) => f.cat === curCat).forEach((f) => {
        const b = el("button", "lab__item"); b.type = "button"; b.append(el("b", "", f.icon), el("span", "lab__n", f.name), el("small", "", f.desc));
        if (f.make) { b.setAttribute("aria-pressed", String(isOn(f))); b.onclick = () => { setOn(f, !isOn(f)); renderLab(); }; }
        else b.onclick = () => { if (f.close) lab.hidden = true; f.run(); };
        gridEl.appendChild(b);
      });
    }
    const labBtn = $("labBtn"); if (labBtn) labBtn.onclick = () => { lab.hidden = !lab.hidden; if (!lab.hidden) renderLab(); };
    document.addEventListener("pointerdown", (e) => { if (!lab.hidden && lab.contains && !lab.contains(e.target) && e.target !== labBtn && !(labBtn && labBtn.contains && labBtn.contains(e.target)) && !stack.length) lab.hidden = true; });

    /* ---------- mulai: pulihkan pengaturan, lacak halaman, kapsul, lencana ---------- */
    feats.forEach((f) => {
      if (f.init) { try { f.init(); } catch (e) { console.warn(f.id, e); } }
      if (f.make && !f.gesture) { const v = store.get("fx:" + f.id); if (v === "on" || (v === null && f.defaultOn)) setOn(f, true); }
    });
    const countEl = $("bookCount");
    if (countEl && window.MutationObserver) {
      new MutationObserver(() => { const n = A.firstLeaf(), seen = json("seen", "[]"); [n, n + 1].forEach((x) => { if (x < A.leaves.length && seen.indexOf(x) === -1) seen.push(x); }); store.set("seen", JSON.stringify(seen)); }).observe(countEl, { childList: true, characterData: true, subtree: true });
    }
    const checkCaps = () => {
      const c = capsules(), today = new Date().toISOString().slice(0, 10), due = c.findIndex((x) => !x.done && x.date <= today);
      if (due > -1) { const cap = c[due]; cap.done = true; store.set("capsules", JSON.stringify(c)); const m = modal("Kapsul waktu terbuka 💌"); m.body.append(el("p", "fxm__big2", cap.text), el("p", "fxm__info", "Ditulis untuk tanggal " + cap.date)); A.petalRain(20); A.chime([523, 659, 784, 1047]); }
    };
    setTimeout(checkCaps, 2500);
    setInterval(() => {
      const s = stats(), got = json("badges", "[]"); let changed = false;
      BADGES.forEach((b, i) => { if (got.indexOf(i) === -1 && b[3](s)) { got.push(i); changed = true; A.toast("Lencana baru: " + b[0] + " " + b[1]); A.burst(innerWidth / 2, innerHeight * .4, [b[0], "✨", "💗"]); A.chime([784, 1175, 1568]); } });
      if (changed) store.set("badges", JSON.stringify(got));
    }, 7000);
    document.addEventListener("dblclick", (e) => { if (store.get("fx:dbl") === "on" && !(e.target.closest && e.target.closest("button,.fxo,.lab"))) { A.burst(e.clientX, e.clientY, ["💗", "💞", "✨", "🌸"]); A.petalRain(6); } });
    window.BookAPI.fx = feats;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
