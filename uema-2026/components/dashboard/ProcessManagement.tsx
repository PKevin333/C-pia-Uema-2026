
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, LayoutGrid, List, 
  FileText, MapPin, Calendar, 
  ChevronRight, MoreHorizontal, Activity,
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { REURBProcess, ProcessStatus } from '../../types';
import { ProcessTable } from './ProcessTable';
import { NewProcessModal } from './NewProcessModal';

export const ProcessManagement: React.FC = () => {
  const [processes, setProcesses] = useState<REURBProcess[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setProcesses(dbService.processes.selectAll());
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = (p.applicant || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.protocol || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Ativos', value: processes.length, color: 'text-blue-600', icon: FileText, bg: 'bg-blue-50' },
    { label: 'Diligências', value: processes.filter(p => p.status === ProcessStatus.DILIGENCIA).length, color: 'text-red-500', icon: AlertCircle, bg: 'bg-red-50' },
    { label: 'Finalizados', value: processes.filter(p => p.status === ProcessStatus.CONCLUIDO || p.status === ProcessStatus.FINALIZADO).length, color: 'text-green-500', icon: CheckCircle2, bg: 'bg-green-50' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Central de Processos</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Gerencie o fluxo de regularização da prefeitura.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
          >
            <Plus size={18} /> Novo Protocolo
          </button>
        </div>
      </header>

      {/* Mini Dashboard de Processos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black text-slate-800`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Busca e Filtros - Estilo Painel */}
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

      {/* Área de Conteúdo principal */}
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
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    proc.modality === 'REURB-S' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                  }`}>
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
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                      proc.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                    }`}
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
                <button className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-100">
                  Gerenciar <ChevronRight size={14} />
                </button>
                <button className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                  <MoreHorizontal size={20} />
                </button>
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

      <NewProcessModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData}
        currentUser={JSON.parse(localStorage.getItem('reurb_current_user') || '{}')}
      />
    </div>
  );
};
