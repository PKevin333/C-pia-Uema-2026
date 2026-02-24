
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { Logo } from '../common/Logo';

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // @ts-ignore
    if (window.google) {
      try {
        // @ts-ignore
        google.accounts.id.initialize({
          client_id: "777000000000-sampleid.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });
        // @ts-ignore
        google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%", text: "signin_with", shape: "pill" }
        );
      } catch (e) {
        console.error("Erro Google GSI:", e);
      }
    }
  }, []);

  const handleGoogleResponse = (response: any) => {
    const userData = parseJwt(response.credential);
    if (userData) {
      const googleUser = {
        name: userData.name,
        email: userData.email,
        role: 'Jurídico',
        avatar: userData.picture
      };
      
      const userFromDb = dbService.users.findByEmail(googleUser.email);
      if (!userFromDb) {
         dbService.users.insert(googleUser);
      } else {
         dbService.users.updateActivity(userFromDb.id);
      }
      
      onLoginSuccess(googleUser);
      navigate('/');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = dbService.users.findByEmail(email);
    if (user && user.password === passwordInput) {
      dbService.users.updateActivity(user.id);
      const safeUser = { ...user };
      delete safeUser.password;
      onLoginSuccess(safeUser);
      navigate('/');
    } else {
      setError('Credenciais inválidas ou usuário não encontrado.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Decorativo Suave */}
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[140px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[140px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[48px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] overflow-hidden z-10 p-10 md:p-20 transition-all duration-500">
        <div className="flex justify-center mb-16">
          <Logo size="lg" />
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-3">Bem-vindo de volta</h2>
          <p className="text-slate-400 text-base font-medium">Acesse o sistema de gestão de regularização fundiária</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase ml-3 tracking-[0.2em]">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:outline-none text-base font-bold transition-all text-slate-700" 
                placeholder="nome.sobrenome@prefeitura.gov.br"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Senha</label>
              <Link to="/forgot-password" title="Recuperar senha" className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all">
                Esqueceu sua senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-16 pr-16 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:outline-none text-base font-bold transition-all text-slate-700" 
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-5 bg-red-50 text-red-600 rounded-3xl text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={20} className="shrink-0" /> {error}
            </div>
          )}

          <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2">
            Entrar no Painel
          </button>
        </form>

        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]"><span className="bg-white px-8 text-slate-400">Ou use sua conta Google</span></div>
        </div>

        <div id="googleBtn" className="w-full flex justify-center scale-110 mb-8"></div>

        <p className="mt-16 text-center text-sm text-slate-500 font-medium">
          Ainda não possui credenciais? <Link to="/signup" className="text-blue-600 font-black hover:underline decoration-2 underline-offset-8 ml-1">Solicitar acesso institucional</Link>
        </p>
      </div>

      {/* Rodapé fixo para preencher o visual da página */}
      <div className="absolute bottom-8 text-center w-full text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
        © 2024 REURB-Doc • Plataforma Oficial de Regularização Fundiária
      </div>
    </div>
  );
};
