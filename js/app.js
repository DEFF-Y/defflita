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

  function renderStaticContent() {
    const c = cfg.couple, r = cfg.relationship, fd = r.firstDate;
    const start = new Date(r.startDate + "T00:00:00");
    $("heroName1").textContent = c.short1; $("heroName2").textContent = c.short2;
    $("heroDate").textContent = longDate(start).toUpperCase();
    $("heroPhrase").textContent = cfg.hero.phrase;
    $("counterSince").textContent = "Sejak " + longDate(start);
    $("placeName").textContent = r.meaningfulPlace; $("placeText").textContent = r.placeText;
    $("bigDate").textContent = fd.day; $("bigDate").appendChild(el("small", "", fd.month + " " + fd.year));
    $("dateCaption").textContent = fd.caption;
    fillFrame($("placeFrame"), cfg.photos.place, r.meaningfulPlace, "Foto tempat ini belum ditambahkan.");
    fillFrame($("dateFrame"), cfg.photos.firstDate, "First date", "Foto first date belum ditambahkan.");
    const list = $("detailList");
    [["Ulang tahun " + c.short1, cfg.birthdays.person1], ["Ulang tahun " + c.short2, cfg.birthdays.person2], ["Anniversary", r.anniversary.label]].forEach(([t, d]) => {
      const row = el("div"); row.append(el("dt", "", t), el("dd", "", d)); list.appendChild(row);
    });
    const end = $("endingText"); end.innerHTML = "";
    cfg.ending.forEach((line, i) => { end.append(document.createTextNode(line)); if (i < cfg.ending.length - 1) end.append(document.createElement("br")); });
    $("footer").textContent = c.person1 + " & " + c.person2 + " · sejak " + start.getFullYear();
    if (cfg.hero.image) { const probe = new Image(); probe.onload = () => { $("heroBg").style.backgroundImage = "url('" + cfg.hero.image + "')"; }; probe.src = cfg.hero.image; }
  }

  function fillFrame(frame, src, alt, emptyText) {
    frame.innerHTML = "";
    if (!src) { frame.appendChild(el("em", "", emptyText)); return; }
    const img = new Image(); img.alt = alt; img.loading = "lazy"; img.decoding = "async";
    img.onerror = () => { frame.innerHTML = ""; frame.appendChild(el("em", "", emptyText)); };
    img.src = src; frame.appendChild(img);
  }

  function renderTimeline() {
    const ol = $("timelineList");
    (cfg.timeline || []).forEach((item) => {
      const li = el("li"); li.append(el("time", "", item.date), el("h3", "", item.title));
      if (item.text) li.appendChild(el("p", "", item.text)); ol.appendChild(li);
    });
  }

  function updateRelationshipCounter() {
    const start = new Date(cfg.relationship.startDate + "T00:00:00"), now = new Date();
    const totalDays = Math.floor((now - start) / 864e5);
    let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    let anchor = new Date(start); anchor.setMonth(start.getMonth() + months);
    if (anchor > now) { months--; anchor = new Date(start); anchor.setMonth(start.getMonth() + months); }
    const days = Math.floor((now - anchor) / 864e5), rest = (now - anchor) % 864e5;
    const parts = [[totalDays, "Hari bersama"], [months, "Bulan"], [days, "Hari"], [Math.floor(rest / 36e5), "Jam"], [Math.floor(rest / 6e4) % 60, "Menit"], [Math.floor(rest / 1e3) % 60, "Detik"]];
    const box = $("counter");
    if (!box.children.length) parts.forEach(() => { const d = el("div"); d.append(el("b"), el("span")); box.appendChild(d); });
    parts.forEach(([v, l], i) => { box.children[i].children[0].textContent = v; box.children[i].children[1].textContent = l; });
  }
  function initializeCounter() { updateRelationshipCounter(); setInterval(updateRelationshipCounter, 1000); }

  const photos = (typeof galleryData !== "undefined" ? galleryData : []).filter((p) => p && p.image);
  let current = 0, lastFocus = null;
  function renderGallery() {
    const track = $("stripTrack"); track.innerHTML = "";
    if (!photos.length) { track.appendChild(el("p", "moments__empty", "Foto pertama akan muncul di sini. Tambahkan datanya di js/gallery.js.")); $("momentsCtl").hidden = true; return; }
    photos.forEach((p, i) => {
      const b = el("button", "moment" + (p.featured ? " moment--featured" : "")); b.type = "button";
      b.setAttribute("aria-label", "Buka foto: " + (p.title || "Momen " + (i + 1)));
      const frame = el("span", "moment__img"), img = new Image();
      img.alt = p.title || p.caption || "Foto kenangan"; img.loading = i < 3 ? "eager" : "lazy"; img.decoding = "async";
      img.onerror = () => b.classList.add("is-broken"); img.src = p.image; frame.appendChild(img);
      const cap = el("span", "moment__cap"); cap.appendChild(el("small", "", String(i + 1).padStart(2, "0")));
      if (p.title) cap.appendChild(el("strong", "", p.title));
      const meta = [p.date, p.location].filter(Boolean).join(" · "); if (meta) cap.appendChild(el("em", "", meta));
      b.append(frame, cap);
      b.addEventListener("click", () => { if (!track.dataset.moved) openLightbox(i); });
      track.appendChild(b);
    });
    let down = false, startX = 0, startLeft = 0;
    track.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; startX = e.clientX; startLeft = track.scrollLeft; delete track.dataset.moved; });
    window.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - startX; if (Math.abs(dx) > 5) { track.classList.add("is-dragging"); track.dataset.moved = "1"; } track.scrollLeft = startLeft - dx; });
    window.addEventListener("pointerup", () => { if (!down) return; down = false; track.classList.remove("is-dragging"); setTimeout(() => delete track.dataset.moved, 0); });
    const step = (dir) => track.scrollBy({ left: dir * track.clientWidth * .8, behavior: reduceMotion ? "auto" : "smooth" });
    $("stripPrev").onclick = () => step(-1); $("stripNext").onclick = () => step(1);
    const bar = $("stripProgress");
    const update = () => { const max = track.scrollWidth - track.clientWidth; bar.style.width = (max > 0 ? Math.max(8, track.scrollLeft / max * 100) : 100) + "%"; };
    track.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); update();
  }
  function showPhoto(i) {
    current = (i + photos.length) % photos.length; const p = photos[current];
    const img = $("lbImg"); img.src = p.image; img.alt = p.title || "Foto kenangan";
    const m = $("lbMeta"); m.innerHTML = "";
    if (p.title) m.appendChild(el("h3", "", p.title));
    const info = [p.date, p.location].filter(Boolean).join(" — "); if (info) m.appendChild(el("small", "", info));
    if (p.caption) m.appendChild(el("p", "", p.caption)); if (p.story) m.appendChild(el("p", "story", p.story));
    m.appendChild(el("small", "", String(current + 1).padStart(2, "0") + " / " + String(photos.length).padStart(2, "0")));
  }
  function openLightbox(i) { lastFocus = document.activeElement; const lb = $("lightbox"); lb.hidden = false; showPhoto(i); requestAnimationFrame(() => lb.classList.add("is-open")); document.body.style.overflow = "hidden"; $("lbClose").focus(); }
  function closeLightbox() { const lb = $("lightbox"); lb.classList.remove("is-open"); setTimeout(() => { lb.hidden = true; }, 300); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  function initializeLightbox() {
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

  function initializeQuotes() {
    const list = (typeof quotes !== "undefined" && quotes.length) ? quotes : ["Cerita kita masih terus ditulis."];
    const q = $("quoteText"); let i = 0; q.textContent = list[0];
    const next = () => { q.parentElement.classList.add("is-fading"); setTimeout(() => { i = (i + 1) % list.length; q.textContent = list[i]; q.parentElement.classList.remove("is-fading"); }, 500); };
    $("quoteBtn").onclick = next; if (list.length < 2) $("quoteBtn").hidden = true; else setInterval(next, 12000);
  }

  function initializeNavigation() {
    const nav = $("nav"), links = $("navLinks");
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    $("menuBtn").onclick = () => { const open = links.classList.toggle("is-open"); $("menuBtn").setAttribute("aria-expanded", open); };
    links.addEventListener("click", (e) => { if (e.target.tagName === "A") { links.classList.remove("is-open"); $("menuBtn").setAttribute("aria-expanded", "false"); } });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) links.querySelectorAll("a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
      links.querySelectorAll("a").forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
    }
  }

  function initializeReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) { items.forEach((n) => n.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } }), { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    items.forEach((n) => io.observe(n));
  }
  function initializeHeroParallax() {
    if (reduceMotion) return; const bg = $("heroBg"), hero = $("home");
    window.addEventListener("scroll", () => { if (window.scrollY < innerHeight) bg.style.transform = "translate3d(0," + window.scrollY * .15 + "px,0)"; }, { passive: true });
    if (window.matchMedia("(hover:hover)").matches) hero.addEventListener("mousemove", (e) => {
      const x = (e.clientX / innerWidth - .5) * -14, y = (e.clientY / innerHeight - .5) * -14; bg.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(1.03)";
    });
  }

  function initializeMusicPlayer() {
    const audio = $("audio"), player = $("player"), btn = $("playBtn");
    if (!cfg.music || !cfg.music.src) return;
    audio.src = cfg.music.src; $("songTitle").textContent = cfg.music.title || "Musik";
    audio.addEventListener("error", () => { player.hidden = true; }, { once: true });
    player.hidden = false;
    const set = (on) => { player.classList.toggle("is-playing", on); btn.textContent = on ? "❚❚" : "▶"; btn.setAttribute("aria-label", on ? "Jeda musik" : "Putar musik"); };
    const play = () => audio.play().then(() => { set(true); store.set("music", "on"); }).catch(() => set(false));
    btn.onclick = () => { if (audio.paused) play(); else { audio.pause(); set(false); store.set("music", "off"); } };
    audio.addEventListener("timeupdate", () => { if (audio.duration) $("progress").style.width = (audio.currentTime / audio.duration * 100) + "%"; });
    if (store.get("music") !== "off") { audio.load(); play(); }
  }


  function initializeAnniversary() {
    const a = cfg.relationship.anniversary, now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let next = new Date(now.getFullYear(), a.month - 1, a.day);
    if (next < today) next = new Date(now.getFullYear() + 1, a.month - 1, a.day);
    const left = Math.round((next - today) / 864e5);
    const monthName = next.toLocaleDateString("id-ID", { month: "long" });
    $("annivDate").textContent = a.day + " " + monthName;
    $("annivNote").textContent = left === 0 ? "Hari ini hari jadi kita." : left + " hari lagi menuju hari jadi kita berikutnya.";
    $("anniversary").classList.toggle("is-near", left <= 14);
  }

  function initializeCursor() {
    const cur = $("cursor");
    if (reduceMotion || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.body.classList.add("has-cursor");
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add("is-on"); });
    document.addEventListener("mouseleave", () => cur.classList.remove("is-on"));
    document.addEventListener("mouseover", (e) => cur.classList.toggle("is-big", !!e.target.closest(".moment__img")));
    (function loop() { x += (tx - x) * .22; y += (ty - y) * .22; cur.style.transform = "translate3d(" + x + "px," + y + "px,0)"; requestAnimationFrame(loop); })();
  }

  function init() {
    document.documentElement.classList.add("js");
    if (!cfg) { console.error("config.js tidak ditemukan"); return; }
    [renderStaticContent, renderTimeline, initializeCounter, renderGallery, initializeLightbox, initializeQuotes, initializeNavigation, initializeReveal, initializeHeroParallax, initializeAnniversary, initializeCursor, initializeMusicPlayer].forEach(safe);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
