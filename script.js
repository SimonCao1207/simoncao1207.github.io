/* ============================================================
   Nam Cao — homepage interactions (kept minimal)
   1. Dark-mode toggle (persisted)   2. Active section in nav
   3. Figure lightbox (shared with the blog)
   4. Recent-posts teaser on the homepage
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");

  function setTheme(next) {
    root.setAttribute("data-theme", next);
    // Mermaid bakes its colours into the SVG, so the blog listens for this.
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Follow OS theme only while the user hasn't chosen explicitly.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    var saved;
    try { saved = localStorage.getItem("theme"); } catch (err) {}
    if (!saved) setTheme(e.matches ? "dark" : "light");
  });

  /* ---------- Active section in nav ---------- */
  // Only same-page anchors take part; cross-page links (Blog) are skipped.
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
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

  // Exposed so blog.js can wire up figures it renders after page load.
  function bindZoom(scope) {
    var host = scope || document;
    Array.prototype.slice.call(host.querySelectorAll("a.zoom")).forEach(function (a) {
      if (a.getAttribute("data-zoom-bound")) return;
      a.setAttribute("data-zoom-bound", "1");
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var img = a.querySelector("img");
        openLB(a.getAttribute("href"), img ? img.alt : "");
      });
    });
  }

  bindZoom(document);
  window.Site = { bindZoom: bindZoom, openLightbox: openLB, closeLightbox: closeLB };

  if (lbClose) lbClose.addEventListener("click", closeLB);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lb && !lb.hidden) closeLB();
  });

  /* ---------- Recent posts (homepage teaser) ---------- */
  var recent = document.getElementById("recentPosts");
  if (recent) {
    var section = document.getElementById("blog");
    fetch("blog/posts.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) {
        var posts = (data.posts || [])
          .filter(function (p) { return p && p.slug && !p.draft; })
          .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
          .slice(0, 3);
        if (!posts.length) return;

        recent.innerHTML = posts.map(function (p) {
          var d = new Date(String(p.date) + "T00:00:00");
          var when = isNaN(d.getTime())
            ? String(p.date || "")
            : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          return '<li><span class="news__date">' + when + "</span>" +
            '<span class="news__text"><a href="blog/post.html?p=' + encodeURIComponent(p.slug) + '">' +
            escapeHTML(p.title) + "</a>" +
            (p.summary ? ' <span class="blog-teaser__sum">— ' + escapeHTML(p.summary) + "</span>" : "") +
            "</span></li>";
        }).join("");

        if (section) section.hidden = false;
      })
      .catch(function () { /* no manifest yet — leave the section hidden */ });
  }

  function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
