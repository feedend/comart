"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState([]);
  const [textFeedbacks, setTextFeedbacks] = useState([]);
  const [filterCourse, setFilterCourse] = useState('all');

  // Stati per nuovi inserimenti
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
        supabase.from('responses').select('*').order('submitted_at', { ascending: false }),
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

      // 1. CALCOLO STATISTICHE AVANZATE
      const calculatedStats = qData.map(q => {
        const relatedAns = aData.filter(a => a.question_id === q.id && rData.some(r => r.id === a.response_id));
        const total = relatedAns.length;

        let distribution = {};
        if (q.type === 'valutazione') {
          const labels = ['insufficiente', 'sufficiente', 'buono', 'ottimo'];
          labels.forEach(l => {
            const count = relatedAns.filter(a => a.answer_value?.toLowerCase() === l).length;
            distribution[l] = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          });
        } else {
          const siCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'si').length;
          const noCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'no').length;
          distribution['si'] = total > 0 ? ((siCount / total) * 100).toFixed(0) : 0;
          distribution['no'] = total > 0 ? ((noCount / total) * 100).toFixed(0) : 0;
        }
        return { ...q, total, distribution };
      });
      setStats(calculatedStats);

      // 2. RACCOLTA FEEDBACK TESTUALI
      const textFeeds = rData.map(r => ({
        id: r.id,
        course: cData.find(c => c.id === r.course_id)?.name || 'N/D',
        date: r.submitted_at,
        commenti: r.commenti,
        suggerimenti: r.suggerimenti
      })).filter(f => f.commenti || f.suggerimenti);
      
      setTextFeedbacks(textFeeds);

    } catch (e) { console.error("Errore Sync:", e); }
    finally { setLoading(false); }
  }

  // --- FUNZIONI DI GESTIONE (DOMANDE & CORSI) ---
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
    if (!confirm("Sei sicuro di voler eliminare questo elemento?")) return;
    await supabase.from(table).delete().eq('id', id);
    loadData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 bg-slate-50 uppercase tracking-widest p-10 text-center text-sm">Caricamento in corso...</div>;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* NAVBAR */}
      <nav className="bg-white border-b sticky top-0 z-50 p-4 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-blue-600 tracking-tighter italic">COMART STATS</h1>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Esporta PDF</button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {['report', 'domande', 'corsi'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${tab === t ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 max-w-5xl mx-auto mt-4">
        
        {/* VIEW: REPORT (STATISTICHE) */}
        {tab === 'report' && (
          <div className="space-y-8">
            <div className="bg-white p-5 rounded-3xl border shadow-sm print:hidden">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Analisi per Corso</label>
              <select className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-sm outline-none" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                <option value="all">VISTA AGGREGATA (TUTTI)</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2 text-center">Riepilogo Quantitativo</h2>
              {stats.map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="max-w-[75%]">
                      <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded mb-1 inline-block uppercase tracking-widest">Domanda {s.sort_order}</span>
                      <h3 className="text-base font-black leading-tight text-slate-800 uppercase italic">{s.question_text}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-200">#{s.total}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {s.type === 'valutazione' ? (
                      ['ottimo', 'buono', 'sufficiente', 'insufficiente'].map(label => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className={s.distribution[label] > 0 ? 'text-slate-600' : 'text-slate-300'}>{label}</span>
                            <span className="text-blue-600">{s.distribution[label]}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${label === 'ottimo' ? 'bg-green-500' : label === 'buono' ? 'bg-blue-500' : label === 'sufficiente' ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${s.distribution[label]}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      ['si', 'no'].map(label => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span>{label}</span>
                            <span>{s.distribution[label]}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${label === 'si' ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${s.distribution[label]}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-10 border-t">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2 text-center">Feedback Testuali</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textFeedbacks.map(f => (
                  <div key={f.id} className="bg-white p-5 rounded-[2rem] border shadow-sm">
                    <span className="text-[8px] font-black text-blue-500 uppercase block mb-2">{f.course} • {new Date(f.date).toLocaleDateString()}</span>
                    <div className="space-y-3">
                      {f.commenti && <p className="text-[11px] text-slate-700 italic font-medium leading-relaxed">"{f.commenti}"</p>}
                      {f.suggerimenti && <p className="text-[11px] text-slate-500 font-bold mt-2 border-t pt-2">Suggerimento: "{f.suggerimenti}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: GESTIONE DOMANDE */}
        {tab === 'domande' && (
          <div className="bg-white rounded-[2.5rem] p-6 border shadow-sm max-w-2xl mx-auto">
            <h2 className="text-xl font-black mb-6 uppercase italic text-center text-blue-600">Struttura Questionario</h2>
            <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border-2 border-dashed">
              <input type="text" placeholder="Nuova domanda..." className="w-full p-4 border rounded-xl text-sm font-bold" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" className="w-20 p-4 border rounded-xl text-sm font-bold" value={newQuestion.sort_order} onChange={e => setNewQuestion({...newQuestion, sort_order: parseInt(e.target.value) || 0})} />
                <select className="flex-1 p-4 border rounded-xl text-sm font-bold" value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}>
                    <option value="valutazione">Valutazione (Ottimo-Insuff)</option>
                    <option value="si_no">Sì/No</option>
                </select>
                <button onClick={handleAddQuestion} className="bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase">Salva</button>
              </div>
            </div>
            <div className="divide-y">
              {questions.map(q => (
                <div key={q.id} className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-md">{q.sort_order}</span>
                    <span className="text-xs font-bold text-slate-700 uppercase">{q.question_text}</span>
                  </div>
                  <button onClick={() => handleDelete('questions', q.id)} className="text-red-400 hover:text-red-600 text-[9px] font-black uppercase ml-4">Elimina</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: GESTIONE CORSI */}
        {tab === 'corsi' && (
          <div className="bg-white rounded-[2.5rem] p-6 border shadow-sm max-w-xl mx-auto">
            <h2 className="text-xl font-black mb-6 uppercase italic text-center text-blue-600">Archivio Corsi</h2>
            <div className="flex gap-2 mb-8 bg-slate-50 p-4 rounded-xl border-2 border-dashed">
              <input type="text" placeholder="Nome corso..." className="flex-1 p-4 border rounded-xl text-sm font-bold" value={newCourse} onChange={e => setNewCourse(e.target.value)} />
              <button onClick={handleAddCourse} className="bg-slate-900 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">Aggiungi</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {courses.map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 bg-white border rounded-2xl hover:border-blue-500 transition-all shadow-sm">
                  <span className="font-black text-[10px] uppercase text-slate-700">{c.name}</span>
                  <button onClick={() => handleDelete('courses', c.id)} className="text-red-300 hover:text-red-600">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
