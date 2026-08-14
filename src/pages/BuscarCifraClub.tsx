import React, { useState, useEffect } from 'react';
import {
  buscarArtistas,
  buscarMusicasArtista,
  buscarCifraPorUrl,
  type Artista,
  type Musica,
  type CifraCompleta,
} from '../services/cifraclubService';

interface BuscarCifraClubProps {
  onImportarCifra: (cifra: {
    titulo: string;
    artista: string;
    tom: string;
    conteudo: string;
    youtube_url?: string;
  }) => void;
}

export default function BuscarCifraClub({ onImportarCifra }: BuscarCifraClubProps) {
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [buscaArtista, setBuscaArtista] = useState('');
  const [artistaSelecionado, setArtistaSelecionado] = useState<Artista | null>(null);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [buscaMusica, setBuscaMusica] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [cifraSelecionada, setCifraSelecionada] = useState<CifraCompleta | null>(null);
  const [carregandoCifra, setCarregandoCifra] = useState(false);

  useEffect(() => {
    const carregarArtistas = async () => {
      const lista = await buscarArtistas(buscaArtista || undefined);
      setArtistas(lista);
    };
    carregarArtistas();
  }, [buscaArtista]);

  const handleSelecionarArtista = async (artista: Artista) => {
    setArtistaSelecionado(artista);
    setCarregando(true);
    setCifraSelecionada(null);
    const lista = await buscarMusicasArtista(artista.slug);
    setMusicas(lista);
    setCarregando(false);
  };

  const handleVoltar = () => {
    setArtistaSelecionado(null);
    setMusicas([]);
    setCifraSelecionada(null);
    setBuscaMusica('');
  };

  const handleSelecionarMusica = async (musica: Musica) => {
    setCarregandoCifra(true);
    const cifra = await buscarCifraPorUrl(musica.url);
    if (cifra) {
      setCifraSelecionada(cifra);
    }
    setCarregandoCifra(false);
  };

  const handleImportar = () => {
    if (!cifraSelecionada) return;

    onImportarCifra({
      titulo: cifraSelecionada.titulo,
      artista: cifraSelecionada.artista,
      tom: cifraSelecionada.tom,
      conteudo: cifraSelecionada.conteudo,
      youtube_url: cifraSelecionada.youtube_url,
    });

    setCifraSelecionada(null);
    alert('Cifra importada com sucesso!');
  };

  const musicasFiltradas = musicas.filter(m =>
    m.titulo.toLowerCase().includes(buscaMusica.toLowerCase())
  );

  return (
    <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h2 style={{ margin: 0, color: '#f59e0b' }}>Buscar Cifras no Cifra Club</h2>
        {artistaSelecionado && (
          <button
            onClick={handleVoltar}
            style={{
              background: '#334155',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← Voltar para Artistas
          </button>
        )}
      </div>
      <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '14px' }}>
        {artistaSelecionado
          ? `Músicas de ${artistaSelecionado.nome}`
          : 'Selecione um artista para ver as cifras disponíveis'}
      </p>

      {!artistaSelecionado && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="🔍 Filtrar artista..."
              value={buscaArtista}
              onChange={e => setBuscaArtista(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                fontSize: '15px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {artistas.map(a => (
              <div
                key={a.slug}
                onClick={() => handleSelecionarArtista(a)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  padding: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = '#1a2744';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.background = '#0f172a';
                }}
              >
                <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>{a.nome}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {artistaSelecionado && !cifraSelecionada && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="🔍 Filtrar música..."
              value={buscaMusica}
              onChange={e => setBuscaMusica(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                fontSize: '15px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {carregando ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#f59e0b' }}>
              <p>Carregando músicas...</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px' }}>
                {musicasFiltradas.length} música(s) encontrada(s)
              </p>
              {musicasFiltradas.map((m, i) => (
                <div
                  key={i}
                  onClick={() => handleSelecionarMusica(m)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#f59e0b')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
                >
                  <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{m.titulo}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {carregandoCifra && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#f59e0b' }}>
          <p>Carregando cifra...</p>
        </div>
      )}

      {cifraSelecionada && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h3 style={{ margin: '0 0 3px 0', color: '#f59e0b' }}>{cifraSelecionada.titulo}</h3>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{cifraSelecionada.artista}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleImportar}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Importar para Minhas Cifras
              </button>
              <button
                onClick={() => setCifraSelecionada(null)}
                style={{
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Voltar
              </button>
            </div>
          </div>

          {cifraSelecionada.tom && (
            <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', display: 'inline-block' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tom:</span>
              <span style={{ marginLeft: '8px', color: '#f59e0b', fontWeight: 'bold' }}>{cifraSelecionada.tom}</span>
            </div>
          )}

          {cifraSelecionada.youtube_url && (
            <div style={{ marginBottom: '15px' }}>
              <a
                href={cifraSelecionada.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ef4444', textDecoration: 'none', fontSize: '13px' }}
              >
                Abrir no YouTube
              </a>
            </div>
          )}

          <pre style={{
            background: '#0f172a',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#e2e8f0',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}>
            {cifraSelecionada.conteudo}
          </pre>
        </div>
      )}

      {!artistaSelecionada && artistas.length === 0 && !carregando && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🎵</p>
          <p>Nenhum artista encontrado</p>
        </div>
      )}
    </div>
  );
}
