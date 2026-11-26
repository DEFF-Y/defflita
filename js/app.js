(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const cfg = typeof siteConfig !== "undefined" ? siteConfig : null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const safe = (fn) => { try { fn(); } catch (e) { console.warn(fn.name, e); } };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* diabaikan */ } }
  };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const longDate = (d) => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const photos = (typeof galleryData !== "undefined" ? galleryData : []).filter((p) => p && p.image);
  const quoteList = (typeof quotes !== "undefined" && quotes.length) ? quotes : ["Cerita kita masih terus ditulis."];

  function burst(x, y, chars) {
    if (reduceMotion || !document.body.animate) return;
    for (let k = 0; k < 7; k++) {
      const s = el("span", "puff", chars[k % chars.length]); s.style.left = x + "px"; s.style.top = y + "px"; document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60;
      const end = "translate(calc(-50% + " + Math.cos(a) * d + "px), calc(-50% + " + (Math.sin(a) * d - 30) + "px)) scale(1.1) rotate(" + (Math.random() * 80 - 40) + "deg)";
      s.animate([{ transform: "translate(-50%,-50%) scale(.4)", opacity: 1 }, { transform: end, opacity: 0 }], { duration: 800 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.2,1)" }).onfinish = () => s.remove();
    }
  }

  let audioCtx = null, noiseBuf = null;
  function pageSound(power) {
    if (store.get("sfx") === "off") return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audioCtx = audioCtx || new AC(); if (audioCtx.state === "suspended") audioCtx.resume();
      if (!noiseBuf) { noiseBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 1.3), audioCtx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const src = audioCtx.createBufferSource(), bp = audioCtx.createBiquadFilter(), g = audioCtx.createGain(), t = audioCtx.currentTime;
      src.buffer = noiseBuf; bp.type = "lowpass"; bp.Q.value = .4;
      bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(1500, t + .9);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.035 * power, t + .35); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
      src.connect(bp); bp.connect(g); g.connect(audioCtx.destination); src.start(t); src.stop(t + 1.2);
    } catch (e) { /* abaikan */ }
  }

  function chime(freqs) {
    if (store.get("sfx") === "off") return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audioCtx = audioCtx || new AC(); if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      (freqs || [784, 1175]).forEach((f, k) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain(), s = t + k * .11;
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.05, s + .03); g.gain.exponentialRampToValueAtTime(.0001, s + .7);
        o.connect(g); g.connect(audioCtx.destination); o.start(s); o.stop(s + .8);
      });
    } catch (e) { /* abaikan */ }
  }
  function petalRain(n) {
    if (reduceMotion || !document.body.animate) return;
    const set = ["🌸", "🌷", "💗", "✨", "🌹", "🤍"];
    for (let k = 0; k < n; k++) {
      const s = el("span", "petal", set[k % set.length]); s.style.left = Math.random() * 100 + "vw"; s.style.fontSize = 14 + Math.random() * 14 + "px"; document.body.appendChild(s);
      const sway = (Math.random() * 120 - 60) + "px";
      s.animate([{ transform: "translate(0,-8vh) rotate(0deg)", opacity: 0 }, { opacity: 1, offset: .1 }, { transform: "translate(" + sway + ",108vh) rotate(" + (Math.random() * 360 - 180) + "deg)", opacity: .9 }],
        { duration: 6000 + Math.random() * 4000, delay: Math.random() * 2500, easing: "ease-in-out", fill: "backwards" }).onfinish = () => s.remove();
    }
  }
  let toastEl = null, toastTimer = 0;
  function toast(msg, label, fn) {
    if (toastEl) toastEl.remove(); clearTimeout(toastTimer);
    toastEl = el("div", "toast"); toastEl.appendChild(el("span", "", msg));
    if (label) { const b = el("button", "", label); b.type = "button"; b.addEventListener("click", () => { fn(); toastEl.remove(); }); toastEl.appendChild(b); }
    document.body.appendChild(toastEl); toastTimer = setTimeout(() => { if (toastEl) toastEl.remove(); }, label ? 8000 : 3500);
  }
  function readFavs() { try { return JSON.parse(store.get("favs") || "[]") || []; } catch (e) { return []; } }
  const isFav = (p) => readFavs().indexOf(p.image) !== -1;
  function updateFavBadges() {
    document.querySelectorAll(".polaroid").forEach((b) => { const p = photos[+b.dataset.pid]; if (p) b.classList.toggle("fav", isFav(p)); });
    const lf = $("lbFav"); if (lf && photos[current]) lf.textContent = isFav(photos[current]) ? "♥" : "♡";
  }
  function toggleFav(p) { const f = readFavs(), i = f.indexOf(p.image); if (i === -1) f.push(p.image); else f.splice(i, 1); store.set("favs", JSON.stringify(f)); updateFavBadges(); return i === -1; }
  function scheduleSky() {
    if (reduceMotion || !document.body.animate) return;
    const desk = document.querySelector(".desk");
    const star = () => {
      if (desk) {
        const s = el("i", "shoot"); s.style.left = 50 + Math.random() * 45 + "vw"; s.style.top = 4 + Math.random() * 25 + "vh"; desk.appendChild(s);
        s.animate([{ transform: "rotate(-28deg) translateX(0)", opacity: 0 }, { opacity: 1, offset: .15 }, { transform: "rotate(-28deg) translateX(-360px)", opacity: 0 }], { duration: 1500, easing: "ease-out" }).onfinish = () => s.remove();
      }
      setTimeout(star, 18000 + Math.random() * 22000);
    };
    const fly = () => {
      const b = el("button", "flutter", "🦋"); b.type = "button"; b.setAttribute("aria-label", "Kupu-kupu"); document.body.appendChild(b);
      const pts = [], steps = 7;
      for (let k = 0; k <= steps; k++) pts.push({ transform: "translate(" + (-10 + k * (120 / steps)) + "vw," + (10 + Math.random() * 60) + "vh) rotate(" + (k % 2 ? 12 : -12) + "deg)" });
      b.animate(pts, { duration: 16000, easing: "linear" }).onfinish = () => b.remove();
      b.addEventListener("click", (e) => { burst(e.clientX, e.clientY, ["🦋", "✨", "💗"]); chime([880, 1319]); b.remove(); });
      setTimeout(fly, 50000 + Math.random() * 40000);
    };
    setTimeout(star, 6000); setTimeout(fly, 20000);
  }

  function startRain() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    audioCtx = audioCtx || new AC(); if (audioCtx.state === "suspended") audioCtx.resume();
    const len = audioCtx.sampleRate * 2, buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = audioCtx.createBufferSource(), lp = audioCtx.createBiquadFilter(), g = audioCtx.createGain();
    src.buffer = buf; src.loop = true; lp.type = "lowpass"; lp.frequency.value = 1400; g.gain.value = .0001;
    src.connect(lp); lp.connect(g); g.connect(audioCtx.destination); src.start(); g.gain.setTargetAtTime(.4, audioCtx.currentTime, 1.2);
    return { src, g };
  }
  function dailyMessage() {
    const day = new Date().toDateString(); if (store.get("daily") === day) return; store.set("daily", day);
    const list = (cfg.notes && cfg.notes.length) ? cfg.notes : quoteList;
    setTimeout(() => toast("Pesan hari ini: " + list[Math.floor(Date.now() / 864e5) % list.length]), 1800);
  }

  /* ===== Hitung hari bersama ===== */
  function updateCounter() {
    const diff = Math.max(0, Date.now() - new Date(cfg.relationship.startDate + "T00:00:00").getTime());
    const set = (cls, v) => document.querySelectorAll("." + cls).forEach((n) => { n.textContent = v; });
    set("cnt-d", Math.floor(diff / 864e5)); set("cnt-h", Math.floor(diff / 36e5) % 24); set("cnt-m", Math.floor(diff / 6e4) % 60); set("cnt-s", Math.floor(diff / 1e3) % 60);
  }
  function anniversaryNote() {
    const a = cfg.relationship.anniversary, now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let next = new Date(now.getFullYear(), a.month - 1, a.day);
    if (next < today) next = new Date(now.getFullYear() + 1, a.month - 1, a.day);
    const left = Math.round((next - today) / 864e5);
    return left === 0 ? "Hari ini hari jadi kita!" : left + " hari lagi";
  }

  /* ===== Lightbox ===== */
  let current = 0, lastFocus = null;
  function showPhoto(i) {
    current = (i + photos.length) % photos.length; const p = photos[current];
    const img = $("lbImg"); img.src = p.image; img.alt = p.title || "Foto kenangan";
    img.classList.remove("swap"); void img.offsetWidth; img.classList.add("swap"); updateFavBadges();
    const m = $("lbMeta"); m.innerHTML = "";
    if (p.title) m.appendChild(el("h3", "", p.title));
    const info = [p.date, p.location].filter(Boolean).join(" — "); if (info) m.appendChild(el("small", "", info));
    if (p.caption) m.appendChild(el("p", "", p.caption)); if (p.story) m.appendChild(el("p", "story", p.story));
    m.appendChild(el("small", "", String(current + 1).padStart(2, "0") + " / " + String(photos.length).padStart(2, "0")));
  }
  function openLightbox(i) { lastFocus = document.activeElement; const lb = $("lightbox"); lb.hidden = false; showPhoto(i); requestAnimationFrame(() => lb.classList.add("is-open")); $("lbClose").focus(); }
  function closeLightbox() { const lb = $("lightbox"); lb.classList.remove("is-open"); setTimeout(() => { lb.hidden = true; }, 300); if (lastFocus) lastFocus.focus(); }
  function initializeLightbox() {
    $("lbFav").onclick = (e) => { const on = toggleFav(photos[current]); if (on) { burst(e.clientX, e.clientY, ["💗", "✨", "🌸"]); chime(); } };
    $("lbClose").onclick = closeLightbox; $("lbPrev").onclick = () => showPhoto(current - 1); $("lbNext").onclick = () => showPhoto(current + 1);
    $("lightbox").addEventListener("click", (e) => { if (e.target === $("lightbox") || e.target.classList.contains("lb__body")) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if ($("lightbox").hidden) return;
      if (e.key === "Escape") closeLightbox(); else if (e.key === "ArrowLeft") showPhoto(current - 1); else if (e.key === "ArrowRight") showPhoto(current + 1);
    });
    let x0 = null;
    $("lightbox").addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    $("lightbox").addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* ===== Buku ===== */
  function initializeBook() {
    const spread = $("bookSpread"), book = $("book"), count = $("bookCount");
    const desktopMQ = window.matchMedia("(min-width: 900px)");
    // Tata letak foto di lembaran: [x, y, lebar, tinggi, kemiringan] dalam satuan 1% lebar halaman
    const TPL = {
      1: [[[10, 12, 80, 100, -1.5]], [[8, 16, 84, 92, 1.8]], [[14, 10, 74, 104, -2.5]]],
      2: [[[7, 7, 62, 58, -3], [30, 66, 62, 56, 2.5]], [[30, 7, 62, 56, 2.5], [7, 64, 62, 58, -2]], [[6, 10, 52, 60, -2], [44, 54, 50, 64, 3]]],
      3: [[[7, 6, 86, 50, -1.5], [6, 60, 44, 56, -3], [52, 64, 42, 52, 3]], [[6, 6, 44, 52, -3], [50, 10, 44, 52, 2.5], [14, 64, 72, 56, -1]], [[22, 6, 56, 44, 2], [6, 52, 48, 66, -2.5], [48, 58, 46, 60, 3]]],
      4: [[[6, 6, 44, 52, -2], [50, 8, 44, 50, 2.5], [8, 62, 42, 56, 2], [50, 62, 44, 56, -3]], [[6, 8, 40, 50, 2], [48, 6, 46, 40, -2.5], [10, 60, 46, 56, -1.5], [54, 50, 40, 64, 2.5]]]
    };
    const DOODLES = ["♡", "✦", "yay!", "^_^", "hehe", "♪", "★", "uwu", "✿"], tplCount = {};
    const r = cfg.relationship, c = cfg.couple, start = new Date(r.startDate + "T00:00:00");
    const monthKey = (p) => (p && p.taken ? p.taken.slice(0, 7) : "");
    const monthLabel = (key) => new Date(key + "-01T00:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const letter = cfg.letter && cfg.letter.text ? cfg.letter : null;

    function chunkLetter(text) {
      const paras = String(text).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean), chunks = [];
      let cur = "";
      paras.forEach((p) => { if (cur && (cur + p).length > 650) { chunks.push(cur); cur = ""; } cur += (cur ? "\n\n" : "") + p; });
      if (cur) chunks.push(cur);
      return chunks;
    }
    function pastTodayNote() {
      const now = new Date(), md = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
      const hit = photos.find((p) => p.taken && p.taken.slice(5, 10) === md && +p.taken.slice(0, 4) < now.getFullYear());
      return hit ? "Hari ini, " + (now.getFullYear() - +hit.taken.slice(0, 4)) + " tahun lalu" + (hit.title ? ": " + hit.title + "." : ".") : "";
    }

    const MONTHS = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
    function isToday(label) {
      const m = /(\d+)\s+([A-Za-z]+)/.exec(label || ""), now = new Date();
      return !!m && +m[1] === now.getDate() && MONTHS.indexOf(m[2].toLowerCase()) === now.getMonth();
    }
    function celebration() {
      if (isToday(cfg.birthdays.person1)) return "Selamat ulang tahun, " + c.short1 + "!";
      if (isToday(cfg.birthdays.person2)) return "Selamat ulang tahun, " + c.short2 + "!";
      if (isToday(r.anniversary.label)) return "Selamat hari jadi, " + c.short1 + " & " + c.short2 + "!";
      return "";
    }

    // --- 1. Susun daftar halaman ---
    const leaves = [], toc = [];
    const add = (leaf, label) => { if (label) toc.push({ label, leaf: leaves.length }); leaves.push(leaf); };
    add({ type: "cover" }); add({ type: "title" }); add({ type: "toc" });
    add({ type: "place" }, "Tempat Semuanya Bermula"); add({ type: "date" }, "First Date"); add({ type: "timeline" }, "Perjalanan");
    if (cfg.littleList && cfg.littleList.items && cfg.littleList.items.length) add({ type: "list" }, cfg.littleList.title || "Daftar kecil kita");
    if (letter) chunkLetter(letter.text).forEach((t, k, all) => add({ type: "letter", text: t, first: k === 0, last: k === all.length - 1 }, k === 0 ? "Surat" : ""));
    let i = 0, lastKey = "", rhythm = 0;
    while (i < photos.length) {
      const key = monthKey(photos[i]);
      if (key && key !== lastKey) add({ type: "chapter", key, total: photos.filter((p) => monthKey(p) === key).length }, "Momen · " + monthLabel(key));
      if (key) lastKey = key;
      const size = photos[i].featured ? 1 : [2, 3, 2, 4, 3][rhythm++ % 5], ids = [i];
      while (ids.length < size && i + ids.length < photos.length) {
        const nxt = photos[i + ids.length], nk = monthKey(nxt);
        if (nxt.featured || (nk && nk !== key)) break;
        ids.push(i + ids.length);
      }
      tplCount[ids.length] = (tplCount[ids.length] || 0) + 1;
      add({ type: "photos", ids, tpl: tplCount[ids.length] - 1 }, !lastKey && i === 0 ? "Momen" : ""); i += ids.length;
    }
    if (cfg.notes && cfg.notes.length) add({ type: "notes" }, "Kotak surat");
    add({ type: "quote" }, "Kutipan"); add({ type: "details" }, "Hal-hal kecil"); add({ type: "end" });
    leaves.forEach((l, n) => { l.n = n; });

    // --- 2. Isi halaman ---
    function frameSlot(src, alt, emptyText, hideOnFail) {
      if (!src && hideOnFail) return null;
      const slot = el("div", "slot"), pol = el("div", "polaroid polaroid--static cap0"), fr = el("span", "polaroid__img");
      pol.style.setProperty("--tilt", "-1.2deg"); pol.style.setProperty("--capH", "calc(var(--u) * 5)");
      const empty = () => { if (hideOnFail) { slot.remove(); return; } fr.innerHTML = ""; fr.classList.add("is-empty"); fr.appendChild(el("em", "", emptyText)); };
      if (!src) empty();
      else {
        const img = new Image(); img.alt = alt; img.decoding = "async"; img.width = 4; img.height = 5;
        img.onerror = empty; img.onload = () => { img.width = img.naturalWidth; img.height = img.naturalHeight; };
        img.src = src; fr.appendChild(img);
      }
      pol.appendChild(fr); slot.appendChild(pol); return slot;
    }
    // Foto utuh (tidak terpotong): bingkai mengikuti rasio foto, ditempel di slot yang berbeda-beda
    function makePolaroid(id, s, k) {
      const p = photos[id], spot = el("div", "spot"), b = el("button", "polaroid v" + (id % 4)); b.type = "button";
      spot.style.left = "calc(var(--u) * " + s[0] + ")"; spot.style.top = "calc(var(--u) * " + s[1] + ")";
      spot.style.width = "calc(var(--u) * " + s[2] + ")"; spot.style.height = "calc(var(--u) * " + s[3] + ")"; spot.style.zIndex = String(k + 1);
      b.style.setProperty("--tilt", s[4] + "deg"); b.dataset.pid = String(id);
      const hasT = !!p.title, hasD = !!p.date;
      b.style.setProperty("--capH", "calc(var(--u) * " + ((hasT || hasD) ? 3 + (hasT ? 5.6 : 0) + (hasD ? 4 : 0) : 5) + ")");
      if (!hasT && !hasD) b.classList.add("cap0");
      b.setAttribute("aria-label", "Buka foto: " + (p.title || "Momen " + (id + 1)));
      const frame = el("span", "polaroid__img"), img = new Image(), d = dims[id];
      img.alt = p.title || p.caption || "Foto kenangan"; img.decoding = "async"; img.width = d ? d.w : 4; img.height = d ? d.h : 5;
      img.onload = () => { if (!dims[id]) dims[id] = { w: img.naturalWidth, h: img.naturalHeight }; img.width = img.naturalWidth; img.height = img.naturalHeight; };
      img.onerror = () => b.classList.add("is-broken"); img.src = p.image; frame.appendChild(img); b.appendChild(frame);
      if (hasT || hasD) {
        const cap = el("span", "polaroid__cap");
        if (hasT) cap.appendChild(el("span", "polaroid__t", p.title));
        if (hasD) cap.appendChild(el("small", "", p.date));
        b.appendChild(cap);
      }
      b.appendChild(el("span", "heart", "♥")); if (isFav(p)) b.classList.add("fav");
      b.addEventListener("click", () => { if (!swiped) openLightbox(id); });
      spot.appendChild(b); return spot;
    }
    function makePage(leaf) {
      const pg = el("div", "page");
      switch (leaf.type) {
        case "cover": {
          pg.classList.add("page--cover"); pg.appendChild(el("span", "cover__spine"));
          pg.append(el("p", "kicker", "Buku kenangan"), el("h3", "", c.short1), el("span", "amp", "&"), el("h3", "", c.short2),
            el("p", "hand", cfg.hero.phrase), el("p", "cover__hint", "Geser atau ketuk untuk membuka"));
          ["t1", "t2", "t3", "t4"].forEach((t) => pg.appendChild(el("span", "twinkle " + t, "✦")));
          ["c1", "c2", "c3", "c4"].forEach((t) => pg.appendChild(el("span", "corner " + t)));
          pg.addEventListener("click", () => { if (!swiped) turn(1); });
          return pg;
        }
        case "title": {
          pg.classList.add("page--col");
          pg.append(el("p", "kicker", greeting()), el("h3", "", c.short1 + " & " + c.short2), el("p", "hand", "sejak " + longDate(start)));
          const party = celebration(); if (party) pg.appendChild(el("p", "hand party", party));
          const hero = frameSlot(cfg.hero.image, c.short1 + " dan " + c.short2, "", true); if (hero) pg.appendChild(hero);
          const cnt = el("div", "cnt"), d = el("p", "cnt__days"), sub = el("p", "cnt__sub");
          d.append(el("b", "cnt-d"), document.createTextNode("hari bersama"));
          sub.append(el("span", "cnt-h"), document.createTextNode(" jam "), el("span", "cnt-m"), document.createTextNode(" menit "), el("span", "cnt-s"), document.createTextNode(" detik"));
          const fact = el("p", "cnt__fact"); let fi = 0;
          const showFact = () => {
            const diff = Math.max(0, Date.now() - start.getTime()), nf = (n) => Math.floor(n).toLocaleString("id-ID");
            fact.textContent = [nf(diff / 36e5) + " jam sejak kita jadian", nf(diff / 6e4) + " menit yang kita lewati bersama", nf(diff / 6048e5) + " minggu bersama", "± " + nf(diff / 864e5 / 29.53) + " kali bulan purnama kita lewati", nf(diff / 864e5) + " kali matahari terbit sejak hari itu", milestoneText(diff), nextSpecialText()][fi % 7];
          };
          showFact();
          cnt.addEventListener("click", (e) => { if (swiped) return; fi++; showFact(); burst(e.clientX, e.clientY, ["✨", "🌸", "💗"]); });
          cnt.append(d, sub, fact); pg.appendChild(cnt); break;
        }
        case "toc": {
          pg.classList.add("page--scroll", "page--ribbon"); pg.dataset.keep = "1";
          pg.appendChild(el("h3", "", "Isi buku"));
          const note = pastTodayNote(); if (note) pg.appendChild(el("p", "hand", note));
          const ul = el("ul", "toc");
          toc.forEach((t) => {
            const li = el("li"), b = el("button"); b.type = "button"; b.append(el("span", "", t.label), el("span", "", String(t.leaf)));
            b.addEventListener("click", () => goTo(t.leaf)); li.appendChild(b); ul.appendChild(li);
          });
          pg.appendChild(ul); break;
        }
        case "place": {
          pg.classList.add("page--col");
          pg.append(el("p", "kicker", "Tempat Semuanya Bermula"), el("h3", "", r.meaningfulPlace), el("p", "", r.placeText));
          pg.appendChild(frameSlot(cfg.photos.place, r.meaningfulPlace, "Foto tempat ini belum ditambahkan")); break;
        }
        case "date": {
          const fd = r.firstDate; pg.classList.add("page--col");
          pg.append(el("p", "kicker", "First Date"), el("p", "bigdate", fd.day), el("h3", "", fd.month + " " + fd.year), el("p", "hand", fd.caption));
          pg.appendChild(frameSlot(cfg.photos.firstDate, "First date", "Foto first date belum ditambahkan")); break;
        }
        case "timeline": {
          pg.classList.add("page--scroll", "page--lined");
          pg.append(el("p", "kicker", "Perjalanan"), el("h3", "", "Momen yang kita simpan"));
          const ol = el("ol", "tl");
          (cfg.timeline || []).forEach((it) => { const li = el("li"); li.append(el("time", "", it.date), el("strong", "", it.title)); if (it.text) li.appendChild(el("p", "", it.text)); ol.appendChild(li); });
          pg.appendChild(ol); break;
        }
        case "letter": {
          pg.classList.add("page--scroll", "page--lined");
          if (leaf.first) pg.appendChild(el("h3", "", letter.title || "Sebuah surat"));
          leaf.text.split(/\n\s*\n/).forEach((t) => pg.appendChild(el("p", "hand letter", t)));
          if (leaf.last && letter.from) pg.appendChild(el("p", "hand letter letter__from", letter.from)); break;
        }
        case "list": {
          pg.classList.add("page--scroll", "page--lined");
          pg.append(el("p", "kicker", "Catatan"), el("h3", "", cfg.littleList.title || "Daftar kecil kita"));
          const ul = el("ul", "checks");
          cfg.littleList.items.forEach((t) => {
            const li = el("li"), b = el("button"), box = el("span", "box"); b.type = "button"; b.append(box, el("span", "txt", t));
            b.addEventListener("click", (e) => { const on = li.classList.toggle("done"); box.textContent = on ? "✓" : ""; if (on) burst(e.clientX, e.clientY, ["✨", "🌸"]); });
            li.appendChild(b); ul.appendChild(li);
          });
          pg.appendChild(ul); break;
        }
        case "chapter": {
          pg.classList.add("page--center");
          pg.append(el("p", "kicker", "Bab"), el("h3", "", monthLabel(leaf.key)), el("p", "hand", leaf.total + " momen")); break;
        }
        case "photos": {
          pg.classList.add("pg");
          const set = TPL[leaf.ids.length], tpl = set[leaf.tpl % set.length];
          leaf.ids.forEach((id, k) => pg.appendChild(makePolaroid(id, tpl[k], k)));
          const dd = el("span", "doodle", DOODLES[(leaf.n * 3 + leaf.ids[0]) % DOODLES.length]);
          dd.style.left = "calc(var(--u) * " + (8 + (leaf.n * 29) % 60) + ")"; dd.style.setProperty("--r", ((leaf.n % 5) * 4 - 8) + "deg");
          pg.appendChild(dd); break;
        }
        case "notes": {
          pg.classList.add("page--center");
          pg.append(el("p", "kicker", "Kotak surat"), el("p", "hand", "Ketuk amplopnya"));
          const env = el("button", "env"); env.type = "button"; env.setAttribute("aria-label", "Buka amplop");
          const paper = el("span", "env__paper"), flap = el("span", "env__flap"), body = el("span", "env__body");
          env.append(paper, body, flap);
          let ni = Math.floor(Math.random() * cfg.notes.length), open = false;
          env.addEventListener("click", (e) => {
            if (swiped) return;
            if (!open) { paper.textContent = cfg.notes[ni % cfg.notes.length]; env.classList.add("open"); open = true; burst(e.clientX, e.clientY, ["💌", "✨", "💗"]); }
            else { env.classList.remove("open"); open = false; ni++; }
          });
          pg.appendChild(env); break;
        }
        case "quote": {
          pg.classList.add("page--center"); let qi = Math.floor(Math.random() * quoteList.length);
          const q = el("p", "quote", quoteList[qi]), b = el("button", "paper-btn", "Kutipan lain"); b.type = "button";
          b.addEventListener("click", () => { q.classList.add("is-fading"); setTimeout(() => { qi = (qi + 1) % quoteList.length; q.textContent = quoteList[qi]; q.classList.remove("is-fading"); }, 400); });
          pg.append(el("p", "kicker", "Kutipan"), q); if (quoteList.length > 1) pg.appendChild(b); break;
        }
        case "details": {
          pg.classList.add("page--col");
          pg.append(el("p", "kicker", "Hal-hal kecil"), el("h3", "", "Tanggal yang kita ingat"));
          const dl = el("dl", "dl");
          [["Ulang tahun " + c.short1, cfg.birthdays.person1], ["Ulang tahun " + c.short2, cfg.birthdays.person2], ["Anniversary", r.anniversary.label, anniversaryNote()]].forEach(([t, v, s]) => {
            const row = el("div"), dd = el("dd", "", v); if (s) dd.appendChild(el("small", "", s)); row.append(el("dt", "", t), dd); dl.appendChild(row);
          });
          pg.appendChild(dl); break;
        }
        default: {
          pg.classList.add("page--center");
          const lines = cfg.ending || [];
          pg.appendChild(el("p", "hand", lines.join(" ")));
          const hb = el("button", "paper-btn", "🤗 Kirim peluk"), hc = el("p", "kicker"); let hugs = +store.get("hugs") || 0;
          const paintHug = () => { hc.textContent = hugs ? "Peluk terkirim: " + hugs : ""; }; paintHug(); hb.type = "button";
          hb.addEventListener("click", (e) => { if (swiped) return; hugs++; store.set("hugs", String(hugs)); paintHug(); burst(e.clientX, e.clientY, ["🤗", "💗", "✨"]); chime([523, 784, 1047]); petalRain(10); });
          pg.append(hb, hc);
        }
      }
      const stickers = { title: "🌷", toc: "📖", place: "🎭", date: "💌", timeline: "✨", list: "🍓", letter: "💌", chapter: "🎞️", quote: "🌙", details: "🎂", end: "🧸" };
      if (stickers[leaf.type]) {
        const s = el("button", "sticker", stickers[leaf.type]); s.type = "button"; s.setAttribute("aria-label", "Stiker lucu");
        s.style.setProperty("--r", ((leaf.n % 3) * 7 - 7) + "deg");
        s.addEventListener("click", (e) => { e.stopPropagation(); s.classList.remove("is-pop"); void s.offsetWidth; s.classList.add("is-pop"); burst(e.clientX, e.clientY, [stickers[leaf.type], "✨", "💗"]); });
        pg.appendChild(s);
      }
      if (leaf.n < leaves.length - 1) {
        const cu = el("button", "curl"); cu.type = "button"; cu.setAttribute("aria-label", "Halaman berikutnya");
        cu.addEventListener("click", (e) => { e.stopPropagation(); if (!swiped) turn(1); }); pg.appendChild(cu);
      }
      pg.dataset.n = String(leaf.n);
      if (readMarks().indexOf(leaf.n) !== -1) pg.classList.add("page--ribbon");
      (readMine()[leaf.n] || []).forEach((s) => pg.appendChild(mineEl(s)));
      pg.appendChild(el("span", "page__no", String(leaf.n)));
      return pg;
    }

    function readMine() { try { return JSON.parse(store.get("stickers") || "{}") || {}; } catch (e) { return {}; } }
    function mineEl(s) { const m = el("span", "mine" + (s.note ? " mine--note" : ""), s.e); m.style.left = s.x + "%"; m.style.top = s.y + "%"; m.style.setProperty("--r", s.r + "deg"); return m; }
    function markWritten() {
      Array.from(spread.children).forEach((p) => { if (p.classList && p.classList.contains("page")) { p.classList.remove("written"); void p.offsetWidth; p.classList.add("written"); } });
    }

    function greeting() { const h = new Date().getHours(); return h < 4 ? "Selamat malam" : h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam"; }
    function milestoneText(diff) {
      const d = Math.floor(diff / 864e5), next = [100, 200, 300, 365, 500, 730, 1000, 1500, 2000, 3000].find((m) => m > d);
      return next ? (next - d) + " hari lagi menuju hari ke-" + next : "Hari ke-" + d + " bersama";
    }
    function nextSpecialText() {
      const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const list = [["Ulang tahun " + c.short1, cfg.birthdays.person1], ["Ulang tahun " + c.short2, cfg.birthdays.person2], ["Hari jadi kita", r.anniversary.label]].map(([t, l]) => {
        const m = /(\d+)\s+([A-Za-z]+)/.exec(l || ""), mo = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1;
        if (mo < 0) return null;
        let d = new Date(now.getFullYear(), mo, +m[1]); if (d < today) d = new Date(now.getFullYear() + 1, mo, +m[1]);
        return { t, left: Math.round((d - today) / 864e5) };
      }).filter(Boolean).sort((a, b) => a.left - b.left);
      return list.length ? (list[0].left === 0 ? list[0].t + " hari ini!" : list[0].t + " " + list[0].left + " hari lagi") : "Setiap hari bersamamu istimewa";
    }
    const dims = {};
    function loadDims() {
      let i = 0, active = 0;
      const next = () => {
        while (active < 3 && i < photos.length) {
          const id = i++, im = new Image(); active++;
          im.onload = im.onerror = () => { if (im.naturalWidth) dims[id] = { w: im.naturalWidth, h: im.naturalHeight }; active--; next(); };
          im.src = photos[id].image;
        }
      };
      next();
    }

    // --- 3. Tampilan & membalik halaman ---
    let view = [], pos = 0, perView = 1, animating = false, swiped = false, partied = false;
    function layout(keepLeaf) {
      perView = desktopMQ.matches ? 2 : 1;
      view = perView === 2 ? [null].concat(leaves) : leaves.slice();
      if (perView === 2 && view.length % 2) view.push(null);
      pos = perView === 2 ? Math.floor((keepLeaf + 1) / 2) * 2 : keepLeaf;
    }
    const posFor = (leafIdx) => (perView === 2 ? Math.floor((leafIdx + 1) / 2) * 2 : leafIdx);
    const firstLeaf = () => { const l = view[pos] || view[pos + 1]; return l ? l.n : 0; };
    const pageEl = (leaf, side) => { const pg = leaf ? makePage(leaf) : el("div", "page page--void"); pg.classList.add(side); return pg; };

    const N = 8; // jumlah irisan agar halaman bisa melengkung
    function setEdges(p) {
      const span = Math.max(1, view.length - perView), frac = Math.min(1, p / span);
      book.style.setProperty("--tl", (p === 0 ? 0 : 1.5 + 9 * frac) + "px");
      book.style.setProperty("--tr", (p + perView >= view.length ? 0 : 1.5 + 9 * (1 - frac)) + "px");
    }
    function updateUI() {
      book.classList.toggle("book--closed", pos === 0);
      const shown = [view[pos], perView === 2 ? view[pos + 1] : null].filter(Boolean).map((l) => l.n);
      count.textContent = shown[0] === 0 ? "Sampul" : "Halaman " + shown.join("–") + " dari " + (leaves.length - 1);
      $("bookPrev").disabled = pos <= 0; $("bookNext").disabled = pos + perView >= view.length;
      setEdges(pos); store.set("page", String(shown[0] || 0));
      for (let k = perView; k < perView * 2; k++) { const l = view[pos + k]; if (l && l.type === "photos") l.ids.forEach((id) => { new Image().src = photos[id].image; }); }
      updateCounter();
      if (!partied && shown.indexOf(1) !== -1 && celebration()) { partied = true; setTimeout(() => { [[.35, .45], [.65, .4], [.5, .62]].forEach(([x, y]) => burst(window.innerWidth * x, window.innerHeight * y, ["🎉", "✨", "🌸", "💗"])); }, 500); }
    }
    function renderView() {
      spread.innerHTML = "";
      for (let k = 0; k < perView; k++) spread.appendChild(pageEl(view[pos + k], perView === 2 && k === 0 ? "page--l" : "page--r"));
      updateUI(); markWritten();
    }
    // Halaman dipecah jadi irisan bersarang supaya bisa melengkung seperti kertas
    function buildFlip(next) {
      const fwd = next > pos, f = { fwd, next, strips: [] }, one = perView === 1;
      if (!one) {
        f.underL = pageEl(fwd ? view[pos] : view[next], "page--l"); f.underR = pageEl(fwd ? view[next + 1] : view[pos + 1], "page--r");
        f.frontEl = pageEl(fwd ? view[pos + 1] : view[next + 1], "page--r"); f.backEl = pageEl(fwd ? view[next] : view[pos], "page--l");
        f.finalPages = fwd ? [f.backEl, f.underR] : [f.underL, f.frontEl];
        f.cancelPages = fwd ? [f.underL, f.frontEl] : [f.backEl, f.underR];
      } else {
        f.underR = pageEl(fwd ? view[next] : view[pos], "page--r"); f.frontEl = pageEl(fwd ? view[pos] : view[next], "page--r");
        f.backEl = el("div", "page page--blank page--l");
        f.finalPages = fwd ? [f.underR] : [f.frontEl]; f.cancelPages = fwd ? [f.frontEl] : [f.underR];
      }
      spread.innerHTML = "";
      (one ? [f.underR] : [f.underL, f.underR]).forEach((p) => spread.appendChild(p));
      f.castL = el("div", "cast cast--l" + (one ? " is-off" : "")); f.castR = el("div", "cast cast--r" + (one ? " cast--single" : ""));
      f.leaf = el("div", "leaf" + (one ? " leaf--single" : ""));
      let parent = null;
      for (let i = 0; i < N; i++) {
        const s = el("div", "s"), fr = el("div", "clip clip--f"), bk = el("div", "clip clip--b"), sf = el("i", "shd"), sb = el("i", "shd"), h1 = el("i", "shn"), h2 = el("i", "shn");
        const pf = f.frontEl.cloneNode(true), pb = f.backEl.cloneNode(true);
        pf.style.left = "calc(var(--pw) * " + (-i / N) + ")"; pb.style.left = "calc(var(--pw) * " + (-(N - 1 - i) / N) + ")";
        fr.append(pf, sf, h1); bk.append(pb, sb, h2); s.append(fr, bk);
        if (parent) parent.appendChild(s); else f.leaf.appendChild(s);
        parent = s; f.strips.push({ s, sf, sb, h1, h2 });
      }
      spread.append(f.castL, f.castR, f.leaf);
      return f;
    }
    // Kain sutra: gelombang menjalar sepanjang halaman, tertinggal saat bergerak, dengan kilau satin
    function setLeaf(f, theta, vel) {
      const p = Math.min(1, Math.abs(theta) / 180), k = Math.sin(p * Math.PI);
      const lag = Math.max(-1, Math.min(1, -vel / 600)) * 9 * Math.pow(k, .7);
      const phase = theta * Math.PI / 120, amp = 4.2 * Math.pow(k, .9);
      let cum = theta;
      f.strips.forEach((st, i) => {
        if (i === 0) st.s.style.transform = "rotateY(" + theta.toFixed(2) + "deg)";
        else { const b = lag + amp * Math.sin(i * .85 + phase); st.s.style.transform = "rotateY(" + b.toFixed(2) + "deg)"; cum += b; }
        const shade = (.5 * (1 - Math.abs(Math.cos(cum * Math.PI / 180)))).toFixed(3);
        const gloss = (Math.max(0, 1 - Math.abs((Math.abs(cum) % 180) - 58) / 24) * .3 * Math.pow(k, .6)).toFixed(3);
        st.sf.style.opacity = shade; st.sb.style.opacity = shade; st.h1.style.opacity = gloss; st.h2.style.opacity = gloss;
      });
      f.castL.style.opacity = Math.min(.5, p * k * 1.2).toFixed(3);
      f.castR.style.opacity = Math.min(.5, (1 - p) * k * 1.2).toFixed(3);
    }
    const easeInOut = (t) => t * t * t * (t * (6 * t - 15) + 10);
    function tween(f, from, to, ms, onEnd) {
      const t0 = performance.now(); let prev = from, prevT = t0;
      (function step(now) {
        const t = Math.min(1, Math.max(0, (now - t0) / ms)), th = from + (to - from) * easeInOut(t);
        const vel = (th - prev) / Math.max(1, now - prevT) * 1000; prev = th; prevT = now;
        setLeaf(f, th, t < 1 ? vel : 0);
        if (t < 1) requestAnimationFrame(step); else onEnd();
      })(t0);
    }
    function spring(f, from, to, v0, onEnd) {
      let th = from, v = v0, last = performance.now();
      const K = 46, C = 12.5;
      (function step(now) {
        const dt = Math.min(.032, Math.max(.001, (now - last) / 1000)), h = dt / 4; last = now;
        for (let k = 0; k < 4; k++) { v += (K * (to - th) - C * v) * h; th += v * h; if (th < -180) { th = -180; v = 0; } else if (th > 0) { th = 0; v = 0; } }
        setLeaf(f, th, v);
        if (Math.abs(to - th) < .4 && Math.abs(v) < 8) { setLeaf(f, to, 0); onEnd(); } else requestAnimationFrame(step);
      })(last);
    }
    function settle(f, commit) {
      spread.innerHTML = "";
      (commit ? f.finalPages : f.cancelPages).forEach((p) => spread.appendChild(p));
      if (commit) pos = f.next;
      updateUI(); markWritten(); animating = false;
      if (commit && navigator.vibrate) { try { navigator.vibrate(6); } catch (e) { /* abaikan */ } }
    }
    function flip(next) {
      if (animating || next === pos || next < 0 || next >= view.length) return;
      if (reduceMotion) { pos = next; renderView(); return; }
      animating = true; if (pos === 0 && next > 0) { petalRain(12); dailyMessage(); }
      const f = buildFlip(next), from = f.fwd ? 0 : -180, to = f.fwd ? -180 : 0;
      book.classList.toggle("book--closed", next === 0); setEdges(next); pageSound(1);
      setLeaf(f, from, 0);
      tween(f, from, to, 1550, () => settle(f, true));
    }
    function turn(dir) { flip(pos + dir * perView); }
    function goTo(leafIdx) { flip(posFor(leafIdx)); }

    $("bookPrev").onclick = () => { stopAuto(); turn(-1); }; $("bookNext").onclick = () => { stopAuto(); turn(1); };

    // Geser halaman: halaman mengalir mengikuti jari dengan sedikit tertinggal (seperti kain), lepas dengan pegas lembut
    let drag = null, stickMode = false, stickEmoji = "", autoTimer = 0;
    book.addEventListener("pointerdown", (e) => {
      stopAuto(); if (stickMode || animating || e.button > 0) return;
      drag = { x0: e.clientX, id: e.pointerId, started: false, last: e.clientX, t: performance.now(), pv: 0, target: 0, cur: 0, vAng: 0 }; swiped = false;
    });
    book.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      if (!drag.started) {
        if (Math.abs(dx) < 10) return;
        const fwd = dx < 0, next = pos + (fwd ? perView : -perView);
        if (reduceMotion || next < 0 || next >= view.length) { drag = null; return; }
        drag.started = true; animating = true; drag.fwd = fwd; drag.next = next; drag.f = buildFlip(next);
        drag.range = (spread.clientWidth / perView) * 1.1; swiped = true; book.classList.add("is-dragging");
        drag.cur = drag.target = fwd ? 0 : -180;
        try { book.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
        const d = drag; setLeaf(d.f, d.cur, 0);
        (function glide() {
          if (drag !== d) return;
          const nx = d.cur + (d.target - d.cur) * .16; d.vAng = (nx - d.cur) * 60; d.cur = nx;
          setLeaf(d.f, d.cur, d.vAng); requestAnimationFrame(glide);
        })();
      }
      const now = performance.now(), inst = 180 * ((e.clientX - drag.last) / Math.max(1, now - drag.t)) * 1000 / drag.range;
      drag.pv = drag.pv * .6 + inst * .4; drag.last = e.clientX; drag.t = now;
      const p = Math.max(0, Math.min(1, (drag.fwd ? -dx : dx) / drag.range));
      drag.target = drag.fwd ? -180 * p : -180 * (1 - p);
    });
    const endDrag = () => {
      if (!drag) return; const d = drag; drag = null;
      if (!d.started) return;
      book.classList.remove("is-dragging");
      const prog = d.fwd ? -d.target / 180 : 1 + d.target / 180;
      const flick = d.fwd ? d.pv < -150 : d.pv > 150;
      const commit = prog > .3 || (flick && prog > .04);
      const target = commit ? (d.fwd ? -180 : 0) : (d.fwd ? 0 : -180);
      if (commit) { if (pos === 0 && d.next > 0) { petalRain(12); dailyMessage(); } book.classList.toggle("book--closed", d.next === 0); setEdges(d.next); pageSound(Math.min(1, .5 + Math.abs(d.pv) / 600)); }
      spring(d.f, d.cur, target, d.vAng, () => settle(d.f, commit));
      setTimeout(() => { swiped = false; }, 80);
    };
    book.addEventListener("pointerup", endDrag); book.addEventListener("pointercancel", endDrag);
    const sfx = $("sfxBtn");
    const paintSfx = () => { const on = store.get("sfx") !== "off"; $("sfxIcon").textContent = on ? "🔊" : "🔇"; sfx.setAttribute("aria-pressed", String(on)); };
    sfx.onclick = () => { store.set("sfx", store.get("sfx") === "off" ? "on" : "off"); paintSfx(); }; paintSfx();
    // ---- Mode cerita: balik halaman otomatis ----
    const autoBtn = $("autoBtn");
    function stopAuto() { if (!autoTimer) return; clearInterval(autoTimer); autoTimer = 0; autoBtn.textContent = "▶"; autoBtn.setAttribute("aria-pressed", "false"); }
    autoBtn.onclick = () => {
      if (autoTimer) { stopAuto(); return; }
      autoBtn.textContent = "❚❚"; autoBtn.setAttribute("aria-pressed", "true");
      const audio = $("audio"), pb = $("playBtn");
      if (audio && audio.paused && !$("player").hidden && store.get("music") !== "off") pb.click();
      autoTimer = setInterval(() => { if (animating) return; if (pos + perView >= view.length) { stopAuto(); return; } turn(1); }, 4600);
      if (!animating) turn(1);
    };

    // ---- Tempel stiker sendiri (tersimpan di browser) ----
    const tray = $("tray"), stickBtn = $("stickBtn"), trayRow = $("trayRow");
    ["🌷", "🌸", "🌹", "💐", "💗", "💞", "⭐", "✨", "🍓", "🍒", "🍰", "🧁", "🧸", "🐰", "🐱", "🐻", "🎀", "🌙", "☁️", "🌈", "🦋", "📸", "💌", "✏️"].forEach((em, k) => {
      const b = el("button", k === 0 ? "is-on" : "", em); b.type = "button"; b.setAttribute("aria-label", "Stiker " + em);
      b.addEventListener("click", () => { stickEmoji = em; trayRow.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === b)); });
      trayRow.appendChild(b);
    });
    stickEmoji = "🌷";
    function setStick(on) { stickMode = on; tray.hidden = !on; book.classList.toggle("is-stick", on); stickBtn.setAttribute("aria-pressed", String(on)); if (on) { stopAuto(); resetTilt(); } }
    stickBtn.onclick = () => setStick(!stickMode);
    $("trayDone").onclick = () => setStick(false);
    $("trayClear").onclick = () => {
      const data = readMine();
      Array.from(spread.children).forEach((pg) => { if (pg.dataset && pg.dataset.n) { delete data[pg.dataset.n]; pg.querySelectorAll(".mine").forEach((m) => m.remove()); } });
      store.set("stickers", JSON.stringify(data));
    };
    book.addEventListener("click", (e) => {
      if (!stickMode) return;
      e.stopPropagation(); e.preventDefault(); if (stickDragged) return;
      const pg = e.target.closest ? e.target.closest(".page") : null;
      if (!pg || !pg.dataset || !pg.dataset.n) return;
      const n = pg.dataset.n, data = readMine(), list = data[n] || [], mine = e.target.closest(".mine");
      if (mine) { const idx = Array.from(pg.querySelectorAll(".mine")).indexOf(mine); if (idx > -1) list.splice(idx, 1); mine.remove(); }
      else {
        const rect = pg.getBoundingClientRect();
        let label = stickEmoji;
        if (stickEmoji === "✏️") { const t = window.prompt("Tulis catatan kecil (maks. 40 huruf):"); if (!t) return; label = t.slice(0, 40); }
        const s = { e: label, note: stickEmoji === "✏️", x: +(((e.clientX - rect.left) / rect.width) * 100).toFixed(1), y: +(((e.clientY - rect.top) / rect.height) * 100).toFixed(1), r: Math.round(Math.random() * 36 - 18) };
        list.push(s); pg.appendChild(mineEl(s)); burst(e.clientX, e.clientY, [s.note ? "💗" : s.e, "✨"]); chime();
      }
      data[n] = list; store.set("stickers", JSON.stringify(data));
    }, true);

    // ---- Buku miring mengikuti kursor (desktop) ----
    const stage = document.querySelector(".stage");
    let tiltQueued = false, tiltX = 0, tiltY = 0;
    function applyTilt() { tiltQueued = false; spread.style.transform = "rotateX(" + tiltY.toFixed(2) + "deg) rotateY(" + tiltX.toFixed(2) + "deg)"; }
    function resetTilt() { tiltX = 0; tiltY = 0; applyTilt(); }
    if (stage && !reduceMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      stage.addEventListener("pointermove", (e) => {
        if (stickMode || drag) return;
        tiltX = (e.clientX / window.innerWidth - .5) * 7; tiltY = -(e.clientY / window.innerHeight - .5) * 5;
        if (!tiltQueued) { tiltQueued = true; requestAnimationFrame(applyTilt); }
      });
      stage.addEventListener("pointerleave", resetTilt);
    }
    // ---- Menu ajaib ----
    const menu = $("menu"), menuBtn = $("menuBtn");
    const showMenu = (on) => { menu.hidden = !on; menuBtn.setAttribute("aria-pressed", String(on)); };
    menuBtn.onclick = () => { const on = menu.hidden; if (on && stickMode) setStick(false); showMenu(on); };
    document.addEventListener("pointerdown", (e) => { if (!menu.hidden && menu.contains && !menu.contains(e.target) && e.target !== menuBtn) showMenu(false); });
    if (store.get("candle") === "on") { document.body.classList.add("candle"); $("mCandle").setAttribute("aria-pressed", "true"); }
    $("mCandle").onclick = () => { const on = document.body.classList.toggle("candle"); store.set("candle", on ? "on" : "off"); $("mCandle").setAttribute("aria-pressed", String(on)); };
    $("mPetal").onclick = () => { petalRain(34); chime([659, 988, 1319]); showMenu(false); };
    $("mRandom").onclick = () => {
      const pl = leaves.filter((l) => l.type === "photos");
      if (!pl.length) { toast("Belum ada foto untuk diacak"); return; }
      const cur = firstLeaf(), opts = pl.filter((l) => l.n !== cur && l.n !== cur + 1), arr = opts.length ? opts : pl;
      showMenu(false); stopAuto(); goTo(arr[Math.floor(Math.random() * arr.length)].n); chime([784, 1175]);
    };
    const papers = ["", "paper-1", "paper-2", "paper-3"]; let paperIdx = Math.max(0, +store.get("paper") || 0) % 4;
    const applyPaper = () => { papers.forEach((p) => { if (p) book.classList.remove(p); }); if (papers[paperIdx]) book.classList.add(papers[paperIdx]); };
    applyPaper();
    $("mPaper").onclick = () => { paperIdx = (paperIdx + 1) % 4; store.set("paper", String(paperIdx)); applyPaper(); toast(["Kertas krem", "Kertas blush", "Kertas lavender", "Kertas mint"][paperIdx]); };
    let sleepTimer = 0;
    $("mSleep").onclick = () => {
      const btn = $("mSleep");
      if (sleepTimer) { clearTimeout(sleepTimer); sleepTimer = 0; btn.setAttribute("aria-pressed", "false"); toast("Timer tidur dibatalkan"); return; }
      btn.setAttribute("aria-pressed", "true"); showMenu(false); toast("Musik akan memudar pelan dalam 10 menit 🌙");
      sleepTimer = setTimeout(() => {
        const a = $("audio"), iv = setInterval(() => {
          const nv = Math.max(0, a.volume - .04); a.volume = nv;
          if (nv <= 0 || a.volume > nv + .001) { clearInterval(iv); a.pause(); a.volume = 1; $("player").classList.remove("is-playing"); $("playBtn").textContent = "▶"; toast("Selamat tidur 🌙 Mimpi indah"); sleepTimer = 0; btn.setAttribute("aria-pressed", "false"); }
        }, 400);
      }, 600000);
    };
    $("mFull").onclick = () => {
      try { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); else toast("Layar penuh tidak didukung di perangkat ini"); }
      catch (e) { toast("Layar penuh tidak didukung di perangkat ini"); }
      showMenu(false);
    };
    // ---- Fitur lucu tambahan ----
    let stickDragged = false, mdrag = null;
    book.addEventListener("pointerdown", (e) => {
      if (!stickMode) return; const m = e.target.closest ? e.target.closest(".mine") : null; if (!m) return;
      const pg = m.closest(".page"); if (!pg) return;
      mdrag = { m, pg, id: e.pointerId, moved: false, x0: e.clientX, y0: e.clientY, idx: Array.from(pg.querySelectorAll(".mine")).indexOf(m) };
      try { m.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
    });
    book.addEventListener("pointermove", (e) => {
      if (!mdrag || e.pointerId !== mdrag.id) return;
      if (!mdrag.moved && Math.hypot(e.clientX - mdrag.x0, e.clientY - mdrag.y0) < 6) return;
      mdrag.moved = true; const rect = mdrag.pg.getBoundingClientRect();
      mdrag.m.style.left = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)).toFixed(1) + "%";
      mdrag.m.style.top = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)).toFixed(1) + "%";
    });
    book.addEventListener("pointerup", () => {
      if (!mdrag) return; const d = mdrag; mdrag = null; if (!d.moved) return;
      stickDragged = true; setTimeout(() => { stickDragged = false; }, 120);
      const data = readMine(), n = d.pg.dataset.n, list = data[n] || [];
      if (list[d.idx]) { list[d.idx].x = parseFloat(d.m.style.left); list[d.idx].y = parseFloat(d.m.style.top); data[n] = list; store.set("stickers", JSON.stringify(data)); }
    });

    // Jejak kilau kursor
    let sparkleOn = store.get("sparkle") !== "off", lastSp = 0;
    document.addEventListener("pointermove", (e) => {
      if (!sparkleOn || reduceMotion || e.pointerType !== "mouse" || drag || !document.body.animate) return;
      const now = performance.now(); if (now - lastSp < 55) return; lastSp = now;
      const s = el("span", "sp", ["✦", "✧", "·"][Math.floor(Math.random() * 3)]); s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px"; document.body.appendChild(s);
      s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: .9 }, { transform: "translate(calc(-50% + " + (Math.random() * 16 - 8) + "px), calc(-50% + 18px)) scale(.3)", opacity: 0 }], { duration: 700 }).onfinish = () => s.remove();
    });
    $("mSparkle").setAttribute("aria-pressed", String(sparkleOn));
    $("mSparkle").onclick = () => { sparkleOn = !sparkleOn; store.set("sparkle", sparkleOn ? "on" : "off"); $("mSparkle").setAttribute("aria-pressed", String(sparkleOn)); };

    // Balon hati
    $("mBalloon").onclick = () => {
      showMenu(false);
      if (reduceMotion || !document.body.animate) { toast("Balon tidak tersedia saat gerak dikurangi"); return; }
      for (let k = 0; k < 10; k++) {
        const b = el("button", "balloon", ["🎈", "💗", "🎈", "🩷"][k % 4]); b.type = "button"; b.setAttribute("aria-label", "Balon");
        b.style.left = 6 + Math.random() * 88 + "vw"; b.style.fontSize = 30 + Math.random() * 18 + "px"; document.body.appendChild(b);
        const a = b.animate([{ transform: "translateY(0)" }, { transform: "translateY(-118vh) translateX(" + (Math.random() * 60 - 30) + "px)" }], { duration: 7000 + Math.random() * 4000, delay: k * 350, easing: "ease-in", fill: "backwards" });
        a.onfinish = () => b.remove();
        b.addEventListener("click", (e) => {
          burst(e.clientX, e.clientY, ["💥", "✨", "💗"]); chime([880, 1047]); a.cancel(); b.remove();
          const total = (+store.get("popped") || 0) + 1; store.set("popped", String(total)); if (total % 10 === 0) toast("Sudah " + total + " balon pecah 🎈");
        });
      }
    };

    // Suara hujan yang menenangkan
    let rainNode = null;
    $("mRain").onclick = () => {
      const btn = $("mRain");
      if (rainNode) { const rn = rainNode; rainNode = null; rn.g.gain.setTargetAtTime(0, audioCtx.currentTime, .4); setTimeout(() => { try { rn.src.stop(); } catch (e) { /* abaikan */ } }, 1800); btn.setAttribute("aria-pressed", "false"); return; }
      try { rainNode = startRain(); } catch (e) { rainNode = null; }
      if (rainNode) btn.setAttribute("aria-pressed", "true"); else toast("Suara hujan tidak didukung di perangkat ini");
    };

    // Penanda halaman & foto favorit
    function readMarks() { try { return JSON.parse(store.get("marks") || "[]") || []; } catch (e) { return []; } }
    function refreshMarks() { const m = readMarks(); Array.from(spread.children).forEach((p) => { if (p.dataset && p.dataset.n && !p.dataset.keep) p.classList.toggle("page--ribbon", m.indexOf(+p.dataset.n) !== -1); }); }
    $("mMark").onclick = () => {
      const n = firstLeaf(); if (n < 1) { toast("Buka bukunya dulu ya 💗"); return; }
      const m = readMarks(), i = m.indexOf(n); if (i === -1) m.push(n); else m.splice(i, 1);
      store.set("marks", JSON.stringify(m)); showMenu(false); refreshMarks(); chime();
      toast(i === -1 ? "Halaman " + n + " ditandai 🔖" : "Penanda dilepas");
    };
    $("mGoMark").onclick = () => {
      const m = readMarks().sort((a, b) => a - b); if (!m.length) { toast("Belum ada penanda halaman"); return; }
      const cur = firstLeaf(), nxt = m.find((x) => x > cur); showMenu(false); stopAuto(); goTo(nxt === undefined ? m[0] : nxt);
    };
    let favIdx = 0;
    $("mFav").onclick = () => {
      const fav = readFavs(), pl = leaves.filter((l) => l.type === "photos" && l.ids.some((id) => fav.indexOf(photos[id].image) !== -1));
      if (!pl.length) { toast("Belum ada foto favorit. Ketuk ♡ di foto ya"); return; }
      showMenu(false); stopAuto(); goTo(pl[favIdx++ % pl.length].n);
    };
    const chip = $("chip"); if (chip) chip.textContent = "💝 " + nextSpecialText();
    window.BookAPI = { cfg, photos, leaves, goTo, turn, firstLeaf, stopAuto, burst, toast, chime, petalRain, store, el, reduceMotion, openLightbox, readFavs, readMine, MONTHS };

    document.addEventListener("keydown", (e) => {
      if (!$("lightbox").hidden) return;
      if (e.key === "ArrowRight") { stopAuto(); turn(1); } else if (e.key === "ArrowLeft") { stopAuto(); turn(-1); }
    });
    const onLayoutChange = () => { if (animating) return; const keep = firstLeaf(); layout(keep); renderView(); };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener("change", onLayoutChange); else if (desktopMQ.addListener) desktopMQ.addListener(onLayoutChange);
    const savedPage = +store.get("page") || 0;
    loadDims(); layout(0); renderView(); setInterval(updateCounter, 1000);
    if (savedPage > 1) toast("Lanjutkan membaca dari halaman " + savedPage + "?", "Lanjutkan", () => goTo(savedPage));
  }

  /* ===== Musik ===== */
  function initializeMusicPlayer() {
    const list = (cfg.playlist && cfg.playlist.length) ? cfg.playlist : (cfg.music && cfg.music.src ? [cfg.music] : []);
    if (!list.length) return;
    const audio = $("audio"), player = $("player"), btn = $("playBtn"), nextBtn = $("nextBtn");
    let idx = 0, failed = 0;
    const set = (on) => { player.classList.toggle("is-playing", on); btn.textContent = on ? "❚❚" : "▶"; btn.setAttribute("aria-label", on ? "Jeda musik" : "Putar musik"); };
    const load = (i) => { idx = (i + list.length) % list.length; audio.src = list[idx].src; $("songTitle").textContent = list[idx].title || "Musik"; $("progress").style.width = "0"; };
    const play = () => audio.play().then(() => { set(true); store.set("music", "on"); }).catch(() => set(false));
    audio.loop = list.length === 1; nextBtn.hidden = list.length < 2;
    load(0); player.hidden = false;
    audio.addEventListener("canplay", () => { failed = 0; });
    audio.addEventListener("error", () => { failed++; if (failed >= list.length) { player.hidden = true; return; } const was = !audio.paused || player.classList.contains("is-playing"); load(idx + 1); if (was) play(); });
    audio.addEventListener("ended", () => { load(idx + 1); play(); });
    audio.addEventListener("timeupdate", () => { if (audio.duration) $("progress").style.width = (audio.currentTime / audio.duration * 100) + "%"; });
    btn.onclick = () => { if (audio.paused) play(); else { audio.pause(); set(false); store.set("music", "off"); } };
    nextBtn.onclick = () => { const was = !audio.paused; load(idx + 1); if (was) play(); };
    if (store.get("music") !== "off") play();
  }

  function init() {
    if (!cfg) { console.error("config.js tidak ditemukan"); return; }
    $("brand").textContent = cfg.couple.short1 + " & " + cfg.couple.short2;
    [initializeLightbox, initializeBook, initializeMusicPlayer, scheduleSky].forEach(safe);
    let taps = 0, tapT = 0;
    $("brand").addEventListener("click", () => {
      taps++; clearTimeout(tapT); tapT = setTimeout(() => { taps = 0; }, 1600);
      if (taps >= 5) { taps = 0; store.set("egg", "1"); petalRain(40); chime([523, 659, 784, 1047]); toast("Kamu menemukan rahasia kecil 💗"); }
    });
    const cat = $("cat");
    if (cat) cat.addEventListener("click", (e) => { burst(e.clientX, e.clientY, ["🐟", "💗", "✨"]); chime([523, 659]); });
    const desk = document.querySelector(".desk");
    if (desk && !reduceMotion) {
      const dust = el("div", "dust");
      for (let k = 0; k < 14; k++) {
        const i = el("i"); i.style.left = Math.random() * 100 + "%"; i.style.top = 40 + Math.random() * 60 + "%";
        i.style.setProperty("--d", 12 + Math.random() * 10 + "s"); i.style.setProperty("--dx", Math.random() * 60 - 30 + "px"); i.style.animationDelay = -Math.random() * 20 + "s";
        dust.appendChild(i);
      }
      for (let k = 0; k < 6; k++) {
        const b = el("i", "bokeh"), sz = 120 + Math.random() * 160; b.style.width = b.style.height = sz + "px"; b.style.left = Math.random() * 90 + "%"; b.style.top = Math.random() * 90 + "%";
        b.style.setProperty("--d", 18 + Math.random() * 14 + "s"); b.style.setProperty("--bx", Math.random() * 80 - 40 + "px"); b.style.setProperty("--by", Math.random() * 80 - 40 + "px"); dust.appendChild(b);
      }
      desk.appendChild(dust);
    }
    const stage = document.querySelector(".stage");
    if (stage) stage.addEventListener("pointerdown", (e) => { if (e.target === stage) burst(e.clientX, e.clientY, ["✨", "🌸", "💗"]); });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
