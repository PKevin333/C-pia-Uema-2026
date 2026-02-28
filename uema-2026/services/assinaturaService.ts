// src/services/assinaturaService.ts
// Camada de integração: HOJE (mock/localStorage) | AMANHÃ (backend ICP-Brasil)
// Troque as funções internas por chamadas HTTP quando o backend estiver pronto.

export type SignatureStatus = 'pending' | 'partial' | 'completed' | 'rejected';
export type SignerStatus = 'pending' | 'signed' | 'rejected';

export type EventType =
  | 'DOCUMENT_CREATED'
  | 'SIGN_FLOW_STARTED'
  | 'SIGNER_READY'
  | 'SIGN_REQUEST_SENT_TO_PROVIDER'
  | 'SIGNER_AUTH_STARTED'
  | 'SIGNER_AUTH_SUCCESS'
  | 'SIGNATURE_APPLIED'
  | 'SIGN_COMPLETED'
  | 'ERROR';

export interface Signer {
  id: string;
  name: string;
  role: string;
  email: string;
  order: number;
  status: SignerStatus;
  signedAt?: string;
  signatureHash?: string;
  ip?: string;
}

export interface SignatureEvent {
  id: string;
  protocol: string;
  type: EventType;
  timestamp: string;
  actorName?: string;
  ip?: string;
  userAgent?: string;
  documentHash: string;
  prevEventHash: string;
  eventHash: string;
  payload?: any;
}

export interface SignatureRecord {
  protocol: string;
  documentTitle: string;
  createdAt: string;
  status: SignatureStatus;
  documentHash: string;
  qrCodeData: string;
  signers: Signer[];
  events: SignatureEvent[];
}

export interface CreateSignatureInput {
  documentTitle: string;
  documentContent: string;
  signers: Omit<Signer, 'status' | 'signedAt' | 'signatureHash' | 'ip'>[];
  actor?: { name?: string; email?: string };
}

const STORAGE_KEY = 'reurb_signatures_v1';

// ─────────────────────────────────────────────────────────────────────────────
// Utils (hash/protocol/event-chain)
// ─────────────────────────────────────────────────────────────────────────────
const generateProtocol = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9_000_000 + 1_000_000);
  return `REURB-${year}-${rand}`;
};

const generateHash = (data: string) => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  const a = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const b = Math.abs(hash * 31).toString(16).padStart(8, '0').toUpperCase();
  return a + b;
};

const nowIso = () => new Date().toISOString();

const randomId = () =>
  (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const readAll = (): Record<string, SignatureRecord> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SignatureRecord>) : {};
  } catch {
    return {};
  }
};

const writeAll = (data: Record<string, SignatureRecord>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const computeEventHash = (base: any) => generateHash(JSON.stringify(base));

function appendEvent(record: SignatureRecord, event: Omit<SignatureEvent, 'id' | 'timestamp' | 'prevEventHash' | 'eventHash'>) {
  const timestamp = nowIso();
  const last = record.events[record.events.length - 1];
  const prevEventHash = last?.eventHash ?? 'GENESIS';

  const base = {
    prevEventHash,
    protocol: record.protocol,
    type: event.type,
    timestamp,
    actorName: event.actorName ?? null,
    ip: event.ip ?? null,
    userAgent: event.userAgent ?? null,
    documentHash: record.documentHash,
    payload: event.payload ?? null,
  };

  const eventHash = computeEventHash(base);

  const full: SignatureEvent = {
    id: randomId(),
    protocol: record.protocol,
    timestamp,
    documentHash: record.documentHash,
    prevEventHash,
    eventHash,
    ...event,
  };

  record.events.push(full);
}

function updateOverallStatus(signers: Signer[]): SignatureStatus {
  const signed = signers.filter(s => s.status === 'signed').length;
  const rejected = signers.some(s => s.status === 'rejected');
  if (rejected) return 'rejected';
  if (signed === 0) return 'pending';
  if (signed < signers.length) return 'partial';
  return 'completed';
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// API (mock/localStorage) — PRONTO PARA BACKEND
// ─────────────────────────────────────────────────────────────────────────────
export const assinaturaService = {
  /**
   * BACKEND (futuro):
   * POST /api/signatures
   */
  async createSignature(input: CreateSignatureInput): Promise<SignatureRecord> {
    const protocol = generateProtocol();
    const createdAt = nowIso();
    const documentHash = generateHash(`${input.documentTitle}|${input.documentContent}|${createdAt}`);

    const record: SignatureRecord = {
      protocol,
      documentTitle: input.documentTitle,
      createdAt,
      status: 'pending',
      documentHash,
      qrCodeData: `https://reurb.gov.br/verificar/${protocol}`,
      signers: input.signers
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(s => ({ ...s, status: 'pending' as const })),
      events: [],
    };

    appendEvent(record, {
      type: 'DOCUMENT_CREATED',
      actorName: input.actor?.name ?? 'Sistema',
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
      payload: { documentTitle: input.documentTitle },
    });

    const db = readAll();
    db[protocol] = record;
    writeAll(db);

    return record;
  },

  /**
   * BACKEND (futuro):
   * POST /api/signatures/:protocol/start
   */
  async startFlow(protocol: string, actorName = 'Sistema'): Promise<SignatureRecord> {
    const db = readAll();
    const record = db[protocol];
    if (!record) throw new Error('Protocolo não encontrado.');

    appendEvent(record, {
      type: 'SIGN_FLOW_STARTED',
      actorName,
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
    });

    appendEvent(record, {
      type: 'SIGNER_READY',
      actorName,
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
      payload: { nextSignerId: record.signers.find(s => s.status === 'pending')?.id },
    });

    db[protocol] = record;
    writeAll(db);
    return record;
  },

  /**
   * BACKEND (futuro):
   * POST /api/signatures/:protocol/signers/:signerId/request
   * - backend chamaria a API ICP-Brasil e retornaria jobId
   */
  async requestSignerSignature(protocol: string, signerId: string, pin: string, actorName?: string): Promise<SignatureRecord> {
    const db = readAll();
    const record = db[protocol];
    if (!record) throw new Error('Protocolo não encontrado.');

    const signer = record.signers.find(s => s.id === signerId);
    if (!signer) throw new Error('Assinante não encontrado.');

    // regra de ordem: só permite assinar o próximo pendente
    const nextPending = record.signers.find(s => s.status === 'pending');
    if (nextPending?.id !== signerId) {
      appendEvent(record, {
        type: 'ERROR',
        actorName: actorName ?? 'Sistema',
        ip: '187.xxx.xxx.xxx',
        userAgent: navigator.userAgent,
        payload: { message: 'Tentativa fora de ordem', signerId },
      });
      db[protocol] = record;
      writeAll(db);
      throw new Error('Assinatura fora da ordem definida.');
    }

    appendEvent(record, {
      type: 'SIGN_REQUEST_SENT_TO_PROVIDER',
      actorName: actorName ?? signer.name,
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
      payload: { signerId, provider: 'MOCK_ICP', jobId: `job_${randomId()}` },
    });

    appendEvent(record, {
      type: 'SIGNER_AUTH_STARTED',
      actorName: actorName ?? signer.name,
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
    });

    // simula “API ICP” e “assinatura aplicada”
    await sleep(900);

    appendEvent(record, {
      type: 'SIGNER_AUTH_SUCCESS',
      actorName: actorName ?? signer.name,
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
    });

    const signedAt = nowIso();
    const signatureHash = generateHash([
      record.protocol,
      record.documentHash,
      signer.id,
      signer.email,
      pin,
      signedAt,
    ].join('|'));

    signer.status = 'signed';
    signer.signedAt = signedAt;
    signer.signatureHash = signatureHash;
    signer.ip = '187.xxx.xxx.xxx';

    appendEvent(record, {
      type: 'SIGNATURE_APPLIED',
      actorName: actorName ?? signer.name,
      ip: '187.xxx.xxx.xxx',
      userAgent: navigator.userAgent,
      payload: { signerId, signatureHash },
    });

    record.status = updateOverallStatus(record.signers);

    if (record.status === 'completed') {
      appendEvent(record, {
        type: 'SIGN_COMPLETED',
        actorName: 'Sistema',
        ip: '187.xxx.xxx.xxx',
        userAgent: navigator.userAgent,
      });
    } else {
      appendEvent(record, {
        type: 'SIGNER_READY',
        actorName: 'Sistema',
        ip: '187.xxx.xxx.xxx',
        userAgent: navigator.userAgent,
        payload: { nextSignerId: record.signers.find(s => s.status === 'pending')?.id },
      });
    }

    db[protocol] = record;
    writeAll(db);
    return record;
  },

  /**
   * BACKEND (futuro):
   * GET /api/signatures/:protocol
   */
  async getSignature(protocol: string): Promise<SignatureRecord> {
    const db = readAll();
    const record = db[protocol];
    if (!record) throw new Error('Protocolo não encontrado.');
    return record;
  },

  /**
   * BACKEND (futuro):
   * GET /api/signatures/:protocol/events
   */
  async getEvents(protocol: string): Promise<SignatureEvent[]> {
    const record = await this.getSignature(protocol);
    return record.events;
  },

  /**
   * BACKEND (futuro):
   * GET /api/signatures/:protocol/file
   * - retornaria o PDF assinado
   */
  async downloadSignedFile(_protocol: string): Promise<Blob> {
    // mock: retorna um txt
    const content = `Arquivo assinado (mock). Integre com o backend para retornar PDF PAdES.`;
    return new Blob([content], { type: 'text/plain' });
  },
};
