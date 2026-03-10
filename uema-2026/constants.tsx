import { REURBProcess, ProcessStatus, User, DocumentModel } from './types/index';

// ─── Usuário atual ────────────────────────────────────────────────────────────
// TODO (Backend): GET /api/auth/me → retorna o usuário autenticado via JWT
export const CURRENT_USER: User = {
  id: 'u-1',
  name: 'Dr. Ricardo Silva',
  role: 'Jurídico',
  email: 'ricardo.juridico@prefeitura.gov.br',
  avatar: 'https://picsum.photos/seed/ricardo/200'
};

// ─── Processos de exemplo ─────────────────────────────────────────────────────
// TODO (Backend): GET /api/processos → lista paginada de processos
export const MOCK_PROCESSES: REURBProcess[] = [
  {
    id: 'PR-2024-001',
    title: 'Núcleo Habitacional Esperança',
    applicant: 'Associação de Moradores Vila Verde',
    modality: 'REURB-S',
    status: ProcessStatus.LEVANTAMENTO,
    protocolado: false,
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
    protocolado: false,
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
    protocolado: true,
    createdAt: '2023-08-05',
    updatedAt: '2024-04-30',
    technicianId: 'u-3',
    legalId: 'u-4',
    area: '42.000 m²',
    progress: 100
  }
];

// ─── 14 Etapas padrão do REURB ───────────────────────────────────────────────
// Criadas automaticamente ao protocolar um processo (conforme Lei Federal 13.465/2017).
// Cada etapa tem: ordem, nome, eixo, status inicial e dependências.
// TODO (Backend): POST /api/processos/:id/protocolar → cria essas etapas no banco
export interface EtapaREURB {
  id: string;
  ordem: number;
  nome: string;
  eixo: 'Administrativo' | 'Técnico' | 'Jurídico' | 'Social' | 'Cartorial' | '—';
  status: 'em_andamento' | 'pendente' | 'concluida' | 'bloqueada' | 'cancelada';
  dependeDe: string[]; // IDs das etapas que precisam estar concluídas antes
  responsavelId?: string;
  dataInicio?: string;
  dataConclusao?: string;
  observacoes?: string;
}

export const ETAPAS_PADRAO: EtapaREURB[] = [
  {
    id: 'etapa-1',
    ordem: 1,
    nome: 'Abertura / Protocolo',
    eixo: 'Administrativo',
    status: 'em_andamento', // única que já inicia ativa ao protocolar
    dependeDe: [],
  },
  {
    id: 'etapa-2',
    ordem: 2,
    nome: 'Diagnóstico Prévio',
    eixo: '—',
    status: 'pendente',
    dependeDe: ['etapa-1'],
  },
  {
    id: 'etapa-3',
    ordem: 3,
    nome: 'Levantamento Topográfico',
    eixo: 'Técnico',
    status: 'pendente',
    dependeDe: ['etapa-2'],
  },
  {
    id: 'etapa-4',
    ordem: 4,
    nome: 'Classificação da Modalidade',
    eixo: 'Jurídico',
    status: 'pendente',
    dependeDe: ['etapa-2'],
  },
  {
    id: 'etapa-5',
    ordem: 5,
    nome: 'Buscas Dominiais',
    eixo: 'Jurídico',
    status: 'pendente',
    dependeDe: ['etapa-4'],
  },
  {
    id: 'etapa-6',
    ordem: 6,
    nome: 'Notificação dos Confrontantes',
    eixo: 'Jurídico',
    status: 'pendente',
    dependeDe: ['etapa-3'],
  },
  {
    id: 'etapa-7',
    ordem: 7,
    nome: 'Estudos Técnicos',
    eixo: 'Técnico',
    status: 'pendente',
    dependeDe: ['etapa-3'],
  },
  {
    id: 'etapa-8',
    ordem: 8,
    nome: 'Vetorização + Cadastro Social',
    eixo: 'Social',
    status: 'pendente',
    dependeDe: ['etapa-7'],
  },
  {
    id: 'etapa-9',
    ordem: 9,
    nome: 'Saneamento',
    eixo: '—',
    status: 'pendente',
    dependeDe: ['etapa-5', 'etapa-6', 'etapa-8'],
  },
  {
    id: 'etapa-10',
    ordem: 10,
    nome: 'Elaboração do PRF',
    eixo: 'Técnico',
    status: 'pendente',
    dependeDe: ['etapa-9'],
  },
  {
    id: 'etapa-11',
    ordem: 11,
    nome: 'Aprovação do PRF',
    eixo: 'Administrativo',
    status: 'pendente',
    dependeDe: ['etapa-10'],
  },
  {
    id: 'etapa-12',
    ordem: 12,
    nome: 'Emissão da CRF',
    eixo: 'Jurídico',
    status: 'pendente',
    dependeDe: ['etapa-11'],
  },
  {
    id: 'etapa-13',
    ordem: 13,
    nome: 'Registro em Cartório',
    eixo: 'Cartorial',
    status: 'pendente',
    dependeDe: ['etapa-12'],
  },
  {
    id: 'etapa-14',
    ordem: 14,
    nome: 'Monitoramento Pós-REURB',
    eixo: 'Administrativo',
    status: 'pendente',
    dependeDe: ['etapa-13'],
  },
];

// ─── Função auxiliar: cria etapas para um processo específico ────────────────
// Gera novas instâncias das etapas padrão com IDs únicos por processo.
// TODO (Backend): essa lógica migra para o servidor ao protocolar o processo.
export const criarEtapasProcesso = (processoId: string): EtapaREURB[] => {
  return ETAPAS_PADRAO.map(etapa => ({
    ...etapa,
    id: `${processoId}-${etapa.id}`,
    dependeDe: etapa.dependeDe.map(dep => `${processoId}-${dep}`),
  }));
};

// ─── Função auxiliar: verifica se uma etapa pode ser iniciada ─────────────────
// Retorna true se todas as dependências estiverem concluídas.
export const podeIniciarEtapa = (
  etapa: EtapaREURB,
  todasEtapas: EtapaREURB[]
): boolean => {
  if (etapa.dependeDe.length === 0) return true;
  return etapa.dependeDe.every(depId => {
    const dep = todasEtapas.find(e => e.id === depId);
    return dep?.status === 'concluida';
  });
};

// ─── Conteúdo HTML dos modelos ────────────────────────────────────────────────
// Variáveis dinâmicas: {{protocolo}}, {{requerente}}, {{titulo}},
// {{localizacao}}, {{area}}, {{modalidade}}, {{responsavel}},
// {{municipio}}, {{dataAtual}}, {{dataExtenso}}, {{ano}}
// São substituídas automaticamente pelos dados do processo ao abrir o editor.
// TODO (Backend): conteúdo virá do banco — GET /api/modelos/:id/conteudo

const CONTEUDO_MODELOS: Record<string, string> = {

  // ── Portaria de Instauração ────────────────────────────────────────────────
  m1: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">PORTARIA DE INSTAURAÇÃO Nº ___/{{ano}}</h1>
<p style="text-align:center;font-size:11pt;margin-top:4px;">REGULARIZAÇÃO FUNDIÁRIA URBANA — REURB</p>
<br/>
<p style="text-align:justify;">O <strong>SECRETÁRIO MUNICIPAL DE REGULARIZAÇÃO FUNDIÁRIA</strong>, no uso das atribuições que lhe conferem a Lei Orgânica do Município e a <strong>Lei Federal nº 13.465, de 11 de julho de 2017</strong>, e considerando:</p>
<br/>
<p style="text-align:justify;">I — A solicitação formulada por <strong>{{requerente}}</strong>, referente ao núcleo urbano informal denominado <strong>{{titulo}}</strong>, localizado em {{localizacao}};</p>
<p style="text-align:justify;">II — A necessidade de regularização fundiária da área de aproximadamente <strong>{{area}}</strong>, visando garantir o direito à moradia digna às famílias beneficiárias;</p>
<p style="text-align:justify;">III — O disposto nos artigos 9º e 12º da Lei Federal nº 13.465/2017 que estabelecem os requisitos para instauração do processo de REURB;</p>
<br/>
<p style="text-align:center;font-weight:bold;text-transform:uppercase;">RESOLVE:</p>
<br/>
<p style="text-align:justify;"><strong>Art. 1º</strong> — Instaurar o processo de <strong>Regularização Fundiária Urbana ({{modalidade}})</strong> referente ao núcleo urbano informal <strong>{{titulo}}</strong>, sob protocolo nº <strong>{{protocolo}}</strong>.</p>
<p style="text-align:justify;"><strong>Art. 2º</strong> — Designar equipe técnica multidisciplinar composta por profissionais das áreas jurídica, urbanística e social para condução do processo.</p>
<p style="text-align:justify;"><strong>Art. 3º</strong> — Determinar a notificação dos confrontantes e demais interessados, nos termos do art. 15 da Lei Federal nº 13.465/2017.</p>
<p style="text-align:justify;"><strong>Art. 4º</strong> — Esta Portaria entra em vigor na data de sua publicação.</p>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/><br/>
<table style="width:100%;border-collapse:collapse;margin-top:40px;">
  <tr>
    <td style="width:50%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>SECRETÁRIO MUNICIPAL</strong></p>
      <p>Regularização Fundiária</p>
    </td>
    <td style="width:50%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>RESPONSÁVEL TÉCNICO</strong></p>
      <p>{{responsavel}}</p>
    </td>
  </tr>
</table>`,

  // ── Notificação de Confrontantes ───────────────────────────────────────────
  m2: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">NOTIFICAÇÃO DE CONFRONTANTES</h1>
<p style="text-align:center;font-size:11pt;">Processo REURB nº {{protocolo}}</p>
<br/>
<p style="text-align:justify;">A <strong>SECRETARIA MUNICIPAL DE REGULARIZAÇÃO FUNDIÁRIA</strong>, nos termos do <strong>art. 15 da Lei Federal nº 13.465/2017</strong>, NOTIFICA Vossa Senhoria acerca do processo de Regularização Fundiária Urbana em tramitação neste município.</p>
<br/>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr style="background:#e2e8f0;">
    <th style="border:1px solid #999;padding:8px;text-align:left;" colspan="2">DADOS DO PROCESSO</th>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:40%;">Protocolo</td>
    <td style="border:1px solid #999;padding:8px;">{{protocolo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Núcleo Urbano</td>
    <td style="border:1px solid #999;padding:8px;">{{titulo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Requerente</td>
    <td style="border:1px solid #999;padding:8px;">{{requerente}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Localização</td>
    <td style="border:1px solid #999;padding:8px;">{{localizacao}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Modalidade</td>
    <td style="border:1px solid #999;padding:8px;">{{modalidade}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Área Total</td>
    <td style="border:1px solid #999;padding:8px;">{{area}}</td>
  </tr>
</table>
<p style="text-align:justify;">Fica V.Sª <strong>NOTIFICADO(A)</strong> de que o imóvel confrontante de sua propriedade está inserido na área objeto do referido processo de regularização fundiária.</p>
<p style="text-align:justify;">É assegurado ao confrontante o prazo de <strong>30 (trinta) dias corridos</strong>, a contar do recebimento desta notificação, para apresentar impugnação fundamentada ao processo, conforme faculta o art. 15, §2º da Lei nº 13.465/2017.</p>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<p style="text-align:center;">_________________________________</p>
<p style="text-align:center;"><strong>SECRETÁRIO MUNICIPAL DE REGULARIZAÇÃO FUNDIÁRIA</strong></p>
<br/>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-top:20px;">
  <tr style="background:#e2e8f0;">
    <th style="border:1px solid #999;padding:8px;" colspan="2">ACUSE DE RECEBIMENTO</th>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Nome do Notificado:</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">CPF/CNPJ:</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Data de Recebimento:</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Assinatura:</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
  </tr>
</table>`,

  // ── Relatório Técnico Social ───────────────────────────────────────────────
  m3: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">RELATÓRIO TÉCNICO SOCIAL</h1>
<p style="text-align:center;font-size:11pt;">Processo REURB nº {{protocolo}} — {{titulo}}</p>
<br/>
<h2 style="font-size:12pt;font-weight:bold;">1. IDENTIFICAÇÃO DO NÚCLEO URBANO</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:35%;background:#f1f5f9;">Denominação</td>
    <td style="border:1px solid #999;padding:8px;">{{titulo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Requerente</td>
    <td style="border:1px solid #999;padding:8px;">{{requerente}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Localização</td>
    <td style="border:1px solid #999;padding:8px;">{{localizacao}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Área Total Estimada</td>
    <td style="border:1px solid #999;padding:8px;">{{area}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Modalidade REURB</td>
    <td style="border:1px solid #999;padding:8px;">{{modalidade}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Data do Levantamento</td>
    <td style="border:1px solid #999;padding:8px;">{{dataAtual}}</td>
  </tr>
</table>
<h2 style="font-size:12pt;font-weight:bold;">2. PERFIL SOCIOECONÔMICO</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin:12px 0;">
  <tr style="background:#e2e8f0;">
    <th style="border:1px solid #999;padding:8px;text-align:center;">Indicador</th>
    <th style="border:1px solid #999;padding:8px;text-align:center;">Quantidade</th>
    <th style="border:1px solid #999;padding:8px;text-align:center;">Percentual</th>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Total de famílias cadastradas</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">100%</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Renda até 1 salário mínimo</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Beneficiários de programas sociais</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">Mulheres chefes de família</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;text-align:center;">&nbsp;</td>
  </tr>
</table>
<h2 style="font-size:12pt;font-weight:bold;">3. CONDIÇÕES DE HABITABILIDADE</h2>
<p style="text-align:justify;">Descreva as condições de infraestrutura, saneamento básico, acesso a serviços públicos e estado das edificações encontradas no núcleo urbano.</p>
<p>&nbsp;</p><p>&nbsp;</p>
<h2 style="font-size:12pt;font-weight:bold;">4. CONCLUSÃO E RECOMENDAÇÕES</h2>
<p style="text-align:justify;">Com base no levantamento realizado, a equipe técnica social conclui que o núcleo urbano <strong>{{titulo}}</strong> preenche os requisitos para enquadramento na modalidade <strong>{{modalidade}}</strong>, conforme os critérios estabelecidos pela Lei Federal nº 13.465/2017.</p>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<p style="text-align:center;">_________________________________</p>
<p style="text-align:center;"><strong>ASSISTENTE SOCIAL RESPONSÁVEL</strong></p>
<p style="text-align:center;">CRESS nº ___________</p>`,

  // ── Auto de Demarcação Urbanística ────────────────────────────────────────
  m4: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">AUTO DE DEMARCAÇÃO URBANÍSTICA</h1>
<p style="text-align:center;font-size:11pt;">Processo REURB nº {{protocolo}}</p>
<br/>
<p style="text-align:justify;">Aos <strong>{{dataExtenso}}</strong>, a <strong>SECRETARIA MUNICIPAL DE REGULARIZAÇÃO FUNDIÁRIA</strong>, nos termos do <strong>art. 19 da Lei Federal nº 13.465/2017</strong>, lavra o presente Auto de Demarcação Urbanística referente ao núcleo urbano informal a seguir identificado:</p>
<br/>
<h2 style="font-size:12pt;font-weight:bold;">1. IDENTIFICAÇÃO DA ÁREA</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:35%;background:#f1f5f9;">Denominação</td>
    <td style="border:1px solid #999;padding:8px;">{{titulo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Localização</td>
    <td style="border:1px solid #999;padding:8px;">{{localizacao}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Área Total</td>
    <td style="border:1px solid #999;padding:8px;">{{area}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Modalidade</td>
    <td style="border:1px solid #999;padding:8px;">{{modalidade}}</td>
  </tr>
</table>
<h2 style="font-size:12pt;font-weight:bold;">2. DESCRIÇÃO DO PERÍMETRO</h2>
<ul>
  <li><strong>Norte:</strong> confronta com ___________________________</li>
  <li><strong>Sul:</strong> confronta com ___________________________</li>
  <li><strong>Leste:</strong> confronta com ___________________________</li>
  <li><strong>Oeste:</strong> confronta com ___________________________</li>
</ul>
<h2 style="font-size:12pt;font-weight:bold;">3. MATRÍCULAS ATINGIDAS</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr style="background:#e2e8f0;">
    <th style="border:1px solid #999;padding:8px;text-align:center;">Matrícula</th>
    <th style="border:1px solid #999;padding:8px;text-align:center;">Cartório</th>
    <th style="border:1px solid #999;padding:8px;text-align:center;">Proprietário Registrado</th>
    <th style="border:1px solid #999;padding:8px;text-align:center;">Área Atingida</th>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
</table>
<p>Responsável Técnico: <strong>{{responsavel}}</strong></p>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<table style="width:100%;border-collapse:collapse;margin-top:20px;">
  <tr>
    <td style="width:50%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>SECRETÁRIO MUNICIPAL</strong></p>
    </td>
    <td style="width:50%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>RESPONSÁVEL TÉCNICO</strong></p>
      <p>{{responsavel}}</p>
    </td>
  </tr>
</table>`,

  // ── Título de Legitimação Fundiária ───────────────────────────────────────
  m5: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">TÍTULO DE LEGITIMAÇÃO FUNDIÁRIA</h1>
<p style="text-align:center;font-size:11pt;">Nº {{protocolo}} — {{modalidade}}</p>
<br/>
<p style="text-align:justify;">O <strong>MUNICÍPIO DE {{municipio}}</strong>, por meio da <strong>Secretaria Municipal de Regularização Fundiária</strong>, nos termos da <strong>Lei Federal nº 13.465/2017</strong>, CONCEDE o presente <strong>TÍTULO DE LEGITIMAÇÃO FUNDIÁRIA</strong> ao beneficiário abaixo qualificado:</p>
<br/>
<h2 style="font-size:12pt;font-weight:bold;">1. DADOS DO BENEFICIÁRIO</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:35%;background:#f1f5f9;">Nome Completo</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">CPF</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">RG / Órgão Emissor</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Estado Civil</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
</table>
<h2 style="font-size:12pt;font-weight:bold;">2. DADOS DO IMÓVEL</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:35%;background:#f1f5f9;">Núcleo Urbano</td>
    <td style="border:1px solid #999;padding:8px;">{{titulo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Endereço</td>
    <td style="border:1px solid #999;padding:8px;">{{localizacao}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Área do Lote</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Matrícula CRI</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
</table>
<h2 style="font-size:12pt;font-weight:bold;">3. CONDIÇÕES E RESTRIÇÕES</h2>
<ul>
  <li>O imóvel destina-se exclusivamente à moradia do beneficiário e sua família;</li>
  <li>É vedada a transferência do título pelo prazo de <strong>5 (cinco) anos</strong>, salvo nos casos previstos em lei;</li>
  <li>O beneficiário assume a responsabilidade pelo pagamento dos tributos incidentes sobre o imóvel.</li>
</ul>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<table style="width:100%;border-collapse:collapse;margin-top:30px;">
  <tr>
    <td style="width:33%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>PREFEITO(A) MUNICIPAL</strong></p>
    </td>
    <td style="width:33%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>SECRETÁRIO MUNICIPAL</strong></p>
    </td>
    <td style="width:33%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>BENEFICIÁRIO(A)</strong></p>
    </td>
  </tr>
</table>`,

  // ── Edital de Convocação Pública ──────────────────────────────────────────
  m6: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">EDITAL DE CONVOCAÇÃO PÚBLICA</h1>
<p style="text-align:center;font-size:11pt;">REURB nº {{protocolo}}</p>
<br/>
<p style="text-align:justify;">A <strong>PREFEITURA MUNICIPAL DE {{municipio}}</strong>, nos termos do <strong>art. 15, §2º da Lei Federal nº 13.465/2017</strong>, torna público que se encontra em tramitação o processo de Regularização Fundiária Urbana do núcleo urbano denominado <strong>{{titulo}}</strong>, localizado em {{localizacao}}.</p>
<br/>
<p style="text-align:justify;"><strong>FICAM CONVOCADOS</strong> todos os proprietários, titulares de domínio, confrontantes e demais interessados a se manifestarem no prazo de <strong>30 (trinta) dias</strong> corridos, contados da publicação deste edital.</p>
<br/>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr style="background:#e2e8f0;">
    <th style="border:1px solid #999;padding:8px;text-align:left;" colspan="2">DADOS DO PROCESSO</th>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:40%;">Protocolo</td>
    <td style="border:1px solid #999;padding:8px;">{{protocolo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Núcleo Urbano</td>
    <td style="border:1px solid #999;padding:8px;">{{titulo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Área Aproximada</td>
    <td style="border:1px solid #999;padding:8px;">{{area}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;">Modalidade</td>
    <td style="border:1px solid #999;padding:8px;">{{modalidade}}</td>
  </tr>
</table>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<p style="text-align:center;">_________________________________</p>
<p style="text-align:center;"><strong>SECRETÁRIO MUNICIPAL DE REGULARIZAÇÃO FUNDIÁRIA</strong></p>`,

  // ── Certidão de Regularização Fundiária (CRF) ─────────────────────────────
  m11: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">CERTIDÃO DE REGULARIZAÇÃO FUNDIÁRIA — CRF</h1>
<p style="text-align:center;font-size:11pt;">Nº {{protocolo}}</p>
<br/>
<p style="text-align:justify;">A <strong>SECRETARIA MUNICIPAL DE REGULARIZAÇÃO FUNDIÁRIA</strong> do Município de <strong>{{municipio}}</strong>, com fundamento no <strong>art. 41 da Lei Federal nº 13.465/2017</strong>, CERTIFICA que o processo de Regularização Fundiária Urbana do núcleo urbano abaixo identificado foi concluído com êxito, atendendo a todos os requisitos legais.</p>
<br/>
<table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:16px;">
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;width:40%;background:#f1f5f9;">Denominação</td>
    <td style="border:1px solid #999;padding:8px;">{{titulo}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Requerente</td>
    <td style="border:1px solid #999;padding:8px;">{{requerente}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Localização</td>
    <td style="border:1px solid #999;padding:8px;">{{localizacao}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Área Regularizada</td>
    <td style="border:1px solid #999;padding:8px;">{{area}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Modalidade</td>
    <td style="border:1px solid #999;padding:8px;">{{modalidade}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Data de Conclusão</td>
    <td style="border:1px solid #999;padding:8px;">{{dataAtual}}</td>
  </tr>
  <tr>
    <td style="border:1px solid #999;padding:8px;font-weight:bold;background:#f1f5f9;">Nº de Famílias Beneficiadas</td>
    <td style="border:1px solid #999;padding:8px;">&nbsp;</td>
  </tr>
</table>
<p style="text-align:justify;">A presente CRF deverá ser levada a registro no Cartório de Registro de Imóveis competente, nos termos do art. 44 da Lei Federal nº 13.465/2017.</p>
<br/>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<table style="width:100%;border-collapse:collapse;margin-top:30px;">
  <tr>
    <td style="width:50%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>PREFEITO(A) MUNICIPAL</strong></p>
    </td>
    <td style="width:50%;text-align:center;padding:8px;">
      <p>_________________________________</p>
      <p><strong>SECRETÁRIO MUNICIPAL</strong></p>
      <p>Regularização Fundiária</p>
    </td>
  </tr>
</table>`,

  // ── Requerimento de Instauração ───────────────────────────────────────────
  m12: `
<h1 style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;">REQUERIMENTO DE INSTAURAÇÃO DE REURB</h1>
<p style="text-align:center;font-size:11pt;">Art. 14 da Lei Federal nº 13.465/2017</p>
<br/>
<p style="text-align:justify;"><strong>{{requerente}}</strong>, vem requerer a <strong>INSTAURAÇÃO DO PROCESSO DE REGULARIZAÇÃO FUNDIÁRIA URBANA ({{modalidade}})</strong>, com fundamento nos arts. 13 e 14 da Lei Federal nº 13.465/2017.</p>
<br/>
<h2 style="font-size:12pt;font-weight:bold;">I — DOS FATOS</h2>
<p style="text-align:justify;">O núcleo urbano informal denominado <strong>{{titulo}}</strong>, localizado em <strong>{{localizacao}}</strong>, com área aproximada de <strong>{{area}}</strong>, encontra-se consolidado há mais de [___] anos, sendo habitado por [___] famílias sem título formal de propriedade.</p>
<br/>
<h2 style="font-size:12pt;font-weight:bold;">II — DOS PEDIDOS</h2>
<ul>
  <li>A instauração do processo de REURB na modalidade <strong>{{modalidade}}</strong>;</li>
  <li>A designação de equipe técnica multidisciplinar para condução do processo;</li>
  <li>A notificação dos confrontantes conforme art. 15 da Lei nº 13.465/2017.</li>
</ul>
<br/>
<h2 style="font-size:12pt;font-weight:bold;">III — DOCUMENTOS ANEXADOS</h2>
<ul>
  <li>[ ] Planta de situação da área</li>
  <li>[ ] Memorial descritivo do perímetro</li>
  <li>[ ] Relação de ocupantes com identificação</li>
  <li>[ ] Documento comprobatório da legitimidade do requerente</li>
</ul>
<br/>
<p style="text-align:right;">Nestes termos, pede deferimento.</p>
<p style="text-align:center;">{{municipio}}, {{dataExtenso}}</p>
<br/>
<p style="text-align:center;">_________________________________</p>
<p style="text-align:center;"><strong>{{requerente}}</strong></p>`,
};

// ─── Lista de modelos exibida na Biblioteca ───────────────────────────────────
// TODO (Backend): GET /api/modelos → substitui este array
export const MOCK_MODELS: DocumentModel[] = [
  { id: 'm1',  name: 'Portaria de Instauração',          type: 'Administrativo', version: '2.1', lastUpdated: '2024-01-10' },
  { id: 'm6',  name: 'Edital de Convocação Pública',      type: 'Administrativo', version: '1.0', lastUpdated: '2024-06-01' },
  { id: 'm2',  name: 'Notificação de Confrontantes',      type: 'Notificação',    version: '1.5', lastUpdated: '2023-11-22' },
  { id: 'm3',  name: 'Relatório Técnico Social',          type: 'Técnico',        version: '3.0', lastUpdated: '2024-02-15' },
  { id: 'm4',  name: 'Auto de Demarcação Urbanística',    type: 'Técnico',        version: '1.2', lastUpdated: '2024-03-01' },
  { id: 'm5',  name: 'Título de Legitimação Fundiária',   type: 'Titularidade',   version: '4.2', lastUpdated: '2024-05-05' },
  { id: 'm11', name: 'Certidão de Regularização (CRF)',   type: 'Jurídico',       version: '3.1', lastUpdated: '2024-06-10' },
  { id: 'm12', name: 'Requerimento de Instauração REURB', type: 'Jurídico',       version: '2.0', lastUpdated: '2024-01-30' },
];

// ─── Aplica variáveis dinâmicas ao conteúdo do modelo ────────────────────────
// Substitui {{variavel}} pelos dados reais do processo.
// TODO (Backend): pode ser feito no servidor antes de retornar o conteúdo.
export const aplicarVariaveis = (
  conteudo: string,
  processo?: Partial<REURBProcess> | null
): string => {
  const hoje = new Date();
  const variaveis: Record<string, string> = {
    protocolo:   processo?.protocol         || 'Nº ___________',
    requerente:  processo?.applicant        || '[Nome do Requerente]',
    titulo:      processo?.title            || '[Denominação do Núcleo]',
    localizacao: processo?.location         || '[Localização]',
    area:        processo?.area             || '[Área Total]',
    modalidade:  processo?.modality         || 'REURB-S',
    responsavel: processo?.responsibleName  || '[Responsável Técnico]',
    municipio:   'São Luís',
    dataAtual:   hoje.toLocaleDateString('pt-BR'),
    dataExtenso: hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
    ano:         String(hoje.getFullYear()),
  };

  return Object.entries(variaveis).reduce(
    (texto, [chave, valor]) => texto.replace(new RegExp(`{{${chave}}}`, 'g'), valor),
    conteudo
  );
};

// ─── Retorna o HTML completo de um modelo com as variáveis já substituídas ────
export const getConteudoModelo = (
  modelId: string,
  processo?: Partial<REURBProcess> | null
): string => {
  const conteudo = CONTEUDO_MODELOS[modelId];
  if (!conteudo) return `<h1>Modelo não encontrado</h1><p>O conteúdo deste modelo ainda não foi cadastrado.</p>`;
  return aplicarVariaveis(conteudo, processo);
};
