/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PoliceReport } from '../types';
import { 
  ShieldAlert, 
  Calendar, 
  Users, 
  Car, 
  Flame, 
  CircleAlert, 
  DollarSign, 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  Compass, 
  AlertTriangle 
} from 'lucide-react';

interface ReportFormProps {
  onSubmit: (report: Omit<PoliceReport, 'id' | 'created_at'>) => Promise<boolean>;
  currentUserEmail: string;
}

const SHIFT_OPTIONS = [
  'Serviço Noturno (18h às 06h)',
  'Serviço Vespertino (12h às 18h)',
  'Serviço Matutino (06h às 12h)',
  'Escala de 24h (Turno Extraordinário)',
  'Serviço Administrativo de Apoio',
];

const POPULAR_OPERATIONS = [
  'Operação Saturação Metropolitana',
  'Operação Lei Seca Integrada',
  'Operação Comércio Seguro',
  'Operação Dispersão / Tolerância Zero',
  'Patrulhamento Tático Motorizado (Força Tática / BOPE)',
  'Operação Divisões Integradas / Fronteira',
  'Policiamento Escolar / Comunitário',
  'Operação Bloqueio de Vias Públicas',
];

export default function ReportForm({ onSubmit, currentUserEmail }: ReportFormProps) {
  // Report Form States
  const [operacao, setOperacao] = useState('');
  const [turno, setTurno] = useState(SHIFT_OPTIONS[0]);
  const [efetivo, setEfetivo] = useState(2);
  const [viaturas, setViaturas] = useState(1);
  const [armas, setArmas] = useState(0);
  const [armasDetalhes, setArmasDetalhes] = useState('');
  const [municoes, setMunicoes] = useState(0);
  const [municoesDetalhes, setMunicoesDetalhes] = useState('');
  const [drogasPeso, setDrogasPeso] = useState(0);
  const [drogasDetalhes, setDrogasDetalhes] = useState('');
  const [valores, setValores] = useState(0);
  const [ocorrencias, setOcorrencias] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setOperacao('');
    setTurno(SHIFT_OPTIONS[0]);
    setEfetivo(2);
    setViaturas(1);
    setArmas(0);
    setArmasDetalhes('');
    setMunicoes(0);
    setMunicoesDetalhes('');
    setDrogasPeso(0);
    setDrogasDetalhes('');
    setValores(0);
    setOcorrencias('');
  };

  const handleQuickSelectOperacao = (opName: string) => {
    setOperacao(opName);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operacao.trim()) {
      setErrorMsg('O nome ou tipo da Operação é obrigatório.');
      return;
    }
    if (!ocorrencias.trim() || ocorrencias.trim().length < 15) {
      setErrorMsg('O resumo das ocorrências é obrigatório e necessita de pelo menos 15 caracteres.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    const reportPayload: Omit<PoliceReport, 'id' | 'created_at'> = {
      user_email: currentUserEmail,
      operacao: operacao.trim(),
      turno,
      efetivo: Number(efetivo),
      viaturas: Number(viaturas),
      armas_apreendidas: Number(armas),
      armas_detalhes: armas > 0 ? armasDetalhes.trim() : '',
      municoes: Number(municoes),
      municoes_detalhes: municoes > 0 ? municoesDetalhes.trim() : '',
      drogas_peso: Number(drogasPeso),
      drogas_detalhes: drogasPeso > 0 ? drogasDetalhes.trim() : '',
      valores: Number(valores),
      ocorrencias: ocorrencias.trim()
    };

    try {
      const isOk = await onSubmit(reportPayload);
      if (isOk) {
        setSuccess(true);
        resetForm();
        // Clear success checkmark after 4 seconds
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setErrorMsg('Erro de comunicação. O relatório não pôde ser gravado.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Houve um imprevisto ao enviar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl shadow-lg p-6 lg:p-8" id="report-form-container">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
        <div className="p-2.5 bg-blue-950/80 border border-blue-900 rounded-lg text-blue-400">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-sans">Registrar Novo RDS-PM</h3>
          <p className="text-xs text-slate-400">Lançamento de produtividade e ocorrências diárias da unidade</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-900 rounded-lg text-emerald-300 text-sm flex items-center gap-3 animate-bounce" id="form-success-banner">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold block">Relatório Salvo com Sucesso!</span>
            <span className="text-xs text-emerald-400/80">O registro foi gravado na central e já está visível para consulta.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/55 border border-red-900 rounded-lg text-red-300 text-sm flex items-center gap-3 animate-shake">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* SECTION 1: DADOS GERAIS */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <Compass className="h-3.5 w-3.5" />
            <span>01. Identificação de Serviço</span>
          </div>

          {/* Operação */}
          <div>
            <label htmlFor="input-operacao" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold">
              Nome ou Modalidade da Operação *
            </label>
            <input
              id="input-operacao"
              type="text"
              required
              value={operacao}
              onChange={(e) => setOperacao(e.target.value)}
              placeholder="Ex: Operação Saturação Metropolitana, Comando de Trânsito"
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
            {/* Quick selectors */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-500 self-center mr-1">Sugestões:</span>
              {POPULAR_OPERATIONS.slice(0, 4).map((op, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickSelectOperacao(op)}
                  className="bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 hover:border-blue-500 rounded px-2 py-1 transition"
                >
                  {op.replace('Operação ', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Turno */}
            <div>
              <label htmlFor="select-turno" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold">
                Turno de Escala *
              </label>
              <select
                id="select-turno"
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              >
                {SHIFT_OPTIONS.map((sh, idx) => (
                  <option key={idx} value={sh}>{sh}</option>
                ))}
              </select>
            </div>

            {/* Efetivo */}
            <div>
              <label htmlFor="input-efetivo" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 inline text-blue-400" />
                <span>Efetivo Total (PMMT)</span>
              </label>
              <input
                id="input-efetivo"
                type="number"
                min="1"
                required
                value={efetivo}
                onChange={(e) => setEfetivo(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Viaturas */}
            <div>
              <label htmlFor="input-viaturas" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <Car className="h-3.5 w-3.5 inline text-blue-400" />
                <span>Qtd. Viaturas (VTR)</span>
              </label>
              <input
                id="input-viaturas"
                type="number"
                min="0"
                required
                value={viaturas}
                onChange={(e) => setViaturas(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PRODUTIVIDADE OPERACIONAL / APREENSÕES */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>02. Apreensões e Produtividade Operacional</span>
          </div>

          {/* Armas apreendidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="input-armas" className="text-xs font-mono text-slate-300 uppercase font-semibold">
                  Armas de Fogo Apreendidas
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setArmas(Math.max(0, armas - 1))}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-750 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{armas}</span>
                  <button
                    type="button"
                    onClick={() => setArmas(armas + 1)}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-750 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                id="input-armas"
                type="hidden"
                value={armas}
              />
              {armas > 0 && (
                <div className="animate-fadeIn">
                  <label htmlFor="textarea-armas-detalhes" className="block text-[11px] font-sans text-slate-400 mb-1">Especificações das armas apreendidas:</label>
                  <textarea
                    id="textarea-armas-detalhes"
                    required
                    value={armasDetalhes}
                    onChange={(e) => setArmasDetalhes(e.target.value)}
                    placeholder="Ex: 01 Revólver .38 Smith&Wesson, 01 Pistola 9mm G3c"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              )}
            </div>

            {/* Munições */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="input-municoes" className="text-xs font-mono text-slate-300 uppercase font-semibold">
                  Munições Apreendidas
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMunicoes(Math.max(0, municoes - 1))}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-750 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{municoes}</span>
                  <button
                    type="button"
                    onClick={() => setMunicoes(municoes + 1)}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-750 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                id="input-municoes"
                type="hidden"
                value={municoes}
              />
              {municoes > 0 && (
                <div className="animate-fadeIn">
                  <label htmlFor="textarea-municoes-detalhes" className="block text-[11px] font-sans text-slate-400 mb-1">Calibre e condições das munições:</label>
                  <textarea
                    id="textarea-municoes-detalhes"
                    required
                    value={municoesDetalhes}
                    onChange={(e) => setMunicoesDetalhes(e.target.value)}
                    placeholder="Ex: 12 munições calibre .38 intactas"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drogas (Peso) */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div>
                <label htmlFor="input-drogas-peso" className="text-xs font-mono text-slate-300 uppercase font-semibold flex items-center justify-between mb-1.5">
                  <span>Drogas Apreendidas (Peso Aprox. em Gramas)</span>
                  <span className="text-slate-500 font-normal">1kg = 1000g</span>
                </label>
                <div className="relative">
                  <input
                    id="input-drogas-peso"
                    type="number"
                    min="0"
                    step="1"
                    value={drogasPeso}
                    onChange={(e) => setDrogasPeso(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded px-3 py-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono text-slate-500 uppercase">
                    GRAMAS
                  </div>
                </div>
              </div>

              {drogasPeso > 0 && (
                <div className="animate-fadeIn">
                  <label htmlFor="textarea-drogas-detalhes" className="block text-[11px] font-sans text-slate-400 mb-1">Detalhamento dos Entorpecentes:</label>
                  <textarea
                    id="textarea-drogas-detalhes"
                    required
                    value={drogasDetalhes}
                    onChange={(e) => setDrogasDetalhes(e.target.value)}
                    placeholder="Ex: Substância análoga a Maconha prensada, pasta base de Cocaína dividida em 14 sacolas, etc."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              )}
            </div>

            {/* Valores apreendidos */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <div>
                <label htmlFor="input-valores" className="text-xs font-mono text-slate-300 uppercase font-semibold flex items-center gap-1 mb-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span>Dinheiro / Valores Apreendidos (R$)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 text-xs font-mono">R$</span>
                  </div>
                  <input
                    id="input-valores"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valores || ''}
                    onChange={(e) => setValores(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded pl-8 pr-3 py-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal mt-2">
                Sempre verifique os valores com o termo de apreensão detalhado anexado à ocorrência antes de oficializar o fechamento do relatório RDS.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: OCORRÊNCIAS / DESCRITIVO */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>03. Desempenho e Histórico das Ocorrências</span>
          </div>

          <div>
            <label htmlFor="textarea-ocorrencias" className="block text-xs font-mono text-slate-300 uppercase mb-2 font-semibold flex items-center gap-1">
              <CircleAlert className="h-3.5 w-3.5 text-blue-400" />
              <span>Resumo Descritivo das Ocorrências Relevantes *</span>
            </label>
            <textarea
              id="textarea-ocorrencias"
              required
              rows={6}
              value={ocorrencias}
              onChange={(e) => setOcorrencias(e.target.value)}
              placeholder="Digite detalhadamente o diário operacional do turno, as abordagens, prisões efetuadas, chamados atendidos e atuações de policiamento..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-sans leading-relaxed"
            />
            <div className="flex justify-between items-center mt-2.5">
              <span className="text-[11px] text-slate-500">Mínimo de 15 caracteres para validação oficial</span>
              <span className="text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800/50 px-2 py-0.5 rounded font-mono">
                {ocorrencias.length} caract.
              </span>
            </div>
          </div>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
          <button
            type="submit"
            disabled={submitting}
            id="btn-salvar-relatorio"
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm rounded-lg py-3 px-5 shadow-lg shadow-amber-950/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4.5 w-4.5 text-slate-950" />
                <span>Salvar Relatório Diário de Serviço</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            id="btn-limpar-relatorio"
            className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 text-sm font-semibold rounded-lg py-3 px-5 transition duration-150"
          >
            Limpar Campos
          </button>
        </div>
      </form>
    </div>
  );
}
