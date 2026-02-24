
import { REURBProcess, ProcessStatus, User, DocumentModel } from './types';

export const CURRENT_USER: User = {
  id: 'u-1',
  name: 'Dr. Ricardo Silva',
  role: 'Jurídico',
  email: 'ricardo.juridico@prefeitura.gov.br',
  avatar: 'https://picsum.photos/seed/ricardo/200'
};

export const MOCK_PROCESSES: REURBProcess[] = [
  {
    id: 'PR-2024-001',
    title: 'Núcleo Habitacional Esperança',
    applicant: 'Associação de Moradores Vila Verde',
    modality: 'REURB-S',
    status: ProcessStatus.LEVANTAMENTO,
    createdAt: '2024-01-15',
    updatedAt: '2024-05-10',
    technicianId: 'u-2',
    legalId: 'u-1',
    area: '15.400 m²',
    progress: 35
  },
  {
    id: 'PR-2024-005',
    title: 'Loteamento Jardim Aurora',
    applicant: 'Imobiliária Horizonte Ltda',
    modality: 'REURB-E',
    status: ProcessStatus.ANALISE_JURIDICA,
    createdAt: '2024-02-20',
    updatedAt: '2024-05-12',
    technicianId: 'u-2',
    legalId: 'u-1',
    area: '8.200 m²',
    progress: 60
  },
  {
    id: 'PR-2023-089',
    title: 'Comunidade Santa Luzia',
    applicant: 'Secretaria de Habitação',
    modality: 'REURB-S',
    status: ProcessStatus.FINALIZADO,
    createdAt: '2023-08-05',
    updatedAt: '2024-04-30',
    technicianId: 'u-3',
    legalId: 'u-4',
    area: '42.000 m²',
    progress: 100
  }
];

export const MOCK_MODELS: DocumentModel[] = [
  { id: 'm1', name: 'Portaria de Instauração', type: 'Administrativo', version: '2.1', lastUpdated: '2024-01-10' },
  { id: 'm2', name: 'Notificação de Confrontantes', type: 'Notificação', version: '1.5', lastUpdated: '2023-11-22' },
  { id: 'm3', name: 'Relatório Técnico Social', type: 'Técnico', version: '3.0', lastUpdated: '2024-02-15' },
  { id: 'm4', name: 'Auto de Demarcação Urbanística', type: 'Técnico', version: '1.2', lastUpdated: '2024-03-01' },
  { id: 'm5', name: 'Título de Legitimação Fundiária', type: 'Títularidade', version: '4.2', lastUpdated: '2024-05-05' },
];
