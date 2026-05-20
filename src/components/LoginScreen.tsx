/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { UserSession } from '../types';
import { Shield, Key, Mail, UserPlus, LogIn, Laptop, Globe, Info } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [cargo, setCargo] = useState('Soldado');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleLocalDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Por favor, informe seu e-mail funcional.');
      return;
    }
    
    setLoading(true);
    // Simulate tiny network delay for realism and visual feedback
    setTimeout(() => {
      // Parse militar prefix/name if supplied
      const cleanEmail = email.toLowerCase().trim();
      let detectedName = name || 'Militar Demonstrativo';
      
      if (!name) {
        if (cleanEmail.includes('silva')) {
          detectedName = 'Sgt PM Silva';
        } else if (cleanEmail.includes('gomes')) {
          detectedName = 'Ten PM Gomes';
        } else if (cleanEmail.includes('souza')) {
          detectedName = 'Cb PM Souza';
        } else {
          const namePart = cleanEmail.split('@')[0];
          // Capitalize first letter
          detectedName = `${cargo} PM ${namePart.charAt(0).toUpperCase() + namePart.slice(1)}`;
        }
      } else {
        detectedName = `${cargo} PM ${name}`;
      }

      onLoginSuccess({
        id: 'local-user-id',
        email: cleanEmail,
        name: detectedName,
        role: cargo,
        isDemo: true
      });
      setLoading(false);
    }, 800);
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;

    if (!email || !password) {
      setErrorMsg('E-mail e senha são obrigatórios para a conexão Supabase.');
      return;
    }

    setErrorMsg(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up logic
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${cargo} PM ${name || 'Militar'}`,
              role: cargo,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          setMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário, ou tente efetuar o login.');
          setIsSignUp(false);
        }
      } else {
        // Sign in logic
        const { data, error } = await supabase!.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user && data.session) {
          const metadata = data.user.user_metadata;
          onLoginSuccess({
            id: data.user.id,
            email: data.user.email || email,
            name: metadata?.full_name || `${metadata?.role || 'Militar'} PM Sem Nome`,
            role: metadata?.role || 'Policial',
            isDemo: false
          });
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação no Supabase:', err);
      setErrorMsg(err.message || 'Código de erro ou credenciais inválidas.');
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
        <div className="p-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-900 to-blue-700 border border-amber-400 p-3 mb-4 shadow-lg shadow-blue-900/30">
            {/* SVG Crest of Polícia Militar de Mato Grosso (Symmetric interpretation) */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400 fill-current">
              {/* Star */}
              <polygon points="50,10 62,38 91,38 67,56 76,85 50,67 24,85 33,56 9,38 38,38" />
              {/* Crossed Swords Swords behind */}
              <path d="M25,25 L75,75 M75,25 L25,75" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
              {/* Center shield circle */}
              <circle cx="50" cy="53" r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
              <path d="M50,44 L50,62 M41,53 L59,53" stroke="#f59e0b" strokeWidth="2" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold font-sans tracking-tight text-white mb-1 uppercase">
            Sistema RDS-PM
          </h2>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Polícia Militar de Mato Grosso
          </p>
          <div className="mt-2 text-xs text-blue-400 font-medium">
            Relatório Diário de Serviço Geral
          </div>
        </div>

        {/* Connection Mode Indicator */}
        <div className="px-8 pb-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400 text-xs font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Conexão Supabase ativa e parametrizada.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 p-3 bg-amber-950/40 border border-amber-900/50 rounded-lg text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-semibold">Modo de Simulação Local Ativo</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                As variáveis do Supabase não estão configuradas nas credenciais. Os relatórios inseridos ficarão salvos localmente neste navegador.
              </p>
            </div>
          )}
        </div>

        {/* Error or Neutral Messages */}
        {errorMsg && (
          <div className="mx-8 mt-2 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-300 text-xs font-sans">
            <strong>Erro: </strong> {errorMsg}
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
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Posto / Graduação</label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
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

          {/* Full Name input for registration or customized profile */}
          {(isSignUp || !isConfigured) && (
            <div>
              <label htmlFor="input-militar-nome" className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Nome de Guerra</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="input-militar-nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: SILVA, GOMES, SOUZA"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-600"
                />
              </div>
            </div>
          )}

          {/* Functional Email Input */}
          <div>
            <label htmlFor="input-militar-email" className="block text-xs font-mono text-slate-400 uppercase mb-1.5">E-mail Corporativo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <input
                id="input-militar-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EX: nome.sobrenome@pm.mt.gov.br"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-600"
              />
            </div>
          </div>

          {/* Password Input for Supabase flow */}
          {isConfigured && (
            <div>
              <label htmlFor="input-militar-senha" className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="input-militar-senha"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-600"
                />
              </div>
            </div>
          )}

          {/* Form Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            id="btn-submit-militar"
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg py-3 px-4 shadow-lg shadow-blue-950/50 hover:shadow-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 mt-6 border-b-2 border-slate-950 group pointer-events-auto"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Registrar Novo Oficial / Praça</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                <span>{isConfigured ? 'Acessar Central RDS-PM' : 'Entrar no Sistema (Modo Local)'}</span>
              </>
            )}
          </button>

          {/* Interactive Login/Sign-up switch inside Supabase state */}
          {isConfigured ? (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                  setMessage(null);
                }}
                className="text-xs text-slate-400 hover:text-amber-400 transition underline underline-offset-4"
              >
                {isSignUp ? 'Já tem uma conta? Entre por aqui' : 'Não tem login? Cadastre seu perfil policial no Supabase'}
              </button>
            </div>
          ) : (
            <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Como o Supabase não está inicializado na nuvem, você pode inserir qualquer e-mail para conectar ao banco embarcado temporário local.
            </div>
          )}
        </form>
      </div>

      <div className="mt-8 text-center text-slate-600 text-[11px] font-mono z-10">
        <p>RDS-PM v2.1.0 • ASSOB/PMMT - Diretoria de Tecnologia da Informação e Comunicação</p>
        <p className="mt-1">Governo do Estado de Mato Grosso</p>
      </div>
    </div>
  );
}
