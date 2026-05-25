/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LISTA_POLICIAIS_PMMT, OBTER_NOME_GUERRA_OU_ABREVIADO, OBTER_PESO_PATENTE, PolicialPMMT } from '../data/policiais';
import { Search, User, ChevronDown, X, Check, Star } from 'lucide-react';

interface PolicialSearchSelectProps {
  value?: PolicialPMMT | null;
  onChange: (policial: PolicialPMMT | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  excludeMatriculas?: string[];
  autoSelectHighestRank?: boolean;
  multiple?: false;
}

interface PolicialMultiSelectProps {
  value?: PolicialPMMT[];
  onChange: (policiais: PolicialPMMT[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  excludeMatriculas?: string[];
  multiple: true;
  maxSelections?: number;
}

type Props = PolicialSearchSelectProps | PolicialMultiSelectProps;

export default function PolicialSearchSelect(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState('TODOS');

  const isMultiple = 'multiple' in props && props.multiple;

  const filteredPoliciais = useMemo(() => {
    return LISTA_POLICIAIS_PMMT.filter(p => {
      const textMatch =
        p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.matricula.includes(searchTerm) ||
        p.graduacao.toLowerCase().includes(searchTerm.toLowerCase());

      if (rankFilter === 'TODOS') return textMatch;
      if (rankFilter === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
      if (rankFilter === 'TEN') return textMatch && p.graduacao.includes('TEN');
      if (rankFilter === 'SGT') return textMatch && p.graduacao.includes('SGT');
      if (rankFilter === 'CB') return textMatch && p.graduacao.startsWith('CB');
      if (rankFilter === 'SD') return textMatch && p.graduacao.startsWith('SD');
      return textMatch;
    }).filter(p => {
      if (props.excludeMatriculas && props.excludeMatriculas.includes(p.matricula)) {
        return false;
      }
      return true;
    });
  }, [searchTerm, rankFilter, props.excludeMatriculas]);

  const handleSelect = (policial: PolicialPMMT) => {
    if (isMultiple) {
      const current = (props as PolicialMultiSelectProps).value || [];
      const exists = current.some(p => p.matricula === policial.matricula);
      if (exists) {
        const updated = current.filter(p => p.matricula !== policial.matricula);
        (props as PolicialMultiSelectProps).onChange(updated);
      } else {
        const maxSelections = (props as PolicialMultiSelectProps).maxSelections;
        if (maxSelections && current.length >= maxSelections) {
          return;
        }
        (props as PolicialMultiSelectProps).onChange([...current, policial]);
      }
    } else {
      (props as PolicialSearchSelectProps).onChange(policial);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultiple) {
      (props as PolicialMultiSelectProps).onChange([]);
    } else {
      (props as PolicialSearchSelectProps).onChange(null);
    }
  };

  const selectedLabel = useMemo(() => {
    if (isMultiple) {
      const selected = (props as PolicialMultiSelectProps).value || [];
      if (selected.length === 0) return props.placeholder || 'Selecionar policiais...';
      if (selected.length === 1) return `${selected[0].graduacao} ${OBTER_NOME_GUERRA_OU_ABREVIADO(selected[0].graduacao, selected[0].nome_completo).replace(selected[0].graduacao, '').trim()}`;
      return `${selected.length} policiais selecionados`;
    } else {
      const selected = (props as PolicialSearchSelectProps).value;
      if (!selected) return props.placeholder || 'Selecionar policial...';
      return `${selected.graduacao} ${OBTER_NOME_GUERRA_OU_ABREVIADO(selected.graduacao, selected.nome_completo).replace(selected.graduacao, '').trim()}`;
    }
  }, [props.value, isMultiple]);

  const hasSelection = isMultiple
    ? ((props as PolicialMultiSelectProps).value?.length || 0) > 0
    : !!(props as PolicialSearchSelectProps).value;

  return (
    <div className="relative">
      {props.label && (
        <label className="block text-[10px] text-slate-400 font-sans mb-1">{props.label}</label>
      )}

      <button
        type="button"
        onClick={() => !props.disabled && setIsOpen(!isOpen)}
        disabled={props.disabled}
        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500 transition flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${!hasSelection ? 'text-slate-500' : ''}`}>
          {selectedLabel}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasSelection && (
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
                placeholder="Buscar nome ou matrícula..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded py-1.5 pl-7 pr-2 outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {['TODOS', 'CAP', 'TEN', 'SGT', 'CB', 'SD'].map((rank) => (
                <button
                  key={rank}
                  type="button"
                  onClick={() => setRankFilter(rank)}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    rankFilter === rank
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredPoliciais.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">
                Nenhum policial encontrado
              </div>
            ) : (
              filteredPoliciais.map((pol) => {
                const isSelected = isMultiple
                  ? (props as PolicialMultiSelectProps).value?.some(p => p.matricula === pol.matricula)
                  : (props as PolicialSearchSelectProps).value?.matricula === pol.matricula;

                return (
                  <button
                    key={pol.matricula}
                    type="button"
                    onClick={() => handleSelect(pol)}
                    className={`w-full p-2 text-left text-xs flex items-center justify-between hover:bg-slate-900/50 transition border-b border-slate-900/40 ${
                      isSelected ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <User className={`h-3 w-3 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className={`font-semibold ${isSelected ? 'text-amber-200' : 'text-white'}`}>
                          {OBTER_NOME_GUERRA_OU_ABREVIADO(pol.graduacao, pol.nome_completo)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono">Mat: {pol.matricula}</span>
                        {OBTER_PESO_PATENTE(pol.graduacao) >= 50 && (
                          <Star className="h-2.5 w-2.5 text-amber-500" />
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                  </button>
                );
              })
            )}
          </div>

          {isMultiple && (
            <div className="p-2 border-t border-slate-800 bg-slate-900/50">
              <div className="text-[10px] text-slate-500 text-center">
                {((props as PolicialMultiSelectProps).value?.length || 0)} policiais selecionados
                {(props as PolicialMultiSelectProps).maxSelections && (
                  <span className="ml-1">
                    (máx. {(props as PolicialMultiSelectProps).maxSelections})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
