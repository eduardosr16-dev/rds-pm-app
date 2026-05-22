import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RDS-PM Error Boundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('rdspm_session');
    } catch (e) {
      console.error(e);
    }
    // Fully reload the site
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-amber-500/30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />
            
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5.5 w-5.5 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-200">
                  Recuperação do Sistema RDS-PM
                </h2>
                <p className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  proteção de tela ativa
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Ocorreu uma inconsistência no processamento do seu usuário ou no carregamento dos dados da Central PM. O sistema foi interrompido com segurança para proteger sua sessão.
            </p>

            <div className="bg-slate-950 border border-slate-850/60 rounded-lg p-3.5 mb-5 select-text">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-450 uppercase mb-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Log do incidente</span>
              </div>
              <p className="font-mono text-[11px] text-rose-300 break-words max-h-24 overflow-y-auto leading-normal">
                {this.state.error?.message || 'Inconsistência genérica de visualização ou login nulo'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold font-mono text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px]"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Limpar Sessão e Voltar ao Login</span>
              </button>
              
              <div className="text-center">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                  pmm - diretoria de tecnologia • rdspm v2.1
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
