import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface ModoShowProps {
  userProfile: {
    id: string;
    organization_id: string;
  };
  onBackToDashboard: () => void;
}

export default function ModoShow({ userProfile, onBackToDashboard }: ModoShowProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [notConfirmed, setNotConfirmed] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  async function fetchUpcomingEvents() {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('event_date', { ascending: true }); // Correção de coluna aqui

    if (data) setEvents(data);
    setLoading(false);
  }

  async function loadEventPlaylist(event: any) {
    setLoading(true);
    const { data: scheduleData } = await supabase
      .from('schedules')
      .select('status')
      .eq('event_id', event.id)
      .eq('profile_id', userProfile.id)
      .single();

    if (!scheduleData || scheduleData.status !== 'accepted') {
      setNotConfirmed(true);
      setLoading(false);
      return;
    }

    const { data: setlistsData } = await supabase
      .from('setlists')
      .select('id, setlist_songs (position, chord_sheets (*))')
      .eq('event_id', event.id)
      .single();

    if (setlistsData?.setlist_songs) {
      const sortedSongs = setlistsData.setlist_songs
        .sort((a: any, b: any) => a.position - b.position)
        .map((item: any) => ({ ...item.chord_sheets, localContent: item.chord_sheets.content }));
      setPlaylist(sortedSongs);
    }
    setSelectedEvent(event);
    setLoading(false);
  }

  useEffect(() => {
    if (!isScrolling) return;

    const interval = window.setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'auto' });
    }, 1000 / 15);

    return () => window.clearInterval(interval);
  }, [isScrolling]);

  if (!selectedEvent) {
    return (
      <div style={{ padding: '24px', color: '#f4f4f5', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button onClick={onBackToDashboard} style={{ background: '#27272a', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <ArrowLeft />
          </button>
          <h1 style={{ margin: 0 }}>Modo Show</h1>
        </div>
        {notConfirmed && <div style={{ color: '#fca5a5', marginBottom: '20px' }}><AlertCircle /> Confirme presença na Agenda para acessar.</div>}
        {events.map(ev => (
          <div key={ev.id} onClick={() => loadEventPlaylist(ev)} style={{ backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer' }}>
            {ev.title} - {ev.event_date}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ color: '#f4f4f5', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#18181b', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #27272a' }}>
        <button onClick={onBackToDashboard} style={{ background: '#27272a', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
          <ArrowLeft />
        </button>
        <h2 style={{ margin: 0 }}>{selectedEvent.title}</h2>
        <button onClick={() => setIsScrolling(!isScrolling)} style={{ marginLeft: 'auto', padding: '8px 16px', cursor: 'pointer' }}>
          {isScrolling ? 'Parar Rolagem' : 'Iniciar Rolagem'}
        </button>
      </div>
      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
        {playlist.map((song, index) => (
          <div key={song.id} style={{ marginBottom: '40px', borderBottom: '1px solid #3f3f46' }}>
            <h3>{song.title}</h3>
            {editingIndex === index ? (
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', height: '200px' }} />
            ) : (
              <pre>{song.localContent}</pre>
            )}
            <button onClick={() => { setEditingIndex(index); setEditContent(song.localContent); }}>Editar</button>
          </div>
        ))}
      </div>
    </div>
  );
}