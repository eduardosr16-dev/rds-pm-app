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
    } catch (e) {
      console.warn('Erro ao ler localStorage', e);
    }

    if (isConfigured && supabase) {
      // 1. Check if we already have an active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          const metadata = session.user.user_metadata;
          const currentLoggedUser: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            name: metadata?.full_name || `${metadata?.role || 'Militar'} PM Sem Nome`,
            role: metadata?.role || 'Policial',
            isDemo: false
          };
          setUser(currentLoggedUser);
          localStorage.setItem('rdspm_session', JSON.stringify(currentLoggedUser));
          loadReports(currentLoggedUser);
        } else if (rawLocalSession) {
          // Fallback to local demo session if stored as demo
          try {
            const parsed = JSON.parse(rawLocalSession);
            if (parsed?.isDemo) {
              setUser(parsed);
              loadReports(parsed);
            }
          } catch {
            localStorage.removeItem('rdspm_session');
          }
        }
      });

      // 2. Listen to real-time auth state events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          const metadata = session.user.user_metadata;
          const currentLoggedUser: UserSession = {
            id: session.user.id,
            email: session.user.email || '',
            name: metadata?.full_name || `${metadata?.role || 'Militar'} PM Sem Nome`,
            role: metadata?.role || 'Policial',
            isDemo: false
          };
          setUser(currentLoggedUser);
          localStorage.setItem('rdspm_session', JSON.stringify(currentLoggedUser));
          loadReports(currentLoggedUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setReports([]);
          localStorage.removeItem('rdspm_session');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Offline fallback only
      if (rawLocalSession) {
        try {
          const parsed = JSON.parse(rawLocalSession);
          setUser(parsed);
          loadReports(parsed);
        } catch {
          localStorage.removeItem('rdspm_session');
        }
      }
    }
  }, []);

  const loadReports = async (session: UserSession) => {
    setSyncing(true);
    if (session.isDemo || !isConfigured) {
      // Local Database flow
      const data = LocalDb.getReports();
      setReports(data);
      setSyncing(false);
    } else {
      // Supabase fetch flow
      try {
        const fullReports = await fetchFullReports();
        setReports(fullReports);
      } catch (err) {
        console.error('Falha de sincronização Supabase, usando banco local:', err);
        setReports(LocalDb.getReports());
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('rdspm_session', JSON.stringify(session));
    loadReports(session);
    setCurrentTab('list'); // Redirect directly to visualizer dashboard
  };

  const handleLogout = async () => {
    if (user && !user.isDemo && isConfigured) {
      await supabase!.auth.signOut();
    }
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

  const handleDeleteReport = async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (user.isDemo || !isConfigured || id.startsWith('report-local-')) {
      // Offline deletion
      LocalDb.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      return true;
    } else {
      // Supabase deletion
      try {
        const { error } = await supabase!
          .from('relatorios')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setReports((prev) => prev.filter((r) => r.id !== id));
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
                  {user.name}
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
                <span className="block text-xs font-extrabold text-white">{user.name}</span>
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
            <Radio className={`h-3 w-3 animate-ping ${user.isDemo ? 'text-amber-500' : 'text-emerald-500'}`} />
            <span>Perfil: </span>
            <span className="font-bold text-slate-200">{user.role || 'Oficial'}</span>
            <span className="text-slate-500">•</span>
            {user.isDemo ? (
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
                onClick={() => loadReports(user)} 
                className="text-slate-4 w-auto hover:text-white underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                Sincronizar Arquivos ({reports.length})
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
              reports={reports} 
              onDelete={handleDeleteReport} 
              currentUserEmail={user.email}
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
