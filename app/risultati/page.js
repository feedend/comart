"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [newQuestion, setNewQuestion] = useState({ question_text: '', type: 'valutazione', sort_order: 0 });

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'report') {
        const { data: resData } = await supabase.from('responses').select('*').order('created_at', { ascending: false });
        const { data: ansData } = await supabase.from('answers').select('*');
        const { data: couData } = await supabase.from('courses').select('*');
        
        const merged = resData?.map(r => {
          const course = couData?.find(c => c.id === r.course_id);
          return {
            ...r,
            course_name: course ? String(course.name) : 'Corso Generico',
            all_answers: ansData?.filter(a => a.response_id === r.id) || []
          };
        });
        setResponses(merged || []);
      }
      if (tab === 'domande') {
        const { data } = await supabase.from('questions').select('*').order('sort_order', { ascending: true });
        setQuestions(data || []);
      }
      if (tab === 'corsi') {
        const { data } = await supabase.from('courses').select('*').order('name', { ascending: true });
        setCourses(data || []);
      }
    } catch (e) {
      console.error("Errore:", e);
    }
    setLoading(false);
  }

  const addQuestion = async () => {
    if (!newQuestion.question_text) return;
    await supabase.from('questions').insert([newQuestion]);
    setNewQuestion({ question_text: '', type: 'valutazione', sort_order: questions.length + 1 });
    loadData();
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">CARICAMENTO...</div>;

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* NAVBAR */}
      <nav className="bg-white border-b p-6 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tighter text-blue-600">COMART ADMIN</h1>
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['report', 'domande', 'corsi'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${tab === t ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {tab === 'report' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
              <h2 className="text-3xl font-black text-slate-800">Feedback</h2>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm">Stampa</button>
            </div>
            {responses.map(res => (
              <div key={res.id} className="bg-white border rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between mb-6">
                  <span className="font-black text-blue-600 uppercase text-xs">{String(res.course_name)}</span>
                  <span className="text-slate-400 text-xs font-bold">{new Date(res.created_at).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {res.all_answers.map((a, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Domanda {a.question_id}</p>
                      <p className="font-bold text-slate-700 capitalize">{String(a.answer_value)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 grid md:grid-cols-2 gap-4">
                  <p className="text-sm italic text-slate-600"><strong>Commento:</strong> {String(res.commenti || '-')}</p>
                  <p className="text-sm italic text-slate-600"><strong>Suggerimento:</strong> {String(res.suggerimenti || '-')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'domande' && (
          <div className="bg-white rounded-[2rem] border p-8">
            <h2 className="text-2xl font-black mb-8">Domande</h2>
            <div className="flex gap-4 mb-10 bg-slate-50 p-6 rounded-2xl border-2 border-dashed">
              <input 
                type="text" placeholder="Testo domanda..." 
                className="flex-1 p-3 rounded-xl border"
                value={newQuestion.question_text}
                onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
              />
              <button onClick={addQuestion} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black">SALVA</button>
            </div>
            {questions.map(q => (
              <div key={q.id} className="p-4 border-b flex justify-between font-bold text-slate-700">
                <span>{q.sort_order}. {q.question_text}</span>
                <span className="text-slate-300 text-xs uppercase">{q.type}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'corsi' && (
          <div className="bg-white rounded-[2rem] border p-8">
            <h2 className="text-2xl font-black mb-8">Corsi</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {courses.map(c => (
                <div key={c.id} className="p-6 bg-slate-50 rounded-2xl border">
                  <p className="font-black text-slate-800 uppercase">{String(c.name)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
