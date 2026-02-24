import React, { useState, useRef, useEffect } from 'react';
import { Image, Link, Upload, X } from 'lucide-react';

interface ModalImagemProps {
  onInserir: (htmlImagem: string) => void;
  onFechar: () => void;
}

const ModalImagem: React.FC<ModalImagemProps> = ({ onInserir, onFechar }) => {
  const [aba, setAba] = useState<'upload' | 'url'>('upload');
  const [urlImagem, setUrlImagem] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [largura, setLargura] = useState('100%');
  const [alinhamento, setAlinhamento] = useState<'left' | 'center' | 'right'>('center');
  const inputArquivo = useRef<HTMLInputElement>(null);

  // Preview local
  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setPreviewUrl(URL.createObjectURL(arquivo));
  };

  // Libera memória do preview
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Insere imagem no editor
  const handleInserir = () => {
    const src = aba === 'upload' ? previewUrl : urlImagem;
    if (!src) return;

    const estiloAlinhamento =
      alinhamento === 'center' ? 'display:block; margin:0 auto;' :
      alinhamento === 'right'  ? 'display:block; margin-left:auto;' :
      'display:block;';

    const htmlImagem = `
      <figure style="margin:12px 0; ${estiloAlinhamento}">
        <img src="${src}" alt="Imagem inserida"
          style="width:${largura}; max-width:100%; height:auto; border:1px solid #e2e8f0; border-radius:4px;" />
      </figure><p></p>
    `;

    onInserir(htmlImagem);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image size={20} className="text-blue-600" />
            <h3 className="text-lg font-black text-slate-800">Inserir Imagem</h3>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => { setAba('upload'); setPreviewUrl(null); }}
            className={`flex-1 py-2 text-xs font-bold ${aba === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
          >
            <Upload size={14} className="inline mr-1" /> Upload
          </button>
          <button
            onClick={() => { setAba('url'); setPreviewUrl(null); }}
            className={`flex-1 py-2 text-xs font-bold ${aba === 'url' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
          >
            <Link size={14} className="inline mr-1" /> URL
          </button>
        </div>

        <div className="space-y-4">
          {/* Upload */}
          {aba === 'upload' && (
            <div
              onClick={() => inputArquivo.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
            >
              <Upload size={28} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">Clique para selecionar uma imagem</p>
              <input
                ref={inputArquivo}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleArquivoSelecionado}
              />
            </div>
          )}

          {/* URL */}
          {aba === 'url' && (
            <input
              type="url"
              value={urlImagem}
              onChange={(e) => { setUrlImagem(e.target.value); setPreviewUrl(e.target.value); }}
              placeholder="https://exemplo.com/imagem.png"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pré-visualização</p>
              <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto object-contain rounded" />
            </div>
          )}

          {/* Configurações */}
          <select
            value={largura}
            onChange={(e) => setLargura(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="25%">Pequena (25%)</option>
            <option value="50%">Média (50%)</option>
            <option value="75%">Grande (75%)</option>
            <option value="100%">Completa (100%)</option>
          </select>

          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setAlinhamento(op)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                  alinhamento === op ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500'
                }`}
              >
                {op === 'left' ? 'Esquerda' : op === 'center' ? 'Centro' : 'Direita'}
              </button>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleInserir}
            disabled={!previewUrl && !urlImagem}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            Inserir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalImagem;
