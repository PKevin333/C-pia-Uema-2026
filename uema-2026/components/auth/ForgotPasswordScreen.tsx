
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, RefreshCcw, Check, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';
import { dbService } from '../../services/databaseService';

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = dbService.users.findByEmail(email);
      if (user) {
        setIsSubmitted(true);
      } else {
        setError('Este e-mail não consta em nossa base de dados.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden z-10 p-10 text-center">
        {isSubmitted ? (
          <div className="py-6 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">E-mail Enviado!</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">As instruções de redefinição foram enviadas para <strong>{email}</strong>.</p>
            <Link to="/login" className="flex items-center justify-center gap-2 text-blue-600 font-bold hover:underline">
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                <RefreshCcw size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Recuperar Senha</h2>
            <p className="text-slate-400 text-sm mb-8 font-medium">Insira seu e-mail cadastrado para receber o link de redefinição.</p>

            <form onSubmit={handleRecover} className="space-y-5 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">E-mail Institucional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" 
                    placeholder="exemplo@prefeitura.gov.br"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button 
                type="submit" disabled={isLoading}
                className={`w-full py-4 bg-slate-800 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-100 hover:bg-slate-900 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Verificando...' : 'Enviar Instruções'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>
            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
              Lembrou sua senha? <Link to="/login" className="text-blue-600 font-bold hover:underline">Voltar ao Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
