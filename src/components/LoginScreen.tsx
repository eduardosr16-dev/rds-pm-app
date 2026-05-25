/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { UserSession } from '../types';
import { LISTA_POLICIAIS_PMMT } from '../data/policiais';
import { Shield, LogIn, Lock, Fingerprint, CheckCircle2, User, Award, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Tabs: 'login', 'primeiro_acesso', or 'alterar'
  const [activeTab, setActiveTab] = useState<'login' | 'primeiro_acesso' | 'alterar'>('login');

  // Login states
  const [rg, setRg] = useState('');
  const [password, setPassword] = useState('');

  // First Access (Primeiro Acesso) states
  const [regRg, setRegRg] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [identifiedOfficer, setIdentifiedOfficer] = useState<{ graduacao: string; nome_completo: string } | null>(null);

  // Password alteration states
  const [altRg, setAltRg] = useState('');
  const [altCurrentPass, setAltCurrentPass] = useState('');
  const [altNewPass, setAltNewPass] = useState('');

  // Status indicators
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Normalize RG PM to numeric format (e.g. 123.456)
  const formatRG = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 3) {
      return digits;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}`;
  };

  // Perform live lookup when the military officer types their RG in Primeiro Acesso
  useEffect(() => {
    const cleanRg = regRg.replace(/\D/g, '');
    if (cleanRg.length === 6) {
      const match = LISTA_POLICIAIS_PMMT.find(
        (p) => p.matricula.replace(/\D/g, '') === cleanRg
      );
      if (match) {
        setIdentifiedOfficer({
          graduacao: match.graduacao,
          nome_completo: match.nome_completo,
        });
        setErrorMsg(null);
      } else {
        setIdentifiedOfficer(null);
        setErrorMsg('Militar não localizado na relação oficial de efetivos.');
      }
    } else {
      setIdentifiedOfficer(null);
    }
  }, [regRg]);

  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRG(e.target.value);
    setRg(formatted);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPassword(digits);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleRegRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRG(e.target.value);
    setRegRg(formatted);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleRegPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setRegPassword(digits);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAltRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRG(e.target.value);
    setAltRg(formatted);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAltCurrentPassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAltCurrentPass(digits);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAltNewPassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAltNewPass(digits);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const clearFormStates = () => {
    setRg('');
    setPassword('');
    setRegRg('');
    setRegPassword('');
    setIdentifiedOfficer(null);
    setAltRg('');
    setAltCurrentPass('');
    setAltNewPass('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Login Handler (Utiliza o e-mail real armazenado na tabela de usuarios)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRg = rg.replace(/\D/g, '');

    if (!cleanRg) {
      setErrorMsg('O número do RG PM é obrigatório.');
      return;
    }
    if (cleanRg.length < 6) {
      setErrorMsg('RG PM inválido. Deve conter 6 dígitos.');
      return;
    }
    if (!password) {
      setErrorMsg('A senha operacional é obrigatória.');
      return;
    }
    if (password.length !== 6) {
      setErrorMsg('A senha operacional deve conter exatamente 6 números.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isConfigured && supabase) {
      try {
        console.log(`[RDS-PM] Buscando cadastro do militar reg_pm: ${cleanRg}`);
        
        // 1. Check if user has done Primeiro Acesso inside table 'usuarios' and select their e-mail
        const { data: dbUser, error: dbError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('rg_pm', cleanRg)
          .maybeSingle();

        if (dbError) {
          console.error('[RDS-PM] Erro ao buscar cadastro na tabela usuarios:', dbError);
          throw new Error('Erro na conexão com dados cadastrais: ' + dbError.message);
        }

        if (!dbUser) {
          throw new Error('Militar sem Primeiro Acesso realizado ou não localizado na tabela usuarios. Clique no botão "Primeiro Acesso" para criar sua conta.');
        }

        if (!dbUser.ativo) {
          throw new Error('Sua credencial militar foi temporariamente desativada pela administração.');
        }

        const realEmail = dbUser.email;
        if (!realEmail) {
          throw new Error('Seu cadastro no banco não possui um e-mail válido vinculado. Por favor, acesse Primeiro Acesso para refazer o cadastro.');
        }

        // 2. Perform authenticating with Supabase Auth using the REAL email from the database
        console.log(`[RDS-PM] Autenticando com Supabase Auth para e-mail real: ${realEmail}`);
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: realEmail,
          password: password,
        });

        if (authError) {
          console.error('[RDS-PM] Erro de autenticação Supabase Auth:', authError);
          throw new Error('Senha operacional incorreta para o militar informado.');
        }

        const userGrad = dbUser.posto || 'POLICIAL MILITAR';
        const userNome = dbUser.nome || 'MILITAR';

        console.log(`[RDS-PM] Login efetuado com sucesso: ${userGrad} ${userNome}`);

        onLoginSuccess({
          id: dbUser.id || `pm-id-${cleanRg}`,
          email: realEmail,
          name: `${userGrad} ${userNome}`,
          role: userGrad,
          matricula: rg || dbUser.rg_pm || cleanRg,
          isDemo: false
        });

      } catch (err: any) {
        console.error('[RDS-PM] Erro durante login:', err);
        setErrorMsg(err?.message || 'RG PM ou senha inválidos.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local development mock mode fallback
      setTimeout(() => {
        let localUsers: any[] = [];
        try {
          const raw = localStorage.getItem('rdspm_local_usuarios');
          if (raw) localUsers = JSON.parse(raw);
        } catch {}

        const localUser = localUsers.find((u) => u.rg_pm === cleanRg);

        if (!localUser) {
          // Check if officer is at least in standard list and offer first access
          const isOfficer = LISTA_POLICIAIS_PMMT.some(
            (o) => o.matricula.replace(/\D/g, '') === cleanRg
          );
          if (isOfficer) {
            setErrorMsg('Seu primeiro acesso ainda não foi efetuado. Por favor, clique na opção "Primeiro Acesso" e defina sua senha.');
          } else {
            setErrorMsg('RG PM não cadastrado ou não faz parte do efetivo autorizado.');
          }
          setLoading(false);
          return;
        }

        // Fetch matches from standard list to keep credentials synced
        const matchedDefault = LISTA_POLICIAIS_PMMT.find(
          (p) => p.matricula.replace(/\D/g, '') === cleanRg
        );

        const graduacao = localUser.posto || matchedDefault?.graduacao || 'POLICIAL';
        const nome = localUser.nome || matchedDefault?.nome_completo || 'MILITAR';
        const realEmail = localUser.email || 'militar@pmmt.gov.br';

        // Check local password which was saved in local storage legacy / new file
        let isCorrectPass = false;
        try {
          // Check legacy local storage password
          const legacyRaw = localStorage.getItem('rdspm_local_users');
          if (legacyRaw) {
            const legacyUsers = JSON.parse(legacyRaw);
            const legUser = legacyUsers.find(
              (u: any) => u.rg_pm === cleanRg && u.senha_operacional === password
            );
            if (legUser) isCorrectPass = true;
          }
        } catch {}

        // Fallback or local usuarios save checks
        if (localUser.senha_mock === password) {
          isCorrectPass = true;
        }

        if (!isCorrectPass) {
          setErrorMsg('RG PM ou senha operacional inválidos no portal local.');
          setLoading(false);
          return;
        }

        onLoginSuccess({
          id: `local-user-id-${cleanRg}`,
          email: realEmail,
          name: `${graduacao} ${nome}`,
          role: graduacao,
          matricula: rg,
          isDemo: true
        });
        setLoading(false);
      }, 600);
    }
  };

  // First Access (Primeiro Acesso) Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRg = regRg.replace(/\D/g, '');

    if (!cleanRg) {
      setErrorMsg('RG PM é obrigatório.');
      return;
    }
    if (cleanRg.length < 6) {
      setErrorMsg('RG PM inválido. Deve conter 6 dígitos.');
      return;
    }
    if (!regPassword) {
      setErrorMsg('A senha operacional é obrigatória.');
      return;
    }
    if (regPassword.length !== 6) {
      setErrorMsg('A senha operacional deve conter exatamente 6 números.');
      return;
    }

    const officialOfficer = LISTA_POLICIAIS_PMMT.find(
      (p) => p.matricula.replace(/\D/g, '') === cleanRg
    );

    if (!officialOfficer) {
      setErrorMsg('Seu RG PM não foi localizado na relação oficial de 22 policiais militares.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Helpers to generate professional email in case of database absence or offline testing fallbacks
    const getProfessionalEmail = (nameStr: string, rgStr: string) => {
      const parts = nameStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(p => p.length > 2);
      if (parts.length >= 2) {
        return `${parts[0]}.${parts[parts.length - 1]}@pm.mt.gov.br`;
      } else if (parts.length === 1) {
        return `${parts[0]}@pm.mt.gov.br`;
      }
      return `militar.${rgStr}@pm.mt.gov.br`;
    };

    if (isConfigured && supabase) {
      try {
        console.log(`[RDS-PM] Iniciando Primeiro Acesso para RG: ${cleanRg}`);

        // 1. Check if user exists in usuarios table and has primeiro_acesso = true
        const { data: dbUser, error: dbError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('rg_pm', cleanRg)
          .maybeSingle();

        if (dbError && dbError.code !== 'PGRST116') {
          console.error('[RDS-PM] Erro ao buscar usuario:', dbError);
          throw new Error('Erro ao verificar cadastro: ' + dbError.message);
        }

        if (!dbUser) {
          throw new Error('RG PM não encontrado no cadastro de militares. Verifique se seu RG está correto.');
        }

        if (!dbUser.primeiro_acesso) {
          throw new Error('Este RG PM já possui Primeiro Acesso concluído. Faça login normalmente.');
        }

        const email = dbUser.email || getProfessionalEmail(officialOfficer.nome_completo, cleanRg);
        const nome = dbUser.nome || officialOfficer.nome_completo;
        const posto = dbUser.posto || officialOfficer.graduacao;

        console.log(`[RDS-PM] Criando conta Supabase Auth para: ${email}`);

        // 2. Create Supabase Auth account using signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: regPassword,
          options: {
            data: {
              rg_pm: cleanRg,
              nome: nome,
              posto: posto
            }
          }
        });

        if (authError) {
          console.error('[RDS-PM] Erro no signUp:', authError);
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            // User already exists in auth, try to sign in to verify password
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: email,
              password: regPassword
            });
            if (signInError) {
              throw new Error('Este e-mail já está cadastrado. Se esqueceu sua senha, use a opção "Alterar Senha".');
            }
          } else {
            throw new Error('Erro ao criar conta: ' + authError.message);
          }
        }

        // 3. Update usuarios table to mark primeiro_acesso = false
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ primeiro_acesso: false })
          .eq('rg_pm', cleanRg);

        if (updateError) {
          console.warn('[RDS-PM] Aviso ao atualizar primeiro_acesso:', updateError.message);
        }

        console.log('[RDS-PM] Primeiro Acesso concluído com sucesso!');

        // Return to login with state set
        setRg(regRg);
        setPassword('');
        setSuccessMsg(`Primeiro Acesso efetuado com sucesso para ${posto} ${nome}! Agora você pode entrar com seu RG PM e a senha cadastrada.`);
        setRegRg('');
        setRegPassword('');
        setIdentifiedOfficer(null);
        setActiveTab('login');

      } catch (err: any) {
        console.error('[RDS-PM] Erro no Primeiro Acesso:', err);
        setErrorMsg(err?.message || 'Falha ao processar o Primeiro Acesso.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local storage fallback mode
      try {
        let localUsuarios: any[] = [];
        try {
          const raw = localStorage.getItem('rdspm_local_usuarios');
          if (raw) localUsuarios = JSON.parse(raw);
        } catch {}

        const exists = localUsuarios.some((u) => u.rg_pm === cleanRg && u.primeiro_acesso === false);
        if (exists) {
          throw new Error('Este RG PM já possui Primeiro Acesso concluído localmente.');
        }

        const emailToUse = getProfessionalEmail(officialOfficer.nome_completo, cleanRg);

        // Define new local profiles
        const newLocalUsuario = {
          rg_pm: cleanRg,
          email: emailToUse,
          nome: officialOfficer.nome_completo,
          posto: officialOfficer.graduacao,
          ativo: true,
          primeiro_acesso: false,
          senha_mock: regPassword
        };

        // Filter old rows if any, then insert
        localUsuarios = localUsuarios.filter((u) => u.rg_pm !== cleanRg);
        localUsuarios.push(newLocalUsuario);
        localStorage.setItem('rdspm_local_usuarios', JSON.stringify(localUsuarios));

        // Legacy compatibility local storage write
        let legacyUsers: any[] = [];
        try {
          const legRaw = localStorage.getItem('rdspm_local_users');
          if (legRaw) legacyUsers = JSON.parse(legRaw);
        } catch {}
        legacyUsers = legacyUsers.filter((u) => u.rg_pm !== cleanRg);
        legacyUsers.push({
          rg_pm: cleanRg,
          nome: officialOfficer.nome_completo,
          graduacao: officialOfficer.graduacao,
          senha_operacional: regPassword,
          ativo: true
        });
        localStorage.setItem('rdspm_local_users', JSON.stringify(legacyUsers));

        setSuccessMsg(`Primeiro Acesso efetuado com sucesso! Militar identificado: ${officialOfficer.graduacao} ${officialOfficer.nome_completo}.`);
        setRg(regRg);
        setPassword('');
        setRegRg('');
        setRegPassword('');
        setIdentifiedOfficer(null);
        setActiveTab('login');

      } catch (err: any) {
        setErrorMsg(err?.message || 'Falha ao registrar Primeiro Acesso local.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Password Alteration Handler
  const handlePasswordAlterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRg = altRg.replace(/\D/g, '');

    if (!cleanRg) {
      setErrorMsg('RG PM é obrigatório.');
      return;
    }
    if (cleanRg.length < 6) {
      setErrorMsg('RG PM inválido. Deve conter 6 dígitos.');
      return;
    }
    if (!altCurrentPass) {
      setErrorMsg('A senha operacional atual é obrigatória.');
      return;
    }
    if (!altNewPass) {
      setErrorMsg('A nova senha operacional é obrigatória.');
      return;
    }
    if (altNewPass.length !== 6) {
      setErrorMsg('A nova senha deve possuir exatamente 6 números.');
      return;
    }
    if (altCurrentPass === altNewPass) {
      setErrorMsg('A nova senha não pode ser idêntica à senha operacional atual.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isConfigured && supabase) {
      try {
        console.log(`[RDS-PM] Buscando e-mail real do militar reg_pm: ${cleanRg}`);
        
        // 1. Fetch user to obtain their real email from table 'usuarios'
        const { data: dbUser, error: dbError } = await supabase
          .from('usuarios')
          .select('email')
          .eq('rg_pm', cleanRg)
          .maybeSingle();

        if (dbError) {
          throw new Error('Erro ao buscar cadastro na tabela usuarios: ' + dbError.message);
        }
        if (!dbUser || !dbUser.email) {
          throw new Error('Militar com RG PM informado não localizado ou não possui Primeiro Acesso concluído.');
        }

        const realEmail = dbUser.email;

        console.log(`[RDS-PM] Autenticando com senha antiga no Supabase Auth usando e-mail: ${realEmail}...`);
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: realEmail,
          password: altCurrentPass,
        });

        if (authError) {
          console.error('[RDS-PM] Erro ao autenticar para alteração de senha:', authError);
          throw new Error('RG PM ou senha operacional atual incorretos.');
        }

        // Updating Supabase Auth authentication user password
        console.log(`[RDS-PM] Atualizando senha oficial no Supabase Auth...`);
        const { error: updateAuthError } = await supabase.auth.updateUser({
          password: altNewPass
        });

        if (updateAuthError) {
          console.error('[RDS-PM] Erro ao alterar senha no Supabase Auth:', updateAuthError);
          throw new Error('Regra de validação de senha do servidor rejeitou a nova credencial: ' + updateAuthError.message);
        }

        // Sincronizando antiga tabela legada para manter compatibilidades caso necessário
        console.log(`[RDS-PM] Atualizando senha na tabela cadastral...`);
        const { error: updateLegacyDbError } = await supabase
          .from('usuarios_pm')
          .update({ senha_operacional: altNewPass })
          .eq('rg_pm', cleanRg);

        if (updateLegacyDbError) {
          console.warn('[RDS-PM] Alerta de sincronização legada usuarios_pm:', updateLegacyDbError.message);
        }

        setRg(altRg);
        setPassword('');
        setSuccessMsg('Sua senha operacional foi alterada com sucesso! Entre utilizando seus dados novos.');
        setAltRg('');
        setAltCurrentPass('');
        setAltNewPass('');
        setActiveTab('login');

      } catch (err: any) {
        console.error('[RDS-PM] Erro ao redefinir senha:', err);
        setErrorMsg(err?.message || 'Falha ao redefinir senha operacional.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local storage redefinition mode
      try {
        let localUsuarios: any[] = [];
        try {
          const raw = localStorage.getItem('rdspm_local_usuarios');
          if (raw) localUsuarios = JSON.parse(raw);
        } catch {}

        const uIndex = localUsuarios.findIndex((u) => u.rg_pm === cleanRg && u.senha_mock === altCurrentPass);
        if (uIndex === -1) {
          throw new Error('RG PM ou senha operacional atual incorretos no modo offline.');
        }

        localUsuarios[uIndex].senha_mock = altNewPass;
        localStorage.setItem('rdspm_local_usuarios', JSON.stringify(localUsuarios));

        // Legacy syncer
        let legacyUsers: any[] = [];
        try {
          const legRaw = localStorage.getItem('rdspm_local_users');
          if (legRaw) legacyUsers = JSON.parse(legRaw);
        } catch {}
        const legIndex = legacyUsers.findIndex((u) => u.rg_pm === cleanRg && u.senha_operacional === altCurrentPass);
        if (legIndex !== -1) {
          legacyUsers[legIndex].senha_operacional = altNewPass;
          localStorage.setItem('rdspm_local_users', JSON.stringify(legacyUsers));
        }

        setRg(altRg);
        setPassword('');
        setSuccessMsg('Sua senha operacional foi alterada com sucesso localmente!');
        setAltRg('');
        setAltCurrentPass('');
        setAltNewPass('');
        setActiveTab('login');

      } catch (err: any) {
        setErrorMsg(err?.message || 'Falha ao restaurar senha local.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" id="login-screen-wrapper">
      
      {/* Decorative background gradients */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-900/15 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card box container */}
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in" id="login-container">
        
        {/* Flag Ribbons representing Mato Grosso insignia colorways */}
        <div className="h-1.5 w-full flex">
          <div className="bg-emerald-600 h-full flex-1" />
          <div className="bg-white h-full flex-1" />
          <div className="bg-blue-600 h-full flex-1" />
          <div className="bg-amber-400 h-full flex-1" />
        </div>

        {/* Head Branding Block */}
        <div className="p-6 pb-2 text-center flex flex-col items-center">
          <div className="relative mb-3 flex items-center justify-center w-20 h-20 bg-slate-950/20 rounded-full border border-slate-800/40 p-2 shadow-2xl">
            <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-sm" />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
              alt="Brasão PMMT Oficial" 
              className="relative w-16 h-16 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight text-white uppercase">
            Sistema RDS-PM
          </h2>
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            Polícia Militar de Mato Grosso
          </p>
        </div>

        {/* Database environment visual validation */}
        <div className="px-6 pb-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 border border-emerald-950/60 rounded-lg text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wide">Interface de Comunicação Central</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2.5 bg-amber-950/35 border border-amber-900/30 rounded-lg text-amber-300 text-xs text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-bold font-mono text-[10px] uppercase">Base de Execução Offline</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-tight font-sans">
                Operando com emulação de autenticação de dados e salvamento interno no navegador.
              </p>
            </div>
          )}
        </div>

        {/* Screen Specific Labels */}
        <div className="px-6 pt-2 pb-1 text-center">
          {activeTab === 'login' && (
            <div className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Autenticação por RG PM
            </div>
          )}
          {activeTab === 'primeiro_acesso' && (
            <div className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center justify-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              <span>Concluir Primeiro Acesso</span>
            </div>
          )}
          {activeTab === 'alterar' && (
            <div className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center justify-center gap-1.5">
              <KeyRound className="h-4 w-4" />
              <span>Redefinir Credencial</span>
            </div>
          )}
        </div>

        {/* Action success alert */}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-sans flex gap-2.5 items-center animate-fade-in" id="reg-success">
            <div className="bg-emerald-900/40 p-1.5 rounded-lg text-emerald-400 shrink-0 shadow-sm">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <div className="font-bold uppercase tracking-wider text-emerald-400 text-[9px] font-mono">Sucesso</div>
              <div className="font-sans mt-0.5 leading-relaxed text-slate-200">{successMsg}</div>
            </div>
          </div>
        )}

        {/* Action errors alert */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-red-200 text-xs font-sans flex gap-2.5 items-center" id="reg-error">
            <div className="bg-red-900/40 p-1.5 rounded-lg text-red-400 shrink-0 shadow-sm">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <div className="font-bold uppercase tracking-wider text-red-400 text-[9px] font-mono">Erro de Validação</div>
              <div className="font-sans mt-0.5 font-bold leading-normal text-red-100">{errorMsg}</div>
            </div>
          </div>
        )}

        {/* CONDITIONAL CORE FORMS SECTION */}
        {activeTab === 'login' ? (
          
          /* ================= 1. LOGIN POR RG PM FORM ================= */
          <form onSubmit={handleLoginSubmit} className="p-6 pt-3 space-y-4">
            
            <div>
              <label htmlFor="login-rg-pm" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Informa RG PM
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Fingerprint className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="login-rg-pm"
                  type="text"
                  required
                  value={rg}
                  onChange={handleRgChange}
                  placeholder="EX: 882.437"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-base rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono tracking-wide"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-senha" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Senha Operacional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="login-senha"
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Seus 6 números"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-base rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="militar-btn-login"
              className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm tracking-wide rounded-xl py-3 px-4 shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-6 cursor-pointer border-b-2 border-blue-900"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Entrar</span>
                </>
              )}
            </button>

            {/* Quick Navigation Panel Options */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60 mt-4">
              <button
                type="button"
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-900/40 hover:text-amber-400 text-[10px] font-mono font-bold text-slate-400 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
                onClick={() => {
                  clearFormStates();
                  setActiveTab('primeiro_acesso');
                }}
              >
                <UserPlus className="h-3.5 w-3.5 text-amber-500" />
                <span>Primeiro Acesso</span>
              </button>
              <button
                type="button"
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-900/40 hover:text-amber-400 text-[10px] font-mono font-bold text-slate-400 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
                onClick={() => {
                  clearFormStates();
                  setActiveTab('alterar');
                }}
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                <span>Alterar Senha</span>
              </button>
            </div>

          </form>
        ) : activeTab === 'primeiro_acesso' ? (
          
          /* ================= 2. PRIMEIRO ACESSO FORM ================= */
          <form onSubmit={handleRegisterSubmit} className="p-6 pt-3 space-y-4">
            
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 leading-normal font-sans">
              Insira o seu RG PM de 6 dígitos. Caso você faça parte dos policiais militares autorizados, sua identidade será validada instantaneamente.
            </div>

            <div>
              <label htmlFor="reg-rg-pm" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                RG PM do Operador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Fingerprint className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="reg-rg-pm"
                  type="text"
                  required
                  value={regRg}
                  onChange={handleRegRgChange}
                  placeholder="EX: 885.136"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-base rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono tracking-wide"
                />
              </div>
            </div>

            {/* LIVE lookup identifications display */}
            {identifiedOfficer && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 animate-fade-in">
                <div className="mt-0.5 text-emerald-400 p-1 bg-emerald-950 rounded-lg shadow-sm border border-emerald-500/20 shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-black">Efetivo Homologado</div>
                  <div className="text-white text-xs font-bold font-sans uppercase mt-0.5">
                    {identifiedOfficer.graduacao} {identifiedOfficer.nome_completo}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="reg-senha-nova" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Definir Nova Senha Operacional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="reg-senha-nova"
                  type="password"
                  required
                  value={regPassword}
                  onChange={handleRegPasswordChange}
                  placeholder="Digite exatamente 6 números"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-base rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="militar-btn-primeiro-acesso"
              className="w-full bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm tracking-wide rounded-xl py-3 px-4 shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer border-b-2 border-emerald-900"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Salvar Dados de Acesso</span>
                </>
              )}
            </button>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition cursor-pointer"
                onClick={() => {
                  clearFormStates();
                  setActiveTab('login');
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar ao Login por RG</span>
              </button>
            </div>

          </form>
        ) : (
          
          /* ================= 3. ALTERAR SENHA FORM ================= */
          <form onSubmit={handlePasswordAlterSubmit} className="p-6 pt-3 space-y-4">
            
            <div>
              <label htmlFor="alt-rg-pm" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Seu RG PM
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Fingerprint className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="alt-rg-pm"
                  type="text"
                  required
                  value={altRg}
                  onChange={handleAltRgChange}
                  placeholder="EX: 883.694"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="alt-senha-atual" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Senha Operacional Atual
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="alt-senha-atual"
                  type="password"
                  required
                  value={altCurrentPass}
                  onChange={handleAltCurrentPassChange}
                  placeholder="Insira sua senha de 6 números atual"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <div>
              <label htmlFor="alt-senha-nova" className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Definir Nova Senha Operacional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-amber-500" />
                </div>
                <input
                  id="alt-senha-nova"
                  type="password"
                  required
                  value={altNewPass}
                  onChange={handleAltNewPassChange}
                  placeholder="Crie senha nova de 6 números"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl pl-11 pr-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-700 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="militar-btn-alterar"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-sm tracking-wide rounded-xl py-3 px-4 shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4 border-b-2 border-amber-900 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Confirmar Nova Senha</span>
                </>
              )}
            </button>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition cursor-pointer"
                onClick={() => {
                  clearFormStates();
                  setActiveTab('login');
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar ao Login por RG</span>
              </button>
            </div>

          </form>
        )}
      </div>

      {/* SESP / PMMT footer credits */}
      <div className="mt-6 text-center text-slate-600 text-[10px] font-mono z-10 selection:bg-transparent">
        <p>RDS-PM v3.0.0 • SESP/PMMT - Diretoria de Tecnologia e Operações</p>
        <p className="mt-0.5 font-semibold text-slate-600">Polícia Militar de Mato Grosso</p>
      </div>
    </div>
  );
}
