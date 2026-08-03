import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Cifras from './pages/Cifras';
import type { Cifra, Playlist } from './pages/Cifras';
import Play from './pages/Play';
import { supabase } from './services/supabase';
import { storageService } from './services/storageService';

export default function App() {
  const [sessao, setSessao] = useState<any>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const salvo = localStorage.getItem('louvorflow_playlists');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [cifrasParaTocar, setCifrasParaTocar] = useState<Cifra[]>([]);
  const [telaAtual, setTelaAtual] = useState<'gerenciar' | 'play'>('gerenciar');

  // Efeito para gerenciar autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setCarregandoAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sincronizar dados com o Supabase usando o storageService sempre que houver sessão ativa
  useEffect(() => {
    if (sessao?.user?.id) {
      carregarDadosDaNuvem(sessao.user.id);
    }
  }, [sessao]);

  // Salvar playlists localmente
  useEffect(() => {
    localStorage.setItem('louvorflow_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const carregarDadosDaNuvem = async (userId: string) => {
    try {
      // Buscar Cifras usando o storageService filtrando pelo usuário correto
      const dadosCifras = await storageService.buscarCifras(userId);
      if (dadosCifras) {
        setCifras(dadosCifras);
      }

      // Buscar Playlists do Supabase filtrando por usuario_id
      const { data: dadosPlaylists, error: erroPlaylists } = await supabase
        .from('playlists')
        .select('*')
        .eq('usuario_id', userId);

      if (!erroPlaylists && dadosPlaylists) {
        setPlaylists(dadosPlaylists);
      }
    } catch (error) {
      console.log('Modo offline ou erro ao sincronizar, usando dados locais.', error);
    }
  };

  const handleAdicionarCifra = async (novaCifraOmitida: Omit<Cifra, 'id'>) => {
    if (!sessao?.user?.id) return;

    // Usa o storageService para salvar na nuvem e atualizar o cache local
    const cifraSalva = await storageService.salvarCifra(novaCifraOmitida, sessao.user.id);

    if (cifraSalva) {
      setCifras(prev => [cifraSalva, ...prev.filter(c => c.id !== cifraSalva.id)]);
    }
  };

  const handleAtualizarCifra = async (cifraAtualizada: Cifra) => {
    // Atualiza estado local imediatamente
    setCifras(cifras.map(c => c.id === cifraAtualizada.id ? cifraAtualizada : c));

    // Atualiza no Supabase
    await supabase
      .from('cifras')
      .update({
        titulo: cifraAtualizada.titulo,
        artista: cifraAtualizada.artista,
        tom: cifraAtualizada.tom,
        conteudo: cifraAtualizada.conteudo,
        youtube_url: cifraAtualizada.youtube_url,
        bpm: cifraAtualizada.bpm,
      })
      .eq('id', cifraAtualizada.id)
      .eq('usuario_id', sessao?.user?.id);
  };

  const handleExcluirCifra = async (id: string) => {
    // Remove do estado local
    setCifras(cifras.filter(c => c.id !== id));

    // Remove do Supabase
    await supabase
      .from('cifras')
      .delete()
      .eq('id', id)
      .eq('usuario_id', sessao?.user?.id);
  };

  const handleSalvarPlaylist = async (nome: string, cifrasIds: string[]) => {
    if (!sessao?.user?.id) return;

    const novaPlaylistLocal: Playlist = {
      id: Date.now().toString(),
      nome,
      cifras_ids: cifrasIds,
    };

    setPlaylists([novaPlaylistLocal, ...playlists]);

    // Salvar playlist no Supabase usando usuario_id
    await supabase.from('playlists').insert([{
      nome,
      cifras_ids: cifrasIds,
      usuario_id: sessao.user.id,
    }]);
  };

  const handleIrParaPlay = (cifrasSelecionadas: Cifra[]) => {
    setCifrasParaTocar(cifrasSelecionadas);
    setTelaAtual('play');
  };

  const handleSairConta = async () => {
    await supabase.auth.signOut();
  };

  if (carregandoAuth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <h2>Carregando LouvorFlow...</h2>
      </div>
    );
  }

  if (!sessao) {
    return <Auth />;
  }

  return (
    <div>
      {telaAtual === 'gerenciar' ? (
        <Cifras
          cifras={cifras}
          playlists={playlists}
          onAdicionarCifra={handleAdicionarCifra}
          onAtualizarCifra={handleAtualizarCifra}
          onExcluirCifra={handleExcluirCifra}
          onSalvarPlaylist={handleSalvarPlaylist}
          onIrParaPlay={handleIrParaPlay}
          onSairConta={handleSairConta}
        />
      ) : ( 
        <Play
          cifrasParaTocar={cifrasParaTocar}
          onVoltar={() => setTelaAtual('gerenciar')}
        />
      )}
    </div>
  );
}