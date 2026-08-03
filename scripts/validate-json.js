'use strict';

/**
 * validate-json.js
 * Lightweight, non-blocking schema validation for the 10 /data JSON files.
 * Prints console warnings only — never throws for missing optional content
 * (NFR-9: the build never fails over content completeness).
 */

const REQUIRED = {
  site: ['siteName', 'baseUrl', 'hero', 'nav'],
  about: ['heading', 'intro', 'body'],
  education: [],
  skills: [],
  projects: [],
  certificates: [],
  achievements: [],
  experience: [],
  socials: ['email', 'links'],
  seo: ['siteName', 'baseUrl', 'defaultTitle', 'defaultDescription', 'defaultOgImage', 'person'],
};

function field(obj, key) {
  if (obj && typeof obj === 'object' && key in obj && obj[key] !== null) return true;
  return false;
}

function validateFile(name, doc) {
  const warnings = [];
  const required = REQUIRED[name] || [];

  if (Array.isArray(doc)) {
    doc.forEach((entry, i) => {
      if (entry && field(entry, 'published') === false) return;
      if (entry && !field(entry, 'id')) {
        warnings.push(`${name}.json[${i}] is missing required field "id"`);
      }
    });
    return warnings;
  }

  required.forEach((key) => {
    if (!field(doc, key)) {
      warnings.push(`${name}.json is missing required field "${key}"`);
    }
  });

  if (doc && Array.isArray(doc.skills)) {
    doc.skills.forEach((s, i) => {
      if (!s || s.published === false) return;
      if (!field(s, 'category')) {
        warnings.push(`skills.json[${i}] (${s && s.name}) is missing "category"`);
      }
    });
  }
  return warnings;
}

function validateAll(data) {
  const warnings = [];
  Object.keys(data).forEach((name) => {
    warnings.push(...validateFile(name, data[name]));
  });
  return warnings;
}

module.exports = { validateAll };
