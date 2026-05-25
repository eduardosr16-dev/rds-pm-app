/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { CatalogoViatura } from '../types';
import { Car, Search, ChevronDown, X, Check, CircleAlert as AlertCircle } from 'lucide-react';

const LOCAL_VIATURAS: CatalogoViatura[] = [
  { prefixo: 'VTR-1919', modelo: 'Toyota Hilux', placa: 'OPI-0001', ativo: true },
  { prefixo: 'VTR-1920', modelo: 'Toyota Hilux', placa: 'OPI-0002', ativo: true },
  { prefixo: 'VTR-1921', modelo: 'Renault Duster', placa: 'OPI-0003', ativo: true },
  { prefixo: 'VTR-1922', modelo: 'Renault Duster', placa: 'OPI-0004', ativo: true },
  { prefixo: 'VTR-1923', modelo: 'Fiat Toro', placa: 'OPI-0005', ativo: true },
  { prefixo: 'VTR-1924', modelo: 'Fiat Toro', placa: 'OPI-0006', ativo: true },
  { prefixo: 'VTR-1925', modelo: 'Chevrolet S10', placa: 'OPI-0007', ativo: true },
  { prefixo: 'VTR-1926', modelo: 'Chevrolet S10', placa: 'OPI-0008', ativo: true },
  { prefixo: 'VTR-1927', modelo: 'Ford Ranger', placa: 'OPI-0009', ativo: true },
  { prefixo: 'VTR-1928', modelo: 'Ford Ranger', placa: 'OPI-0010', ativo: true },
  { prefixo: 'VTR-1929', modelo: 'Toyota Corolla', placa: 'OPI-0011', ativo: true },
  { prefixo: 'VTR-1930', modelo: 'Toyota Corolla', placa: 'OPI-0012', ativo: true },
  { prefixo: 'MOTO-001', modelo: 'Honda CB 500', placa: 'MOT-0001', ativo: true },
  { prefixo: 'MOTO-002', modelo: 'Honda CB 500', placa: 'MOT-0002', ativo: true },
  { prefixo: 'MOTO-003', modelo: 'Yamaha MT 07', placa: 'MOT-0003', ativo: true },
];

interface ViaturaSelectProps {
  value?: CatalogoViatura | null;
  onChange: (viatura: CatalogoViatura | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  onKmInicialSuggestion?: (km: number) => void;
}

export default function ViaturaSelect({
  value,
  onChange,
  placeholder = 'Selecionar viatura...',
  label,
  disabled,
  onKmInicialSuggestion
}: ViaturaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viaturas, setViaturas] = useState<CatalogoViatura[]>(LOCAL_VIATURAS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      setLoading(true);
      supabase
        .from('catalogo_viaturas')
        .select('*')
        .eq('ativo', true)
        .order('prefixo')
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setViaturas(data);
          }
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (value && onKmInicialSuggestion && isSupabaseConfigured() && supabase) {
      // Fetch last km_final for this viatura
      supabase
        .rpc('get_last_km_final', { p_viatura_prefixo: value.prefixo })
        .then(({ data, error }) => {
          if (!error && data !== null && data !== undefined) {
            onKmInicialSuggestion(Number(data));
          }
        });
    }
  }, [value?.prefixo]);

  const filteredViaturas = useMemo(() => {
    return viaturas.filter(v => {
      const textMatch =
        v.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.placa && v.placa.toLowerCase().includes(searchTerm.toLowerCase()));
      return textMatch;
    });
  }, [viaturas, searchTerm]);

  const handleSelect = (viatura: CatalogoViatura) => {
    onChange(viatura);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-[10px] text-slate-400 font-sans mb-1">{label}</label>
      )}

      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500 transition flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="text-slate-400">Carregando viaturas...</span>
        ) : value ? (
          <span className="flex items-center gap-2">
            <Car className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono">{value.prefixo}</span>
            <span className="text-slate-400">- {value.modelo}</span>
          </span>
        ) : (
          <span className="text-slate-500">{placeholder}</span>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-red-400 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prefixo ou modelo..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded py-1.5 pl-7 pr-2 outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredViaturas.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">
                Nenhuma viatura encontrada
              </div>
            ) : (
              filteredViaturas.map((v) => {
                const isSelected = value?.prefixo === v.prefixo;
                return (
                  <button
                    key={v.prefixo}
                    type="button"
                    onClick={() => handleSelect(v)}
                    className={`w-full p-2 text-left text-xs flex items-center justify-between hover:bg-slate-900/50 transition border-b border-slate-900/40 ${
                      isSelected ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Car className={`h-3 w-3 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className={`font-mono font-bold ${isSelected ? 'text-amber-200' : 'text-white'}`}>
                          {v.prefixo}
                        </span>
                        <span className="text-slate-400">- {v.modelo}</span>
                      </div>
                      {v.placa && (
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Placa: {v.placa}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
