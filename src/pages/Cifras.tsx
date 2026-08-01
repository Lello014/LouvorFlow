import React, { useState, useEffect } from 'react';

export interface Cifra {
  id: string;
  titulo: string;
  artista: string;
  tom: string;
  conteudo: string;
  youtube_url?: string;
  bpm?: number;
}

export interface Playlist {
  id: string;
  nome: string;
  cifras_ids: string[];
}

interface CifrasProps {
  cifras: Cifra[];
  playlists: Playlist[];
  onAdicionarCifra: (novaCifra: Omit<Cifra, 'id'>) => void;
  onAtualizarCifra?: (cifraAtualizada: Cifra) => void;
  onExcluirCifra?: (id: string) => void;
  onSalvarPlaylist: (nome: string, cifrasIds: string[]) => void;
  onIrParaPlay: (cifrasSelecionadas: Cifra[]) => void;
  onSairConta?: () => void;
}

export default function Cifras({ 
  cifras, 
  playlists, 
  onAdicionarCifra, 
  onAtualizarCifra, 
  onExcluirCifra, 
  onSalvarPlaylist, 
  onIrParaPlay, 
  onSairConta 
}: CifrasProps) {
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [titulo, setTitulo] = useState(() => localStorage.getItem('rascunho_titulo') || '');
  const [artista, setArtista] = useState(() => localStorage.getItem('rascunho_artista') || '');
  const [tom, setTom] = useState(() => localStorage.getItem('rascunho_tom') || '');
  const [conteudo, setConteudo] = useState(() => localStorage.getItem('rascunho_conteudo') || '');
  const [youtubeUrl, setYoutubeUrl] = useState(() => localStorage.getItem('rascunho_youtubeUrl') || '');
  const [bpm, setBpm] = useState<number | ''>(() => {
    const salvo = localStorage.getItem('rascunho_bpm');
    return salvo ? Number(salvo) : '';
  });

  useEffect(() => { if (!idEditando) localStorage.setItem('rascunho_titulo', titulo); }, [titulo, idEditando]);
  useEffect(() => { if (!idEditando) localStorage.setItem('rascunho_artista', artista); }, [artista, idEditando]);
  useEffect(() => { if (!idEditando) localStorage.setItem('rascunho_tom', tom); }, [tom, idEditando]);
  useEffect(() => { if (!idEditando) localStorage.setItem('rascunho_conteudo', conteudo); }, [conteudo, idEditando]);
  useEffect(() => { if (!idEditando) localStorage.setItem('rascunho_youtubeUrl', youtubeUrl); }, [youtubeUrl, idEditando]);
  useEffect(() => { if (!idEditando) localStorage.setItem('rascunho_bpm', bpm.toString()); }, [bpm, idEditando]);

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [nomePlaylist, setNomePlaylist] = useState('');
  const [buscaRepertorio, setBuscaRepertorio] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'gerenciar' | 'repertorio' | 'playlists'>('gerenciar');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !artista || !conteudo) return;

    if (idEditando) {
      if (onAtualizarCifra) {
        onAtualizarCifra({
          id: idEditando,
          titulo,
          artista,
          tom,
          conteudo,
          youtube_url: youtubeUrl,
          bpm: bpm ? Number(bpm) : undefined,
        });
      }
      alert('Cifra atualizada com sucesso!');
      setIdEditando(null);
    } else {
      onAdicionarCifra({
        titulo,
        artista,
        tom,
        conteudo,
        youtube_url: youtubeUrl,
        bpm: bpm ? Number(bpm) : undefined,
      });
      alert('Cifra salva com sucesso!');
    }

    setTitulo('');
    setArtista('');
    setTom('');
    setConteudo('');
    setYoutubeUrl('');
    setBpm('');
    localStorage.removeItem('rascunho_titulo');
    localStorage.removeItem('rascunho_artista');
    localStorage.removeItem('rascunho_tom');
    localStorage.removeItem('rascunho_conteudo');
    localStorage.removeItem('rascunho_youtubeUrl');
    localStorage.removeItem('rascunho_bpm');
  };

  const iniciarEdicao = (c: Cifra, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita marcar a checkbox ao clicar em editar
    setIdEditando(c.id);
    setTitulo(c.titulo);
    setArtista(c.artista);
    setTom(c.tom || '');
    setConteudo(c.conteudo);
    setYoutubeUrl(c.youtube_url || '');
    setBpm(c.bpm !== undefined ? c.bpm : '');
    setAbaAtiva('gerenciar');
  };

  const excluirCifraItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta cifra?')) {
      if (onExcluirCifra) {
        onExcluirCifra(id);
      }
      setSelecionadas(selecionadas.filter(s => s !== id));
    }
  };

  const toggleSelecionada = (id: string) => {
    if (selecionadas.includes(id)) {
      setSelecionadas(selecionadas.filter(item => item !== id));
    } else {
      setSelecionadas([...selecionadas, id]);
    }
  };

  const iniciarModoPlayComSelecao = () => {
    if (selecionadas.length === 0) {
      alert('Selecione pelo menos uma música para tocar!');
      return;
    }
    const cifrasParaTocar = cifras.filter(c => selecionadas.map(String).includes(String(c.id)));
    
    if (cifrasParaTocar.length === 0) {
      alert('Erro: As músicas selecionadas não foram encontradas na lista.');
      return;
    }

    onIrParaPlay(cifrasParaTocar);
  };

  const carregarPlaylist = (playlist: Playlist) => {
    const cifrasDaPlaylist = cifras.filter(c => playlist.cifras_ids.map(String).includes(String(c.id)));
    if (cifrasDaPlaylist.length === 0) {
      alert('Esta playlist não possui músicas válidas.');
      return;
    }
    onIrParaPlay(cifrasDaPlaylist);
  };

  const salvarNovaPlaylist = () => {
    if (!nomePlaylist.trim()) {
      alert('Digite um nome para a playlist.');
      return;
    }
    if (selecionadas.length === 0) {
      alert('Selecione pelo menos uma música para a playlist.');
      return;
    }
    onSalvarPlaylist(nomePlaylist, selecionadas);
    setNomePlaylist('');
    alert('Playlist salva com sucesso!');
  };

  const cifrasFiltradas = cifras.filter(c => 
    c.titulo.toLowerCase().includes(buscaRepertorio.toLowerCase()) ||
    c.artista.toLowerCase().includes(buscaRepertorio.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '30px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Cabeçalho, Abas e Botão Sair */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#38bdf8' }}>LouvorFlow - Gestão de Cifras</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => { setIdEditando(null); setAbaAtiva('gerenciar'); }} 
              style={{ background: abaAtiva === 'gerenciar' ? '#3b82f6' : '#1e293b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {idEditando ? '✏️ Editando Cifra' : '+ Nova Cifra'}
            </button>
            <button 
              onClick={() => setAbaAtiva('repertorio')} 
              style={{ background: abaAtiva === 'repertorio' ? '#3b82f6' : '#1e293b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🎵 Selecionar Repertório
            </button>
            <button 
              onClick={() => setAbaAtiva('playlists')} 
              style={{ background: abaAtiva === 'playlists' ? '#3b82f6' : '#1e293b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📂 Playlists Salvas
            </button>

            {onSairConta && (
              <button 
                onClick={onSairConta} 
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                title="Sair da Conta"
              >
                Sair
              </button>
            )}
          </div>
        </div>

        {/* ABA 1: CADASTRAR / EDITAR NOVA CIFRA */}
        <div style={{ display: abaAtiva === 'gerenciar' ? 'block' : 'none' }}>
          <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
                {idEditando ? 'Editar Cifra' : 'Cadastrar Nova Cifra'}
              </h2>
              {idEditando && (
                <button 
                  type="button" 
                  onClick={() => { setIdEditando(null); setTitulo(''); setArtista(''); setTom(''); setConteudo(''); setYoutubeUrl(''); setBpm(''); }} 
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancelar Edição
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>Título da Música</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>Artista / Ministério</label>
                <input type="text" value={artista} onChange={e => setArtista(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>Tom</label>
                <input type="text" value={tom} onChange={e => setTom(e.target.value)} placeholder="Ex: G, D/F#" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>Link do YouTube (Opcional)</label>
                <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', color: '#94a3b8' }}>BPM (Andamento)</label>
                <input type="number" value={bpm} onChange={e => setBpm(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Ex: 72" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', color: '#94a3b8' }}>Conteúdo da Cifra (com os acordes nas linhas acima da letra)</label>
              <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} rows={10} required placeholder="A&#10;Tem ciúmes de mim&#10;D/F#&#10;O Seu amor é como um furacão" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontFamily: 'monospace', fontSize: '15px' }} />
            </div>

            <button type="submit" style={{ background: idEditando ? '#3b82f6' : '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
              {idEditando ? 'Atualizar Cifra' : 'Salvar Cifra no Banco'}
            </button>
          </form>
        </div>

        {/* ABA 2: SELECIONAR REPERTÓRIO */}
        <div style={{ display: abaAtiva === 'repertorio' ? 'block' : 'none' }}>
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0' }}>Montar Repertório para o Ensaio/Culto</h2>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Selecione as músicas que deseja tocar hoje:</p>
              </div>

              <button 
                onClick={iniciarModoPlayComSelecao}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🚀 Iniciar Modo Play ({selecionadas.length})
              </button>
            </div>

            {/* Barra de Busca / Filtro de Músicas */}
            <div style={{ marginBottom: '15px' }}>
              <input 
                type="text" 
                placeholder="🔍 Filtrar música por título ou artista..." 
                value={buscaRepertorio} 
                onChange={e => setBuscaRepertorio(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#0f172a', padding: '15px', borderRadius: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Nome da Playlist (Ex: Culto Domingo Noite)" 
                value={nomePlaylist} 
                onChange={e => setNomePlaylist(e.target.value)}
                style={{ flex: 1, minWidth: '220px', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
              />
              <button 
                onClick={salvarNovaPlaylist}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                💾 Salvar como Playlist
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {cifrasFiltradas.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>Nenhuma música encontrada com esse termo.</p>
              ) : (
                cifrasFiltradas.map(c => {
                  const isChecked = selecionadas.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => toggleSelecionada(c.id)}
                      style={{ background: isChecked ? '#1e3a8a' : '#0f172a', border: `1px solid ${isChecked ? '#3b82f6' : '#334155'}`, padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <div>
                          <h4 style={{ margin: '0 0 3px 0', fontSize: '16px' }}>{c.titulo}</h4>
                          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{c.artista} {c.bpm ? `• ${c.bpm} BPM` : ''}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>
                          Tom: {c.tom || 'N/D'}
                        </span>
                        
                        <button 
                          onClick={(e) => iniciarEdicao(c, e)} 
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Editar Cifra"
                        >
                          ✏️
                        </button>
                        
                        <button 
                          onClick={(e) => excluirCifraItem(c.id, e)} 
                          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Excluir Cifra"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ABA 3: PLAYLISTS SALVAS */}
        <div style={{ display: abaAtiva === 'playlists' ? 'block' : 'none' }}>
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 5px 0' }}>Suas Playlists Salvas</h2>
            <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '14px' }}>Carregue um setlist salvo anteriormente com um clique:</p>

            <div style={{ display: 'grid', gap: '15px' }}>
              {playlists.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>Nenhuma playlist salva. Vá em "Selecionar Repertório" e salve sua primeira playlist!</p>
              ) : (
                playlists.map(pl => {
                  const qtdMusicas = pl.cifras_ids.length;
                  return (
                    <div key={pl.id} style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#38bdf8' }}>{pl.nome}</h3>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{qtdMusicas} música(s) no setlist</span>
                      </div>
                      <button 
                        onClick={() => carregarPlaylist(pl)}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ▶ Tocar Playlist
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}