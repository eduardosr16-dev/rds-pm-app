/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { UserSession } from '../types';
import { Shield, LogIn, Laptop, Globe, Info } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [cargo, setCargo] = useState('Soldado');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleLocalDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu Nome de Guerra.');
      return;
    }
    
    setLoading(true);
    // Simulate tiny network delay for realism and visual feedback
    setTimeout(() => {
      const trimmedName = name.trim();
      const cleanEmail = `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pm.mt.gov.br`;
      const detectedName = `${cargo} PM ${trimmedName}`;

      onLoginSuccess({
        id: 'local-user-id-' + trimmedName.toLowerCase().replace(/[^a-z0-5]/g, ''),
        email: cleanEmail,
        name: detectedName,
        role: cargo,
        isDemo: true
      });
      setLoading(false);
    }, 850);
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor, informe seu Nome de Guerra.');
      return;
    }

    setErrorMsg(null);
    setMessage(null);
    setLoading(true);

    const cleanEmail = `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pm.mt.gov.br`;
    // Strong deterministic password to secure the auto-profile
    const cleanPassword = `Pmmt_${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}_2026!`;

    try {
      // 1. Try to sign in first
      const { data, error } = await supabase!.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (error) {
        // 2. If user doesn't exist, sign up automatically
        if (error.message.includes('Invalid login credentials') || error.message.includes('not found') || error.status === 400) {
          const { data: signUpData, error: signUpError } = await supabase!.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: {
                full_name: `${cargo} PM ${trimmedName}`,
                role: cargo,
              }
            }
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // 3. Authenticate immediately after automatic setup
            const { data: signInData, error: signInError } = await supabase!.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword
            });

            if (signInError) throw signInError;

            if (signInData.user && signInData.session) {
              const metadata = signInData.user.user_metadata;
              onLoginSuccess({
                id: signInData.user.id,
                email: signInData.user.email || cleanEmail,
                name: metadata?.full_name || `${cargo} PM ${trimmedName}`,
                role: metadata?.role || cargo,
                isDemo: false
              });
            }
          }
        } else {
          throw error;
        }
      } else {
        if (data.user && data.session) {
          const metadata = data.user.user_metadata;
          onLoginSuccess({
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: metadata?.full_name || `${cargo} PM ${trimmedName}`,
            role: metadata?.role || cargo,
            isDemo: false
          });
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação no Supabase:', err);
      setErrorMsg(err.message || 'Falha ao autenticar credenciais no painel institucional da PMMT.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" id="login-screen-wrapper">
      
      {/* Decorative Grid and Ambient Lights */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-300 transform" id="login-container">
        
        {/* Flag Bar - MT State Flag Colors: Green, White, Blue, Yellow */}
        <div className="h-1.5 w-full flex">
          <div className="bg-emerald-600 h-full flex-1" />
          <div className="bg-white h-full flex-1" />
          <div className="bg-blue-600 h-full flex-1" />
          <div className="bg-amber-400 h-full flex-1" />
        </div>

        {/* PMMT Visual Badge Header */}
        <div className="p-8 pb-5 text-center flex flex-col items-center">
          <div className="relative mb-4 flex items-center justify-center w-24 h-24 bg-slate-950/20 rounded-full border border-slate-800/50 p-2 shadow-2xl transition-all duration-350 hover:border-amber-500/30">
            {/* Subtle glow background */}
            <div className="absolute inset-x-0 inset-y-0 bg-amber-500/5 rounded-full blur-md" />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
              alt="Brasão PMMT Oficial" 
              className="relative w-20 h-20 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-2xl font-black font-sans tracking-tight text-white mb-1 uppercase">
            Sistema RDS-PM
          </h2>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Polícia Militar de Mato Grosso
          </p>
          <div className="mt-2 text-xs text-amber-500 font-bold font-mono uppercase tracking-wider bg-amber-950/25 border border-amber-900/30 px-2.5 py-0.5 rounded-full select-none">
            Identificação de Serviço Rápida
          </div>
        </div>

        {/* Connection Mode Indicator */}
        <div className="px-8 pb-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400 text-xs font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono">Banco de Dados Supabase Conectado</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 p-3 bg-amber-950/40 border border-amber-900/50 rounded-lg text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-semibold font-mono">Modo Offline Local</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                As variáveis do Supabase não estão parametrizadas. Os relatórios enviados residirão de maneira segura na memória do browser.
              </p>
            </div>
          )}
        </div>

        {/* Error or Neutral Messages */}
        {errorMsg && (
          <div className="mx-8 mt-2 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-300 text-xs font-sans">
            <strong>Informativo:</strong> {errorMsg}
          </div>
        )}

        {message && (
          <div className="mx-8 mt-2 p-3 bg-emerald-950/50 border border-emerald-900 rounded-lg text-emerald-300 text-xs font-sans">
            {message}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={isConfigured ? handleSupabaseAuth : handleLocalDemoLogin} className="p-8 pt-4 space-y-4">
          
          {/* Rank/Cargo Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Posto / Graduação</label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition cursor-pointer"
            >
              <optgroup label="Oficiais">
                <option value="Coronel">Coronel PM</option>
                <option value="Tenente-Coronel">Tenente-Coronel PM</option>
                <option value="Major">Major PM</option>
                <option value="Capitão">Capitão PM</option>
                <option value="1º Tenente">1º Tenente PM</option>
                <option value="2º Tenente">2º Tenente PM</option>
                <option value="Aspirante">Aspirante-a-Oficial PM</option>
              </optgroup>
              <optgroup label="Praças">
                <option value="Subtenente">Subtenente PM</option>
                <option value="1º Sargento">1º Sargento PM</option>
                <option value="2º Sargento">2º Sargento PM</option>
                <option value="3º Sargento">3º Sargento PM</option>
                <option value="Cabo">Cabo PM</option>
                <option value="Soldado">Soldado PM</option>
              </optgroup>
            </select>
          </div>

          {/* War Name input (ALWAYS SHOWS) */}
          <div>
            <label htmlFor="input-militar-nome" className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Nome de Guerra</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <input
                id="input-militar-nome"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: SILVA, DE SOUZA, CABRAL"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-600 font-mono uppercase"
              />
            </div>
          </div>

          {/* Form Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            id="btn-submit-militar"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg py-3 px-4 shadow-lg shadow-blue-950/50 hover:shadow-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 mt-6 border-b-2 border-slate-950 group pointer-events-auto cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                <span>{isConfigured ? 'Acessar Central RDS-PM' : 'Acessar Central RDS-PM (Modo Local)'}</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            O acesso será realizado utilizando o Nome de Guerra e Posto/Graduação indicados acima.
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-slate-600 text-[11px] font-mono z-10">
        <p>RDS-PM v2.2.0 • SESP/PMMT - Diretoria de Tecnologia e Operações</p>
        <p className="mt-1">Polícia Militar de Mato Grosso</p>
      </div>
    </div>
  );
}
