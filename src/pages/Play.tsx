import React, { useState, useEffect, useRef } from 'react';
import type { Cifra } from './Cifras';

interface PlayProps {
  cifrasParaTocar: Cifra[];
  onVoltar: () => void;
}

export default function Play({ cifrasParaTocar: cifrasIniciais, onVoltar }: PlayProps) {
  // Lista de músicas localmente reordenável no Modo Play
  const [playlist, setPlaylist] = useState<Cifra[]>(cifrasIniciais);

  // Estado para personalizações por música (cores e edições rápidas sem alterar o banco original)
  const [estilosLocais, setEstilosLocais] = useState<Record<string, { corLetra: string; corCifra: string; conteudo: string }>>({});
  const [idMusicaEmEdicao, setIdMusicaEmEdicao] = useState<string | null>(null);

  // Estado para o menu suspenso de organização da setlist na barra superior
  const [menuOrganizarAberto, setMenuOrganizarAberto] = useState(false);

  // Estados para montagem interativa da transição (armazena a progressão montada por par de músicas)
  const [transicoesMontadas, setTransicoesMontadas] = useState<Record<string, string[]>>({});

  // Rolagem Automática
  const [autoscrollAtivo, setAutoscrollAtivo] = useState(false);
  const [velocidadeScroll, setVelocidadeScroll] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (autoscrollAtivo) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollBy({ top: velocidadeScroll, behavior: 'smooth' });
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [autoscrollAtivo, velocidadeScroll]);

  // Função para mover músicas na ordem
  const moverMusica = (index: number, direcao: 'subir' | 'descer') => {
    const novaLista = [...playlist];
    const destino = direcao === 'subir' ? index - 1 : index + 1;
    if (destino < 0 || destino >= novaLista.length) return;
    const [removido] = novaLista.splice(index, 1);
    novaLista.splice(destino, 0, removido);
    setPlaylist(novaLista);
  };

  const getDadosMusica = (cifra: Cifra) => {
    return estilosLocais[cifra.id] || {
      corLetra: '#ffffff',
      corCifra: '#38bdf8',
      conteudo: cifra.conteudo || ''
    };
  };

  const handleSalvarEdicaoLocal = (id: string, novosDados: Partial<{ corLetra: string; corCifra: string; conteudo: string }>) => {
    const atual = estilosLocais[id] || {
      corLetra: '#ffffff',
      corCifra: '#38bdf8',
      conteudo: playlist.find(c => c.id === id)?.conteudo || ''
    };

    setEstilosLocais({
      ...estilosLocais,
      [id]: { ...atual, ...novosDados }
    });
  };

  // Gerador simplificado de Campo Harmônico aproximado baseado no tom principal
  const gerarCampoHarmonico = (tom: string) => {
    if (!tom) return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'];
    const t = tom.trim().toUpperCase();
    const mapas: Record<string, string[]> = {
      'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
      'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
      'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
      'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
      'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
      'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
      'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
      'BB': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
      'EB': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
      'AM': ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
      'EM': ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
      'DM': ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
    };
    return mapas[t] || [t, `${t}m`, '---', '---', '---', '---', '---'];
  };

  const adicionarAcordeTransicao = (parKey: string, acorde: string) => {
    const atual = transicoesMontadas[parKey] || [];
    setTransicoesMontadas({
      ...transicoesMontadas,
      [parKey]: [...atual, acorde]
    });
  };

  const limparTransicao = (parKey: string) => {
    const copia = { ...transicoesMontadas };
    delete copia[parKey];
    setTransicoesMontadas(copia);
  };

  const ehLinhaDeCifraOuTab = (linha: string): boolean => {
    const l = linha.trim();
    if (!l) return false;
    if (l.includes('|') || /^[A-G][b#]?(m|maj|min|dim|aug|sus|[0-9])*/i.test(l)) {
      return true;
    }
    return l.length < 35 && !l.includes(' ');
  };

  if (!playlist || playlist.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Nenhuma música selecionada para o Modo Play.</h2>
        <button onClick={onVoltar} style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Voltar ao Menu</button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* BARRA FIXA SUPERIOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 25px', background: '#1e293b', borderBottom: '1px solid #334155', zIndex: 20, flexWrap: 'wrap', gap: '10px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={onVoltar}
            style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← Voltar ao Menu
          </button>

          {/* BOTÃO PARA ABRIR O MENU SUSPENSO DE ORGANIZAR SETLIST */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setMenuOrganizarAberto(!menuOrganizarAberto)}
              style={{ background: menuOrganizarAberto ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ☰ Organizar Setlist ({playlist.length})
            </button>

            {/* MENU SUSPENSO FLUTUANTE */}
            {menuOrganizarAberto && (
              <div style={{ position: 'absolute', top: '45px', left: 0, background: '#111827', border: '1px solid #374151', borderRadius: '10px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 50, padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>Ordem das Músicas</span>
                  <button 
                    onClick={() => setMenuOrganizarAberto(false)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                  {playlist.map((m, mIdx) => (
                    <div key={m.id || mIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1f2937', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', color: '#fff' }}>
                        <b>{mIdx + 1}.</b> {m.titulo}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          disabled={mIdx === 0}
                          onClick={() => moverMusica(mIdx, 'subir')}
                          style={{ background: mIdx === 0 ? '#111827' : '#374151', color: mIdx === 0 ? '#4b5563' : '#fff', border: 'none', width: '24px', height: '22px', borderRadius: '4px', cursor: mIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                          ▲
                        </button>
                        <button 
                          disabled={mIdx === playlist.length - 1}
                          onClick={() => moverMusica(mIdx, 'descer')}
                          style={{ background: mIdx === playlist.length - 1 ? '#111827' : '#374151', color: mIdx === playlist.length - 1 ? '#4b5563' : '#fff', border: 'none', width: '24px', height: '22px', borderRadius: '4px', cursor: mIdx === playlist.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>MODO PLAY - SETLIST INTERATIVO</span>
          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>{playlist.length} Músicas organizadas</span>
        </div>

        {/* Controles de Rolagem Automática */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '13px' }}>📜 Rolagem:</span>
          <button 
            onClick={() => setAutoscrollAtivo(!autoscrollAtivo)}
            style={{ background: autoscrollAtivo ? '#ef4444' : '#10b981', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            {autoscrollAtivo ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Velocidade:</span>
          <input 
            type="range" 
            min="0.5" 
            max="4" 
            step="0.5" 
            value={velocidadeScroll} 
            onChange={e => setVelocidadeScroll(Number(e.target.value))} 
            style={{ cursor: 'pointer', width: '70px' }}
          />
          <span style={{ fontWeight: 'bold', fontSize: '12px', minWidth: '25px' }}>{velocidadeScroll}x</span>
        </div>
      </div>

      {/* ÁREA DE ROLAGEM ÚNICA */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 150px 20px', scrollBehavior: 'smooth' }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          {playlist.map((musica, index) => {
            const dados = getDadosMusica(musica);
            const proximaMusica = playlist[index + 1];
            const emEdicao = idMusicaEmEdicao === musica.id;
            const parKey = `${musica.id}-${proximaMusica?.id}`;
            const transicaoAtual = transicoesMontadas[parKey] || [];

            const campoHarmonicoAtual = gerarCampoHarmonico(musica.tom);
            const campoHarmonicoProxima = proximaMusica ? gerarCampoHarmonico(proximaMusica.tom) : [];

            return (
              <React.Fragment key={musica.id || index}>
                
                {/* CARD DA MÚSICA */}
                <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '25px 30px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  
                  {/* CABEÇALHO */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1f2937', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold', letterSpacing: '1px' }}>POSIÇÃO {index + 1} DE {playlist.length}</span>
                      <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', color: '#38bdf8' }}>{musica.titulo}</h2>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>{musica.artista}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '15px' }}>Tom: {musica.tom || 'N/D'}</div>
                        {musica.bpm && <div style={{ color: '#10b981', fontSize: '13px' }}>BPM: {musica.bpm}</div>}
                      </div>

                      <button
                        onClick={() => setIdMusicaEmEdicao(emEdicao ? null : musica.id)}
                        style={{ background: emEdicao ? '#ef4444' : '#374151', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ⚙️ {emEdicao ? 'Fechar' : 'Ajustar Cifra'}
                      </button>
                    </div>
                  </div>

                  {/* PAINEL DE EDIÇÃO LOCAL */}
                  {emEdicao && (
                    <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', border: '1px solid #374151', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>⚠️ Alterações válidas apenas para esta execução no palco:</span>
                      
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '13px', color: '#9ca3af' }}>Cor da Cifra:</label>
                          <input 
                            type="color" 
                            value={dados.corCifra} 
                            onChange={e => handleSalvarEdicaoLocal(musica.id, { corCifra: e.target.value })}
                            style={{ border: 'none', width: '32px', height: '32px', background: 'none', cursor: 'pointer' }} 
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '13px', color: '#9ca3af' }}>Cor da Letra:</label>
                          <input 
                            type="color" 
                            value={dados.corLetra} 
                            onChange={e => handleSalvarEdicaoLocal(musica.id, { corLetra: e.target.value })}
                            style={{ border: 'none', width: '32px', height: '32px', background: 'none', cursor: 'pointer' }} 
                          />
                        </div>
                      </div>

                      <textarea 
                        value={dados.conteudo}
                        onChange={e => handleSalvarEdicaoLocal(musica.id, { conteudo: e.target.value })}
                        rows={6}
                        style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #374151', padding: '10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                        placeholder="Edite trechos da cifra ou letra aqui..."
                      />
                    </div>
                  )}

                  {/* CONTEÚDO DA CIFRA */}
                  <div style={{ fontFamily: 'monospace', fontSize: '17px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {dados.conteudo.split('\n').map((linha, lIdx) => {
                      const ehCifraTab = ehLinhaDeCifraOuTab(linha);
                      return (
                        <div 
                          key={lIdx} 
                          style={{ 
                            color: ehCifraTab ? dados.corCifra : dados.corLetra, 
                            fontWeight: ehCifraTab ? 'bold' : 'normal',
                            minHeight: '22px'
                          }}
                        >
                          {linha || '\u00A0'}
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* PAINEL INTERATIVO DE TRANSIÇÃO HARMÔNICA ENTRE MÚSICAS */}
                {proximaMusica && (
                  <div style={{ 
                    margin: '35px 0', 
                    padding: '20px 25px', 
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', 
                    borderRadius: '12px', 
                    border: '1px solid #4338ca',
                    boxShadow: '0 4px 15px rgba(67, 56, 202, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        🎹 Construtor de Transição Harmônica
                      </span>
                      <span style={{ fontSize: '13px', color: '#a5b4fc', background: '#312e81', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                        {musica.tom || '?'} ➔ {proximaMusica.tom || '?'}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>
                      Monte sua progressão de passagem clicando nas notas dos campos harmônicos abaixo:
                    </div>

                    {/* ACORDES DA TRANSIÇÃO MONTADA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: '1px solid #374151', minHeight: '50px', flexWrap: 'wrap', marginBottom: '15px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Passagem criada:</span>
                      {transicaoAtual.length === 0 ? (
                        <span style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Nenhum acorde selecionado. Clique nos graus abaixo para montar.</span>
                      ) : (
                        transicaoAtual.map((acorde, aIdx) => (
                          <span key={aIdx} style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                            {acorde} {aIdx < transicaoAtual.length - 1 && '➔'}
                          </span>
                        ))
                      )}
                      {transicaoAtual.length > 0 && (
                        <button 
                          onClick={() => limparTransicao(parKey)}
                          style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {/* SELETORES DE CAMPOS HARMÔNICOS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                      
                      {/* Campo da Música Atual */}
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>
                          Tom de Saída ({musica.titulo} - {musica.tom || 'N/D'}):
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {campoHarmonicoAtual.map((nota, nIdx) => (
                            <button
                              key={nIdx}
                              onClick={() => adicionarAcordeTransicao(parKey, nota)}
                              style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                            >
                              {nota}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Campo da Próxima Música */}
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '8px' }}>
                          Tom de Entrada ({proximaMusica.titulo} - {proximaMusica.tom || 'N/D'}):
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {campoHarmonicoProxima.map((nota, nIdx) => (
                            <button
                              key={nIdx}
                              onClick={() => adicionarAcordeTransicao(parKey, nota)}
                              style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                            >
                              {nota}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

              </React.Fragment>
            );
          })}

        </div>
      </div>

    </div>
  );
}