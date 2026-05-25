/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PoliceReport, UserSession } from './types';
import { supabase, isSupabaseConfigured, LocalDb, fetchFullReports, saveFullReport } from './supabase';
import LoginScreen from './components/LoginScreen';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import SqlSchemaView from './components/SqlSchemaView';
import { 
  Shield, 
  FilePlus, 
  Files, 
  Database, 
  LogOut, 
  User, 
  CalendarMinus, 
  Menu, 
  X,
  Radio,
  FileCheck2,
  Globe,
  Lock
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentTab, setCurrentTab] = useState<'form' | 'list' | 'database'>('list');
  const [reports, setReports] = useState<PoliceReport[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Try auto-login and establish Auth state listening on mount
  useEffect(() => {
    let rawLocalSession: string | null = null;
    try {
      rawLocalSession = localStorage.getItem('rdspm_session');
    } catch (e: any) {
      console.warn('[RDS-PM] Erro ao ler localStorage:', e?.message || e);
    }

    if (rawLocalSession) {
      try {
        const parsed = JSON.parse(rawLocalSession);
        if (parsed && typeof parsed === 'object') {
          console.log(`[RDS-PM] Tentando restaurar sessão para: RG=${parsed.matricula || 'N/A'}, Nome=${parsed.name || 'N/A'}`);
          
          const validatedSession: UserSession = {
            id: parsed.id || 'temp-id',
            email: parsed.email || '',
            name: parsed.name || 'USUÁRIO',
            role: parsed.role || 'POLICIAL MILITAR',
            matricula: parsed.matricula || '000.000',
            pelotao: parsed.pelotao || '',
            cidade: parsed.cidade || 'Cuiabá',
            isDemo: parsed.isDemo === undefined ? true : !!parsed.isDemo
          };
          setUser(validatedSession);
          loadReports(validatedSession);
        } else {
          console.warn('[RDS-PM] Sessão gravada no localStorage é ínfima ou inválida.');
          localStorage.removeItem('rdspm_session');
        }
      } catch (err: any) {
        console.error('[RDS-PM] Incident de JSON parse no cache de sessão:', err?.message || err);
        try {
          localStorage.removeItem('rdspm_session');
        } catch {}
      }
    }
  }, []);

  const loadReports = async (session: UserSession) => {
    setSyncing(true);
    const safeSession = session || { isDemo: true };
    if (safeSession.isDemo || !isConfigured) {
      // Local Database flow
      const data = LocalDb.getReports();
      setReports(data || []);
      setSyncing(false);
    } else {
      // Supabase fetch flow
      try {
        const fullReports = await fetchFullReports();
        setReports(fullReports || []);
      } catch (err: any) {
        console.error('[RDS-PM] Falha de sincronização Supabase, usando banco local:', err?.message || err);
        setReports(LocalDb.getReports() || []);
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    if (!session || typeof session !== 'object') {
      console.error('[RDS-PM] Dados de autenticação nulos ou incorretos:', session);
      return;
    }
    const validatedSession: UserSession = {
      id: session.id || 'temp-id',
      email: session.email || '',
      name: session.name || 'USUÁRIO',
      role: session.role || 'POLICIAL MILITAR',
      matricula: session.matricula || '000.000',
      pelotao: session.pelotao || '',
      cidade: session.cidade || 'Cuiabá',
      isDemo: session.isDemo === undefined ? true : !!session.isDemo
    };
    
    console.log(`[RDS-PM] Login efetuado com sucesso: ID=${validatedSession.id}, Nome=${validatedSession.name}, Graduação/Role=${validatedSession.role}`);
    
    setUser(validatedSession);
    try {
      localStorage.setItem('rdspm_session', JSON.stringify(validatedSession));
    } catch (e: any) {
      console.error('[RDS-PM] Falha ao sincronizar dados de sessão no cache:', e?.message || e);
    }
    loadReports(validatedSession);
    setCurrentTab('list'); // Redirect directly to visualizer dashboard
  };

  const handleLogout = async () => {
    setUser(null);
    setReports([]);
    localStorage.removeItem('rdspm_session');
  };

  const handleSaveReport = async (payload: Omit<PoliceReport, 'id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;

    if (user.isDemo || !isConfigured) {
      // Offline LocalStorage insertion
      const newReport = LocalDb.saveReport(payload);
      setReports((prev) => [newReport, ...prev]);
      return true;
    } else {
      // Supabase database insertion
      try {
        const fullReport = await saveFullReport(payload, user.id, user.email);
        setReports((prev) => [fullReport, ...prev]);
        return true;
      } catch (err) {
        console.error('Falha ao cadastrar relatório relacional no Supabase:', err);
        return false;
      }
    }
  };

  const handleDeleteReport = async (id: string | number): Promise<boolean> => {
    if (!user) return false;

    if (!id && id !== 0) {
      console.warn('[RDS-PM] Tentativa de exclusão com ID nulo ou indefinido.');
      return false;
    }

    const idStr = String(id);

    if (user.isDemo || !isConfigured || idStr.startsWith('report-local-')) {
      // Offline deletion
      LocalDb.deleteReport(idStr);
      setReports((prev) => prev.filter((r) => String(r?.id || '') !== idStr));
      return true;
    } else {
      // Supabase deletion
      try {
        const { error } = await supabase!
          .from('relatorios')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setReports((prev) => prev.filter((r) => String(r?.id || '') !== idStr));
        return true;
      } catch (err) {
        console.error('Falha ao deletar relatório do Supabase:', err);
        return false;
      }
    }
  };

  // If officer session doesn't exist, show police portal login credentials screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" id="app-workspace">
      
      {/* 1. STATEFUL COP HEADER & BRANDING */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left side brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center shrink-0 relative">
                <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-sm" />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
                  alt="Brasão PMMT" 
                  className="relative w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(245,158,11,0.35)]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-sans uppercase">RDS-PM</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-950 border border-blue-900 text-blue-400 rounded">PMMT</span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wider font-sans">Polícia Militar de Mato Grosso</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentTab('list')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === 'list'
                    ? 'bg-blue-800/20 border-blue-700/80 text-blue-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Files className="h-4 w-4" />
                <span>Consultar Relatórios</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('form')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === 'form'
                    ? 'bg-blue-800/20 border-blue-700/80 text-blue-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FilePlus className="h-4 w-4" />
                <span>Preencher Novo RDS</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('database')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === 'database'
                    ? 'bg-blue-800/20 border-blue-700/80 text-blue-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Configurar Supabase</span>
              </button>
            </nav>

            {/* Right side user info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <span className="block text-xs font-bold font-sans text-slate-200">
                  {user?.name || 'Militar de Serviço'}
                </span>
                <span className="block text-[10px] font-mono text-amber-500 font-semibold uppercase">
                  Policial Militar Conectado
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleLogout}
                title="Sair do Sistema"
                className="p-2.5 bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-900 text-slate-400 hover:text-red-400 rounded-lg transition duration-150 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 p-4 space-y-3 animate-fadeIn">
            {/* User specs */}
            <div className="border-b border-slate-800 pb-3 mb-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-805 flex items-center justify-center">
                <User className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-white">{user?.name || 'Militar de Serviço'}</span>
                <span className="block text-[10px] font-mono text-emerald-400 font-semibold uppercase">PMMT Oficial</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('list');
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentTab === 'list' ? 'bg-blue-800 text-white' : 'text-slate-400 hover:bg-slate-850'
              }`}
            >
              <Files className="h-4 w-4" />
              <span>Consultar Relatórios</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('form');
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentTab === 'form' ? 'bg-blue-800 text-white' : 'text-slate-400 hover:bg-slate-850'
              }`}
            >
              <FilePlus className="h-4 w-4" />
              <span>Preencher Novo RDS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('database');
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentTab === 'database' ? 'bg-blue-800 text-white' : 'text-slate-400 hover:bg-slate-850'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Configurar Supabase</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 text-red-400 hover:bg-red-950/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair do RDS-PM</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. SUB-BANNER: STATE OF PERSISTENCE */}
      <div className="bg-slate-950 border-b border-slate-850 py-2.5" id="connectivity-banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          
          {/* Left status badge */}
          <div className="flex items-center gap-2">
            <Radio className={`h-3 w-3 animate-ping ${(!user || user.isDemo) ? 'text-amber-500' : 'text-emerald-500'}`} />
            <span>Perfil: </span>
            <span className="font-bold text-slate-200">{user?.role || 'Policial Militar'}</span>
            <span className="text-slate-500">•</span>
            {(!user || user.isDemo) ? (
              <span className="text-amber-400 font-mono flex items-center gap-1">
                <Lock className="h-3 w-3" />
                BANCO LOCAL TEMPORÁRIO (DEMO)
              </span>
            ) : (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <Globe className="h-3 w-3" />
                SUPABASE CLOUD OPERANTE
              </span>
            )}
          </div>

          {/* Right quick database switch link or action info */}
          <div className="text-slate-400 flex items-center gap-2 font-mono">
            {syncing ? (
              <span className="flex items-center gap-1 text-[11px] text-blue-400">
                <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                Sincronizando...
              </span>
            ) : (
              <button 
                type="button" 
                onClick={() => user && loadReports(user)} 
                className="text-slate-4 w-auto hover:text-white underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                Sincronizar Arquivos ({reports?.length || 0})
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. CORE SUBTAB CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="workspace-main-panel">
        
        {/* Render Form Tab */}
        {currentTab === 'form' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <ReportForm 
              onSubmit={handleSaveReport} 
              currentUserSession={user} 
            />
          </div>
        )}

        {/* Render Reports Query Dashboard Tab */}
        {currentTab === 'list' && (
          <div className="animate-fadeIn">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
                  <FileCheck2 className="h-5.5 w-5.5 text-blue-450" />
                  <span>Livro de Registro de Serviço</span>
                </h2>
                <p className="text-xs text-slate-400">Pesquisa, filtragem e compilação de dados táticos das operações</p>
              </div>

              {/* Shortcut buttons */}
              <button
                type="button"
                onClick={() => setCurrentTab('form')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-md shadow-amber-950/20 cursor-pointer"
              >
                <FilePlus className="h-4 w-4 text-slate-950" />
                <span>Lançar Relatório</span>
              </button>
            </div>

            <ReportList 
              reports={reports || []} 
              onDelete={handleDeleteReport} 
              currentUserEmail={user?.email || ''}
              onNavigateToForm={() => setCurrentTab('form')}
            />
          </div>
        )}

        {/* Render Database Configuration / SQL guide Tab */}
        {currentTab === 'database' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <SqlSchemaView />
          </div>
        )}

      </main>

      {/* 4. COGNITIVE COMPACT SPACING FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-850/80 py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-400">RDS-PM • Sistema de Lançamento e Controle Diário de Policiamento Militar</p>
          <p className="font-mono text-[10px] text-slate-600">Polícia Militar de Mato Grosso (PMMT) - Todos os direitos reservados • 2026</p>
        </div>
      </footer>
    </div>
  );
}
