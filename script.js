/* ============================================================
   Nam Cao — homepage interactions (kept minimal)
   1. Dark-mode toggle (persisted)   2. Active section in nav
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Follow OS theme only while the user hasn't chosen explicitly.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    var saved;
    try { saved = localStorage.getItem("theme"); } catch (err) {}
    if (!saved) root.setAttribute("data-theme", e.matches ? "dark" : "light");
  });

  /* ---------- Active section in nav ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Figure lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbClose = document.getElementById("lightboxClose");

  function openLB(src, alt) {
    if (!lb) return;
    lbImg.src = src;
    lbImg.alt = alt || "";
    lb.hidden = false;
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLB() {
    if (!lb) return;
    lb.hidden = true;
    lb.setAttribute("aria-hidden", "true");
    lbImg.src = "";
    document.body.style.overflow = "";
  }

  Array.prototype.slice.call(document.querySelectorAll("a.zoom")).forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var img = a.querySelector("img");
      openLB(a.getAttribute("href"), img ? img.alt : "");
    });
  });
  if (lbClose) lbClose.addEventListener("click", closeLB);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lb && !lb.hidden) closeLB();
  });
})();
