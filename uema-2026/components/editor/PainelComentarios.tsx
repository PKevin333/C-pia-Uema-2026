import React, { useState } from 'react';
import { MessageSquare, Check, X, Plus, User } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface Comentario {
  id: string;
  autor: string;
  cargo: string;
  texto: string;
  tipo: 'comentario' | 'sugestao';
  status: 'pendente' | 'aceito' | 'rejeitado';
  criadoEm: string;
  textoSugerido?: string; // Apenas para sugestões
}

interface PainelComentariosProps {
  nomeUsuario: string;
  cargoUsuario: string;
}

// ─── Gera ID único para cada comentário ───────────────────────────────────────
const gerarId = () => `com-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Formata data para exibição ───────────────────────────────────────────────
const formatarData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Componente Principal ─────────────────────────────────────────────────────
const PainelComentarios: React.FC<PainelComentariosProps> = ({ nomeUsuario, cargoUsuario }) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([
    // Comentários de exemplo para demonstração
    {
      id: 'com-exemplo-1',
      autor: 'Ana Lima',
      cargo: 'Jurídico',
      texto: 'Verificar se o artigo 12 está referenciado corretamente.',
      tipo: 'comentario',
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'com-exemplo-2',
      autor: 'Carlos Souza',
      cargo: 'Técnico',
      texto: 'Sugiro alterar "regularização" por "regularização fundiária urbana".',
      tipo: 'sugestao',
      status: 'pendente',
      criadoEm: new Date().toISOString(),
      textoSugerido: 'regularização fundiária urbana',
    },
  ]);

  const [novoTexto, setNovoTexto] = useState('');
  const [novoTipo, setNovoTipo] = useState<'comentario' | 'sugestao'>('comentario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // ─── Adiciona novo comentário ou sugestão ────────────────────────────────────
  const handleAdicionar = () => {
    if (!novoTexto.trim()) return;

    const novoComentario: Comentario = {
      id: gerarId(),
      autor: nomeUsuario,
      cargo: cargoUsuario,
      texto: novoTexto.trim(),
      tipo: novoTipo,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    };

    setComentarios(prev => [novoComentario, ...prev]);
    setNovoTexto('');
    setMostrarFormulario(false);
  };

  // ─── Aceita ou rejeita um comentário/sugestão ────────────────────────────────
  const handleResponder = (id: string, decisao: 'aceito' | 'rejeitado') => {
    setComentarios(prev =>
      prev.map(c => c.id === id ? { ...c, status: decisao } : c)
    );
  };

  // ─── Contadores por status ───────────────────────────────────────────────────
  const pendentes = comentarios.filter(c => c.status === 'pendente').length;
  const aceitos = comentarios.filter(c => c.status === 'aceito').length;
  const rejeitados = comentarios.filter(c => c.status === 'rejeitado').length;

  return (
    <div className="flex flex-col h-full">

      {/* Resumo de status */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-100">
        <div className="text-center">
          <p className="text-lg font-black text-amber-500">{pendentes}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Pendentes</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-green-500">{aceitos}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Aceitos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-red-400">{rejeitados}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Rejeitados</p>
        </div>
      </div>

      {/* Botão de adicionar */}
      <div className="p-4 border-b border-slate-100">
        <button
          onClick={() => setMostrarFormulario(v => !v)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          {mostrarFormulario ? 'Cancelar' : 'Adicionar Comentário'}
        </button>

        {/* Formulário de novo comentário */}
        {mostrarFormulario && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Tipo: comentário ou sugestão */}
            <div className="flex gap-2">
              <button
                onClick={() => setNovoTipo('comentario')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  novoTipo === 'comentario'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                💬 Comentário
              </button>
              <button
                onClick={() => setNovoTipo('sugestao')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  novoTipo === 'sugestao'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                ✏️ Sugestão
              </button>
            </div>

            {/* Campo de texto */}
            <textarea
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
              placeholder={novoTipo === 'sugestao' ? 'Descreva sua sugestão de alteração...' : 'Digite seu comentário...'}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-none"
            />

            <button
              onClick={handleAdicionar}
              disabled={!novoTexto.trim()}
              className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        )}
      </div>

      {/* Lista de comentários */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comentarios.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <MessageSquare size={32} className="mx-auto mb-2" />
            <p className="text-xs font-medium">Nenhum comentário ainda.</p>
          </div>
        )}

        {comentarios.map((comentario) => (
          <div
            key={comentario.id}
            className={`rounded-xl border p-3 space-y-2 transition-all ${
              comentario.status === 'aceito'    ? 'border-green-200 bg-green-50' :
              comentario.status === 'rejeitado' ? 'border-red-100 bg-red-50 opacity-60' :
              comentario.tipo === 'sugestao'    ? 'border-amber-200 bg-amber-50' :
              'border-slate-200 bg-white'
            }`}
          >
            {/* Cabeçalho do comentário */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {comentario.autor.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800">{comentario.autor}</p>
                  <p className="text-[10px] text-slate-400">{comentario.cargo}</p>
                </div>
              </div>

              {/* Badge de tipo */}
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                comentario.tipo === 'sugestao'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {comentario.tipo === 'sugestao' ? '✏️ Sugestão' : '💬 Comentário'}
              </span>
            </div>

            {/* Texto do comentário */}
            <p className="text-xs text-slate-600 leading-relaxed">{comentario.texto}</p>

            {/* Data */}
            <p className="text-[10px] text-slate-400">{formatarData(comentario.criadoEm)}</p>

            {/* Botões aceitar/rejeitar (apenas pendentes) */}
            {comentario.status === 'pendente' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleResponder(comentario.id, 'aceito')}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500 text-white rounded-lg text-[11px] font-bold hover:bg-green-600 transition-colors"
                >
                  <Check size={12} /> Aceitar
                </button>
                <button
                  onClick={() => handleResponder(comentario.id, 'rejeitado')}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-400 text-white rounded-lg text-[11px] font-bold hover:bg-red-500 transition-colors"
                >
                  <X size={12} /> Rejeitar
                </button>
              </div>
            )}

            {/* Status final */}
            {comentario.status !== 'pendente' && (
              <div className={`flex items-center gap-1 text-[11px] font-bold ${
                comentario.status === 'aceito' ? 'text-green-600' : 'text-red-400'
              }`}>
                {comentario.status === 'aceito' ? <Check size={12} /> : <X size={12} />}
                {comentario.status === 'aceito' ? 'Aceito' : 'Rejeitado'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PainelComentarios;
