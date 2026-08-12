# simoncao1207.github.io

Personal academic homepage for **Nam Cao (Simon)** — MS @ KAIST AI, OSI Lab.

Plain static site (HTML + CSS + a little JS). No build step, no dependencies.
Simple, clean single-column academic style (Source Sans 3, calm blue links, light + dark).

## Files

```
index.html      All content (about, news, publications, projects, education, awards)
style.css       Theme tokens + simple layout + dark mode + responsive
script.js       Dark-mode toggle, active-nav highlighting, lightbox, blog teaser
.nojekyll       Tells GitHub Pages to serve files as-is (no Jekyll processing)
assets/         Avatar, publication figures, project figures
blog/
  index.html    Post listing with tag filters
  post.html     Post reader — post.html?p=<slug>
  posts.json    The index: one entry per post (title, date, tags, summary)
  blog.js       Markdown rendering + listing/filter logic
  blog.css      Blog-only styles (prose, code, tables, figures, contents sidebar)
  posts/*.md    The posts themselves
  img/          Images used by posts
```

## Customize

- **Profile photo:** drop a square image at `assets/avatar.jpg` (square, ~400×400+) and
  change the `src` in `index.html` (search for `assets/avatar.svg`) to `assets/avatar.jpg`.
  It is auto-cropped to a circle. Delete `avatar.svg` afterward.
- **News / publications / experience:** all plain HTML in `index.html` — edit in place.
  News items are a `<ul class="news">`; publications a `<ul class="pubs">`.
- **Accent color / theme:** edit the CSS variables at the top of `style.css`
  (`--link`, `--bg`, `--text`, …) under `:root[data-theme="light"]` / `["dark"]`.
- **Add a CV link:** add `<a href="assets/cv.pdf">CV</a>` and drop the PDF in `assets/`.
- **Add Google Scholar:** copy one of the `<a>` icon blocks in `.about__icons`.

## Blog

Posts are Markdown, rendered in the browser — there is still no build step.

**To publish a post:**

1. Write `blog/posts/<slug>.md` (start from `blog/posts/_template.md`).
2. Add an entry to the `posts` array in `blog/posts.json`:

   ```json
   {
     "slug": "why-block-diffusion-drafts",
     "title": "Why block-diffusion drafting works",
     "date": "2026-08-04",
     "tags": ["AI", "Math"],
     "summary": "Shown under the title on the blog index.",
     "image": "img/draft-tree.svg",
     "draft": false
   }
   ```

3. Commit and push.

`posts.json` is the only place metadata lives — the `.md` file needs no front
matter. The listing sorts by `date`, so array order doesn't matter, and tags turn
into filter chips on their own. Set `"draft": true` to keep a post off the index
and off the homepage while still being able to preview it at its direct URL.

`image` is the panel shown beside the post on the index, laid out like the figures
in the Research Projects section. It's a path relative to `blog/` — usually the
post's own key figure. The panel is a 16:9 box and the image is fitted inside it
whole, never cropped, so plots stay readable. Leave `image` out and the post gets a
plain tinted panel labelled with its first tag instead.

**What the Markdown supports** — `blog/posts/writing-posts-on-this-site.md` is a
live reference for all of it (delete it once you don't need it):

| You write | You get |
| --------- | ------- |
| `$…$` and `$$…$$` | KaTeX math (subscripts like `$x_t$` are safe) |
| ` ```python ` | syntax highlighting + a copy button |
| ` ```mermaid ` | a diagram that follows the light/dark theme |
| `![alt](img/f.svg)` alone on a line | a figure, click to enlarge |
| an `*italic*` line under it | the figure caption |
| a pipe table | an aligned, scrollable table |
| 3+ `##` headings | the sticky contents sidebar |

Image paths are relative to `blog/`, so put files in `blog/img/` and reference them
as `img/name.svg`. For plots, `plt.savefig("blog/img/name.svg")` from matplotlib
gives the sharpest result.

The rendering libraries (marked, KaTeX, highlight.js, Mermaid) load from jsDelivr,
pinned to exact versions with SRI hashes. To upgrade one, change the version in
`blog/post.html` **and** recompute its `integrity` value:

```bash
curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

## Deploy to GitHub Pages (user site)

A GitHub *user* site is served from a repo named exactly `simoncao1207.github.io`,
with `index.html` at the repo root.

```bash
cd /home/namcao/portfolio
git init
git add .
git commit -m "Academic homepage"
git branch -M main
git remote add origin git@github.com:SimonCao1207/simoncao1207.github.io.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a
branch → `main` / root**. Live at <https://simoncao1207.github.io/> within a minute.

## Preview locally

```bash
cd /home/namcao/portfolio
python3 -m http.server 8000        # then open http://localhost:8000
```

Over SSH, forward the port from your laptop:
`ssh -p 90 -L 8000:localhost:8000 namcao@<host>` and open http://localhost:8000.

The blog needs to be served over HTTP — opening `index.html` as a `file://` URL
leaves the post list empty, because browsers block the `fetch` of `posts.json`.
