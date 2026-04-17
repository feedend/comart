"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Icone semplici in SVG per non dover installare altre librerie
const IconChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const IconChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;

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

  const handleAnswer = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = { question_id: questions[currentIndex].id, answer_value: value };
    setAnswers(newAnswers);
    // Feedback visivo immediato prima di passare alla prossima
    setTimeout(() => setCurrentIndex(currentIndex + 1), 250);
  };

  const submitFinal = async () => {
    setLoading(true);
    const { data: resData, error: resError } = await supabase
      .from('responses')
      .insert([{ 
        course_id: 6, 
        commenti: commenti.testo, 
        suggerimenti: commenti.suggerimenti 
      }])
      .select();

    if (!resError && resData.length > 0) {
      const finalAnswers = answers.map(ans => ({
        response_id: resData[0].id,
        question_id: ans.question_id,
        answer_value: ans.answer_value
      }));
      await supabase.from('answers').insert(finalAnswers);
      setSent(true);
    } else {
      alert("Errore durante l'invio. Riprova.");
    }
    setLoading(false);
  };

  if (loading && !sent) return (
    <div className="flex justify-center items-center h-screen bg-slate-50 font-sans text-slate-400">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-blue-100 rounded-full mb-4"></div>
        Caricamento...
      </div>
    </div>
  );

  if (sent) return (
    <div className="flex flex-col justify-center items-center h-screen p-8 bg-white text-center font-sans animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <IconCheck />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Ottimo lavoro!</h2>
      <p className="text-slate-500 text-lg max-w-xs">Il tuo feedback è stato inviato. Grazie per aiutarci a migliorare.</p>
      <button onClick={() => window.location.reload()} className="mt-10 text-blue-600 font-bold hover:underline">Invia un'altra risposta</button>
    </div>
  );

  const isLastStep = currentIndex === questions.length;
  const progress = (currentIndex / (questions.length + 1)) * 100;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased">
      {/* Progress Bar */}
      <div className="fixed top-0 w-full z-20">
        <div className="h-1.5 bg-slate-200">
          <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <span className="font-black text-xl tracking-tighter text-blue-600">COMART</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
            {isLastStep ? 'Finale' : `${currentIndex + 1} / ${questions.length}`}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full p-6 pt-28">
        {!isLastStep ? (
          <div className="animate-in slide-in-from-right-10 duration-500">
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-10">
              {questions[currentIndex].question_text}
            </h1>

            <div className="grid gap-4">
              {(questions[currentIndex].type === 'valutazione' 
                ? ['insufficiente', 'sufficiente', 'buono', 'ottimo'] 
                : ['Si', 'No']
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="group w-full flex justify-between items-center p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <span className="text-xl font-bold text-slate-700 group-hover:text-blue-600 capitalize">{opt}</span>
                  <div className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                    <IconChevronRight />
                  </div>
                </button>
              ))}
            </div>

            {currentIndex > 0 && (
              <button 
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="mt-10 flex items-center gap-1 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                <IconChevronLeft /> INDIETRO
              </button>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 space-y-8">
            <div className="mb-4">
              <h2 className="text-4xl font-black text-slate-900">Quasi finito.</h2>
              <p className="text-slate-500 mt-2 text-lg">Hai qualche consiglio per noi?</p>
            </div>
            
            <div className="space-y-4">
              <textarea 
                placeholder="Cosa ti è piaciuto?" 
                className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none h-32 transition-all"
                onChange={(e) => setCommenti({...commenti, testo: e.target.value})}
              />
              <textarea 
                placeholder="Cosa possiamo migliorare?" 
                className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none h-32 transition-all"
                onChange={(e) => setCommenti({...commenti, suggerimenti: e.target.value})}
              />
            </div>

            <button 
              onClick={submitFinal}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
            >
              {loading ? "INVIO IN CORSO..." : <><IconSend /> INVIA ORA</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
