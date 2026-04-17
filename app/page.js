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
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('sort_order', { ascending: true });
      setQuestions(data || []);
      setLoading(false);
    }
    getQuestions();
  }, []);

  // Funzione chiamata al click su una risposta
  const handleAnswer = (value) => {
    const newAnswers = [
      ...answers,
      { question_id: questions[currentIndex].id, answer_value: value }
    ];
    setAnswers(newAnswers);

    // Passa alla domanda successiva
    setCurrentIndex(currentIndex + 1);
  };

  const submitFinal = async () => {
    setLoading(true);
    // 1. Inseriamo la risposta principale
    const { data: resData, error: resError } = await supabase
      .from('responses')
      .insert([{ 
        course_id: 6, 
        commenti: commenti.testo,
        suggerimenti: commenti.suggerimenti
      }])
      .select();

    if (resError) return alert("Errore connessione DB");

    // 2. Inseriamo i dettagli delle risposte salvate nello stato
    const finalAnswers = answers.map(ans => ({
      response_id: resData[0].id,
      question_id: ans.question_id,
      answer_value: ans.answer_value
    }));

    await supabase.from('answers').insert(finalAnswers);
    setSent(true);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen font-sans text-gray-500">Caricamento...</div>;
  if (sent) return <div className="flex flex-col justify-center items-center h-screen p-10 text-center font-sans">
    <span className="text-6xl mb-4">🎉</span>
    <h2 className="text-2xl font-bold text-gray-800">Grazie mille!</h2>
    <p className="text-gray-500">Il tuo feedback è stato registrato con successo.</p>
  </div>;

  const isLastStep = currentIndex === questions.length;
  const progress = (currentIndex / (questions.length + 1)) * 100;

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans">
      {/* Barra di progresso superiore */}
      <div className="w-full h-2 bg-gray-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full p-6">
        {!isLastStep ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Domanda */}
            <div className="space-y-2">
              <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">
                Domanda {currentIndex + 1} di {questions.length}
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                {questions[currentIndex].question_text}
              </h1>
            </div>

            {/* Risposte come Pulsantoni */}
            <div className="grid grid-cols-1 gap-3">
              {(questions[currentIndex].type === 'valutazione' 
                ? ['insufficiente', 'sufficiente', 'buono', 'ottimo'] 
                : ['Si', 'No']
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left p-5 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-700 capitalize">
                      {opt}
                    </span>
                    <span className="text-gray-300 group-hover:text-blue-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Schermata finale per commenti prima dell'invio */
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900">Ci siamo quasi!</h2>
            <p className="text-gray-500">Vuoi aggiungere qualche dettaglio facoltativo prima di chiudere?</p>
            
            <div className="space-y-4">
              <textarea 
                placeholder="Eventuali commenti..." 
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none h-32"
                onChange={(e) => setCommenti({...commenti, testo: e.target.value})}
              />
              <textarea 
                placeholder="Suggerimenti per migliorare..." 
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none h-32"
                onChange={(e) => setCommenti({...commenti, suggerimenti: e.target.value})}
              />
            </div>

            <button 
              onClick={submitFinal}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Concludi e Invia
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
