import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, 
  Save, FileCheck, MessageSquare, Wand2,
  CheckCircle2, X, RefreshCw, Sparkles, FileDown
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { User } from '../../types/index';

interface EditorProps {
  initialContent: string;
  title: string;
  onSave: (content: string, title: string, status?: string) => void;
  status: string;
  currentUser?: User | null;
}

// ─── MOTOR DE EXPORTAÇÃO PDF ──────────────────────────────────────────────
const exportToPDF = (title: string, contentHtml: string): Promise<void> => {
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
    wrapper.style.cssText = `font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 2cm;`;
    wrapper.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px;">
        <h1 style="font-size: 14pt; margin: 0;">PREFEITURA MUNICIPAL</h1>
        <p style="margin: 5px 0;">SECRETARIA DE REGULARIZAÇÃO FUNDIÁRIA – REURB</p>
        <p style="font-weight:bold; margin-top:10px;">${title.toUpperCase()}</p>
      </div>
      ${contentHtml}
    `;
    const opt = { margin: 1, filename: `${title}.pdf`, jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' } };
    return (window as any).html2pdf().set(opt).from(wrapper).save();
  });
};

// ─── MOTOR DE EXPORTAÇÃO DOCX (CORRIGIDO) ──────────────────────────────────
const exportToDOCX = async (title: string, contentHtml: string): Promise<void> => {
  const load = (): Promise<void> =>
    new Promise((resolve) => {
      if ((window as any).docx) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/docx@8.5.0/build/index.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

  await load();
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } = (window as any).docx;

  const parseNode = (node: ChildNode, styles: any = {}): any[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim() && text !== ' ') return [];
      return [new TextRun({ text, size: 24, font: 'Times New Roman', ...styles })];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const newStyles = { ...styles };
    if (tag === 'b' || tag === 'strong') newStyles.bold = true;
    if (tag === 'i' || tag === 'em') newStyles.italics = true;
    if (tag === 'u') newStyles.underline = {};
    if (tag === 'br') return [new TextRun({ text: '', break: 1 })];
    return Array.from(el.childNodes).flatMap(child => parseNode(child, newStyles));
  };

  const temp = document.createElement('div');
  temp.innerHTML = contentHtml;
  const bodyChildren: any[] = Array.from(temp.children).flatMap(child => {
    const tag = child.tagName.toLowerCase();
    const children = Array.from(child.childNodes).flatMap(n => parseNode(n));
    if (tag === 'table') {
      const rows = Array.from(child.querySelectorAll('tr'));
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(row => new TableRow({
          children: Array.from(row.querySelectorAll('th, td')).map(cell => new TableCell({
            borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
            shading: cell.tagName === 'TH' ? { fill: 'D9D9D9' } : undefined,
            children: [new Paragraph({ children: Array.from(cell.childNodes).flatMap(n => parseNode(n)) })]
          }))
        }))
      })];
    }
    return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, children })];
  });

  const doc = new Document({ sections: [{ children: bodyChildren }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${title}.docx`; a.click();
  URL.revokeObjectURL(url);
};

// ─── COMPONENTE EDITOR (RESTAURADO E COMPLETO) ──────────────────────────────
const Editor: React.FC<EditorProps> = ({ initialContent, title, onSave, status, currentUser }) => {
  const [content, setContent] = useState(initialContent);
  const [localTitle, setLocalTitle] = useState(title);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent;
  }, [initialContent]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExportDOCX = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportToDOCX(localTitle, content);
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar DOCX.");
    } finally {
      setIsExporting(false); // Destrava o botão
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
        setAiInstruction("");
      }
    } finally { setIsEditing(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex flex-col flex-1 mr-4">
          <input type="text" value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} className="text-lg font-semibold text-slate-800 focus:outline-none border-none bg-transparent hover:bg-slate-50" />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">{status}</span>
            <span className="text-xs text-slate-400">Edição Ativa • IA Conectada</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium">
              <FileDown size={16} className={isExporting ? 'animate-bounce' : ''} />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 min-w-[160px]">
                <button onClick={() => exportToPDF(localTitle, content)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">📄 PDF</button>
                <button onClick={handleExportDOCX} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">📝 DOCX</button>
              </div>
            )}
          </div>
          <button onClick={() => onSave(content, localTitle)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm"><Save size={18} /> Salvar</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100 flex justify-center">
          <div ref={editorRef} className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-xl p-[2cm] border border-slate-200 outline-none" contentEditable onInput={(e) => setContent(e.currentTarget.innerHTML)} suppressContentEditableWarning={true} />
        </div>
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col p-4 space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Sparkles size={14} className="text-indigo-600" /> Inteligência</h4>
            <textarea value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs min-h-[120px] resize-none" placeholder="Instrução para a IA..." />
            <button onClick={handleSmartEdit} disabled={isEditing || !aiInstruction.trim()} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
              {isEditing ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />} Aplicar via IA
            </button>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Checklist REURB</h4>
            {['Qualificação', 'Art. 12', 'Beneficiários'].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 text-slate-500">{item} <CheckCircle2 size={14} className="text-green-500" /></div>
            ))}
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Metadados Jurídicos</h4>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Normativa</span> <span className="text-slate-700">Lei 13.465/17</span></div>
            <div className="flex justify-between text-xs mt-2"><span className="text-slate-400">Autor</span> <span className="text-slate-700">{currentUser?.name || 'Kevin'}</span></div>
          </div>
        </div>
      </div>

      <div className="h-14 bg-slate-900 text-white flex items-center justify-center gap-6 px-6">
        <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-slate-800 rounded"><Bold size={18} /></button>
        <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-slate-800 rounded"><Italic size={18} /></button>
        <div className="w-px h-6 bg-slate-700" />
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-bold uppercase tracking-wider"><FileCheck size={18} /> Assinar com Certificado</button>
        <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider">Finalizar Fluxo</button>
      </div>
    </div>
  );
};

export default Editor;