import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { dbService } from '../../services/databaseService';
import { User } from '../../types/index';

interface NewProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
}

export const NewProcessModal: React.FC<NewProcessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}) => {
  const [form, setForm] = useState({
    title: '',
    applicant: '',
    location: '',
    modality: 'REURB-S' as 'REURB-S' | 'REURB-E',
    area: '',
    responsibleName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.applicant) {
      setError('Preencha os campos obrigatórios: Título e Requerente.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      dbService.processes.insert({
        ...form,
        technicianId: currentUser.id,
        legalId: currentUser.id,
      });
      onSuccess();
      onClose();
      setForm({ title: '', applicant: '', location: '', modality: 'REURB-S', area: '', responsibleName: '' });
    } catch (err) {
      setError('Erro ao criar processo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Novo Protocolo</h2>
            <p className="text-slate-400 text-sm font-medium mt-0.5">Preencha os dados do processo REURB</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Título do Núcleo / Processo *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex: Núcleo Habitacional Esperança"
              className="w-full px-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Requerente *
            </label>
            <input
              name="applicant"
              value={form.applicant}
              onChange={handleChange}
              placeholder="Ex: Associação de Moradores Vila Verde"
              className="w-full px-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Localização
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Ex: Bairro Santa Luzia, São Luís - MA"
              className="w-full px-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Modalidade
              </label>
              <select
                name="modality"
                value={form.modality}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-200 transition-all cursor-pointer"
              >
                <option value="REURB-S">REURB-S</option>
                <option value="REURB-E">REURB-E</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Área Total
              </label>
              <input
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Ex: 15.400 m²"
                className="w-full px-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Responsável Técnico
            </label>
            <input
              name="responsibleName"
              value={form.responsibleName}
              onChange={handleChange}
              placeholder="Ex: Eng. João da Silva"
              className="w-full px-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? 'Criando...' : (<><Plus size={18} /> Criar Processo</>)}
          </button>
        </div>
      </div>
    </div>
  );
};
