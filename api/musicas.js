const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.cifraclub.com.br';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ erro: 'Slug do artista e obrigatorio.' });
  }

  try {
    const response = await axios.get(BASE_URL + '/' + slug + '/musicas.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const musicas = [];
    const hrefPattern = new RegExp('^/' + slug + '/[^/]+/$');

    $('a[href]').each(function () {
      const href = $(this).attr('href');
      if (href && hrefPattern.test(href)) {
        const titulo = $(this).text().trim().replace(/^\d+/, '');
        if (titulo) {
          const songSlug = href.replace('/' + slug + '/', '').replace(/\//g, '');
          musicas.push({
            titulo: titulo,
            slug: songSlug,
            url: BASE_URL + href,
          });
        }
      }
    });

    return res.status(200).json({ musicas: musicas });
  } catch (error) {
    console.error('Erro ao buscar musicas de ' + slug + ':', error.message);
    return res.status(500).json({ erro: 'Erro ao buscar musicas do artista.' });
  }
};
