
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Plus, Briefcase, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { MOCK_MODELS } from '../../constants';
import { User, REURBProcess, ProcessStatus } from '../../types';
import { ProcessTable } from './ProcessTable';
import { NewProcessModal } from './NewProcessModal';

export const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [processes, setProcesses] = useState<REURBProcess[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProcesses = () => {
    setProcesses(dbService.processes.selectAll());
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const stats = [
    { label: 'Processos Ativos', value: processes.length.toString(), change: '+2', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Em Revisão', value: processes.filter(p => p.status === ProcessStatus.EM_ANALISE).length.toString(), change: '0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Concluídos', value: processes.filter(p => p.status === ProcessStatus.CONCLUIDO).length.toString(), change: '+1', icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Bem-vindo, {user.name.split(' ')[0]}</h2>
          <p className="text-slate-500 mt-2 font-medium">Controle central de regularização fundiária municipal.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 relative hover:shadow-md transition-all">
            <Bell size={22} />
            <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-[3px] border-white"></span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
          >
            <Plus size={20} /> Novo Processo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <h3 className="font-black text-slate-800 text-lg">Processos Recentes</h3>
            <Link to="/processes" className="text-blue-600 text-sm font-black hover:underline flex items-center gap-2">
              Ver Todos <ArrowUpRight size={16} />
            </Link>
          </div>
          <ProcessTable processes={processes.slice(0, 5)} />
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
            <h3 className="font-black text-lg">Modelos Oficiais</h3>
          </div>
          <div className="p-6 space-y-4">
            {MOCK_MODELS.slice(0, 4).map((model) => (
              <div key={model.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-white transition-all group flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-all">{model.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Versão {model.version}</p>
                  </div>
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200">
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
