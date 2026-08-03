# Sabarna Barik Portfolio — Maintenance Guide

This file is the one-stop reference for working on the portfolio site. The whole
site is **data-driven**: you edit the JSON files in `data/`, run the build, and
the finished static site is written to `dist/` (which is then deployed to
GitHub Pages automatically).

```
data/            ← ALL your content lives here (edit these)
scripts/build.js ← reads data/, fills templates, writes dist/
src/templates/   ← page layouts (edit only if you change design)
src/assets/      ← CSS, JS, images (skill icons go in images/skills/)
dist/            ← generated output — never edit, it's rebuilt + not committed
```

---

## 1. Build & preview commands

There is no `package.json` — the site has zero dependencies, so plain Node is
all you need (Node 18+).

```bash
# Build the site (regenerate everything into dist/)
node scripts/build.js

# Preview locally, exactly like GitHub Pages (with /bariksabarna/ prefix)
node scripts/serve.js
# → open http://localhost:8099/bariksabarna/
```

Rebuild after **any** change to `data/`, `src/templates/`, or `src/assets/`.
`sitemap.xml` and `robots.txt` are regenerated automatically.

---

## 2. What placeholder data is in the site right now

This is the current sample/dummy content. Replace it with your real data before
launching. Fields marked `PLACEHOLDER` must be filled in.

| File | What it holds | Sample items currently inside |
|------|---------------|-------------------------------|
| `site.json` | Site config, hero copy, navbar | Hero "Building real things to learn…", 8 nav items |
| `about.json` | About page text | 3 intro paragraphs, philosophy, misc |
| `education.json` | Education entries | Contai Polytechnic (2024–2027), Contai Model Institution |
| `skills.json` | 15 skills in 6 categories | Python, Java, C, Flask, SQL, DSA, Git, Linux… |
| `projects.json` | 3 projects | MyLibrary, Expense Tracker, Password Vault |
| `certificates.json` | 2 certificates | Python for Everybody (Coursera), CS50x (edX) |
| `achievements.json` | 2 achievements | "Placeholder Hackathon — Finalist", "Top 10" |
| `experience.json` | Work experience | **empty `[]`** → the `/experience/` page is NOT generated |
| `socials.json` | Email + social links | GitHub, LinkedIn, LeetCode, Codeforces (visible) |
| `seo.json` | SEO defaults + Person schema | title, description, sameAs links |

`PLACEHOLDER` URLs still to replace: `linkedin.com/in/PLACEHOLDER`,
`leetcode.com/PLACEHOLDER`, `codeforces.com/profile/PLACEHOLDER`,
`youtube.com/watch?v=PLACEHOLDER` (×3 projects),
`coursera.org/verify/PLACEHOLDER`, `edx.org/verify/PLACEHOLDER`,
`drive.google.com/PLACEHOLDER`, `https://PLACEHOLDER` (hackorbit).

---

## 3. Editing data — field by field

### Common fields used by several files

| Field | Type | Meaning |
|-------|------|---------|
| `id` | string | Unique kebab-case slug, e.g. `mylibrary`. Becomes part of the URL. Never change after publishing. |
| `published` | bool | `false` = hidden from the site (and sitemap). |
| `featured` | bool | `true` = appears in the home-page "featured" section. |
| `featuredOrder` | number | Sorting among featured items (1 = first). |

### `site.json`
```json
{
  "siteName": "Sabarna Barik",
  "baseUrl": "https://bariksabarna.github.io/bariksabarna",
  "hero": {
    "name": "Sabarna Barik",
    "nickname": "Rico",
    "kicker": "Computer Science Student",
    "tagline": "…",
    "cta": [ { "label": "Explore My Work", "target": "/projects" } ]
  },
  "nav": [ { "label": "Home", "path": "/" }, { "label": "Skills", "path": "/skills" } ]
}
```
- `nav` drives the navbar, top to bottom. Every path must match a real page
  (`/`, `/about`, `/education`, `/skills`, `/projects`, `/certificates`,
  `/achievements`, `/experience`, `/socials`). The **Experience** item only
  works if `experience.json` is non-empty.
- `baseUrl` must match the GitHub Pages address exactly.

### `about.json`
```json
{
  "heading": "About",
  "intro": "…",
  "body": [ "paragraph 1", "paragraph 2" ],
  "philosophy": "…",
  "misc": [ { "label": "Location", "value": "Contai, West Bengal, India" } ]
}
```
- `body` is an array of paragraphs; each entry becomes one `<p>`.

### `education.json`
```json
{
  "id": "diploma-contai-polytechnic",
  "level": "Diploma in Computer Science & Technology",
  "institution": "Contai Polytechnic",
  "board": "WBSCTE",
  "startYear": 2024,
  "endYear": 2027,
  "status": "current",            // "current" or "completed"
  "result": "Currently pursuing", // grade/percentage shown on the card
  "description": "…",
  "published": true
}
```

### `skills.json`
```json
{
  "id": "python",
  "name": "Python",
  "category": "Programming Languages",
  "icon": "python",
  "image": "/assets/images/skills/python.svg",
  "topicsLearned": ["File Handling", "Flask", "Automation Scripting"],
  "note": "…",
  "status": "learned",            // "learned" or "learning"
  "published": true,
  "featured": true,
  "featuredOrder": 1
}
```
- **`image`** points to the skill icon in `src/assets/images/skills/`. It is a
  placeholder SVG right now — replace it with a real icon by uploading an AVIF
  file there (e.g. `python.avif`) and updating this field to
  `/assets/images/skills/python.avif`. Or simply overwrite the SVG file.
- `category` groups skills on the Skills page. Use one of the 6 existing names
  or add a new one (a new category header is generated automatically).

### `projects.json`
```json
{
  "id": "mylibrary",
  "title": "MyLibrary",
  "summary": "One-line summary for cards.",
  "image": "/assets/images/projects/mylibrary.svg", // thumbnail shown on the card + detail page
  "description": [ "paragraph 1", "paragraph 2" ],
  "problem": "…",                 // shown under "The Problem"
  "whyBuilt": "…",                // shown under "Why I Built It"
  "whatLearned": "…",             // shown under "What I Learned"
  "techStack": ["Python", "Flask"],
  "tags": ["python", "flask", "backend"],
  "skillIds": ["python", "flask"],   // links this project to skill detail pages
  "category": "Academic",
  "githubUrl": "https://github.com/bariksabarna/mylibrary",
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "liveDemoUrl": null,               // null hides the "Live Demo" button
  "published": true,
  "featured": true,
  "featuredOrder": 1
}
```
- Every `skillIds` value must exist as a skill `id` in `skills.json`, or it is
  ignored (a build warning is printed).
- `image` points to the project thumbnail in `src/assets/images/projects/` —
  currently a placeholder SVG. Upload a real screenshot (AVIF preferred) there
  and update this field, or just overwrite the SVG file.

### `certificates.json`
```json
{
  "id": "python-for-everybody",
  "title": "Python for Everybody",
  "issuer": "University of Michigan",
  "platform": "Coursera",
  "year": 2025,
  "imageUrl": "/assets/images/certificates/python-for-everybody.svg",
  "verificationUrl": "https://coursera.org/verify/REAL_ID",
  "skillIds": ["python"],
  "projectIds": ["mylibrary"],
  "published": true,
  "featured": true,
  "featuredOrder": 1
}
```
- Certificates open in an **in-page viewer (modal)** — there is no certificate
  detail page by design. Clicking a card shows the image + a
  "Verify Credential" link.
- `imageUrl` is currently a placeholder SVG. Replace with a real certificate
  scan (AVIF preferred) in `src/assets/images/certificates/`.

### `achievements.json`
```json
{
  "id": "placeholder-hackathon-2026",
  "title": "…",
  "organization": "…",
  "date": "2026-03-15",           // ISO date, drives sort order + display
  "description": "…",
  "proofUrl": "https://…",        // optional link
  "category": "Hackathon",
  "published": true,
  "featured": true,
  "featuredOrder": 1
}
```

### `experience.json`
Array of work-experience entries:
```json
[
  {
    "id": "intern-…",
    "role": "…",
    "company": "…",
    "location": "…",
    "startDate": "2026-01",
    "endDate": null,              // null = current
    "points": [ "…", "…" ],
    "published": true
  }
]
```
- While this file is `[]`, the site has **no** `/experience/` page, and the nav
  "Experience" item is suppressed. Add one entry and rebuild → the page appears.

### `socials.json`
```json
{
  "email": { "address": "sabarnabarik@gmail.com", "visible": true },
  "links": [
    { "id": "github", "label": "GitHub", "url": "https://github.com/bariksabarna", "icon": "github", "visible": true }
  ]
}
```
- `icon` must be one of: `github`, `linkedin`, `youtube`, `leetcode`,
  `codeforces`, `hackorbit` (SVG paths are built in). Set `visible: false` to
  keep a link in the data but hidden from the site.

### `seo.json`
- `defaultTitle`, `defaultDescription`, `defaultOgImage`, and `person` (name,
  `alternateName`, `jobTitle`, `nationality`, `alumniOf`, `sameAs`) feed the
  `<head>` and the Person JSON-LD schema. `sameAs` should list your real
  profile URLs (remove the `PLACEHOLDER` ones).

---

## 4. Uploading / deploying the site

The repo is configured for **GitHub Pages with the GitHub Actions source** —
deploying is: push to `main`. The workflow in `.github/workflows/deploy.yml`
runs `node scripts/build.js` and publishes `dist/`.

### First-time setup (one time only)
1. Push the repo to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio build"
   git branch -M main
   git remote add origin https://github.com/bariksabarna/bariksabarna.git
   git push -u origin main
   ```
2. In the repo on GitHub: **Settings → Pages → Source → GitHub Actions**.
3. Wait for the workflow run to finish (Actions tab), then open
   `https://bariksabarna.github.io/bariksabarna`.

### Every content change after that
1. Edit `data/*.json` (and drop any new images into `src/assets/images/`).
2. `node scripts/build.js` and check the output at `dist/` (or run
   `node scripts/serve.js` for a live preview).
3. `git add . && git commit -m "Update projects" && git push`
4. GitHub Actions rebuilds + deploys automatically. Refresh the live URL.

### Notes
- `dist/` is **not committed** (see `.gitignore`) — it is produced by the
  build in CI. Never force-add it.
- `checklist.md` (local progress tracker) and `README.md` are also not
  committed; you're keeping those out of this repo deliberately.
- This is a **zero-dependency** repo: no `npm install`, no `package.json`, no
  `package-lock.json`. If you ever want `npm run` shortcuts, add a `package.json`
  with `"scripts": { "build": "node scripts/build.js", "preview": "node scripts/serve.js" }`
  and update the workflow back to `npm run build`.
