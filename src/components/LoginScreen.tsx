import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  RefreshCw, 
  AlertCircle, 
  Fingerprint, 
  ChevronLeft 
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (sessionData: {
    id: string;
    email: string;
    name: string;
    matricula: string;
    cidade?: string;
    isDemo: boolean;
  }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Navigation mode: 'login' | 'primeiro' | 'trocar' | 'esqueci'
  const [mode, setMode] = useState<'login' | 'primeiro' | 'trocar' | 'esqueci'>('login');

  // Input states
  const [rgInput, setRgInput] = useState(''); // Formatted or raw
  const [senha, setSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  // Live lookup state
  const [loadingPolicial, setLoadingPolicial] = useState(false);
  const [efetivoHomologado, setEfetivoHomologado] = useState<{
    id: string;
    nome: string;
    nome_completo?: string;
    rg_pm: string;
    senha?: string;
  } | null>(null);
  const [rgError, setRgError] = useState(false);

  // Flash UI messages
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Helper: extract raw digits of the typed RG PM
  const getCleanRg = (val: string) => val.replace(/\D/g, '');

  // Helper: format RG PM as XXX.XXX or X.XXX.XXX
  const formatRg = (raw: string) => {
    if (!raw) return '';
    const digits = raw.substring(0, 7); // Cap at 7 digits
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 1)}.${digits.slice(1, 4)}.${digits.slice(4)}`;
    }
  };

  // Safe input handler for RG PM (numerical only + mask formatting)
  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = getCleanRg(rawVal);
    setRgInput(formatRg(cleanDigits));
    setMensagem(null);
  };

  // Live verification when the cleaned RG PM matches exactly 6 or 7 characters
  useEffect(() => {
    const cleanRg = getCleanRg(rgInput);
    
    if (cleanRg.length < 6) {
      setEfetivoHomologado(null);
      setRgError(false);
      setLoadingPolicial(false);
      return;
    }

    const verifyRg = async () => {
      setLoadingPolicial(true);
      try {
        const { data, error } = await supabase
          .from('policiais')
          .select('*')
          .eq('rg_pm', cleanRg)
          .maybeSingle();

        if (error) {
          console.error('[RDS-PM] Database verify error:', error);
          setEfetivoHomologado(null);
          setRgError(true);
        } else if (data) {
          // Normalize names
          const finalName = data.nome || data.nome_completo || 'Policial Militar';
          setEfetivoHomologado({
            id: data.id,
            nome: finalName,
            rg_pm: data.rg_pm,
            senha: data.senha
          });
          setRgError(false);
        } else {
          setEfetivoHomologado(null);
          setRgError(true);
        }
      } catch (err) {
        console.error('[RDS-PM] Execution lookup error:', err);
        setEfetivoHomologado(null);
        setRgError(true);
      } finally {
        setLoadingPolicial(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      verifyRg();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [rgInput]);

  // Handle core Login flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    const cleanRg = getCleanRg(rgInput);
    if (!cleanRg) {
      setMensagem({ tipo: 'erro', texto: 'Digite o RG PM do operador para entrar.' });
      return;
    }

    if (!senha) {
      setMensagem({ tipo: 'erro', texto: 'Insira sua senha de acesso cadastrada.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('policiais')
        .select('*')
        .eq('rg_pm', cleanRg)
        .eq('senha', senha)
        .maybeSingle();

      if (error) {
        console.error('[RDS-PM] Login database error:', error);
        setMensagem({ tipo: 'erro', texto: 'Erro de comunicação com o Supabase.' });
        return;
      }

      if (!data) {
        setMensagem({ tipo: 'erro', texto: 'RG PM ou senha tática incorretos.' });
        return;
      }

      // Login success
      setMensagem({ tipo: 'sucesso', texto: 'Autenticação autorizada! Aguarde...' });
      
      const officialName = data.nome || data.nome_completo || 'Policial Militar';
      
      setTimeout(() => {
        onLoginSuccess({
          id: data.id,
          email: `${cleanRg}@pm.mt.gov.br`,
          name: officialName,
          matricula: cleanRg,
          isDemo: false
        });
      }, 850);

    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível completar o login no momento.' });
    }
  };

  // Handle Primeiro Acesso flow
  const handlePrimeiroAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    const cleanRg = getCleanRg(rgInput);
    if (!cleanRg) {
      setMensagem({ tipo: 'erro', texto: 'RG PM obrigatório.' });
      return;
    }

    if (!novaSenha || novaSenha.length < 4) {
      setMensagem({ tipo: 'erro', texto: 'Cadastre uma senha de no mínimo 4 caracteres.' });
      return;
    }

    if (!efetivoHomologado) {
      setMensagem({ tipo: 'erro', texto: 'O operador deve ser homologado para cadastrar senha.' });
      return;
    }

    try {
      // Check if user already had a password to avoid overwriting without notice, or simply save the new password
      const { error } = await supabase
        .from('policiais')
        .update({ senha: novaSenha })
        .eq('rg_pm', cleanRg);

      if (error) {
        console.error('[RDS-PM] Primeiro acesso register error:', error);
        setMensagem({ tipo: 'erro', texto: 'Erro ao gravar senha inicial no Supabase.' });
        return;
      }

      setMensagem({ tipo: 'sucesso', texto: 'Sua senha de Primeiro Acesso foi criada com sucesso! Faça login.' });
      setSenha(novaSenha);
      setNovaSenha('');
      setTimeout(() => {
        setMode('login');
        setMensagem(null);
      }, 2500);

    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Falha técnica ao registrar primeiro acesso.' });
    }
  };

  // Handle Trocar Senha flow
  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    const cleanRg = getCleanRg(rgInput);
    if (!cleanRg) {
      setMensagem({ tipo: 'erro', texto: 'Digite seu RG PM para validar.' });
      return;
    }

    if (!senhaAtual) {
      setMensagem({ tipo: 'erro', texto: 'Entre com sua senha atual para autorização.' });
      return;
    }

    if (!novaSenha || novaSenha.length < 4) {
      setMensagem({ tipo: 'erro', texto: 'A nova senha deve possuir pelo menos 4 dígitos.' });
      return;
    }

    try {
      // Verify current password is correct
      const { data, error: lookupError } = await supabase
        .from('policiais')
        .select('*')
        .eq('rg_pm', cleanRg)
        .eq('senha', senhaAtual)
        .maybeSingle();

      if (lookupError || !data) {
        setMensagem({ tipo: 'erro', texto: 'Senha atual inválida ou RG incorreto.' });
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from('policiais')
        .update({ senha: novaSenha })
        .eq('rg_pm', cleanRg);

      if (updateError) {
        setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar a nova senha no Supabase.' });
        return;
      }

      setMensagem({ tipo: 'sucesso', texto: 'Senha tática atualizada com sucesso!' });
      setSenha(novaSenha);
      setSenhaAtual('');
      setNovaSenha('');
      setTimeout(() => {
        setMode('login');
        setMensagem(null);
      }, 2500);

    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao registrar nova senha.' });
    }
  };

  // Handle Esqueci Minha Senha / Safe Rescue Override
  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    const cleanRg = getCleanRg(rgInput);
    if (!cleanRg) {
      setMensagem({ tipo: 'erro', texto: 'Informe seu RG PM para recuperação.' });
      return;
    }

    if (!efetivoHomologado) {
      setMensagem({ tipo: 'erro', texto: 'O RG informado não consta nas patentes do Mato Grosso.' });
      return;
    }

    if (!novaSenha || novaSenha.length < 4) {
      setMensagem({ tipo: 'erro', texto: 'Insira a nova senha de reset (min. 4 chars).' });
      return;
    }

    try {
      // Direct high-tech recovery override for administrative ease in standard military setups
      const { error } = await supabase
        .from('policiais')
        .update({ senha: novaSenha })
        .eq('rg_pm', cleanRg);

      if (error) {
        setMensagem({ tipo: 'erro', texto: 'Erro ao substituir credencial no banco.' });
        return;
      }

      setMensagem({ 
        tipo: 'sucesso', 
        texto: 'Reset de credencial realizado! Nova senha aplicada na unidade tática.' 
      });
      setSenha(novaSenha);
      setNovaSenha('');
      setTimeout(() => {
        setMode('login');
        setMensagem(null);
      }, 2500);

    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro técnico ao registrar a recuperação.' });
    }
  };

  // Reset page modes smoothly
  const switchMode = (newMode: typeof mode) => {
    setMensagem(null);
    setSenha('');
    setSenhaAtual('');
    setNovaSenha('');
    setMode(newMode);
  };

  return (
    <div className="relative min-height-screen w-full flex items-center justify-center p-4 sm:p-6 select-none bg-[#020b2d]">
      
      {/* Background patterns representing an advanced tactical control center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.2),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.15)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-35 pointer-events-none" />
      
      {/* Glowing atmospheric neon light */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 h-64 w-80 rounded-full opacity-10 blur-3xl pointer-events-none bg-gradient-to-r from-[#1b4fff] to-[#0ca678]" />

      <div className="relative z-10 w-full max-w-[480px] my-8 animate-fadeIn">
        
        {/* TOP SECTION: Centered Crest and Brand headers */}
        <div className="flex flex-col items-center text-center mb-8">
          
          {/* Real PMMT Crest Wrapper */}
          <div className="relative mb-4 flex items-center justify-center w-26 h-26 bg-[#04154d]/90 rounded-full border border-blue-900 shadow-2xl p-2.5 transition active:scale-95 group">
            {/* Pulsing rings for tactical radar feedback */}
            <div className="absolute inset-x-0 inset-y-0 bg-[#1e3a8a]/20 rounded-full blur-sm scale-110 animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-550/30 scale-120 animate-spin opacity-50" style={{ animationDuration: '24s' }} />
            
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
              alt="PMMT Brasão Oficial" 
              className="relative w-22 h-22 object-contain drop-shadow-[0_0_12px_rgba(30,144,255,0.45)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase flex items-center justify-center gap-2">
              SISTEMA <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">RDS-PM</span>
            </h1>
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#94a3b8] font-sans uppercase">
              Polícia Militar de Mato Grosso
            </p>
          </div>
        </div>

        {/* CENTRAL MAIN PANEL CARD */}
        <div className="relative bg-[#04154d]/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-900/60 overflow-hidden">
          
          {/* Corner structural radar lines (Military/Tactical UI aesthetic) */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/80" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/80" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/80" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/80" />

          {/* Glowing scanner line overlay */}
          <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent animate-scanline pointer-events-none" />

          {/* Form Mode Headers and info */}
          <div className="mb-6 flex justify-between items-center pb-3.5 border-b border-blue-950">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-blue-400" />
              <h2 className="text-sm font-black font-mono tracking-wider text-slate-100 uppercase">
                {mode === 'login' && 'Autenticação de Operador'}
                {mode === 'primeiro' && 'Instalar Primeiro Acesso'}
                {mode === 'trocar' && 'Redefinição de Senha'}
                {mode === 'esqueci' && 'Recuperar Terminal'}
              </h2>
            </div>
            <span className="text-[9px] font-mono font-bold bg-slate-950 text-blue-400 px-2 py-0.5 rounded border border-blue-900/40">
              {mode.toUpperCase()}
            </span>
          </div>

          {/* FEEDBACK STATUS CARDS (Efetivo Homologado vs. RG Não Localizado) */}
          <div className="min-h-[56px] mb-5">
            {/* Checking/Loading status */}
            {loadingPolicial && (
              <div className="p-3 rounded-xl border border-blue-800/30 bg-blue-955/20 text-blue-400 flex items-center justify-center gap-2.5 text-xs font-mono animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>CONSULTANDO REGISTRO ATIVO...</span>
              </div>
            )}

            {/* Success feedback: Homologado */}
            {!loadingPolicial && efetivoHomologado && (
              <div className="p-3.5 rounded-xl border border-emerald-500/35 bg-emerald-950/25 text-emerald-300 flex gap-3 animate-fadeIn" id="efetivo-homologado-banner">
                <ShieldCheck className="h-5 w-5 text-emerald-450 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-emerald-400 block leading-non">
                    EFETIVO HOMOLOGADO PMMT
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block uppercase">
                    {efetivoHomologado.nome}
                  </span>
                </div>
              </div>
            )}

            {/* Error feedback: RG PM Inválido */}
            {!loadingPolicial && rgError && getCleanRg(rgInput).length >= 6 && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 flex gap-3 animate-shake" id="rg-nao-localizado-banner">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-rose-400 block leading-none">
                    RG PM NÃO LOCALIZADO
                  </span>
                  <span className="text-[11px] font-sans text-slate-400 block leading-normal">
                    Este registro não consta nas patentes vigentes.
                  </span>
                </div>
              </div>
            )}

            {/* Instructions shown when type length is low */}
            {!loadingPolicial && !efetivoHomologado && !rgError && (
              <div className="text-[11px] font-sans text-slate-400 leading-normal bg-blue-950/20 border border-blue-900/10 p-3 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Uniformize seu RG PM digitando os 6 números (ex: 885.982) para carregar sua patente.</span>
              </div>
            )}
          </div>

          <form onSubmit={
            mode === 'login' ? handleLogin : 
            mode === 'primeiro' ? handlePrimeiroAcesso :
            mode === 'trocar' ? handleTrocarSenha : handleRecuperarSenha
          } className="space-y-5">
            
            {/* FIELD 1: RG PM INPUT */}
            <div className="space-y-1.5">
              <label htmlFor="auth-rg" className="block text-[11px] font-mono text-slate-350 uppercase tracking-widest font-black">
                RG PM DO OPERADOR
              </label>
              <div className="relative">
                <input 
                  id="auth-rg"
                  type="text"
                  required
                  value={rgInput}
                  onChange={handleRgChange}
                  placeholder="Ex: 885.982"
                  className="w-full bg-[#000814] text-slate-100 placeholder-slate-655 font-mono text-lg sm:text-xl rounded-xl border border-blue-900/50 hover:border-blue-800 focus:border-blue-500 outline-none p-3.5 tracking-widest transition"
                />
                <span className="absolute right-3.5 top-4.5 text-[10px] text-zinc-500 font-mono">
                  NUMERIC ONLY
                </span>
              </div>
            </div>

            {/* LOGIN INPUT SCREEN: Password field */}
            {mode === 'login' && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-senha" className="block text-[11px] font-mono text-slate-350 uppercase tracking-widest font-black">
                    SENHA DE ACESSO
                  </label>
                </div>
                <div className="relative">
                  <input 
                    id="auth-senha"
                    type={showSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#000814] text-slate-100 placeholder-slate-700 font-sans text-lg rounded-xl border border-blue-900/50 hover:border-blue-800 focus:border-blue-500 outline-none p-3.5 tracking-wider transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3.5 top-4 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* PRIMEIRO ACESSO INPUT SCREEN: Save new password field */}
            {mode === 'primeiro' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="cadastro-novasenha" className="block text-[11px] font-mono text-slate-350 uppercase tracking-widest font-black">
                  CADASTRAR SENHA INICIAL
                </label>
                <div className="relative">
                  <input 
                    id="cadastro-novasenha"
                    type={showSenha ? 'text' : 'password'}
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo de 4 caracteres"
                    className="w-full bg-[#000814] text-slate-100 placeholder-slate-700 font-sans text-lg rounded-xl border border-blue-900/50 hover:border-blue-800 focus:border-blue-500 outline-none p-3.5 tracking-wider transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3.5 top-4 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* TROCAR SENHA INPUT SCREEN: Current & New fields */}
            {mode === 'trocar' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label htmlFor="troca-senhaatual" className="block text-[11px] font-mono text-slate-350 uppercase tracking-widest font-black">
                    SENHA DE ACESSO ATUAL
                  </label>
                  <input 
                    id="troca-senhaatual"
                    type="password"
                    required
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Sua senha atual"
                    className="w-full bg-[#000814] text-slate-100 placeholder-slate-700 font-sans text-sm rounded-xl border border-blue-900/50 hover:border-blue-800 focus:border-blue-500 outline-none p-3 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="troca-novasenha" className="block text-[11px] font-mono text-slate-350 uppercase tracking-widest font-black">
                    NOVA SENHA DESEJADA
                  </label>
                  <div className="relative">
                    <input 
                      id="troca-novasenha"
                      type={showSenha ? 'text' : 'password'}
                      required
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo de 4 dígitos"
                      className="w-full bg-[#000814] text-slate-100 placeholder-slate-700 font-sans text-sm rounded-xl border border-blue-900/50 hover:border-blue-800 focus:border-blue-500 outline-none p-3 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showSenha ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ESCAPE RECOVERY OVERRIDE: Setup direct overriding password */}
            {mode === 'esqueci' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-3 bg-slate-900/90 border border-amber-500/20 text-amber-400 rounded-lg text-[11px] leading-relaxed">
                  <Lock className="w-4 h-4 inline mr-1.5 shrink-0" />
                  <strong>Substituição de Credenciais de Segurança:</strong> Se você é um policial homologado na lista tática, digite seu RG e estabeleça diretamente sua nova senha de login abaixo.
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="rescue-novasenha" className="block text-[11px] font-mono text-slate-350 uppercase tracking-widest font-black">
                    NOMEAR NOVA SENHA
                  </label>
                  <div className="relative">
                    <input 
                      id="rescue-novasenha"
                      type={showSenha ? 'text' : 'password'}
                      required
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo de 4 dígitos"
                      className="w-full bg-[#000814] text-slate-100 placeholder-slate-700 font-sans text-sm rounded-xl border border-blue-900/50 hover:border-blue-800 focus:border-blue-500 outline-none p-3 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showSenha ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC ACTION MESSAGES PANEL */}
            {mensagem && (
              <div
                className={`p-3 rounded-xl text-xs font-mono font-bold leading-normal animate-shake ${
                  mensagem.tipo === 'sucesso'
                    ? 'bg-emerald-950/45 border border-emerald-500/30 text-emerald-350'
                    : 'bg-rose-950/45 border border-rose-500/30 text-rose-350'
                }`}
              >
                <span>{mensagem.texto}</span>
              </div>
            )}

            {/* CORE GREEN TACTICAL TRANSITING BUTTON */}
            <div>
              {mode === 'login' ? (
                <button
                  type="submit"
                  className="w-full py-4 px-5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-550 active:scale-95 text-white font-black font-display text-sm uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg shadow-emerald-950/50 hover:shadow-emerald-550/20 hover:ring-2 hover:ring-emerald-500/30 flex items-center justify-center gap-2 border-b-4 border-emerald-800"
                >
                  <UserCheck className="h-5 w-5 text-white animate-pulse" />
                  <span>Entrar no Sistema</span>
                </button>
              ) : mode === 'primeiro' ? (
                <button
                  type="submit"
                  disabled={!efetivoHomologado}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-550 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-500 disabled:border-slate-900 disabled:shadow-none font-bold font-display text-sm uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border-b-4 border-emerald-800"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>Cadastrar Senha Inicial</span>
                </button>
              ) : mode === 'trocar' ? (
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-[#1b4fff] to-blue-700 hover:from-[#3b6fff] hover:to-blue-600 font-bold font-display text-sm uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border-b-4 border-blue-900"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Atualizar Minha Senha</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!efetivoHomologado}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-550 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-500 disabled:border-none font-bold font-display text-sm uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border-b-4 border-teal-800"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Restabelecer Credencial</span>
                </button>
              )}
            </div>
            
          </form>

          {/* DYNAMIC SHIELD LINK BACK TO LOGIN */}
          {mode !== 'login' && (
            <button
              onClick={() => switchMode('login')}
              className="mt-4.5 w-full py-2.5 px-4 bg-slate-950/60 hover:bg-slate-950/80 rounded-xl border border-blue-900/20 text-xs text-blue-400 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer font-bold font-mono uppercase"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar para Autenticação</span>
            </button>
          )}

          {/* THREE AUXILIARY micro-buttons beneath fields (only visible in 'login' main screen) */}
          {mode === 'login' && (
            <div className="mt-7 pt-5 border-t border-blue-950/70 grid grid-cols-3 gap-2">
              
              <button
                type="button"
                onClick={() => switchMode('primeiro')}
                className="py-2.5 px-1 bg-slate-950/80 hover:bg-blue-950/60 border border-blue-900/20 hover:border-blue-800 text-[10px] text-slate-300 font-bold hover:text-white transition rounded-lg text-center cursor-pointer flex flex-col items-center justify-center gap-1 group active:scale-95"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition" />
                <span className="truncate w-full text-center">Primeiro Acesso</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('trocar')}
                className="py-2.5 px-1 bg-slate-950/80 hover:bg-blue-950/60 border border-blue-900/20 hover:border-blue-800 text-[10px] text-slate-300 font-bold hover:text-white transition rounded-lg text-center cursor-pointer flex flex-col items-center justify-center gap-1 group active:scale-95"
              >
                <RefreshCw className="h-4 w-4 text-blue-400 group-hover:rotate-45 transition" />
                <span className="truncate w-full text-center">Trocar Senha</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('esqueci')}
                className="py-2.5 px-1 bg-slate-950/80 hover:bg-blue-950/60 border border-blue-900/20 hover:border-blue-800 text-[10px] text-slate-300 font-bold hover:text-white transition rounded-lg text-center cursor-pointer flex flex-col items-center justify-center gap-1 group active:scale-95"
              >
                <Fingerprint className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
                <span className="truncate w-full text-center">Esqueci Senha</span>
              </button>

            </div>
          )}

        </div>

        {/* SYSTEM STATUS FOOTER NOTE */}
        <div className="mt-5 text-center space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#94a3b8] block">
            Ambiente Tático Integrado • PMMT-MT
          </span>
          <span className="text-[9px] font-mono tracking-wider text-slate-500 block">
            IP: 10.231.42.11 • Securing Connection with PostgREST Engine
          </span>
        </div>

      </div>
    </div>
  );
}
