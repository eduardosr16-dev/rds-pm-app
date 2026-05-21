/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

  // First Access & Reset password states
  const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetRg, setResetRg] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const [modalError, setModalError] = useState<string | null>(null);

  // Database verification states
  const [checkingRg, setCheckingRg] = useState(false);
  const [dbCheckedHasPassword, setDbCheckedHasPassword] = useState<boolean | null>(null);
  const [dbCheckedExists, setDbCheckedExists] = useState<boolean | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Normalize input RG (keep only digits)
  const normalizedRg = rg.replace(/\D/g, '');

  // Look up officer in preloaded data
  const matchedPolicial = LISTA_POLICIAIS_PMMT.find(
    (p) => p.matricula.replace(/\D/g, '') === normalizedRg
  );

  // Check if password has been registered for this RG
  const isPasswordRegistered = dbCheckedHasPassword === null
    ? (localStorage.getItem('rdspm_has_pwd_' + normalizedRg) === 'true')
    : dbCheckedHasPassword;

  const formatRG = (value: string) => {
    // Strip non-numbers
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 3) {
      return digits;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}`;
  };

  // Perform dynamic database check on the 6 digit RG input
  useEffect(() => {
    if (normalizedRg.length === 6) {
      const checkCredentials = async () => {
        setCheckingRg(true);
        setErrorMsg(null);
        
        // Local existence check
        const localExists = LISTA_POLICIAIS_PMMT.some(
          (p) => p.matricula.replace(/\D/g, '') === normalizedRg
        );
        let existsInDb = localExists;
        let hasPasswordInDb = false;

        if (isConfigured && supabase) {
          try {
            // Check if user exists in the core policiais list database
            const { data: polData } = await supabase
              .from('policiais')
              .select('*')
              .eq('matricula', formatRG(normalizedRg))
              .maybeSingle();
            
            if (polData) {
              existsInDb = true;
            }

            // Check if user has an active password in 'usuarios_pm'
            const { data: usrData } = await supabase
              .from('usuarios_pm')
              .select('*')
              .eq('rg_pm', normalizedRg)
              .maybeSingle();

            if (usrData) {
              hasPasswordInDb = true;
              // Sync local storages
              localStorage.setItem('rdspm_has_pwd_' + normalizedRg, 'true');
              localStorage.setItem('rdspm_local_pwd_' + normalizedRg, usrData.senha_operacional);
            } else {
              hasPasswordInDb = localStorage.getItem('rdspm_has_pwd_' + normalizedRg) === 'true';
            }
          } catch (e) {
            console.error('Erro de busca de credenciais:', e);
            hasPasswordInDb = localStorage.getItem('rdspm_has_pwd_' + normalizedRg) === 'true';
          }
        } else {
          hasPasswordInDb = localStorage.getItem('rdspm_has_pwd_' + normalizedRg) === 'true';
        }

        setDbCheckedExists(existsInDb);
        setDbCheckedHasPassword(hasPasswordInDb);
        setCheckingRg(false);
      };

      checkCredentials();
    } else {
      setDbCheckedExists(null);
      setDbCheckedHasPassword(null);
    }
  }, [normalizedRg, isConfigured]);

  // Check if we also need name/rank input for unrecognized RGs
  const showCustomFields = normalizedRg.length === 6 && !matchedPolicial;

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

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNewPassword(digits);
    setModalError(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setConfirmPassword(digits);
    setModalError(null);
  };

  // Create password validation and save on Supabase + Local memory
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setModalError('A senha operacional deve conter exatamente 6 números.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    setModalError(null);

    const cleanPassword = newPassword;

    let finalName = '';
    let finalCargo = '';

    if (matchedPolicial) {
      finalName = matchedPolicial.nome_completo;
      finalCargo = matchedPolicial.graduacao;
    } else {
      finalName = customName.trim() ? customName.toUpperCase() : `MILITAR PM ${normalizedRg}`;
      finalCargo = customCargo;
    }

    try {
      if (isConfigured && supabase) {
        // Direct table check for unique key
        const { data: existingUser } = await supabase
          .from('usuarios_pm')
          .select('*')
          .eq('rg_pm', normalizedRg)
          .maybeSingle();

        if (existingUser) {
          setModalError('Este militar já possui cadastro operacional. Use "Esqueci minha senha" para redefinir.');
          setLoading(false);
          return;
        }

        // Insert password operational directamente in DB
        const { error: insertError } = await supabase
          .from('usuarios_pm')
          .insert([{
            rg_pm: normalizedRg,
            nome: finalName,
            graduacao: finalCargo,
            senha_operacional: cleanPassword,
            ativo: true
          }]);

        if (insertError) {
          throw insertError;
        }
      }

      // Save locally
      localStorage.setItem('rdspm_has_pwd_' + normalizedRg, 'true');
      localStorage.setItem('rdspm_local_pwd_' + normalizedRg, cleanPassword);

      // Instantly update local UI states
      setDbCheckedHasPassword(true);
      setDbCheckedExists(true);

      setMessage(`Senha operacional cadastrada com sucesso! Realize o login utilizando a senha criada.`);
      setPassword(newPassword);
      setShowCreatePasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erro ao registrar senha de serviço:', err);
      setModalError(err.message || 'Falha ao salvar senha operacional.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password handler ("Esqueci minha senha")
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedResetRg = resetRg.replace(/\D/g, '');

    if (normalizedResetRg.length < 6) {
      setModalError('O RG PM deve conter 6 números.');
      return;
    }
    if (resetPassword.length < 6) {
      setModalError('A nova senha operacional deve conter exatamente 6 números.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setModalError('As senhas de redefinição não coincidem.');
      return;
    }

    setLoading(true);
    setModalError(null);

    try {
      // Local Database reset
      localStorage.setItem('rdspm_has_pwd_' + normalizedResetRg, 'true');
      localStorage.setItem('rdspm_local_pwd_' + normalizedResetRg, resetPassword);

      if (isConfigured && supabase) {
        // Find existing user PM
        const { data: existingUser } = await supabase
          .from('usuarios_pm')
          .select('*')
          .eq('rg_pm', normalizedResetRg)
          .maybeSingle();

        if (existingUser) {
          const { error: updateError } = await supabase
            .from('usuarios_pm')
            .update({ senha_operacional: resetPassword })
            .eq('rg_pm', normalizedResetRg);

          if (updateError) throw updateError;
        } else {
          // If no user was present in other table, create them on reset
          let finalName = `MILITAR PM ${normalizedResetRg}`;
          let finalCargo = 'Soldado';

          const matched = LISTA_POLICIAIS_PMMT.find(
            (p) => p.matricula.replace(/\D/g, '') === normalizedResetRg
          );
          if (matched) {
            finalName = matched.nome_completo;
            finalCargo = matched.graduacao;
          }

          const { error: insertError } = await supabase
            .from('usuarios_pm')
            .insert([{
              rg_pm: normalizedResetRg,
              nome: finalName,
              graduacao: finalCargo,
              senha_operacional: resetPassword,
              ativo: true
            }]);

          if (insertError) throw insertError;
        }
      }

      setMessage(`Senha redefinida com sucesso para o RG PM: ${resetRg}. Faça o logon.`);
      setRg(resetRg);
      setPassword(resetPassword);

      if (normalizedResetRg === normalizedRg) {
        setDbCheckedHasPassword(true);
        setDbCheckedExists(true);
      }

      setShowResetPasswordModal(false);
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      console.error('Erro de redefinição:', err);
      setModalError('Falha ao redefinir credencial de serviço.');
    } finally {
      setLoading(false);
    }
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
      setErrorMsg('Senha operacional inválida');
      return;
    }

    // 3. Match against local password if registered
    const registeredLocalPwd = localStorage.getItem('rdspm_local_pwd_' + normalizedRg);
    if (registeredLocalPwd && password !== registeredLocalPwd) {
      setErrorMsg('Senha operacional inválida');
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
      setErrorMsg('Senha operacional inválida');
      return;
    }

    setErrorMsg(null);
    setMessage(null);
    setLoading(true);

    try {
      // Connect to table usuarios_pm to fetch valid user row
      const { data, error } = await supabase!
        .from('usuarios_pm')
        .select('*')
        .eq('rg_pm', normalizedRg)
        .eq('senha_operacional', password)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('Erro de conexao / consulta usuarios_pm:', error);
        throw new Error('Falha de conexão com a Central de Controles');
      }

      if (!data) {
        // Red warning text indicating failure to identify credentials
        throw new Error('Senha operacional inválida');
      }

      // Sync local storage state
      localStorage.setItem('rdspm_has_pwd_' + normalizedRg, 'true');
      localStorage.setItem('rdspm_local_pwd_' + normalizedRg, password);

      onLoginSuccess({
        id: data.id,
        email: `${normalizedRg}@pm.mt.gov.br`,
        name: `${data.graduacao} ${data.nome}`,
        role: data.graduacao,
        matricula: rg,
        isDemo: false
      });
    } catch (err: any) {
      console.error('Erro de autenticação PMMT:', err);
      setErrorMsg(err.message || 'Senha operacional inválida');
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

          {/* First Access / Primeiro Acesso Action Box display when RG is valid (6 numbers) but credentials are empty */}
          {normalizedRg.length === 6 && !isPasswordRegistered && (
            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl text-center space-y-3 animate-fade-in my-3" id="primeiro-acesso-card">
              <div className="flex justify-center text-amber-500">
                <Shield className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Primeiro Acesso Detectado</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Não identificamos nenhuma Senha Operacional salva para este registro militar {matchedPolicial ? `de ${matchedPolicial.graduacao} ${matchedPolicial.nome_completo.split(' ')[0]}` : ''}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setModalError(null);
                  setShowCreatePasswordModal(true);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-lg py-2.5 px-4 shadow-lg shadow-amber-950/20 transition-all duration-200 mt-2 flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto"
                id="btn-criar-senha"
              >
                <Lock className="h-4 w-4" />
                <span>Criar Senha Operacional</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Bypass to enter anyway
                  localStorage.setItem('rdspm_has_pwd_' + normalizedRg, 'true');
                }}
                className="text-[10px] text-slate-500 hover:text-amber-500 hover:underline font-mono uppercase tracking-wider transition block mx-auto pt-1 cursor-pointer"
              >
                Inserir senha já cadastrada
              </button>
            </div>
          )}

          {/* Password field (only visible when password exists/bypassed, OR if RG has not reached full length) */}
          {(isPasswordRegistered || normalizedRg.length < 6) && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="input-militar-senha" className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Senha Operacional
                </label>
                {normalizedRg.length === 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetRg(rg);
                      setResetPassword('');
                      setResetConfirmPassword('');
                      setModalError(null);
                      setShowResetPasswordModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-500 hover:text-amber-400 font-sans transition hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
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
          )}

          {/* Form Action Submit Button (Only clickable when password exists/entered or smaller length) */}
          {(isPasswordRegistered || normalizedRg.length < 6) && (
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
          )}

          <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto font-mono uppercase tracking-wider">
            Acesso Restrito a Policiais Militares do Estado de Mato Grosso.
          </div>
        </form>
      </div>

      {/* FOOTER */}
      <div className="mt-8 text-center text-slate-600 text-[11px] font-mono z-10">
        <p>RDS-PM v2.4.0 • SESP/PMMT - Diretoria de Tecnologia e Operações</p>
        <p className="mt-1 font-semibold text-slate-700">Polícia Militar de Mato Grosso</p>
      </div>

      {/* CREATE PASSWORD MODAL */}
      {showCreatePasswordModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" id="create-modal-container">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
            {/* flag bar */}
            <div className="h-1.5 w-full flex">
              <div className="bg-emerald-600 h-full flex-1" />
              <div className="bg-white h-full flex-1" />
              <div className="bg-blue-600 h-full flex-1" />
              <div className="bg-amber-400 h-full flex-1" />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Primeiro Acesso Militar</h3>
                  <p className="text-xs text-slate-400 font-mono">Definindo senha para RG: {rg}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 mb-4">
                Prezado policial, estabeleça sua senha operacional de acesso pessoal. Esta senha deve conter exatamente 6 dígitos numéricos.
              </p>

              {modalError && (
                <div className="mb-4 p-3.5 bg-red-950/50 border border-red-500/50 rounded-lg text-red-100 text-xs flex gap-2 items-center">
                  <Shield className="h-4.5 w-4.5 text-red-400 shrink-0 animate-pulse" />
                  <span className="font-mono font-semibold">{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 tracking-wider">Nova Senha Operacional</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder="6 números"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 tracking-wider">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Repita os 6 números"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                  />
                </div>

                <div className="flex gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePasswordModal(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setModalError(null);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg py-2.5 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-lg py-2.5 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      'Salvar Senha'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" id="reset-modal-container">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
            {/* flag bar */}
            <div className="h-1.5 w-full flex">
              <div className="bg-emerald-600 h-full flex-1" />
              <div className="bg-white h-full flex-1" />
              <div className="bg-blue-600 h-full flex-1" />
              <div className="bg-amber-400 h-full flex-1" />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Recuperar Senha de Serviço</h3>
                  <p className="text-xs text-slate-400 font-mono">PMMT Diretoria de Informática</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 mb-4">
                Insira o seu registro militar e configure seu novo código operacional de 6 dígitos numéricos.
              </p>

              {modalError && (
                <div className="mb-4 p-3.5 bg-red-950/50 border border-red-500/50 rounded-lg text-red-100 text-xs flex gap-2 items-center">
                  <Shield className="h-4.5 w-4.5 text-red-400 shrink-0" />
                  <span className="font-mono font-semibold">{modalError}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 tracking-wider">Seu RG PM</label>
                  <input
                    type="text"
                    required
                    value={resetRg}
                    onChange={(e) => setResetRg(formatRG(e.target.value))}
                    placeholder="EX: 883.694"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 tracking-wider">Nova Senha (6 números)</label>
                  <input
                    type="password"
                    required
                    value={resetPassword}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetPassword(digits);
                    }}
                    placeholder="nova senha"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 tracking-wider">Repetir Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPassword}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetConfirmPassword(digits);
                    }}
                    placeholder="confirmação"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                  />
                </div>

                <div className="flex gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      setResetPassword('');
                      setResetConfirmPassword('');
                      setModalError(null);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg py-2.5 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-lg py-2.5 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      'Salvar Alteração'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

