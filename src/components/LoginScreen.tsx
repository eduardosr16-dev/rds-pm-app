/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { UserSession } from '../types';
import { LISTA_POLICIAIS_PMMT } from '../data/policiais';
import { Shield, LogIn, Lock, Info, CheckCircle, Fingerprint } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [rg, setRg] = useState('');
  const [password, setPassword] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCargo, setCustomCargo] = useState('Soldado');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Normalize input RG (keep only digits)
  const normalizedRg = rg.replace(/\D/g, '');

  // Look up officer in preloaded data
  const matchedPolicial = LISTA_POLICIAIS_PMMT.find(
    (p) => p.matricula.replace(/\D/g, '') === normalizedRg
  );

  // Check if we also need name/rank input for unrecognized RGs
  const showCustomFields = normalizedRg.length === 6 && !matchedPolicial;

  const formatRG = (value: string) => {
    // Strip non-numbers
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
    // Only digits and max 6 character length
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPassword(digits);
    setErrorMsg(null);
  };

  const handleLocalDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Password must be exactly 6 digits
    if (password.length < 6) {
      setErrorMsg('Senha operacional inválida');
      return;
    }

    // 2. RG PM must be exactly 6 digits
    if (normalizedRg.length < 6) {
      setErrorMsg('O RG PM deve conter 6 dígitos.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let finalName = '';
      let finalCargo = '';

      if (matchedPolicial) {
        finalName = matchedPolicial.nome_completo;
        finalCargo = matchedPolicial.graduacao;
      } else {
        finalName = customName.trim() ? customName.toUpperCase() : `MILITAR PM ${normalizedRg}`;
        finalCargo = customCargo;
      }

      onLoginSuccess({
        id: 'local-user-id-' + normalizedRg,
        email: `${normalizedRg}@pm.mt.gov.br`,
        name: `${finalCargo} ${finalName}`,
        role: finalCargo,
        matricula: rg,
        isDemo: true
      });
      setLoading(false);
    }, 850);
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;

    // 1. Password must be exactly 6 digits
    if (password.length < 6) {
      setErrorMsg('Senha operacional inválida');
      return;
    }

    // 2. RG PM must be exactly 6 digits
    if (normalizedRg.length < 6) {
      setErrorMsg('O RG PM deve conter 6 dígitos.');
      return;
    }

    setErrorMsg(null);
    setMessage(null);
    setLoading(true);

    const cleanEmail = `${normalizedRg}@pm.mt.gov.br`;
    const cleanPassword = password;

    try {
      // 1. Try to sign in first
      const { data, error } = await supabase!.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (error) {
        // 2. If user doesn't exist, sign up automatically
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('not found') ||
          error.status === 400
        ) {
          let finalName = '';
          let finalCargo = '';

          if (matchedPolicial) {
            finalName = matchedPolicial.nome_completo;
            finalCargo = matchedPolicial.graduacao;
          } else {
            if (!customName.trim()) {
              // Fail early if it was likely an invalid password for an unlisted existing user
              throw new Error('Senha operacional inválida');
            }
            finalName = customName.toUpperCase();
            finalCargo = customCargo;
          }

          const { data: signUpData, error: signUpError } = await supabase!.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: {
                full_name: `${finalCargo} ${finalName}`,
                role: finalCargo,
                rg_pm: normalizedRg,
              }
            }
          });

          if (signUpError) {
            throw new Error('Senha operacional inválida');
          }

          // In Supabase, if user already exists and we signUp, identities returns empty
          if (signUpData.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
            throw new Error('Senha operacional inválida');
          }

          if (signUpData.user) {
            // Sign in immediately
            const { data: signInData, error: signInError } = await supabase!.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword
            });

            if (signInError) throw new Error('Senha operacional inválida');

            if (signInData.user && signInData.session) {
              const metadata = signInData.user.user_metadata;
              onLoginSuccess({
                id: signInData.user.id,
                email: signInData.user.email || cleanEmail,
                name: metadata?.full_name || `${finalCargo} ${finalName}`,
                role: metadata?.role || finalCargo,
                matricula: rg,
                isDemo: false
              });
            }
          } else {
            throw new Error('Senha operacional inválida');
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
            name: metadata?.full_name || `Militar PM ${normalizedRg}`,
            role: metadata?.role || 'Militar',
            matricula: rg,
            isDemo: false
          });
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação PMMT:', err);
      setErrorMsg('Senha operacional inválida');
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
            Identificação Militar de Serviço
          </div>
        </div>

        {/* Connection Mode Indicator */}
        <div className="px-8 pb-1">
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

        {/* Institutional Visual Alert */}
        {errorMsg && (
          <div className="mx-8 mt-3 p-3.5 bg-red-950/50 border border-red-500/50 rounded-lg text-red-200 text-xs font-sans flex gap-2.5 items-center shadow-lg">
            <div className="bg-red-900/60 p-1.5 rounded text-red-400 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold uppercase tracking-wide text-red-100">Erro de Acesso</div>
              <div className="font-mono mt-0.5 text-xs font-semibold">{errorMsg}</div>
            </div>
          </div>
        )}

        {message && (
          <div className="mx-8 mt-3 p-3 bg-emerald-950/50 border border-emerald-900 rounded-lg text-emerald-300 text-xs font-sans">
            {message}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={isConfigured ? handleSupabaseAuth : handleLocalDemoLogin} className="p-8 pt-4 space-y-4">
          
          {/* RG PM (accepts numerical only) */}
          <div>
            <label htmlFor="input-militar-rg" className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">RG PM</label>
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

          {/* Dynamic feedback indicator when RG PM matched */}
          {matchedPolicial && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/80 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-sans animate-fade-in">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Militar Identificado: <strong>{matchedPolicial.graduacao} PM {matchedPolicial.nome_completo.split(' ')[0]}</strong>
              </span>
            </div>
          )}

          {/* New account custom registration slides-down if not recognized */}
          {showCustomFields && (
            <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl space-y-3.5 animate-fade-in" id="custom-fields-panel">
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-3 w-3 text-amber-500" />
                <span>RG não cadastrado em sistema (Registro Rápido)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-militar-custom-cargo" className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Graduação</label>
                  <select
                    id="input-militar-custom-cargo"
                    value={customCargo}
                    onChange={(e) => setCustomCargo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400 transition"
                  >
                    <option value="Soldado">Soldado PM</option>
                    <option value="Cabo">Cabo PM</option>
                    <option value="3º Sargento">3º Sargento PM</option>
                    <option value="2º Sargento">2º SGT PM</option>
                    <option value="1º Sargento">1º SGT PM</option>
                    <option value="Subtenente">Subtenente</option>
                    <option value="Tenente">Tenente PM</option>
                    <option value="Capitão">Capitão PM</option>
                    <option value="Major">Major PM</option>
                    <option value="Tenente-Coronel">Ten.-Cel. PM</option>
                    <option value="Coronel">Coronel PM</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="input-militar-custom-nome" className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Nome de Guerra</label>
                  <input
                    id="input-militar-custom-nome"
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="EX: SILVA, DE SOUZA"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400 transition uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password field (accepts numerical only, 6 digits) */}
          <div>
            <label htmlFor="input-militar-senha" className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Senha Operacional</label>
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

          <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto font-mono uppercase tracking-wider">
            Acesso Restrito a Policiais Militares do Estado de Mato Grosso.
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-slate-600 text-[11px] font-mono z-10">
        <p>RDS-PM v2.3.0 • SESP/PMMT - Diretoria de Tecnologia e Operações</p>
        <p className="mt-1 font-semibold text-slate-700">Polícia Militar de Mato Grosso</p>
      </div>
    </div>
  );
}

