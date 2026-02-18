// src/services/sitemap.service.js

const { SitemapStream, streamToPromise } = require('sitemap');

async function generateSitemap() {
  const baseUrl = 'https://inviteera.com';

  const smStream = new SitemapStream({
    hostname: baseUrl,
  });

  // --------------------
  // STATIC PAGES
  // --------------------
  smStream.write({ url: '/', priority: 1.0, changefreq: 'daily' });
  smStream.write({ url: '/templates', priority: 0.9 });
  smStream.write({ url: '/pricing', priority: 0.8 });
  smStream.write({ url: '/about', priority: 0.7 });
  smStream.write({ url: '/contact', priority: 0.7 });

  // --------------------
  // TEMPLATES
  // --------------------
  const templates = await getPublishedTemplates();

  templates.forEach((template) => {
    smStream.write({
      url: `/templates/${template.slug}`,
      lastmod: template.updatedAt,
      priority: 0.85,
      changefreq: 'weekly',
    });
  });

  // --------------------
  // WEDDING INVITES
  // --------------------
  const weddings = await getPublishedWeddings();

  weddings.forEach((wedding) => {
    smStream.write({
      url: `/invite/${wedding.slug}`,
      lastmod: wedding.updatedAt,
      priority: 0.6,
      changefreq: 'weekly',
    });
  });

  smStream.end();

  const sitemap = await streamToPromise(smStream);
  return sitemap.toString();
}

// Replace with real DB queries
async function getPublishedTemplates() {
  return [
    { slug: 'royal-red', updatedAt: new Date() },
    { slug: 'floral-elegance', updatedAt: new Date() },
  ];
}

async function getPublishedWeddings() {
  return [
    { slug: 'rahul-weds-priya', updatedAt: new Date() },
    { slug: 'amit-weds-neha', updatedAt: new Date() },
  ];
}

module.exports = { generateSitemap };
