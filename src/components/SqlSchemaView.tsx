/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DB_SQL_SCHEMA } from '../supabase';
import { Clipboard, Check, Terminal, ExternalLink, Info, Database, Play, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SqlSchemaView() {
  const [copied, setCopied] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<{
    configured: boolean;
    tableExists?: boolean;
    message: string;
    error?: string;
  } | null>(null);
  const [runningBootstrap, setRunningBootstrap] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/db-bootstrap-status');
      if (res.ok) {
        const data = await res.json();
        setBootstrapStatus(data);
      }
    } catch (err: any) {
      console.warn('[RDS-PM] Erro ao buscar status do bootstrap:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(DB_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunBootstrap = async () => {
    setRunningBootstrap(true);
    setBootstrapResult(null);
    try {
      const res = await fetch('/api/db-bootstrap-run', { method: 'POST' });
      const data = await res.json();
      setBootstrapResult(data);
      await fetchStatus();
    } catch (err: any) {
      setBootstrapResult({ success: false, error: err.message || err });
    } finally {
      setRunningBootstrap(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl shadow-lg p-6 lg:p-8 space-y-6" id="sql-schema-container">
      
      {/* Title block */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-2.5 bg-amber-950/40 border border-amber-900 rounded-lg text-amber-400">
          <Database className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-sans">Infraestrutura e Banco de Dados</h3>
          <p className="text-xs text-slate-400">Instalação automática das tabelas e gerenciamento de sincronismo de efetivos</p>
        </div>
      </div>

      {/* 1. INTERACTIVE AUTOMATED SERVER DB SETUP BLOCK */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-250">
            Setup Automático de Tabelas (Supabase)
          </h4>
        </div>

        {bootstrapStatus === null ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 py-2">
            <span className="w-4 h-4 border border-slate-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Consultando ambiente do servidor...</span>
          </div>
        ) : !bootstrapStatus.configured ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-amber-955/20 border border-amber-500/20 rounded-xl flex gap-3 text-xs text-amber-350">
              <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold">Chave SUPABASE_DB_URL ausente no ambiente de execução.</p>
                <p className="font-sans text-slate-400 leading-normal">
                  Sua aplicação está operando com chaves públicas do Supabase. Para que nosso servidor consiga criar e atualizar tabelas automaticamente (incluindo <b>public.usuarios</b>), o cache e políticas RLS de segurança na nuvem, você deve fornecer sua string de conexão direta do Postgres.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <p className="font-bold font-mono uppercase text-slate-300">Como habilitar o setup automático:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 font-sans leading-relaxed">
                <li>Acesse o menu <strong className="text-slate-200">Settings</strong> no canto superior da tela do AI Studio.</li>
                <li>Na aba de <strong className="text-slate-200">Secrets / Env Variables</strong>, adicione a chave:</li>
                <li className="list-none pl-4 py-1">
                  <code className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-amber-400 font-mono font-bold">
                    SUPABASE_DB_URL
                  </code>
                </li>
                <li>Cole o link do Postgres em formato string de seu painel do Supabase. Exemplo:</li>
                <li className="list-none pl-4">
                  <code className="bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono text-[10px] break-all leading-normal block">
                    postgresql://postgres:[sua-senha]@db.[ref-projeto].supabase.co:5432/postgres
                  </code>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bootstrapStatus.tableExists ? (
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex gap-3 text-xs text-emerald-350">
                <CheckCircle2 className="h-5 w-5 text-emerald-450 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">A tabela "public.usuarios" está ativa e integrada ao banco!</p>
                  <p className="font-sans text-slate-400 leading-normal">
                    Todos os 23 policiais militares autorizados para lançamento do RDS-PM foram inseridos na base tática e estão aptos a efetuar o Primeiro Acesso ou alterar senha.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-955/20 border border-blue-500/20 rounded-xl flex gap-3 text-xs text-blue-350">
                <Info className="h-5 w-5 text-blue-450 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Banco de Dados Conectado! Tabela de usuários ausente.</p>
                  <p className="font-sans text-slate-400 leading-normal">
                    Identificamos que a tabela <b>public.usuarios</b> ainda não foi provisionada no seu Supabase. Clique no botão de Setup Geral abaixo para criá-la instantaneamente.
                  </p>
                </div>
              </div>
            )}

            {bootstrapStatus.error && (
              <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl flex gap-3 text-xs text-red-400">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Erro de Conectividade:</p>
                  <p className="font-mono mt-1 text-[11px] leading-normal text-slate-300 bg-slate-950 p-2 rounded border border-slate-850">
                    {bootstrapStatus.error}
                  </p>
                </div>
              </div>
            )}

            {/* Run Setup Controls */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={handleRunBootstrap}
                disabled={runningBootstrap}
                className="py-2 px-4 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center gap-2 transition cursor-pointer border-b-2 border-blue-900"
              >
                {runningBootstrap ? (
                  <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-white" />
                )}
                <span>
                  {bootstrapStatus.tableExists ? 'Atualizar Efetivos / Re-seed' : 'Executar Setup do Banco'}
                </span>
              </button>

              <span className="text-[10px] font-mono text-slate-500">
                * Cria a estrutura se ausente, seeda os efetivos, configura permissões de acesso livre RLS e limpa o schema cache do PostgREST.
              </span>
            </div>

            {/* Bootstrap results action panel */}
            {bootstrapResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 animate-fadeIn ${
                bootstrapResult.success ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-red-950/20 border-red-500/20 text-red-300'
              }`}>
                <div className="font-bold uppercase text-[9px] tracking-wider text-slate-450 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Resultado da Operação</span>
                </div>
                <p className="text-[11px] leading-normal font-sans text-slate-200">
                  {bootstrapResult.message || bootstrapResult.error || 'Ação executada.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Instructions Banner */}
      <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-xl flex gap-3 text-sm text-slate-300">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-semibold text-slate-200 font-sans">Opção Alternativa (Inserção Manual de Estruturas):</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 leading-relaxed font-mono">
            <li>Acesse o painel do seu projeto no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-semibold underline hover:text-amber-300 inline-flex items-center gap-0.5">Supabase <ExternalLink className="h-3 w-3 inline" /></a>.</li>
            <li>No menu lateral, clique em <strong className="text-slate-200">SQL Editor</strong>.</li>
            <li>Inicie uma nova consulta clicando em <strong className="text-slate-200">"New Query"</strong>.</li>
            <li>Copie o script de esquema SQL unificado abaixo, cole no editor e clique em <strong className="text-blue-400">"Run" (Executar)</strong>.</li>
            <li>Por fim, lembre-se de reiniciar sua sessão após as modificações das tabelas.</li>
          </ol>
        </div>
      </div>

      {/* SQL Script Display */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-950 border-t border-x border-slate-800 rounded-t-lg">
          <span className="text-xs font-mono font-bold text-slate-450 uppercase flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-blue-500" />
            <span>schema_pmmt_reports.sql</span>
          </span>

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition px-2.5 py-1 bg-slate-900 border border-slate-800 rounded hover:border-amber-400 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Clipboard className="h-3.5 w-3.5 text-amber-500" />
                <span>Copiar Script SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono rounded-b-lg overflow-x-auto border-b border-x border-slate-800 leading-relaxed max-h-[350px] scrollbar-thin">
            {DB_SQL_SCHEMA}
          </pre>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 font-normal leading-normal">
        * As tabelas contêm suporte nativo à segurança a nível de linha (<strong className="text-slate-400">Row Level Security - RLS</strong>). Qualquer alteração nas tabelas deve ser sincronizada limpando o cache PostgREST por meio do script de reload.
      </div>
    </div>
  );
}
