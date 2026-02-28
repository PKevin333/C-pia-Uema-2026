import React, { useEffect, useMemo, useState } from 'react';
import {
  X, CheckCircle2, Clock, Lock, Shield, User, Hash,
  Download, AlertCircle, ChevronRight, Pen
} from 'lucide-react';

import {
  assinaturaService,
  Signer,
  SignatureRecord,
  SignatureEvent,
} from '../../services/assinaturaService'; // ✅ AQUI (corrigido)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

const cx = (...c: Array<string | false | undefined | null>) => c.filter(Boolean).join(' ');

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string;
  currentUser: { id?: string; name?: string; email?: string; role?: string } | null;
  onSignatureComplete: (record: SignatureRecord) => void;
}

const DEFAULT_SIGNERS: Array<Omit<Signer, 'status' | 'signedAt' | 'signatureHash' | 'ip'>> = [
  { id: 'sig-1', name: 'Responsável Técnico', role: 'Engenheiro/Urbanista', email: 'tecnico@prefeitura.gov.br', order: 1 },
  { id: 'sig-2', name: 'Secretário de Regularização', role: 'Secretário Municipal', email: 'secretario@prefeitura.gov.br', order: 2 },
  { id: 'sig-3', name: 'Prefeito Municipal', role: 'Prefeito', email: 'prefeito@prefeitura.gov.br', order: 3 },
];

type Step = 'config' | 'signing' | 'complete';
type FlowState = 'idle' | 'creating' | 'starting' | 'requesting' | 'done' | 'error';

const EventTypeLabel: Record<string, string> = {
  DOCUMENT_CREATED: 'Documento criado',
  SIGN_FLOW_STARTED: 'Fluxo iniciado',
  SIGNER_READY: 'Próximo assinante liberado',
  SIGN_REQUEST_SENT_TO_PROVIDER: 'Solicitação enviada ao provedor',
  SIGNER_AUTH_STARTED: 'Autenticação iniciada',
  SIGNER_AUTH_SUCCESS: 'Autenticação concluída',
  SIGNATURE_APPLIED: 'Assinatura aplicada',
  SIGN_COMPLETED: 'Fluxo finalizado',
  ERROR: 'Erro',
};

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen, onClose, documentTitle, documentContent, currentUser, onSignatureComplete
}) => {
  const [step, setStep] = useState<Step>('config');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [flow, setFlow] = useState<FlowState>('idle');

  const [record, setRecord] = useState<SignatureRecord | null>(null);
  const [events, setEvents] = useState<SignatureEvent[]>([]);
  const [activeSignerIdx, setActiveSignerIdx] = useState(0);

  const actorName = useMemo(() => currentUser?.name || 'Operador', [currentUser]);

  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setPin('');
      setPinError('');
      setFlow('idle');
      setRecord(null);
      setEvents([]);
      setActiveSignerIdx(0);
    }
  }, [isOpen]);

  const ensureCreated = async () => {
    if (record) return record;

    setFlow('creating');
    const created = await assinaturaService.createSignature({
      documentTitle,
      documentContent,
      signers: DEFAULT_SIGNERS,
      actor: { name: actorName, email: currentUser?.email },
    });
    setRecord(created);
    setEvents(created.events);
    setFlow('idle');
    return created;
  };

  const refresh = async (protocol: string) => {
    const updated = await assinaturaService.getSignature(protocol);
    setRecord(updated);
    setEvents(updated.events);
    const nextIdx = updated.signers.findIndex(s => s.status === 'pending');
    setActiveSignerIdx(nextIdx === -1 ? updated.signers.length - 1 : nextIdx);
    if (updated.status === 'completed') {
      setStep('complete');
      onSignatureComplete(updated);
    }
  };

  const startFlow = async () => {
    const created = await ensureCreated();
    setFlow('starting');
    const updated = await assinaturaService.startFlow(created.protocol, actorName);
    setRecord(updated);
    setEvents(updated.events);
    setFlow('idle');
    setStep('signing');

    const nextIdx = updated.signers.findIndex(s => s.status === 'pending');
    setActiveSignerIdx(nextIdx === -1 ? 0 : nextIdx);
  };

  const handleSign = async () => {
    if (!record) return;
    if (pin.length < 4) { setPinError('PIN deve ter ao menos 4 dígitos.'); return; }

    setPinError('');
    setFlow('requesting');

    try {
      const signer = record.signers[activeSignerIdx];
      const updated = await assinaturaService.requestSignerSignature(record.protocol, signer.id, pin, signer.name);

      setRecord(updated);
      setEvents(updated.events);
      setPin('');
      setFlow('idle');

      const nextIdx = updated.signers.findIndex(s => s.status === 'pending');
      if (nextIdx !== -1) setActiveSignerIdx(nextIdx);

      if (updated.status === 'completed') {
        setStep('complete');
        onSignatureComplete(updated);
      }
    } catch (e: any) {
      setFlow('error');
      setPinError(e?.message || 'Falha ao assinar.');
      setTimeout(() => setFlow('idle'), 1200);
    }
  };

  const download = async () => {
    if (!record) return;
    const blob = await assinaturaService.downloadSignedFile(record.protocol);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.protocol}-assinado.txt`; // backend depois será .pdf
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const protocol = record?.protocol ?? '—';
  const documentHash = record?.documentHash ?? '—';
  const signers = record?.signers ?? DEFAULT_SIGNERS.map(s => ({ ...s, status: 'pending' as const }));

  const signerNow = signers[activeSignerIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-700 to-blue-900 rounded-t-2xl">
          <div className="flex items-center gap-3 text-white">
            <Shield size={22} />
            <div>
              <p className="font-bold text-sm">Assinatura Digital – REURBDoc</p>
              <p className="text-[11px] text-blue-200">Protocolo: {protocol}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* STEP CONFIG */}
        {step === 'config' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Documento</p>
              <p className="font-semibold text-slate-800">{documentTitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <Hash size={12} className="text-slate-400" />
                <p className="text-[11px] text-slate-400 font-mono">Hash: {documentHash}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <User size={16} className="text-blue-600" /> Ordem de Assinatura
              </p>
              <div className="space-y-2">
                {signers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {s.order}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                      <p className="text-[11px] text-slate-400">{s.role}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Fluxo pronto para integração com <strong>API ICP-Brasil</strong> no backend.
                No momento, utiliza simulação local + trilha de eventos encadeada por hash.
              </p>
            </div>

            <button
              onClick={startFlow}
              disabled={flow === 'creating' || flow === 'starting'}
              className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Pen size={18} /> {flow === 'creating' || flow === 'starting' ? 'Preparando...' : 'Iniciar Processo de Assinatura'}
            </button>
          </div>
        )}

        {/* STEP SIGNING */}
        {step === 'signing' && (
          <div className="p-6 space-y-5">
            {/* Progresso */}
            <div className="flex items-center gap-2">
              {signers.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className={cx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                    s.status === 'signed' ? 'bg-green-100 text-green-700' :
                      i === activeSignerIdx ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-400'
                  )}>
                    {s.status === 'signed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {s.order}. {s.name.split(' ')[0]}
                  </div>
                  {i < signers.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
                </React.Fragment>
              ))}
            </div>

            {/* Assinante atual */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-500 uppercase font-bold mb-1">Assinando agora</p>
              <p className="font-bold text-blue-900">{signerNow?.name}</p>
              <p className="text-sm text-blue-600">{signerNow?.role}</p>
            </div>

            {/* Assinatura Eletrônica */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-2">
                <Shield size={14} className="text-blue-700" /> Assinatura Eletrônica (pronta p/ ICP via backend)
              </p>
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Identificação</p>
                <div className="mt-2 text-2xl leading-none text-slate-800 select-none" style={{ fontFamily: 'cursive' }}>
                  {currentUser?.name || signerNow?.name}
                </div>
                <p className="text-xs text-slate-500 mt-2">{currentUser?.email || signerNow?.email}</p>
                <p className="text-[11px] text-slate-400 mt-1">{signerNow?.role}</p>
                <div className="mt-4 h-px bg-slate-200 w-2/3 mx-auto" />
                <p className="text-[11px] text-slate-400 mt-3">
                  Ao integrar o backend, este passo chamará a API ICP-Brasil e retornará o PDF assinado.
                </p>
              </div>
            </div>

            {/* PIN */}
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                <Lock size={12} /> PIN de Confirmação (mín. 4 dígitos)
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                placeholder="••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
            </div>

            <button
              onClick={handleSign}
              disabled={flow === 'requesting'}
              className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {flow === 'requesting'
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Solicitando...</>
                : <><Shield size={18} /> Assinar (Mock agora / ICP no backend)</>
              }
            </button>

            {/* Trilha de Eventos */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 uppercase mb-3">
                Trilha de Eventos (Audit Trail)
              </p>
              {events.length === 0 ? (
                <p className="text-xs text-slate-400">Sem eventos ainda.</p>
              ) : (
                <div className="space-y-2">
                  {events.slice().reverse().map(ev => (
                    <div
                      key={ev.id}
                      className={cx(
                        'bg-white border rounded-xl p-3',
                        ev.type === 'ERROR' ? 'border-red-200' : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className={cx('text-xs font-bold', ev.type === 'ERROR' ? 'text-red-700' : 'text-slate-700')}>
                          {EventTypeLabel[ev.type] ?? ev.type}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDate(ev.timestamp)}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {ev.actorName ? `Ator: ${ev.actorName} • ` : ''}
                        Hash: <span className="font-mono">{ev.eventHash.slice(0, 18)}...</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP COMPLETE */}
        {step === 'complete' && record && (
          <div className="p-6 space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Fluxo Concluído!</h3>
              <p className="text-sm text-slate-500 mt-1">Assinaturas coletadas (mock) — pronto para ICP no backend.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-400 uppercase font-bold mb-2">Hash do Documento</p>
              <p className="text-xs font-mono text-slate-700 break-all">{record.documentHash}</p>
            </div>

            <button
              onClick={download}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} /> Baixar Arquivo Assinado (Mock)
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignatureModal;
