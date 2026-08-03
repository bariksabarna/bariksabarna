'use strict';

/**
 * build.js
 * Dependency-free Node.js build pipeline for the Sabarna Barik portfolio.
 * Reads /data/*.json, fills HTML templates, and pre-renders every static
 * route into /dist. Also generates sitemap.xml + robots.txt and copies assets.
 *
 * Run: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');
const { BASE_URL, BASE_PATH } = require('./config');
const { validateAll } = require('./validate-json');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const TEMPLATES_DIR = path.join(ROOT, 'src', 'templates');
const ASSETS_DIR = path.join(ROOT, 'src', 'assets');
const DIST_DIR = path.join(ROOT, 'dist');

/* ------------------------------------------------------------------ */
/* Data loading (invalid JSON is the one acceptable hard failure)      */
/* ------------------------------------------------------------------ */

function readJson(file) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  return JSON.parse(raw);
}

const data = {
  site: readJson('site.json'),
  about: readJson('about.json'),
  education: readJson('education.json'),
  skills: readJson('skills.json'),
  projects: readJson('projects.json'),
  certificates: readJson('certificates.json'),
  achievements: readJson('achievements.json'),
  experience: readJson('experience.json'),
  socials: readJson('socials.json'),
  seo: readJson('seo.json'),
};

validateAll(data).forEach((w) => console.warn(`  [warn] ${w}`));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function readTemplate(rel) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, rel), 'utf8');
}

function fill(template, ctx) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in ctx ? ctx[key] : match
  );
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function assetUrl(p) {
  return BASE_PATH + (p.startsWith('/') ? p : '/' + p);
}

function pageUrl(pathname) {
  return BASE_URL + (pathname === '/' ? '/' : pathname + '/');
}

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */
/* Derived data                                                        */
/* ------------------------------------------------------------------ */

const published = (arr) => (Array.isArray(arr) ? arr.filter((e) => e && e.published) : []);

const featured = (arr) =>
  published(arr)
    .filter((e) => e.featured)
    .sort(
      (a, b) =>
        (a.featuredOrder != null ? a.featuredOrder : Number.MAX_SAFE_INTEGER) -
        (b.featuredOrder != null ? b.featuredOrder : Number.MAX_SAFE_INTEGER)
    );

const education = published(data.education);
const skills = published(data.skills);
const projects = published(data.projects);
const certificates = published(data.certificates);
const achievements = published(data.achievements);
const experience = published(data.experience);

const visibleSocials = (data.socials.links || []).filter((l) => l.visible);

const CATEGORY_ORDER = [
  'Programming Languages',
  'Web Technologies',
  'Databases',
  'CS Fundamentals',
  'Tools & Platforms',
  'Additional Skills',
];

const categoryOrder = (cat) => {
  const i = CATEGORY_ORDER.indexOf(cat);
  return i === -1 ? CATEGORY_ORDER.length : i;
};

const skillsByCategory = [...new Set(skills.map((s) => s.category))]
  .sort((a, b) => categoryOrder(a) - categoryOrder(b))
  .map((category) => ({
    category,
    items: skills.filter((s) => s.category === category),
  }));

const usedBySkill = (skillId) => ({
  projects: projects.filter((p) => (p.skillIds || []).includes(skillId)),
  certificates: certificates.filter((c) => (c.skillIds || []).includes(skillId)),
});

const projectSkillChips = [
  ...new Set(projects.flatMap((p) => p.skillIds || [])),
]
  .map((id) => skills.find((s) => s.id === id))
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(
    (s) =>
      `<button class="filter-chip" type="button" data-filter="${esc(s.id)}" aria-pressed="false">${esc(s.name)}</button>`
  )
  .join('');
const certPlatforms = [...new Set(certificates.map((c) => c.platform))].sort();
const certYears = [...new Set(certificates.map((c) => c.year))].sort((a, b) => b - a);

const navItems = (data.site.nav || []).slice();
if (experience.length) navItems.push({ label: 'Experience', path: '/experience' });

function navMarkup(currentPath, basePath, mobile) {
  const current = currentPath === '/' ? '/' : currentPath;
  return navItems
    .map((item) => {
      const href = item.path === '/' ? basePath + '/' : basePath + item.path + '/';
      const active =
        current === item.path ||
        (item.path !== '/' && current.startsWith(item.path + '/'));
      const attr = active ? ' aria-current="page"' : '';
      if (mobile) return `<a href="${href}"${attr}>${esc(item.label)}</a>`;
      return `<a class="navbar__link" href="${href}"${attr}>${esc(item.label)}</a>`;
    })
    .join('');
}

function footerLinksMarkup(basePath) {
  return navItems
    .map((item) => {
      const href = item.path === '/' ? basePath + '/' : basePath + item.path + '/';
      return `<a href="${href}">${esc(item.label)}</a>`;
    })
    .join('');
}

function footerSocialsMarkup(basePath) {
  return visibleSocials
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`)
    .join('');
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

const SKILL_ICONS = {
  python: 'code',
  flask: 'web',
  java: 'coffee',
  c: 'data_object',
  'c-programming': 'data_object',
  html: 'html',
  'html-css': 'html',
  javascript: 'javascript',
  sql: 'database',
  sqlite: 'storage',
  postgresql: 'dataset',
  dsa: 'account_tree',
  network: 'lan',
  'computer-networks': 'lan',
  oop: 'widgets',
  git: 'share',
  linux: 'terminal',
  problemsolving: 'psychology',
  'problem-solving': 'psychology',
};

const skillIcon = (id) => SKILL_ICONS[id] || 'terminal';

function skillIconBlock(skill, size) {
  if (skill.image) {
    return `<img class="skill-card__icon-img" src="${assetUrl(skill.image)}" alt="" loading="lazy" width="${size}" height="${size}">`;
  }
  const font = Math.round(size * 0.5);
  return `<span class="material-symbols-outlined" style="font-size:${font}px">${skillIcon(skill.id)}</span>`;
}

const BRAND_PATHS = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
};

const MATERIAL_ICONS = {
  leetcode: 'code_blocks',
  codeforces: 'leaderboard',
  hackorbit: 'hub',
  email: 'mail',
};

function iconMarkup(id) {
  if (BRAND_PATHS[id]) {
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="24" height="24"><path d="${BRAND_PATHS[id]}"/></svg>`;
  }
  if (MATERIAL_ICONS[id]) {
    return `<span class="material-symbols-outlined" aria-hidden="true" style="font-size:24px">${MATERIAL_ICONS[id]}</span>`;
  }
  return `<span class="material-symbols-outlined" aria-hidden="true" style="font-size:24px">link</span>`;
}

/* ------------------------------------------------------------------ */
/* Partials                                                            */
/* ------------------------------------------------------------------ */

const projectCardTpl = readTemplate('partials/cards/project-card.html');
const skillCardTpl = readTemplate('partials/cards/skill-card.html');
const certCardTpl = readTemplate('partials/cards/certificate-card.html');
const avatarTpl = readTemplate('partials/avatar.html');
const navbarTpl = readTemplate('partials/navbar.html');
const footerTpl = readTemplate('partials/footer.html');

function tagsMarkup(tags, limit) {
  return (tags || []).slice(0, limit).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
}

function renderProjectCard(project, basePath) {
  const badge = project.featured
    ? '<span class="card__badge">Featured</span>'
    : '';
  const media = project.image
    ? `<div class="card__media"><img src="${assetUrl(project.image)}" alt="${esc(
        project.title + ' — ' + (project.summary || '')
      )}" loading="lazy" width="640" height="360">${badge}</div>`
    : `<div class="card__media card__media--icon"><span class="material-symbols-outlined" aria-hidden="true" style="font-size:56px">code_blocks</span>${badge}</div>`;
  return fill(projectCardTpl, {
    url: basePath + '/projects/' + project.id + '/',
    title: esc(project.title),
    summary: esc(project.summary || ''),
    data_skills: (project.skillIds || []).join(' '),
    tech_tags: tagsMarkup(project.techStack, 4),
    media_block: media,
  });
}

function renderSkillCard(skill, basePath) {
  const preview = (skill.topicsLearned || []).slice(0, 2).join(', ');
  const count = (skill.topicsLearned || []).length;
  return fill(skillCardTpl, {
    url: basePath + '/skills/' + skill.id + '/',
    icon: skillIconBlock(skill, 48),
    name: esc(skill.name),
    topics_preview: esc(preview),
    topic_count: count,
    topic_plural: count === 1 ? '' : 's',
  });
}

function renderCertCard(cert) {
  return fill(certCardTpl, {
    id: esc(cert.id),
    image_url: assetUrl(cert.imageUrl),
    alt_text: esc(
      `${cert.title} certificate, issued by ${cert.issuer} via ${cert.platform}, ${cert.year}`
    ),
    year: cert.year,
    title: esc(cert.title),
    issuer: esc(cert.issuer),
    platform: esc(cert.platform),
  });
}

function renderAvatar(basePath) {
  return fill(avatarTpl, { basePath });
}

function renderShell(pagePath, content, meta, extraCtx) {
  const basePath = BASE_PATH;
  const ctx = {
    basePath,
    title: meta.title,
    meta_description: meta.description,
    canonical_url: meta.canonical,
    og_site_name: esc(data.site.siteName),
    og_title: meta.title,
    og_description: meta.description,
    og_type: meta.ogType || 'website',
    og_url: meta.canonical,
    og_image: meta.ogImage,
    json_ld: meta.jsonLd,
    navbar: fill(navbarTpl, {
      basePath,
      site_name: esc(data.site.siteName),
      nav_items: navMarkup(pagePath, basePath, false),
      nav_items_mobile: navMarkup(pagePath, basePath, true),
    }),
    footer: fill(footerTpl, {
      basePath,
      site_name: esc(data.site.siteName),
      footer_links: footerLinksMarkup(basePath),
      footer_socials: footerSocialsMarkup(basePath),
      year: new Date().getFullYear(),
    }),
    content,
    ...extraCtx,
  };
  return fill(readTemplate('layouts/base.html'), ctx);
}

function renderPage(templateRel, pagePath, meta, ctx) {
  const basePath = BASE_PATH;
  const pageHtml = fill(readTemplate(templateRel), { basePath, ...ctx });
  return renderShell(pagePath, pageHtml, meta);
}

function writeFile(rel, content) {
  const out = path.join(DIST_DIR, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
  return out;
}

/* ------------------------------------------------------------------ */
/* SEO helpers                                                         */
/* ------------------------------------------------------------------ */

function personSchema() {
  const person = data.seo.person;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    nationality: person.nationality,
    url: BASE_URL + '/',
    sameAs: person.sameAs.slice(),
  };
  if (person.alternateName) schema.alternateName = person.alternateName;
  if (Array.isArray(person.alumniOf) && person.alumniOf.length) {
    schema.alumniOf = person.alumniOf.map((name) => ({
      '@type': 'EducationalOrganization',
      name,
    }));
  }
  if (data.socials.links && data.socials.links.length) {
    visibleSocials.forEach((s) => {
      if (s.id === 'youtube' && !schema.sameAs.includes(s.url)) {
        schema.sameAs.push(s.url);
      }
    });
  }
  return schema;
}

function breadcrumbSchema(segments) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((seg, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: seg.name,
      item: pageUrl(seg.path),
    })),
  };
}

function metaDefaults(title, description, ogType, pagePath) {
  const canonical = pagePath === '/' ? BASE_URL + '/' : BASE_URL + pagePath + '/';
  return {
    title,
    description,
    ogType,
    canonical,
    ogImage: BASE_URL + data.seo.defaultOgImage,
    jsonLd: JSON.stringify(personSchema()),
  };
}

/* ------------------------------------------------------------------ */
/* Page builders                                                       */
/* ------------------------------------------------------------------ */

const routes = [];

function register(relFile, pagePath) {
  routes.push({ loc: pageUrl(pagePath), lastmod: buildDate });
}

const buildDate = new Date().toISOString().slice(0, 10);

/* Home */
function buildHome() {
  const hero = data.site.hero;
  const [firstName, ...rest] = (hero.name || 'Sabarna Barik').split(' ');
  const lastName = rest.join(' ') || 'Barik';
  const name = hero.name || 'Sabarna Barik';

  const cta = hero.cta || [];
  const ctaPrimary = cta[0]
    ? `<a class="btn btn--primary" href="${BASE_PATH}${cta[0].target}/">${esc(cta[0].label)}</a>`
    : '';
  const ctaSecondary = cta[1]
    ? `<a class="btn btn--secondary" href="${BASE_PATH}${cta[1].target}/">${esc(cta[1].label)}</a>`
    : '';

  const techIcons = featured(skills)
    .slice(0, 3)
    .map(
      (s) =>
        `<span class="hero__tech"><span class="material-symbols-outlined" aria-hidden="true" style="font-size:20px">${skillIcon(s.id)}</span> ${esc(s.name)}</span>`
    )
    .join('');

  const stat = (value, label) =>
    `<div class="stat reveal"><div class="stat__value counter" data-target="${value}">0</div><div class="stat__label">${label}</div></div>`;
  const stats =
    stat(projects.length, 'Projects Completed') +
    stat(certificates.length, 'Certificates Earned') +
    stat(experience.length, 'Internships Completed');

  const featuredProjects = featured(projects);
  const featuredSkills = featured(skills);
  const featuredCerts = featured(certificates);

  const processSteps = [
    { icon: 'menu_book', title: 'Learn Fundamentals', text: 'Deep diving into the “why” before touching the keyboard.' },
    { icon: 'construction', title: 'Build Something Real', text: 'Applying theoretical knowledge to tangible, working prototypes.' },
    { icon: 'rocket_launch', title: 'Ship & Document', text: 'Making code production-ready and clearly explainable.' },
    { icon: 'loop', title: 'Reflect & Iterate', text: 'Continuous refinement based on feedback and results.' },
  ];
  const processCards = processSteps
    .map(
      (step, i) =>
        `<div class="process-card reveal" data-delay="${i}"><div class="process-card__icon" aria-hidden="true"><span class="material-symbols-outlined" style="font-size:24px">${step.icon}</span></div><h4>${step.title}</h4><p>${step.text}</p></div>`
    )
    .join('');

  let featuredProjectsSection = '';
  if (featuredProjects.length) {
    const chips = featuredProjects
      .flatMap((p) => p.tags || [])
      .filter((t, i, a) => a.indexOf(t) === i)
      .slice(0, 3)
      .map((t) => `<span class="filter-chip" aria-hidden="true">${esc(t[0].toUpperCase() + t.slice(1))}</span>`)
      .join('');
    featuredProjectsSection = `<section class="section">
  <div class="container">
    <div class="section-head__row reveal">
      <div>
        <h2 class="section-head__title">Featured Projects</h2>
        <p class="section-head__lede">Highlighting selected works that demonstrate my technical approach.</p>
      </div>
      <div class="filterbar" style="padding:0">${chips}</div>
    </div>
    <div class="grid grid--3">
      ${featuredProjects.map((p) => renderProjectCard(p, BASE_PATH)).join('')}
    </div>
    <div class="section-head" style="text-align:center;margin-top:var(--space-12)">
      <a class="btn btn--tertiary" href="${BASE_PATH}/projects/">View All Projects &rarr;</a>
    </div>
  </div>
</section>`;
  }

  let featuredSkillsSection = '';
  if (featuredSkills.length) {
    featuredSkillsSection = `<section class="section">
  <div class="container">
    <div class="section-head__row reveal">
      <div>
        <h2 class="section-head__title">Featured Skills</h2>
        <p class="section-head__lede">Core competencies I reach for every day.</p>
      </div>
      <a class="btn btn--tertiary" href="${BASE_PATH}/skills/">Full skill matrix &rarr;</a>
    </div>
    <div class="grid grid--3">
      ${featuredSkills.map((s) => renderSkillCard(s, BASE_PATH)).join('')}
    </div>
  </div>
</section>`;
  }

  let featuredCertsSection = '';
  if (featuredCerts.length) {
    featuredCertsSection = `<section class="section section--alt">
  <div class="container">
    <div class="section-head__row reveal">
      <div>
        <h2 class="section-head__title">Latest Credentials</h2>
        <p class="section-head__lede">Verifiable certificates that back my skills.</p>
      </div>
      <a class="btn btn--tertiary" href="${BASE_PATH}/certificates/">View all certificates &rarr;</a>
    </div>
    <div class="grid grid--2">
      ${featuredCerts.map((c) => renderCertCard(c)).join('')}
    </div>
  </div>
</section>`;
  }

  const ctx = {
    hero_visual: renderAvatar(BASE_PATH),
    hero_kicker: esc(hero.kicker || ''),
    hero_name_first: esc(firstName),
    hero_name_last: esc(lastName),
    hero_tagline: esc(hero.tagline || ''),
    cta_primary: ctaPrimary,
    cta_secondary: ctaSecondary,
    tech_icons: techIcons,
    stats,
    featured_projects_section: featuredProjectsSection,
    process_cards: processCards,
    featured_skills_section: featuredSkillsSection,
    featured_certificates_section: featuredCertsSection,
    cert_data_json: JSON.stringify(certificates),
    socials_url: BASE_PATH + '/socials/',
  };

  const meta = metaDefaults(
    data.seo.defaultTitle,
    data.seo.defaultDescription,
    'website',
    '/'
  );
  meta.jsonLd = JSON.stringify([personSchema(), {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: name,
    url: BASE_URL + '/',
  }]);

  writeFile('index.html', renderPage('pages/index.html', '/', meta, ctx));
  register('index.html', '/');
}

/* About */
function buildAbout() {
  const about = data.about;
  const ctx = {
    eyebrow: 'Who I Am',
    heading: esc(about.heading || 'About'),
    intro: esc(about.intro || ''),
    body: (about.body || []).map((p) => `<p class="reveal">${esc(p)}</p>`).join(''),
    philosophy: esc(about.philosophy || ''),
    interests: (about.interests || [])
      .map((t) => `<span class="tag">${esc(t)}</span>`)
      .join(''),
  };
  const meta = metaDefaults(
    'About — ' + data.seo.person.name,
    'Learn about Sabarna Barik, a Computer Science student who learns by building real things.',
    'website',
    '/about'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
  ]);
  writeFile('about/index.html', renderPage('pages/about.html', '/about', meta, ctx));
  register('about/index.html', '/about');
}

/* Education */
function buildEducation() {
  const items = education
    .map((e) => {
      const years =
        (e.startYear ? String(e.startYear) : '') +
        ' \u2013 ' +
        (e.endYear ? String(e.endYear) : 'Present');
      const statusLabel = e.status === 'current' ? 'Current' : e.status === 'upcoming' ? 'Upcoming' : 'Completed';
      const statusClass =
        e.status === 'current' ? ' timeline__status--current' : '';
      return `<li class="timeline__item reveal">
        <span class="timeline__dot" aria-hidden="true"></span>
        <div class="timeline__card">
          <div class="timeline__meta">
            <span class="timeline__years">${esc(years)}</span>
            <span class="timeline__status${statusClass}">${statusLabel}</span>
          </div>
          <h3>${esc(e.level)}</h3>
          <p class="timeline__institution">${esc(e.institution)} &middot; ${esc(e.board)}</p>
          ${e.description ? `<p>${esc(e.description)}</p>` : ''}
          ${e.result ? `<p class="timeline__result"><strong>Result:</strong> ${esc(e.result)}</p>` : ''}
        </div>
      </li>`;
    })
    .join('');
  const ctx = { heading: 'Education', timeline: items };
  const meta = metaDefaults(
    'Education — ' + data.seo.person.name,
    'Academic background of Sabarna Barik, including his Diploma in Computer Science & Technology at Contai Polytechnic.',
    'website',
    '/education'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Education', path: '/education' },
    ]),
  ]);
  writeFile('education/index.html', renderPage('pages/education.html', '/education', meta, ctx));
  register('education/index.html', '/education');
}

/* Skills */
function buildSkills() {
  const groups = skillsByCategory
    .map(
      (g) => `<div class="skill-group reveal">
        <div class="skill-group__title">
          <h2>${esc(g.category)}</h2>
          <span class="skill-group__count">${g.items.length}</span>
        </div>
        <div class="grid grid--3">
          ${g.items.map((s) => renderSkillCard(s, BASE_PATH)).join('')}
        </div>
      </div>`
    )
    .join('');
  const construction = `<div class="construction reveal">
        <span class="material-symbols-outlined construction__icon" aria-hidden="true">construction</span>
        <h2>This section is under construction</h2>
        <p>I'm still organising my skill set — the full matrix with topics and icons is being worked on and will take some time. Everything else on this site is ready to explore.</p>
        <a class="btn btn--secondary" href="${BASE_PATH}/projects/">Browse my projects &rarr;</a>
      </div>`;
  const ctx = {
    heading: 'Skills',
    lede: skills.length
      ? 'Skills grouped by category — without arbitrary percentages. Every skill links to the topics it covers and the work that uses it.'
      : 'This page is being built — I am currently working on organising and adding my skills, so please check back soon.',
    skill_content: skills.length ? groups : construction,
  };
  const meta = metaDefaults(
    'Skills — ' + data.seo.person.name,
    'Skills of Sabarna Barik across programming languages, web technologies, databases, CS fundamentals, and tools.',
    'website',
    '/skills'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Skills', path: '/skills' },
    ]),
  ]);
  writeFile('skills/index.html', renderPage('pages/skills.html', '/skills', meta, ctx));
  register('skills/index.html', '/skills');
}

/* Skill detail */
function buildSkillDetail(skill) {
  const used = usedBySkill(skill.id);
  const topics = (skill.topicsLearned || [])
    .map(
      (t) => `<div class="topic-item reveal">
        <span class="material-symbols-outlined" aria-hidden="true" style="font-size:20px">check_circle</span>
        <span>${esc(t)}</span>
      </div>`
    )
    .join('');

  const usedMarkup = [
    ...used.projects.map(
      (p) => `<a class="card" href="${BASE_PATH}/projects/${p.id}/">
        <div class="card__media card__media--icon">
          <span class="material-symbols-outlined" aria-hidden="true" style="font-size:56px">code_blocks</span>
        </div>
        <div class="card__body">
          <h3 class="card__title">${esc(p.title)}</h3>
          <p class="card__text">${esc(p.summary || '')}</p>
          <div class="tags card__footer">${tagsMarkup(p.techStack, 3)}</div>
        </div>
      </a>`
    ),
    ...used.certificates.map(
      (c) => `<a class="card" href="${BASE_PATH}/certificates/">
        <div class="card__media card__media--icon">
          <span class="material-symbols-outlined" aria-hidden="true" style="font-size:56px">workspace_premium</span>
        </div>
        <div class="card__body">
          <h3 class="card__title">${esc(c.title)}</h3>
          <p class="card__text">${esc(c.issuer)} &middot; ${esc(c.platform)}</p>
          <div class="tags card__footer"><span class="tag">${esc(c.platform)}</span></div>
        </div>
      </a>`
    ),
  ].join('');

  const usedEmpty =
    usedMarkup === ''
      ? '<p style="color:var(--color-text-muted)">No published projects or certificates reference this skill yet.</p>'
      : '';

  const ctx = {
    breadcrumb: `<ol>
      <li><a href="${BASE_PATH}/">Home</a></li>
      <li><a href="${BASE_PATH}/skills/">Skills</a></li>
      <li aria-current="page">${esc(skill.name)}</li>
    </ol>`,
    eyebrow: 'Core Competency',
    skill_name: esc(skill.name),
    note: esc(skill.note || ''),
    topic_count: (skill.topicsLearned || []).length,
    used_count: used.projects.length + used.certificates.length,
    icon: skillIconBlock(skill, 56),
    topics,
    used_in: usedMarkup,
    used_empty: usedEmpty,
  };

  const meta = metaDefaults(
    skill.name + ' — ' + data.seo.person.name,
    (skill.note ||
      `${skill.name} — topics covered and the projects it appears in.`).slice(0, 158),
    'website',
    '/skills/' + skill.id
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Skills', path: '/skills' },
      { name: skill.name, path: '/skills/' + skill.id },
    ]),
  ]);
  writeFile(`skills/${skill.id}/index.html`, renderPage('pages/skill-detail.html', '/skills/' + skill.id, meta, ctx));
  register(`skills/${skill.id}/index.html`, '/skills/' + skill.id);
}

/* Projects */
function buildProjects() {
  const chips = projectSkillChips;
  const ctx = {
    heading: 'Projects',
    lede: 'A curated collection of things I have built — each one documented with its problem, stack, and what I learned. Filter by the skill behind each project.',
    filter_chips: chips,
    project_cards: projects.map((p) => renderProjectCard(p, BASE_PATH)).join(''),
    empty_filter: '',
  };
  const meta = metaDefaults(
    'Projects — ' + data.seo.person.name,
    'Projects built by Sabarna Barik — web apps, tools, and academic work, each with code and walkthroughs.',
    'website',
    '/projects'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Projects', path: '/projects' },
    ]),
  ]);
  writeFile('projects/index.html', renderPage('pages/projects.html', '/projects', meta, ctx));
  register('projects/index.html', '/projects');
}

/* Project detail */
function buildProjectDetail(project) {
  const vid = youtubeId(project.youtubeUrl);
  const techStack = tagsMarkup(project.techStack);
  const skillLinks = (project.skillIds || [])
    .map((sid) => {
      const skill = skills.find((s) => s.id === sid);
      return skill
        ? `<li><a href="${BASE_PATH}/skills/${skill.id}/">${esc(skill.name)}</a></li>`
        : '';
    })
    .join('');

  const skillsBlock = skillLinks
    ? `<div class="sidebar-card reveal">
        <h3>Built With Skills</h3>
        <ul class="sidebar-card__list">
          ${skillLinks}
        </ul>
      </div>`
    : '';

  const githubButton = project.githubUrl
    ? `<a class="btn btn--primary" href="${esc(project.githubUrl)}" target="_blank" rel="noopener noreferrer">View on GitHub</a>`
    : '';

  const demoStatus = project.liveDemoUrl
    ? `<a class="btn btn--secondary" href="${esc(project.liveDemoUrl)}" target="_blank" rel="noopener noreferrer">View Live Demo</a>`
    : '<span class="btn btn--secondary" style="pointer-events:none">No live demo yet — watch the walkthrough above.</span>';

  const ctx = {
    breadcrumb: `<ol>
      <li><a href="${BASE_PATH}/">Home</a></li>
      <li><a href="${BASE_PATH}/projects/">Projects</a></li>
      <li aria-current="page">${esc(project.title)}</li>
    </ol>`,
    category_eyebrow: esc(project.category || 'Project'),
    project_title: esc(project.title),
    summary: esc(project.summary || ''),
    hero_image: project.image
      ? `<img class="detail-hero__img" src="${assetUrl(project.image)}" alt="${esc(
          project.title + ' — ' + (project.summary || '')
        )}" loading="lazy" width="1120" height="630">`
      : '',
    tech_stack: techStack,
    github_button: githubButton,
    video_anchor: '#walkthrough',
    demo_status: project.liveDemoUrl ? '' : 'No live demo yet — watch the walkthrough above.',
    video_facade: vid
      ? `<button class="video-facade reveal" type="button" data-video-id="${vid}" aria-label="Play video: ${esc(project.title)} walkthrough">
          <span class="video-facade__overlay">
            <span class="video-facade__play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="40" height="40"><path d="M8 5v14l11-7z"/></svg></span>
            <span class="video-facade__label">Watch Walkthrough</span>
          </span>
        </button>`
      : '<p style="color:var(--color-text-muted)">Walkthrough video unavailable.</p>',
    description: (project.description || []).map((p) => `<p>${esc(p)}</p>`).join(''),
    problem_block: project.problem
      ? `<h3>Problem</h3><p>${esc(project.problem)}</p>`
      : '',
    why_block: project.whyBuilt
      ? `<h3>Why I Built It</h3><p>${esc(project.whyBuilt)}</p>`
      : '',
    skills_block: skillsBlock,
    demo_button_or_status: project.liveDemoUrl
      ? `<a class="btn btn--secondary" href="${esc(project.liveDemoUrl)}" target="_blank" rel="noopener noreferrer">View Live Demo</a>`
      : demoStatus,
    what_learned: esc(project.whatLearned || ''),
  };

  const meta = metaDefaults(
    project.title + ' — ' + data.seo.person.name,
    (project.summary || '').slice(0, 158),
    'article',
    '/projects/' + project.id
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Projects', path: '/projects' },
      { name: project.title, path: '/projects/' + project.id },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.summary || '',
      author: { '@type': 'Person', name: data.seo.person.name },
      url: pageUrl('/projects/' + project.id),
    },
  ]);
  writeFile(`projects/${project.id}/index.html`, renderPage('pages/project-detail.html', '/projects/' + project.id, meta, ctx));
  register(`projects/${project.id}/index.html`, '/projects/' + project.id);
}

/* Certificates */
function buildCertificates() {
  const chips = [
    ...certPlatforms.map(
      (p) =>
        `<button class="filter-chip" type="button" data-filter="${esc(p.toLowerCase())}" aria-pressed="false">${esc(p)}</button>`
    ),
    ...certYears.map(
      (y) =>
        `<button class="filter-chip" type="button" data-filter="${y}" aria-pressed="false">${y}</button>`
    ),
  ].join('');

  const cards = certificates.map((c) => renderCertCard(c)).join('');

  const ctx = {
    heading: 'Certificates',
    filter_chips: chips,
    certificate_cards: cards,
    cert_data_json: JSON.stringify(certificates),
  };

  const meta = metaDefaults(
    'Certificates — ' + data.seo.person.name,
    'Verified certificates earned by Sabarna Barik — credentials from platforms like Coursera and edX.',
    'website',
    '/certificates'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Certificates', path: '/certificates' },
    ]),
  ]);
  writeFile('certificates/index.html', renderPage('pages/certificates.html', '/certificates', meta, ctx));
  register('certificates/index.html', '/certificates');
}

/* Achievements */
function buildAchievements() {
  const items = achievements
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(
      (a) => `<li class="achievement-item reveal">
        <div class="achievement-item__meta">
          <span class="achievement-item__category">${esc(a.category || '')}</span>
          <time datetime="${esc(a.date || '')}">${esc(formatDate(a.date))}</time>
        </div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.organization)}</p>
        <p>${esc(a.description || '')}</p>
        ${a.proofUrl ? `<p><a href="${esc(a.proofUrl)}" target="_blank" rel="noopener noreferrer">View proof &rarr;</a></p>` : ''}
      </li>`
    )
    .join('');
  const ctx = { heading: 'Achievements', achievements: items };
  const meta = metaDefaults(
    'Achievements — ' + data.seo.person.name,
    'Achievements and honors of Sabarna Barik — competitions, open-source contributions, and academic milestones.',
    'website',
    '/achievements'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Achievements', path: '/achievements' },
    ]),
  ]);
  writeFile('achievements/index.html', renderPage('pages/achievements.html', '/achievements', meta, ctx));
  register('achievements/index.html', '/achievements');
}

/* Experience (only if published entries exist — SR-20) */
function buildExperience() {
  if (!experience.length) return;
  const items = experience
    .slice()
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
    .map(
      (x) => `<li class="achievement-item reveal">
        <div class="achievement-item__meta">
          <span class="achievement-item__category">${esc(x.role || '')}</span>
          <time datetime="${esc(x.startDate || '')}">${esc(x.startDate || '')}${x.endDate ? ' \u2013 ' + esc(x.endDate) : ' \u2013 Present'}</time>
        </div>
        <h3>${esc(x.organization)}</h3>
        ${x.description ? `<p>${esc(x.description)}</p>` : ''}
        ${(x.highlights || []).map((h) => `<p>${esc(h)}</p>`).join('')}
      </li>`
    )
    .join('');
  const ctx = { heading: 'Experience', experience: items };
  const meta = metaDefaults(
    'Experience — ' + data.seo.person.name,
    'Professional experience of Sabarna Barik.',
    'website',
    '/experience'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Experience', path: '/experience' },
    ]),
  ]);
  writeFile('experience/index.html', renderPage('pages/experience.html', '/experience', meta, ctx));
  register('experience/index.html', '/experience');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* Socials */
function buildSocials() {
  const email = data.socials.email;
  const cards = [];

  if (email && email.visible) {
    cards.push(`<div class="social-card reveal">
      <div class="social-card__icon" aria-hidden="true">${iconMarkup('email')}</div>
      <h3>Email</h3>
      <p>${esc(email.address)}</p>
      <div class="social-card__action btn-group">
        <a class="btn btn--primary" href="mailto:${esc(email.address)}">Email</a>
        <button class="btn btn--secondary" type="button" data-copy-email="${esc(email.address)}">Copy Email</button>
      </div>
      <span class="visually-hidden" aria-live="polite" data-copy-live></span>
    </div>`);
  }

  visibleSocials.forEach((s) => {
    cards.push(`<a class="social-card reveal" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">
      <div class="social-card__icon" aria-hidden="true">${iconMarkup(s.id)}</div>
      <h3>${esc(s.label)}</h3>
      <p>${esc(s.url)}</p>
      <div class="social-card__action"><span class="btn btn--secondary">Visit Profile</span></div>
    </a>`);
  });

  const ctx = { heading: 'Socials & Contact', social_cards: cards.join('') };
  const meta = metaDefaults(
    'Socials & Contact — ' + data.seo.person.name,
    'Contact Sabarna Barik by email, and follow his GitHub, LinkedIn, LeetCode, and Codeforces profiles.',
    'website',
    '/socials'
  );
  meta.jsonLd = JSON.stringify([
    personSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Socials', path: '/socials' },
    ]),
  ]);
  writeFile('socials/index.html', renderPage('pages/socials.html', '/socials', meta, ctx));
  register('socials/index.html', '/socials');
}

/* 404 */
function build404() {
  const ctx = {
    home_url: BASE_PATH + '/',
    projects_url: BASE_PATH + '/projects/',
  };
  const meta = metaDefaults(
    'Page Not Found — ' + data.seo.person.name,
    'The page you are looking for does not exist.',
    'website',
    '/404'
  );
  writeFile('404.html', renderPage('pages/404.html', '/404', meta, ctx));
}

/* ------------------------------------------------------------------ */
/* SEO artifacts                                                       */
/* ------------------------------------------------------------------ */

function buildSitemap() {
  const urls = routes
    .filter((r) => !r.loc.endsWith('/404/'))
    .map(
      (r) =>
        `  <url>\n    <loc>${r.loc}</loc>\n    <lastmod>${r.lastmod}</lastmod>\n  </url>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  writeFile('sitemap.xml', xml);
}

function buildRobots() {
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  writeFile('robots.txt', txt);
}

/* ------------------------------------------------------------------ */
/* Asset copy                                                          */
/* ------------------------------------------------------------------ */

function copyAssets() {
  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
      const from = path.join(src, entry.name);
      const to = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDir(from, to);
      else fs.copyFileSync(from, to);
    });
  };
  copyDir(ASSETS_DIR, path.join(DIST_DIR, 'assets'));
}

/* ------------------------------------------------------------------ */
/* Run                                                                */
/* ------------------------------------------------------------------ */

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

console.log('Building Sabarna Barik portfolio...\n');
console.log(`  Base URL:  ${BASE_URL}`);
console.log(`  Base path: ${BASE_PATH || '/'}\n`);

buildHome();
buildAbout();
buildEducation();
buildSkills();
skills.forEach(buildSkillDetail);
buildProjects();
projects.forEach(buildProjectDetail);
buildCertificates();
buildAchievements();
buildExperience();
buildSocials();
build404();
buildSitemap();
buildRobots();
copyAssets();

const htmlCount = fs
  .readdirSync(DIST_DIR, { recursive: true })
  .filter((f) => String(f).endsWith('.html')).length;

console.log(`  Pre-rendered ${htmlCount} HTML pages`);
console.log(`  Routes in sitemap: ${routes.length}`);
console.log('  Done.');
