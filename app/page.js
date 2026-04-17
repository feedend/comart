"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [commenti, setCommenti] = useState({ testo: '', suggerimenti: '' });
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function getQuestions() {
      try {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .order('sort_order', { ascending: true });
        setQuestions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    getQuestions();
  }, []);

  const handleAnswer = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = { question_id: questions[currentIndex].id, answer_value: value };
    setAnswers(newAnswers);
    setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
  };

  const submitFinal = async () => {
    setLoading(true);
    try {
      const { data: resData, error: resError } = await supabase
        .from('responses')
        .insert([{ course_id: 6, commenti: commenti.testo, suggerimenti: commenti.suggerimenti }])
        .select();

      if (!resError && resData && resData.length > 0) {
        const finalAnswers = answers.map(ans => ({
          response_id: resData[0].id,
          question_id: ans.question_id,
          answer_value: ans.answer_value
        }));
        await supabase.from('answers').insert(finalAnswers);
        setSent(true);
      }
    } catch (err) {
      alert("Errore invio");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !sent) return <div className="p-10 text-center font-sans">Caricamento...</div>;

  if (sent) return (
    <div className="flex flex-col justify-center items-center h-screen p-6 text-center font-sans">
      <h2 className="text-3xl font-bold text-gray-800">Grazie!</h2>
      <p className="text-gray-500 mt-2">Feedback inviato con successo.</p>
    </div>
  );

  const isLastStep = currentIndex === questions.length;

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Barra Progresso */}
      <div className="h-2 bg-gray-200">
        <div 
          className="h-full bg-blue-600 transition-all duration-500" 
          style={{ width: `${(currentIndex / (questions.length || 1)) * 100}%` }}
        />
      </div>

      <div className="max-w-xl mx-auto p-6 py-12">
        {!isLastStep ? (
          <div>
            <p className="text-blue-600 font-bold mb-2 uppercase text-xs tracking-widest">
              Domanda {currentIndex + 1} di {questions.length}
            </p>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-8 leading-tight">
              {questions[currentIndex]?.question_text}
            </h1>

            <div className="space-y-3">
              {(questions[currentIndex]?.type === 'valutazione' 
                ? ['insufficiente', 'sufficiente', 'buono', 'ottimo'] 
                : ['Si', 'No']
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="w-full flex justify-between items-center p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                >
                  <span className="text-lg font-bold text-gray-700 capitalize">{opt}</span>
                  <span className="text-blue-500">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Ci siamo quasi!</h2>
            <textarea 
              placeholder="Commenti..." 
              className="w-full p-4 border border-gray-200 rounded-2xl h-32 outline-none focus:border-blue-500 shadow-sm"
              onChange={(e) => setCommenti({...commenti, testo: e.target.value})}
            />
            <textarea 
              placeholder="Suggerimenti..." 
              className="w-full p-4 border border-gray-200 rounded-2xl h-32 outline-none focus:border-blue-500 shadow-sm"
              onChange={(e) => setCommenti({...commenti, suggerimenti: e.target.value})}
            />
            <button 
              onClick={submitFinal}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all"
            >
              Invia Feedback
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
