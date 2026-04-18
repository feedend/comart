"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [tab, setTab] = useState('report'); // 'report', 'domande', 'corsi'
  const [loading, setLoading] = useState(true);
  
  // Dati
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Filtri
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    if (tab === 'report') {
      let query = supabase.from('responses').select('*, answers(*), courses(name)');
      if (filterCourse !== 'all') query = query.eq('course_id', filterCourse);
      const { data } = await query.order('created_at', { ascending: false });
      setResponses(data || []);
    }
    if (tab === 'domande') {
      const { data } = await supabase.from('questions').select('*').order('sort_order', { ascending: true });
      setQuestions(data || []);
    }
    if (tab === 'corsi') {
      const { data } = await supabase.from('courses').select('*').order('name', { ascending: true });
      setCourses(data || []);
    }
    setLoading(false);
  }

  // Funzione per stampare solo l'area report
  const handlePrint = () => window.print();

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased pb-20">
      {/* HEADER - Nascondi in stampa */}
      <header className="bg-white border-b border-slate-200 p-6 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">COMART ADMIN</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Control Panel v1.0</p>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-2xl">
            {['report', 'domande', 'corsi'].map((t) => (
              <button 
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </nav>

          <button onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* --- SEZIONE REPORT & STATISTICHE --- */}
        {tab === 'report' && (
          <div className="animate-in fade-in duration-500">
            {/* Filtri e Azioni */}
            <div className="flex flex-wrap gap-4 mb-8 items-end print:hidden">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Filtra per Corso</label>
                <select 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFilterCourse(e.target.value)}
                >
                  <option value="all">Tutti i corsi</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button 
                onClick={handlePrint}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                Stampa Report
              </button>
            </div>

            {/* Lista Risposte */}
            <div className="space-y-6">
              {responses.map((res) => (
                <div key={res.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm break-inside-avoid">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{res.courses?.name || 'Corso Generico'}</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase">{new Date(res.created_at).toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 text-green-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">Completato</div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {res.answers?.map((ans, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase truncate">Domanda {ans.question_id}</p>
                        <p className="font-bold text-slate-700 capitalize">{ans.answer_value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm border-t border-slate-50 pt-4">
                    <div>
                      <span className="font-black text-slate-400 uppercase text-[9px] block mb-1">Commenti</span>
                      <p className="italic text-slate-600">{res.commenti || 'Nessuno'}</p>
                    </div>
                    <div>
                      <span className="font-black text-slate-400 uppercase text-[9px] block mb-1">Suggerimenti</span>
                      <p className="italic text-slate-600">{res.suggerimenti || 'Nessuno'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SEZIONE GESTIONE DOMANDE (CRUD) --- */}
        {tab === 'domande' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">Gestione Domande</h2>
              <button className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm">+ Nuova</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                  <th className="pb-4 px-4">Pos.</th>
                  <th className="pb-4 px-4">Testo</th>
                  <th className="pb-4 px-4">Tipo</th>
                  <th className="pb-4 px-4">Azioni</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {questions.map((q) => (
                  <tr key={q.id} className="border-b border-slate-50 group">
                    <td className="py-4 px-4 font-bold text-blue-600">{q.sort_order}</td>
                    <td className="py-4 px-4 font-medium text-slate-700">{q.question_text}</td>
                    <td className="py-4 px-4"><span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold">{q.type}</span></td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">✏️</button>
                        <button className="p-2 hover:bg-red-50 rounded-lg text-red-400">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- SEZIONE GESTIONE CORSI (CRUD) --- */}
        {tab === 'corsi' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-4">Gestione Corsi</h2>
            <p className="text-slate-400 mb-8 font-medium">Presto disponibile: CRUD corsi avanzato</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50 text-left">
                  <p className="font-black text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400 uppercase mt-1">ID: {c.id}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
