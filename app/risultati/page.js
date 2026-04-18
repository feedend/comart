"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState([]);
  const [filterCourse, setFilterCourse] = useState('all');
  
  // Stati per CRUD
  const [newQuestion, setNewQuestion] = useState({ question_text: '', type: 'valutazione', sort_order: 1 });
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    loadData();
  }, [tab, filterCourse]);

  async function loadData() {
    setLoading(true);
    try {
      // Carichiamo tutto. Nota: usiamo submitted_at come visto nel tuo SQL
      const [qRes, cRes, rRes, aRes] = await Promise.all([
        supabase.from('questions').select('*').order('sort_order', { ascending: true }),
        supabase.from('courses').select('*').order('name', { ascending: true }),
        supabase.from('responses').select('*').order('submitted_at', { ascending: false }),
        supabase.from('answers').select('*')
      ]);

      const qData = qRes.data || [];
      const cData = cRes.data || [];
      let rData = rRes.data || [];
      const aData = aRes.data || [];

      setQuestions(qData);
      setCourses(cData);

      // Filtro Corso
      if (filterCourse !== 'all') {
        rData = rData.filter(r => String(r.course_id) === String(filterCourse));
      }

      // 1. Calcolo Statistiche
      const calculatedStats = qData.map(q => {
        const relatedAns = aData.filter(a => a.question_id === q.id && rData.some(r => r.id === a.response_id));
        const total = relatedAns.length;
        let score = 0;
        let perc = 0;

        if (total > 0) {
          if (q.type === 'valutazione') {
            const weights = { 'insufficiente': 1, 'sufficiente': 2, 'buono': 3, 'ottimo': 4 };
            const sum = relatedAns.reduce((acc, curr) => acc + (weights[curr.answer_value?.toLowerCase()] || 0), 0);
            score = (sum / total).toFixed(1);
            perc = (score / 4) * 100;
          } else {
            const siCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'si').length;
            perc = (siCount / total) * 100;
            score = perc.toFixed(0) + '%';
          }
        }
        return { ...q, score, total, perc };
      });
      setStats(calculatedStats);

      // 2. Merge per la lista (usiamo submitted_at)
      const merged = rData.map(r => ({
        ...r,
        course_name: cData.find(c => c.id === r.course_id)?.name || 'Corso #' + r.course_id,
        details: aData.filter(a => a.response_id === r.id).map(a => ({
          ...a,
          q_text: qData.find(q => q.id === a.question_id)?.question_text || 'Domanda #' + a.question_id
        }))
      }));
      setResponses(merged);

    } catch (e) {
      console.error("Errore Caricamento:", e);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNZIONI CRUD ---
  const handleAddQuestion = async () => {
    if (!newQuestion.question_text) return;
    await supabase.from('questions').insert([newQuestion]);
    setNewQuestion({ ...newQuestion, question_text: '', sort_order: questions.length + 2 });
    loadData();
  };

  const handleAddCourse = async () => {
    if (!newCourse) return;
    await supabase.from('courses').insert([{ name: newCourse }]);
    setNewCourse('');
    loadData();
  };

  const handleDelete = async (table, id) => {
    if (!confirm("Eliminare l'elemento?")) return;
    await supabase.from(table).delete().eq('id', id);
    loadData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 tracking-widest bg-slate-50 uppercase p-10 text-center">Caricamento dati Comart...</div>;

  return (
    <main className="min-h-screen bg-slate-100 pb-10 font-sans text-slate-900">
      {/* HEADER MOBILE READY */}
      <nav className="bg-white border-b sticky top-0 z-50 p-4 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-blue-600 tracking-tighter">COMART DASHBOARD</h1>
            <button onClick={() => window.location.href='/'} className="text-[10px] font-black uppercase text-slate-400 border px-2 py-1 rounded">Home</button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto gap-1">
            {['report', 'domande', 'corsi'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === t ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 max-w-5xl mx-auto">
        {tab === 'report' && (
          <div className="space-y-6">
            {/* FILTRO */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm print:hidden">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Filtra per Corso</label>
              <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                <option value="all">Tutti i corsi</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats?.map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 line-clamp-1">{s.question_text}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-black text-slate-800">{s.score || '0'}</span>
                    <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{s.total} risposte</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${s.perc || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* LISTA FEEDBACK */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest px-2">Risposte Recenti</h2>
              {responses.length === 0 && <div className="text-center p-10 text-slate-400 font-bold italic">Nessun feedback trovato.</div>}
              {responses.map(res => (
                <div key={res.id} className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter truncate max-w-[180px]">{res.course_name}</span>
                    <span className="text-[9px] text-slate-400 font-bold italic">{res.submitted_at ? new Date(res.submitted_at).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {res.details?.map((d, i) => (
                      <div key={i} className="flex justify-between text-[10px] gap-4">
                        <span className="text-slate-500 truncate">{d.q_text}</span>
                        <span className="font-black text-slate-800 shrink-0 uppercase">{d.answer_value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] bg-slate-50 p-3 rounded-lg border-l-2 border-blue-400 text-slate-600">
                    <p className="mb-1 text-slate-400 font-black uppercase text-[8px]">Commenti e Suggerimenti</p>
                    <p className="italic">"{res.commenti || '-'}"</p>
                    <p className="italic mt-1 border-t border-slate-200 pt-1">"{res.suggerimenti || '-'}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: DOMANDE */}
        {tab === 'domande' && (
          <div className="bg-white rounded-2xl p-6 border shadow-sm max-w-xl mx-auto">
            <h2 className="text-lg font-black mb-6">Questionario</h2>
            <div className="space-y-3 mb-8 p-4 bg-slate-50 rounded-xl border-2 border-dashed">
              <input type="text" placeholder="Testo domanda..." className="w-full p-3 border rounded-xl text-sm font-bold" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" className="w-16 p-3 border rounded-xl text-sm font-bold" value={newQuestion.sort_order} onChange={e => setNewQuestion({...newQuestion, sort_order: parseInt(e.target.value) || 0})} />
                <button onClick={handleAddQuestion} className="flex-1 bg-blue-600 text-white rounded-xl font-black text-xs uppercase py-3">Salva Domanda</button>
              </div>
            </div>
            <div className="divide-y">
              {questions.map(q => (
                <div key={q.id} className="flex justify-between items-center py-4 group">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-slate-200 w-6 h-6 flex items-center justify-center rounded-md">{q.sort_order}</span>
                    <span className="text-xs font-bold text-slate-600">{q.question_text}</span>
                  </div>
                  <button onClick={() => handleDelete('questions', q.id)} className="text-red-400 hover:text-red-600 font-bold text-[9px] uppercase">Elimina</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CORSI */}
        {tab === 'corsi' && (
          <div className="bg-white rounded-2xl p-6 border shadow-sm max-w-xl mx-auto">
            <h2 className="text-lg font-black mb-6">Corsi</h2>
            <div className="flex gap-2 mb-8 bg-slate-50 p-4 rounded-xl border-2 border-dashed">
              <input type="text" placeholder="Esempio: Corso Sicurezza" className="flex-1 p-3 border rounded-xl text-sm font-bold" value={newCourse} onChange={e => setNewCourse(e.target.value)} />
              <button onClick={handleAddCourse} className="bg-slate-900 text-white px-4 rounded-xl font-black text-[9px] uppercase">Aggiungi</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {courses.map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <span className="font-black text-xs uppercase text-slate-700 tracking-tighter">{c.name}</span>
                  <button onClick={() => handleDelete('courses', c.id)} className="text-red-300 hover:text-red-600">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
