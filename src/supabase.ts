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

// Return the expanded SQL string to initialize the schema in Supabase Dashboard
export const DB_SQL_SCHEMA = `-- ==========================================
-- SCRIPT DE ESTRUTURA PARA BANCO SUPABASE (RDS-PM)
-- POLÍCIA MILITAR DE MATO GROSSO (PMMT)
-- ==========================================

-- 1. TABELA DE POLICIAIS
CREATE TABLE IF NOT EXISTS public.policiais (
  id UUID PRIMARY KEY, -- ID correspondente ao auth.users.id
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  graduacao VARCHAR(50) NOT NULL,
  pelotao VARCHAR(100),
  cidade VARCHAR(100) NOT NULL DEFAULT 'Cuiabá',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.policiais ENABLE ROW LEVEL SECURITY;

-- 2. TABELA DE RELATÓRIOS (SUBSTITUI / SUPERA O MODELO SIMPLES ANTERIOR)
CREATE TABLE IF NOT EXISTS public.relatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  
  -- Identificação e Detalhes solicitados
  operacao VARCHAR(255) NOT NULL,
  turno VARCHAR(50) NOT NULL,
  horario_servico VARCHAR(100) NOT NULL, -- Ex: "18h às 06h" ou "19:00 às 07:00"
  cidade VARCHAR(100) NOT NULL DEFAULT 'Cuiabá',
  comandante_responsavel VARCHAR(255) NOT NULL,
  efetivo INTEGER NOT NULL DEFAULT 1,
  viaturas INTEGER NOT NULL DEFAULT 1,
  
  -- Produtividades Consolidadas
  armas_apreendidas INTEGER NOT NULL DEFAULT 0,
  armas_detalhes TEXT,
  municoes INTEGER NOT NULL DEFAULT 0,
  municoes_detalhes TEXT,
  drogas_peso NUMERIC NOT NULL DEFAULT 0.0, -- Em gramas
  drogas_detalhes TEXT,
  valores NUMERIC NOT NULL DEFAULT 0.0, -- Em R$
  
  -- Campos adicionais de observação
  observacoes TEXT,
  ocorrencias TEXT NOT NULL -- Narrativa consolidada do turno
);

-- Ativar RLS para relatórios
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- 3. TABELA DE VIATURAS (RELAÇÃO 1-N COM RELATÓRIOS)
CREATE TABLE IF NOT EXISTS public.viaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE,
  prefixo VARCHAR(50) NOT NULL, -- Ex: "VTR-1042"
  modelo VARCHAR(100) NOT NULL, -- Ex: "Toyota Hilux"
  placa VARCHAR(20),
  km_inicial INTEGER,
  km_final INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para viaturas
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;

-- 4. TABELA DE OCORRÊNCIAS DETALHADAS (RELAÇÃO 1-N COM RELATÓRIOS)
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE,
  natureza_ocorrencia VARCHAR(150) NOT NULL, -- Ex: "Tráfico de Entorpecentes", "Roubo de Veículo"
  ocorrencia_bo VARCHAR(50), -- Número do BO
  suspeitos_conduzidos INTEGER DEFAULT 0,
  observacoes TEXT NOT NULL, -- Relato / Descritivo
  local_fato VARCHAR(255), -- Endereço ou Bairro
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para ocorrencias
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

-- 5. TABELA DE ANEXOS (RELAÇÃO 1-N COM RELATÓRIOS)
CREATE TABLE IF NOT EXISTS public.anexos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL, -- Link do Storage Supabase ou string base64 / foto
  tipo VARCHAR(50) DEFAULT 'imagem', -- 'imagem', 'pdf', 'outro'
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para anexos
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- POLICIES DE SEGURANÇA (ROW LEVEL SECURITY)
-- ==========================================

-- A) POLICIAIS
CREATE POLICY "Leitura livre para militar autenticado" 
  ON public.policiais FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gravação do próprio dados de militar" 
  ON public.policiais FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Atualização do próprio cadastro" 
  ON public.policiais FOR UPDATE TO authenticated USING (auth.uid() = id);

-- B) RELATÓRIOS
CREATE POLICY "Militar autenticado lê qualquer RDS" 
  ON public.relatorios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Militar autenticado insere RDS" 
  ON public.relatorios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Militar criador atualiza o próprio RDS" 
  ON public.relatorios FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Militar criador deleta o próprio RDS" 
  ON public.relatorios FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- C) VIATURAS
CREATE POLICY "Militar lê viaturas de RDS" 
  ON public.viaturas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Militar insere viatura vinculada" 
  ON public.viaturas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Deleção de viaturas vinculadas" 
  ON public.viaturas FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.relatorios 
      WHERE public.relatorios.id = public.viaturas.relatorio_id 
      AND public.relatorios.user_id = auth.uid()
    )
  );

-- D) OCORRÊNCIAS
CREATE POLICY "Militar lê ocorrências de RDS" 
  ON public.ocorrencias FOR SELECT TO authenticated USING (true);

CREATE POLICY "Militar insere ocorrência em RDS" 
  ON public.ocorrencias FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Deleção de ocorrências vinculadas" 
  ON public.ocorrencias FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.relatorios 
      WHERE public.relatorios.id = public.ocorrencias.relatorio_id 
      AND public.relatorios.user_id = auth.uid()
    )
  );

-- E) ANEXOS
CREATE POLICY "Militar lê anexos de RDS" 
  ON public.anexos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Militar insere anexos em RDS" 
  ON public.anexos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Deleção de anexos vinculados" 
  ON public.anexos FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.relatorios 
      WHERE public.relatorios.id = public.anexos.relatorio_id 
      AND public.relatorios.user_id = auth.uid()
    )
  );
`;

// Initial mockup data to populate local storage of the app
const initialLocalReports: PoliceReport[] = [
  {
    id: 'report-demo-1',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    user_email: 'tenente.gomes@pm.mt.gov.br',
    operacao: 'Operação Saturação Metropolitana',
    turno: 'Serviço Noturno (18h às 06h)',
    horario_servico: '19:00 às 07:00',
    cidade: 'Cuiabá',
    comandante_responsavel: 'Ten PM Gomes',
    efetivo: 12,
    viaturas: 4,
    armas_apreendidas: 2,
    armas_detalhes: '01 Revólver Taurus Cal. 38 com numeração raspada, 01 Pistola Imbel .40 S&W',
    municoes: 18,
    municoes_detalhes: '12 munições cal .38 intactas e 6 munições cal .40 intactas',
    drogas_peso: 1250,
    drogas_detalhes: 'Aproximadamente 950g de substância análoga à Maconha prensada e 300g de substância análoga à Cocaína em porções prontas para comercialização',
    valores: 1450.0,
    observacoes: 'Diligências efetuadas em conjunto com a Força Tática do 1º Comando Regional.',
    ocorrencias: 'Durante patrulhamento tático no bairro CPA IV, Cuiabá-MT, a guarnição deparou-se com veículo VW Gol branco em atitude suspeita. Na abordagem, constatou-se que o chassi estava adulterado e debaixo dos bancos foram localizadas as armas mencionadas e frascos contendo entorpecentes. Três suspeitos receberam voz de prisão e foram conduzidos à Central de Flagrantes.',
    lista_viaturas: [
      { prefixo: 'VTR-1021', modelo: 'Toyota Hilux GLI', placa: 'OBO-2234', km_inicial: 124500, km_final: 124720 },
      { prefixo: 'VTR-1025', modelo: 'Toyota Hilux GLI', placa: 'OBO-4412', km_inicial: 98110, km_final: 98320 }
    ],
    lista_ocorrencias: [
      { natureza_ocorrencia: 'Tráfico de drogas', ocorrencia_bo: 'BO-2026.04415', suspeitos_conduzidos: 2, observacoes: 'Apreensão de grande volume de maconha e cocaína prensada no CPA IV.', local_fato: 'Bairro CPA IV, Cuiabá - MT' },
      { natureza_ocorrencia: 'Porte ilegal de arma de fogo', ocorrencia_bo: 'BO-2026.04416', suspeitos_conduzidos: 1, observacoes: 'Pistola cal .40 localizada com o motorista do veículo abordado.', local_fato: 'Avenida Pantanal, Cuiabá - MT' }
    ]
  },
  {
    id: 'report-demo-2',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    user_email: 'sargento.silva@pm.mt.gov.br',
    operacao: 'Barreira Integrada de Trânsito',
    turno: 'Serviço Vespertino (12h às 18h)',
    horario_servico: '12:00 às 18:00',
    cidade: 'Várzea Grande',
    comandante_responsavel: '2º Sgt PM Silva',
    efetivo: 8,
    viaturas: 3,
    armas_apreendidas: 0,
    municoes: 0,
    drogas_peso: 0,
    valores: 0.0,
    observacoes: 'Ação integrada realizada com apoio da Guarda Municipal de Várzea Grande.',
    ocorrencias: 'Realização de fiscalização de trânsito na Rodovia Emanuel Pinheiro (MT-251). Total de 38 veículos automotores vistoriados. Foram expedidos 09 autos de infração de trânsito diversos (AITs) e recolhidos 02 veículos ao pátio credenciado do Detran por documentação vencida. Sem demais ocorrências graves registradas.',
    lista_viaturas: [
      { prefixo: 'VTR-0941', modelo: 'Chevrolet Trailblazer', placa: 'RRN-9F12', km_inicial: 45210, km_final: 45310 }
    ],
    lista_ocorrencias: [
      { natureza_ocorrencia: 'Infração de trânsito / Apreensão de veículo', ocorrencia_bo: 'BO-2026.04351', suspeitos_conduzidos: 0, observacoes: 'Veículos recolhidos por ausência de licenciamento obrigatório vigente.', local_fato: 'MT-251 Km 4, Mato Grosso' }
    ]
  },
  {
    id: 'report-demo-3',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(), // 1.5 days ago
    user_email: 'cabo.souza@pm.mt.gov.br',
    operacao: 'Operação Comércio Seguro',
    turno: 'Serviço Matutino (06h às 12h)',
    horario_servico: '06:00 às 12:00',
    cidade: 'Rondonópolis',
    comandante_responsavel: 'Cb PM Souza',
    efetivo: 6,
    viaturas: 2,
    armas_apreendidas: 1,
    armas_detalhes: '01 Garrucha Calibre .22 sem marca visível',
    municoes: 4,
    municoes_detalhes: '04 munições calibre .22 intactas',
    drogas_peso: 45,
    drogas_detalhes: '12 porções (trouxinhas) de substância de cheiro característico a Pasta Base de Cocaína',
    valores: 280.0,
    observacoes: 'Subsidiar patrulhas a pé no centro comercial.',
    ocorrencias: 'Atendimento de ocorrência de furto em andamento em estabelecimento comercial no Centro de Rondonópolis-MT. Um indivíduo foi flagrado por lojistas saindo em posse de produtos sem pagar. Com a chegada da viatura, o suspeito foi detido e, na busca pessoal, foi encontrada uma garrucha calibre .22 em sua cintura e dinheiro em notas miúdas.',
    lista_viaturas: [
      { prefixo: 'VTR-1022', modelo: 'Renault Duster', placa: 'NUE-3382', km_inicial: 189100, km_final: 189180 }
    ],
    lista_ocorrencias: [
      { natureza_ocorrencia: 'Furto tentado com detenção', ocorrencia_bo: 'BO-2026.04210', suspeitos_conduzidos: 1, observacoes: 'Suspeito detido em flagrante com mercadorias subtraídas e garrucha calibre .22.', local_fato: 'Av. Marechal Rondon, Centro, Rondonópolis - MT' }
    ]
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
