import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Plus, Briefcase, Clock, FileText, ArrowUpRight, X, CheckCircle2 } from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { MOCK_MODELS } from '../../constants';
import { User, REURBProcess, ProcessStatus } from '../../types/index';
import { ProcessTable } from './ProcessTable';
import { NewProcessModal } from './NewProcessModal';

// ─── TODO (Backend): Substituir por chamadas à API REST ───────────────────────
// GET /api/notificacoes        → listar notificações do usuário
// PATCH /api/notificacoes/:id  → marcar como lida
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  tempo: string;
  lida: boolean;
  tipo: 'processo' | 'documento' | 'etapa' | 'sistema';
}

// ─── Notificações mock (substituir por API futuramente) ───────────────────────

const NOTIFICACOES_MOCK: Notificacao[] = [
  { id: 'n1', titulo: 'Etapa concluída',       descricao: 'Levantamento Topográfico do processo 2026.0001 foi concluído.', tempo: 'Agora',     lida: false, tipo: 'etapa'     },
  { id: 'n2', titulo: 'Novo documento',         descricao: 'Portaria de Instauração foi adicionada ao processo 2024.0001.', tempo: '5 min',    lida: false, tipo: 'documento' },
  { id: 'n3', titulo: 'Status atualizado',      descricao: 'Processo 2024.0001 foi movido para "Em Análise".',             tempo: '1 hora',   lida: true,  tipo: 'processo'  },
  { id: 'n4', titulo: 'Processo protocolado',   descricao: 'As 14 etapas do processo 2026.0001 foram criadas.',            tempo: '2 horas',  lida: true,  tipo: 'processo'  },
];

const COR_TIPO: Record<Notificacao['tipo'], string> = {
  processo:  'bg-blue-100 text-blue-600',
  documento: 'bg-purple-100 text-purple-600',
  etapa:     'bg-green-100 text-green-600',
  sistema:   'bg-slate-100 text-slate-600',
};

// ─── Painel de Notificações ───────────────────────────────────────────────────

interface PainelNotificacoesProps {
  onClose: () => void;
}

const PainelNotificacoes: React.FC<PainelNotificacoesProps> = ({ onClose }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_MOCK);

  const marcarTodasLidas = () => {
    // TODO (Backend): PATCH /api/notificacoes/marcar-todas-lidas
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const marcarLida = (id: string) => {
    // TODO (Backend): PATCH /api/notificacoes/:id → { lida: true }
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="absolute right-0 top-14 w-96 bg-white border border-slate-100 rounded-[24px] shadow-2xl shadow-slate-200/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-black text-slate-800 text-sm">Notificações</h3>
          {naoLidas > 0 && (
            <p className="text-[10px] text-slate-400 font-medium">{naoLidas} não lida{naoLidas > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasLidas}
              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <CheckCircle2 size={12} /> Marcar todas como lidas
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
        {notificacoes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Nenhuma notificação.</div>
        ) : (
          notificacoes.map(n => (
            <div
              key={n.id}
              onClick={() => marcarLida(n.id)}
              className={`flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-all ${!n.lida ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${COR_TIPO[n.tipo]}`}>
                <FileText size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${!n.lida ? 'text-slate-800' : 'text-slate-500'}`}>{n.titulo}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.tempo}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.descricao}</p>
              </div>
              {!n.lida && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
            </div>
          ))
        )}
      </div>

      <div className="px-6 py-3 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          As notificações em tempo real estarão disponíveis após integração com o backend.
        </p>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [processes, setProcesses] = useState<REURBProcess[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const notificacoesRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const naoLidas = NOTIFICACOES_MOCK.filter(n => !n.lida).length;

  const fetchProcesses = () => {
    // TODO (Backend): GET /api/processos
    setProcesses(dbService.processes.selectAll());
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  // Fechar notificações ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notificacoesRef.current && !notificacoesRef.current.contains(e.target as Node)) {
        setShowNotificacoes(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const stats = [
    { label: 'Processos Ativos', value: processes.length.toString(),                                                                            change: '+2', icon: Briefcase, color: 'text-blue-600',  bg: 'bg-blue-50'  },
    { label: 'Em Andamento',     value: processes.filter(p => p.status === ProcessStatus.EM_ANDAMENTO).length.toString(),                       change: '0',  icon: Clock,     color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Concluídos',       value: processes.filter(p => p.status === ProcessStatus.CONCLUIDO).length.toString(),                          change: '+1', icon: FileText,  color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">

      {/* Header */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">
            Bem-vindo, {user.name.split(' ')[0]}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Controle central de regularização fundiária municipal.
          </p>
        </div>
        <div className="flex items-center gap-4">

          {/* ─── Sino de Notificações ─────────────────────────────────── */}
          <div className="relative" ref={notificacoesRef}>
            <button
              onClick={() => setShowNotificacoes(!showNotificacoes)}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 relative hover:shadow-md transition-all"
            >
              <Bell size={22} />
              {naoLidas > 0 && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-[2px] border-white" />
              )}
            </button>
            {showNotificacoes && (
              <PainelNotificacoes onClose={() => setShowNotificacoes(false)} />
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
          >
            <Plus size={20} /> Novo Processo
          </button>
        </div>
      </header>

      {/* Stats — apenas visuais, sem navegação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-[20px] transition-transform group-hover:rotate-3`}>
                <stat.icon size={28} />
              </div>
              <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase ${stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {stat.change} Hoje
              </span>
            </div>
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</h3>
            <p className="text-4xl font-black text-slate-800 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Processos Recentes + Modelos Oficiais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <h3 className="font-black text-slate-800 text-lg">Processos Recentes</h3>
            <Link to="/processes" className="text-blue-600 text-sm font-black hover:underline flex items-center gap-2">
              Ver Todos <ArrowUpRight size={16} />
            </Link>
          </div>
          <ProcessTable processes={processes.slice(0, 5)} currentUser={user} />
        </div>

        {/* ─── Modelos Oficiais ──────────────────────────────────────── */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
            <h3 className="font-black text-lg">Modelos Oficiais</h3>
            <Link to="/templates" className="text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest">
              Ver todos
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {MOCK_MODELS.slice(0, 4).map((model) => (
              <div
                key={model.id}
                className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-white transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-all">
                      {model.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Versão {model.version}
                    </p>
                  </div>
                </div>

                {/* Botão + navega para a biblioteca de templates */}
                <button
                  onClick={() => navigate('/templates')}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                  title="Usar modelo"
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NewProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProcesses}
        currentUser={user}
      />
    </div>
  );
};
