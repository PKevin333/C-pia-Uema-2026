
import React, { useState } from 'react';
import { X, User, MapPin, Layers, Ruler, ArrowRight, Search, Loader2 } from 'lucide-react';
import { dbService } from '../../services/databaseService';

interface NewProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: any;
}

export const NewProcessModal: React.FC<NewProcessModalProps> = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [cep, setCep] = useState('');
  const [form, setForm] = useState({
    applicant: '',
    location: '',
    modality: 'REURB-S' as 'REURB-S' | 'REURB-E',
    area: ''
  });

  if (!isOpen) return null;

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCep(value);

    if (value.length === 8) {
      setSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          const address = `${data.logradouro}${data.logradouro ? ', ' : ''}${data.bairro} - ${data.localidade}/${data.uf}`;
          setForm(prev => ({ ...prev, location: address }));
        } else {
          // Opcional: Feedback de CEP não encontrado
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setSearchingCep(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      dbService.processes.insert({
        title: form.applicant,
        applicant: form.applicant,
        location: form.location,
        modality: form.modality,
        area: form.area ? `${form.area} m²` : 'Não informada',
        responsibleName: currentUser.name || 'Admin',
        technicianId: currentUser.id,
        legalId: currentUser.id
      });
      
      onSuccess();
      onClose();
      setForm({ applicant: '', location: '', modality: 'REURB-S', area: '' });
      setCep('');
    } catch (err) {
      console.error(err);
      alert("Erro ao criar processo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Novo Processo REURB</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Abertura de Protocolo Digital</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
              <User size={12} /> Requerente (Nome Completo)
            </label>
            <input 
              required
              type="text" 
              value={form.applicant}
              onChange={(e) => setForm({...form, applicant: e.target.value})}
              placeholder="Nome do cidadão ou associação"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none text-sm font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                <Search size={12} /> CEP
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={8}
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="00000000"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none text-sm font-black transition-all"
                />
                {searchingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Localização / Núcleo
              </label>
              <input 
                required
                type="text" 
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                placeholder="Logradouro, Bairro - Cidade/UF"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none text-sm font-bold transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                <Layers size={12} /> Modalidade
              </label>
              <div className="relative">
                <select 
                  value={form.modality}
                  onChange={(e) => setForm({...form, modality: e.target.value as any})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none text-sm font-black transition-all appearance-none"
                >
                  <option value="REURB-S">REURB-S (Social)</option>
                  <option value="REURB-E">REURB-E (Específica)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <ArrowRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                <Ruler size={12} /> Área Est. (m²)
              </label>
              <input 
                type="number" 
                value={form.area}
                onChange={(e) => setForm({...form, area: e.target.value})}
                placeholder="Ex: 250"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none text-sm font-bold transition-all"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading || searchingCep}
              className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Gerar Novo Protocolo <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
