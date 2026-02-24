
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertCircle, Check, ArrowRight, Eye, EyeOff, 
  User, Mail, Briefcase, Lock, Sparkles, ChevronLeft
} from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { Logo } from '../common/Logo';

export const SignupScreen = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Técnico' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
  };

  const isPasswordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = form.password === confirmPassword && confirmPassword.length > 0;

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const existingUser = dbService.users.findByEmail(form.email);
    if (existingUser) {
      setError('Este e-mail já possui uma solicitação ativa.');
      return;
    }

    if (!isPasswordValid) {
      setError('A senha deve atender aos requisitos de segurança.');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas não coincidem.');
      return;
    }

    dbService.users.insert(form);
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden font-sans">
      {/* Elementos visuais de fundo - Gradientes suaves e profissionais */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-100/40 rounded-full blur-[160px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-100/40 rounded-full blur-[160px] -z-10 animate-pulse" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden z-10 p-10 md:p-16 animate-in fade-in zoom-in-95 duration-700">
        
        {success ? (
          <div className="text-center py-10 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100 border border-green-200">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Solicitação Enviada</h2>
            <p className="text-slate-500 font-medium text-lg">Sua credencial está sendo processada. Redirecionando...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-12">
              <Logo size="lg" />
              <div className="mt-8 text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Solicitar Acesso</h2>
                <p className="text-slate-400 font-medium">Credenciamento de operadores do fluxo REURB-Doc</p>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none text-sm font-bold text-slate-700 transition-all shadow-sm" 
                      placeholder="Nome do Operador"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Perfil Funcional</label>
                  <div className="relative">
                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select 
                      value={form.role} onChange={(e) => setForm({...form, role: e.target.value as any})}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none text-sm font-bold text-slate-700 transition-all shadow-sm appearance-none"
                    >
                      <option value="Técnico">Técnico / Agrimensura</option>
                      <option value="Jurídico">Jurídico / Procuradoria</option>
                      <option value="Gestor">Gestor Municipal</option>
                      <option value="Atendente">Assistente Social</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">E-mail Institucional</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none text-sm font-bold text-slate-700 transition-all shadow-sm" 
                    placeholder="servidor@municipio.gov.br"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Crie uma Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={form.password} 
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-slate-700 transition-all shadow-sm" 
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Confirme a Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none text-sm font-bold text-slate-700 transition-all shadow-sm" 
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid de Requisitos de Senha */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4">
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${checks.length ? 'text-green-600' : 'text-slate-400'}`}>
                   {checks.length ? <Check size={14} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-1.5" />}
                   8+ Caracteres
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${checks.upper ? 'text-green-600' : 'text-slate-400'}`}>
                   {checks.upper ? <Check size={14} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-1.5" />}
                   Letra Maiúscula
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${checks.number ? 'text-green-600' : 'text-slate-400'}`}>
                   {checks.number ? <Check size={14} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-1.5" />}
                   Número
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${checks.special ? 'text-green-600' : 'text-slate-400'}`}>
                   {checks.special ? <Check size={14} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-1.5" />}
                   Símbolo (@#$)
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100 animate-in shake duration-500">
                  <AlertCircle size={18} className="shrink-0" /> {error}
                </div>
              )}

              <div className="pt-4 flex flex-col gap-6">
                <button 
                  type="submit" 
                  disabled={(!isPasswordValid || !passwordsMatch) && (form.password.length > 0)}
                  className={`w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    isPasswordValid && passwordsMatch 
                      ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  Solicitar Cadastro <ArrowRight size={20} />
                </button>

                <div className="flex justify-center">
                  <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 font-bold hover:text-blue-600 transition-colors group">
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar para o Login
                  </Link>
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      <footer className="absolute bottom-8 text-[10px] text-slate-300 font-black uppercase tracking-[0.4em] text-center w-full">
        © 2024 REURB-Doc • Infraestrutura de Gestão Fundiária
      </footer>
    </div>
  );
};
