import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, List, AlignLeft, AlignCenter, AlignRight,
  Save, FileCheck, Wand2, MessageSquare,
  CheckCircle2, X, RefreshCw, Sparkles, FileDown, Shield,
  Table2, Image, Clock
} from 'lucide-react';
import {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType,
  BorderStyle, ShadingType, VerticalAlign,
  Header, Footer, PageNumber, LevelFormat,
} from 'docx';
import { saveAs } from 'file-saver';
import { geminiService } from '../../services/geminiService';
import { User } from '../../types/index';
import { SignatureModal, SignatureRecord } from './SignatureModal';
import ModalImagem from './ModalImagem';
import PainelComentarios from './PainelComentarios';
import HistoricoVersoes, { Versao, EventoAuditoria } from './HistoricoVersoes';

import {
  useInteracaoImagem,
  ALÇAS,
  CURSOR_POR_ALÇA,
  POSIÇÃO_ALÇAS,
} from './components/useInteracaoImagem';
// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EditorProps {
  initialContent: string;
  title: string;
  onSave: (content: string, title: string, status?: string) => void;
  status: string;
  currentUser?: User | null;
}

type AbaAtiva = 'ia' | 'comentarios' | 'historico';

// ─── Modal de inserção de tabela ──────────────────────────────────────────────

interface ModalTabelaProps {
  onInserir: (linhas: number, colunas: number) => void;
  onFechar: () => void;
}

const ModalTabela: React.FC<ModalTabelaProps> = ({ onInserir, onFechar }) => {
  const [linhas, setLinhas] = useState(3);
  const [colunas, setColunas] = useState(3);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
        <h3 className="text-lg font-black text-slate-800 mb-4">Inserir Tabela</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Linhas</label>
            <input
              type="number"
              min={1}
              max={20}
              value={linhas}
              onChange={(e) => setLinhas(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Colunas</label>
            <input
              type="number"
              min={1}
              max={10}
              value={colunas}
              onChange={(e) => setColunas(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Pré-visualização</label>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 overflow-auto max-h-32">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {Array.from({ length: Math.min(linhas, 5) }).map((_, r) => (
                    <tr key={r}>
                      {Array.from({ length: Math.min(colunas, 5) }).map((_, c) => (
                        <td
                          key={c}
                          className={`border border-slate-300 px-2 py-1 text-center ${
                            r === 0 ? 'bg-slate-200 font-bold' : 'bg-white'
                          }`}
                        >
                          {r === 0 ? `Col ${c + 1}` : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onInserir(linhas, colunas)}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Inserir
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bloco de assinaturas no documento ───────────────────────────────────────

const BlocoAssinatura: React.FC<{ record: SignatureRecord }> = ({ record }) => (
  <div className="mt-10 border-t-2 border-blue-800 pt-6">
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-200">
        <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="font-black text-blue-900 text-sm uppercase tracking-wide">Registro de Assinaturas Digitais</p>
          <p className="text-[11px] text-blue-500 font-mono">Protocolo: {record.protocol}</p>
        </div>
        <span className="ml-auto bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
          ✓ Válido
        </span>
      </div>
      <div className="space-y-3">
        {record.signers.map((signer, idx) => (
          <div key={signer.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-green-100">
            <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-slate-800">
                {idx + 1}. {signer.name} — {signer.role}
              </p>
              <p className="text-[11px] text-slate-500">
                Assinado em:{' '}
                {signer.signedAt ? new Date(signer.signedAt).toLocaleString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Gera HTML de tabela vazia ────────────────────────────────────────────────

const gerarTabelaHTML = (linhas: number, colunas: number): string => {
  const cabecalho = `<tr>${Array.from({ length: colunas })
    .map(
      (_, c) =>
        `<th style="border:1px solid #999;background:#e2e8f0;padding:6px 10px;text-align:center;font-weight:bold;">Coluna ${
          c + 1
        }</th>`
    )
    .join('')}</tr>`;

  const corpo = Array.from({ length: linhas - 1 })
    .map(
      () =>
        `<tr>${Array.from({ length: colunas })
          .map(() => `<td style="border:1px solid #999;padding:6px 10px;min-width:80px;">&nbsp;</td>`)
          .join('')}</tr>`
    )
    .join('');

  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${cabecalho}${corpo}</table><p></p>`;
};

// ─── Exportar PDF ─────────────────────────────────────────────────────────────

const exportarPDF = (titulo: string, conteudoHtml: string, record?: SignatureRecord | null): Promise<void> => {
  const carregarScript = (): Promise<void> =>
    new Promise((resolve) => {
      if ((window as any).html2pdf) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

  return carregarScript().then(() => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;">
        <h1 style="font-size:14pt;font-weight:bold;margin:0;">PREFEITURA MUNICIPAL</h1>
        <p style="margin:0;">SECRETARIA DE REGULARIZAÇÃO FUNDIÁRIA – REURB</p>
        <p style="font-weight:bold;margin-top:6pt;">${titulo || 'DOCUMENTO OFICIAL'}</p>
      </div>
      <div style="font-family:'Times New Roman';font-size:12pt;line-height:1.5;">${conteudoHtml}</div>
      ${
        record
          ? `<div style="margin-top:20pt;border-top:2pt solid #1e3a8a;padding-top:12pt;">
        <strong style="color:#1e3a8a;">✓ REGISTRO DE ASSINATURAS DIGITAIS</strong><br/>
        <span style="color:#3b82f6;font-size:9pt;">Protocolo: ${record.protocol}</span>
        ${record.signers
          .map(
            (s, i) => `<div style="margin-top:6pt;padding:6pt;border:1pt solid #dcfce7;border-radius:4pt;">
          <strong>${i + 1}. ${s.name} — ${s.role}</strong><br/>
          <span style="font-size:8pt;">Assinado em: ${
            s.signedAt ? new Date(s.signedAt).toLocaleString('pt-BR') : '-'
          }</span>
        </div>`
          )
          .join('')}
      </div>`
          : ''
      }
    `;

    return (window as any)
      .html2pdf()
      .set({
        margin: [2, 2, 2, 2],
        filename: `${titulo || 'documento'}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' },
      })
      .from(wrapper)
      .save();
  });
};

// ─── Exportar DOCX ────────────────────────────────────────────────────────────

const exportarDOCX = async (titulo: string, conteudoHtml: string): Promise<void> => {
  const borda = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
  const bordasCelula = { top: borda, bottom: borda, left: borda, right: borda };

  const parseNo = (no: ChildNode): any[] => {
    if (no.nodeType === Node.TEXT_NODE) {
      const texto = no.textContent || '';
      if (!texto.trim()) return [];
      return [new TextRun({ text: texto, size: 24, font: 'Times New Roman' })];
    }
    if (no.nodeType !== Node.ELEMENT_NODE) return [];
    const el = no as HTMLElement;
    const filhos = () => Array.from(el.childNodes).flatMap(parseNo);
    switch (el.tagName?.toLowerCase()) {
      case 'b':
      case 'strong':
        return filhos().map((r: any) => new TextRun({ ...r.options, bold: true }));
      case 'i':
      case 'em':
        return filhos().map((r: any) => new TextRun({ ...r.options, italics: true }));
      case 'br':
        return [new TextRun({ text: '', break: 1 })];
      default:
        return filhos();
    }
  };

  const parseBloco = (el: Element): any[] => {
    const tag = el.tagName?.toLowerCase();
    const filhos = Array.from(el.childNodes).flatMap(parseNo);
    switch (tag) {
      case 'h1':
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: el.textContent || '',
                bold: true,
                size: 28,
                font: 'Times New Roman',
              }),
            ],
          }),
        ];
      case 'p':
        return [
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160 },
            children: filhos.length ? filhos : [new TextRun({ text: '', size: 24 })],
          }),
        ];
      case 'ul':
      case 'ol': {
        return Array.from(el.querySelectorAll('li')).map(
          (li) =>
            new Paragraph({
              numbering: {
                reference: tag === 'ol' ? 'numeros' : 'marcadores',
                level: 0,
              },
              children: [new TextRun({ text: li.textContent || '', size: 24, font: 'Times New Roman' })],
            })
        );
      }
      case 'table': {
        const linhas = Array.from(el.querySelectorAll('tr'));
        const maxCols = Math.max(...linhas.map((r) => r.querySelectorAll('th,td').length));
        if (maxCols === 0) return [];
        const largura = Math.floor(9026 / maxCols);
        return [
          new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: Array(maxCols).fill(largura),
            rows: linhas.map(
              (linha, idx) =>
                new TableRow({
                  tableHeader: idx === 0,
                  children: Array.from(linha.querySelectorAll('th,td')).map((celula) => {
                    const ehCabecalho = celula.tagName.toLowerCase() === 'th';
                    return new TableCell({
                      borders: bordasCelula,
                      shading: ehCabecalho ? { fill: 'D9D9D9', type: ShadingType.CLEAR } : undefined,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: ehCabecalho ? AlignmentType.CENTER : AlignmentType.LEFT,
                          children: [
                            new TextRun({
                              text: celula.textContent || '',
                              bold: ehCabecalho,
                              size: 22,
                              font: 'Times New Roman',
                            }),
                          ],
                        }),
                      ],
                    });
                  }),
                })
            ),
          }),
        ];
      }
      default:
        return filhos.length ? [new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: filhos })] : [];
    }
  };

  const temp = document.createElement('div');
  temp.innerHTML = conteudoHtml;

  const conteudo: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'PREFEITURA MUNICIPAL', bold: true, size: 26, font: 'Times New Roman' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: (titulo || 'DOCUMENTO OFICIAL').toUpperCase(),
          bold: true,
          size: 28,
          font: 'Times New Roman',
        }),
      ],
    }),
  ];

  Array.from(temp.children).forEach((el) => conteudo.push(...parseBloco(el)));

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'marcadores',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: 'numeros',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
    sections: [
      {
        properties: {
          page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
                children: [
                  new TextRun({
                    text: `REURBDoc | ${titulo}`,
                    size: 18,
                    color: '888888',
                    font: 'Arial',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
                children: [
                  new TextRun({ text: 'Lei nº 13.465/2017  |  Página ', size: 18, color: '888888', font: 'Arial' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888', font: 'Arial' }),
                  new TextRun({ text: ' de ', size: 18, color: '888888', font: 'Arial' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888', font: 'Arial' }),
                ],
              }),
            ],
          }),
        },
        children: conteudo,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${titulo || 'documento'}.docx`);
};

const gerarId = () => `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Componente Principal ─────────────────────────────────────────────────────

const Editor: React.FC<EditorProps> = ({ initialContent, title, onSave, status, currentUser }) => {
  const [conteudo, setConteudo] = useState(initialContent);
  const [tituloLocal, setTituloLocal] = useState(title);
  const [analisando, setAnalisando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mostrarMenuExportar, setMostrarMenuExportar] = useState(false);
  const [mostrarModalTabela, setMostrarModalTabela] = useState(false);
  const [mostrarModalImagem, setMostrarModalImagem] = useState(false);
  const [mostrarModalAssinatura, setMostrarModalAssinatura] = useState(false);
  const [instrucaoIA, setInstrucaoIA] = useState('');
  const [analiseIA, setAnaliseIA] = useState<string | null>(null);
  const [registroAssinatura, setRegistroAssinatura] = useState<SignatureRecord | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('ia');
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);

  // ── Gera ID de evento ─────────────────────────────────────────────────────
  const gerarIdEvento = () => `ev-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  // ── Registra evento na trilha de auditoria ────────────────────────────────
  const registrarEvento = useCallback((
    tipo: EventoAuditoria['tipo'],
    descricao: string
  ) => {
    setEventos(prev => [{
      id: gerarIdEvento(),
      tipo,
      descricao,
      autor: currentUser?.name || 'Usuário',
      criadoEm: new Date().toISOString(),
    }, ...prev]);
  }, [currentUser]);

  // ── Auto-save states ──────────────────────────────────────────────────────
  type StatusAutoSave = 'idle' | 'salvando' | 'salvo';
  const [statusAutoSave, setStatusAutoSave] = useState<StatusAutoSave>('idle');
  const [ultimoSalvoEm, setUltimoSalvoEm]   = useState<string | null>(null);
  const conteudoSalvoRef                     = useRef(initialContent);

  const refEditor = useRef<HTMLDivElement>(null);
  const refMenuExport = useRef<HTMLDivElement>(null);
  const selecaoSalvaRef = useRef<Range | null>(null);

  // ── Hook de interação com imagens ─────────────────────────────────────────
  const aoAlterarConteudo = useCallback(() => {
    setConteudo(refEditor.current?.innerHTML || '');
  }, []);

  const imagem = useInteracaoImagem(refEditor, aoAlterarConteudo);

  const usuariosAtivos = [
    { nome: 'Ana Silva', cor: 'bg-blue-500' },
    { nome: 'Carlos Tech', cor: 'bg-green-500' },
  ];

  // ── Versão inicial ao abrir o documento ──────────────────────────────────
  useEffect(() => {
    setConteudo(initialContent);
    if (refEditor.current) refEditor.current.innerHTML = initialContent;

    // Cria versão inicial automaticamente
    const versaoInicial: Versao = {
      id: gerarId(),
      numero: 1,
      conteudo: initialContent,
      titulo: title,
      autor: currentUser?.name || 'Sistema',
      salvoEm: new Date().toISOString(),
      descricao: 'Versão inicial — documento aberto',
    };
    setVersoes([versaoInicial]);

    // Registra evento de criação
    setEventos([{
      id: gerarIdEvento(),
      tipo: 'criacao',
      descricao: `Documento "${title}" aberto no editor`,
      autor: currentUser?.name || 'Sistema',
      criadoEm: new Date().toISOString(),
    }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent]);

  useEffect(() => {
    const fecharFora = (e: MouseEvent) => {
      if (refMenuExport.current && !refMenuExport.current.contains(e.target as Node)) {
        setMostrarMenuExportar(false);
      }
    };
    document.addEventListener('mousedown', fecharFora);
    return () => document.removeEventListener('mousedown', fecharFora);
  }, []);

  // ── Auto-save a cada 30 segundos se houver alterações ────────────────────
  // TODO (Backend): trocar onSave() por POST /api/documentos/:id/autosave
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (conteudo === conteudoSalvoRef.current) return;
      setStatusAutoSave('salvando');
      setTimeout(() => {
        onSave(conteudo, tituloLocal);
        conteudoSalvoRef.current = conteudo;
        const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setUltimoSalvoEm(hora);
        setStatusAutoSave('salvo');
        registrarEvento('autosave', `Auto-save às ${hora}`);
        setTimeout(() => setStatusAutoSave('idle'), 3000);
      }, 600);
    }, 30000);
    return () => clearInterval(intervalo);
  }, [conteudo, tituloLocal, onSave, registrarEvento]);

  const handleInserirTabela = (linhas: number, colunas: number) => {
    const html = gerarTabelaHTML(linhas, colunas);
    const editor = refEditor.current;
    if (!editor) return;

    // Monta o fragmento a partir do HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    while (temp.firstChild) frag.appendChild(temp.firstChild);

    // Tenta usar a seleção salva — só se estiver dentro do editor
    const rangeSalvo = selecaoSalvaRef.current;
    if (rangeSalvo && editor.contains(rangeSalvo.commonAncestorContainer)) {
      rangeSalvo.deleteContents();
      rangeSalvo.insertNode(frag);
      rangeSalvo.collapse(false);
    } else {
      // Fallback: insere no fim do editor
      editor.appendChild(frag);
    }

    selecaoSalvaRef.current = null;
    editor.focus();
    setConteudo(editor.innerHTML);
    setMostrarModalTabela(false);
  };

  // ── Inserir imagem ────────────────────────────────────────────────────────

  const handleInserirImagem = (htmlImagem: string) => {
    refEditor.current?.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const temp = document.createElement('div');
      temp.innerHTML = htmlImagem;
      const frag = document.createDocumentFragment();
      while (temp.firstChild) frag.appendChild(temp.firstChild);
      range.insertNode(frag);
      range.collapse(false);
    } else if (refEditor.current) {
      refEditor.current.innerHTML += htmlImagem;
    }
    setConteudo(refEditor.current?.innerHTML || '');
    setMostrarModalImagem(false);
  };

  // ── Salvar + histórico ────────────────────────────────────────────────────

  const handleSalvar = () => {
    const novaVersao: Versao = {
      id: gerarId(),
      numero: versoes.length + 1,
      conteudo,
      titulo: tituloLocal,
      autor: currentUser?.name || 'Usuário',
      salvoEm: new Date().toISOString(),
      descricao: `Versão ${versoes.length + 1} — ${new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit',
      })}`,
    };
    setVersoes((prev) => [novaVersao, ...prev]);
    onSave(conteudo, tituloLocal);
    // Sincroniza auto-save e indicador
    conteudoSalvoRef.current = conteudo;
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setUltimoSalvoEm(hora);
    setStatusAutoSave('salvo');
    registrarEvento('salvamento', `Documento salvo manualmente — v${versoes.length + 1}`);
    setTimeout(() => setStatusAutoSave('idle'), 3000);
  };

  const handleRestaurarVersao = (versao: Versao) => {
    setConteudo(versao.conteudo);
    setTituloLocal(versao.titulo);
    if (refEditor.current) refEditor.current.innerHTML = versao.conteudo;
    registrarEvento('restauracao', `Versão ${versao.numero} restaurada — "${versao.descricao}"`);
  };

  // ── IA: Consultar ─────────────────────────────────────────────────────────

  const handleConsultarIA = async () => {
    setAnalisando(true);
    try {
      const resultado = await geminiService.analyzeDocument(conteudo);
      setAnaliseIA(resultado || 'Nenhuma análise disponível.');
    } catch (erro: any) {
      setAnaliseIA(`⚠️ Falha ao consultar a IA: ${erro?.message ?? 'Erro desconhecido.'}`);
    } finally {
      setAnalisando(false);
    }
  };

  // ── IA: Editar ────────────────────────────────────────────────────────────

  const handleEditarViaIA = async () => {
    if (!instrucaoIA.trim()) return;
    setEditando(true);
    try {
      const novoHtml = await geminiService.applySmartEdit(conteudo, instrucaoIA);
      if (novoHtml) {
        setConteudo(novoHtml);
        if (refEditor.current) refEditor.current.innerHTML = novoHtml;
        setInstrucaoIA('');
        setAnaliseIA('✓ Mudanças aplicadas com sucesso!');
        registrarEvento('ia_aplicada', `IA aplicada: "${instrucaoIA.slice(0, 50)}${instrucaoIA.length > 50 ? '...' : ''}"`);
      }
    } catch (erro: any) {
      setAnaliseIA(`⚠️ ${erro?.message ?? 'Erro ao aplicar edições inteligentes.'}`);
    } finally {
      setEditando(false);
    }
  };

  // ── Exportar ──────────────────────────────────────────────────────────────

  const handleExportarPDF = async () => {
    setExportando(true);
    setMostrarMenuExportar(false);
    try {
      await exportarPDF(tituloLocal, conteudo, registroAssinatura);
      registrarEvento('exportacao', `Documento exportado como PDF`);
    } finally {
      setExportando(false);
    }
  };

  const handleExportarDOCX = async () => {
    setExportando(true);
    setMostrarMenuExportar(false);
    try {
      await exportarDOCX(tituloLocal, conteudo);
      registrarEvento('exportacao', `Documento exportado como DOCX`);
    } catch (erro: any) {
      setAnaliseIA(`⚠️ Erro ao exportar DOCX: ${erro?.message ?? ''}`);
    } finally {
      setExportando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ─── Modais ──────────────────────────────────────────────────────────── */}
      <SignatureModal
        isOpen={mostrarModalAssinatura}
        onClose={() => setMostrarModalAssinatura(false)}
        documentTitle={tituloLocal}
        documentContent={conteudo}
        currentUser={currentUser || null}
        onSignatureComplete={(record) => {
          setRegistroAssinatura(record);
          onSave(conteudo, tituloLocal, 'Signed');
          registrarEvento('assinatura', `Documento assinado — Protocolo: ${record.protocol}`);
        }}
      />

      {mostrarModalTabela && (
        <ModalTabela onInserir={handleInserirTabela} onFechar={() => setMostrarModalTabela(false)} />
      )}

      {mostrarModalImagem && (
        <ModalImagem onInserir={handleInserirImagem} onFechar={() => setMostrarModalImagem(false)} />
      )}

      {/* ─── Overlay de imagem (resize + arrasto + alinhamento) ─────────────── */}
      {imagem.selecionada && (
        <div ref={imagem.refOverlay} style={imagem.estiloOverlay}>
          {/* Borda de seleção */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid #3b82f6',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Alça central de arrasto */}
          <div
            onMouseDown={imagem.iniciarArrasto}
            title="Arrastar para reposicionar"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(59,130,246,0.85)',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'all',
              fontSize: 14,
              color: '#fff',
            }}
          >
            ✥
          </div>

          {/* Alças de redimensionamento */}
          {ALÇAS.map((dir) => (
            <div
              key={dir}
              onMouseDown={(e) => imagem.iniciarRedimensionamento(e, dir)}
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                background: '#fff',
                border: '2px solid #3b82f6',
                borderRadius: 2,
                cursor: CURSOR_POR_ALÇA[dir],
                pointerEvents: 'all',
                zIndex: 1,
                ...POSIÇÃO_ALÇAS[dir],
              }}
            />
          ))}

          {/* Toolbar flutuante */}
          <div
            style={{
              position: 'absolute',
              top: -44,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#1e293b',
              borderRadius: 10,
              padding: '5px 10px',
              pointerEvents: 'all',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {(
              [
                { alinhamento: 'left', label: '◧ Esq' },
                { alinhamento: 'center', label: '▣ Centro' },
                { alinhamento: 'right', label: 'Dir ◨' },
              ] as const
            ).map(({ alinhamento, label }) => (
              <button
                key={alinhamento}
                onMouseDown={(e) => {
                  e.preventDefault();
                  imagem.definirAlinhamento(alinhamento);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 7px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                {label}
              </button>
            ))}

            <div style={{ width: 1, background: '#334155', alignSelf: 'stretch', margin: '0 2px' }} />

            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onMouseDown={(e) => {
                  e.preventDefault();
                  imagem.definirLarguraPorcentual(pct);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 5px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                {pct}%
              </button>
            ))}

            <div style={{ width: 1, background: '#334155', alignSelf: 'stretch', margin: '0 2px' }} />

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                imagem.deletarImagem();
              }}
              title="Remover imagem"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 6,
                fontSize: 14,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#f87171')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* ─── Cabeçalho ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex flex-col flex-1 mr-4">
            <input
              type="text"
              value={tituloLocal}
              onChange={(e) => setTituloLocal(e.target.value)}
              className="text-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 -ml-1 border-none bg-transparent hover:bg-slate-50"
              placeholder="Título do documento..."
            />
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  registroAssinatura
                    ? 'bg-green-100 text-green-700'
                    : status === 'Review'
                    ? 'bg-amber-100 text-amber-700'
                    : status === 'Approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {registroAssinatura ? '✓ Assinado' : status}
              </span>
              {registroAssinatura && (
                <span className="text-[10px] text-slate-400 font-mono">Protocolo: {registroAssinatura.protocol}</span>
              )}
              {/* ── Indicador de auto-save ──────────────────────────────── */}
              {statusAutoSave === 'salvando' && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 animate-pulse">
                  <RefreshCw size={10} className="animate-spin" /> Salvando...
                </span>
              )}
              {statusAutoSave === 'salvo' && (
                <span className="flex items-center gap-1 text-[10px] text-green-600">
                  <CheckCircle2 size={10} /> Salvo às {ultimoSalvoEm}
                </span>
              )}
              {statusAutoSave === 'idle' && ultimoSalvoEm && (
                <span className="text-[10px] text-slate-300">
                  Auto-save: {ultimoSalvoEm}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-2">
              {usuariosAtivos.map((u, i) => (
                <div
                  key={i}
                  title={u.nome}
                  className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${u.cor}`}
                >
                  {u.nome.charAt(0)}
                </div>
              ))}
            </div>

            <button
              onClick={handleConsultarIA}
              disabled={analisando}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              <Wand2 size={16} className={analisando ? 'animate-pulse' : ''} />
              {analisando ? 'Analisando...' : 'Consultar IA'}
            </button>

            <div className="relative" ref={refMenuExport}>
              <button
                onClick={() => setMostrarMenuExportar((v) => !v)}
                disabled={exportando}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
              >
                <FileDown size={16} className={exportando ? 'animate-bounce' : ''} />
                {exportando ? 'Exportando...' : 'Exportar'}
              </button>
              {mostrarMenuExportar && (
                <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 min-w-[160px]">
                  <button
                    onClick={handleExportarPDF}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={handleExportarDOCX}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    📝 Exportar DOCX
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSalvar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ─── Área do Editor ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-12 bg-slate-100 flex justify-center">
            <div className="w-full max-w-[816px]">
              <div
                ref={refEditor}
                className={`w-full min-h-[1056px] bg-white shadow-xl p-[2cm] border border-slate-200 outline-none ${
                  registroAssinatura ? 'pointer-events-none' : ''
                }`}
                contentEditable={!registroAssinatura}
                onInput={(e) => setConteudo(e.currentTarget.innerHTML)}
                onClick={imagem.aoClicarNoEditor}
                suppressContentEditableWarning
              />
              {registroAssinatura && (
                <div className="bg-white shadow-xl border border-slate-200 px-[2cm] pb-[2cm]">
                  <BlocoAssinatura record={registroAssinatura} />
                </div>
              )}
            </div>
          </div>

          {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setAbaAtiva('ia')}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  abaAtiva === 'ia' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sparkles size={12} className="inline mr-1" /> IA
              </button>
              <button
                onClick={() => setAbaAtiva('comentarios')}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  abaAtiva === 'comentarios'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <MessageSquare size={12} className="inline mr-1" /> Comentários
              </button>
              <button
                onClick={() => setAbaAtiva('historico')}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  abaAtiva === 'historico'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Clock size={12} className="inline mr-1" /> Histórico
              </button>
            </div>

            {/* ─── Aba IA ────────────────────────────────────────────────────── */}
            {abaAtiva === 'ia' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-600" /> Comando de Edição
                  </h4>
                  <textarea
                    value={instrucaoIA}
                    onChange={(e) => setInstrucaoIA(e.target.value)}
                    placeholder="Ex: 'Atualize os dados do beneficiário'..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] resize-none"
                  />
                  <button
                    onClick={handleEditarViaIA}
                    disabled={editando || !instrucaoIA.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {editando ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    Aplicar via IA
                  </button>
                </div>

                {/* Painel de feedback — exibe análise, erros e confirmações */}
                {analiseIA && (
                  <div
                    className={`border p-4 rounded-xl relative ${
                      analiseIA.startsWith('⚠️')
                        ? 'bg-red-50 border-red-200'
                        : analiseIA.startsWith('✓')
                        ? 'bg-green-50 border-green-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <button onClick={() => setAnaliseIA(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Feedback</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{analiseIA}</p>
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-600" /> Checklist de REURB
                  </h4>
                  <ul className="space-y-2">
                    {['Qualificação Completa', 'Fundamentação Art. 12', 'Indicação de Beneficiários'].map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{item}</span>
                        <CheckCircle2 size={14} className="text-green-500" />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Metadados Jurídicos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Normativa</span>
                      <span className="text-slate-700">Lei 13.465/17</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Autor</span>
                      <span className="text-slate-700">{currentUser?.name || 'Usuário'}</span>
                    </div>
                    {registroAssinatura && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 uppercase font-bold text-[10px]">Protocolo</span>
                        <span className="text-green-700 font-mono text-[10px]">{registroAssinatura.protocol}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'comentarios' && (
              <PainelComentarios nomeUsuario={currentUser?.name || 'Usuário'} cargoUsuario={currentUser?.role || 'Operador'} />
            )}

            {abaAtiva === 'historico' && <HistoricoVersoes versoes={versoes} eventos={eventos} onRestaurar={handleRestaurarVersao} />}
          </div>
        </div>

        {/* ─── Barra de Ferramentas ─────────────────────────────────────────── */}
        <div className="h-14 bg-slate-900 text-white flex items-center justify-center gap-2 px-6">
          <div className="flex items-center gap-1">
            <button onClick={() => document.execCommand('bold')} title="Negrito" className="p-2 hover:bg-slate-800 rounded transition-colors">
              <Bold size={18} />
            </button>
            <button onClick={() => document.execCommand('italic')} title="Itálico" className="p-2 hover:bg-slate-800 rounded transition-colors">
              <Italic size={18} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1" />
            <button onClick={() => document.execCommand('justifyLeft')} title="Alinhar esquerda" className="p-2 hover:bg-slate-800 rounded transition-colors">
              <AlignLeft size={18} />
            </button>
            <button onClick={() => document.execCommand('justifyCenter')} title="Centralizar" className="p-2 hover:bg-slate-800 rounded transition-colors">
              <AlignCenter size={18} />
            </button>
            <button onClick={() => document.execCommand('justifyRight')} title="Alinhar direita" className="p-2 hover:bg-slate-800 rounded transition-colors">
              <AlignRight size={18} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1" />
            <button
              onClick={() => document.execCommand('insertUnorderedList')}
              title="Lista"
              className="p-2 hover:bg-slate-800 rounded transition-colors"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => {
                // Salva a posição do cursor antes de abrir o modal
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  selecaoSalvaRef.current = sel.getRangeAt(0).cloneRange();
                }
                setMostrarModalTabela(true);
              }}
              title="Inserir tabela"
              className="p-2 hover:bg-slate-800 rounded transition-colors text-emerald-400"
            >
              <Table2 size={18} />
            </button>
            <button
              onClick={() => setMostrarModalImagem(true)}
              title="Inserir imagem"
              className="p-2 hover:bg-slate-800 rounded transition-colors text-purple-400"
            >
              <Image size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-700 mx-3" />

          <button
            onClick={() => setMostrarModalAssinatura(true)}
            disabled={!!registroAssinatura}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileCheck size={18} />
            {registroAssinatura ? '✓ Documento Assinado' : 'Assinar com Certificado'}
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-xs font-bold uppercase tracking-wider">
            Finalizar Fluxo
          </button>
        </div>
      </div>
    </>
  );
};

export default Editor;