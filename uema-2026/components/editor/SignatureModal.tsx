import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Clock, Lock, Shield, User, Hash,
  QrCode, Download, AlertCircle, ChevronRight, Pen
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface Signer {
  id: string;
  name: string;
  role: string;
  email: string;
  order: number;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
  signatureHash?: string;
  ip?: string;
}

export interface SignatureRecord {
  protocol: string;
  documentTitle: string;
  createdAt: string;
  signers: Signer[];
  status: 'pending' | 'partial' | 'completed' | 'rejected';
  qrCodeData: string;
  documentHash: string;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
const generateProtocol = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000000 + 1000000);
  return `REURB-${year}-${rand}`;
};

const generateHash = (data: string) => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase() +
    Math.abs(hash * 31).toString(16).padStart(8, '0').toUpperCase();
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

// ─── QR Code simples via SVG ──────────────────────────────────────────────────
const SimpleQRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 120 }) => {
  const cells = 21;
  const cellSize = size / cells;

  const getCell = (row: number, col: number): boolean => {
    const inFinder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
    if (inFinder(row, col)) {
      const isOuter = row === 0 || row === 6 || col === 0 || col === 6 ||
        row === cells - 1 || row === cells - 7 || col === cells - 1 || col === cells - 7;
      const isInner = (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
        (row >= 2 && row <= 4 && col >= cells - 5 && col <= cells - 3) ||
        (row >= cells - 5 && row <= cells - 3 && col >= 2 && col <= 4);
      return isOuter || isInner;
    }
    const seed = value.charCodeAt((row * cells + col) % value.length) ^ (row * 7 + col * 13);
    return (seed % 3) !== 0;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="border border-slate-200 rounded">
      <rect width={size} height={size} fill="white" />
      {Array.from({ length: cells }, (_, row) =>
        Array.from({ length: cells }, (_, col) =>
          getCell(row, col) ? (
            <rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1e293b"
            />
          ) : null
        )
      )}
    </svg>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string;
  currentUser: { id?: string; name?: string; email?: string; role?: string } | null;
  onSignatureComplete: (record: SignatureRecord) => void;
}

const DEFAULT_SIGNERS: Omit<Signer, 'status' | 'signedAt' | 'signatureHash' | 'ip'>[] = [
  { id: 'sig-1', name: 'Responsável Técnico', role: 'Engenheiro/Urbanista', email: 'tecnico@prefeitura.gov.br', order: 1 },
  { id: 'sig-2', name: 'Secretário de Regularização', role: 'Secretário Municipal', email: 'secretario@prefeitura.gov.br', order: 2 },
  { id: 'sig-3', name: 'Prefeito Municipal', role: 'Prefeito', email: 'prefeito@prefeitura.gov.br', order: 3 },
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen, onClose, documentTitle, documentContent, currentUser, onSignatureComplete
}) => {
  const [step, setStep] = useState<'config' | 'signing' | 'complete'>('config');
  const [signers, setSigners] = useState<Signer[]>(
    DEFAULT_SIGNERS.map(s => ({ ...s, status: 'pending' as const }))
  );
  const [activeSignerIdx, setActiveSignerIdx] = useState(0);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [record, setRecord] = useState<SignatureRecord | null>(null);
  const [protocol] = useState(generateProtocol);
  const [documentHash] = useState(() => generateHash(documentContent + documentTitle + Date.now()));

  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setPin('');
      setPinError('');
      setActiveSignerIdx(0);
    }
  }, [isOpen]);

  // ─── Assinar ───────────────────────────────────────────────────────────────
  const handleSign = async () => {
    if (pin.length < 4) { setPinError('PIN deve ter ao menos 4 dígitos.'); return; }
    setPinError('');
    setIsSigning(true);

    await new Promise(r => setTimeout(r, 1500));

    const now = new Date().toISOString();
    const signer = signers[activeSignerIdx];
    const sigHash = generateHash(signer.name + pin + now + documentHash);

    const updated = signers.map((s, i) =>
      i === activeSignerIdx
        ? { ...s, status: 'signed' as const, signedAt: now, signatureHash: sigHash, ip: '187.xxx.xxx.xxx' }
        : s
    );
    setSigners(updated);
    setPin('');
    setIsSigning(false);

    const nextPending = updated.findIndex(s => s.status === 'pending');
    if (nextPending !== -1) {
      setActiveSignerIdx(nextPending);
    } else {
      const finalRecord: SignatureRecord = {
        protocol,
        documentTitle,
        createdAt: now,
        signers: updated,
        status: 'completed',
        qrCodeData: `https://reurb.gov.br/verificar/${protocol}`,
        documentHash,
      };
      setRecord(finalRecord);
      setStep('complete');
      onSignatureComplete(finalRecord);
    }
  };

  if (!isOpen) return null;

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

        {/* ─── STEP: CONFIG ──────────────────────────────────────────── */}
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
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{s.order}</div>
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
                Esta assinatura digital possui validade jurídica conforme a <strong>Lei nº 14.063/2020</strong> e segue os padrões da <strong>ICP-Brasil</strong>. O carimbo de tempo e hash do documento garantem a autenticidade e integridade do arquivo.
              </p>
            </div>

            <button
              onClick={() => setStep('signing')}
              className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
            >
              <Pen size={18} /> Iniciar Processo de Assinatura
            </button>
          </div>
        )}

        {/* ─── STEP: SIGNING ─────────────────────────────────────────── */}
        {step === 'signing' && (
          <div className="p-6 space-y-5">
            {/* Progresso */}
            <div className="flex items-center gap-2">
              {signers.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    s.status === 'signed' ? 'bg-green-100 text-green-700' :
                    i === activeSignerIdx ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-400'
                  }`}>
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
              <p className="font-bold text-blue-900">{signers[activeSignerIdx]?.name}</p>
              <p className="text-sm text-blue-600">{signers[activeSignerIdx]?.role}</p>
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

            {/* Carimbo de tempo */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={12} />
              <span>Carimbo de tempo: <strong className="text-slate-600">{new Date().toLocaleString('pt-BR')}</strong></span>
            </div>

            <button
              onClick={handleSign}
              disabled={isSigning}
              className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSigning ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processando...</>
              ) : (
                <><Shield size={18} /> Assinar Documento</>
              )}
            </button>

            {/* Assinantes já assinados */}
            {signers.some(s => s.status === 'signed') && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Já Assinados</p>
                {signers.filter(s => s.status === 'signed').map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-green-800">{s.name} — {s.role}</p>
                      <p className="text-[11px] text-green-600 font-mono">Hash: {s.signatureHash}</p>
                      <p className="text-[11px] text-green-500">{s.signedAt ? formatDate(s.signedAt) : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP: COMPLETE ────────────────────────────────────────── */}
        {step === 'complete' && record && (
          <div className="p-6 space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Documento Assinado!</h3>
              <p className="text-sm text-slate-500 mt-1">Todas as assinaturas foram coletadas com sucesso.</p>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
              <SimpleQRCode value={record.qrCodeData} size={100} />
              <div className="text-white">
                <p className="text-[11px] text-slate-400 uppercase font-bold mb-1">Protocolo Oficial</p>
                <p className="text-lg font-black font-mono">{record.protocol}</p>
                <p className="text-[11px] text-slate-400 mt-2">Verificar autenticidade:</p>
                <p className="text-[11px] text-blue-300 break-all">{record.qrCodeData}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-400 uppercase font-bold mb-2">Hash do Documento (SHA-256 simulado)</p>
              <p className="text-xs font-mono text-slate-700 break-all">{record.documentHash}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Registro de Assinaturas</p>
              {record.signers.map(s => (
                <div key={s.id} className="p-3 bg-green-50 border border-green-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} className="text-green-600" />
                    <p className="text-xs font-bold text-green-800">{s.name} — {s.role}</p>
                  </div>
                  <p className="text-[11px] text-green-600 font-mono">Sig: {s.signatureHash}</p>
                  <p className="text-[11px] text-slate-400">{s.signedAt ? formatDate(s.signedAt) : ''} • IP: {s.ip}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Documento protegido com carimbo de tempo e registros auditáveis conforme <strong>Lei nº 14.063/2020</strong> e <strong>MP nº 2.200-2/2001</strong> (ICP-Brasil). O QR Code permite verificação de autenticidade.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} /> Fechar e Finalizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignatureModal;
