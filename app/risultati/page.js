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
      // Caricamento parallelo per velocità
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

      // Filtro corso
      if (filterCourse !== 'all') {
        rData = rData.filter(r => r.course_id == filterCourse);
      }

      // Elaborazione Statistiche
      const calculatedStats = qData.map(q => {
        const relatedAns = aData.filter(a => a.question_id === q.id && rData.some(r => r.id === a.response_id));
        const total = relatedAns.length;
        let score = 0;
        if (q.type === 'valutazione' && total > 0) {
          const weights = { 'insufficiente': 1, 'sufficiente': 2, 'buono': 3, 'ottimo': 4 };
          const sum = relatedAns.reduce((acc, curr) => acc + (weights[curr.answer_value?.toLowerCase()] || 0), 0);
          score = (sum / total).toFixed(1);
        } else if (q.type === 'si_no' && total > 0) {
          const siCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'si').length;
          score = ((siCount / total) * 100).toFixed(0) + '%';
        }
        return { ...q, score, total, perc: q.type === 'valutazione' ? (score / 4) * 100 : parseInt(score) };
      });
      setStats(calculatedStats);

      // Merge per lista feedback
      const merged = rData.map(r => ({
        ...r,
        course_name: cData.find(c => c.id === r.course_id)?.name || 'Generico',
        details: aData.filter(a => a.response_id === r.id).map(a => ({
          ...a,
          q_text: qData.find(q => q.id === a.question_id)?.question_text || 'Domanda eliminata'
        }))
      }));
      setResponses(merged);

    } catch (e) { console.error("Errore Sync:", e); }
    setLoading(false);
  }

  const handleDelete = async (table, id) => {
    if (!confirm("Confermi eliminazione?")) return;
    await supabase.from(table).delete().eq('id', id);
    loadData();
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text) return;
    await supabase.from('questions').insert([newQuestion]);
    setNewQuestion({...newQuestion, question_text: ''});
    loadData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Sincronizzazione Supabase...</div>;

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* HEADER MOBILE RESPONSIVE */}
      <nav className="bg-white border-b sticky top-0 z-50 p-4 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-blue-600 tracking-tighter">COMART ADMIN</h1>
            <button onClick={() => window.location.href='/'} className="text-slate-400 text-sm font-bold">Esci</button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {['report', 'domande', 'corsi'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === t ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        
        {/* VIEW: REPORT */}
        {tab === 'report' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border shadow-sm print:hidden">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Filtra Risultati</label>
              <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                <option value="all">Tutti i corsi</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* STATS GRID - Responsive 1 col mobile, 3 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 line-clamp-1">{s.question_text}</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black">{s.score || '0'}</span>
                    <span className="text-[9px] font-bold text-blue-500">{s.total} risposte</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.perc}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* FEEDBACK LIST */}
            <div className="space-y-4 pt-6">
              <h2 className="text-lg font-black uppercase tracking-tight">Dettaglio Feedback</h2>
              {responses.map(res => (
                <div key={res.id} className="bg-white border rounded-2xl p-5 shadow-sm break-inside-avoid">
                  <div className="flex justify-between mb-4">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md truncate max-w-[150px]">{res.course_name}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {res.details.map((d, i) => (
                      <div key={i} className="flex justify-between text-xs border-b border-slate-50 pb-1">
                        <span className="text-slate-500 truncate mr-4">{d.q_text}</span>
                        <span className="font-bold text-slate-900 shrink-0">{d.answer_value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs bg-slate-50 p-3 rounded-xl italic text-slate-600">
                    <p><strong>Note:</strong> {res.commenti || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DOMANDE */}
        {tab === 'domande' && (
          <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl">
              <input type="text" placeholder="Domanda..." className="w-full p-3 border rounded-xl text-sm" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" className="w-20 p-3 border rounded-xl text-sm" value={newQuestion.sort_order} onChange={e => setNewQuestion({...newQuestion, sort_order: parseInt(e.target.value)})} />
                <button onClick={handleAddQuestion} className="flex-1 bg-blue-600 text-white rounded-xl font-bold text-sm">Salva</button>
              </div>
            </div>
            <div className="space-y-2">
              {questions.map(q => (
                <div key={q.id} className="flex justify-between items-center p-3 border-b text-sm font-medium">
                  <span className="truncate mr-2">{q.sort_order}. {q.question_text}</span>
                  <button onClick={() => handleDelete('questions', q.id)} className="text-red-400 text-[10px] font-bold uppercase">X</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: CORSI */}
        {tab === 'corsi' && (
          <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex gap-2 mb-8">
              <input type="text" placeholder="Nome corso..." className="flex-1 p-3 border rounded-xl text-sm" value={newCourse} onChange={e => setNewCourse(e.target.value)} />
              <button onClick={handleAddCourse} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm">Add</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {courses.map(c => (
                <div key={c.id} className="flex justify-between p-4 bg-slate-50 rounded-xl border">
                  <span className="font-bold text-sm uppercase">{c.name}</span>
                  <button onClick={() => handleDelete('courses', c.id)} className="text-red-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
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
