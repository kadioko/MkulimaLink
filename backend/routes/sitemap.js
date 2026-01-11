const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const { getLanguages } = require('../../frontend/src/i18n');

/**
 * Generate XML sitemap for SEO
 */

// Base URL
const BASE_URL = process.env.FRONTEND_URL || 'https://mkulimalink.co.tz';

// Static pages
const staticPages = [
  { url: '', priority: 1.0, changefreq: 'daily' },
  { url: '/about', priority: 0.8, changefreq: 'monthly' },
  { url: '/products', priority: 0.9, changefreq: 'daily' },
  { url: '/market', priority: 0.8, changefreq: 'hourly' },
  { url: '/weather', priority: 0.7, changefreq: 'hourly' },
  { url: '/login', priority: 0.6, changefreq: 'monthly' },
  { url: '/register', priority: 0.6, changefreq: 'monthly' },
  { url: '/premium', priority: 0.7, changefreq: 'weekly' },
  { url: '/group-buying', priority: 0.8, changefreq: 'daily' },
  { url: '/equipment', priority: 0.8, changefreq: 'daily' },
  { url: '/loans', priority: 0.7, changefreq: 'weekly' },
  { url: '/insurance', priority: 0.7, changefreq: 'weekly' },
  { url: '/suppliers', priority: 0.8, changefreq: 'weekly' }
];

// Helper function to escape XML
const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Helper function to format date
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Generate URL entry
const generateUrl = (page) => {
  return `
    <url>
      <loc>${escapeXml(BASE_URL + page.url)}</loc>
      <lastmod>${page.lastmod ? formatDate(page.lastmod) : formatDate(new Date())}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`;
};

// Generate sitemap index
const generateSitemapIndex = (sitemaps) => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  sitemaps.forEach(sitemap => {
    xml += `
  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>
    <lastmod>${formatDate(sitemap.lastmod || new Date())}</lastmod>
  </sitemap>`;
  });

  xml += `
</sitemapindex>`;

  return xml;
};

// Generate products sitemap
const generateProductsSitemap = async () => {
  try {
    const products = await Product.find({ status: 'available' })
      .select('_id updatedAt')
      .lean();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add products
    products.forEach(product => {
      xml += generateUrl({
        url: `/products/${product._id}`,
        lastmod: product.updatedAt,
        changefreq: 'daily',
        priority: 0.7
      });
    });

    xml += `
</urlset>`;

    return xml;
  } catch (error) {
    console.error('Error generating products sitemap:', error);
    return null;
  }
};

// Generate categories sitemap
const generateCategoriesSitemap = async () => {
  try {
    const categories = await Product.distinct('category');
    const regions = await Product.distinct('location.region');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Category pages
    categories.forEach(category => {
      xml += generateUrl({
        url: `/products?category=${encodeURIComponent(category)}`,
        changefreq: 'daily',
        priority: 0.8
      });
    });

    // Region pages
    regions.forEach(region => {
      xml += generateUrl({
        url: `/products?region=${encodeURIComponent(region)}`,
        changefreq: 'daily',
        priority: 0.8
      });
    });

    // Category + Region combinations
    categories.forEach(category => {
      regions.forEach(region => {
        xml += generateUrl({
          url: `/products?category=${encodeURIComponent(category)}&region=${encodeURIComponent(region)}`,
          changefreq: 'daily',
          priority: 0.7
        });
      });
    });

    xml += `
</urlset>`;

    return xml;
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    return null;
  }
};

// Generate main sitemap
const generateMainSitemap = async () => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static pages
  staticPages.forEach(page => {
    xml += generateUrl(page);
  });

  xml += `
</urlset>`;

  return xml;
};

// Generate multilingual sitemap
const generateMultilingualSitemap = async () => {
  const languages = ['en', 'sw'];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  staticPages.forEach(page => {
    xml += `
    <url>
      <loc>${escapeXml(BASE_URL + page.url)}</loc>
      <lastmod>${formatDate(new Date())}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>`;
    
    // Add alternate language versions
    languages.forEach(lang => {
      xml += `
      <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(BASE_URL + '/' + lang + page.url)}" />`;
    });
    
    xml += `
    </url>`;
  });

  xml += `
</urlset>`;

  return xml;
};

// Routes
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemapIndex = generateSitemapIndex([
      { loc: `${BASE_URL}/sitemap-main.xml`, lastmod: new Date() },
      { loc: `${BASE_URL}/sitemap-products.xml`, lastmod: new Date() },
      { loc: `${BASE_URL}/sitemap-categories.xml`, lastmod: new Date() },
      { loc: `${BASE_URL}/sitemap-multilingual.xml`, lastmod: new Date() }
    ]);

    res.header('Content-Type', 'application/xml');
    res.send(sitemapIndex);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemap-main.xml', async (req, res) => {
  try {
    const sitemap = await generateMainSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating main sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemap-products.xml', async (req, res) => {
  try {
    const sitemap = await generateProductsSitemap();
    if (sitemap) {
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } else {
      res.status(500).send('Error generating products sitemap');
    }
  } catch (error) {
    console.error('Error generating products sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemap-categories.xml', async (req, res) => {
  try {
    const sitemap = await generateCategoriesSitemap();
    if (sitemap) {
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } else {
      res.status(500).send('Error generating categories sitemap');
    }
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemap-multilingual.xml', async (req, res) => {
  try {
    const sitemap = await generateMultilingualSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating multilingual sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Allow: /api/docs
Disallow: /api/
Disallow: /admin/
Disallow: /login
Disallow: /register
Disallow: /_next/
Disallow: /static/

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-main.xml
Sitemap: ${BASE_URL}/sitemap-products.xml
Sitemap: ${BASE_URL}/sitemap-categories.xml
Sitemap: ${BASE_URL}/sitemap-multilingual.xml

# Crawl delay (be nice to our server)
Crawl-delay: 1`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

module.exports = router;
