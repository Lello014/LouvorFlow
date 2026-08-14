import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.cifraclub.com.br';

async function buscarCifraCompleta(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    const titulo = $('h1').first().text().trim();

    let artista = '';
    const artistaElement = $('h2').filter(function () {
      return !$(this).text().includes('Menu') && !$(this).text().includes('menu');
    }).first();
    if (artistaElement.length) {
      artista = artistaElement.text().trim();
    }

    let conteudo = '';
    const preElement = $('pre');
    if (preElement.length) {
      conteudo = preElement.first().text();
    }

    let tom = '';
    const tomElement = $('.cifra_tuning, .tuning .key');
    if (tomElement.length) {
      tom = tomElement.text().trim();
    }

    let youtubeUrl = '';
    const youtubeLink = $('a[href*="youtube.com"], a[href*="youtu.be"]');
    if (youtubeLink.length) {
      youtubeUrl = youtubeLink.first().attr('href');
    }

    return {
      titulo,
      artista,
      tom,
      conteudo,
      youtube_url: youtubeUrl,
      url_original: url,
    };
  } catch (error) {
    console.error('Erro ao buscar cifra:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, artist, song } = req.query;

  let cifraUrl = url;

  if (!cifraUrl && artist && song) {
    cifraUrl = `${BASE_URL}/${artist}/${song}/`;
  }

  if (!cifraUrl) {
    return res.status(400).json({ erro: 'Parâmetro "url" ou "artist" e "song" são obrigatórios.' });
  }

  try {
    const cifra = await buscarCifraCompleta(cifraUrl);
    if (cifra && cifra.conteudo) {
      return res.status(200).json(cifra);
    } else {
      return res.status(404).json({ erro: 'Cifra não encontrada.' });
    }
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar cifra.' });
  }
}
