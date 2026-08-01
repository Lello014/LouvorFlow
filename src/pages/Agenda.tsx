import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronLeft, ChevronRight, Pencil, UserPlus, Trash2, Bell, Plus, X, Save } from 'lucide-react';

export default function Agenda({ userProfile }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('19:00');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [newSongs, setNewSongs] = useState<{ title: string; link: string }[]>([]);
  const [songTitleInput, setSongTitleInput] = useState('');
  const [songLinkInput, setSongLinkInput] = useState('');

  const [selectedEventForEdit, setSelectedEventForEdit] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');

  // VARIÁVEL DE SEGURANÇA BLINDADA: Aceita diversas formas da palavra Líder
  const isUserLeader = 
    userProfile?.role?.toLowerCase() === 'leader' || 
    userProfile?.role?.toLowerCase() === 'lider' || 
    userProfile?.role?.toLowerCase() === 'líder';

  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchEvents();
      fetchMembers();
    }
  }, [currentDate, userProfile]);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', userProfile.organization_id);
      
      if (error) throw error;

      if (data) {
        const eventsWithDetails = await Promise.all(data.map(async (ev) => {
          const { data: sched } = await supabase.from('schedules').select('*, profiles(full_name)').eq('event_id', ev.id);
          const { data: songs } = await supabase.from('event_songs').select('*').eq('event_id', ev.id);
          return { ...ev, schedules: sched || [], event_songs: songs || [] };
        }));
        setEvents(eventsWithDetails);
      }
    } catch (e) {
      console.error("Erro ao buscar eventos:", e);
    }
  }

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', userProfile.organization_id);
      
      if (error) throw error;
      if (data) setAllMembers(data);
    } catch (e) {
      console.error("Erro ao buscar membros:", e);
    }
  }

  function handleAddSong() {
    if (!songTitleInput.trim()) return;
    setNewSongs([...newSongs, { title: songTitleInput, link: songLinkInput }]);
    setSongTitleInput('');
    setSongLinkInput('');
  }

  function handleRemoveSong(index: number) {
    setNewSongs(newSongs.filter((_, i) => i !== index));
  }

  async function createEvent() {
    if (!newTitle.trim()) {
      alert("Por favor, insira o nome do evento.");
      return;
    }

    try {
      const { data: eventData, error: eventError } = await supabase.from('events').insert([{ 
        title: newTitle, 
        event_date: selectedDateStr, 
        event_time: `${newTime}:00`, 
        organization_id: userProfile.organization_id 
      }]).select().single();

      if (eventError) throw eventError;

      const createdEventId = eventData.id;

      if (selectedMembers.length > 0) {
        const scheduleInserts = selectedMembers.map(memberId => ({
          event_id: createdEventId,
          profile_id: memberId,
          status: 'pending'
        }));
        await supabase.from('schedules').insert(scheduleInserts);
      }

      if (newSongs.length > 0) {
        const songInserts = newSongs.map(song => ({
          event_id: createdEventId,
          song_title: song.title,
          song_link: song.link
        }));
        await supabase.from('event_songs').insert(songInserts);
      }

      setNewTitle('');
      setNewTime('19:00');
      setSelectedMembers([]);
      setNewSongs([]);
      setShowCreateModal(false);
      fetchEvents();
    } catch (error: any) {
      alert("Erro ao criar evento: " + error.message);
    }
  }

  async function updateEventDetails() {
    if (!editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          title: editTitle, 
          event_time: `${editTime.length === 5 ? editTime + ':00' : editTime}` 
        })
        .eq('id', selectedEventForEdit.id);

      if (error) throw error;
      
      alert("Evento atualizado com sucesso!");
      fetchEvents();
      setSelectedEventForEdit({ ...selectedEventForEdit, title: editTitle, event_time: editTime });
    } catch (error: any) {
      alert("Erro ao atualizar evento: " + error.message);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!window.confirm("Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.")) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      
      setSelectedEventForEdit(null);
      fetchEvents();
    } catch (error: any) {
      alert("Erro ao excluir evento: " + error.message);
    }
  }

  async function updateStatus(eventId: string, status: 'accepted' | 'declined') {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status })
        .eq('event_id', eventId)
        .eq('profile_id', userProfile.id);

      if (error) throw error;
      fetchEvents();
    } catch (error: any) {
      alert("Erro ao atualizar status: " + error.message);
    }
  }

  async function handleUpdateSchedule(eventId: string, memberId: string, action: 'add' | 'remove') {
    try {
      if (action === 'remove') {
        await supabase.from('schedules').delete().eq('event_id', eventId).eq('profile_id', memberId);
      } else {
        await supabase.from('schedules').insert([{ event_id: eventId, profile_id: memberId, status: 'pending' }]);
      }
      fetchEvents();
      
      const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (ev) {
        const { data: sched } = await supabase.from('schedules').select('*, profiles(full_name)').eq('event_id', eventId);
        const { data: songs } = await supabase.from('event_songs').select('*').eq('event_id', eventId);
        setSelectedEventForEdit({ ...ev, schedules: sched || [], event_songs: songs || [] });
      }
    } catch (error) {
      console.error("Erro ao atualizar escala:", error);
    }
  }

  function openEditModal(ev: any) {
    setSelectedEventForEdit(ev);
    setEditTitle(ev.title);
    setEditTime(ev.event_time.substring(0, 5));
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  return (
    <div style={{ background: '#18181b', color: '#fff', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} style={{ background: '#27272a', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><ChevronLeft/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} style={{ background: '#27272a', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><ChevronRight/></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} style={{ textAlign: 'center', color: '#71717a', fontSize: '12px', paddingBottom: '8px' }}>{day}</div>
        ))}
        
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.event_date === dayStr);
          
          return (
            <div key={day} style={{ background: '#202024', minHeight: '130px', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{day}</span>
                <button 
                  onClick={() => { 
                    if (!isUserLeader) {
                      alert(`Acesso negado. O sistema identificou seu papel no banco de dados como: "${userProfile?.role || 'não definido'}". O cadastro não salvou você como Líder.`);
                      return;
                    }
                    setSelectedDateStr(dayStr); 
                    setShowCreateModal(true); 
                  }} 
                  style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                >
                  +
                </button>
              </div>

              {dayEvents.map(ev => {
                const mySchedule = ev.schedules?.find((s: any) => s.profile_id === userProfile?.id);
                const myStatus = mySchedule ? mySchedule.status : null;

                if (!isUserLeader && myStatus === 'declined') return null;
                if (!isUserLeader && !mySchedule) return null;

                return (
                  <div key={ev.id} style={{ background: myStatus === 'pending' ? '#78350f' : '#7c3aed', fontSize: '11px', padding: '6px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      {isUserLeader && (
                        <button onClick={() => openEditModal(ev)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Pencil size={12}/></button>
                      )}
                    </div>

                    {!isUserLeader && myStatus === 'pending' && (
                      <div style={{ background: '#451a03', padding: '4px', borderRadius: '4px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <Bell size={10} color="#f59e0b" />
                          <span>Convite pendente!</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => updateStatus(ev.id, 'accepted')} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '9px' }}>Aceitar</button>
                          <button onClick={() => updateStatus(ev.id, 'declined')} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '9px' }}>Recusar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#18181b', padding: '24px', borderRadius: '16px', width: '450px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #27272a', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Criar Evento ({selectedDateStr})</h3>
            
            <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Nome do Evento</label>
            <input 
              type="text" 
              placeholder="Ex: Culto de Domingo" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Horário</label>
            <input 
              type="time" 
              value={newTime} 
              onChange={e => setNewTime(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', marginTop: '4px', marginBottom: '16px', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Escalar Membros Disponíveis</label>
            <div style={{ background: '#202024', borderRadius: '8px', padding: '8px', maxHeight: '140px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #27272a' }}>
              {allMembers.map(m => {
                const isChecked = selectedMembers.includes(m.id);
                return (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                        } else {
                          setSelectedMembers([...selectedMembers, m.id]);
                        }
                      }}
                    />
                    {m.full_name}
                  </label>
                );
              })}
            </div>

            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Músicas (Opcional)</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input 
                type="text" 
                placeholder="Título da música" 
                value={songTitleInput}
                onChange={e => setSongTitleInput(e.target.value)}
                style={{ flex: 2, padding: '8px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
              />
              <input 
                type="text" 
                placeholder="Link/Cifra" 
                value={songLinkInput}
                onChange={e => setSongLinkInput(e.target.value)}
                style={{ flex: 2, padding: '8px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
              />
              <button onClick={handleAddSong} style={{ background: '#7c3aed', border: 'none', padding: '0 12px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}><Plus size={16}/></button>
            </div>

            {newSongs.length > 0 && (
              <div style={{ background: '#202024', borderRadius: '8px', padding: '8px', maxHeight: '100px', overflowY: 'auto', marginBottom: '16px' }}>
                {newSongs.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #27272a' }}>
                    <span>🎵 {s.title}</span>
                    <button onClick={() => handleRemoveSong(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={createEvent} style={{ flex: 1, padding: '10px', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Evento</button>
              <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '10px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {selectedEventForEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#18181b', padding: '24px', borderRadius: '16px', width: '450px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #27272a', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Editar Evento</h3>
              <button onClick={() => deleteEvent(selectedEventForEdit.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Nome</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#a1a1aa' }}>Horário</label>
                <input 
                  type="time" 
                  value={editTime} 
                  onChange={e => setEditTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={updateEventDetails} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', height: '35px' }}>
                  <Save size={16} />
                </button>
              </div>
            </div>

            <hr style={{ borderColor: '#27272a', margin: '16px 0' }} />

            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Escala de Membros</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #27272a', borderRadius: '8px', padding: '8px', background: '#202024' }}>
              {allMembers.map(m => {
                const isScheduled = selectedEventForEdit.schedules?.find((s: any) => s.profile_id === m.id);
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #27272a' }}>
                    <div>
                      <span style={{ fontSize: '14px' }}>{m.full_name}</span>
                      {isScheduled && <span style={{ fontSize: '10px', display: 'block', color: isScheduled.status === 'accepted' ? '#10b981' : isScheduled.status === 'declined' ? '#ef4444' : '#f59e0b' }}>Status: {isScheduled.status}</span>}
                    </div>
                    <button 
                      onClick={() => handleUpdateSchedule(selectedEventForEdit.id, m.id, isScheduled ? 'remove' : 'add')} 
                      style={{ background: isScheduled ? '#ef4444' : '#7c3aed', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}
                    >
                      {isScheduled ? <Trash2 size={14} /> : <UserPlus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <label style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Músicas do Evento</label>
            <div style={{ background: '#202024', borderRadius: '8px', padding: '8px', maxHeight: '100px', overflowY: 'auto', marginBottom: '16px' }}>
              {selectedEventForEdit.event_songs && selectedEventForEdit.event_songs.length > 0 ? (
                selectedEventForEdit.event_songs.map((song: any) => (
                  <div key={song.id} style={{ fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #27272a' }}>
                    🎵 {song.song_title} {song.song_link && <a href={song.song_link} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', fontSize: '11px', marginLeft: '6px' }}>(Link)</a>}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#71717a' }}>Nenhuma música adicionada.</span>
              )}
            </div>

            <button onClick={() => setSelectedEventForEdit(null)} style={{ width: '100%', padding: '10px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      )}

    </div>
  );
}