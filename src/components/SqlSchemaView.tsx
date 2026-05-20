/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DB_SQL_SCHEMA } from '../supabase';
import { Clipboard, Check, Terminal, ExternalLink, Info, Database } from 'lucide-react';

export default function SqlSchemaView() {
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(DB_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl shadow-lg p-6 lg:p-8 space-y-6" id="sql-schema-container">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-2.5 bg-amber-950/40 border border-amber-900 rounded-lg text-amber-400">
          <Database className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-sans">Instruções para o Supabase</h3>
          <p className="text-xs text-slate-400">Instale a tabela de relatórios policiais em seu banco de dados na nuvem</p>
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-xl flex gap-3 text-sm text-slate-300">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-semibold text-slate-200">Como conectar seu banco de dados Supabase real:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 leading-relaxed font-mono">
            <li>Acesse o painel do seu projeto no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-semibold underline hover:text-amber-300 inline-flex items-center gap-0.5">Supabase <ExternalLink className="h-3 w-3 inline" /></a>.</li>
            <li>No menu lateral, clique em <strong className="text-slate-300">SQL Editor</strong>.</li>
            <li>Inicie uma nova consulta clicando em <strong className="text-slate-300">"New Query"</strong>.</li>
            <li>Copie o script SQL disponibilizado abaixo, cole no editor e clique em <strong className="text-blue-400">"Run" (Executar)</strong>.</li>
            <li>Por fim, acesse a guia <strong className="text-slate-300">Secrets</strong> no painel de controle do AI Studio e defina as chaves:
              <ul className="list-disc list-inside ml-4 mt-1 text-slate-400 space-y-1 font-bold text-amber-300/95">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </li>
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
            className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition px-2.5 py-1 bg-slate-900 border border-slate-800 rounded hover:border-amber-400"
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
        * Este script habilita o recurso interno de <strong className="text-slate-400">Row Level Security (RLS)</strong>, permitindo que qualquer policial autenticado visualize e cadastre novos relatórios operacionais enquanto impede exclusões e edições por terceiros não autorizados. No entanto, lembre-se de configurar políticas de acesso adicionais caso precise de perfis de visualização corporativa diferenciados.
      </div>
    </div>
  );
}
