"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(true);
  
  // Dati dal DB
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Form stati
  const [newQuestion, setNewQuestion] = useState({ question_text: '', type: 'valutazione', sort_order: 1 });
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Carichiamo le domande (sempre utili per i titoli nei report)
      const { data: qData } = await supabase.from('questions').select('*').order('sort_order', { ascending: true });
      setQuestions(qData || []);

      // 2. Carichiamo i corsi
      const { data: cData } = await supabase.from('courses').select('*').order('name', { ascending: true });
      setCourses(cData || []);

      if (tab === 'report') {
        // Carichiamo risposte e dettagli
        const { data: resData } = await supabase.from('responses').select('*').order('created_at', { ascending: false });
        const { data: ansData } = await supabase.from('answers').select('*');
        
        // Uniamo i dati per la visualizzazione
        const merged = resData?.map(r => ({
          ...r,
          course_name: cData?.find(c => c.id === r.course_id)?.name || 'Corso non specificato',
          details: ansData?.filter(a => a.response_id === r.id).map(a => ({
            ...a,
            question_text: qData?.find(q => q.id === a.question_id)?.question_text || 'Domanda eliminata'
          }))
        }));
        setResponses(merged || []);
      }
    } catch (e) {
      console.error("Errore caricamento dati:", e);
    }
    setLoading(false);
  }

  // --- AZIONI DOMANDE ---
  const addQuestion = async () => {
    if (!newQuestion.question_text) return;
    const { error } = await supabase.from('questions').insert([newQuestion]);
    if (error) alert("Errore: " + error.message);
    setNewQuestion({ question_text: '', type: 'valutazione', sort_order: questions.length + 1 });
    loadData();
  };

  const deleteQuestion = async (id) => {
    if (confirm("Eliminare definitivamente questa domanda?")) {
      await supabase.from('questions').delete().eq('id', id);
      loadData();
    }
  };

  // --- AZIONI CORSI ---
  const addCourse = async () => {
    if (!newCourse) return;
    const { error } = await supabase.from('courses').insert([{ name: newCourse }]);
    if (error) alert("Errore: " + error.message);
    setNewCourse('');
    loadData();
  };

  const deleteCourse = async (id) => {
    if (confirm("Eliminare questo corso? Le risposte associate potrebbero non mostrare più il nome del corso.")) {
      await supabase.from('courses').delete().eq('id', id);
      loadData();
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-500 animate-pulse text-2xl">COMART ADMIN LOADING...</div>;

  return (
    <main className="min-h-screen bg-slate-100 font-sans pb-20">
      {/* HEADER NAV */}
      <nav className="bg-slate-900 text-white p-6 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div onClick={() => window.location.href = '/'} className="cursor-pointer">
            <h1 className="text-2xl font-black tracking-tighter">COMART <span className="text-blue-500">ADMIN</span></h1>
          </div>
          <div className="flex bg-slate-800 rounded-2xl p-1 shadow-inner">
            {['report', 'domande', 'corsi'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 mt-8">
        
        {/* --- TAB: REPORT --- */}
        {tab === 'report' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-4 print:hidden">
              <h2 className="text-4xl font-black text-slate-800">Analisi Feedback</h2>
              <button onClick={() => window.print()} className="bg-white border-2 border-slate-900 px-6 py-2 rounded-xl font-black hover:bg-slate-900 hover:text-white transition-all">STAMPA PDF</button>
            </div>

            {responses.length === 0 && <p className="text-center p-20 bg-white rounded-3xl border border-dashed text-slate-400 font-bold">Nessun dato trovato.</p>}

            {responses.map(res => (
              <div key={res.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden break-inside-avoid mb-8">
                <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Corso Selezionato</span>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">{res.course_name}</h3>
                  </div>
                  <div className="text-right text-slate-400">
                    <p className="text-xs font-bold uppercase">{new Date(res.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px]">{new Date(res.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {res.details?.map((ans, i) => (
                      <div key={i} className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-1 truncate">{ans.question_text}</p>
                        <p className="font-black text-slate-700 text-lg uppercase">{ans.answer_value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 border-t pt-6">
                    <div className="bg-slate-50 p-5 rounded-2xl shadow-inner">
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">Commenti Generali</span>
                      <p className="text-slate-700 italic font-medium">"{res.commenti || 'Nessun commento lasciato'}"</p>
                    </div>
                    <div className="bg-amber-50/50 p-5 rounded-2xl shadow-inner border border-amber-100">
                      <span className="text-[9px] font-black text-amber-500 uppercase block mb-2">Suggerimenti di miglioramento</span>
                      <p className="text-slate-700 italic font-medium">"{res.suggerimenti || 'Nessun suggerimento'}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB: DOMANDE (CRUD + POSIZIONE) --- */}
        {tab === 'domande' && (
          <div className="bg-white rounded-[2.5rem] p-10 border shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black mb-10 text-slate-800">Gestione Questionario</h2>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 mb-12">
              <h3 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-tighter">Crea Nuova Domanda</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-1">
                  <input type="number" className="w-full p-4 border rounded-2xl font-black text-center" value={newQuestion.sort_order} onChange={e => setNewQuestion({...newQuestion, sort_order: parseInt(e.target.value)})} placeholder="N." />
                </div>
                <div className="md:col-span-7">
                  <input type="text" className="w-full p-4 border rounded-2xl font-bold" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} placeholder="Testo della domanda..." />
                </div>
                <div className="md:col-span-2">
                  <select className="w-full p-4 border rounded-2xl font-bold bg-white" value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}>
                    <option value="valutazione">Valutazione</option>
                    <option value="si_no">Sì / No</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button onClick={addQuestion} className="w-full h-full bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">SALVA</button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {questions.map(q => (
                <div key={q.id} className="group flex justify-between items-center p-6 border-b hover:bg-slate-50 transition-all rounded-2xl">
                  <div className="flex items-center gap-6">
                    <span className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm shadow-md">{q.sort_order}</span>
                    <span className="font-bold text-slate-700 text-lg">{q.question_text}</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">({q.type})</span>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)} className="bg-red-50 text-red-500 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: CORSI (CRUD COMPLETO) --- */}
        {tab === 'corsi' && (
          <div className="bg-white rounded-[2.5rem] p-10 border shadow-2xl animate-in zoom-in-95 duration-300">
             <h2 className="text-3xl font-black mb-10 text-slate-800">Anagrafica Corsi</h2>

             <div className="flex gap-4 mb-12">
                <input 
                  type="text" 
                  className="flex-1 p-5 border rounded-3xl font-bold bg-slate-50 focus:bg-white transition-all outline-none focus:ring-4 focus:ring-blue-100" 
                  placeholder="Inserisci il nome del nuovo corso (es: Sicurezza sul Lavoro 2024)..." 
                  value={newCourse} 
                  onChange={e => setNewCourse(e.target.value)} 
                />
                <button onClick={addCourse} className="bg-slate-900 text-white px-10 rounded-3xl font-black hover:bg-blue-600 transition-all shadow-xl">AGGIUNGI CORSO</button>
             </div>

             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(c => (
                  <div key={c.id} className="group p-6 border-2 border-slate-100 rounded-[2rem] hover:border-blue-500 transition-all relative overflow-hidden bg-white">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ID: {c.id}</p>
                      <h4 className="text-xl font-black text-slate-800 uppercase leading-tight">{c.name}</h4>
                    </div>
                    <button 
                      onClick={() => deleteCourse(c.id)} 
                      className="absolute top-4 right-4 text-slate-200 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </button>
                    <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-blue-50 transition-colors">
                      <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </main>
  );
}
