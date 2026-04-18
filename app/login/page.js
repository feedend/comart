"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // Puoi impostare una password fissa o usare Supabase Auth. 
    // Per ora usiamo una password di sicurezza semplice.
    if (password === 'Comart2024!') { 
      localStorage.setItem('admin_auth', 'true');
      router.push('/risultati');
    } else {
      setError(true);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border w-full max-w-md text-center">
        <h1 className="text-2xl font-black text-blue-600 mb-2 italic">COMART ADMIN</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Accesso Riservato</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            placeholder="Inserisci Password" 
            className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-center transition-all ${error ? 'border-red-500 animate-shake' : 'border-slate-100 focus:border-blue-500'}`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
          />
          {error && <p className="text-red-500 text-[9px] font-black uppercase">Password Errata</p>}
          <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-100 active:scale-95 transition-transform">
            Sblocca Dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
