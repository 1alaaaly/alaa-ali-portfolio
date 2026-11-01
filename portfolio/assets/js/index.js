/* ==========================================================
   Portfolio — الاء علي
   1. Scroll-spy (active nav link)   5. Settings sidebar (theme colors + fonts)
   2. Dark / Light mode              6. Scroll-to-top button
   3. Portfolio filter tabs          7. Mobile menu
   4. Testimonials carousel
   ========================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const html = document.documentElement;

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  remove: (k) => { try { localStorage.removeItem(k); } catch (e) {} },
};

/* ---------- 1. Scroll-spy: active link follows the visible section ---------- */
const navLinks = $$(".nav-links a[href^='#']");
const spySections = navLinks
  .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
  .filter(Boolean);

function updateScrollSpy() {
  const pos = window.scrollY + 160; // offset for the fixed navbar
  let current = spySections[0];
  spySections.forEach((sec) => { if (pos >= sec.offsetTop) current = sec; });
  // bottom of the page -> last section
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
    current = spySections[spySections.length - 1];
  }
  navLinks.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === `#${current.id}`);
  });
}

/* ---------- 2. Dark / Light mode (class `dark` on <html>) ---------- */
const themeBtn = $("#theme-toggle-button");

function setMode(dark, save = true) {
  html.classList.toggle("dark", dark);
  themeBtn.setAttribute("aria-pressed", String(dark));
  if (save) store.set("mode", dark ? "dark" : "light");
}
themeBtn.addEventListener("click", () => setMode(!html.classList.contains("dark")));
const savedMode = store.get("mode");
setMode(savedMode ? savedMode === "dark" : html.classList.contains("dark"), false);

/* ---------- 3. Portfolio tabs / filter ---------- */
const filterBtns = $$(".portfolio-filter");
const items = $$(".portfolio-item");
const ON = ["bg-linear-to-r", "from-primary", "to-secondary", "text-white", "active"];
const OFF = [
  "bg-white", "dark:bg-slate-800", "text-slate-600", "dark:text-slate-300",
  "hover:bg-slate-100", "dark:hover:bg-slate-700", "border", "border-slate-300", "dark:border-slate-700",
];

function setFilter(btn) {
  filterBtns.forEach((b) => {
    const on = b === btn;
    b.classList.remove(...(on ? OFF : ON));
    b.classList.add(...(on ? ON : OFF));
    b.setAttribute("aria-pressed", String(on));
  });
  const filter = btn.dataset.filter;
  items.forEach((item) => {
    const cats = (item.dataset.category || "").split(/\s+/);
    const show = filter === "all" || cats.includes(filter);
    item.classList.toggle("hidden", !show);
    if (show) { // small fade-in
      item.style.opacity = "0";
      item.style.transform = "translateY(12px)";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        item.style.transition = "opacity .4s ease, transform .4s ease";
        item.style.opacity = "1";
        item.style.transform = "none";
      }));
    }
  });
}
filterBtns.forEach((b) => b.addEventListener("click", () => setFilter(b)));

/* ---------- 4. Testimonials carousel ---------- */
const track = $("#testimonials-carousel");
const cards = $$(".testimonial-card", track);
const indicatorsBox = $(".carousel-indicator").parentElement;
const nextBtn = $("#next-testimonial");
const prevBtn = $("#prev-testimonial");
const IND_BASE = "carousel-indicator w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 cursor-pointer";

let current = 0;
let autoTimer = null;
// RTL: later cards sit on the left, so the track moves to the right (+)
const DIR = getComputedStyle(html).direction === "rtl" ? 1 : -1;

const perView = () => (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
const maxIndex = () => Math.max(0, cards.length - perView());

function buildIndicators() {
  indicatorsBox.innerHTML = "";
  for (let i = 0; i <= maxIndex(); i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.dataset.index = i;
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `التوصية ${i + 1}`);
    dot.addEventListener("click", () => { goTo(i); restartAuto(); });
    indicatorsBox.appendChild(dot);
  }
}
function goTo(i) {
  const max = maxIndex();
  current = i > max ? 0 : i < 0 ? max : i; // loop at both ends
  track.style.transform = `translateX(${DIR * current * (100 / perView())}%)`;
  $$(".carousel-indicator, [data-index]", indicatorsBox).forEach((dot) => {
    const on = Number(dot.dataset.index) === current;
    dot.className = `${IND_BASE} ${on ? "bg-accent" : "bg-slate-400 dark:bg-slate-600"}`;
    dot.setAttribute("aria-selected", String(on));
  });
}
const startAuto = () => { stopAuto(); autoTimer = setInterval(() => goTo(current + 1), 5000); };
const stopAuto = () => clearInterval(autoTimer);
const restartAuto = () => { stopAuto(); startAuto(); };

nextBtn.addEventListener("click", () => { goTo(current + 1); restartAuto(); });
prevBtn.addEventListener("click", () => { goTo(current - 1); restartAuto(); });
const carouselWrap = track.parentElement.parentElement;
carouselWrap.addEventListener("mouseenter", stopAuto);
carouselWrap.addEventListener("mouseleave", startAuto);

// touch swipe
let touchX = 0;
track.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; stopAuto(); }, { passive: true });
track.addEventListener("touchend", (e) => {
  const diff = e.changedTouches[0].clientX - touchX;
  if (Math.abs(diff) > 50) goTo(current + (diff * DIR > 0 ? 1 : -1));
  startAuto();
});

let lastPer = perView();
window.addEventListener("resize", () => {
  if (perView() !== lastPer) { lastPer = perView(); buildIndicators(); }
  goTo(Math.min(current, maxIndex()));
});
buildIndicators();
goTo(0);
startAuto();

/* ---------- 5. Settings sidebar: theme colors + fonts ---------- */
const sidebar = $("#settings-sidebar");
const settingsBtn = $("#settings-toggle");
const closeBtn = $("#close-settings");

// dim overlay behind the sidebar
const overlay = document.createElement("div");
overlay.style.cssText =
  "position:fixed;inset:0;z-index:55;background:rgba(2,6,24,.6);opacity:0;visibility:hidden;transition:opacity .3s";
document.body.appendChild(overlay);

function openSettings() {
  sidebar.classList.remove("translate-x-full");
  sidebar.setAttribute("aria-hidden", "false");
  settingsBtn.setAttribute("aria-expanded", "true");
  overlay.style.opacity = "1";
  overlay.style.visibility = "visible";
}
function closeSettings() {
  sidebar.classList.add("translate-x-full");
  sidebar.setAttribute("aria-hidden", "true");
  settingsBtn.setAttribute("aria-expanded", "false");
  overlay.style.opacity = "0";
  overlay.style.visibility = "hidden";
}
settingsBtn.addEventListener("click", () =>
  sidebar.classList.contains("translate-x-full") ? openSettings() : closeSettings()
);
closeBtn.addEventListener("click", closeSettings);
overlay.addEventListener("click", closeSettings);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSettings(); });

/* theme colors */
const PALETTES = [
  { name: "بنفسجي", primary: "#6366f1", secondary: "#8b5cf6", accent: "#a855f7" },
  { name: "أزرق", primary: "#3b82f6", secondary: "#06b6d4", accent: "#8b5cf6" },
  { name: "أخضر", primary: "#10b981", secondary: "#14b8a6", accent: "#3b82f6" },
  { name: "وردي", primary: "#f43f5e", secondary: "#fb7185", accent: "#f59e0b" },
  { name: "برتقالي", primary: "#f59e0b", secondary: "#f97316", accent: "#ef4444" },
  { name: "تركواز", primary: "#14b8a6", secondary: "#06b6d4", accent: "#6366f1" },
  { name: "أرجواني", primary: "#a855f7", secondary: "#d946ef", accent: "#6366f1" },
  { name: "أحمر", primary: "#ef4444", secondary: "#f97316", accent: "#ec4899" },
];
const colorsGrid = $("#theme-colors-grid");

PALETTES.forEach((p, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.index = i;
  b.setAttribute("aria-label", `لون ${p.name}`);
  b.title = p.name;
  b.className = "color-option relative w-full aspect-square rounded-xl transition-all duration-300 hover:scale-110 flex items-center justify-center";
  b.style.background = `linear-gradient(135deg, ${p.primary}, ${p.secondary})`;
  b.innerHTML = '<i class="fa-solid fa-check text-white" style="opacity:0;transition:opacity .2s" aria-hidden="true"></i>';
  b.addEventListener("click", () => applyPalette(i));
  colorsGrid.appendChild(b);
});

function applyPalette(i, save = true) {
  const p = PALETTES[i];
  html.style.setProperty("--color-primary", p.primary);
  html.style.setProperty("--color-secondary", p.secondary);
  html.style.setProperty("--color-accent", p.accent);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", p.primary);
  $$(".color-option", colorsGrid).forEach((b) => {
    const on = Number(b.dataset.index) === i;
    b.style.boxShadow = on ? `0 0 0 3px var(--color-primary)` : "none";
    b.style.outline = on ? "2px solid #fff" : "none";
    b.style.outlineOffset = "-5px";
    b.firstElementChild.style.opacity = on ? "1" : "0";
    b.setAttribute("aria-pressed", String(on));
  });
  if (save) store.set("palette", String(i));
}

/* fonts */
const FONTS = ["alexandria", "tajawal", "cairo"];
const fontBtns = $$(".font-option");

function applyFont(name, save = true) {
  document.body.classList.remove(...FONTS.map((f) => `font-${f}`));
  document.body.classList.add(`font-${name}`);
  fontBtns.forEach((b) => {
    const on = b.dataset.font === name;
    b.classList.toggle("active", on);
    b.classList.toggle("border-primary", on);
    b.setAttribute("aria-checked", String(on));
  });
  if (save) store.set("font", name);
}
fontBtns.forEach((b) => b.addEventListener("click", () => applyFont(b.dataset.font)));

/* reset */
$("#reset-settings").addEventListener("click", () => {
  ["palette", "font", "mode"].forEach(store.remove);
  ["--color-primary", "--color-secondary", "--color-accent"].forEach((v) => html.style.removeProperty(v));
  applyPalette(0, false);
  applyFont("tajawal", false);
  setMode(true, false); // the design's default is dark
});

// restore saved choices
const savedPalette = Number(store.get("palette"));
applyPalette(Number.isInteger(savedPalette) && PALETTES[savedPalette] ? savedPalette : 0, false);
const savedFont = store.get("font");
applyFont(FONTS.includes(savedFont) ? savedFont : "tajawal", false);

/* ---------- 6. Scroll to top ---------- */
const topBtn = $("#scroll-to-top");
function toggleTopBtn() {
  const show = window.scrollY > 400;
  topBtn.classList.toggle("opacity-0", !show);
  topBtn.classList.toggle("invisible", !show);
  topBtn.classList.toggle("opacity-100", show);
  topBtn.classList.toggle("visible", show);
}
topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- 7. Mobile menu ---------- */
const menuBtn = $("#mobile-menu-btn");
const menu = $(".nav-links");
function setMenu(open) {
  menu.classList.toggle("active", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.firstElementChild.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}
menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("active")));
navLinks.forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------- shared scroll handler ---------- */
let ticking = false;
function onScroll() { updateScrollSpy(); toggleTopBtn(); }
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
});
onScroll();
