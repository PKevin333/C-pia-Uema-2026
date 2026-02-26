import React from 'react';
import { X, FileText, ArrowRight, User as UserIcon } from 'lucide-react';
import { REURBProcess, User, ProcessStatus } from '../../types/index';
import { dbService } from '../../services/databaseService';
import { Link } from 'react-router-dom';
import EtapasProcesso from '../editor/components/EtapasProcesso';

interface ProcessDrawerProps {
  process: REURBProcess | null;
  onClose: () => void;
  currentUser?: User | null;
}

export const ProcessDrawer: React.FC<ProcessDrawerProps> = ({ process, onClose, currentUser }) => {
  if (!process) return null;

  const documents = dbService.documents.findByProcessId(process.id);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[110] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[120] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-slate-100">
        {/* ─── Cabeçalho ─────────────────────────────────────────────────── */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
              Protocolo {process.protocol}
            </span>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{process.applicant}</h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                process.status === ProcessStatus.CONCLUIDO
                  ? 'bg-green-100 text-green-700'
                  : process.status === ProcessStatus.EM_ANDAMENTO
                  ? 'bg-blue-100 text-blue-700'
                  : process.status === ProcessStatus.CANCELADO
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {process.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-0">
          {/* ─── 14 Etapas do REURB ──────────────────────────────────────── */}
          <div className="px-4 pt-6 pb-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              14 Etapas do REURB
            </h4>
          </div>

          <EtapasProcesso processId={process.id} currentUser={currentUser || null} />

          {/* ─── Documentos ──────────────────────────────────────────────── */}
          <div className="px-8 pb-6 pt-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Documentos Vinculados
              </h4>
              <Link to="/templates" className="text-[10px] font-bold text-blue-600 hover:underline">
                Novo Documento
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                <FileText size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nenhum documento gerado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Link
                    to={`/edit/${doc.id}`}
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{doc.title}</span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ─── Equipe ───────────────────────────────────────────────────── */}
          <div className="px-8 pb-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Equipe Designada
            </h4>
            <div className="flex items-center gap-3 p-4 bg-blue-50/30 border border-blue-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{process.responsibleName || 'Não atribuído'}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Responsável Atual</p>
              </div>
            </div>
          </div>

          {/* ─── Ações ───────────────────────────────────────────────────── */}
          <div className="px-8 pb-10">
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">
              Ações de Aprovação
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
