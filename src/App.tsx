import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserSession, PoliceReport } from './types';
import LoginScreen from './components/LoginScreen';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import SqlSchemaView from './components/SqlSchemaView';
import ViaturaManager from './components/ViaturaManager';
import { 
  Shield, 
  FileText, 
  BookOpen, 
  Database, 
  LogOut, 
  AlertTriangle,
  Car
} from 'lucide-react';

export default function App() {
  const [logado, setLogado] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'database' | 'viaturas_admin'>('list');
  const [reports, setReports] = useState<PoliceReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  // Persistent login session on page reload
  useEffect(() => {
    const saved = localStorage.getItem('rdspm_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        setLogado(true);
      } catch (e) {
        console.warn('[RDS-PM] Error parsing saved local session data.');
      }
    }
  }, []);

  // Fetch reports regularly once logged in
  const fetchReports = async () => {
    if (!session) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[RDS-PM] Fail fetching online database reports. Operating with local memory cache:', error);
        // Fallback to local memory if PostgreSQL table is not created yet
        const cached = localStorage.getItem(`rdspm_reports_${session.matricula}`);
        if (cached) {
          setReports(JSON.parse(cached));
        }
      } else if (data) {
        setReports(data || []);
      }
    } catch (err) {
      console.error('[RDS-PM] Fetch reports exception:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (logado && session) {
      fetchReports();
    }
  }, [logado, session]);

  const handleLoginSuccess = (sessionData: UserSession) => {
    setSession(sessionData);
    setLogado(true);
    localStorage.setItem('rdspm_session', JSON.stringify(sessionData));
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente encerrar sua sessão no Terminal RDS?')) {
      setSession(null);
      setLogado(false);
      localStorage.removeItem('rdspm_session');
    }
  };

  // Submit report to Supabase with local fallback preservation
  const handleCreateReport = async (newReport: Omit<PoliceReport, 'id' | 'created_at'>): Promise<boolean> => {
    if (!session) return false;

    try {
      const { data, error } = await supabase
        .from('relatorios')
        .insert([
          {
            ...newReport,
            user_email: session.email
          }
        ])
        .select();

      if (error) {
        console.warn('[RDS-PM] Fail saving report to cloud. Saving to local storage for persistence:', error);
        
        // Write to local cache so the user can still print and view!
        const fallbackReport: PoliceReport = {
          ...newReport,
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString()
        };
        const updatedLocal = [fallbackReport, ...reports];
        setReports(updatedLocal);
        localStorage.setItem(`rdspm_reports_${session.matricula}`, JSON.stringify(updatedLocal));
        alert('AVISO: Relatório gravado apenas localmente no navegador, pois as tabelas cloud ainda não foram instaladas via aba "Infraestrutura DB"!');
        return true;
      }

      // If saved successfully online, also insert the associated vehicle refueling records
      const createdReport = data?.[0];
      if (createdReport && newReport.lista_viaturas) {
        for (const vtr of newReport.lista_viaturas) {
          if (vtr.id) {
            const viaturaId = typeof vtr.id === 'string' ? parseInt(vtr.id) || null : vtr.id;
            if (viaturaId) {
              await supabase.from('abastecimentos_viaturas').insert({
                relatorio_id: createdReport.id,
                viatura_id: viaturaId,
                km_abastecimento: Number(vtr.km_abastecimento) || 0,
                litros: Number(vtr.litros) || 0,
                saldo: Number(vtr.saldo) || 0,
                valor_abastecido: Number(vtr.valor_abastecido) || 0
              });
            }
          }
        }
      }

      await fetchReports();
      return true;
    } catch (err) {
      console.error('[RDS-PM] Error inserting report:', err);
      return false;
    }
  };

  // Delete report handler
  const handleDeleteReport = async (id: string): Promise<boolean> => {
    if (!session) return false;

    if (!window.confirm('Tem certeza de que deseja excluir permanentemente este relatório de serviço?')) {
      return false;
    }

    try {
      // If it's a local fallback record
      if (id.startsWith('local_')) {
        const filtered = reports.filter(r => r.id !== id);
        setReports(filtered);
        localStorage.setItem(`rdspm_reports_${session.matricula}`, JSON.stringify(filtered));
        return true;
      }

      const { error } = await supabase
        .from('relatorios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[RDS-PM] Cloud delete error:', error);
        return false;
      }

      await fetchReports();
      return true;
    } catch (err) {
      console.error('[RDS-PM] Delete exception:', err);
      return false;
    }
  };

  // Return LoginScreen if they are not logged in
  if (!logado || !session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020b2d] text-slate-100 font-sans selection:bg-emerald-500/30">
      
      {/* GLOWING HEADER NAVIGATION RAIL */}
      <header className="sticky top-0 z-40 bg-[#04154d]/90 backdrop-blur-md border-b border-blue-900 shadow-xl" id="system-dashboard-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Bras%C3%A3o_da_PMMT.svg" 
              alt="PMMT"
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(30,144,255,0.3)] pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="font-display font-black tracking-wider text-base sm:text-lg text-white uppercase">
                  SISTEMA RDS-PM
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs font-mono text-blue-450 tracking-wider">
                AUTO-HOMOLOGADO • MATO GROSSO
              </p>
            </div>
          </div>

          {/* Centered Operational Tab selector */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Negação Militar Principal">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-2 border ${
                activeTab === 'list'
                  ? 'bg-blue-950/80 text-white border-blue-500'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-blue-950/30'
              }`}
            >
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <span>Livro de Registros</span>
            </button>

            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-2 border ${
                activeTab === 'form'
                  ? 'bg-blue-950/80 text-white border-blue-500'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-blue-950/30'
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-450" />
              <span>Lançar RDS</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-2 border ${
                activeTab === 'database'
                  ? 'bg-blue-950/80 text-white border-blue-500'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-blue-950/30'
              }`}
            >
              <Database className="h-4 w-4 text-amber-500" />
              <span>Infraestrutura DB</span>
            </button>

            <button
              onClick={() => setActiveTab('viaturas_admin')}
              className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-2 border ${
                activeTab === 'viaturas_admin'
                  ? 'bg-blue-950/80 text-white border-blue-500'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-blue-950/30'
              }`}
            >
              <Car className="h-4 w-4 text-amber-400" />
              <span>Gerenciar Viaturas</span>
            </button>
          </nav>

          {/* Right menu: Operator & Log Out */}
          <div className="flex items-center gap-4">
            
            {/* Operator Rank & Name info */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-mono tracking-wider font-extrabold text-blue-400 block uppercase">
                OPERADOR LOGADO
              </span>
              <span className="text-xs font-bold text-slate-250 truncate block uppercase max-w-[150px]">
                {session.name || 'Oficial PM'}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-450 hover:text-rose-300 rounded-lg border border-rose-900/35 transition cursor-pointer text-xs font-bold font-mono flex items-center gap-1.5 focus:outline-none"
              title="Sair do terminal seguro"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline uppercase">Sair</span>
            </button>

          </div>

        </div>
      </header>

      {/* MOBILE FLOATING NAV BAR */}
      <div className="md:hidden sticky top-18 z-30 bg-[#020722] border-b border-blue-950 px-4 py-2.5 flex items-center justify-around gap-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase text-center rounded transition flex flex-col items-center gap-1 leading-none ${
            activeTab === 'list' ? 'bg-blue-950/90 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="h-4.5 w-4.5 text-cyan-400" />
          <span>Registros</span>
        </button>

        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase text-center rounded transition flex flex-col items-center gap-1 leading-none ${
            activeTab === 'form' ? 'bg-blue-950/90 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4.5 w-4.5 text-emerald-400" />
          <span>Lançar RDS</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase text-center rounded transition flex flex-col items-center gap-1 leading-none ${
            activeTab === 'database' ? 'bg-blue-950/90 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="h-4.5 w-4.5 text-amber-500" />
          <span>Infra DB</span>
        </button>

        <button
          onClick={() => setActiveTab('viaturas_admin')}
          className={`flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase text-center rounded transition flex flex-col items-center gap-1 leading-none ${
            activeTab === 'viaturas_admin' ? 'bg-blue-950/90 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Car className="h-4.5 w-4.5 text-amber-450" />
          <span>Viaturas</span>
        </button>
      </div>

      {/* DETAILED DATABASE SYNCHRONIZATION ALERTS */}
      {activeTab !== 'database' && reports.length === 0 && !loadingReports && (
        <div className="bg-amber-955/15 border-b border-amber-900/30 text-amber-400 px-4 py-2.5 text-xs text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>Banco de dados vazio:</strong> Se você ainda não instalou as tabelas no Supabase Cloud, vá em <b className="underline cursor-pointer" onClick={() => setActiveTab('database')}>"Infraestrutura DB"</b> para criar automaticamente as tabelas e seedar policiais homologados!
            </span>
          </div>
        </div>
      )}

      {/* CORE PAGES RENDERING BODY CODES */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-950 pb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  LIVRO DE REGISTROS DIÁRIOS
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Exibindo relatórios de policiamento tático homologados pela chefia da unidade.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-650 hover:to-emerald-555 text-white text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition shadow-md shadow-emerald-950/40 hover:shadow-emerald-550/15 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <FileText className="h-4 w-4" />
                <span>LANÇAR NOVO RDS</span>
              </button>
            </div>

            {loadingReports ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <span className="w-10 h-10 border-4 border-blue-800 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-sm font-mono text-slate-450 uppercase animate-pulse">
                  CONECTANDO COM A CENTRAL TÁTICA...
                </p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <ReportList 
                  reports={reports} 
                  onDelete={handleDeleteReport} 
                  currentUserEmail={session.email}
                  onNavigateToForm={() => setActiveTab('form')}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'form' && (
          <div className="space-y-6">
            <ReportForm 
              onSubmit={handleCreateReport} 
              currentUserSession={session} 
            />
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            <SqlSchemaView />
          </div>
        )}

        {activeTab === 'viaturas_admin' && (
          <div className="space-y-6">
            <ViaturaManager />
          </div>
        )}

      </main>

      {/* FOOTER SYSTEM MARK */}
      <footer className="bg-slate-950 py-5 text-center border-t border-blue-950 text-slate-500 text-[10px] font-mono select-none">
        <p>© 2026 POLÍCIA MILITAR DE MATO GROSSO • SECRETARIA DE OPERAÇÕES OPERACIONAIS</p>
        <p className="mt-1 text-[#1e293b]">INTEGRAÇÃO POSTGRESQL DIRECT CONNECTION • ALL RIGHTS SECURRED</p>
      </footer>

    </div>
  );
}
