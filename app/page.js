"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// --- ICONE SVG PER UN LOOK PREMIUM ---
const IconQuiz = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const IconAdmin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
  </svg>
);

export default function App() {
  const [view, setView] = useState('home'); // Stati: 'home', 'quiz', 'sent'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [commenti, setCommenti] = useState({ testo: '', suggerimenti: '' });
  const [loading, setLoading] = useState(true);

  // Caricamento domande all'avvio
  useEffect(() => {
    async function getQuestions() {
      try {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .order('sort_order', { ascending: true });
        setQuestions(data || []);
      } catch (err) {
        console.error("Errore caricamento domande:", err);
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
    // Passa alla domanda successiva con un leggero delay per feedback visivo
    setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
  };

  const submitFinal = async () => {
    setLoading(true);
    try {
      // 1. Crea la risposta principale
      const { data: resData, error: resError } = await supabase
        .from('responses')
        .insert([{ 
          course_id: 6, 
          commenti: commenti.testo, 
          suggerimenti: commenti.suggerimenti 
        }])
        .select();

      if (!resError && resData?.length > 0) {
        // 2. Crea il pacchetto delle risposte ai singoli quesiti
        const finalAnswers = answers.map(ans => ({
          response_id: resData[0].id,
          question_id: ans.question_id,
          answer_value: ans.answer_value
        }));
        await supabase.from('answers').insert(finalAnswers);
        setView('sent');
      }
    } catch (err) {
      alert("Errore durante l'invio. Verifica la connessione.");
    } finally {
      setLoading(false);
    }
  };

  // --- 1. VISTA HOME PAGE ---
  if (view === 'home') return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-6xl font-black bg-yellow-600 italic mb-3">Feedback Finale</h1>
        <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Feedback Management Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in zoom-in-95 duration-500">
        {/* CARD LATO UTENTE */}
        <button 
          onClick={() => setView('quiz')}
          className="group relative overflow-hidden bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all flex flex-col justify-between h-80 text-left active:scale-[0.97]"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <IconQuiz />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">Inizia<br/>Questionario</h2>
            <p className="text-slate-500 font-medium">Valuta il corso e aiutaci a crescere.</p>
          </div>
          <div className="absolute right-8 bottom-8 opacity-10 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </div>
        </button>

        {/* CARD LATO ADMIN */}
        <button 
          onClick={() => window.location.href = '/risultati'}
          className="group relative overflow-hidden bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-slate-800 transition-all flex flex-col justify-between h-80 text-left active:scale-[0.97]"
        >
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
            <IconAdmin />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">Dashboard<br/>Risultati</h2>
            <p className="text-slate-500 font-medium">Analizza statistiche e commenti.</p>
          </div>
          <div className="absolute right-8 bottom-8 opacity-10 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </div>
        </button>
      </div>
      
      <p className="mt-16 text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 MaDa</p>
    </main>
  );

  // --- 2. VISTA QUESTIONARIO ---
  if (view === 'quiz') {
    const isLastStep = currentIndex === questions.length;
    const progress = (currentIndex / (questions.length || 1)) * 100;

    return (
      <main className="min-h-screen bg-white flex flex-col font-sans">
        <div className="fixed top-0 w-full z-20">
          <div className="h-2 bg-slate-100">
            <div className="h-full bg-blue-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full p-6 pt-20">
          {!isLastStep ? (
            <div className="animate-in slide-in-from-right-10 duration-500">
              <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-4 block">Domanda {currentIndex + 1}</span>
              <h1 className="text-4xl font-black text-slate-900 leading-tight mb-12">{questions[currentIndex]?.question_text}</h1>
              
              <div className="grid gap-4">
                {(questions[currentIndex]?.type === 'valutazione' 
                  ? ['insufficiente', 'sufficiente', 'buono', 'ottimo'] 
                  : ['Si', 'No']
                ).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="group w-full flex justify-between items-center p-7 bg-slate-50 border border-slate-200 rounded-[2rem] hover:border-blue-500 hover:bg-white hover:shadow-2xl transition-all active:scale-95"
                  >
                    <span className="text-xl font-bold text-slate-700 group-hover:text-blue-600 capitalize">{opt}</span>
                    <span className="text-blue-200 group-hover:text-blue-600 transition-colors font-black text-2xl">→</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setView('home')}
                className="mt-12 text-slate-400 font-bold text-sm hover:text-slate-600 flex items-center gap-2"
              >
                ← Torna alla Home
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700 space-y-8">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Quasi fatto!</h2>
              <p className="text-slate-500 text-lg">Lasciaci un pensiero finale per migliorare il corso.</p>
              
              <div className="space-y-4">
                <textarea 
                  placeholder="Cosa ti è piaciuto di più?" 
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-32 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner"
                  onChange={(e) => setCommenti({...commenti, testo: e.target.value})}
                />
                <textarea 
                  placeholder="Cosa potremmo migliorare?" 
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-32 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner"
                  onChange={(e) => setCommenti({...commenti, suggerimenti: e.target.value})}
                />
              </div>

              <button 
                onClick={submitFinal}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-7 rounded-[2rem] font-black text-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-300"
              >
                {loading ? "INVIO..." : "INVIA FEEDBACK"}
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // --- 3. VISTA RINGRAZIAMENTO ---
  if (view === 'sent') return (
    <div className="flex flex-col justify-center items-center h-screen p-8 text-center bg-white font-sans animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 text-5xl shadow-inner">✓</div>
      <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Grazie!</h2>
      <p className="text-slate-500 text-xl mb-12 max-w-xs">Il tuo contributo è prezioso per noi.</p>
      <button 
        onClick={() => {
          setAnswers([]);
          setCurrentIndex(0);
          setView('home');
        }} 
        className="bg-slate-900 text-white px-10 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all"
      >
        CHIUDI
      </button>
    </div>
  );

  return null;
}
