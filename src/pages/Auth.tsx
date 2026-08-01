import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Music, Lock, Mail, User, Shield, Music2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'leader' | 'member'>('member');
  const [functionName, setFunctionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bgIndex, setBgIndex] = useState(0);

  const backgrounds = [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1920&auto=format&fit=crop"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isSignUp) {
        // Validações prévias
        if (role === 'leader' && !orgName.trim()) {
          throw new Error('Informe o nome do ministério/equipe.');
        }
        if (role === 'member' && (!inviteCode.trim() || !functionName.trim())) {
          throw new Error('Preencha a função e o código de convite.');
        }

        // 1. Criar organização primeiro se for líder (caso evite travar por falta de ID de usuário no RLS)
        let targetOrgId = null;

        if (role === 'leader') {
          const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert([{ name: orgName.trim(), invite_code: generatedCode }])
            .select()
            .single();

          if (orgError) throw new Error(`Erro ao criar equipe: ${orgError.message}`);
          targetOrgId = orgData.id;
        } else {
          // Se for membro, busca a organização pelo código de convite
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('invite_code', inviteCode.trim().toUpperCase())
            .single();

          if (orgError || !orgData) {
            throw new Error('Código de convite inválido ou equipe não encontrada.');
          }
          targetOrgId = orgData.id;
        }

        // 2. Criar o usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password 
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar usuário na autenticação.');

        // 3. Salvar o perfil vinculado à organização e ao ID do Auth
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName.trim(),
            role: role,
            function: role === 'member' ? functionName.trim() : 'Líder',
            organization_id: targetOrgId,
          },
        ]);

        if (profileError) throw new Error(`Erro ao salvar perfil: ${profileError.message}`);

        setMessage({ 
          type: 'success', 
          text: role === 'leader' 
            ? 'Cadastro realizado com sucesso! Faça login.' 
            : 'Cadastro realizado com sucesso! Faça login.' 
        });
        
        // Opcional: Alterna para a tela de login após sucesso
        setTimeout(() => setIsSignUp(false), 2000);

      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      
      {/* Imagens de Fundo Rotativas em Tela Cheia */}
      {backgrounds.map((bg, idx) => (
        <div
          key={bg}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 1s ease-in-out',
            opacity: bgIndex === idx ? 1 : 0,
            zIndex: -2
          }}
        />
      ))}

      {/* Camada Azul Escura de Contraste (#0D1433) + Efeito Vidro */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(13, 20, 51, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: -1
      }}></div>

      {/* Card de Login/Cadastro Centralizado e Totalmente Responsivo */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        backgroundColor: 'rgba(13, 20, 51, 0.5)',
        border: '1px solid rgba(108, 144, 195, 0.3)',
        borderRadius: '16px',
        padding: '28px',
        boxSizing: 'border-box',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflowY: 'auto',
        color: '#ffffff'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: '#171F55',
            border: '1px solid rgba(108, 144, 195, 0.2)',
            marginBottom: '12px'
          }}>
            <Music style={{ width: '28px', height: '28px', color: '#6C90C3' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.5px' }}>LouvorFlow</h1>
          <p style={{ color: '#6C90C3', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>Gestão de equipes e ministérios</p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {message.text && (
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: message.type === 'success' ? '#34d399' : '#f87171',
              border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {message.text}
            </div>
          )}

          {isSignUp && (
            <>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Nome Completo</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#6C90C3' }} />
                  <input type="text" required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(13, 20, 51, 0.6)', border: '1px solid rgba(108, 144, 195, 0.3)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', color: '#fff', outline: 'none' }} placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Seu Papel</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button type="button" onClick={() => setRole('member')} style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', border: '1px solid', backgroundColor: role === 'member' ? '#171F55' : 'transparent', borderColor: role === 'member' ? '#6C90C3' : 'rgba(108, 144, 195, 0.2)', color: role === 'member' ? '#fff' : '#6C90C3' }}>
                    Músico / Mídia
                  </button>
                  <button type="button" onClick={() => setRole('leader')} style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', border: '1px solid', backgroundColor: role === 'leader' ? '#171F55' : 'transparent', borderColor: role === 'leader' ? '#6C90C3' : 'rgba(108, 144, 195, 0.2)', color: role === 'leader' ? '#fff' : '#6C90C3' }}>
                    Líder
                  </button>
                </div>
              </div>

              {role === 'leader' ? (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nome do Ministério</label>
                  <div style={{ position: 'relative' }}>
                    <Shield style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#6C90C3' }} />
                    <input type="text" required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(13, 20, 51, 0.6)', border: '1px solid rgba(108, 144, 195, 0.3)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', color: '#fff', outline: 'none' }} placeholder="Ex: Adoradores" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Função / Instrumento</label>
                    <div style={{ position: 'relative' }}>
                      <Music2 style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#6C90C3' }} />
                      <input type="text" required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(13, 20, 51, 0.6)', border: '1px solid rgba(108, 144, 195, 0.3)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', color: '#fff', outline: 'none' }} placeholder="Ex: Baixista, Ministro, Mídia" value={functionName} onChange={(e) => setFunctionName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Código de Convite</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#6C90C3' }} />
                      <input type="text" required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(13, 20, 51, 0.6)', border: '1px solid rgba(108, 144, 195, 0.3)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', color: '#fff', outline: 'none' }} placeholder="Código do líder" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#6C90C3' }} />
              <input type="email" required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(13, 20, 51, 0.6)', border: '1px solid rgba(108, 144, 195, 0.3)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', color: '#fff', outline: 'none' }} placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6C90C3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#6C90C3' }} />
              <input type="password" required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(13, 20, 51, 0.6)', border: '1px solid rgba(108, 144, 195, 0.3)', borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', color: '#fff', outline: 'none' }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%',
            backgroundColor: '#171F55',
            border: '1px solid #274272',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            cursor: 'pointer',
            marginTop: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage({ type: '', text: '' }); }} style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            fontWeight: 'semibold',
            color: '#6C90C3',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '4px'
          }}>
            {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}