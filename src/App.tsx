import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './pages/auth';
import Agenda from './pages/Agenda';
import Membros from './pages/Membros';
import Cifras from './pages/Cifras';
import ModoShow from './pages/Modoshow';
import { LogOut, Music, Calendar, Layers, Sliders, ArrowLeft, Users, Copy, Check } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'agenda' | 'membros' | 'cifras' | 'modoshow'>('dashboard');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndOrg(session.user.id);
      } else {
        setLoadingProfile(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndOrg(session.user.id);
      } else {
        setProfile(null);
        setInviteCode('');
        setLoadingProfile(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfileAndOrg(userId: string) {
    setLoadingProfile(true);
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, organization_id, role, full_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (profileData) {
        setProfile(profileData);

        if (profileData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('invite_code')
            .eq('id', profileData.organization_id)
            .single();

          if (orgData) setInviteCode(orgData.invite_code);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    } finally {
      // O finally garante que a tela de carregamento vai sumir mesmo se der erro
      setLoadingProfile(false);
    }
  }

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('dashboard');
    setProfile(null);
  };

  if (!session) {
    return <Auth />;
  }

  if (loadingProfile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#a1a1aa' }}>Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', color: '#f4f4f5', backgroundColor: '#09090b', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {currentScreen !== 'modoshow' && (
        <header style={{ backgroundColor: '#18181b', borderBottom: '1px solid #27272a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentScreen !== 'dashboard' && (
              <button onClick={() => setCurrentScreen('dashboard')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
                <ArrowLeft style={{ width: '20px', height: '20px' }} />
              </button>
            )}
            <div style={{ backgroundColor: '#7c3aed', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <Music style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>LouvorFlow</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {inviteCode && (
              <div 
                onClick={handleCopyCode}
                title="Clique para copiar o código"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#27272a', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', color: '#e4e4e7', border: '1px solid #3f3f46', cursor: 'pointer' }}
              >
                <span style={{ color: '#a1a1aa' }}>Convite:</span>
                <strong style={{ color: '#a78bfa' }}>{inviteCode}</strong>
                {copied ? <Check style={{ width: '14px', height: '14px', color: '#10b981' }} /> : <Copy style={{ width: '14px', height: '14px', color: '#a1a1aa' }} />}
              </div>
            )}

            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#27272a', color: '#e4e4e7', padding: '8px 16px', borderRadius: '8px', border: '1px solid #3f3f46', cursor: 'pointer' }}>
              <LogOut style={{ width: '16px', height: '16px' }} /> Sair
            </button>
          </div>
        </header>
      )}

      {currentScreen === 'agenda' ? (
        <Agenda userProfile={profile} />
      ) : currentScreen === 'membros' ? (
        <Membros userProfile={profile} inviteCode={inviteCode} />
      ) : currentScreen === 'cifras' ? (
        <Cifras userProfile={profile} />
      ) : currentScreen === 'modoshow' ? (
        <ModoShow userProfile={profile} onBackToDashboard={() => setCurrentScreen('dashboard')} />
      ) : (
        <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'start', boxSizing: 'border-box' }}>
          
          <div onClick={() => setCurrentScreen('cifras')} style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #27272a', height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxSizing: 'border-box' }}>
            <Layers style={{ width: '28px', height: '28px', color: '#8b5cf6' }} />
            <div>
              <h2 style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0' }}>Acervo de Cifras</h2>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>Gerencie o banco de músicas, tons e BPM.</p>
            </div>
          </div>

          <div onClick={() => setCurrentScreen('agenda')} style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #27272a', height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxSizing: 'border-box' }}>
            <Calendar style={{ width: '28px', height: '28px', color: '#10b981' }} />
            <div>
              <h2 style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0' }}>Agenda</h2>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>Crie eventos, gerencie escalas e monte setlists.</p>
            </div>
          </div>

          <div onClick={() => setCurrentScreen('membros')} style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #27272a', height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxSizing: 'border-box' }}>
            <Users style={{ width: '28px', height: '28px', color: '#a78bfa' }} />
            <div>
              <h2 style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0' }}>Membros</h2>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>Visualize a equipe e compartilhe acessos.</p>
            </div>
          </div>

          <div onClick={() => setCurrentScreen('modoshow')} style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #27272a', height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxSizing: 'border-box' }}>
            <Sliders style={{ width: '28px', height: '28px', color: '#f59e0b' }} />
            <div>
              <h2 style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0' }}>Modo Show</h2>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>Setlist contínuo com rolagem automática.</p>
            </div>
          </div>

        </main>
      )}
    </div>
  );
}