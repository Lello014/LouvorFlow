import { supabase } from './supabase';

const CACHE_KEY = 'louvorflow_cifras_cache';

export const storageService = {
  // Buscar cifras (tenta a nuvem usando usuario_id, se falhar pega do cache local)
  async buscarCifras(userId: string) {
    try {
      const { data, error } = await supabase
        .from('cifras')
        .select('*')
        .eq('usuario_id', userId);

      if (error) throw error;

      if (data) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Sem conexão ou erro no servidor. Carregando dados offline do cache...');
    }

    const cacheLocal = localStorage.getItem(CACHE_KEY);
    return cacheLocal ? JSON.parse(cacheLocal) : [];
  },

  // Salvar nova cifra usando usuario_id
  async salvarCifra(novaCifra: any, userId: string) {
    const dadosParaSalvar = { ...novaCifra, usuario_id: userId };

    try {
      const { data, error } = await supabase
        .from('cifras')
        .insert([dadosParaSalvar])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const cacheAtual: any[] = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
        const novoCache = [data[0], ...cacheAtual];
        localStorage.setItem(CACHE_KEY, JSON.stringify(novoCache));
        return data[0];
      }
    } catch (err) { 
      console.warn('Você está offline. A cifra foi salva apenas localmente.');
      
      const itemOffline = { ...dadosParaSalvar, id: 'offline_' + Date.now() };
      const cacheAtual: any[] = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      const novoCache = [itemOffline, ...cacheAtual];
      localStorage.setItem(CACHE_KEY, JSON.stringify(novoCache));
      return itemOffline;
    }
  }
};