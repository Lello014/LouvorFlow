import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Cifras from './pages/Cifras';
import type { Cifra, Playlist } from './pages/Cifras';
import Play from './pages/Play';
import { supabase } from './services/supabase';

export default function App() {
  const [sessao, setSessao] = useState<any>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [cifras, setCifras] = useState<Cifra[]>(() => {
    const salvo = localStorage.getItem('louvorflow_cifras');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const salvo = localStorage.getItem('louvorflow_playlists');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [cifrasParaTocar, setCifrasParaTocar] = useState<Cifra[]>([]);
  const [telaAtual, setTelaAtual] = useState<'gerenciar' | 'play'>('gerenciar');

  useEffect(() => {
    // Verifica a sessão atual do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setCarregandoAuth(false);
    });

    // Escuta mudanças de autenticação (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('louvorflow_cifras', JSON.stringify(cifras));
  }, [cifras]);

  useEffect(() => {
    localStorage.setItem('louvorflow_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const handleAdicionarCifra = (novaCifraOmitida: Omit<Cifra, 'id'>) => {
    const novaCifra: Cifra = {
      ...novaCifraOmitida,
      id: Date.now().toString(),
    };
    setCifras([novaCifra, ...cifras]);
  };

  const handleSalvarPlaylist = (nome: string, cifrasIds: string[]) => {
    const novaPlaylist: Playlist = {
      id: Date.now().toString(),
      nome,
      cifras_ids: cifrasIds,
    };
    setPlaylists([novaPlaylist, ...playlists]);
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

  // Se não estiver logado, exibe a tela de Autenticação/Login
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