import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErro(error.message);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErro(error.message);
      } else {
        alert('Cadastro realizado! Faça o login.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', width: '320px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>{isLogin ? 'Entrar no LouvorFlow' : 'Criar Conta'}</h2>
        
        {erro && <div style={{ background: '#ef4444', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '13px', textAlign: 'center' }}>{erro}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', color: '#94a3b8' }}>E-mail</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', color: '#94a3b8' }}>Senha</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
        </button>

        <p onClick={() => setIsLogin(!isLogin)} style={{ textAlign: 'center', fontSize: '14px', color: '#60a5fa', cursor: 'pointer', margin: '5px 0 0 0' }}>
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
        </p>
      </form>
    </div>
  );
}