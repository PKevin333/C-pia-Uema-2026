import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, 
  Save, FileCheck, MessageSquare, Wand2,
  CheckCircle2, X, RefreshCw, Sparkles, FileDown, Shield
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

interface EditorProps {
  initialContent: string;
  title: string;
  onSave: (content: string, title: string, status?: string) => void;
  status: string;
  currentUser?: User | null;
}

// ─── Bloco de Assinaturas visível no documento ────────────────────────────────
const SignatureBlock: React.FC<{ record: SignatureRecord }> = ({ record }) => (
  <div className="mt-10 border-t-2 border-blue-800 pt-6">
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-200">
        <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="font-black text-blue-900 text-sm uppercase tracking-wide">Registro de Assinaturas Digitais</p>
          <p className="text-[11px] text-blue-500 font-mono">Protocolo: {record.protocol}</p>
        </div>
        <div className="ml-auto">
          <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            ✓ Válido
          </span>
        </div>
      </div>

      {/* Hash do documento */}
      <div className="mb-4 bg-white rounded-lg p-3 border border-blue-100">
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Hash do Documento (Integridade)</p>
        <p className="text-[11px] font-mono text-slate-600 break-all">{record.documentHash}</p>
      </div>

      {/* Assinantes */}
      <div className="space-y-3">
        {record.signers.map((signer, idx) => (
          <div key={signer.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-green-100">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-black text-slate-800">{idx + 1}. {signer.name}</p>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">{signer.role}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Assinado em: <strong>{signer.signedAt ? new Date(signer.signedAt).toLocaleString('pt-BR') : '-'}</strong>
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 break-all">Sig: {signer.signatureHash}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé legal */}
      <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] text-blue-400">
          Documento com validade jurídica — Lei nº 14.063/2020 • MP nº 2.200-2/2001 (ICP-Brasil)
        </p>
        <p className="text-[10px] text-blue-400 font-mono">
          {record.qrCodeData}
        </p>
      </div>
    </div>
  </div>
);

// ─── Exportar PDF ─────────────────────────────────────────────────────────────
const exportToPDF = (title: string, contentHtml: string, record?: SignatureRecord | null): Promise<void> => {
  const load = (): Promise<void> =>
    new Promise((resolve) => {
      if ((window as any).html2pdf) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

  return load().then(() => {
    const wrapper = document.createElement('div');
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      body { font-family: 'Times New Roman', serif; }
      .doc-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
      .doc-header h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; }
      .doc-header p { font-size: 10pt; margin: 0; }
      .doc-body { line-height: 1.5; font-size: 12pt; }
      .doc-body p { margin-bottom: 8pt; text-align: justify; }
      .doc-body h1 { font-size: 14pt; font-weight: bold; text-align: center; margin: 12pt 0 6pt 0; }
      table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 11pt; }
      th { background-color: #d9d9d9 !important; font-weight: bold; text-align: center; padding: 5pt 8pt; border: 1px solid #000; -webkit-print-color-adjust: exact; }
      td { padding: 4pt 8pt; border: 1px solid #000; vertical-align: top; }
      .sig-block { margin-top: 20pt; border-top: 2pt solid #1e3a8a; padding-top: 12pt; }
      .sig-block-inner { background: #eff6ff; border: 1pt solid #bfdbfe; border-radius: 6pt; padding: 12pt; }
      .sig-title { font-size: 10pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6pt; }
      .sig-protocol { font-size: 9pt; color: #3b82f6; font-family: monospace; margin-bottom: 8pt; }
      .sig-hash { font-size: 8pt; color: #64748b; font-family: monospace; word-break: break-all; background: white; padding: 4pt; border: 1pt solid #e2e8f0; border-radius: 3pt; margin-bottom: 8pt; }
      .sig-item { background: white; border: 1pt solid #dcfce7; border-radius: 4pt; padding: 6pt 8pt; margin-bottom: 4pt; }
      .sig-name { font-size: 10pt; font-weight: bold; color: #1e293b; }
      .sig-role { font-size: 8pt; color: #64748b; }
      .sig-date { font-size: 8pt; color: #475569; }
      .sig-hash-item { font-size: 7pt; color: #94a3b8; font-family: monospace; word-break: break-all; }
      .sig-footer { font-size: 7pt; color: #93c5fd; margin-top: 8pt; border-top: 1pt solid #bfdbfe; padding-top: 6pt; }
      .doc-footer { margin-top: 30pt; border-top: 1px solid #000; padding-top: 8pt; font-size: 9pt; text-align: center; color: #333; }
    `;
    wrapper.appendChild(styleTag);

    const header = document.createElement('div');
    header.className = 'doc-header';
    header.innerHTML = `
      <h1>PREFEITURA MUNICIPAL</h1>
      <p>SECRETARIA DE REGULARIZAÇÃO FUNDIÁRIA – REURB</p>
      <p style="font-size:11pt; font-weight:bold; margin-top:6pt;">${title || 'DOCUMENTO OFICIAL'}</p>
      <p style="font-size:9pt; color:#555;">Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    `;
    wrapper.appendChild(header);

    const body = document.createElement('div');
    body.className = 'doc-body';
    body.innerHTML = contentHtml;
    wrapper.appendChild(body);

    // Bloco de assinaturas no PDF
    if (record) {
      const sigBlock = document.createElement('div');
      sigBlock.className = 'sig-block';
      sigBlock.innerHTML = `
        <div class="sig-block-inner">
          <div class="sig-title">✓ Registro de Assinaturas Digitais</div>
          <div class="sig-protocol">Protocolo: ${record.protocol}</div>
          <div class="sig-hash">Hash do Documento: ${record.documentHash}</div>
          ${record.signers.map((s, i) => `
            <div class="sig-item">
              <div class="sig-name">${i + 1}. ${s.name}</div>
              <div class="sig-role">${s.role}</div>
              <div class="sig-date">Assinado em: ${s.signedAt ? new Date(s.signedAt).toLocaleString('pt-BR') : '-'}</div>
              <div class="sig-hash-item">Sig: ${s.signatureHash}</div>
            </div>
          `).join('')}
          <div class="sig-footer">Lei nº 14.063/2020 • ICP-Brasil • ${record.qrCodeData}</div>
        </div>
      `;
      wrapper.appendChild(sigBlock);
    }

    const footer = document.createElement('div');
    footer.className = 'doc-footer';
    footer.innerHTML = `<p>Documento gerado pelo sistema REURBDoc – Flow Management | Lei nº 13.465/2017 | ${new Date().getFullYear()}</p>`;
    wrapper.appendChild(footer);

    return (window as any).html2pdf().set({
      margin: [2, 2, 2, 2],
      filename: `${title || 'documento'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(wrapper).save();
  });
};

// ─── Exportar DOCX ────────────────────────────────────────────────────────────
const exportToDOCX = async (title: string, contentHtml: string, record?: SignatureRecord | null): Promise<void> => {
  const border = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  const parseNode = (node: ChildNode): any[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim()) return [];
      return [new TextRun({ text, size: 24, font: 'Times New Roman' })];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const tag = el.tagName?.toLowerCase();
    const childRuns = () => Array.from(el.childNodes).flatMap(parseNode);
    switch (tag) {
      case 'b': case 'strong': return childRuns().map((r: any) => new TextRun({ ...r.options, bold: true }));
      case 'i': case 'em': return childRuns().map((r: any) => new TextRun({ ...r.options, italics: true }));
      case 'u': return childRuns().map((r: any) => new TextRun({ ...r.options, underline: {} }));
      case 'br': return [new TextRun({ text: '', break: 1 })];
      default: return childRuns();
    }
  };

  const parseBlock = (el: Element): any[] => {
    const tag = el.tagName?.toLowerCase();
    const children = Array.from(el.childNodes).flatMap(parseNode);
    switch (tag) {
      case 'h1': return [new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: el.textContent || '', bold: true, size: 28, font: 'Times New Roman' })] })];
      case 'h2': return [new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: el.textContent || '', bold: true, size: 26, font: 'Times New Roman' })] })];
      case 'p': return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 }, children: children.length ? children : [new TextRun({ text: '', size: 24 })] })];
      case 'ul': case 'ol': {
        const isOrdered = tag === 'ol';
        return Array.from(el.querySelectorAll('li')).map(li =>
          new Paragraph({ numbering: { reference: isOrdered ? 'numbers' : 'bullets', level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: li.textContent || '', size: 24, font: 'Times New Roman' })] })
        );
      }
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr'));
        const maxCols = Math.max(...rows.map(r => r.querySelectorAll('th,td').length));
        if (maxCols === 0) return [];
        const colWidth = Math.floor(9026 / maxCols);
        return [new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: Array(maxCols).fill(colWidth),
          rows: rows.map((row, rIdx) => new TableRow({
            tableHeader: rIdx === 0,
            children: Array.from(row.querySelectorAll('th,td')).map(cell => {
              const isHeader = cell.tagName.toLowerCase() === 'th';
              return new TableCell({
                borders: cellBorders,
                width: { size: colWidth, type: WidthType.DXA },
                shading: isHeader ? { fill: 'D9D9D9', type: ShadingType.CLEAR } : undefined,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: cell.textContent || '', bold: isHeader, size: 22, font: 'Times New Roman' })] })],
              });
            }),
          })),
        })];
      }
      default: return children.length ? [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, children })] : [];
    }
  };

  const temp = document.createElement('div');
  temp.innerHTML = contentHtml;

  const bodyChildren: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'PREFEITURA MUNICIPAL', bold: true, size: 26, font: 'Times New Roman' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'SECRETARIA DE REGULARIZAÇÃO FUNDIÁRIA – REURB', size: 22, font: 'Times New Roman' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } }, children: [new TextRun({ text: (title || 'DOCUMENTO OFICIAL').toUpperCase(), bold: true, size: 28, font: 'Times New Roman' })] }),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
  ];

  Array.from(temp.children).forEach(child => bodyChildren.push(...parseBlock(child)));

  // Bloco de assinaturas no DOCX
  if (record) {
    bodyChildren.push(
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 8, color: '1e3a8a', space: 4 } }, spacing: { before: 400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 80 }, children: [new TextRun({ text: '✓ REGISTRO DE ASSINATURAS DIGITAIS', bold: true, size: 22, color: '1e3a8a', font: 'Arial' })] }),
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 80 }, children: [new TextRun({ text: `Protocolo: ${record.protocol}`, size: 18, color: '3b82f6', font: 'Arial' })] }),
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 160 }, children: [new TextRun({ text: `Hash: ${record.documentHash}`, size: 16, color: '64748b', font: 'Courier New' })] }),
      ...record.signers.flatMap((s, i) => [
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 80, after: 40 }, children: [new TextRun({ text: `${i + 1}. ${s.name} — ${s.role}`, bold: true, size: 20, font: 'Arial' })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 40 }, children: [new TextRun({ text: `   Assinado em: ${s.signedAt ? new Date(s.signedAt).toLocaleString('pt-BR') : '-'}`, size: 18, font: 'Arial', color: '475569' })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 80 }, children: [new TextRun({ text: `   Sig: ${s.signatureHash}`, size: 16, font: 'Courier New', color: '94a3b8' })] }),
      ]),
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 120 }, children: [new TextRun({ text: `Lei nº 14.063/2020 • ICP-Brasil • ${record.qrCodeData}`, size: 14, color: '93c5fd', font: 'Arial', italics: true })] }),
    );
  }

  const doc = new Document({
    numbering: {
      config: [
        { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
            children: [
              new TextRun({ text: 'REURBDoc – Flow Management   |   ', size: 18, color: '888888', font: 'Arial' }),
              new TextRun({ text: title || 'Documento', size: 18, color: '888888', font: 'Arial', italics: true }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
            children: [
              new TextRun({ text: 'Lei nº 13.465/2017   |   Página ', size: 18, color: '888888', font: 'Arial' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888', font: 'Arial' }),
              new TextRun({ text: ' de ', size: 18, color: '888888', font: 'Arial' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888', font: 'Arial' }),
            ],
          })],
        }),
      },
      children: bodyChildren,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || 'documento'}.docx`);
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const Editor: React.FC<EditorProps> = ({ initialContent, title, onSave, status, currentUser }) => {
  const [content, setContent] = useState(initialContent);
  const [localTitle, setLocalTitle] = useState(title);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureRecord, setSignatureRecord] = useState<SignatureRecord | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [activeUsers] = useState([
    { name: 'Ana Silva', color: 'bg-blue-500' },
    { name: 'Carlos Tech', color: 'bg-green-500' }
  ]);

  useEffect(() => {
    setContent(initialContent);
    if (editorRef.current) editorRef.current.innerHTML = initialContent;
  }, [initialContent]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await geminiService.analyzeDocument(content);
      setAiAnalysis(analysis || 'Nenhuma analise disponivel.');
    } catch (error) {
      console.error(error);
      alert('Falha ao consultar a IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSmartEdit = async () => {
    if (!aiInstruction.trim()) return;
    setIsEditing(true);
    try {
      const newHtml = await geminiService.applySmartEdit(content, aiInstruction);
      if (newHtml) {
        setContent(newHtml);
        if (editorRef.current) editorRef.current.innerHTML = newHtml;
        setAiInstruction('');
        setAiAnalysis('Mudancas aplicadas com sucesso pela IA!');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao aplicar edicoes inteligentes.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try { await exportToPDF(localTitle, content, signatureRecord); }
    finally { setIsExporting(false); }
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try { await exportToDOCX(localTitle, content, signatureRecord); }
    catch (e) { console.error(e); alert('Erro ao exportar DOCX.'); }
    finally { setIsExporting(false); }
  };

  const handleSignatureComplete = (record: SignatureRecord) => {
    setSignatureRecord(record);
    onSave(content, localTitle, 'Signed');
  };

  const handleSave = () => onSave(content, localTitle);

  return (
    <>
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        documentTitle={localTitle}
        documentContent={content}
        currentUser={currentUser || null}
        onSignatureComplete={handleSignatureComplete}
      />

      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex flex-col flex-1 mr-4">
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="text-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 -ml-1 transition-all border-none bg-transparent hover:bg-slate-50"
              placeholder="Digite o titulo do documento..."
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                signatureRecord ? 'bg-green-100 text-green-700' :
                status === 'Review' ? 'bg-amber-100 text-amber-700' :
                status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {signatureRecord ? '✓ Assinado' : status}
              </span>
              {signatureRecord && (
                <span className="text-[10px] text-slate-400 font-mono">Protocolo: {signatureRecord.protocol}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-4">
              {activeUsers.map((u, i) => (
                <div key={i} title={u.name} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${u.color}`}>
                  {u.name.charAt(0)}
                </div>
              ))}
            </div>

            <button onClick={handleAiAnalysis} disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium">
              <Wand2 size={16} className={isAnalyzing ? 'animate-pulse' : ''} />
              {isAnalyzing ? 'Analisando...' : 'Consultar IA'}
            </button>

            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => setShowExportMenu(v => !v)} disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium">
                <FileDown size={16} className={isExporting ? 'animate-bounce' : ''} />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 min-w-[160px]">
                  <button onClick={handleExportPDF} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <span className="text-lg">📄</span> Exportar PDF
                  </button>
                  <button onClick={handleExportDOCX} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <span className="text-lg">📝</span> Exportar DOCX
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto p-12 bg-slate-100 flex justify-center">
            <div className="w-full max-w-[816px]">
              <div
                ref={editorRef}
                className={`w-full min-h-[1056px] bg-white shadow-xl p-[2cm] border border-slate-200 outline-none ${signatureRecord ? 'pointer-events-none' : ''}`}
                contentEditable={!signatureRecord}
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                suppressContentEditableWarning={true}
              />
              {/* Bloco de assinaturas abaixo do documento */}
              {signatureRecord && (
                <div className="bg-white shadow-xl border border-slate-200 px-[2cm] pb-[2cm]">
                  <SignatureBlock record={signatureRecord} />
                </div>
              )}
            </div>
          </div>

          {/* AI Sidebar */}
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
            <div className="flex border-b border-slate-200">
              <button onClick={() => setShowComments(false)} className={`flex-1 py-3 text-xs font-semibold ${!showComments ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Inteligencia</button>
              <button onClick={() => setShowComments(true)} className={`flex-1 py-3 text-xs font-semibold ${showComments ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Notas</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {!showComments ? (
                <>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                      <Sparkles size={14} className="text-indigo-600" /> Comando de Edicao
                    </h4>
                    <textarea
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      placeholder="Ex: 'Atualize os dados do beneficiario'..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] resize-none"
                    />
                    <button onClick={handleSmartEdit} disabled={isEditing || !aiInstruction.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {isEditing ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      Aplicar via IA
                    </button>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {aiAnalysis && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                      <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Feedback do Sistema</h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" /> Checklist de REURB
                    </h4>
                    <ul className="space-y-2">
                      {['Qualificacao Completa', 'Fundamentacao Art. 12', 'Indicacao de Beneficiarios'].map((label, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{label}</span>
                          <CheckCircle2 size={14} className="text-green-500" />
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Metadados Juridicos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 uppercase font-bold text-[10px]">Normativa</span>
                        <span className="text-slate-700 font-medium">Lei 13.465/17</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 uppercase font-bold text-[10px]">Autor</span>
                        <span className="text-slate-700 font-medium">{currentUser?.name || 'Usuário'}</span>
                      </div>
                      {signatureRecord && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 uppercase font-bold text-[10px]">Protocolo</span>
                          <span className="text-green-700 font-mono text-[10px]">{signatureRecord.protocol}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 opacity-40">
                  <MessageSquare size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-medium">Nenhum comentario pendente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-14 bg-slate-900 text-white flex items-center justify-center gap-6 px-6">
          <div className="flex items-center gap-1">
            <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-slate-800 rounded transition-colors"><Bold size={18} /></button>
            <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-slate-800 rounded transition-colors"><Italic size={18} /></button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button onClick={() => document.execCommand('justifyLeft')} className="p-2 hover:bg-slate-800 rounded transition-colors"><AlignLeft size={18} /></button>
            <button onClick={() => document.execCommand('justifyCenter')} className="p-2 hover:bg-slate-800 rounded transition-colors"><AlignCenter size={18} /></button>
            <button onClick={() => document.execCommand('justifyRight')} className="p-2 hover:bg-slate-800 rounded transition-colors"><AlignRight size={18} /></button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button onClick={() => document.execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-800 rounded transition-colors"><List size={18} /></button>
          </div>
          <div className="w-px h-6 bg-slate-700 mx-4" />
          <button
            onClick={() => setShowSignatureModal(true)}
            disabled={!!signatureRecord}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileCheck size={18} />
            {signatureRecord ? '✓ Documento Assinado' : 'Assinar com Certificado'}
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
