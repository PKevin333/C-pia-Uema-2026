
import React from 'react';
import { X, FileText, CheckCircle2, ArrowRight, User as UserIcon } from 'lucide-react';
import { REURBProcess } from '../../types/index';
import { dbService } from '../../services/databaseService';
import { Link } from 'react-router-dom';

interface ProcessDrawerProps {
  process: REURBProcess | null;
  onClose: () => void;
}

export const ProcessDrawer: React.FC<ProcessDrawerProps> = ({ process, onClose }) => {
  if (!process) return null;

  const documents = dbService.documents.findByProcessId(process.id);

  const steps = [
    { label: 'Instauração', status: 'done' },
    { label: 'Levantamento', status: process.progress > 30 ? 'done' : 'doing' },
    { label: 'Análise Jurídica', status: process.progress > 60 ? 'done' : 'todo' },
    { label: 'Titulação', status: process.progress === 100 ? 'done' : 'todo' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[110] animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[120] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-100">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Protocolo {process.protocol}</span>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{process.applicant}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10">
          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Etapas do Fluxo</h4>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                    step.status === 'done' ? 'bg-green-500 text-white' : 
                    step.status === 'doing' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-white'
                  }`}>
                    {step.status === 'done' && <CheckCircle2 size={12} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${step.status === 'todo' ? 'text-slate-400' : 'text-slate-800'}`}>{step.label}</p>
                    {step.status === 'doing' && <span className="text-[10px] text-blue-600 font-bold uppercase">Em andamento</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos Vinculados</h4>
              <Link to="/templates" className="text-[10px] font-bold text-blue-600 hover:underline">Novo Documento</Link>
            </div>
            {documents.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                <FileText size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nenhum documento gerado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <Link to={`/edit/${doc.id}`} key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{doc.title}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Equipe Designada</h4>
             <div className="flex items-center gap-3 p-4 bg-blue-50/30 border border-blue-50 rounded-2xl">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                 <UserIcon size={20} />
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-800">{process.responsibleName || 'Não atribuído'}</p>
                 <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Responsável Atual</p>
               </div>
             </div>
          </section>

          <div className="pt-6">
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">
              Ações de Aprovação
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
