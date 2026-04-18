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

      // Filtro Corso
      if (filterCourse !== 'all') {
        rData = rData.filter(r => String(r.course_id) === String(filterCourse));
      }

      // 1. CALCOLO STATISTICHE ANALITICHE (Una riga per domanda)
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
        } else if (q.type === 'si_no') {
          const siCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'si').length;
          const noCount = relatedAns.filter(a => a.answer_value?.toLowerCase() === 'no').length;
          distribution['si'] = total > 0 ? ((siCount / total) * 100).toFixed(0) : 0;
          distribution['no'] = total > 0 ? ((noCount / total) * 100).toFixed(0) : 0;
        }

        return { ...q, total, distribution };
      });
      setStats(calculatedStats);

      // 2. RACCOLTA RISPOSTE DESCRITTIVE
      const textFeeds = rData.map(r => ({
        id: r.id,
        course: cData.find(c => c.id === r.course_id)?.name || 'N/D',
        date: r.submitted_at,
        commenti: r.commenti,
        suggerimenti: r.suggerimenti
      })).filter(f => f.commenti || f.suggerimenti);
      
      setTextFeedbacks(textFeeds);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 bg-slate-50 uppercase tracking-widest p-10 text-center">Analisi dati in corso...</div>;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* HEADER */}
      <nav className="bg-white border-b sticky top-0 z-50 p-4 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-blue-600 tracking-tighter italic">COMART STATS</h1>
            <div className="flex gap-2">
               <button onClick={() => window.print()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Esporta PDF</button>
            </div>
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
        {tab === 'report' && (
          <div className="space-y-8">
            {/* FILTRO CORSO */}
            <div className="bg-white p-5 rounded-3xl border shadow-sm print:hidden">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Seleziona il corso da analizzare</label>
              <select className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                <option value="all">TUTTI I CORSI (VISTA AGGREGATA)</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* SEZIONE 1: STATISTICHE DOMANDE */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] px-2">Analisi Quantitativa</h2>
              <div className="grid grid-cols-1 gap-4">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div className="max-w-[70%]">
                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded mb-2 inline-block uppercase">Domanda {s.sort_order}</span>
                        <h3 className="text-lg font-black leading-tight text-slate-800 uppercase tracking-tight">{s.question_text}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-300">#{s.total}</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Risposte</p>
                      </div>
                    </div>

                    {/* BARRE PERCENTUALI */}
                    <div className="space-y-3">
                      {s.type === 'valutazione' ? (
                        ['ottimo', 'buono', 'sufficiente', 'insufficiente'].map(label => (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                              <span className={s.distribution[label] > 0 ? 'text-slate-700' : 'text-slate-300'}>{label}</span>
                              <span className="text-blue-600">{s.distribution[label]}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${label === 'ottimo' ? 'bg-green-500' : label === 'buono' ? 'bg-blue-500' : label === 'sufficiente' ? 'bg-amber-400' : 'bg-red-400'}`} 
                                style={{ width: `${s.distribution[label]}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        ['si', 'no'].map(label => (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase">
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
            </div>

            {/* SEZIONE 2: RISPOSTE APERTE */}
            <div className="space-y-4 pt-10 border-t border-slate-200">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] px-2">Feedback Testuali</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textFeedbacks.map(f => (
                  <div key={f.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                       <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(f.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[9px] font-black text-blue-500 uppercase block mb-3">{f.course}</span>
                    <div className="space-y-4">
                      {f.commenti && (
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 underline decoration-blue-200 underline-offset-4">Commento:</p>
                          <p className="text-xs text-slate-700 italic font-medium leading-relaxed">"{f.commenti}"</p>
                        </div>
                      )}
                      {f.suggerimenti && (
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 underline decoration-amber-200 underline-offset-4">Suggerimento miglioramento:</p>
                          <p className="text-xs text-slate-700 italic font-medium leading-relaxed">"{f.suggerimenti}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB DOMANDE E CORSI (Restano invariati per gestione) */}
        {tab === 'domande' && <div className="p-10 text-center font-bold text-slate-400 border-2 border-dashed rounded-[3rem]">Usa la gestione domande per modificare il questionario.</div>}
        {tab === 'corsi' && <div className="p-10 text-center font-bold text-slate-400 border-2 border-dashed rounded-[3rem]">Usa la gestione corsi per aggiungere nuove classi.</div>}
      </div>
    </main>
  );
}
