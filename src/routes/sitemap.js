const express = require('express');
const { generateSitemap } = require('../services/sitemap.service');

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
