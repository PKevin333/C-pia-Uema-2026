import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Plus, LayoutGrid, List,
  FileText, MapPin, Calendar,
  ChevronRight, MoreHorizontal, Activity,
  AlertCircle, CheckCircle2, Clock,
  Edit3, RefreshCw, Archive, FilePlus
} from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { REURBProcess, ProcessStatus } from '../../types/index';
import { ProcessTable } from './ProcessTable';
import { NewProcessModal } from './NewProcessModal';
import { ProcessDrawer } from './ProcessDrawer';

// ─── TODO (Backend): Substituir por chamadas à API REST ───────────────────────
// GET    /api/processos              → listar todos os processos
// GET    /api/processos/:id          → buscar processo por ID
// PATCH  /api/processos/:id          → atualizar dados do processo
// PATCH  /api/processos/:id/status   → atualizar status do processo
// DELETE /api/processos/:id          → arquivar processo
// ─────────────────────────────────────────────────────────────────────────────

// ─── Menu Três Pontos ─────────────────────────────────────────────────────────

interface MenuTresPontosProps {
  process: REURBProcess;
  onGerenciar: () => void;
  onEditar: () => void;
  onAlterarStatus: () => void;
  onArquivar: () => void;
}

const MenuTresPontos: React.FC<MenuTresPontosProps> = ({
  process,
  onGerenciar,
  onEditar,
  onAlterarStatus,
  onArquivar,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const acoes = [
    { icon: <FileText size={14} />,    label: 'Gerenciar Processo', action: onGerenciar,    color: 'text-blue-600' },
    { icon: <Edit3 size={14} />,       label: 'Editar Dados',       action: onEditar,        color: 'text-slate-600' },
    { icon: <FilePlus size={14} />,    label: 'Novo Documento',     action: () => {},        color: 'text-slate-600' },
    { icon: <RefreshCw size={14} />,   label: 'Alterar Status',     action: onAlterarStatus, color: 'text-amber-600' },
    { icon: <Archive size={14} />,     label: 'Arquivar',           action: onArquivar,      color: 'text-red-500'   },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-14 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/60 z-50 py-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-150">
          {acoes.map((acao, i) => (
            <React.Fragment key={i}>
              {i === acoes.length - 1 && <div className="h-px bg-slate-100 mx-3 my-1" />}
              <button
                onClick={(e) => { e.stopPropagation(); acao.action(); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-all ${acao.color}`}
              >
                {acao.icon}
                {acao.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Modal de Edição Rápida ───────────────────────────────────────────────────

interface ModalEdicaoProps {
  process: REURBProcess;
  onClose: () => void;
  onSave: () => void;
}

const ModalEdicao: React.FC<ModalEdicaoProps> = ({ process, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: process.title,
    applicant: process.applicant,
    location: process.location || '',
    area: process.area,
    responsibleName: process.responsibleName || '',
  });

  const handleSalvar = () => {
    // TODO (Backend): PATCH /api/processos/:id
    dbService.processes.update(process.id, form);
    onSave();
    onClose();
  };

  const campos = [
    { label: 'Título do Núcleo',     name: 'title',           placeholder: 'Ex: Núcleo Habitacional Esperança' },
    { label: 'Requerente',           name: 'applicant',       placeholder: 'Ex: Associação de Moradores'       },
    { label: 'Localização',          name: 'location',        placeholder: 'Ex: Bairro Santa Luzia'            },
    { label: 'Área Total',           name: 'area',            placeholder: 'Ex: 15.400 m²'                     },
    { label: 'Responsável Técnico',  name: 'responsibleName', placeholder: 'Ex: Eng. João da Silva'            },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Editar Processo</h2>
            <p className="text-slate-400 text-sm mt-0.5">Protocolo {process.protocol}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">✕</button>
        </div>

        <div className="p-8 space-y-4">
          {campos.map(({ label, name, placeholder }) => (
            <div key={name}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                {label}
              </label>
              <input
                value={(form as any)[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>
          ))}
        </div>

        <div className="px-8 pb-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
            Cancelar
          </button>
          <button onClick={handleSalvar} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de Alterar Status ──────────────────────────────────────────────────

interface ModalStatusProps {
  process: REURBProcess;
  onClose: () => void;
  onSave: () => void;
}

const ModalStatus: React.FC<ModalStatusProps> = ({ process, onClose, onSave }) => {
  const [status, setStatus] = useState<ProcessStatus>(process.status);

  const handleSalvar = () => {
    // TODO (Backend): PATCH /api/processos/:id/status
    dbService.processes.updateStatus(process.id, status);
    onSave();
    onClose();
  };

  const opcoes: { value: ProcessStatus; color: string }[] = [
    { value: ProcessStatus.PENDENTE,         color: 'bg-slate-100 text-slate-600'    },
    { value: ProcessStatus.INICIAL,          color: 'bg-slate-100 text-slate-600'    },
    { value: ProcessStatus.EM_ANDAMENTO,     color: 'bg-blue-100 text-blue-700'      },
    { value: ProcessStatus.EM_ANALISE,       color: 'bg-indigo-100 text-indigo-700'  },
    { value: ProcessStatus.DILIGENCIA,       color: 'bg-red-100 text-red-700'        },
    { value: ProcessStatus.APROVADO,         color: 'bg-emerald-100 text-emerald-700'},
    { value: ProcessStatus.CONCLUIDO,        color: 'bg-green-100 text-green-700'    },
    { value: ProcessStatus.FINALIZADO,       color: 'bg-green-100 text-green-800'    },
    { value: ProcessStatus.CANCELADO,        color: 'bg-red-100 text-red-700'        },
    { value: ProcessStatus.ARQUIVADO,        color: 'bg-slate-100 text-slate-500'    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">Alterar Status</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all">✕</button>
        </div>

        <div className="p-6 space-y-2 max-h-[400px] overflow-y-auto">
          {opcoes.map((op) => (
            <button
              key={op.value}
              onClick={() => setStatus(op.value)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                status === op.value ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <span className="text-slate-700">{op.value}</span>
              <span className={`text-[10px] px-2 py-1 rounded-full font-black ${op.color}`}>{op.value}</span>
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
            Cancelar
          </button>
          <button onClick={handleSalvar} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export const ProcessManagement: React.FC = () => {
  const [processes, setProcesses] = useState<REURBProcess[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Estados dos modais e drawer
  const [selectedProcess, setSelectedProcess] = useState<REURBProcess | null>(null);
  const [processEditar, setProcessEditar] = useState<REURBProcess | null>(null);
  const [processStatus, setProcessStatus] = useState<REURBProcess | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('reurb_current_user') || '{}');

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    // TODO (Backend): GET /api/processos
    setProcesses(dbService.processes.selectAll());
  };

  const handleArquivar = (proc: REURBProcess) => {
    if (!confirm(`Arquivar o processo "${proc.applicant}"?`)) return;
    // TODO (Backend): PATCH /api/processos/:id/status → { status: 'Arquivado' }
    dbService.processes.updateStatus(proc.id, ProcessStatus.ARQUIVADO);
    fetchData();
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch =
      (p.applicant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.protocol || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Ativos', value: processes.length,                                                                                             color: 'text-blue-600',  icon: FileText,    bg: 'bg-blue-50'  },
    { label: 'Diligências',  value: processes.filter(p => p.status === ProcessStatus.DILIGENCIA).length,                                          color: 'text-red-500',   icon: AlertCircle, bg: 'bg-red-50'   },
    { label: 'Finalizados',  value: processes.filter(p => p.status === ProcessStatus.CONCLUIDO || p.status === ProcessStatus.FINALIZADO).length,   color: 'text-green-500', icon: CheckCircle2,bg: 'bg-green-50' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Central de Processos</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Gerencie o fluxo de regularização da prefeitura.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={18} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={18} />
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
            <Plus size={18} /> Novo Protocolo
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white border border-slate-100 p-4 rounded-[32px] shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por requerente, núcleo ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 md:flex-none px-5 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-xs font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-100 transition-all cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            {Object.values(ProcessStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all border border-transparent">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <ProcessTable processes={filteredProcesses} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProcesses.map(proc => (
            <div key={proc.id} className="bg-white border border-slate-200 rounded-[32px] p-6 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <FileText size={22} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${proc.modality === 'REURB-S' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                    {proc.modality}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">#{proc.protocol || 'S/P'}</span>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">{proc.applicant}</h3>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-6 font-medium">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{proc.location || 'Localização não definida'}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Activity size={10} /> Progresso Geral</span>
                  <span className="text-slate-800">{proc.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${proc.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${proc.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6 mb-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Calendar size={10} /> Início
                  </span>
                  <span className="text-xs font-bold text-slate-600">{proc.createdAt}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                    <Clock size={10} /> Status
                  </span>
                  <span className="text-xs font-black text-blue-600">{proc.status}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Botão Gerenciar — abre drawer com 14 etapas */}
                <button
                  onClick={() => setSelectedProcess(proc)}
                  className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-100"
                >
                  Gerenciar <ChevronRight size={14} />
                </button>

                {/* Menu de ações rápidas */}
                <MenuTresPontos
                  process={proc}
                  onGerenciar={() => setSelectedProcess(proc)}
                  onEditar={() => setProcessEditar(proc)}
                  onAlterarStatus={() => setProcessStatus(proc)}
                  onArquivar={() => handleArquivar(proc)}
                />
              </div>
            </div>
          ))}

          {filteredProcesses.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Search size={48} />
              </div>
              <h3 className="text-slate-800 text-xl font-black">Nada por aqui...</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Ajuste os filtros ou crie um novo protocolo.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Modais e Drawer ─────────────────────────────────────────────── */}

      {/* Modal novo processo */}
      <NewProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        currentUser={currentUser}
      />

      {/* Drawer com as 14 etapas do processo */}
      <ProcessDrawer
        process={selectedProcess}
        onClose={() => { setSelectedProcess(null); fetchData(); }}
        currentUser={currentUser}
      />

      {/* Modal de edição de dados */}
      {processEditar && (
        <ModalEdicao
          process={processEditar}
          onClose={() => setProcessEditar(null)}
          onSave={fetchData}
        />
      )}

      {/* Modal de alteração de status */}
      {processStatus && (
        <ModalStatus
          process={processStatus}
          onClose={() => setProcessStatus(null)}
          onSave={fetchData}
        />
      )}
    </div>
  );
};
