"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(true);
  
  // Dati
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState([]);
  
  // Filtri e Form
  const [filterCourse, setFilterCourse] = useState('all');
  const [newQuestion, setNewQuestion] = useState({ question_text: '', type: 'valutazione', sort_order: 1 });
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    loadData();
  }, [tab, filterCourse]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Caricamento Domande e Corsi
      const { data: qData } = await supabase.from('questions').select('*').order('sort_order', { ascending: true });
      const { data: cData } = await supabase.from('courses').select('*').order('name', { ascending: true });
      setQuestions(qData || []);
      setCourses(cData || []);

      // 2. Caricamento Risposte
      let resQuery = supabase.from('responses').select('*');
      if (filterCourse !== 'all') {
        resQuery = resQuery.eq('course_id', filterCourse);
      }
      const { data: resData } = await resQuery.order('created_at', { ascending: false });
      
      const { data: ansData } = await supabase.from('answers').select('*');

      // 3. Elaborazione Statistiche Aggregate
      const calculatedStats = qData.map(q => {
        // Se c'è un filtro corso, prendiamo solo le risposte di quel corso
        const validResponseIds = filterCourse === 'all' 
          ? resData?.map(r => r.id) 
          : resData?.filter(r => r.course_id == filterCourse).map(r => r.id);

        const relatedAns = ansData?.filter(a => a.question_id === q.id && validResponseIds?.includes(a.response_id)) || [];
        const total = relatedAns.length;
        
        let calc = { type: q.type, total, avg: 0, perc: 0 };
        
        if (q.type === 'valutazione' && total > 0) {
          const weights = { 'insufficiente': 1, 'sufficiente': 2, 'buono': 3, 'ottimo': 4 };
          const sum = relatedAns.reduce((acc, curr) => acc + (weights[curr.answer_value?.toLowerCase()] || 0), 0);
          calc.avg = (sum / total).toFixed(1);
          calc.perc = ((calc.avg / 4) * 100).toFixed(0);
        } else if (q.type === 'si_no' && total > 0) {
          const siCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'si').length;
          calc.perc = ((siCount / total) * 100).toFixed(0);
        }
        return { ...q, ...calc };
      });
      setStats(calculatedStats);

      // 4. Merge Dati per lista feedback
      const merged = resData?.map(r => ({
        ...r,
        course_name: cData?.find(c => c.id === r.course_id)?.name || 'N/D',
        details: ansData?.filter(a => a.response_id === r.id).map(a => ({
          ...a,
          question_text: qData?.find(q => q.id === a.question_id)?.question_text || 'Domanda eliminata'
        }))
      }));
      setResponses(merged || []);

    } catch (e) { console.error("Errore Dashboard:", e); }
    setLoading(false);
  }

  // --- AZIONI ---
  const handleAddQuestion = async () => {
    if (!newQuestion.question_text) return;
    await supabase.from('questions').insert([newQuestion]);
    setNewQuestion({ ...newQuestion, question_text: '', sort_order: questions.length + 2 });
    loadData();
  };

  const handleDelete = async (table, id) => {
    if (confirm("Sei sicuro di voler eliminare questo elemento?")) {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse) return;
    await supabase.from('courses').insert([{ name: newCourse }]);
    setNewCourse('');
    loadData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">CARICAMENTO DATI...</div>;

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* NAVBAR */}
      <nav className="bg-white border-b sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href='/'}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic">C</div>
            <h1 className="text-xl font-black tracking-tighter">COMART <span className="text-slate-400">ADMIN</span></h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
            {['report', 'domande', 'corsi'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${tab === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 mt-6">
        
        {/* TAB: REPORT (STATISTICHE + FEEDBACK) */}
        {tab === 'report' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* FILTRI */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-6 rounded-[2rem] border shadow-sm print:hidden">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Filtra per Corso</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                >
                  <option value="all">Tutti i corsi</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-blue-600 transition-all">STAMPA PDF</button>
            </div>

            {/* GRID STATISTICHE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 leading-tight h-8 overflow-hidden">{s.question_text}</p>
                  {s.total > 0 ? (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-4xl font-black text-slate-800 tracking-tighter">
                          {s.type === 'valutazione' ? `${s.avg}` : `${s.perc}%`}
                        </span>
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{s.total} risposte</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${s.perc}%` }} />
                      </div>
                    </div>
                  ) : <p className="text-slate-300 text-xs italic">Nessun dato per questo filtro</p>}
                </div>
              ))}
            </div>

            {/* FEEDBACK SINGOLI */}
            <div className="space-y-6 pt-10 border-t">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Dettaglio Feedback</h2>
              {responses.map(res => (
                <div key={res.id} className="bg-white border rounded-[2.5rem] p-8 shadow-sm break-inside-avoid">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase mr-2">{res.course_name}</span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{new Date(res.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {res.details?.map((a, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase truncate mb-1">{a.question_text}</p>
                        <p className="font-black text-slate-800 capitalize">{a.answer_value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border-l-4 border-blue-500 italic text-sm text-slate-600">
                    <p className="mb-2"><strong>Commento:</strong> {res.commenti || 'N/D'}</p>
                    <p><strong>Miglioramento:</strong> {res.suggerimenti || 'N/D'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: DOMANDE */}
        {tab === 'domande' && (
          <div className="bg-white rounded-[2.5rem] p-10 border shadow-sm max-w-4xl mx-auto">
            <h2 className="text-3xl font-black mb-8">Struttura Questionario</h2>
            <div className="flex flex-wrap gap-3 mb-12 bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed">
              <input type="number" className="w-16 p-3 border rounded-xl font-black" value={newQuestion.sort_order} onChange={e => setNewQuestion({...newQuestion, sort_order: parseInt(e.target.value)})} />
              <input type="text" placeholder="Nuova domanda..." className="flex-1 min-w-[300px] p-3 border rounded-xl font-bold" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} />
              <select className="p-3 border rounded-xl font-bold bg-white" value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}>
                <option value="valutazione">Valutazione</option>
                <option value="si_no">Sì / No</option>
              </select>
              <button onClick={handleAddQuestion} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black">SALVA</button>
            </div>
            <div className="space-y-2">
              {questions.map(q => (
                <div key={q.id} className="group flex justify-between items-center p-5 border-b hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded-lg font-black text-xs">{q.sort_order}</span>
                    <span className="font-bold text-slate-700">{q.question_text}</span>
                  </div>
                  <button onClick={() => handleDelete('questions', q.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 font-bold px-2 uppercase text-[10px]">Elimina</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CORSI */}
        {tab === 'corsi' && (
          <div className="bg-white rounded-[2.5rem] p-10 border shadow-sm max-w-4xl mx-auto">
            <h2 className="text-3xl font-black mb-8">Elenco Corsi</h2>
            <div className="flex gap-4 mb-12">
              <input type="text" placeholder="Esempio: Corso Marketing 2024" className="flex-1 p-4 border rounded-2xl font-bold bg-slate-50" value={newCourse} onChange={e => setNewCourse(e.target.value)} />
              <button onClick={handleAddCourse} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black">AGGIUNGI</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(c => (
                <div key={c.id} className="p-6 bg-slate-50 border rounded-3xl flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">ID: {c.id}</p>
                    <p className="font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                  </div>
                  <button onClick={() => handleDelete('courses', c.id)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
