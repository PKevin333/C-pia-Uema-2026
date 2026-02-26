import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, AlertCircle, Ban, Play,
  ChevronDown, ChevronUp, User, Lock
} from 'lucide-react';
import { REURBEtapa, EtapaStatus, EixoEtapa, User as UserType } from '../../../types/index';
import { dbService } from '../../../services/databaseService';

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const COR_EIXO: Record<EixoEtapa, string> = {
  Técnico:   'bg-blue-100 text-blue-700 border-blue-200',
  Jurídico:  'bg-purple-100 text-purple-700 border-purple-200',
  Social:    'bg-green-100 text-green-700 border-green-200',
  Cartorial: 'bg-amber-100 text-amber-700 border-amber-200',
  Geral:     'bg-slate-100 text-slate-600 border-slate-200',
};

const CONFIG_STATUS: Record<EtapaStatus, {
  label: string;
  icon: React.ReactNode;
  cor: string;
  corFundo: string;
}> = {
  pendente: {
    label: 'Pendente',
    icon: <Clock size={14} />,
    cor: 'text-slate-400',
    corFundo: 'bg-slate-50 border-slate-200',
  },
  em_andamento: {
    label: 'Em Andamento',
    icon: <Play size={14} />,
    cor: 'text-blue-600',
    corFundo: 'bg-blue-50 border-blue-200',
  },
  concluida: {
    label: 'Concluída',
    icon: <CheckCircle2 size={14} />,
    cor: 'text-green-600',
    corFundo: 'bg-green-50 border-green-200',
  },
  bloqueada: {
    label: 'Bloqueada',
    icon: <Lock size={14} />,
    cor: 'text-red-400',
    corFundo: 'bg-red-50 border-red-200',
  },
  cancelada: {
    label: 'Cancelada',
    icon: <Ban size={14} />,
    cor: 'text-slate-400',
    corFundo: 'bg-slate-50 border-slate-300',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface EtapasProcessoProps {
  processId: string;
  currentUser: UserType | null;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

const EtapasProcesso: React.FC<EtapasProcessoProps> = ({ processId, currentUser }) => {
  const [etapas, setEtapas] = useState<REURBEtapa[]>([]);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [processo, setProcesso] = useState(dbService.processes.findById(processId));
  const [protocolando, setProtocolando] = useState(false);

  const carregarEtapas = () => {
    setEtapas(dbService.etapas.findByProcessId(processId));
    setProcesso(dbService.processes.findById(processId));
  };

  useEffect(() => {
    carregarEtapas();
  }, [processId]);

  // Verifica se o usuário pode acessar a etapa
  const podeAcessarEtapa = (etapa: REURBEtapa): boolean => {
    if (!currentUser) return false;
    const flags = currentUser.flags;
    if (flags?.superusuario || flags?.adminMunicipio) return true;
    if (!currentUser.etapasPermitidas || currentUser.etapasPermitidas.length === 0) return true;
    return currentUser.etapasPermitidas.includes(etapa.numero);
  };

  const handleProtocolar = () => {
    if (!currentUser || !processo) return;
    setProtocolando(true);
    const novasEtapas = dbService.processes.protocolar(
      processId,
      currentUser.id,
      currentUser.name
    );
    setEtapas(novasEtapas);
    setProcesso(dbService.processes.findById(processId));
    setProtocolando(false);
  };

  const handleMudarStatus = (etapa: REURBEtapa, novoStatus: EtapaStatus) => {
    if (!currentUser) return;
    if (!podeAcessarEtapa(etapa)) return;

    if (novoStatus === 'em_andamento' && !dbService.etapas.podeiniciar(etapa.id)) {
      alert('Não é possível iniciar esta etapa. Verifique se as etapas anteriores foram concluídas.');
      return;
    }

    dbService.etapas.updateStatus(etapa.id, novoStatus, currentUser.id, currentUser.name);
    carregarEtapas();
  };

  const handleSalvarObservacao = (etapaId: string, obs: string) => {
    dbService.etapas.atualizarObservacoes(etapaId, obs);
    carregarEtapas();
  };

  const concluidas = etapas.filter((e) => e.status === 'concluida').length;
  const progresso = etapas.length > 0 ? Math.round((concluidas / 14) * 100) : 0;

  // ── Sem processo protocolado ────────────────────────────────────────────────
  if (!processo?.protocolado) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle size={36} className="text-blue-400" />
        </div>
        <h3 className="text-lg font-black text-slate-700 mb-2">Processo não protocolado</h3>
        <p className="text-sm text-slate-400 mb-8 max-w-xs">
          Ao protocolar, as 14 etapas do REURB serão criadas automaticamente e o fluxo será iniciado.
        </p>
        <button
          onClick={handleProtocolar}
          disabled={protocolando}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {protocolando ? 'Protocolando...' : '🚀 Protocolar Processo'}
        </button>
      </div>
    );
  }

  // ── Com etapas ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">

      {/* Barra de progresso geral */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Progresso Geral</span>
          <span className="text-xs font-black text-blue-600">{concluidas}/14 etapas concluídas</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="text-right text-[10px] text-slate-400 mt-1 font-bold">{progresso}%</p>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-2">
        {etapas.map((etapa) => {
          const cfg = CONFIG_STATUS[etapa.status];
          const acesso = podeAcessarEtapa(etapa);
          const aberta = expandida === etapa.id;
          const podeiniciar = dbService.etapas.podeiniciar(etapa.id);

          return (
            <div
              key={etapa.id}
              className={`border rounded-xl overflow-hidden transition-all ${cfg.corFundo} ${
                !acesso ? 'opacity-50' : ''
              }`}
            >
              {/* Cabeçalho da etapa */}
              <button
                onClick={() => acesso && setExpandida(aberta ? null : etapa.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
                disabled={!acesso}
              >
                {/* Número */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  etapa.status === 'concluida'
                    ? 'bg-green-600 text-white'
                    : etapa.status === 'em_andamento'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {etapa.status === 'concluida' ? '✓' : etapa.numero}
                </div>

                {/* Nome + eixo */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    etapa.status === 'cancelada' ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}>
                    {etapa.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${COR_EIXO[etapa.eixo]}`}>
                      {etapa.eixo}
                    </span>
                    {etapa.responsavelNome && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User size={10} /> {etapa.responsavelNome}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-1.5 text-xs font-bold shrink-0 ${cfg.cor}`}>
                  {cfg.icon}
                  <span className="hidden sm:inline">{cfg.label}</span>
                </div>

                {acesso && (
                  <div className="text-slate-400 shrink-0">
                    {aberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                )}
              </button>

              {/* Painel expandido */}
              {aberta && acesso && (
                <div className="border-t border-slate-200 bg-white p-4 space-y-4">

                  {/* Datas */}
                  <div className="flex gap-4 text-xs text-slate-500">
                    {etapa.dataInicio && (
                      <span>📅 Início: <strong>{etapa.dataInicio}</strong></span>
                    )}
                    {etapa.dataConclusao && (
                      <span>✅ Conclusão: <strong>{etapa.dataConclusao}</strong></span>
                    )}
                  </div>

                  {/* Dependências */}
                  {etapa.dependeDe && etapa.dependeDe.length > 0 && (
                    <p className="text-[11px] text-slate-400">
                      Depende das etapas: <strong>{etapa.dependeDe.join(', ')}</strong>
                      {!podeiniciar && etapa.status === 'pendente' && (
                        <span className="ml-2 text-red-500">⚠ Pré-requisitos pendentes</span>
                      )}
                    </p>
                  )}

                  {/* Observações */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                      Observações
                    </label>
                    <textarea
                      defaultValue={etapa.observacoes || ''}
                      onBlur={(e) => handleSalvarObservacao(etapa.id, e.target.value)}
                      placeholder="Adicione observações sobre esta etapa..."
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[70px]"
                    />
                  </div>

                  {/* Ações de status */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Alterar Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          'pendente',
                          'em_andamento',
                          'concluida',
                          'bloqueada',
                          'cancelada',
                        ] as EtapaStatus[]
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleMudarStatus(etapa, s)}
                          disabled={etapa.status === s}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border ${
                            etapa.status === s
                              ? 'opacity-40 cursor-not-allowed ' + CONFIG_STATUS[s].corFundo
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {CONFIG_STATUS[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EtapasProcesso;
