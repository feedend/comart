"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Risultati() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        // Query semplificata per evitare errori di JOIN se le FK non sono perfette
        const { data, error } = await supabase
          .from('responses')
          .select(`
            id,
            created_at,
            commenti,
            suggerimenti,
            answers (
              answer_value,
              question_id
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResponses(data || []);
      } catch (err) {
        console.error("Errore recupero dati:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  if (loading) return <div className="p-10 text-center font-sans animate-pulse text-slate-400">Caricamento dati...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans antialiased">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Report Feedback</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-2">Comart Academy Dashboard</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all"
          >
            ← Home
          </button>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">Nessun feedback registrato al momento.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {responses.map((res) => (
              <div key={res.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">ID: {res.id.toString().slice(0,8)}</span>
                  <span className="text-slate-400 text-sm font-medium">
                    {new Date(res.created_at).toLocaleDateString('it-IT')} {new Date(res.created_at).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {res.answers?.map((ans, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Q-{ans.question_id}</p>
                      <p className="text-md font-black text-slate-700 capitalize">{ans.answer_value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  {res.commenti && (
                    <div className="bg-blue-50/50 p-5 rounded-2xl">
                      <p className="text-[10px] font-bold text-blue-400 uppercase mb-2 italic">Cosa è piaciuto:</p>
                      <p className="text-slate-700 leading-relaxed font-medium">"{res.commenti}"</p>
                    </div>
                  )}
                  {res.suggerimenti && (
                    <div className="bg-amber-50/50 p-5 rounded-2xl">
                      <p className="text-[10px] font-bold text-amber-500 uppercase mb-2 italic">Cosa migliorare:</p>
                      <p className="text-slate-700 leading-relaxed font-medium">"{res.suggerimenti}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
