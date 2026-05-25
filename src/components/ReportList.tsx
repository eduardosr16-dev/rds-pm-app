/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PoliceReport } from '../types';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Coins, 
  Activity, 
  Trash2, 
  Printer, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  ShieldAlert, 
  Eye, 
  X,
  FileCheck2,
  Paperclip,
  CheckCircle,
  FileSpreadsheet,
  Users,
  Car,
  Briefcase,
  Layers,
  ArrowUpDown,
  Laptop,
  PlusCircle,
  ChevronDown,
  Info
} from 'lucide-react';

interface ReportListProps {
  reports: PoliceReport[];
  onDelete: (id: string) => Promise<boolean>;
  currentUserEmail: string;
  onNavigateToForm?: () => void;
}

export default function ReportList({ reports, onDelete, currentUserEmail, onNavigateToForm }: ReportListProps) {
  // Mobile and interactive state tabs
  // 'dashboard' | 'records'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records'>('records');
  
  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState('Todos');
  const [onlyWithSeizures, setOnlyWithSeizures] = useState(false);
  
  // Advanced search specs (Requested: Pesquisar por data, Pesquisar por policial, Relatórios do mês)
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [horaInicial, setHoraInicial] = useState<string>('');
  const [horaFinal, setHoraFinal] = useState<string>('');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('Todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos'); // Formato YYYY-MM
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState<PoliceReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Toggle filter visibility on mobile
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Compute distinct commanders/officers on the current dataset for dropdown selection
  const commandersList = useMemo(() => {
    const set = new Set<string>();
    (reports || []).forEach(r => {
      if (r && r.comandante_responsavel) set.add(r.comandante_responsavel.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  // Compute distinct months present on the dataset (format: YYYY-MM)
  const monthsList = useMemo(() => {
    const list: { val: string; label: string }[] = [];
    const keys = new Set<string>();
    
    // Sort reports chronologically to order months
    const sortedReports = [...(reports || [])].sort((a, b) => {
      const b_created = b?.created_at || '';
      const a_created = a?.created_at || '';
      return b_created.localeCompare(a_created);
    });
    
    sortedReports.forEach(r => {
      if (!r || !r.created_at) return;
      try {
        const d = new Date(r.created_at);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const key = `${year}-${month}`;
          
          if (!keys.has(key)) {
            keys.add(key);
            const monthNames = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            list.push({
              val: key,
              label: `${monthNames[d.getMonth()]} de ${year}`
            });
          }
        }
      } catch (e) {
        // Keep moving
      }
    });
    return list;
  }, [reports]);

  // Chronological sort to calculate dynamic sequence numbers
  const sortedChronologically = useMemo(() => {
    if (!reports || !Array.isArray(reports)) return [];
    return [...reports].sort((a, b) => {
      const dateA = a?.created_at || '';
      const dateB = b?.created_at || '';
      return dateA.localeCompare(dateB);
    });
  }, [reports]);

  // Dynamic automatic document numbering builder
  const getReportDocNumber = (report: PoliceReport) => {
    if (!report) return 'Nº 001/2026';
    const reportIdStr = String(report.id || '');
    const idx = sortedChronologically.findIndex(r => String(r?.id || '') === reportIdStr);
    const seqNum = idx !== -1 ? idx + 1 : 1;
    const formattedSeq = String(seqNum).padStart(3, '0');
    const dateObj = new Date(report?.created_at || '');
    const year = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();
    return `Nº ${formattedSeq}/${year}`;
  };

  // Handle Preset Fast Dates
  const handleSetDateRangePreset = (preset: 'hoje' | '7dias' | 'esteMes' | 'todos') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (preset === 'hoje') {
      setDateStart(todayStr);
      setDateEnd(todayStr);
    } else if (preset === '7dias') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setDateStart(past.toISOString().split('T')[0]);
      setDateEnd(todayStr);
    } else if (preset === 'esteMes') {
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setDateStart(startOfMonth);
      setDateEnd(todayStr);
    } else {
      setDateStart('');
      setDateEnd('');
      setHoraInicial('');
      setHoraFinal('');
    }
  };

  // Main reports filtering algorithm
  const filteredReports = useMemo(() => {
    if (!reports || !Array.isArray(reports)) return [];
    return reports.filter(r => {
      if (!r) return false;
      const rOperacao = r.operacao || '';
      const rOcorrencias = r.ocorrencias || '';
      const rUserEmail = r.user_email || '';
      const rArmasDetalhes = r.armas_detalhes || '';
      const rDrogasDetalhes = r.drogas_detalhes || '';
      const rCidade = r.cidade || '';
      const rComandante = r.comandante_responsavel || '';
      const rTurno = r.turno || '';

      // 1. Term Search matching
      const matchesSearch = 
        rOperacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rOcorrencias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rUserEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rArmasDetalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rDrogasDetalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rCidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rComandante.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Shift selection (1º Turno includes 1º, Diurno, Matutino, Vespertino; 2º Turno includes 2º, Noturno)
      const matchesShift = selectedShift === 'Todos' || 
        (selectedShift === '1º Turno' && (rTurno.includes('1º') || rTurno.toLowerCase().includes('matutino') || rTurno.toLowerCase().includes('vespertino') || rTurno.toLowerCase().includes('diurno'))) ||
        (selectedShift === '2º Turno' && (rTurno.includes('2º') || rTurno.toLowerCase().includes('noturno') || rTurno.toLowerCase().includes('segundo')));
      
      // 3. Seizure focus checkbox
      const hasSeizures = (r.armas_apreendidas || 0) > 0 || (r.municoes || 0) > 0 || (r.drogas_peso || 0) > 0 || (r.valores || 0) > 0;
      const matchesSeizures = !onlyWithSeizures || hasSeizures;

      // 4. Custom Date Range matching YYYY-MM-DD
      const reportDateStr = (r.created_at || '').split('T')[0] || '';
      const matchesDateStart = !dateStart || reportDateStr >= dateStart;
      const matchesDateEnd = !dateEnd || reportDateStr <= dateEnd;

      // 5. Policial name selection
      const matchesOfficer = selectedOfficer === 'Todos' || r.comandante_responsavel === selectedOfficer;

      // 6. Selected Month filter YYYY-MM
      let matchesMonth = true;
      if (selectedMonth !== 'Todos') {
        const reportMonth = reportDateStr.substring(0, 7); // "YYYY-MM"
        matchesMonth = reportMonth === selectedMonth;
      }

      // 7. Hourly service filter comparison (Hora Inicial / Hora Final)
      let matchesTimeRange = true;
      if (horaInicial || horaFinal) {
        let reportTime = '';
        if (r.horario_servico && r.horario_servico.includes(' às ')) {
          reportTime = r.horario_servico.split(' às ')[0].trim(); // Ex: "07:00"
        } else if (r.created_at) {
          try {
            const timePart = r.created_at.split('T')[1];
            if (timePart) {
              reportTime = timePart.substring(0, 5); // Ex: "10:15"
            }
          } catch (e) {}
        }

        if (reportTime && /^\d{2}:\d{2}$/.test(reportTime)) {
          if (horaInicial) {
            matchesTimeRange = matchesTimeRange && reportTime >= horaInicial;
          }
          if (horaFinal) {
            matchesTimeRange = matchesTimeRange && reportTime <= horaFinal;
          }
        }
      }

      return matchesSearch && matchesShift && matchesSeizures && matchesDateStart && matchesDateEnd && matchesOfficer && matchesMonth && matchesTimeRange;
    });
  }, [reports, searchTerm, selectedShift, onlyWithSeizures, dateStart, dateEnd, selectedOfficer, selectedMonth, horaInicial, horaFinal]);

  // Aggregate metrics calculation on filtered subset
  const stats = useMemo(() => {
    let weapons = 0;
    let ammo = 0;
    let drugs = 0;
    let cash = 0;
    let registeredVtrs = 0;
    let actualOfficers = 0;
    let suspeitosConduzidos = 0;
    
    // Nature counts
    const natures: { [key: string]: number } = {};
    // Cities counts
    const cities: { [key: string]: number } = {};
    // Shift counts
    const shiftMap = { Primeiro: 0, Segundo: 0, Outros: 0 };
    // KM distance
    let kmTravelled = 0;

    filteredReports.forEach(r => {
      if (!r) return;
      weapons += r.armas_apreendidas || 0;
      ammo += r.municoes || 0;
      drugs += r.drogas_peso || 0;
      cash += r.valores || 0;
      registeredVtrs += r.viaturas || 0;
      actualOfficers += r.efetivo || 0;

      // Count shift distribution
      const shiftName = (r.turno || '').toLowerCase();
      if (shiftName.includes('2º') || shiftName.includes('segundo') || shiftName.includes('noturno')) {
        shiftMap.Segundo += 1;
      } else if (shiftName.includes('1º') || shiftName.includes('primeiro') || shiftName.includes('diurno') || shiftName.includes('matutino') || shiftName.includes('vespertino')) {
        shiftMap.Primeiro += 1;
      } else {
        shiftMap.Outros += 1;
      }

      // Compile City counts
      const city = r.cidade || 'Cuiabá';
      cities[city] = (cities[city] || 0) + 1;

      // Core suspects from occurrences
      if (r.lista_ocorrencias) {
        r.lista_ocorrencias.forEach(oco => {
          suspeitosConduzidos += oco.suspeitos_conduzidos || 0;
          const nature = oco.natureza_ocorrencia || 'Outras Ocorrências';
          natures[nature] = (natures[nature] || 0) + 1;
        });
      }

      // Accrued KM
      if (r.lista_viaturas) {
        r.lista_viaturas.forEach(v => {
          if (v.km_final && v.km_inicial && v.km_final >= v.km_inicial) {
            kmTravelled += (v.km_final - v.km_inicial);
          }
        });
      }
    });

    // Sort natures descending
    const topNatures = Object.entries(natures)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    const topCities = Object.entries(cities)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val);

    return {
      weapons,
      ammo,
      drugs,
      cash,
      registeredVtrs,
      actualOfficers,
      suspeitosConduzidos,
      topNatures,
      topCities,
      shifts: shiftMap,
      kmTravelled,
      count: filteredReports.length
    };
  }, [filteredReports]);

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente excluir permanentemente este relatório RDS-PM?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
        if (selectedReport && String(selectedReport.id) === String(id)) {
          setSelectedReport(null);
        }
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

  const totalReportsEver = reports.length;

  return (
    <div className="space-y-6" id="dashboard-institucional-container">
      
      {/* INSTITUTIONAL SUB HEADER BANNER WITH TOTALIZERS */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-805 rounded-2xl p-6 md:p-10 shadow-2xl overflow-hidden" id="pmmt-badge-banner">
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30 pointer-events-none" />
        
        {/* Subtle radial glow from gold badge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-56 w-80 rounded-full opacity-15 blur-3xl pointer-events-none bg-gradient-to-tr from-amber-500 to-blue-500"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* PMMT Official Crest */}
          <div className="relative mb-5 flex items-center justify-center w-24 h-24 bg-slate-950/50 rounded-full border border-slate-800/80 p-2.5 shadow-2xl transition hover:border-amber-500/30">
            {/* Soft gold glow behind the crest */}
            <div className="absolute inset-x-0 inset-y-0 bg-amber-500/5 rounded-full blur-md animate-pulse" />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
              alt="Brasão Oficial PMMT" 
              className="relative w-20 h-20 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.45)] select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Institutional Heading lines */}
          <div className="space-y-1.5 select-none text-center max-w-2xl">
            <h2 className="text-[10px] sm:text-xs md:text-sm font-black tracking-[0.22em] text-slate-100 font-sans uppercase">
              Polícia Militar do Estado de Mato Grosso
            </h2>
            <h3 className="text-[10px] sm:text-xs font-bold tracking-[0.15em] text-slate-300 font-sans uppercase">
              13º Comando Regional / Médio Araguaia
            </h3>
            <h4 className="text-[9px] sm:text-[11px] font-medium tracking-[0.1em] text-amber-500/90 font-sans uppercase">
              19ª Companhia de Polícia Militar de Querência
            </h4>
          </div>

          {/* Double Separator Line */}
          <div className="w-full max-w-xl my-5 flex items-center justify-center gap-3">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-slate-700 flex-1" />
            <div className="h-[2px] w-16 bg-amber-500 rounded-full shadow-lg shadow-amber-550/30" />
            <div className="h-[1px] bg-gradient-to-l from-transparent via-slate-700 to-slate-700 flex-1" />
          </div>

          {/* Document Type Title */}
          <div className="text-center space-y-1 mb-4 select-none">
            <span className="text-[9px] sm:text-[10px] font-bold font-mono tracking-[0.25em] text-amber-500/95 uppercase">
              Documento Oficial de Serviço
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-sans tracking-[0.12em] uppercase drop-shadow-md">
              01 - RELATÓRIO DIÁRIO
            </h1>
          </div>

          {/* Document numbering stamp and badge */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 shadow-lg">
            <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider font-bold text-slate-400 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Série Geral Eletrônica</span>
            </div>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-slate-850" />
            <span className="text-sm md:text-base font-black font-mono text-amber-400 tracking-wider">
              Nº {String(reports.length || 1).padStart(3, '0')}/{new Date().getFullYear()}
            </span>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-slate-850" />
            <div className="text-[10px] font-mono text-slate-400">
              {stats.count} RDS / {totalReportsEver} Cadastrados
            </div>
          </div>

          {/* Quick launch shortcut inside banner */}
          {onNavigateToForm && (
            <button
              type="button"
              onClick={onNavigateToForm}
              className="mt-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold px-4.5 py-2.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-amber-950/30 font-sans tracking-wider"
            >
              <PlusCircle className="h-4 w-4 text-slate-950" />
              <span>PREENCHER NOVO RDS</span>
            </button>
          )}

        </div>
      </div>

      {/* SEARCH AND CONTROL TOWER PANEL */}
      <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 md:p-5 shadow-lg space-y-4" id="police-control-tower">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold font-sans text-slate-200">Filtros Avançados de Auditoria</h3>
          </div>
          
          <button
            type="button"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="md:hidden text-xs text-blue-400 font-semibold flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md"
          >
            <span>{filtersExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${filtersExpanded ? 'block' : 'hidden md:grid'}`} id="filters-interactive-block">
          
          {/* SEARCH FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Search className="h-3 w-3 text-slate-500" />
              <span>Busca textual</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Operação, cidade, palavras..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-3 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2 px-1.5 py-1 text-slate-400 hover:text-white top-1/2 -translate-y-1/2 text-[10px] font-sans font-bold"
                >
                  X
                </button>
              )}
            </div>
          </div>

          {/* POLICE OFFICER SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-500" />
              <span>Comandante / Policial</span>
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition cursor-pointer"
            >
              <option value="Todos">Todos os Militares</option>
              {commandersList.map(off => (
                <option key={off} value={off}>{off}</option>
              ))}
            </select>
          </div>

          {/* CHOOSE TARGET MONTH (Relatórios do Mês) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span>Relatórios do Mês</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition cursor-pointer"
            >
              <option value="Todos">Todos os Meses</option>
              {monthsList.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* TURN / SHIFT FILTER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>Turno Operacional</span>
            </label>
            <div className="flex gap-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              {['Todos', '1º Turno', '2º Turno'].map((sh) => {
                const isActive = selectedShift === sh;
                return (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSelectedShift(sh)}
                    className={`flex-1 text-center py-1.5 text-[10px] font-extrabold rounded transition-all ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sh}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ADVANCED DATE RANGE (Pesquisar por data) & FAST ACTION CHECKS */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-indigo-950/40 ${filtersExpanded ? 'block' : 'hidden md:grid'}`} id="date-range-segment">
          
          {/* Calendar picker dates & Time ranges */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block flex items-center gap-1 leading-none select-none">
                <Calendar className="h-3 w-3 text-amber-500" />
                <span>Início da Ronda</span>
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none focus:border-amber-400 [color-scheme:dark] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block flex items-center gap-1 leading-none select-none">
                <Calendar className="h-3 w-3 text-amber-500" />
                <span>Término da Ronda</span>
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none focus:border-amber-400 [color-scheme:dark] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block flex items-center gap-1 leading-none select-none">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Hora Inicial</span>
              </span>
              <div className="relative">
                <input
                  type="time"
                  value={horaInicial}
                  onChange={(e) => setHoraInicial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none focus:border-amber-400 [color-scheme:dark] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block flex items-center gap-1 leading-none select-none">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Hora Final</span>
              </span>
              <div className="relative">
                <input
                  type="time"
                  value={horaFinal}
                  onChange={(e) => setHoraFinal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 outline-none focus:border-amber-400 [color-scheme:dark] transition"
                />
              </div>
            </div>
          </div>

          {/* Quick ranges buttons and seizure check */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-end gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleSetDateRangePreset('hoje')}
                className="flex-1 py-1 px-2 text-[10px] font-semibold bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handleSetDateRangePreset('7dias')}
                className="flex-1 py-1 px-2 text-[10px] font-semibold bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => handleSetDateRangePreset('esteMes')}
                className="flex-1 py-1 px-2 text-[10px] font-semibold bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => handleSetDateRangePreset('todos')}
                className="py-1 px-2 text-[10px] bg-slate-950/60 border border-slate-850 hover:bg-slate-800 rounded text-amber-400 hover:text-white font-black transition"
              >
                Limpar
              </button>
            </div>

            <label className="inline-flex items-center justify-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 hover:border-slate-750 px-3 py-2 rounded-lg transition text-slate-300">
              <input
                type="checkbox"
                checked={onlyWithSeizures}
                onChange={(e) => setOnlyWithSeizures(e.target.checked)}
                className="rounded accent-amber-400 border-slate-850 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-bold font-mono">Apenas com apreensão de ilícitos</span>
            </label>
          </div>
        </div>
      </div>

      {/* CORE CONTROL DESKTOP AND MOBILE TAB HEADS */}
      <div className="flex bg-slate-900 border border-slate-850 p-1.5 rounded-xl gap-2" id="dashboard-tab-selectors">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-3 text-xs md:text-sm font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-205 hover:bg-slate-950/60'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Estatísticas & Produtividade</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex-1 py-3 text-xs md:text-sm font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'records'
              ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-205 hover:bg-slate-950/60'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Livro de Registros RDS ({filteredReports.length})</span>
        </button>
      </div>

      {/* SHOW VIEW 1: ESTATÍSTICAS E PRODUTIVIDADE */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn" id="dashboard-statistics-view">
          
          {/* STATS COUNTED (BENTO STYLE) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-grid-advanced">
            {/* Metric 1: Weapons armed */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:bg-slate-850/80">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Armas de Fogo</span>
                <span className="p-1.5 bg-red-950/80 border border-red-900 text-red-400 rounded-lg">
                  <ShieldAlert className="h-4 w-4 animate-pulse" />
                </span>
              </div>
              <div className="z-10 relative">
                <span className="text-3xl font-black text-white block tracking-tight font-sans">
                  {stats.weapons}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  retiradas de circulação
                </span>
              </div>
              <div className="absolute -bottom-6 -right-6 text-red-500/5 opacity-50 pointer-events-none">
                <ShieldAlert className="h-24 w-24" />
              </div>
            </div>

            {/* Metric 2: Munitions intact */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:bg-slate-850/80">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Munições</span>
                <span className="p-1.5 bg-amber-950/80 border border-amber-900 text-amber-400 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="z-10 relative">
                <span className="text-3xl font-black text-white block tracking-tight font-sans">
                  {stats.ammo}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  cartuchos apreendidos
                </span>
              </div>
              <div className="absolute -bottom-6 -right-6 text-amber-500/5 opacity-50 pointer-events-none">
                <TrendingUp className="h-24 w-24" />
              </div>
            </div>

            {/* Metric 3: Drugs and Narcotics weight */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:bg-slate-850/80">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Entorpecentes</span>
                <span className="p-1.5 bg-indigo-950/80 border border-indigo-900 text-indigo-400 rounded-lg">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="z-10 relative">
                <span className="text-3xl font-black text-white block tracking-tight font-sans">
                  {stats.drugs >= 1000 ? `${(stats.drugs / 1000).toFixed(2)} kg` : `${stats.drugs} g`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  material prensado e fracionado
                </span>
              </div>
              <div className="absolute -bottom-6 -right-6 text-indigo-505/5 opacity-50 pointer-events-none">
                <Activity className="h-24 w-24" />
              </div>
            </div>

            {/* Metric 4: Cash flow */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:bg-slate-850/80">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Apreensão em Dinheiro</span>
                <span className="p-1.5 bg-emerald-950/80 border border-emerald-900 text-emerald-400 rounded-lg">
                  <Coins className="h-4 w-4" />
                </span>
              </div>
              <div className="z-10 relative">
                <span className="text-3xl font-black text-emerald-400 block tracking-tight font-sans">
                  {formatCurrency(stats.cash)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  bens e moeda convertida
                </span>
              </div>
              <div className="absolute -bottom-6 -right-6 text-emerald-500/5 opacity-50 pointer-events-none">
                <Coins className="h-24 w-24" />
              </div>
            </div>
          </div>

          {/* SECONDARY TOTALS GRID FOR GENERAL LOGISTICS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="logistics-totals-grid">
            {/* Total policing hours / count */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">Rondas Executadas</span>
              <span className="text-lg font-black text-slate-200 mt-1 block">{stats.count} turnos</span>
            </div>
            {/* Officers active */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">Efetivo Homem/Serviço</span>
              <span className="text-lg font-black text-slate-200 mt-1 block">{stats.actualOfficers} PMs</span>
            </div>
            {/* Vehicles overall */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">Viaturas Lançadas</span>
              <span className="text-lg font-black text-slate-200 mt-1 block">{stats.registeredVtrs} VTRs</span>
            </div>
            {/* Mileage traversed */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">Distância de Patrulha</span>
              <span className="text-lg font-black text-slate-200 mt-1 block">{stats.kmTravelled} km</span>
            </div>
          </div>

          {/* COMPEX SVG CHARTS AND RANKINGS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-complex-diagrams">
            
            {/* Chart 1: Core crime natures compiled (Bento Grid 7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-150 uppercase tracking-wide font-sans">Ocorrências por Natureza Tática</h3>
                    <p className="text-[11px] text-slate-500">Ranking das denúncias com maior incidência criminal mapeada</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                    Top {stats.topNatures.length}
                  </span>
                </div>

                {stats.topNatures.length === 0 ? (
                  <div className="text-center py-10">
                    <Info className="h-8 w-8 text-slate-655 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Sem dados específicos registrados. Lance ocorrências estruturadas para preencher o ranking.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {stats.topNatures.map((item, index) => {
                      const maxVal = Math.max(...stats.topNatures.map(n => n.val), 1);
                      const percentage = (item.val / maxVal) * 100;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-300 flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-blue-950 border border-blue-800 text-[10px] flex items-center justify-center text-blue-400 font-mono">
                                {index + 1}
                              </span>
                              {item.name}
                            </span>
                            <span className="font-mono text-amber-400 font-bold">{item.val} ocorrência(s)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="bg-gradient-to-r from-blue-750 to-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-450 font-mono flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span>Integração de dados coletados diretamente via boletins de ocorrência.</span>
              </div>
            </div>

            {/* Chart 2: Distribuicao por Turno / Cidades (Bento Grid 5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-150 uppercase tracking-wide font-sans mb-3">Escala Turno e Cidades</h3>
                
                {/* SVG shift visualizer */}
                <span className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-wider block mb-2">Volume por Horário</span>
                <div className="space-y-2 mb-5">
                  {[
                    { label: '1º Turno', val: stats.shifts.Primeiro, color: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' },
                    { label: '2º Turno', val: stats.shifts.Segundo, color: 'bg-blue-905 border-blue-500/50 text-blue-300' }
                  ].map(sh => {
                    const totalShifts = stats.shifts.Primeiro + stats.shifts.Segundo + stats.shifts.Outros;
                    const percent = totalShifts > 0 ? (sh.val / totalShifts) * 100 : 0;
                    return (
                      <div key={sh.label} className="flex items-center gap-2">
                        <span className="w-20 text-xs text-slate-400 font-medium truncate">{sh.label}</span>
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded h-5 overflow-hidden flex items-center relative">
                          <div 
                            className={`h-full opacity-60 transition-all duration-300 ${sh.color.split(' ')[0]}`}
                            style={{ width: `${percent}%` }}
                          />
                          <span className="absolute left-2 text-[10px] font-mono font-bold text-slate-200">
                            {sh.val} RDS ({percent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cities top list */}
                <span className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-wider block mb-2 border-t border-slate-800/80 pt-3">Foco Municipal</span>
                {stats.topCities.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Sem registros municipais cadastrados.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {stats.topCities.slice(0, 4).map(c => (
                      <div key={c.name} className="bg-slate-950 border border-slate-850 p-2 rounded flex flex-col justify-between">
                        <span className="text-slate-400 font-bold block truncate">{c.name}</span>
                        <span className="text-amber-400 font-mono text-[10px] mt-1 font-bold">{c.val} Relatórios</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom print control */}
              <div className="pt-4 mt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="w-full bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-400" />
                  <span>Imprimir Balanço de Segurança (.pdf)</span>
                </button>
              </div>
            </div>
          </div>

          {/* GENERAL NOTIFICATIONS BOX */}
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-blue-950 border border-blue-900 text-blue-400 rounded-lg shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest font-mono">Consolidação Operacional da Diretoria</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Este painel calcula estatísticas agregadas em tempo real com base nos filtros indicados no topo. Para obter o relatório PDF oficial de um mês específico, configure o filtro **"Relatórios do Mês"** e utilize o botão de impressão acima.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SHOW VIEW 2: LIVRO DE REGISTROS DO TURNO */}
      {activeTab === 'records' && (
        <div className="space-y-4 animate-fadeIn" id="records-list-tab-panel">
          
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-850 p-3 rounded-lg">
            <span className="text-xs font-mono text-slate-430">
              Visualizando <strong className="text-white">{filteredReports.length}</strong> relatórios de serviço localizados
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-white text-xs underline cursor-pointer font-mono"
              >
                Resetar Busca
              </button>
            </div>
          </div>

          {/* LIST OF RDS */}
          {filteredReports.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-12 text-center" id="empty-search-state-records">
              <FileCheck2 className="h-12 w-12 text-slate-650 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-300">Nenhum RDS localizado para os filtros informados</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Experimente limpar os filtros de datas, comandante ou meses para visualizar o acervo completo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="reports-grid-list-view">
              {filteredReports.map((report) => {
                if (!report) return null;
                const reportIdStr = String(report.id || '');
                const reportCidade = report.cidade || 'Cuiabá';
                const reportComandante = report.comandante_responsavel || 'Cmdte Geral';

                return (
                  <div
                    key={reportIdStr}
                    onClick={() => setSelectedReport(report)}
                    className="bg-slate-900 border border-slate-850 hover:border-slate-700/80 rounded-xl p-5 shadow-md flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-lg group"
                  >
                    <div>
                      {/* Operation Header */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <div className="flex gap-1.5 flex-wrap mb-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-954 border border-amber-500/40 rounded px-2 py-0.5 font-mono uppercase font-black tracking-wider shadow-sm">
                              {getReportDocNumber(report)}
                            </span>

                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 font-mono uppercase font-semibold">
                              {report.turno.split(' (')[0]}
                            </span>
                            
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-950/40 border border-blue-900/60 rounded px-2 py-0.5 font-mono uppercase font-semibold">
                              <MapPin className="h-2.5 w-2.5 inline" />
                              {reportCidade}
                            </span>
                          </div>
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
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 font-normal">
                        {report.ocorrencias}
                      </p>
                    </div>

                    {/* Footer specs / Seized quick stats */}
                    <div className="border-t border-slate-800/80 pt-3 mt-1 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Users className="h-3 w-3 text-slate-600 shrink-0" />
                          <span className="truncate">Cmdte: {reportComandante}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3 text-slate-600" />
                          {formatDateString(report.created_at)}
                        </span>
                      </div>

                      {/* Badges of apprehensions */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] bg-slate-950 border border-slate-800/80 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                          EFETIVO: <strong className="text-slate-200">{report.efetivo} PMs</strong>
                        </span>
                        <span className="text-[10px] bg-slate-950 border border-slate-800/80 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                          VTRS: <strong className="text-slate-200">{report.viaturas}</strong>
                        </span>
                        
                        {report.armas_apreendidas > 0 && (
                          <span className="text-[10px] bg-red-950/40 border border-red-900/60 text-red-450 rounded px-1.5 py-0.5 font-mono font-bold">
                            ARMAS: {report.armas_apreendidas}
                          </span>
                        )}

                        {report.municoes > 0 && (
                          <span className="text-[10px] bg-amber-950/30 border border-amber-900/40 text-amber-300 rounded px-1.5 py-0.5 font-mono font-bold">
                            MUN: {report.municoes}
                          </span>
                        )}

                        {report.drogas_peso > 0 && (
                          <span className="text-[10px] bg-blue-950/40 border border-blue-900/50 text-blue-400 rounded px-1.5 py-0.5 font-mono font-bold">
                            DROGAS: {report.drogas_peso}g
                          </span>
                        )}

                        {report.valores > 0 && (
                          <span className="text-[10px] bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded px-1.5 py-0.5 font-mono font-bold">
                            VAL: R$ {report.valores}
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
                          className="text-xs font-mono font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded hover:bg-slate-850"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Visualizar RDS
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                            setTimeout(() => {
                              window.print();
                            }, 200);
                          }}
                          className="text-xs font-mono font-semibold text-emerald-405 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded hover:bg-slate-850"
                        >
                          <Printer className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Exportar PDF</span>
                        </button>

                        {(currentUserEmail && report.user_email && currentUserEmail === report.user_email || reportIdStr.startsWith('report-local-')) && (
                          <button
                            type="button"
                            disabled={String(deletingId || '') === reportIdStr}
                            onClick={(e) => handleDeleteClick(e, reportIdStr)}
                            className="text-xs font-mono font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded hover:bg-red-950/20"
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
        </div>
      )}

      {/* DETAILED OFFICIAL MILITARY REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="document-modal-overlay">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative my-8" id="document-modal-card">
            
            {/* Header Toolbar */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center gap-4 sticky top-0 rounded-t-xl z-20">
              <span className="text-xs font-semibold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-amber-500" />
                <span>PMMT • Banco Oficial RDS-PM</span>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="bg-blue-800 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 bg-slate-850 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* PRINT AREA / OFFICIAL MARGINS */}
            <div className="p-8 md:p-12 text-slate-900 bg-white leading-relaxed" id="printable-report-paper">
              {/* Brazil/MT State Crest Placeholder & Official Heading */}
              <div className="text-center border-b-4 border-double border-slate-950 pb-5 mb-6">
                
                {/* Official PMMT Crest for printing (grayscale/high contrast) */}
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
                    alt="Brasão Oficial PMMT" 
                    className="w-18 h-18 object-contain print:brightness-95 contrast-125 select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.15em] text-slate-950 font-sans">
                  POLÍCIA MILITAR DO ESTADO DE MATO GROSSO
                </div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-slate-800 mt-1 font-sans">
                  13º COMANDO REGIONAL / MÉDIO ARAGUAIA
                </div>
                <div className="text-[9px] sm:text-xs font-semibold uppercase tracking-[0.05em] text-slate-700 mt-1 font-sans">
                  19ª COMPANHIA DE POLÍCIA MILITAR DE QUERÊNCIA
                </div>

                <div className="w-full max-w-lg mx-auto my-4 border-t-2 border-slate-950" />

                <div className="text-[9px] font-bold font-mono tracking-[0.25em] text-slate-500 uppercase mb-0.5">
                  Documento Oficial de Serviço
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-black tracking-[0.15em] text-slate-950 uppercase">
                  01 - RELATÓRIO DIÁRIO
                </h2>
                
                <div className="text-xs sm:text-sm font-extrabold font-mono text-slate-950 mt-1 uppercase">
                  {getReportDocNumber(selectedReport)}
                </div>

                <div className="text-[10px] font-mono text-slate-500 mt-2">
                  Chave Eletrônica de Autenticidade: <span className="text-slate-900 font-bold">{selectedReport.id}</span>
                </div>
              </div>

              {/* SECTION 1: Identificação */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  1. IDENTIFICAÇÃO OPERACIONAL E RECURSOS HUMANOS
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-sans">
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Operação Policial</span>
                    <strong className="text-slate-900">{selectedReport.operacao}</strong>
                  </div>
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Comandante Responsável</span>
                    <strong className="text-slate-900">{selectedReport.comandante_responsavel || 'Cmdte Geral PM'}</strong>
                  </div>
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Cidade de Atuação</span>
                    <strong className="text-slate-900">{selectedReport.cidade || 'Cuiabá'}</strong>
                  </div>
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Turno / Escala</span>
                    <strong className="text-slate-900">{selectedReport.turno}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-sans mt-2">
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Horário de Serviço</span>
                    <strong className="text-slate-900">{selectedReport.horario_servico || 'Não informado'}</strong>
                  </div>
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Efetivo de Policiais</span>
                    <strong className="text-slate-900">{selectedReport.efetivo} Militares</strong>
                  </div>
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Data de Confecção</span>
                    <strong className="text-slate-900">{formatDateString(selectedReport.created_at)}</strong>
                  </div>
                  <div className="border border-slate-300 p-2 bg-slate-50/70">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">Órgão Emissor</span>
                    <strong className="text-slate-900 truncate block">PMMT - Central RDS</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 1.2: Guarnições de Serviço */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  1.2. GUARNIÇÕES DE SERVIÇO (EFETIVO OPERACIONAL PMMT)
                </h3>
                {(!selectedReport.lista_guarnicoes || !Array.isArray(selectedReport.lista_guarnicoes) || selectedReport.lista_guarnicoes.length === 0) ? (
                  <p className="text-xs text-slate-600 italic font-mono border border-slate-200 p-2.5 bg-slate-50/20">
                    Nenhuma guarnição operacional registrada individualmente neste relatório.
                  </p>
                ) : (
                  <div className="border border-slate-300 rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-750 font-mono text-[10px] font-black uppercase">
                          <th className="p-2">Nome Guarnição</th>
                          <th className="p-2">Tipo</th>
                          <th className="p-2">Viatura</th>
                          <th className="p-2">Comandante</th>
                          <th className="p-2">Horário de Atuação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-250 font-sans text-slate-900">
                        {(selectedReport.lista_guarnicoes || []).map((g, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold">{g.nome_guarnicao}</td>
                            <td className="p-2">
                              <span className="font-mono text-[10px] font-bold bg-slate-150 border border-slate-250 rounded px-1.5 py-0.5 text-slate-750 uppercase">
                                {g.tipo_guarnicao}
                              </span>
                            </td>
                            <td className="p-2 font-bold">{g.viatura}</td>
                            <td className="p-2">{g.comandante_guarnicao}</td>
                            <td className="p-2 font-mono text-[11px] text-slate-700">{g.horario_inicial} às {g.horario_final}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 1.3: Atividades Delegadas */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  1.3. EQUIPES DE ATIVIDADE DELEGADA (CONVÊNIOS MUNICIPAIS SESP)
                </h3>
                {(!selectedReport.lista_atividades_delegadas || !Array.isArray(selectedReport.lista_atividades_delegadas) || selectedReport.lista_atividades_delegadas.length === 0) ? (
                  <p className="text-xs text-slate-600 italic font-mono border border-slate-200 p-2.5 bg-slate-50/20">
                    Nenhuma equipe de atividade delegada lançada para o turno.
                  </p>
                ) : (
                  <div className="border border-slate-300 rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-750 font-mono text-[10px] font-black uppercase">
                          <th className="p-2">Equipe</th>
                          <th className="p-2">Viatura</th>
                          <th className="p-2">Horário</th>
                          <th className="p-2">Local da Operação</th>
                          <th className="p-2">Policiais</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-250 font-sans text-slate-900">
                        {(selectedReport.lista_atividades_delegadas || []).map((ad, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold">{ad.nome_equipe}</td>
                            <td className="p-2 font-mono text-slate-800">{ad.viatura}</td>
                            <td className="p-2 font-mono text-slate-700">{ad.horario}</td>
                            <td className="p-2 text-slate-800">{ad.local_operacao}</td>
                            <td className="p-2 text-slate-700 text-xs">{ad.policiais}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 1.4: Jornadas Extraordinárias */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  1.4. JORNADA EXTRAORDINÁRIA (REFORÇO DE POLICIAMENTO MILITAR)
                </h3>
                {(!selectedReport.lista_jornadas_extraordinarias || !Array.isArray(selectedReport.lista_jornadas_extraordinarias) || selectedReport.lista_jornadas_extraordinarias.length === 0) ? (
                  <p className="text-xs text-slate-600 italic font-mono border border-slate-200 p-2.5 bg-slate-50/20">
                    Nenhum lançamento de jornada extraordinária neste turno.
                  </p>
                ) : (
                  <div className="border border-slate-300 rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-750 font-mono text-[10px] font-black uppercase">
                          <th className="p-2">Equipe</th>
                          <th className="p-2">Viatura (VTR)</th>
                          <th className="p-2">Horário</th>
                          <th className="p-2">Tipo de Reforço</th>
                          <th className="p-2">Policiais Integrantes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-250 font-sans text-slate-900">
                        {(selectedReport.lista_jornadas_extraordinarias || []).map((je, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold">{je.nome_equipe}</td>
                            <td className="p-2 font-mono text-slate-800">{je.viatura}</td>
                            <td className="p-2 font-mono text-slate-700">{je.horario}</td>
                            <td className="p-2 font-bold">
                              <span className="bg-emerald-100 text-emerald-850 border border-emerald-200 text-[10px] font-black px-1.5 py-0.5 rounded font-mono uppercase">
                                {je.tipo_reforco}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 text-xs">{je.policiais}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 5: Viaturas Empenhadas */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  5. VIATURAS EMPENHADAS E CONTROLE DE QUILOMETRAGEM
                </h3>
                
                {(!selectedReport.lista_viaturas || !Array.isArray(selectedReport.lista_viaturas) || selectedReport.lista_viaturas.length === 0) ? (
                  <p className="text-xs text-slate-600 italic font-mono border border-slate-200 p-2.5">
                    Nenhuma viatura individual estruturada foi vinculada neste documento. Totalizador do cabeçalho indica {selectedReport.viaturas} VTR(s) em serviço.
                  </p>
                ) : (
                  <div className="border border-slate-300 rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-750 font-mono text-[10px] font-black uppercase">
                          <th className="p-2">Prefixo</th>
                          <th className="p-2">Modelo do Veículo</th>
                          <th className="p-2">Placa Oficial</th>
                          <th className="p-2 text-center">KM Inicial</th>
                          <th className="p-2 text-center">KM Final</th>
                          <th className="p-2 text-center">KM Percorridos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-250 font-mono text-slate-900">
                        {(selectedReport.lista_viaturas || []).map((vtr, i) => {
                          const kmDiff = (vtr.km_final && vtr.km_inicial) ? (vtr.km_final - vtr.km_inicial) : null;
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 font-bold">{vtr.prefixo}</td>
                              <td className="p-2 text-slate-700">{vtr.modelo}</td>
                              <td className="p-2">{vtr.placa || '-'}</td>
                              <td className="p-2 text-center">{vtr.km_inicial ?? '-'}</td>
                              <td className="p-2 text-center">{vtr.km_final ?? '-'}</td>
                              <td className="p-2 text-center font-bold text-slate-950">
                                {kmDiff !== null ? `${kmDiff} km` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 6: Ocorrências Detalhadas */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  6. OCORRÊNCIAS ATENDIDAS E SUSPEITOS CONDUZIDOS
                </h3>

                {(!selectedReport.lista_ocorrencias || !Array.isArray(selectedReport.lista_ocorrencias) || selectedReport.lista_ocorrencias.length === 0) ? (
                  <p className="text-xs text-slate-605 italic font-mono border border-slate-200 p-2.5 bg-slate-50/20">
                    Nenhuma ocorrência tabulada individualmente. Verifique o relato consolidado na seção 05.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(selectedReport.lista_ocorrencias || []).map((oco, idx) => (
                      <div key={idx} className="border border-slate-300 p-3 bg-slate-50/50 text-xs font-sans rounded">
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                          <div>
                            <span className="font-bold text-slate-950 text-sm uppercase">{oco.natureza_ocorrencia}</span>
                            {oco.ocorrencia_bo && (
                              <span className="ml-2 bg-slate-200 border border-slate-300 text-[10px] font-mono text-slate-700 px-1.5 py-0.5 rounded">
                                BO: {oco.ocorrencia_bo}
                              </span>
                            )}
                          </div>
                          {oco.suspeitos_conduzidos && oco.suspeitos_conduzidos > 0 ? (
                            <span className="bg-red-100 border border-red-200 text-red-850 text-[10px] px-2 py-0.5 rounded font-black font-mono uppercase">
                              Suspeitos Conduzidos: {oco.suspeitos_conduzidos}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">Sem conduzidos</span>
                          )}
                        </div>

                        <p className="text-slate-800 text-xs leading-relaxed font-sans">{oco.observacoes}</p>
                        
                        {oco.local_fato && (
                          <div className="text-[10px] text-slate-600 font-mono mt-1.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 inline text-slate-500" />
                            <span><strong>Endereço/Cidade:</strong> {oco.local_fato}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 7: Resumo de Produtividade */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  7. QUADRO DE PRODUTIVIDADE OPERACIONAL SINTÉTICO
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-mono mb-3">
                  <div className="border-2 border-slate-850 p-2.5 bg-slate-50">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">ARMAS DE FOGO</span>
                    <strong className="text-lg font-black text-slate-900">{selectedReport.armas_apreendidas}</strong>
                  </div>
                  <div className="border-2 border-slate-850 p-2.5 bg-slate-50">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">MUNIÇÃO APREENDIDA</span>
                    <strong className="text-lg font-black text-slate-900">{selectedReport.municoes}</strong>
                  </div>
                  <div className="border-2 border-slate-850 p-2.5 bg-slate-50">
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">DROGAS APREENDIDAS</span>
                    <strong className="text-lg font-black text-slate-900">{selectedReport.drogas_peso}g</strong>
                  </div>
                  <div className="border-2 border-slate-850 p-2.5 bg-slate-100">
                    <span className="block text-[8px] text-slate-505 font-bold uppercase">VALOR RECONSTITUÍDO</span>
                    <strong className="text-lg font-black text-emerald-800">{formatCurrency(selectedReport.valores)}</strong>
                  </div>
                </div>

                {(selectedReport.armas_apreendidas > 0 || selectedReport.municoes > 0 || selectedReport.drogas_peso > 0 || selectedReport.valores > 0) && (
                  <div className="border border-slate-300 p-3 bg-slate-50/40 text-xs font-sans space-y-2">
                    <span className="block text-[9px] font-mono text-slate-650 font-black tracking-wider uppercase border-b border-slate-200 pb-0.5">ESPECIFICAÇÕES DOS APREENDIDOS:</span>
                    {selectedReport.armas_apreendidas > 0 && (
                      <div>• <strong>Armas de Fogo apreendidas:</strong> {selectedReport.armas_detalhes || 'Sem detalhes discriminados no banco.'}</div>
                    )}
                    {selectedReport.municoes > 0 && (
                      <div>• <strong>Munições apreendidas:</strong> {selectedReport.municoes_detalhes || 'Sem detalhes discriminados no banco.'}</div>
                    )}
                    {selectedReport.drogas_peso > 0 && (
                      <div>• <strong>Entorpecentes apreendidos:</strong> {selectedReport.drogas_detalhes || 'Sem detalhes discriminados no banco.'}</div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 8: Relatório Consolidado */}
              <div className="mb-5">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  8. NARRATIVA DIÁRIA GERAL DO SERVIÇO (CONSOLIDADO)
                </h3>
                <div className="border border-slate-300 p-4 bg-slate-50 text-xs text-slate-900 leading-relaxed font-mono min-h-[140px] whitespace-pre-wrap">
                  {selectedReport.ocorrencias}
                </div>
              </div>

              {/* SECTION 9: Anexos operacionais vinculados */}
              <div className="mb-10">
                <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-950 border-b-2 border-slate-350 pb-1 mb-2.5">
                  9. ANEXOS OPERACIONAIS E LAUDOS REGISTRADOS
                </h3>
                {(!selectedReport.lista_anexos || !Array.isArray(selectedReport.lista_anexos) || selectedReport.lista_anexos.length === 0) ? (
                  <p className="text-xs text-slate-550 italic font-mono border border-slate-200 p-2">Sem anexos de termos cadastrados eletronicamente.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    {(selectedReport.lista_anexos || []).map((an, i) => (
                      <div key={i} className="border border-slate-300 p-2 bg-slate-55 rounded flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 text-blue-800 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="block font-bold text-slate-900 truncate">{an.nome_arquivo}</span>
                          <span className="block text-[8px] text-slate-500 uppercase">{an.tipo} registrado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Administrative observations */}
                {(() => {
                  if (!selectedReport.observacoes) return null;
                  // Strip the '[RECEBE SERVIÇO: ...]' pattern from the displayed text
                  const cleanedObs = selectedReport.observacoes.replace(/\[RECEBE SERVIÇO:\s*[^\]]+\]\s*/g, '').trim();
                  if (!cleanedObs) return null;
                  return (
                    <div className="mt-4 border-l-4 border-slate-400 pl-3 py-1 text-xs text-slate-700 italic">
                      <strong>Informações adicionais do Comando:</strong> {cleanedObs}
                    </div>
                  );
                })()}
              </div>

              {/* Signature area */}
              <div className="mt-14 pt-8 border-t border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs font-mono">
                <div className="space-y-1">
                  <div className="w-48 border-b border-slate-400 mx-auto mt-6" />
                  <span className="block font-bold text-slate-900 uppercase">
                    {selectedReport.comandante_responsavel || '2º SGT PM EDUARDO SILVA RODRIGUES - RG PM 883.694'}
                  </span>
                  <span className="block text-[9px] text-slate-600 font-mono font-semibold">COMANDANTE QUE PASSA O SERVIÇO</span>
                </div>
                <div className="space-y-1">
                  <div className="w-48 border-b border-slate-400 mx-auto mt-6" />
                  <span className="block font-bold text-slate-900 uppercase">
                    {(() => {
                      if (selectedReport.comandante_recebe) return selectedReport.comandante_recebe;
                      
                      // Check in observations fallback
                      if (selectedReport.observacoes && selectedReport.observacoes.includes('[RECEBE SERVIÇO: ')) {
                        const match = selectedReport.observacoes.match(/\[RECEBE SERVIÇO:\s*([^\]]+)\]/);
                        if (match && match[1]) {
                          return match[1].trim();
                        }
                      }
                      
                      return '2º SGT PM DOUGLAS SOUZA PORTO - RG PM 887.198'; // Default Fallback example if undefined
                    })()}
                  </span>
                  <span className="block text-[9px] text-slate-600 font-mono font-semibold">COMANDANTE QUE RECEBE O SERVIÇO</span>
                </div>
              </div>
            </div>

            {/* Print Footer Notice */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-center rounded-b-xl z-25">
              <span className="text-[10px] font-mono text-slate-500 leading-relaxed block font-sans">
                ATENÇÃO: Este documento contém informações operacionais confidenciais de nível corporativo da SESP/MT e PMMT.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PRINT STYLING INJECTED VIA RAW CSS ELEMENT */}
      <style>{`
        @media print {
          /* Hide everything except printable report section, only if report paper is present */
          body:has(#printable-report-paper) * {
            visibility: hidden !important;
          }
          body:has(#printable-report-paper) #printable-report-paper,
          body:has(#printable-report-paper) #printable-report-paper * {
            visibility: visible !important;
          }
          body:has(#printable-report-paper) #printable-report-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          body:has(#printable-report-paper) #document-modal-overlay {
            background: white !important;
            position: absolute !important;
          }
          body:has(#printable-report-paper) #document-modal-card {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            max-width: 100% !important;
            position: static !important;
          }
        }
      `}</style>

    </div>
  );
}
