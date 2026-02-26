// ─── Tipos de Usuário ─────────────────────────────────────────────────────────

export type TipoProfissional =
  | 'Advogado'
  | 'Engenheiro'
  | 'Arquiteto'
  | 'Topógrafo'
  | 'Assistente Social'
  | 'Geólogo'
  | 'Cidadão'
  | 'Terceirizado'
  | 'Representante'
  | 'Outro';

export type UserRole = 'Admin' | 'Técnico' | 'Jurídico' | 'Atendente' | 'Gestor' | 'Auditor';

export interface FlagsAcesso {
  superusuario: boolean;
  adminMunicipio: boolean;
  profissionalInterno: boolean;
  usuarioExterno: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  tipoProfissional?: TipoProfissional;
  flags?: FlagsAcesso;
  etapasPermitidas?: number[];
  email: string;
  avatar?: string;
  password?: string;
  lastLogin?: string;
  status?: 'Online' | 'Offline';
  quota?: {
    limit: number;
    used: number;
    resetAt: string;
  };
}

// ─── Etapas do REURB ──────────────────────────────────────────────────────────

export type EixoEtapa = 'Técnico' | 'Jurídico' | 'Social' | 'Cartorial' | 'Geral';

export type EtapaStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'bloqueada'
  | 'cancelada';

export interface SubTarefa {
  id: string;
  descricao: string;
  concluida: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
}

export interface REURBEtapa {
  id: string;
  processId: string;
  numero: number;
  nome: string;
  eixo: EixoEtapa;
  status: EtapaStatus;
  responsavelId?: string;
  responsavelNome?: string;
  observacoes?: string;
  dataInicio?: string;
  dataConclusao?: string;
  dependeDe?: number[];
  subTarefas?: SubTarefa[];
}

// ─── As 14 Etapas Padrão ──────────────────────────────────────────────────────

export const ETAPAS_PADRAO: Omit<REURBEtapa, 'id' | 'processId' | 'status'>[] = [
  { numero: 1,  nome: 'Abertura / Protocolo',           eixo: 'Geral',      dependeDe: [] },
  { numero: 2,  nome: 'Diagnóstico Prévio',             eixo: 'Geral',      dependeDe: [1] },
  { numero: 3,  nome: 'Levantamento Topográfico',       eixo: 'Técnico',    dependeDe: [2] },
  { numero: 4,  nome: 'Classificação da Modalidade',    eixo: 'Jurídico',   dependeDe: [2] },
  { numero: 5,  nome: 'Buscas Dominiais',               eixo: 'Jurídico',   dependeDe: [4] },
  { numero: 6,  nome: 'Notificação dos Confrontantes',  eixo: 'Jurídico',   dependeDe: [5] },
  { numero: 7,  nome: 'Estudos Técnicos',               eixo: 'Técnico',    dependeDe: [3] },
  { numero: 8,  nome: 'Vetorização + Cadastro Social',  eixo: 'Social',     dependeDe: [7] },
  { numero: 9,  nome: 'Saneamento',                     eixo: 'Geral',      dependeDe: [6, 8] },
  { numero: 10, nome: 'Elaboração do PRF',              eixo: 'Técnico',    dependeDe: [9] },
  { numero: 11, nome: 'Aprovação do PRF',               eixo: 'Geral',      dependeDe: [10] },
  { numero: 12, nome: 'Emissão da CRF',                 eixo: 'Geral',      dependeDe: [11] },
  { numero: 13, nome: 'Registro em Cartório',           eixo: 'Cartorial',  dependeDe: [12] },
  { numero: 14, nome: 'Monitoramento Pós-REURB',        eixo: 'Geral',      dependeDe: [13] },
];

// ─── Processos ────────────────────────────────────────────────────────────────

export enum ProcessStatus {
  PENDENTE        = 'Pendente',
  EM_ANDAMENTO    = 'Em Andamento',
  INICIADO        = 'Iniciado',
  LEVANTAMENTO    = 'Levantamento Técnico',
  ANALISE_JURIDICA = 'Análise Jurídica',
  EDITAL          = 'Em Edital',
  DILIGENCIA      = 'Diligência',
  EM_ANALISE      = 'Em Análise',
  APROVADO        = 'Aprovado',
  CONCLUIDO       = 'Concluído',
  FINALIZADO      = 'Finalizado',
  CANCELADO       = 'Cancelado',
  ARQUIVADO       = 'Arquivado',
  INICIAL         = 'Inicial',
}

export interface REURBProcess {
  id: string;
  protocol?: string;
  protocolado: boolean;
  title: string;
  applicant: string;
  location?: string;
  type?: 'REURB-S' | 'REURB-E' | 'REURB-I' | 'REURB-S/E' | 'Usucapião';
  modality: 'REURB-S' | 'REURB-E';
  status: ProcessStatus;
  responsibleName?: string;
  createdAt: string;
  updatedAt: string;
  technicianId: string;
  legalId: string;
  area: string;
  progress: number;
}

// ─── Documentos ───────────────────────────────────────────────────────────────

export interface DocumentModel {
  id: string;
  name: string;
  type: string;
  version: string;
  lastUpdated: string;
}

export interface REURBDocument {
  id: string;
  processId: string;
  title: string;
  content: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Signed';
  authorId: string;
  version: number;
  updatedAt: string;
}

// ─── Comentários ──────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

// ─── Auditoria ────────────────────────────────────────────────────────────────

export type AcaoAuditoria =
  | 'login'
  | 'logout'
  | 'criacao'
  | 'edicao'
  | 'exclusao'
  | 'protocolo'
  | 'mudanca_status'
  | 'exportacao'
  | 'assinatura';

export interface LogAuditoria {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId: string;
  descricao: string;
  ip?: string;
  criadoEm: string;
}
