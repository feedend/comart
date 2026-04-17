"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Risultati() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      // Recuperiamo le risposte con le relative risposte ai singoli quesiti
      const { data, error } = await supabase
        .from('responses')
        .select(`
          id,
          created_at,
          commenti,
          suggerimenti,
          answers (
            answer_value,
            questions (question_text)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) console.error("Errore caricamento:", error);
      else setResponses(data);
      setLoading(false);
    }
    fetchResults();
  }, []);

  if (loading) return <div className="p-10 text-center font-sans">Caricamento dashboard...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard Risultati</h1>
            <p className="text-slate-500 font-medium">Totale feedback ricevuti: {responses.length}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-white border border-slate-200 px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
          >
            ← Torna alla Home
          </button>
        </header>

        {responses.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-slate-300">
            <p className="text-slate-400 font-bold">Ancora nessun dato disponibile.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {responses.map((res) => (
              <div key={res.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-hover hover:shadow-md">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                      ID: {res.id.toString().slice(0, 8)}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">
                      {new Date(res.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Dettaglio Risposte */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {res.answers.map((ans, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">{ans.questions?.question_text || 'Domanda'}</p>
                        <p className="text-lg font-bold text-slate-800 capitalize">{ans.answer_value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Commenti e Suggerimenti */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Commenti</h4>
                      <p className="text-slate-700 leading-relaxed italic">
                        {res.commenti ? `"${res.commenti}"` : <span className="text-slate-300 text-sm">Nessun commento</span>}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Suggerimenti</h4>
                      <p className="text-slate-700 leading-relaxed italic">
                        {res.suggerimenti ? `"${res.suggerimenti}"` : <span className="text-slate-300 text-sm">Nessun suggerimento</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
