"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function getQuestions() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('sort_order', { ascending: true });
      setQuestions(data || []);
      setLoading(false);
    }
    getQuestions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Inseriamo la risposta principale
    const { data: resData, error: resError } = await supabase
      .from('responses')
      .insert([{ 
        course_id: 6, // Corso di default
        commenti: formData.get('commenti'),
        suggerimenti: formData.get('suggerimenti')
      }])
      .select();

    if (resError) return alert("Errore connessione DB");

    // Inseriamo i dettagli delle risposte
    const answers = questions.map(q => ({
      response_id: resData[0].id,
      question_id: q.id,
      answer_value: formData.get(`q-${q.id}`)
    }));

    await supabase.from('answers').insert(answers);
    setSent(true);
  };

  if (loading) return <div className="flex justify-center p-20 font-sans">Caricamento...</div>;
  if (sent) return <div className="p-10 text-center font-sans">✅ Grazie! Feedback inviato con successo.</div>;

  return (
    <main className="max-w-xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Comart Feedback</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q) => (
          <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="font-semibold mb-4 text-gray-800">{q.question_text}</p>
            <div className="flex flex-wrap gap-2">
              {(q.type === 'valutazione' 
                ? ['insufficiente', 'sufficiente', 'buono', 'ottimo'] 
                : ['Si', 'No']
              ).map((opt) => (
                <label key={opt} className="flex-1">
                  <input type="radio" name={`q-${q.id}`} value={opt} required className="hidden peer" />
                  <span className="block text-center p-2 border rounded-md cursor-pointer peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 capitalize text-sm">
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <textarea name="commenti" placeholder="Commenti..." className="w-full p-3 border rounded-lg h-24" />
          <textarea name="suggerimenti" placeholder="Suggerimenti..." className="w-full p-3 border rounded-lg h-24" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all">
          Invia Questionario
        </button>
      </form>
    </main>
  );
}
