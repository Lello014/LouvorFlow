import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Copy, Check, Users, Shield, Music } from 'lucide-react';

interface MembrosProps {
  userProfile: {
    organization_id: string;
  };
  inviteCode: string;
}

export default function Membros({ userProfile, inviteCode }: MembrosProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, function')
        .eq('organization_id', userProfile.organization_id)
        .order('full_name', { ascending: true });

      if (data) setMembers(data);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '24px', color: '#f4f4f5', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Bloco de Convite no Topo */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Convidar Novos Membros</h2>
          <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>Compartilhe o código para que músicos entrem na sua organização.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#27272a', padding: '10px 16px', borderRadius: '8px', border: '1px solid #3f3f46' }}>
          <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Código:</span>
          <strong style={{ color: '#a78bfa', fontSize: '18px', letterSpacing: '1px' }}>{inviteCode || '---'}</strong>
          <button 
            onClick={handleCopyCode}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', marginLeft: '8px' }}
            title="Copiar Código"
          >
            {copied ? (
              <Check style={{ width: '18px', height: '18px', color: '#10b981' }} />
            ) : (
              <Copy style={{ width: '18px', height: '18px', color: '#a1a1aa' }} />
            )}
          </button>
        </div>
      </div>

      {/* Título da Listagem */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users style={{ color: '#a78bfa' }} /> Membros da Equipe ({members.length})
        </h1>
      </div>

      {/* Tabela / Lista de Integrantes */}
      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Carregando equipe...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((member) => (
            <div key={member.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: member.role === 'leader' ? '#7c3aed' : '#27272a', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  {member.role === 'leader' ? <Shield style={{ width: '16px', height: '16px', color: '#fff' }} /> : <Music style={{ width: '16px', height: '16px', color: '#a1a1aa' }} />}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{member.full_name}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>{member.function || 'Não especificado'}</p>
                </div>
              </div>

              <span style={{ 
                fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold',
                backgroundColor: member.role === 'leader' ? '#2e1065' : '#14532d',
                color: member.role === 'leader' ? '#c084fc' : '#4ade80',
                border: `1px solid ${member.role === 'leader' ? '#5b21b6' : '#166534'}`
              }}>
                {member.role === 'leader' ? 'Líder' : 'Integrante'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}