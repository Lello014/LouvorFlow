import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Video, X, FileText } from 'lucide-react';

interface CifrasProps {
  userProfile: {
    organization_id: string;
    role: 'leader' | 'member';
  };
}

export default function Cifras({ userProfile }: CifrasProps) {
  const [songs, setSongs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  // Campos do Formulário
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('chord_sheets')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('title', { ascending: true });

      if (data) setSongs(data);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSong(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !artist || !key || !content) return;

    const { error } = await supabase
      .from('chord_sheets')
      .insert([{
        organization_id: userProfile.organization_id,
        title,
        artist,
        key,
        bpm: bpm ? parseInt(bpm) : null,
        video_url: videoUrl,
        content
      }]);

    if (!error) {
      setTitle('');
      setArtist('');
      setKey('');
      setBpm('');
      setVideoUrl('');
      setContent('');
      setShowModal(false);
      fetchSongs();
    } else {
      console.error('Erro ao salvar música:', error);
    }
  }

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    song.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', color: '#f4f4f5', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Cabeçalho da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Acervo de Cifras</h1>
          <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>Repositório de músicas oficiais do ministério.</p>
        </div>
        {userProfile.role === 'leader' && (
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            <Plus style={{ width: '18px', height: '18px' }} /> Nova Música
          </button>
        )}
      </div>

      {/* Barra de Pesquisa */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', width: '18px', height: '18px' }} />
        <input 
          type="text" 
          placeholder="Buscar por título ou artista..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px 12px 12px 42px', color: '#fff', fontSize: '14px' }}
        />
      </div>

      {/* Grid de Músicas */}
      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Carregando acervo...</p>
      ) : filteredSongs.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>Nenhuma música encontrada.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredSongs.map(song => (
            <div key={song.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{song.title}</h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 12px 0' }}>{song.artist}</p>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', backgroundColor: '#27272a', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#a78bfa' }}>Tom: {song.key}</span>
                  {song.bpm && <span style={{ fontSize: '12px', backgroundColor: '#27272a', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#10b981' }}>BPM: {song.bpm}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSelectedSong(song)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <FileText style={{ width: '14px', height: '14px' }} /> Ver Cifra
                </button>
                {song.video_url && (
                  <a href={song.video_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#ef4444', padding: '8px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}>
                    <Video style={{ width: '14px', height: '14px' }} /> Vídeo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DA CIFRA */}
      {selectedSong && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{selectedSong.title}</h2>
                <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>{selectedSong.artist} | Tom: <strong>{selectedSong.key}</strong> {selectedSong.bpm ? `| BPM: ${selectedSong.bpm}` : ''}</p>
              </div>
              <X onClick={() => setSelectedSong(null)} style={{ cursor: 'pointer', color: '#a1a1aa' }} />
            </div>
            
            {/* Corpo da Cifra com espaçamento monoespaçado */}
            <pre style={{ backgroundColor: '#09090b', padding: '16px', borderRadius: '8px', border: '1px solid #27272a', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '15px', color: '#e4e4e7', lineHeight: '1.6', margin: 0 }}>
              {selectedSong.content}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO (LÍDER) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <form onSubmit={handleCreateSong} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Adicionar Nova Música</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer', color: '#a1a1aa' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>TÍTULO</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Hosana" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>ARTISTA / MINISTÉRIO</label>
                <input type="text" value={artist} onChange={e => setArtist(e.target.value)} required placeholder="Ex: Morada" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#fff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>TOM (KEY)</label>
                <input type="text" value={key} onChange={e => setKey(e.target.value)} required placeholder="Ex: G, E, C#m" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>BPM (OPCIONAL)</label>
                <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="Ex: 120" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#fff' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>LINK DO VÍDEO / REFERÊNCIA (OPCIONAL)</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#fff' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>LETRA E CIFRA</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="Cole aqui a letra junto com as cifras espaciais..." style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', color: '#fff', height: '18px', minHeight: '180px', fontFamily: 'monospace', resize: 'vertical' }} />
            </div>

            <button type="submit" style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>
              Salvar Música no Acervo
            </button>
          </form>
        </div>
      )}
    </div>
  );
}