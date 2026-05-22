/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { UserSession } from '../types';
import { LISTA_POLICIAIS_PMMT } from '../data/policiais';
import { Shield, LogIn, Lock, Fingerprint } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [rg, setRg] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Normalize RG PM to numeric format
  const formatRG = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 3) {
      return digits;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}`;
  };

  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRG(e.target.value);
    setRg(formatted);
    setErrorMsg(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPassword(digits);
    setErrorMsg(null);
  };

  // Submit and Login action
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRg = rg.replace(/\D/g, '');

    if (cleanRg.length < 6) {
      setErrorMsg('RG PM inválido. Deve conter 6 dígitos.');
      return;
    }
    if (password.length !== 6) {
      setErrorMsg('Senha operacional inválida. Deve conter exactamente 6 dígitos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    if (isConfigured && supabase) {
      try {
        console.log(`[RDS-PM] Conectando com Supabase para autenticar RG PM: ${cleanRg}`);
        const { data, error } = await supabase
          .from('usuarios_pm')
          .select('*')
          .eq('rg_pm', cleanRg)
          .eq('senha_operacional', password)
          .eq('ativo', true)
          .maybeSingle();

        if (error) {
          console.error('[RDS-PM] Erro de busca usuarios_pm:', error);
          throw new Error('Erro na conexão com a base de dados.');
        }

        if (!data) {
          setErrorMsg('RG PM ou senha inválidos.');
          setLoading(false);
          return;
        }

        // Success - load name and rank
        const userGrad = data.graduacao || 'POLICIAL MILITAR';
        const userNome = data.nome || 'USUÁRIO';

        console.log(`[RDS-PM] Login sucedido para ${userGrad} ${userNome}`);

        onLoginSuccess({
          id: data.id || `pm-id-${cleanRg}`,
          email: data.email || `${cleanRg}@pm.mt.gov.br`,
          name: `${userGrad} ${userNome}`,
          role: userGrad,
          matricula: rg || data.rg_pm || cleanRg,
          isDemo: false
        });

      } catch (err: any) {
        console.error('[RDS-PM] Erro durante o fluxo de login:', err);
        setErrorMsg('RG PM ou senha inválidos.');
      } finally {
        setLoading(false);
      }
    } else {
      // Offline local mode fallback
      setTimeout(() => {
        const matched = LISTA_POLICIAIS_PMMT.find(
          (p) => p.matricula.replace(/\D/g, '') === cleanRg
        );

        const userGrad = matched?.graduacao || 'POLICIAL MILITAR';
        const userNome = matched?.nome_completo || 'MILITAR OPERACIONAL';

        onLoginSuccess({
          id: `local-user-id-${cleanRg}`,
          email: `${cleanRg}@pm.mt.gov.br`,
          name: `${userGrad} ${userNome}`,
          role: userGrad,
          matricula: rg,
          isDemo: true
        });
        setLoading(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" id="login-screen-wrapper">
      
      {/* Decorative ambiance elements */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card Container */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10" id="login-container">
        
        {/* Mato Grosso State Theme Color Ribbon */}
        <div className="h-1.5 w-full flex">
          <div className="bg-emerald-600 h-full flex-1" />
          <div className="bg-white h-full flex-1" />
          <div className="bg-blue-600 h-full flex-1" />
          <div className="bg-amber-400 h-full flex-1" />
        </div>

        {/* PMMT Official Insignia / Shield Header */}
        <div className="p-8 pb-4 text-center flex flex-col items-center">
          <div className="relative mb-4 flex items-center justify-center w-24 h-24 bg-slate-950/20 rounded-full border border-slate-800/40 p-2 shadow-2xl transition-all duration-300 hover:border-amber-500/35">
            <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-sm" />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
              alt="Brasão PMMT Oficial" 
              className="relative w-20 h-20 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-2xl font-black font-sans tracking-tight text-white mb-1 uppercase">
            Sistema RDS-PM
          </h2>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Polícia Militar de Mato Grosso
          </p>
          <div className="mt-2 text-[10px] text-amber-500 font-bold font-mono uppercase tracking-wider bg-amber-950/20 border border-amber-900/30 px-3 py-0.5 rounded-full">
            Identificação de Serviço
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className="px-8 pb-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-emerald-400 text-xs font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono">Central de Controles Supabase Conectada</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-semibold font-mono">Modo Offline Local</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Supabase não configurado neste ambiente. O sistema está utilizando dados locais de demonstração para acesso.
              </p>
            </div>
          )}
        </div>

        {/* Error Alerts */}
        {errorMsg && (
          <div className="mx-8 mt-2 p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-200 text-xs font-sans flex gap-2.5 items-center">
            <div className="bg-red-900/50 p-1 rounded text-red-400 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold uppercase tracking-wider text-red-100">Erro de Login</div>
              <div className="font-mono mt-0.5 text-xs font-semibold">{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Simplified Credentials Input Form */}
        <form onSubmit={handleLoginSubmit} className="p-8 pt-4 space-y-4">
          
          {/* RG PM Address Input */}
          <div>
            <label htmlFor="input-militar-rg" className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
              RG PM
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Fingerprint className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <input
                id="input-militar-rg"
                type="text"
                required
                value={rg}
                onChange={handleRgChange}
                placeholder="EX: 883.694"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-600 font-mono"
              />
            </div>
          </div>

          {/* Operational Password Field Input */}
          <div className="space-y-1.5">
            <label htmlFor="input-militar-senha" className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Senha Operacional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <input
                id="input-militar-senha"
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                placeholder="Digite sua senha de 6 números"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-600 font-mono tracking-widest text-center"
              />
            </div>
          </div>

          {/* Form Action Submit Trigger Button */}
          <button
            type="submit"
            disabled={loading}
            id="btn-submit-militar"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg py-3 px-4 shadow-lg shadow-blue-950/50 hover:shadow-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 mt-6 border-b-2 border-slate-950 font-sans cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>{isConfigured ? 'Acessar Central RDS-PM' : 'Acessar Central (Modo Local)'}</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto font-mono uppercase tracking-wider select-none">
            Acesso Restrito a Policiais Militares do Estado de Mato Grosso.
          </div>
        </form>
      </div>

      {/* FOOTER branding SESP / PMMT */}
      <div className="mt-8 text-center text-slate-600 text-[11px] font-mono z-10 selection:bg-transparent">
        <p>RDS-PM v2.4.0 • SESP/PMMT - Diretoria de Tecnologia e Operações</p>
        <p className="mt-1 font-semibold text-slate-700">Polícia Militar de Mato Grosso</p>
      </div>
    </div>
  );
}
