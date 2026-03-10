import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Search, Plus,
  MoreVertical, Edit2, Trash2,
  CheckCircle2, Check, X, AlertTriangle,
  Shield, ShieldCheck, ShieldAlert, User2,
  ChevronDown, Eye, FileEdit, MessageSquare,
  ThumbsUp, PenLine, Download, Settings,
  Lock, Unlock
} from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { User, UserRole, FlagsAcesso } from '../../types/index';

// ─── Cores por cargo ───────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string, string> = {
  Admin:      'bg-red-50 text-red-600 border-red-100',
  Gestor:     'bg-amber-50 text-amber-600 border-amber-100',
  Jurídico:   'bg-purple-50 text-purple-600 border-purple-100',
  Técnico:    'bg-blue-50 text-blue-600 border-blue-100',
  Auditor:    'bg-teal-50 text-teal-600 border-teal-100',
  Atendente:  'bg-slate-50 text-slate-600 border-slate-200',
};

// ─── Ícone por flag ────────────────────────────────────────────────────────────
const FLAG_CONFIG = {
  superusuario: {
    label: 'Superusuário',
    desc: 'Gerencia todos os municípios',
    icon: ShieldCheck,
    on: 'text-red-500',
    bg: 'bg-red-50 border-red-100',
  },
  adminMunicipio: {
    label: 'Admin do Município',
    desc: 'Gerencia usuários e configurações locais',
    icon: ShieldAlert,
    on: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-100',
  },
  profissionalInterno: {
    label: 'Profissional Interno',
    desc: 'Acessa processos e gera documentos',
    icon: Shield,
    on: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-100',
  },
  usuarioExterno: {
    label: 'Usuário Externo',
    desc: 'Visualiza apenas seus processos',
    icon: User2,
    on: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
  },
} as const;

// ─── Permissões por ação ───────────────────────────────────────────────────────
const PERM_CONFIG = [
  { key: 'visualizar',  label: 'Visualizar',  icon: Eye },
  { key: 'editar',      label: 'Editar',       icon: FileEdit },
  { key: 'comentar',    label: 'Comentar',     icon: MessageSquare },
  { key: 'aprovar',     label: 'Aprovar',      icon: ThumbsUp },
  { key: 'assinar',     label: 'Assinar',      icon: PenLine },
  { key: 'exportar',    label: 'Exportar',     icon: Download },
] as const;

// Permissões padrão por cargo
const DEFAULT_PERMS: Record<UserRole, string[]> = {
  Admin:     ['visualizar', 'editar', 'comentar', 'aprovar', 'assinar', 'exportar'],
  Gestor:    ['visualizar', 'editar', 'comentar', 'aprovar', 'exportar'],
  Jurídico:  ['visualizar', 'editar', 'comentar', 'aprovar', 'assinar', 'exportar'],
  Técnico:   ['visualizar', 'editar', 'comentar', 'exportar'],
  Auditor:   ['visualizar', 'comentar'],
  Atendente: ['visualizar'],
};

// Flags padrão por cargo
const DEFAULT_FLAGS: Record<UserRole, FlagsAcesso> = {
  Admin:     { superusuario: true,  adminMunicipio: true,  profissionalInterno: true,  usuarioExterno: false },
  Gestor:    { superusuario: false, adminMunicipio: true,  profissionalInterno: true,  usuarioExterno: false },
  Jurídico:  { superusuario: false, adminMunicipio: false, profissionalInterno: true,  usuarioExterno: false },
  Técnico:   { superusuario: false, adminMunicipio: false, profissionalInterno: true,  usuarioExterno: false },
  Auditor:   { superusuario: false, adminMunicipio: false, profissionalInterno: true,  usuarioExterno: false },
  Atendente: { superusuario: false, adminMunicipio: false, profissionalInterno: false, usuarioExterno: true  },
};

// ─── Modal de Permissões ───────────────────────────────────────────────────────
interface PermModalProps {
  member: User;
  onClose: () => void;
  onSave: (updated: User) => void;
}

const PermModal: React.FC<PermModalProps> = ({ member, onClose, onSave }) => {
  const [role, setRole] = useState<UserRole>(member.role as UserRole);
  const [flags, setFlags] = useState<FlagsAcesso>(
    member.flags ?? DEFAULT_FLAGS[member.role as UserRole]
  );
  const [perms, setPerms] = useState<string[]>(
    (member as any).perms ?? DEFAULT_PERMS[member.role as UserRole]
  );

  // Ao trocar o cargo, reseta flags e permissões para o padrão
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setFlags(DEFAULT_FLAGS[newRole]);
    setPerms(DEFAULT_PERMS[newRole]);
  };

  const toggleFlag = (key: keyof FlagsAcesso) =>
    setFlags(f => ({ ...f, [key]: !f[key] }));

  const togglePerm = (key: string) =>
    setPerms(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);

  const handleSave = () => {
    onSave({ ...member, role, flags, perms } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={member.avatar} alt={member.name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-white/30" />
            <div>
              <p className="text-white font-black text-base leading-none">{member.name}</p>
              <p className="text-blue-200 text-xs mt-0.5">{member.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Cargo */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Cargo / Perfil
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_STYLE) as UserRole[]).map(r => (
                <button key={r} onClick={() => handleRoleChange(r)}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                    role === r
                      ? ROLE_STYLE[r] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Flags de acesso */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Flags de Acesso ao Sistema
            </label>
            <div className="space-y-2">
              {(Object.entries(FLAG_CONFIG) as [keyof FlagsAcesso, typeof FLAG_CONFIG[keyof typeof FLAG_CONFIG]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const active = flags[key];
                return (
                  <button key={key} onClick={() => toggleFlag(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      active ? cfg.bg : 'bg-slate-50 border-slate-100'
                    }`}>
                    <Icon size={18} className={active ? cfg.on : 'text-slate-300'} />
                    <div className="flex-1 text-left">
                      <p className={`text-xs font-black ${active ? 'text-slate-800' : 'text-slate-400'}`}>
                        {cfg.label}
                      </p>
                      <p className="text-[10px] text-slate-400">{cfg.desc}</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 ${
                      active ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissões por ação */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Permissões por Ação
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERM_CONFIG.map(({ key, label, icon: Icon }) => {
                const active = perms.includes(key);
                return (
                  <button key={key} onClick={() => togglePerm(key)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-blue-50 border-blue-100 text-blue-700'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                    <Icon size={15} />
                    <span className="text-xs font-black">{label}</span>
                    {active
                      ? <Unlock size={12} className="ml-auto text-blue-400" />
                      : <Lock size={12} className="ml-auto text-slate-300" />
                    }
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
            Salvar Permissões
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────
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
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
            Remover
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Edição inline de nome ─────────────────────────────────────────────────────
interface InlineEditProps {
  value: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const InlineEdit: React.FC<InlineEditProps> = ({ value, onSave, onCancel }) => {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave(text.trim() || value);
    if (e.key === 'Escape') onCancel();
  };
  return (
    <div className="flex items-center gap-2">
      <input ref={ref} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
        className="border border-blue-400 rounded-lg px-2 py-0.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 w-44" />
      <button onClick={() => onSave(text.trim() || value)} className="p-1 text-green-600 hover:text-green-700"><Check size={15} /></button>
      <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600"><X size={15} /></button>
    </div>
  );
};

// ─── Mini badge de flags ───────────────────────────────────────────────────────
const FlagBadges: React.FC<{ flags?: FlagsAcesso }> = ({ flags }) => {
  if (!flags) return <span className="text-xs text-slate-300">—</span>;
  const ativos = (Object.entries(flags) as [keyof FlagsAcesso, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => FLAG_CONFIG[k]);
  if (ativos.length === 0) return <span className="text-xs text-slate-300">Nenhuma</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ativos.map(cfg => {
        const Icon = cfg.icon;
        return (
          <span key={cfg.label} title={cfg.label}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black ${cfg.bg} ${cfg.on}`}>
            <Icon size={10} /> {cfg.label.split(' ')[0]}
          </span>
        );
      })}
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export const Team: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [permTarget, setPermTarget] = useState<User | null>(null);

  const fetchMembers = () => setMembers(dbService.users.selectAll());
  useEffect(() => {
    fetchMembers();
    const iv = setInterval(fetchMembers, 10000);
    return () => clearInterval(iv);
  }, []);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveName = (id: string, name: string) => {
    setMembers(p => p.map(m => m.id === id ? { ...m, name } : m));
    setEditingId(null);
  };

  const handleSavePerms = (updated: User) => {
    setMembers(p => p.map(m => m.id === updated.id ? updated : m));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setMembers(p => p.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const formatLastSeen = (d?: string) => {
    if (!d) return 'Nunca acessou';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {permTarget && <PermModal member={permTarget} onClose={() => setPermTarget(null)} onSave={handleSavePerms} />}

      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipe Técnica</h2>
          <p className="text-slate-500 text-sm font-medium">Controle de acessos e permissões dos colaboradores.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar colaborador..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm" />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 shrink-0">
            <Plus size={18} /><span className="hidden sm:inline">Convidar</span>
          </button>
        </div>
      </header>

      {/* Tabela */}
      <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
                <th className="px-8 py-5">Membro / Operador</th>
                <th className="px-6 py-5">Cargo</th>
                <th className="px-6 py-5">Flags de Acesso</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Último Acesso</th>
                <th className="px-6 py-5">Uso de IA</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(member => {
                const quotaPercent = Math.round((member.quota?.used || 0) / (member.quota?.limit || 1) * 100);
                const memberFlags = member.flags ?? DEFAULT_FLAGS[member.role as UserRole];

                return (
                  <tr key={member.id} className="hover:bg-blue-50/20 transition-all group">

                    {/* Nome */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={member.avatar} alt={member.name}
                            className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm" />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${member.status === 'Online' ? 'bg-green-500' : 'bg-slate-300'}`}>
                            {member.status === 'Online' && <CheckCircle2 size={8} className="text-white" />}
                          </div>
                        </div>
                        <div>
                          {editingId === member.id
                            ? <InlineEdit value={member.name} onSave={n => handleSaveName(member.id, n)} onCancel={() => setEditingId(null)} />
                            : <p className="text-sm font-black text-slate-800 leading-none mb-1">{member.name}</p>
                          }
                          <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${ROLE_STYLE[member.role] ?? ROLE_STYLE.Atendente}`}>
                        {member.role}
                      </span>
                    </td>

                    {/* Flags */}
                    <td className="px-6 py-5">
                      <FlagBadges flags={memberFlags} />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className={`text-xs font-bold ${member.status === 'Online' ? 'text-green-600' : 'text-slate-400'}`}>
                          {member.status || 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Último acesso */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-medium">{formatLastSeen(member.lastLogin)}</span>
                      </div>
                    </td>

                    {/* IA */}
                    <td className="px-6 py-5">
                      <div className="w-24">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Consumo</span>
                          <span className={`text-[10px] font-bold ${quotaPercent > 80 ? 'text-red-500' : 'text-blue-600'}`}>
                            {quotaPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-700 ${quotaPercent > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${quotaPercent}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Gerenciar permissões" onClick={() => setPermTarget(member)}
                          className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                          <Settings size={16} />
                        </button>
                        <button title="Editar nome" onClick={() => setEditingId(member.id)}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button title="Remover colaborador" onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
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

        {filtered.length === 0 && (
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
            Exibindo {filtered.length} de {members.length} colaboradores cadastrados.
          </p>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Anterior</button>
            <button disabled className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
};
