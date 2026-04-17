"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [courseId, setCourseId] = useState(6); // Default al corso che avevi nel dump
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('sort_order', { ascending: true });
      setQuestions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // 1. Crea la testata della risposta
    const { data: resData, error: resError } = await supabase
      .from('responses')
      .insert([{ course_id: courseId, commenti: formData.get('commenti') }])
      .select();

    if (resError) return alert("Errore nell'invio");

    // 2. Salva le singole risposte
    const answerRows = questions.map(q => ({
      response_id: resData[0].id,
      question_id: q.id,
      answer_value: formData.get(`q-${q.id}`)
    }));

    await supabase.from('answers').insert(answerRows);
    alert("Grazie! Feedback inviato.");
    e.target.reset();
  };

  if (loading) return <div className="p-10 text-center text-xl">Caricamento...</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">FeedEnd</h1>
        <p className="text-gray-500 mb-8">Il tuo feedback è prezioso e anonimo.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <label className="block font-semibold text-gray-700">{q.question_text}</label>
              <div className="flex flex-wrap gap-3">
                {(q.type === 'valutazione' 
                  ? ['insufficiente', 'sufficiente', 'buono', 'ottimo'] 
                  : ['Si', 'No']
                ).map((option) => (
                  <label key={option} className="flex-1 min-w-[100px]">
                    <input type="radio" name={`q-${q.id}`} value={option} required className="hidden peer" />
                    <span className="block text-center p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all text-sm capitalize">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-3">
            <label className="block font-semibold text-gray-700">Commenti opzionali</label>
            <textarea name="commenti" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Invia Feedback
          </button>
        </form>
      </div>
    </main>
  );
}
