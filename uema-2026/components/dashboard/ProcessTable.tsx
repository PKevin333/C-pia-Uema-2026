import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';
import { REURBProcess, User, ProcessStatus } from '../../types/index';
import { ProcessDrawer } from './ProcessDrawer';

interface ProcessTableProps {
  processes: REURBProcess[];
  currentUser?: User | null;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({ processes, currentUser }) => {
  const [selectedProcess, setSelectedProcess] = useState<REURBProcess | null>(null);

  const getStatusStyles = (status: ProcessStatus) => {
    switch (status) {
      case ProcessStatus.CONCLUIDO:
        return 'bg-green-50 text-green-600 border-green-100';
      case ProcessStatus.EM_ANDAMENTO:
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case ProcessStatus.CANCELADO:
        return 'bg-red-50 text-red-600 border-red-100';
      case ProcessStatus.PENDENTE:
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-[24px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-10 py-6">Protocolo</th>
                <th className="px-6 py-6">Requerente / Núcleo</th>
                <th className="px-6 py-6">Modalidade</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-6 py-6">Responsável</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {processes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Database size={48} />
                      <p className="text-sm font-bold">Nenhum processo localizado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processes.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50/40 transition-all group">
                    <td className="px-10 py-6">
                      <button
                        onClick={() => setSelectedProcess(proc)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all"
                      >
                        {proc.protocol || proc.id}
                      </button>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-bold text-slate-800">{proc.applicant}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{proc.location}</div>
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`text-[9px] px-2.5 py-1 rounded-md font-black tracking-wider border ${
                          proc.modality === 'REURB-S'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-purple-50 text-purple-600 border-purple-100'
                        }`}
                      >
                        {proc.modality}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`text-[10px] px-3 py-1 rounded-full font-bold border ${getStatusStyles(
                          proc.status
                        )}`}
                      >
                        {proc.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm text-slate-500 font-medium">
                        {proc.responsibleName || 'Não atribuído'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <Link
                        to="/templates"
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Gerar Documento
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProcessDrawer
        process={selectedProcess}
        onClose={() => setSelectedProcess(null)}
        currentUser={currentUser}
      />
    </>
  );
};