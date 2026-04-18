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
  const [newQuestion, setNewQuestion] = useState({ question_text: '', type: 'valutazione', sort_order: 1 });
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    loadData();
  }, [tab, filterCourse]);

  async function loadData() {
    setLoading(true);
    try {
      const [qRes, cRes, rRes, aRes] = await Promise.all([
        supabase.from('questions').select('*').order('sort_order', { ascending: true }),
        supabase.from('courses').select('*').order('name', { ascending: true }),
        supabase.from('responses').select('*').order('created_at', { ascending: false }),
        supabase.from('answers').select('*')
      ]);

      const qData = qRes.data || [];
      const cData = cRes.data || [];
      let rData = rRes.data || [];
      const aData = aRes.data || [];

      setQuestions(qData);
      setCourses(cData);

      if (filterCourse !== 'all') {
        rData = rData.filter(r => String(r.course_id) === String(filterCourse));
      }

      // Elaborazione Statistiche Safe
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

      const merged = rData.map(r => ({
        ...r,
        course_name: cData.find(c => c.id === r.course_id)?.name || 'Generico',
        details: aData.filter(a => a.response_id === r.id).map(a => ({
          ...a,
          q_text: qData.find(q => q.id === a.question_id)?.question_text || 'Domanda eliminata'
        }))
      }));
      setResponses(merged);

    } catch (e) {
      console.error("Errore Sync:", e);
    } finally {
      setLoading(false);
    }
  }

  // AZIONI CRUD
  const handleDelete = async (table, id) => {
    if (!confirm("Confermi eliminazione?")) return;
    await supabase.from(table).delete().eq('id', id);
    loadData();
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text) return;
    await supabase.from('questions').insert([newQuestion]);
    setNewQuestion({ question_text: '', type: 'valutazione', sort_order: questions.length + 1 });
    loadData();
  };

  const handleAddCourse = async () => {
    if (!newCourse) return;
    await supabase.from('courses').insert([{ name: newCourse }]);
    setNewCourse('');
    loadData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600 bg-slate-50">Sincronizzazione...</div>;

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-10">
      <nav className="bg-white border-b sticky top-0 z-50 p-4 print:hidden shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-blue-600 tracking-tighter">COMART ADMIN</h1>
            <button onClick={() => window.location.href='/'} className="bg-slate-100 px-3 py-1 rounded-lg text-slate-500 text-xs font-bold">Esci</button>
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

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {tab === 'report' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border shadow-sm print:hidden">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Seleziona Corso</label>
              <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                <option value="all">Tutti i corsi</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.map((s, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 line-clamp-1">{s.question_text}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black">{s.score || '0'}</span>
                    <span className="text-[9px] font-bold text-blue-500">{s.total} risposte</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${s.perc || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              {responses?.map(res => (
                <div key={res.id} className="bg-white border rounded-2xl p-5 shadow-sm break-inside-avoid">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <span className="text-[10px] font-black text-blue-600 truncate max-w-[200px] uppercase">{res.course_name}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{res.created_at ? new Date(res.created_at).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {res.details?.map((d, i) => (
                      <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                        <span className="text-slate-500 truncate mr-4">{d.q_text}</span>
                        <span className="font-bold text-slate-900 shrink-0 uppercase">{d.answer_value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] bg-slate-50 p-3 rounded-xl italic text-slate-600">
                    <p className="mb-1"><strong>Feedback:</strong> {res.commenti || '-'}</p>
                    <p><strong>Miglioria:</strong> {res.suggerimenti || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'domande' && (
          <div className="bg-white rounded-2xl p-5 border shadow-sm max-w-2xl mx-auto">
            <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl border-2 border-dashed">
              <input type="text" placeholder="Testo domanda..." className="w-full p-3 border rounded-xl text-sm" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" className="w-20 p-3 border rounded-xl text-sm font-bold" value={newQuestion.sort_order} onChange={e => setNewQuestion({...newQuestion, sort_order: parseInt(e.target.value) || 0})} />
                <button onClick={handleAddQuestion} className="flex-1 bg-blue-600 text-white rounded-xl font-bold text-sm py-3">Salva</button>
              </div>
            </div>
            <div className="divide-y">
              {questions?.map(q => (
                <div key={q.id} className="flex justify-between items-center py-4 group">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-md">{q.sort_order}</span>
                    <span className="text-sm font-medium text-slate-700">{q.question_text}</span>
                  </div>
                  <button onClick={() => handleDelete('questions', q.id)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase ml-4">Elimina</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'corsi' && (
          <div className="bg-white rounded-2xl p-5 border shadow-sm max-w-2xl mx-auto">
            <div className="flex gap-2 mb-8 bg-slate-50 p-4 rounded-xl border-2 border-dashed">
              <input type="text" placeholder="Nome corso..." className="flex-1 p-3 border rounded-xl text-sm" value={newCourse} onChange={e => setNewCourse(e.target.value)} />
              <button onClick={handleAddCourse} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm">Aggiungi</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {courses?.map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm hover:border-blue-200 transition-all">
                  <span className="font-bold text-sm uppercase text-slate-700 tracking-tight">{c.name}</span>
                  <button onClick={() => handleDelete('courses', c.id)} className="text-red-300 hover:text-red-500">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
