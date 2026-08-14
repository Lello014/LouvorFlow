const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

export interface Artista {
  nome: string;
  slug: string;
}

export interface Musica {
  titulo: string;
  slug: string;
  url: string;
}

export interface CifraCompleta {
  titulo: string;
  artista: string;
  tom: string;
  conteudo: string;
  youtube_url?: string;
  url_original: string;
}

export async function buscarArtistas(termo?: string): Promise<Artista[]> {
  try {
    const url = termo
      ? `${API_BASE}/api/artistas/buscar?q=${encodeURIComponent(termo)}`
      : `${API_BASE}/api/artistas`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao buscar artistas');
    const data = await response.json();
    return data.artistas || [];
  } catch (error) {
    console.error('Erro ao buscar artistas:', error);
    return [];
  }
}

export async function buscarMusicasArtista(slug: string): Promise<Musica[]> {
  try {
    const response = await fetch(`${API_BASE}/api/musicas?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error('Erro ao buscar músicas');
    const data = await response.json();
    return data.musicas || [];
  } catch (error) {
    console.error('Erro ao buscar músicas:', error);
    return [];
  }
}

export async function buscarCifraPorUrl(url: string): Promise<CifraCompleta | null> {
  try {
    const response = await fetch(`${API_BASE}/api/cifra?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Erro ao buscar cifra');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar cifra:', error);
    return null;
  }
}
