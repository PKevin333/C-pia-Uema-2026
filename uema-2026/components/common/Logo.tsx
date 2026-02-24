
import React from 'react';
import { ShieldCheck, Home } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, light = false }) => {
  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 48
  };

  const containerSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-[28px]'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className={`
        ${containerSizes[size]} 
        bg-gradient-to-br from-blue-600 to-indigo-700 
        flex items-center justify-center 
        text-white shadow-lg shadow-blue-200/50 
        group-hover:scale-105 transition-transform duration-300
        relative overflow-hidden
      `}>
        {/* Elemento decorativo de fundo */}
        <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white/10 rounded-full blur-xl" />
        
        <div className="relative">
          <ShieldCheck size={iconSizes[size]} strokeWidth={2.5} />
          <div className="absolute -top-1 -right-1">
             {/* Pequeno detalhe que remete a telhado/casa */}
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <h1 className={`${textSizes[size]} font-black tracking-tighter ${light ? 'text-white' : 'text-slate-800'}`}>
            REURB<span className="text-blue-600">Doc</span>
          </h1>
          {size !== 'sm' && (
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${light ? 'text-blue-200' : 'text-slate-400'}`}>
              Flow Management
            </span>
          )}
        </div>
      )}
    </div>
  );
};
