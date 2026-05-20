/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { PoliceReport } from './types';

// Read config safely from import.meta.env
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Check if setup is valid
const hasValidConfig = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== 'your-supabase-project.supabase.co' &&
    supabaseUrl.trim() !== '' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-jwt-key' &&
    supabaseAnonKey.trim() !== ''
  );
};

// Create Supabase client optionally to prevent crash on incorrect startup
export const supabase = hasValidConfig()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return hasValidConfig();
};

// Return the SQL string to initialize the schema in Supabase Dashboard
export const DB_SQL_SCHEMA = `-- Crie a tabela de relatórios policiais (RDS-PM) no editor SQL do seu painel Supabase
CREATE TABLE IF NOT EXISTS public.relatorios_policiais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  operacao VARCHAR(255) NOT NULL,
  turno VARCHAR(50) NOT NULL,
  efetivo INTEGER NOT NULL DEFAULT 1,
  viaturas INTEGER NOT NULL DEFAULT 1,
  armas_apreendidas INTEGER NOT NULL DEFAULT 0,
  armas_detalhes TEXT,
  municoes INTEGER NOT NULL DEFAULT 0,
  municoes_detalhes TEXT,
  drogas_peso NUMERIC NOT NULL DEFAULT 0.0,
  drogas_detalhes TEXT,
  valores NUMERIC NOT NULL DEFAULT 0.0,
  ocorrencias TEXT NOT NULL
);

-- Ativar RLS (Row Level Security) na tabela para garantir a segurança dos relatórios policiais
ALTER TABLE public.relatorios_policiais ENABLE ROW LEVEL SECURITY;

-- Criar políticas de proteção:

-- 1. Permitir que usuários autenticados vejam TODOS os relatórios
CREATE POLICY "Permitir leitura para policiais autenticados" 
  ON public.relatorios_policiais 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- 2. Permitir inserção apenas para usuários autenticados
CREATE POLICY "Permitir inserção para policiais autenticados" 
  ON public.relatorios_policiais 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. Permitir atualização apenas se o relatório foi cadastrado pelo próprio policial
CREATE POLICY "Permitir modificação do próprio criador" 
  ON public.relatorios_policiais 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 4. Permitir exclusão apenas se o relatório foi cadastrado pelo próprio policial
CREATE POLICY "Permitir exclusão do próprio criador" 
  ON public.relatorios_policiais 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);
`;

// Initial mockup data to populate local storage of the app
const initialLocalReports: PoliceReport[] = [
  {
    id: 'report-demo-1',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    user_email: 'tenente.gomes@pm.mt.gov.br',
    operacao: 'Operação Saturação Metropolitana',
    turno: 'Serviço Noturno',
    efetivo: 12,
    viaturas: 4,
    armas_apreendidas: 2,
    armas_detalhes: '01 Revólver Taurus Cal. 38 com numeração raspada, 01 Pistola Imbel .40 S&W',
    municoes: 18,
    municoes_detalhes: '12 munições cal .38 intactas e 6 munições cal .40 intactas',
    drogas_peso: 1250,
    drogas_detalhes: 'Aproximadamente 950g de substância análoga à Maconha prensada e 300g de substância análoga à Cocaína em porções prontas para comercialização',
    valores: 1450.0,
    ocorrencias: 'Durante patrulhamento tático no bairro CPA IV, Cuiabá-MT, a guarnição deparou-se com veículo VW Gol branco em atitude suspeita. Na abordagem, constatou-se que o chassi estava adulterado e debaixo dos bancos foram localizadas as armas mencionadas e frascos contendo entorpecentes. Três suspeitos receberam voz de prisão e foram conduzidos à Central de Flagrantes.'
  },
  {
    id: 'report-demo-2',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    user_email: 'sargento.silva@pm.mt.gov.br',
    operacao: 'Barreira Integrada de Trânsito',
    turno: 'Serviço Vespertino',
    efetivo: 8,
    viaturas: 3,
    armas_apreendidas: 0,
    municoes: 0,
    drogas_peso: 0,
    valores: 0.0,
    ocorrencias: 'Realização de fiscalização de trânsito na Rodovia Emanuel Pinheiro (MT-251). Total de 38 veículos automotores vistoriados. Foram expedidos 09 autos de infração de trânsito diversos (AITs) e recolhidos 02 veículos ao pátio credenciado do Detran por documentação vencida. Sem demais ocorrências graves registradas.'
  },
  {
    id: 'report-demo-3',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(), // 1.5 days ago
    user_email: 'cabo.souza@pm.mt.gov.br',
    operacao: 'Operação Comércio Seguro',
    turno: 'Serviço Matutino',
    efetivo: 6,
    viaturas: 2,
    armas_apreendidas: 1,
    armas_detalhes: '01 Garrucha Calibre .22 sem marca visível',
    municoes: 4,
    municoes_detalhes: '04 munições calibre .22 intactas',
    drogas_peso: 45,
    drogas_detalhes: '12 porções (trouxinhas) de substância de cheiro característico a Pasta Base de Cocaína',
    valores: 280.0,
    ocorrencias: 'Atendimento de ocorrência de furto em andamento em estabelecimento comercial no Centro de Várzea Grande-MT. Um indivíduo foi flagrado por lojistas saindo em posse de produtos sem pagar. Com a chegada da viatura, o suspeito foi detido e, na busca pessoal, foi encontrada uma garrucha calibre .22 em sua cintura e dinheiro em notas miúdas.'
  }
];

// LocalDatabase helper object for full offline-persistence
export const LocalDb = {
  getReports(): PoliceReport[] {
    const raw = localStorage.getItem('rdspm_local_reports');
    if (!raw) {
      localStorage.setItem('rdspm_local_reports', JSON.stringify(initialLocalReports));
      return initialLocalReports;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialLocalReports;
    }
  },

  saveReport(report: Omit<PoliceReport, 'id' | 'created_at'>): PoliceReport {
    const reports = this.getReports();
    const newReport: PoliceReport = {
      ...report,
      id: 'report-local-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    reports.unshift(newReport);
    localStorage.setItem('rdspm_local_reports', JSON.stringify(reports));
    return newReport;
  },

  deleteReport(id: string): boolean {
    const reports = this.getReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem('rdspm_local_reports', JSON.stringify(filtered));
    return true;
  }
};
