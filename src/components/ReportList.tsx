/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PoliceReport } from '../types';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Coins, 
  Activity, 
  Trash2, 
  Printer, 
  Download, 
  ExternalLink, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Briefcase, 
  ChevronRight, 
  ShieldAlert, 
  Eye, 
  X,
  FileCheck2
} from 'lucide-react';

interface ReportListProps {
  reports: PoliceReport[];
  onDelete: (id: string) => Promise<boolean>;
  currentUserEmail: string;
}

export default function ReportList({ reports, onDelete, currentUserEmail }: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState('Todos');
  const [onlyWithSeizures, setOnlyWithSeizures] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PoliceReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stats calculation
  const totalReportsCount = reports.length;
  const totalWeapons = reports.reduce((acc, r) => acc + (r.armas_apreendidas || 0), 0);
  const totalAmmo = reports.reduce((acc, r) => acc + (r.municoes || 0), 0);
  const totalDrugsWeightG = reports.reduce((acc, r) => acc + (r.drogas_peso || 0), 0);
  const totalCashValues = reports.reduce((acc, r) => acc + (r.valores || 0), 0);

  // Filter reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.operacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ocorrencias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user_email && r.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.armas_detalhes && r.armas_detalhes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.drogas_detalhes && r.drogas_detalhes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift = selectedShift === 'Todos' || r.turno.includes(selectedShift);
    
    const hasSeizures = r.armas_apreendidas > 0 || r.municoes > 0 || r.drogas_peso > 0 || r.valores > 0;
    const matchesSeizures = !onlyWithSeizures || hasSeizures;

    return matchesSearch && matchesShift && matchesSeizures;
  });

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente excluir permanentemente este relatório RDS-PM?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } catch (err) {
        console.error('Falha ao deletar:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDateString = (dateIso: string) => {
    try {
      const d = new Date(dateIso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateIso;
    }
  };

  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="report-list-container">
      
      {/* SECTION CARD: STATISTICAL OVERVIEW (BENTO STYLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-grid">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Armas Apreendidas</span>
            <span className="p-1.5 bg-blue-950/80 border border-blue-900 text-blue-400 rounded-lg">
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white block tracking-tight font-sans">
              {totalWeapons}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              unidades de fogo registradas
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 text-slate-800/10 opacity-30 pointer-events-none">
            <ShieldAlert className="h-24 w-24" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Munição</span>
            <span className="p-1.5 bg-blue-950/80 border border-blue-900 text-blue-400 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white block tracking-tight font-sans">
              {totalAmmo}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              cartuchos intactos e deflagrados
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 text-slate-800/10 opacity-30 pointer-events-none">
            <TrendingUp className="h-24 w-24" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Drogas Entorpecentes</span>
            <span className="p-1.5 bg-blue-950/80 border border-blue-900 text-blue-400 rounded-lg">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-white block tracking-tight font-sans">
              {totalDrugsWeightG >= 1000 ? `${(totalDrugsWeightG / 1000).toFixed(2)} kg` : `${totalDrugsWeightG} g`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              peso total de drogas retidas
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 text-slate-800/10 opacity-30 pointer-events-none">
            <Activity className="h-24 w-24" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Dinheiro / Valores</span>
            <span className="p-1.5 bg-emerald-950/80 border border-emerald-900 text-emerald-400 rounded-lg">
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-400 block tracking-tight font-sans">
              {formatCurrency(totalCashValues)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              valores recuperados/apreendidos
            </span>
          </div>
          <div className="absolute -bottom-6 -right-6 text-emerald-800/5 opacity-30 pointer-events-none">
            <Coins className="h-24 w-24" />
          </div>
        </div>
      </div>

      {/* FILTER & INTERACTIVE SEARCH CONTROLS */}
      <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-md flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" id="search-filter-controls">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Operação, apreensões ou descritivo..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        {/* Select Shift Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Turno:</span>
          </div>
          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['Todos', 'Vespertino', 'Noturno', 'Matutino'].map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => setSelectedShift(sh)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedShift === sh 
                    ? 'bg-blue-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sh}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 hover:border-slate-750 px-3 py-1.5 rounded-lg transition">
            <input
              type="checkbox"
              checked={onlyWithSeizures}
              onChange={(e) => setOnlyWithSeizures(e.target.checked)}
              className="rounded accent-amber-400 border-slate-800 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-xs text-slate-300 font-medium">Apenas com Apreensões</span>
          </label>
        </div>
      </div>

      {/* REPORTS LISTING */}
      {filteredReports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-12 text-center" id="empty-search-state">
          <FileCheck2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">Nenhum relatório localizado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente redefinir os filtros corporativos ou realizar outra busca digitando novos calibres, operações ou palavras-chave.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="reports-grid-list">
          {filteredReports.map((report) => {
            const hasAnyApreensão = report.armas_apreendidas > 0 || report.municoes > 0 || report.drogas_peso > 0 || report.valores > 0;

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-slate-900 border border-slate-850 hover:border-slate-700/80 rounded-xl p-5 shadow-md flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-lg group"
              >
                <div>
                  {/* Operation Header */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/60 rounded px-2 py-0.5 font-mono uppercase mb-1 font-semibold">
                        {report.turno.split(' (')[0]}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition mb-0.5 line-clamp-1">
                        {report.operacao}
                      </h4>
                    </div>
                    {/* View Details Button icon */}
                    <span className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg group-hover:bg-blue-950 group-hover:border-blue-950 group-hover:text-blue-400 transition duration-150">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>

                  {/* Summary/Narrative snippet */}
                  <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed mb-4 font-normal">
                    {report.ocorrencias}
                  </p>
                </div>

                {/* Footer specs / Seized quick stats */}
                <div className="border-t border-slate-800/80 pt-3 mt-1 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <User className="h-3 w-3 text-slate-600" />
                      {report.user_email ? report.user_email.split('@')[0] : 'Admin'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-600" />
                      {formatDateString(report.created_at)}
                    </span>
                  </div>

                  {/* Badges of apprehensions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] bg-slate-955 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                      EFETIVO: <strong className="text-slate-200">{report.efetivo}</strong>
                    </span>
                    <span className="text-[10px] bg-slate-955 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                      VTRS: <strong className="text-slate-200">{report.viaturas}</strong>
                    </span>
                    
                    {report.armas_apreendidas > 0 && (
                      <span className="text-[10px] bg-red-950/40 border border-red-900/60 text-red-400 rounded px-1.5 py-0.5 font-mono font-semibold">
                        ARMAS: {report.armas_apreendidas}
                      </span>
                    )}

                    {report.municoes > 0 && (
                      <span className="text-[10px] bg-amber-950/30 border border-amber-900/40 text-amber-300 rounded px-1.5 py-0.5 font-mono font-semibold">
                        MUNIÇÕES: {report.municoes}
                      </span>
                    )}

                    {report.drogas_peso > 0 && (
                      <span className="text-[10px] bg-blue-950/40 border border-blue-900/50 text-blue-400 rounded px-1.5 py-0.5 font-mono font-semibold">
                        DROGAS: {report.drogas_peso}g
                      </span>
                    )}

                    {report.valores > 0 && (
                      <span className="text-[10px] bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded px-1.5 py-0.5 font-mono font-semibold">
                        VALORES: R$ {report.valores}
                      </span>
                    )}
                  </div>

                  {/* Operational actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReport(report);
                      }}
                      className="text-xs font-mono font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-slate-950 border border-slate-800/80 px-2 py-1 rounded"
                    >
                      <Eye className="h-3 w-3" />
                      Visualizar Documento
                    </button>

                    {(currentUserEmail === report.user_email || report.id.startsWith('report-local-')) && (
                      <button
                        type="button"
                        disabled={deletingId === report.id}
                        onClick={(e) => handleDeleteClick(e, report.id)}
                        className="text-xs font-mono font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-slate-950 border border-slate-800/80 px-2.5 py-1 rounded hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED OFFICIAL MILITARY REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="document-modal-overlay">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative my-8" id="document-modal-card">
            
            {/* Header Toolbar */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center gap-4 sticky top-0 rounded-t-xl z-20">
              <span className="text-xs font-semibold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-amber-400" />
                <span>Modo de Visualização Militar Oficial</span>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="bg-blue-800 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 bg-slate-850 text-slate-400 hover:text-slate-205 rounded hover:bg-slate-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* PRINT AREA / OFFICIAL MARGINS */}
            <div className="p-8 md:p-12 text-slate-900 bg-white" id="printable-report-paper">
              {/* Brazil/MT State Crest Placeholder & Official Heading */}
              <div className="text-center border-b-2 border-double border-slate-800 pb-6 mb-6">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-900">
                  ESTADO DE MATO GROSSO
                </div>
                <div className="text-xs font-normal uppercase tracking-wide text-slate-800">
                  SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-slate-950 mt-1">
                  POLÍCIA MILITAR DE MATO GROSSO
                </div>
                <div className="text-[10px] font-mono font-medium text-slate-600 mt-0.5">
                  DIRETORIA DE METROPOLITANA / SEÇÃO DE OPERAÇÕES • RDS-PM
                </div>

                <h2 className="text-lg font-black tracking-wider text-slate-950 uppercase mt-4 border border-slate-800 inline-block px-4 py-1">
                  RELATÓRIO DIÁRIO DE SERVIÇO GERAL (RDS)
                </h2>
                <div className="text-[11px] font-mono text-slate-600 mt-2">
                  Nº Sequencial do Sistema: <strong className="text-slate-900">{selectedReport.id}</strong>
                </div>
              </div>

              {/* Grid 1: Identificação */}
              <div className="mb-6">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-900 border-b border-slate-400 pb-1 mb-2.5">
                  1. IDENTIFICAÇÃO E RECURSOS EMPREGADOS
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">OPERACAO</span>
                    <span className="font-bold text-slate-900">{selectedReport.operacao}</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">ESCALA / TURNO</span>
                    <span className="font-bold text-slate-900">{selectedReport.turno}</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">CONFECÇÃO</span>
                    <span className="font-bold text-slate-900">{formatDateString(selectedReport.created_at)}</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">DIGITALIZADOR</span>
                    <span className="font-bold text-slate-900 truncate block">{selectedReport.user_email || 'Seção Admin'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans mt-3">
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">POLICIAIS (EFETIVO)</span>
                    <span className="font-bold text-slate-900">{selectedReport.efetivo} militares</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">VIATURAS (VTR)</span>
                    <span className="font-bold text-slate-900">{selectedReport.viaturas} empenhadas</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">ORGÃO CENTRAL</span>
                    <span className="font-bold text-slate-900">MT - Brasil</span>
                  </div>
                  <div className="border border-slate-200 p-2.5 bg-slate-50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">STATUS</span>
                    <span className="font-bold text-emerald-700">✓ HOMOLOGADO</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Produtividade */}
              <div className="mb-6">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-900 border-b border-slate-400 pb-1 mb-2.5">
                  2. QUADRO RESUMO DE PRODUTIVIDADE OPERACIONAL
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-sans">
                  <div className="border border-slate-300 p-2">
                    <span className="block text-[9px] font-mono text-slate-500 font-bold uppercase">ARMAS</span>
                    <span className="text-base font-black text-slate-900">{selectedReport.armas_apreendidas}</span>
                  </div>
                  <div className="border border-slate-300 p-2">
                    <span className="block text-[9px] font-mono text-slate-500 font-bold uppercase">MUNIÇÕES</span>
                    <span className="text-base font-black text-slate-900">{selectedReport.municoes}</span>
                  </div>
                  <div className="border border-slate-300 p-2">
                    <span className="block text-[9px] font-mono text-slate-500 font-bold uppercase">DROGAS (G)</span>
                    <span className="text-base font-black text-slate-900">{selectedReport.drogas_peso}g</span>
                  </div>
                  <div className="border border-slate-300 p-2">
                    <span className="block text-[9px] font-mono text-slate-500 font-bold uppercase">VALOR RECURSIVO</span>
                    <span className="text-base font-black text-emerald-800">{formatCurrency(selectedReport.valores)}</span>
                  </div>
                </div>

                {/* Seized details block inside document */}
                {(selectedReport.armas_apreendidas > 0 || selectedReport.municoes > 0 || selectedReport.drogas_peso > 0 || selectedReport.valores > 0) && (
                  <div className="mt-3 border border-slate-200 p-4 bg-slate-50/50 text-xs font-sans space-y-2">
                    <span className="block text-[10px] font-mono text-slate-600 font-black uppercase tracking-wider mb-1">DETALHAMENTO ASSOCIADO DAS APREENSÕES:</span>
                    {selectedReport.armas_apreendidas > 0 && (
                      <div>• <strong>Armas: </strong>{selectedReport.armas_detalhes || 'Sem descrição cadastrada'}</div>
                    )}
                    {selectedReport.municoes > 0 && (
                      <div>• <strong>Munições: </strong>{selectedReport.municoes_detalhes || 'Sem descrição cadastrada'}</div>
                    )}
                    {selectedReport.drogas_peso > 0 && (
                      <div>• <strong>Drogas: </strong>{selectedReport.drogas_detalhes || 'Sem descrição de drogas'}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid 3: Histórico Narrativo */}
              <div className="mb-10">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-900 border-b border-slate-400 pb-1 mb-2.5">
                  3. RELATÓRIO NARRATIVO OPERACIONAL / OCORRÊNCIAS
                </h3>
                <div className="border border-slate-300 p-4 bg-slate-50 text-xs text-slate-900 leading-relaxed font-sans min-h-[180px] whitespace-pre-wrap">
                  {selectedReport.ocorrencias}
                </div>
              </div>

              {/* Signature lines */}
              <div className="mt-12 pt-8 border-t border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs font-mono">
                <div className="space-y-1">
                  <div className="w-48 border-b border-slate-400 mx-auto mt-6" />
                  <span className="block font-bold text-slate-900">{selectedReport.user_email || 'POLICIAL MILITAR CONFECTOR'}</span>
                  <span className="block text-[10px] text-slate-650">Comandante de Guarnição / Responsável de Turno</span>
                </div>
                <div className="space-y-1">
                  <div className="w-48 border-b border-slate-400 mx-auto mt-6" />
                  <span className="block font-bold text-slate-900">SEÇÃO DE ARQUIVO OPERACIONAL</span>
                  <span className="block text-[10px] text-slate-650">Homologado Eletronicamente via RDS-PM</span>
                </div>
              </div>
            </div>

            {/* Print Footer Notice */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-center rounded-b-xl z-25">
              <span className="text-[10px] font-mono text-slate-550 leading-relaxed">
                Este documento é de uso restritivo policial e foi lavrado em acordo com o Código de Processo Penal e normas administrativas da Seção de TI & Estatística da PMMT.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
