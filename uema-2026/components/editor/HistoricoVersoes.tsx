import React, { useState } from 'react';
import { Clock, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface Versao {
  id: string;
  numero: number;
  conteudo: string;
  titulo: string;
  autor: string;
  salvoEm: string;
  descricao: string;
}

interface HistoricoVersoesProps {
  versoes: Versao[];
  onRestaurar: (versao: Versao) => void;
}

// ─── Formata data para exibição ───────────────────────────────────────────────
const formatarData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Componente Principal ─────────────────────────────────────────────────────
const HistoricoVersoes: React.FC<HistoricoVersoesProps> = ({ versoes, onRestaurar }) => {
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  // ─── Alterna expansão do card ────────────────────────────────────────────────
  const handleExpandir = (id: string) => {
    setExpandidoId(prev => prev === id ? null : id);
  };

  // ─── Confirma restauração da versão ─────────────────────────────────────────
  const handleConfirmarRestauracao = (versao: Versao) => {
    onRestaurar(versao);
    setConfirmandoId(null);
  };

  return (
    <div className="flex flex-col h-full">

      {/* Cabeçalho */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600" />
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Histórico de Versões
          </h4>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {versoes.length} {versoes.length === 1 ? 'versão salva' : 'versões salvas'}
        </p>
      </div>

      {/* Lista de versões */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Estado vazio */}
        {versoes.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <Save size={32} className="mx-auto mb-2 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">Nenhuma versão salva ainda.</p>
            <p className="text-[10px] text-slate-400 mt-1">Salve o documento para criar versões.</p>
          </div>
        )}

        {versoes.map((versao, index) => (
          <div
            key={versao.id}
            className={`rounded-xl border transition-all ${
              index === 0
                ? 'border-blue-200 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {/* Cabeçalho do card */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => handleExpandir(versao.id)}
            >
              <div className="flex items-center gap-3">
                {/* Número da versão */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                  index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  v{versao.numero}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">{versao.descricao}</p>
                  <p className="text-[10px] text-slate-400">{formatarData(versao.salvoEm)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Badge versão atual */}
                {index === 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                    Atual
                  </span>
                )}
                {expandidoId === versao.id
                  ? <ChevronUp size={14} className="text-slate-400" />
                  : <ChevronDown size={14} className="text-slate-400" />
                }
              </div>
            </div>

            {/* Detalhes expandidos */}
            {expandidoId === versao.id && (
              <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">

                {/* Informações */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">Autor</span>
                    <span className="text-slate-700">{versao.autor}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">Título</span>
                    <span className="text-slate-700 truncate ml-2">{versao.titulo}</span>
                  </div>
                </div>

                {/* Preview do conteúdo */}
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prévia</p>
                  <div
                    className="text-[11px] text-slate-600 line-clamp-3 overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html: versao.conteudo.replace(/<[^>]*>/g, ' ').slice(0, 150) + '...'
                    }}
                  />
                </div>

                {/* Botão de restaurar */}
                {index !== 0 && (
                  <>
                    {confirmandoId === versao.id ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          ⚠️ Isso substituirá o conteúdo atual. Confirmar?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="flex-1 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleConfirmarRestauracao(versao)}
                            className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 transition-colors"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmandoId(versao.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 text-white rounded-xl text-[11px] font-bold hover:bg-slate-900 transition-colors"
                      >
                        <RotateCcw size={12} /> Restaurar esta versão
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricoVersoes;
