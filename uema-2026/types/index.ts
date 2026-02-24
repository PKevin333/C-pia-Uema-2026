
export type UserRole = 'Admin' | 'Técnico' | 'Jurídico' | 'Atendente' | 'Gestor' | 'Auditor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
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

export enum ProcessStatus {
  INICIAL = 'Inicial',
  EM_ANALISE = 'Em Análise',
  DILIGENCIA = 'Diligência',
  APROVADO = 'Aprovado',
  CONCLUIDO = 'Concluído',
  ARQUIVADO = 'Arquivado',
  INICIADO = 'Iniciado',
  LEVANTAMENTO = 'Levantamento Técnico',
  ANALISE_JURIDICA = 'Análise Jurídica',
  EDITAL = 'Em Edital',
  FINALIZADO = 'Finalizado'
}

export interface REURBProcess {
  id: string;
  protocol?: string;
  title: string;
  applicant: string;
  location?: string;
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
