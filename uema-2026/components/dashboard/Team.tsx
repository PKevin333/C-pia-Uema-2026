import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Search, Plus, 
  MoreVertical, Edit2, Trash2,
  CheckCircle2, Check, X, AlertTriangle
} from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { User } from '../../types';

interface DeleteModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ name, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Remover colaborador</h3>
          <p className="text-sm text-slate-500 mt-1">
            Tem certeza que deseja remover{' '}
            <span className="font-semibold text-slate-700">"{name}"</span> da equipe?
            Esta acao nao pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  </div>
);

interface InlineEditProps {
  value: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}

const InlineEdit: React.FC<InlineEditProps> = ({ value, onSave, onCancel }) => {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave(text.trim() || value);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border border-blue-400 rounded-lg px-2 py-0.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 w-44"
      />
      <button
        onClick={() => onSave(text.trim() || value)}
        className="p-1 text-green-600 hover:text-green-700 transition-colors"
        title="Salvar (Enter)"
      >
        <Check size={15} />
      </button>
      <button
        onClick={onCancel}
        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        title="Cancelar (Esc)"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const Team: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchMembers = () => setMembers(dbService.users.selectAll());

  useEffect(() => {
    fetchMembers();
    const interval = setInterval(fetchMembers, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveName = (id: string, newName: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Juridico': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Tecnico':  return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Gestor':   return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Admin':    return 'bg-red-50 text-red-600 border-red-100';
      default:         return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Nunca acessou';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipe Tecnica</h2>
          <p className="text-slate-500 text-sm font-medium">Controle de acessos e permissoes dos colaboradores.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 shrink-0">
            <Plus size={18} /> <span className="hidden sm:inline">Convidar</span>
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
                <th className="px-8 py-5">Membro / Operador</th>
                <th className="px-6 py-5">Cargo</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Ultimo Acesso</th>
                <th className="px-6 py-5">Uso de IA</th>
                <th className="px-8 py-5 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.map((member) => {
                const quotaPercent = Math.round((member.quota?.used || 0) / (member.quota?.limit || 1) * 100);

                return (
                  <tr key={member.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${member.status === 'Online' ? 'bg-green-500' : 'bg-slate-300'}`}>
                            {member.status === 'Online' && <CheckCircle2 size={8} className="text-white" />}
                          </div>
                        </div>
                        <div>
                          {editingId === member.id ? (
                            <InlineEdit
                              value={member.name}
                              onSave={(name) => handleSaveName(member.id, name)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <p className="text-sm font-black text-slate-800 leading-none mb-1">{member.name}</p>
                          )}
                          <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${getRoleBadge(member.role)}`}>
                        {member.role}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className={`text-xs font-bold ${member.status === 'Online' ? 'text-green-600' : 'text-slate-400'}`}>
                          {member.status || 'Offline'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-medium">{formatLastSeen(member.lastLogin)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="w-24">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Consumo</span>
                          <span className={`text-[10px] font-bold ${quotaPercent > 80 ? 'text-red-500' : 'text-blue-600'}`}>
                            {quotaPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${quotaPercent > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${quotaPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Editar nome"
                          onClick={() => setEditingId(member.id)}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          title="Remover colaborador"
                          onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="group-hover:hidden">
                        <MoreVertical size={18} className="text-slate-300 ml-auto" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <Search size={32} />
            </div>
            <h3 className="text-slate-800 font-bold">Nenhum membro encontrado</h3>
            <p className="text-slate-400 text-sm">Tente uma busca diferente ou adicione um novo operador.</p>
          </div>
        )}

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            Exibindo {filteredMembers.length} de {members.length} colaboradores cadastrados.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50" disabled>Anterior</button>
            <button className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50" disabled>Proximo</button>
          </div>
        </div>
      </div>
    </div>
  );
};
