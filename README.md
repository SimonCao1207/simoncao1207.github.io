# simoncao1207.github.io

Personal academic homepage for **Nam Cao (Simon)** — MS @ KAIST AI, OSI Lab.

Plain static site (HTML + CSS + a little JS). No build step, no dependencies.
Simple, clean single-column academic style (Source Sans 3, calm blue links, light + dark).

## Files

```
index.html      All content (about, news, publications, experience, education, awards)
style.css       Theme tokens + simple layout + dark mode + responsive
script.js       Dark-mode toggle + active-nav highlighting
.nojekyll       Tells GitHub Pages to serve files as-is (no Jekyll processing)
assets/
  avatar.svg    Profile PLACEHOLDER — replace with your photo (see below)
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
