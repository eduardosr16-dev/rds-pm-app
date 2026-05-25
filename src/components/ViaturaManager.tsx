import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Viatura } from '../types';
import { viaturasPMMT } from '../data/viaturas';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  AlertTriangle,
  Play,
  Activity
} from 'lucide-react';

export default function ViaturaManager() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [chassi, setChassi] = useState('');
  const [renavam, setRenavam] = useState('');
  const [observacao, setObservacao] = useState('');
  const [ativo, setAtivo] = useState(true);

  const seedDefaults = async () => {
    localStorage.removeItem('rdspm_viaturas');
    const defaultList: Viatura[] = viaturasPMMT.map((v, i) => ({
      modelo: v.modelo,
      placa: v.placa,
      chassi: v.chassi,
      renavam: v.renavam,
      observacao_operacional: v.observacao,
      ativo: true
    }));

    const localListWithIds = defaultList.map((v, i) => ({ ...v, id: "local-" + (i + 1) }));
    localStorage.setItem('rdspm_viaturas', JSON.stringify(localListWithIds));
    setViaturas(localListWithIds);

    try {
      // Delete all old viaturas first (e.g. OBO-4412) from database
      await supabase.from('viaturas').delete().neq('id', 0);
      
      const { data, error } = await supabase
        .from('viaturas')
        .insert(defaultList)
        .select();
      if (!error && data && data.length > 0) {
        setViaturas(data);
        localStorage.setItem('rdspm_viaturas', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('[VRT-ADMIN] Problem background seeding defaults to Supabase:', err);
    }
  };

  const fetchViaturas = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('viaturas')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      // Check for stale Hilux "OBO-4412" or duplicates
      const hasOldHilux = data && data.some(v => v.placa === 'OBO-4412');
      const platesSeen = new Set<string>();
      let hasDuplicates = false;
      if (data) {
        for (const v of data) {
          if (platesSeen.has(v.placa)) {
            hasDuplicates = true;
            break;
          }
          platesSeen.add(v.placa);
        }
      }

      if (hasOldHilux || hasDuplicates) {
        console.warn('[VRT-ADMIN] Purging database from OBO-4412 / duplicates...');
        await seedDefaults();
        return;
      }

      if (data && data.length > 0) {
        setViaturas(data);
        localStorage.setItem('rdspm_viaturas', JSON.stringify(data));
      } else {
        const cached = localStorage.getItem('rdspm_viaturas');
        if (cached) {
          const parsed = JSON.parse(cached) as Viatura[];
          const hasHiluxCache = parsed.some(v => v.placa === 'OBO-4412');
          const cachePlatesSeen = new Set<string>();
          let hasCacheDuplicates = false;
          for (const v of parsed) {
            if (cachePlatesSeen.has(v.placa)) {
              hasCacheDuplicates = true;
              break;
            }
            cachePlatesSeen.add(v.placa);
          }

          if (parsed.length > 0 && !hasHiluxCache && !hasCacheDuplicates) {
            setViaturas(parsed);
            try {
              const defaultList: Viatura[] = parsed.map(v => ({
                modelo: v.modelo,
                placa: v.placa,
                chassi: v.chassi || '',
                renavam: v.renavam || '',
                observacao_operacional: v.observacao_operacional || '',
                ativo: v.ativo ?? true
              }));
              await supabase.from('viaturas').delete().neq('id', 0);
              await supabase.from('viaturas').insert(defaultList);
            } catch (err) {
              console.warn('[VRT-ADMIN] Failed back-syncing cache to DB:', err);
            }
          } else {
            await seedDefaults();
          }
        } else {
          await seedDefaults();
        }
      }
    } catch (err: any) {
      console.warn('[VRT-ADMIN] Supabase unavailable, utilizing localStorage cache:', err);
      const cached = localStorage.getItem('rdspm_viaturas');
      if (cached) {
        const parsed = JSON.parse(cached) as Viatura[];
        const hasHiluxCache = parsed.some(v => v.placa === 'OBO-4412');
        const cachePlates = new Set<string>();
        let hasCacheDuplicates = false;
        for (const v of parsed) {
          if (cachePlates.has(v.placa)) {
            hasCacheDuplicates = true;
            break;
          }
          cachePlates.add(v.placa);
        }

        if (hasHiluxCache || hasCacheDuplicates) {
          const defaultList: Viatura[] = viaturasPMMT.map((v, i) => ({
            id: "local-" + (i + 1),
            modelo: v.modelo,
            placa: v.placa,
            chassi: v.chassi,
            renavam: v.renavam,
            observacao_operacional: v.observacao,
            ativo: true
          }));
          setViaturas(defaultList);
          localStorage.setItem('rdspm_viaturas', JSON.stringify(defaultList));
        } else {
          setViaturas(parsed);
        }
      } else {
        const defaultList: Viatura[] = viaturasPMMT.map((v, i) => ({
          id: "local-" + (i + 1),
          modelo: v.modelo,
          placa: v.placa,
          chassi: v.chassi,
          renavam: v.renavam,
          observacao_operacional: v.observacao,
          ativo: true
        }));
        setViaturas(defaultList);
        localStorage.setItem('rdspm_viaturas', JSON.stringify(defaultList));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViaturas();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setModelo('');
    setPlaca('');
    setChassi('');
    setRenavam('');
    setObservacao('');
    setAtivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vtr: Viatura) => {
    setEditingId(vtr.id || null);
    setModelo(vtr.modelo);
    setPlaca(vtr.placa);
    setChassi(vtr.chassi || '');
    setRenavam(vtr.renavam || '');
    setObservacao(vtr.observacao_operacional || '');
    setAtivo(vtr.ativo ?? true);
    setIsModalOpen(true);
  };

  const handleSaveViatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!modelo.trim() || !placa.trim()) {
      setErrorMsg('Modelo e Placa são campos obrigatórios.');
      return;
    }

    const payload = {
      modelo: modelo.trim(),
      placa: placa.trim().toUpperCase(),
      chassi: chassi.trim(),
      renavam: renavam.trim(),
      observacao_operacional: observacao.trim(),
      ativo
    };

    try {
      let savedVtr: Viatura | null = null;
      if (editingId) {
        if (!String(editingId).startsWith('local-')) {
          const { data, error } = await supabase
            .from('viaturas')
            .update(payload)
            .eq('id', editingId)
            .select();
          if (!error && data && data.length > 0) {
            savedVtr = data[0];
          }
        }
      } else {
        const { data, error } = await supabase
          .from('viaturas')
          .insert([payload])
          .select();
        if (!error && data && data.length > 0) {
          savedVtr = data[0];
        }
      }

      // Synchronize changes to client-side localStorage cache
      const cached = localStorage.getItem('rdspm_viaturas');
      let currentLocal: Viatura[] = cached ? JSON.parse(cached) : [];
      if (editingId) {
        currentLocal = currentLocal.map(v => 
          String(v.id) === String(editingId) 
            ? { ...v, ...payload, id: savedVtr?.id || editingId } 
            : v
        );
        setSuccessMsg(`Viatura ${payload.placa} atualizada com sucesso!`);
      } else {
        const newLocalItem: Viatura = savedVtr || {
          ...payload,
          id: "local-" + Date.now(),
        };
        currentLocal.push(newLocalItem);
        setSuccessMsg(`Viatura ${payload.placa} cadastrada com sucesso!`);
      }
      localStorage.setItem('rdspm_viaturas', JSON.stringify(currentLocal));
      setViaturas(currentLocal);
      setIsModalOpen(false);
      await fetchViaturas();
    } catch (err: any) {
      console.warn('[VRT-ADMIN] Database save failed. Relying on localStorage offline persistence:', err);
      const cached = localStorage.getItem('rdspm_viaturas');
      let currentLocal: Viatura[] = cached ? JSON.parse(cached) : [];
      if (editingId) {
        currentLocal = currentLocal.map(v => 
          String(v.id) === String(editingId) ? { ...v, ...payload } : v
        );
        setSuccessMsg(`Viatura ${payload.placa} atualizada localmente com sucesso (modo offline)!`);
      } else {
        const newLocalItem: Viatura = {
          ...payload,
          id: "local-" + Date.now(),
        };
        currentLocal.push(newLocalItem);
        setSuccessMsg(`Viatura ${payload.placa} cadastrada localmente com sucesso (modo offline)!`);
      }
      localStorage.setItem('rdspm_viaturas', JSON.stringify(currentLocal));
      setViaturas(currentLocal);
      setIsModalOpen(false);
    }
  };

  const handleDeleteViatura = async (id: number | string, plateStr: string) => {
    if (!window.confirm(`Tem certeza absoluta de que deseja excluir permanentemente a viatura ${plateStr}?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!String(id).startsWith('local-')) {
        const { error } = await supabase
          .from('viaturas')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      // Remove from LocalStorage
      const cached = localStorage.getItem('rdspm_viaturas');
      if (cached) {
        const currentLocal = JSON.parse(cached) as Viatura[];
        const filtered = currentLocal.filter(v => String(v.id) !== String(id));
        localStorage.setItem('rdspm_viaturas', JSON.stringify(filtered));
        setViaturas(filtered);
      }
      setSuccessMsg(`Viatura ${plateStr} excluída com sucesso!`);
      await fetchViaturas();
    } catch (err: any) {
      console.warn('[VRT-ADMIN] Supabase delete failed. Resorting to local cache deletion:', err);
      const cached = localStorage.getItem('rdspm_viaturas');
      if (cached) {
        const currentLocal = JSON.parse(cached) as Viatura[];
        const filtered = currentLocal.filter(v => String(v.id) !== String(id));
        localStorage.setItem('rdspm_viaturas', JSON.stringify(filtered));
        setViaturas(filtered);
        setSuccessMsg(`Viatura ${plateStr} excluída do armazenamento local (modo offline)!`);
      } else {
        setErrorMsg('Erro ao excluir viatura: ' + err.message);
      }
    }
  };

  const toggleViaturaAtiva = async (vtr: Viatura) => {
    setErrorMsg('');
    const newActive = !(vtr.ativo ?? true);
    try {
      if (!String(vtr.id).startsWith('local-')) {
        const { error } = await supabase
          .from('viaturas')
          .update({ ativo: newActive })
          .eq('id', vtr.id);

        if (error) throw error;
      }

      const cached = localStorage.getItem('rdspm_viaturas');
      if (cached) {
        const currentLocal = JSON.parse(cached) as Viatura[];
        const updated = currentLocal.map(v => 
          String(v.id) === String(vtr.id) ? { ...v, ativo: newActive } : v
        );
        localStorage.setItem('rdspm_viaturas', JSON.stringify(updated));
        setViaturas(updated);
      }
      setSuccessMsg(`Status da viatura ${vtr.placa} alterado com sucesso!`);
      await fetchViaturas();
    } catch (err: any) {
      console.warn('[VRT-ADMIN] Supabase status update failed. Altering local cache status:', err);
      const cached = localStorage.getItem('rdspm_viaturas');
      if (cached) {
        const currentLocal = JSON.parse(cached) as Viatura[];
        const updated = currentLocal.map(v => 
          String(v.id) === String(vtr.id) ? { ...v, ativo: newActive } : v
        );
        localStorage.setItem('rdspm_viaturas', JSON.stringify(updated));
        setViaturas(updated);
        setSuccessMsg(`Status da viatura ${vtr.placa} alterado localmente (modo offline)!`);
      } else {
        setErrorMsg('Erro ao alternar status da viatura: ' + err.message);
      }
    }
  };

  const filteredViaturas = viaturas.filter(vtr => {
    const term = search.toLowerCase();
    return (
      vtr.modelo.toLowerCase().includes(term) ||
      vtr.placa.toLowerCase().includes(term) ||
      (vtr.chassi && vtr.chassi.toLowerCase().includes(term)) ||
      (vtr.renavam && vtr.renavam.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl shadow-lg p-6 lg:p-8 space-y-6 animate-fadeIn" id="viaturas-manager-screen">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#04154d] border border-blue-900 rounded-lg text-amber-400">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans uppercase tracking-tight">Gerenciar Frota de Viaturas</h3>
            <p className="text-xs text-slate-400">Lista completa e estado operacional das viaturas táticas do 19º CIPM</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-650 hover:to-emerald-555 text-white text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Viatura</span>
        </button>
      </div>

      {/* FEEDBACK STATUS */}
      {errorMsg && (
        <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl flex gap-3 text-xs text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
        <Search className="h-4 w-4 text-slate-450" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar viatura por modelo, placa, CHASSI ou RENAVAM..."
          className="flex-1 bg-transparent border-none text-slate-200 text-xs focus:ring-0 outline-none placeholder:text-slate-500 font-mono"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* BODY GRID / LIST */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <span className="w-10 h-10 border-4 border-blue-800 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Acessando cadastro de frotas...</p>
        </div>
      ) : filteredViaturas.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/40 rounded-xl border border-slate-850/60 font-sans">
          <Car className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Nenhuma viatura cadastrada ou correspondente aos termos de busca.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-850 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Modelo</th>
                <th className="p-3.5">Placa</th>
                <th className="p-3.5">Chassi / Renavam</th>
                <th className="p-3.5">Observações Operacionais</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300 font-sans">
              {filteredViaturas.map((vtr) => (
                <tr key={vtr.id} className="hover:bg-slate-910/50 transition">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${vtr.ativo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{vtr.modelo}</span>
                  </td>
                  <td className="p-3.5 font-mono text-amber-400 text-sm font-black">{vtr.placa}</td>
                  <td className="p-3.5 font-mono text-slate-450 space-y-1">
                    <p className="block">CHASSI: {vtr.chassi || 'N/D'}</p>
                    <p className="block text-[11px]">RENAVAM: {vtr.renavam || 'N/D'}</p>
                  </td>
                  <td className="p-3.5 text-slate-400 max-w-xs truncate" title={vtr.observacao_operacional}>
                    {vtr.observacao_operacional || <span className="text-slate-600 italic">Sem observações</span>}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleViaturaAtiva(vtr)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold transition cursor-pointer border ${
                        vtr.ativo 
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30'
                          : 'bg-rose-950/50 text-rose-450 border-rose-900/50 hover:bg-rose-900/30'
                      }`}
                    >
                      <Activity className="h-3 w-3" />
                      <span>{vtr.ativo ? 'ATIVA' : 'INATIVA'}</span>
                    </button>
                  </td>
                  <td className="p-3.5 text-center font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(vtr)}
                        className="p-1 px-2 border border-blue-900 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded transition"
                        title="Editar Viatura"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteViatura(vtr.id!, vtr.placa)}
                        className="p-1 px-2 border border-rose-950 text-rose-450 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                        title="Excluir Viatura"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-semibold tracking-wide uppercase font-mono text-amber-400 flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>{editingId ? 'Editar Detalhes da Viatura' : 'Cadastrar Nova Viatura'}</span>
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-450 hover:text-white transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveViatura} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold uppercase mb-1 font-mono">Modelo da Viatura *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Toyota Hilux GLI"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold uppercase mb-1 font-mono">Placa da Viatura *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: OBO-4412"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold uppercase mb-1 font-mono">Status Operacional</label>
                  <select
                    value={ativo ? 'true' : 'false'}
                    onChange={(e) => setAtivo(e.target.value === 'true')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-amber-500"
                  >
                    <option value="true">ATIVA / OPERACIONAL</option>
                    <option value="false">INATIVA / OFICINA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold uppercase mb-1 font-mono">Chassi</label>
                  <input
                    type="text"
                    placeholder="OPCIONAL"
                    value={chassi}
                    onChange={(e) => setChassi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold uppercase mb-1 font-mono">Renavam</label>
                  <input
                    type="text"
                    placeholder="OPCIONAL"
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold uppercase mb-1 font-mono">Observação / Estado Geral da VTR</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Equipada com grade frontal e rádio transceptor digital ativo..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-blue-550"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition font-mono uppercase text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-mono uppercase text-[10px] shadow"
                >
                  Salvar Dados
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
