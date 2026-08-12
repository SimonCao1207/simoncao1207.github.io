/* ============================================================
   Nam Cao — blog
   Posts are Markdown in blog/posts/<slug>.md; their metadata
   lives in blog/posts.json. Nothing is built ahead of time:
   this file turns the Markdown into HTML in the browser.

   Listing page  → #postlist        (blog/index.html)
   Post page     → #postBody        (blog/post.html?p=<slug>)
   ============================================================ */

(function () {
  "use strict";

  var MANIFEST = "posts.json";
  var POST_DIR = "posts/";

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function get(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " → HTTP " + r.status);
      return r;
    });
  }

  // Newest first; drafts never appear.
  function published(posts) {
    return (posts || [])
      .filter(function (p) { return p && p.slug && !p.draft; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function parseDate(iso) {
    var d = new Date(String(iso) + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function shortDate(iso) {          // "Jul 2026" — matches the News section
    var d = parseDate(iso);
    return d ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : String(iso || "");
  }

  function longDate(iso) {           // "July 20, 2026"
    var d = parseDate(iso);
    return d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : String(iso || "");
  }

  function readingTime(text) {
    var words = (text.trim().match(/\S+/g) || []).length;
    return Math.max(1, Math.round(words / 220));
  }

  function failure(el, err) {
    if (!el) return;
    el.innerHTML =
      '<p class="blog-error"><strong>Could not load posts.</strong> ' + esc(String(err && err.message || err)) +
      "<br />If you opened this page as a <code>file://</code> URL, the browser blocks these requests. " +
      "Serve the folder instead: <code>python3 -m http.server 8000</code>, then open " +
      "<code>http://localhost:8000/blog/</code>.</p>";
    el.hidden = false;
  }

  /* ---------- markdown → HTML ---------- */

  var markedReady = false;

  function configureMarked() {
    if (markedReady || typeof window.marked === "undefined") return;
    markedReady = true;
    if (typeof window.markedKatex === "function") {
      // Tokenises $…$ / $$…$$ before inline markdown runs, so subscripts
      // like $x_t$ are never mangled into <em>.
      window.marked.use(window.markedKatex({ throwOnError: false, nonStandard: true }));
    }
  }

  // Tolerate YAML front matter if a post happens to carry it — posts.json
  // is the source of truth for metadata, so it is simply dropped.
  function stripFrontMatter(md) {
    return md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/, "");
  }

  function slugify(node) {
    var clone = node.cloneNode(true);
    Array.prototype.slice.call(clone.querySelectorAll(".katex, .katex-display")).forEach(function (k) {
      k.replaceWith(document.createTextNode("math"));
    });
    return clone.textContent.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "section";
  }

  /* Headings: stable ids, a hover anchor, and the table of contents. */
  function enhanceHeadings(root, tocNav, tocBox) {
    var heads = Array.prototype.slice.call(root.querySelectorAll("h2, h3"));
    var used = Object.create(null);
    var items = [];

    heads.forEach(function (h) {
      var base = slugify(h);
      var id = base;
      var n = 2;
      while (used[id]) id = base + "-" + n++;
      used[id] = true;
      h.id = id;

      var a = document.createElement("a");
      a.className = "head-anchor";
      a.href = "#" + id;
      a.setAttribute("aria-label", "Link to this section");
      a.textContent = "#";
      h.appendChild(a);

      items.push({ id: id, level: h.tagName === "H2" ? 2 : 3, text: h.textContent.replace(/#$/, "").trim() });
    });

    if (!tocNav || !tocBox || items.length < 3) return;
    tocNav.innerHTML = items.map(function (it) {
      return '<a class="toc__link toc__link--h' + it.level + '" href="#' + esc(it.id) + '">' + esc(it.text) + "</a>";
    }).join("");
    tocBox.hidden = false;
    spyOnHeadings(items, tocNav);
  }

  function spyOnHeadings(items, tocNav) {
    if (!("IntersectionObserver" in window)) return;
    var links = {};
    Array.prototype.slice.call(tocNav.querySelectorAll("a")).forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].classList.toggle("is-active", id === e.target.id);
        });
      });
    }, { rootMargin: "-70px 0px -70% 0px", threshold: 0 });
    items.forEach(function (it) {
      var el = document.getElementById(it.id);
      if (el) seen.observe(el);
    });
  }

  /* A figure's caption is either the wholly italic paragraph after it —
     *A placeholder figure.* — or a paragraph opening with a bold label the
     way the table captions do: **Figure 1.** … The labelled form keeps its
     own markup, is set like body text, and is written *above* the image, so
     a figure and a table are captioned the same way in both source and page.
     `labelledOnly` guards the paragraph before the image, where an italic
     line is just prose. */
  function captionFor(p, labelledOnly) {
    if (!p || p.tagName !== "P") return null;

    var lead = p.firstElementChild;
    var cap = document.createElement("figcaption");

    if (lead && lead.tagName === "STRONG" &&
        /^fig(ure)?\.?\s*\d*\s*[.:]?$/i.test(lead.textContent.trim())) {
      cap.innerHTML = p.innerHTML;
      cap.className = "is-labelled";
      return cap;
    }
    if (!labelledOnly && p.children.length === 1 && lead && lead.tagName === "EM" &&
        p.textContent.trim() === lead.textContent.trim()) {
      cap.innerHTML = lead.innerHTML;
      return cap;
    }
    return null;
  }

  /* A paragraph holding only an image becomes a <figure>, taking the
     neighbouring paragraph that captions it: a labelled one from above, an
     italic one from below. */
  function enhanceFigures(root) {
    Array.prototype.slice.call(root.querySelectorAll("p > img")).forEach(function (img) {
      var p = img.parentNode;
      if (p.childNodes.length !== 1 || p.textContent.trim() !== "") return;

      var prev = p.previousElementSibling;
      var next = p.nextElementSibling;
      var fig = document.createElement("figure");
      fig.className = "post__figure";

      var link = document.createElement("a");
      link.className = "zoom";
      link.setAttribute("href", img.getAttribute("src"));
      link.setAttribute("aria-label", "Enlarge figure");
      link.appendChild(img);

      p.parentNode.insertBefore(fig, p);
      p.remove();

      var above = captionFor(prev, true);
      if (above) {
        fig.appendChild(above);
        prev.remove();
      }
      fig.appendChild(link);

      var cap = above ? null : captionFor(next);
      if (cap) {
        fig.appendChild(cap);
        next.remove();
      }
    });
  }

  function enhanceCode(root) {
    if (window.hljs && window.hljs.configure) {
      window.hljs.configure({ ignoreUnescapedHTML: true });
    }
    Array.prototype.slice.call(root.querySelectorAll("pre > code")).forEach(function (code) {
      if (/\blanguage-mermaid\b/.test(code.className)) return;

      // Only highlight when the fence named a language — no noisy auto-detect.
      if (window.hljs && /\blanguage-\S+/.test(code.className)) {
        try { window.hljs.highlightElement(code); } catch (e) { /* unknown language */ }
      }

      var pre = code.parentNode;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.addEventListener("click", function () {
        var done = function (ok) {
          btn.textContent = ok ? "Copied" : "Press ⌘/Ctrl+C";
          setTimeout(function () { btn.textContent = "Copy"; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code.textContent).then(function () { done(true); }, function () { done(false); });
        } else {
          done(false);
        }
      });
      pre.classList.add("has-copy");
      pre.appendChild(btn);
    });
  }

  // "| Bench |  | Next |  |" — an empty header cell merges into the one on its
  // left, so a single Markdown header row can span groups of sub-columns.
  function spanHeaderCells(tr) {
    var anchor = null;
    Array.prototype.slice.call(tr.cells).forEach(function (th) {
      if (anchor && th.textContent.trim() === "") {
        anchor.colSpan += th.colSpan;
        th.remove();
      } else {
        anchor = th;
      }
    });
  }

  // A first body row whose leading cell is empty carries the sub-labels for
  // those groups, not data: move it into the head. Leading columns it says
  // nothing about are spanned down from the label above them.
  function promoteSubHead(t) {
    var head = t.tHead, body = t.tBodies[0];
    if (!head || !head.rows.length || !body || !body.rows.length) return;

    var tr = body.rows[0];
    if (!tr.cells.length || tr.cells[0].textContent.trim() !== "") return;

    Array.prototype.slice.call(tr.cells).forEach(function (td) {
      var th = document.createElement("th");
      th.innerHTML = td.innerHTML;
      th.setAttribute("scope", "col");
      if (td.hasAttribute("align")) th.setAttribute("align", td.getAttribute("align"));
      td.replaceWith(th);
    });
    tr.classList.add("subhead");
    head.appendChild(tr);
    t.classList.add("is-grouped");

    // Cell 0 of the sub-head is always the next one to test: the run so far
    // has been deleted, so it lines up with top.cells[i].
    var top = head.rows[0];
    for (var i = 0; i < top.cells.length && tr.cells.length; i++) {
      if (top.cells[i].colSpan !== 1 || tr.cells[0].textContent.trim() !== "") break;
      top.cells[i].rowSpan = 2;
      tr.deleteCell(0);
    }
  }

  // One <colgroup> per spanning header, so a group's sub-columns share a wash
  // and read as one measurement. Hues walk the categorical slots in column
  // order; a group whose label is bold is a summary, and stays neutral. The
  // body cells carry their group's slot too, so a highlighted value can be
  // tinted by the column it belongs to.
  function groupColumns(t) {
    var head = t.tHead;
    if (!head || head.rows.length < 2) return;

    var frag = document.createDocumentFragment();
    var byColumn = [];
    var slot = 0;
    Array.prototype.slice.call(head.rows[0].cells).forEach(function (th) {
      var span = th.colSpan || 1;
      var cls = "";
      if (span > 1) {
        cls = th.querySelector("strong") ? "is-summary" : "cat-" + (slot++ % 6 + 1);
        th.classList.add(cls);
        th.setAttribute("scope", "colgroup");
      }
      var g = document.createElement("colgroup");
      g.span = span;
      if (cls) g.className = cls;
      frag.appendChild(g);
      while (span--) byColumn.push(cls);
    });
    t.insertBefore(frag, t.firstChild);

    Array.prototype.slice.call(t.querySelectorAll("tbody tr")).forEach(function (tr) {
      var col = 0;
      Array.prototype.slice.call(tr.cells).forEach(function (td) {
        if (byColumn[col]) td.classList.add(byColumn[col]);
        col += td.colSpan || 1;
      });
    });
  }

  // Wide tables scroll inside their own box rather than pushing the page sideways.
  // A row whose cells after the first are all empty is a section label, not data:
  // merge it into one cell so it bands across the table.
  function enhanceTables(root) {
    Array.prototype.slice.call(root.querySelectorAll("table")).forEach(function (t) {
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);

      if (t.tHead && t.tHead.rows.length) spanHeaderCells(t.tHead.rows[0]);
      promoteSubHead(t);
      groupColumns(t);

      Array.prototype.slice.call(t.querySelectorAll("tbody tr")).forEach(function (tr) {
        var cells = tr.cells;
        if (cells.length < 2 || cells[0].textContent.trim() === "") return;
        for (var i = 1; i < cells.length; i++) {
          if (cells[i].textContent.trim() !== "") return;
        }
        var span = cells.length;
        for (var j = span - 1; j >= 1; j--) tr.deleteCell(j);
        cells[0].colSpan = span;
        tr.classList.add("is-group");
      });

      decorateCells(t);

      // Tick/cross tables get their own palette.
      if (t.querySelector(".mark-yes, .mark-no")) wrap.classList.add("table-wrap--marks");
    });
  }

  // Two cell decorations, both purely visual:
  //   "1.53×" faster than baseline (green), "0.94×" slower (red), 1× neutral;
  //   "✓" / "✗" as pass/fail marks.
  // Values without the × (acceptance length) are left alone.
  function decorateCells(table) {
    var re = /(\d+(?:\.\d+)?)×|[✓✗]/g;
    Array.prototype.slice.call(table.querySelectorAll("tbody td")).forEach(function (td) {
      var walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT, null, false);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        var text = node.nodeValue;
        if (!/[×✓✗]/.test(text)) return;

        var frag = document.createDocumentFragment();
        var last = 0, m;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));

          var cls = null;
          if (m[1] === undefined) {
            cls = m[0] === "✓" ? "mark-yes" : "mark-no";
          } else {
            var v = parseFloat(m[1]);
            if (v !== 1) cls = v > 1 ? "spd-up" : "spd-down";
          }

          if (cls) {
            var s = document.createElement("span");
            s.className = cls;
            s.textContent = m[0];
            frag.appendChild(s);
          } else {
            frag.appendChild(document.createTextNode(m[0]));
          }
          last = m.index + m[0].length;
        }
        if (!last) return;
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  function enhanceLinks(root) {
    Array.prototype.slice.call(root.querySelectorAll("a[href]")).forEach(function (a) {
      if (a.classList.contains("zoom") || a.classList.contains("head-anchor")) return;
      var href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href) && a.host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });
  }

  /* ---------- mermaid ---------- */

  var mermaidNodes = [];

  function runMermaid(nodes) {
    if (!window.mermaid || !nodes.length) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: dark ? "dark" : "default",
        fontFamily: getComputedStyle(document.body).fontFamily
      });
      var r = window.mermaid.run({ nodes: nodes });
      if (r && r.catch) r.catch(function () {});
    } catch (e) { /* leave the source visible */ }
  }

  function enhanceMermaid(root) {
    var blocks = Array.prototype.slice.call(root.querySelectorAll("pre > code.language-mermaid"));
    mermaidNodes = blocks.map(function (code) {
      var pre = code.parentNode;
      var holder = document.createElement("div");
      holder.className = "mermaid";
      holder.setAttribute("data-src", code.textContent);
      holder.textContent = code.textContent;
      pre.parentNode.replaceChild(holder, pre);
      return holder;
    });
    runMermaid(mermaidNodes);
  }

  // Mermaid bakes its palette into the SVG, so redraw when the theme flips.
  document.addEventListener("themechange", function () {
    if (!mermaidNodes.length) return;
    mermaidNodes.forEach(function (n) {
      n.removeAttribute("data-processed");
      n.innerHTML = "";
      n.textContent = n.getAttribute("data-src");
    });
    runMermaid(mermaidNodes);
  });

  function renderMarkdown(md, container, tocNav, tocBox) {
    if (typeof window.marked === "undefined") {
      throw new Error("the Markdown renderer did not load — check the connection to cdn.jsdelivr.net.");
    }
    configureMarked();
    container.innerHTML = window.marked.parse(stripFrontMatter(md));
    enhanceHeadings(container, tocNav, tocBox);
    enhanceFigures(container);
    enhanceTables(container);
    enhanceCode(container);
    enhanceLinks(container);
    enhanceMermaid(container);
    if (window.Site && window.Site.bindZoom) window.Site.bindZoom(container);

    // Deep link into a heading, now that the content exists.
    if (location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  /* ---------- listing page ---------- */

  function tagChip(tag, active) {
    return '<a class="chip' + (active ? " is-active" : "") + '" href="' +
      (tag === null ? "#" : "#tag=" + encodeURIComponent(tag)) + '">' +
      esc(tag === null ? "All" : tag) + "</a>";
  }

  function currentTag() {
    var m = /(?:^#|[#&])tag=([^&]+)/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function postCard(p) {
    var href = "post.html?p=" + encodeURIComponent(p.slug);

    var tags = (p.tags || []).map(function (t) {
      return '<a class="posttag" href="#tag=' + encodeURIComponent(t) + '">' + esc(t) + "</a>";
    }).join('<span class="posttag__sep">·</span>');

    // The panel repeats the title link, so it is skipped by screen readers
    // and by the tab order rather than announced twice.
    var panel = p.image
      ? '<a class="postitem__thumb" href="' + href + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + esc(p.image) + '" alt="" loading="lazy" />' +
        "</a>"
      : '<a class="postitem__thumb postitem__thumb--empty" href="' + href + '" tabindex="-1" aria-hidden="true">' +
          "<span>" + esc((p.tags || [])[0] || "Post") + "</span>" +
        "</a>";

    return '' +
      '<li class="postitem">' +
        panel +
        '<div class="postitem__body">' +
          '<h2 class="postitem__title"><a href="' + href + '">' + esc(p.title) + "</a></h2>" +
          (p.summary ? '<p class="postitem__summary">' + esc(p.summary) + "</p>" : "") +
          '<p class="postitem__meta">' +
            '<span class="postitem__date">' + esc(shortDate(p.date)) + "</span>" +
            (tags ? '<span class="posttag__sep">·</span>' + tags : "") +
          "</p>" +
        "</div>" +
      "</li>";
  }

  function initList() {
    var listEl = document.getElementById("postlist");
    var barEl = document.getElementById("tagbar");
    var emptyEl = document.getElementById("postlistEmpty");

    get(MANIFEST)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var posts = published(data.posts);

        var tags = [];
        posts.forEach(function (p) {
          (p.tags || []).forEach(function (t) { if (tags.indexOf(t) === -1) tags.push(t); });
        });
        tags.sort(function (a, b) { return a.localeCompare(b); });

        var drawn;   // last tag rendered, so unrelated hash changes (#top) are ignored

        function draw() {
          var active = currentTag();
          if (active && tags.indexOf(active) === -1) active = null;
          if (drawn !== undefined && drawn === active) return;
          drawn = active;

          barEl.innerHTML = [tagChip(null, !active)]
            .concat(tags.map(function (t) { return tagChip(t, t === active); }))
            .join("");

          var shown = active
            ? posts.filter(function (p) { return (p.tags || []).indexOf(active) !== -1; })
            : posts;

          listEl.innerHTML = shown.map(postCard).join("");
          emptyEl.hidden = shown.length > 0;
          if (!shown.length) {
            emptyEl.textContent = posts.length
              ? "No posts tagged “" + active + "” yet."
              : "No posts yet — the first one is on its way.";
          }
        }

        draw();
        window.addEventListener("hashchange", draw);
      })
      .catch(function (err) { failure(listEl, err); });
  }

  /* ---------- post page ---------- */

  function initPost() {
    var bodyEl = document.getElementById("postBody");
    var titleEl = document.getElementById("postTitle");
    var metaEl = document.getElementById("postMeta");
    var navEl = document.getElementById("postNav");
    var tocBox = document.getElementById("toc");
    var tocNav = document.getElementById("tocNav");

    var slug = new URLSearchParams(location.search).get("p");
    if (!slug) {
      titleEl.textContent = "No post selected";
      bodyEl.innerHTML = '<p>Pick something from the <a href="./">list of posts</a>.</p>';
      return;
    }

    get(MANIFEST)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var all = published(data.posts);
        var meta = (data.posts || []).filter(function (p) { return p.slug === slug; })[0];

        if (!meta) {
          titleEl.textContent = "Post not found";
          bodyEl.innerHTML = '<p>Nothing here with the name <code>' + esc(slug) +
            '</code>. Try the <a href="./">list of posts</a>.</p>';
          return;
        }

        document.title = meta.title + " · Nam Cao";
        var desc = document.querySelector('meta[name="description"]');
        if (desc && meta.summary) desc.setAttribute("content", meta.summary);
        titleEl.textContent = meta.title;

        return get(POST_DIR + slug + ".md")
          .then(function (r) { return r.text(); })
          .then(function (md) {
            var bits = [esc(longDate(meta.date)), readingTime(md) + " min read"];
            if (meta.draft) bits.push('<span class="post__draft">Draft</span>');
            (meta.tags || []).forEach(function (t) {
              bits.push('<a class="posttag" href="./#tag=' + encodeURIComponent(t) + '">' + esc(t) + "</a>");
            });
            metaEl.innerHTML = bits.join('<span class="post__dot">·</span>');

            renderMarkdown(md, bodyEl, tocNav, tocBox);

            var i = all.map(function (p) { return p.slug; }).indexOf(slug);
            var newer = i === -1 ? null : all[i - 1];
            var older = i === -1 ? null : all[i + 1];
            if (navEl && (newer || older)) {
              navEl.innerHTML =
                (newer ? '<a class="postnav__link postnav__link--prev" href="post.html?p=' + encodeURIComponent(newer.slug) +
                  '"><span class="postnav__dir">← Newer</span><span class="postnav__title">' + esc(newer.title) + "</span></a>" : "<span></span>") +
                (older ? '<a class="postnav__link postnav__link--next" href="post.html?p=' + encodeURIComponent(older.slug) +
                  '"><span class="postnav__dir">Older →</span><span class="postnav__title">' + esc(older.title) + "</span></a>" : "<span></span>");
              navEl.hidden = false;
            }
          });
      })
      .catch(function (err) { failure(bodyEl, err); });
  }

  /* ---------- go ---------- */

  if (document.getElementById("postlist")) initList();
  if (document.getElementById("postBody")) initPost();
})();
