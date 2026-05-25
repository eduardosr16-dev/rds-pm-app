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
export const DB_SQL_SCHEMA = `-- =========================================================================
-- SCRIPT DE ESTRUTURA PARA BANCO SUPABASE (RDS-PM)
-- POLÍCIA MILITAR DE MATO GROSSO (PMMT) - ESTRUTURA OPERACIONAL COMPLETA
-- =========================================================================

-- DB CLEANUP (Se quiser recomeçar do zero, descomente abaixo)
-- DROP TABLE IF EXISTS public.usuarios_pm CASCADE;
-- DROP TABLE IF EXISTS public.integrantes_guarnicao CASCADE;
-- DROP TABLE IF EXISTS public.guarnicoes CASCADE;
-- DROP TABLE IF EXISTS public.viaturas CASCADE;
-- DROP TABLE IF EXISTS public.atividades_delegadas CASCADE;
-- DROP TABLE IF EXISTS public.jornadas_extraordinarias CASCADE;
-- DROP TABLE IF EXISTS public.ocorrencias CASCADE;
-- DROP TABLE IF EXISTS public.anexos CASCADE;
-- DROP TABLE IF EXISTS public.relatorios CASCADE;
-- DROP TABLE IF EXISTS public.policiais CASCADE;

-- 1. TABELA DE POLICIAIS (BANCO INTERNO DE EFETIVOS DA SEÇÃO)
CREATE TABLE IF NOT EXISTS public.policiais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  graduacao VARCHAR(50) NOT NULL,
  pelotao VARCHAR(100),
  cidade VARCHAR(100) NOT NULL DEFAULT 'Cuiabá',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.policiais ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Policiais
CREATE POLICY "Acesso livre geral para tabela policiais" ON public.policiais FOR SELECT USING (true);
CREATE POLICY "Escrita livre geral para tabela policiais" ON public.policiais FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição de policiais" ON public.policiais FOR UPDATE USING (true);
CREATE POLICY "Exclusão de policiais" ON public.policiais FOR DELETE USING (true);

-- Cadastrar automaticamente os policiais oficiais da listagem PMMT
INSERT INTO public.policiais (nome_completo, matricula, graduacao) VALUES
('JEORGE AUGUSTO FERNANDES DE JESUS', '882.437', 'CAP PM'),
('FRANCKCINEY CANAVARROS MAGALHÃES', '880.279', '2º TEN PM'),
('WELLINGTON ALVES DA SILVA', '881.504', '2º TEN PM'),
('JUSCELINO FERREIRA DA LUZ', '880.492', '1º SGT PM'),
('EDUARDO SILVA RODRIGUES', '883.694', '2º SGT PM'),
('ALLAN M. OLIVEIRA BOSAIPO', '885.109', '2º SGT PM'),
('TIAGO RODRIGUES ALVES', '886.302', '2º SGT PM'),
('DOUGLAS SOUZA PORTO', '887.198', '2º SGT PM'),
('GLAUKO A. S. RODRIGUES DE LIMA', '884.122', '3º SGT PM'),
('LEANDRO DE JESUS SOUZA', '885.136', '3º SGT PM'),
('DIEGO A. DE SOUSA BOHRER', '885.117', '3º SGT PM'),
('MATEUS FETTER', '885.982', 'CB PM'),
('MARCELO DIAS BATISTA', '885.918', 'CB PM'),
('RHANGEL NUNES RAMOS', '886.045', 'CB PM'),
('KEVEN ALLEF FERREIRA DA COSTA', '886.245', 'CB PM'),
('JOSEAN EVARISTO DA SILVA', '886.343', 'CB PM'),
('RENAN FRANCISCO GOMES', '886.469', 'CB PM'),
('ILDEONES SILVA DA LUZ', '886.451', 'CB PM'),
('MARCOS SILVA OLIVEIRA', '886.462', 'CB PM'),
('THIAGO MARTINS DA SILVA', '886.594', 'CB PM'),
('VENILSON SOUZA MATOS', '887.688', 'CB PM'),
('THIAGO FAUSTINO DE OLIVEIRA', '886.471', 'SD PM'),
('FRANCISCO ANTONIO DA SILVA FILHO', '888.550', 'SD PM')
ON CONFLICT (matricula) DO NOTHING;


-- 2. TABELA DE RELATÓRIOS DIÁRIOS DE SERVIÇO (RELATORIOS)
CREATE TABLE IF NOT EXISTS public.relatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID DEFAULT NULL,
  user_email VARCHAR(255),
  
  -- Identificação e Detalhes solicitados
  operacao VARCHAR(255) NOT NULL,
  turno VARCHAR(50) NOT NULL,
  horario_servico VARCHAR(100) NOT NULL, -- Ex: "18:00 às 06:00"
  cidade VARCHAR(100) NOT NULL DEFAULT 'Cuiabá',
  comandante_responsavel VARCHAR(255) NOT NULL,
  comandante_recebe VARCHAR(255),
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

CREATE POLICY "Acesso livre geral para tabela relatorios" ON public.relatorios FOR SELECT USING (true);
CREATE POLICY "Escrita livre geral para tabela relatorios" ON public.relatorios FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição livre geral para tabela relatorios" ON public.relatorios FOR UPDATE USING (true);
CREATE POLICY "Exclusão livre geral para tabela relatorios" ON public.relatorios FOR DELETE USING (true);


-- 3. TABELA DE GUARNIÇÕES (GUARNICOES) - Relacionado com Relatório (1-N)
CREATE TABLE IF NOT EXISTS public.guarnicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  nome_guarnicao VARCHAR(150) NOT NULL,
  tipo_guarnicao VARCHAR(100) NOT NULL,
  viatura VARCHAR(100) NOT NULL,
  comandante_guarnicao VARCHAR(255) NOT NULL,
  policiais_integrantes TEXT NOT NULL, -- Lista descritiva dos integrantes
  horario_inicial VARCHAR(50) NOT NULL,
  horario_final VARCHAR(50) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guarnicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para guarnicoes" ON public.guarnicoes FOR SELECT USING (true);
CREATE POLICY "Escrita para guarnicoes" ON public.guarnicoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para guarnicoes" ON public.guarnicoes FOR UPDATE USING (true);
CREATE POLICY "Exclusão para guarnicoes" ON public.guarnicoes FOR DELETE USING (true);


-- 4. TABELA DE INTEGRANTES DE GUARNIÇÃO (INTEGRANTES_GUARNICAO) - Relacionamento N-M entre Guarnição e Policiais
CREATE TABLE IF NOT EXISTS public.integrantes_guarnicao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guarnicao_id UUID REFERENCES public.guarnicoes(id) ON DELETE CASCADE NOT NULL,
  policial_matricula VARCHAR(50) REFERENCES public.policiais(matricula) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.integrantes_guarnicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para integrantes_guarnicao" ON public.integrantes_guarnicao FOR SELECT USING (true);
CREATE POLICY "Escrita para integrantes_guarnicao" ON public.integrantes_guarnicao FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para integrantes_guarnicao" ON public.integrantes_guarnicao FOR UPDATE USING (true);
CREATE POLICY "Exclusão para integrantes_guarnicao" ON public.integrantes_guarnicao FOR DELETE USING (true);


-- 5. TABELA DE VIATURAS (VIATURAS) - Relacionado com Relatório (1-N)
CREATE TABLE IF NOT EXISTS public.viaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  prefixo VARCHAR(50) NOT NULL, -- Ex: "VTR-1042"
  modelo VARCHAR(100) NOT NULL, -- Ex: "Toyota Hilux"
  placa VARCHAR(20),
  km_inicial INTEGER,
  km_final INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para viaturas" ON public.viaturas FOR SELECT USING (true);
CREATE POLICY "Escrita para viaturas" ON public.viaturas FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para viaturas" ON public.viaturas FOR UPDATE USING (true);
CREATE POLICY "Exclusão para viaturas" ON public.viaturas FOR DELETE USING (true);


-- 6. TABELA DE ATIVIDADES DELEGADAS (ATIVIDADES_DELEGADAS) - Relacionado com Relatório (1-N)
CREATE TABLE IF NOT EXISTS public.atividades_delegadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  nome_equipe VARCHAR(150) NOT NULL,
  viatura VARCHAR(100) NOT NULL,
  policiais TEXT NOT NULL,
  local_operacao VARCHAR(255) NOT NULL,
  horario VARCHAR(100) NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.atividades_delegadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para atividades_delegadas" ON public.atividades_delegadas FOR SELECT USING (true);
CREATE POLICY "Escrita para atividades_delegadas" ON public.atividades_delegadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para atividades_delegadas" ON public.atividades_delegadas FOR UPDATE USING (true);
CREATE POLICY "Exclusão para atividades_delegadas" ON public.atividades_delegadas FOR DELETE USING (true);


-- 7. TABELA DE JORNADAS EXTRAORDINÁRIAS (JORNADAS_EXTRAORDINARIAS) - Relacionado com Relatório (1-N)
CREATE TABLE IF NOT EXISTS public.jornadas_extraordinarias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  nome_equipe VARCHAR(150) NOT NULL,
  viatura VARCHAR(100) NOT NULL,
  policiais TEXT NOT NULL,
  tipo_reforco VARCHAR(150) NOT NULL,
  horario VARCHAR(100) NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.jornadas_extraordinarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para jornadas_extraordinarias" ON public.jornadas_extraordinarias FOR SELECT USING (true);
CREATE POLICY "Escrita para jornadas_extraordinarias" ON public.jornadas_extraordinarias FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para jornadas_extraordinarias" ON public.jornadas_extraordinarias FOR UPDATE USING (true);
CREATE POLICY "Exclusão para jornadas_extraordinarias" ON public.jornadas_extraordinarias FOR DELETE USING (true);


-- 8. TABELA DE OCORRÊNCIAS DETALHADAS (OCORRENCIAS) - Relacionado com Relatório (1-N)
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  natureza_ocorrencia VARCHAR(150) NOT NULL,
  ocorrencia_bo VARCHAR(50), -- Número do BO
  suspeitos_conduzidos INTEGER DEFAULT 0,
  observacoes TEXT NOT NULL, -- Relato / Descritivo
  local_fato VARCHAR(255), -- Endereço ou Bairro
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para ocorrencias" ON public.ocorrencias FOR SELECT USING (true);
CREATE POLICY "Escrita para ocorrencias" ON public.ocorrencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para ocorrencias" ON public.ocorrencias FOR UPDATE USING (true);
CREATE POLICY "Exclusão para ocorrencias" ON public.ocorrencias FOR DELETE USING (true);


-- 9. TABELA DE ANEXOS (ANEXOS) - Relacionado com Relatório (1-N)
CREATE TABLE IF NOT EXISTS public.anexos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL, -- Link do Storage Supabase ou string base64 / foto
  tipo VARCHAR(50) DEFAULT 'imagem', -- 'imagem', 'pdf', 'outro'
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso para anexos" ON public.anexos FOR SELECT USING (true);
CREATE POLICY "Escrita para anexos" ON public.anexos FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição para anexos" ON public.anexos FOR UPDATE USING (true);
CREATE POLICY "Exclusão para anexos" ON public.anexos FOR DELETE USING (true);


-- 10. TABELA DE USUARIOS PM (AUTENTICAÇÃO CUSTOMIZADA INSTITUCIONAL)
CREATE TABLE IF NOT EXISTS public.usuarios_pm (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rg_pm VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  graduacao VARCHAR(50) NOT NULL,
  senha_operacional VARCHAR(100) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.usuarios_pm ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso livre select usuarios_pm" ON public.usuarios_pm FOR SELECT USING (true);
CREATE POLICY "Acesso livre insert usuarios_pm" ON public.usuarios_pm FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso livre update usuarios_pm" ON public.usuarios_pm FOR UPDATE USING (true);
CREATE POLICY "Acesso livre delete usuarios_pm" ON public.usuarios_pm FOR DELETE USING (true);

-- 11. TABELA DE USUARIOS (SISTEMA DE PRIMEIRO ACESSO)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rg_pm VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  posto VARCHAR(50) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso livre select usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Acesso livre insert usuarios" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso livre update usuarios" ON public.usuarios FOR UPDATE USING (true);
CREATE POLICY "Acesso livre delete usuarios" ON public.usuarios FOR DELETE USING (true);
`;

// Real relational fetching from Supabase database
export const fetchFullReports = async (): Promise<PoliceReport[]> => {
  if (!supabase) return [];

  // 1. Fetch main reports
  const { data: rels, error: relsErr } = await supabase
  .from('relatorios')
  .select('*')
  .order('created_at', { ascending: false });

  if (relsErr) throw relsErr;
  if (!rels || rels.length === 0) return [];

  const relsIds = rels.map(r => r.id);

  // 2. Fetch all child elements in parallel to bypass huge joins issues
  const [
    { data: vtrs },
    { data: ocos },
    { data: guars },
    { data: delegs },
    { data: jorns },
    { data: anxs }
  ] = await Promise.all([
    supabase.from('viaturas').select('*').in('relatorio_id', relsIds),
    supabase.from('ocorrencias').select('*').in('relatorio_id', relsIds),
    supabase.from('guarnicoes').select('*').in('relatorio_id', relsIds),
    supabase.from('atividades_delegadas').select('*').in('relatorio_id', relsIds),
    supabase.from('jornadas_extraordinarias').select('*').in('relatorio_id', relsIds),
    supabase.from('anexos').select('*').in('relatorio_id', relsIds)
  ]);

  // 3. Assemble components back into mapped TypeScript objects
  return rels.map((r: any) => {
    return {
      ...r,
      lista_viaturas: (vtrs || []).filter((v: any) => v.relatorio_id === r.id),
      lista_ocorrencias: (ocos || []).filter((o: any) => o.relatorio_id === r.id),
      lista_guarnicoes: (guars || []).filter((g: any) => g.relatorio_id === r.id),
      lista_atividades_delegadas: (delegs || []).filter((d: any) => d.relatorio_id === r.id),
      lista_jornadas_extraordinarias: (jorns || []).filter((j: any) => j.relatorio_id === r.id),
      lista_anexos: (anxs || []).filter((a: any) => a.relatorio_id === r.id)
    };
  });
};

// Real transactional-like relational inserting in Supabase database
export const saveFullReport = async (
  payload: Omit<PoliceReport, 'id' | 'created_at'>,
  userId?: string,
  userEmail?: string
): Promise<PoliceReport> => {
  if (!supabase) throw new Error("Supabase is not configured yet.");

  // 1. Insert main record first
  const insertPayload: any = {
    operacao: payload.operacao,
    turno: payload.turno,
    horario_servico: payload.horario_servico,
    cidade: payload.cidade,
    comandante_responsavel: payload.comandante_responsavel,
    comandante_recebe: (payload as any).comandante_recebe || null,
    efetivo: payload.efetivo,
    viaturas: payload.viaturas,
    armas_apreendidas: payload.armas_apreendidas,
    armas_detalhes: payload.armas_detalhes,
    municoes: payload.municoes,
    municoes_detalhes: payload.municoes_detalhes,
    drogas_peso: payload.drogas_peso,
    drogas_detalhes: payload.drogas_detalhes,
    valores: payload.valores,
    observacoes: payload.observacoes,
    ocorrencias: payload.ocorrencias,
    user_id: userId || null,
    user_email: userEmail || 'Central RDS'
  };

  let { data: relData, error: relError } = await supabase
    .from('relatorios')
    .insert([insertPayload])
    .select();

  if (relError && (relError.message?.includes('comandante_recebe') || relError.code === '42703')) {
    console.warn("A coluna 'comandante_recebe' nao existe no banco de dados. Tentando salvar sem ela para manter compatibilidade...");
    delete insertPayload.comandante_recebe;
    if ((payload as any).comandante_recebe) {
      insertPayload.observacoes = `[RECEBE SERVIÇO: ${(payload as any).comandante_recebe}] ` + (insertPayload.observacoes || '');
    }
    const retryResult = await supabase
      .from('relatorios')
      .insert([insertPayload])
      .select();
    relData = retryResult.data;
    relError = retryResult.error;
  }

  if (relError) throw relError;
  if (!relData || relData.length === 0) throw new Error("Falha ao registrar relatorio (ID nao retornado).");

  const newReportId = relData[0].id;

  // 2. Insert Viaturas
  if (payload.lista_viaturas && payload.lista_viaturas.length > 0) {
    const vtrsPayload = payload.lista_viaturas.map(v => ({
      relatorio_id: newReportId,
      prefixo: v.prefixo,
      modelo: v.modelo,
      placa: v.placa || '',
      km_inicial: Number(v.km_inicial) || 0,
      km_final: Number(v.km_final) || 0
    }));
    const { error: errVtrs } = await supabase.from('viaturas').insert(vtrsPayload);
    if (errVtrs) console.error("Erro ao persistir viaturas no Supabase:", errVtrs);
  }

  // 3. Insert Ocorrências
  if (payload.lista_ocorrencias && payload.lista_ocorrencias.length > 0) {
    const ocosPayload = payload.lista_ocorrencias.map(o => ({
      relatorio_id: newReportId,
      natureza_ocorrencia: o.natureza_ocorrencia,
      ocorrencia_bo: o.ocorrencia_bo || '',
      suspeitos_conduzidos: Number(o.suspeitos_conduzidos) || 0,
      observacoes: o.observacoes,
      local_fato: o.local_fato || ''
    }));
    const { error: errOcos } = await supabase.from('ocorrencias').insert(ocosPayload);
    if (errOcos) console.error("Erro ao persistir ocorrências no Supabase:", errOcos);
  }

  // 4. Insert Guarnições & Cadastrar Integrantes na Tabela de Associação
  if (payload.lista_guarnicoes && payload.lista_guarnicoes.length > 0) {
    for (const g of payload.lista_guarnicoes) {
      const { data: guarData, error: errGuar } = await supabase
        .from('guarnicoes')
        .insert([{
          relatorio_id: newReportId,
          nome_guarnicao: g.nome_guarnicao,
          tipo_guarnicao: g.tipo_guarnicao,
          viatura: g.viatura,
          comandante_guarnicao: g.comandante_guarnicao,
          policiais_integrantes: g.policiais_integrantes,
          horario_inicial: g.horario_inicial,
          horario_final: g.horario_final
        }])
        .select();

      if (errGuar) {
        console.error("Erro ao cadastrar guarnição no Supabase:", errGuar);
        continue;
      }

      const generatedGuarId = guarData?.[0]?.id;
      if (generatedGuarId) {
        // Encontrar as matrículas pelo padrão: Mat. (XXX.XXX)
        const matches = g.policiais_integrantes.match(/Mat\.\s*([0-9.]+)/g) || [];
        const matriculasList = matches.map(m => m.replace(/Mat\.\s*/, '').trim());

        if (matriculasList.length > 0) {
          const links = matriculasList.map(mat => ({
            guarnicao_id: generatedGuarId,
            policial_matricula: mat
          }));
          const { error: errLinks } = await supabase.from('integrantes_guarnicao').insert(links);
          if (errLinks) console.error("Erro ao registrar integrantes da guarnição no database:", errLinks);
        }
      }
    }
  }

  // 5. Insert Atividades Delegadas
  if (payload.lista_atividades_delegadas && payload.lista_atividades_delegadas.length > 0) {
    const delegsPayload = payload.lista_atividades_delegadas.map(ad => ({
      relatorio_id: newReportId,
      nome_equipe: ad.nome_equipe,
      viatura: ad.viatura,
      policiais: ad.policiais,
      local_operacao: ad.local_operacao,
      horario: ad.horario,
      observacoes: ad.observacoes || ''
    }));
    const { error: errDelegs } = await supabase.from('atividades_delegadas').insert(delegsPayload);
    if (errDelegs) console.error("Erro ao persistir Atividade Delegada no Supabase:", errDelegs);
  }

  // 6. Insert Jornadas Extraordinárias
  if (payload.lista_jornadas_extraordinarias && payload.lista_jornadas_extraordinarias.length > 0) {
    const jornsPayload = payload.lista_jornadas_extraordinarias.map(je => ({
      relatorio_id: newReportId,
      nome_equipe: je.nome_equipe,
      viatura: je.viatura,
      policiais: je.policiais,
      tipo_reforco: je.tipo_reforco,
      horario: je.horario,
      observacoes: je.observacoes || ''
    }));
    const { error: errJorns } = await supabase.from('jornadas_extraordinarias').insert(jornsPayload);
    if (errJorns) console.error("Erro ao persistir Jornada Extraordinária no Supabase:", errJorns);
  }

  // Retornar toda a estrutura organizada
  return {
    ...relData[0],
    lista_viaturas: payload.lista_viaturas || [],
    lista_ocorrencias: payload.lista_ocorrencias || [],
    lista_guarnicoes: payload.lista_guarnicoes || [],
    lista_atividades_delegadas: payload.lista_atividades_delegadas || [],
    lista_jornadas_extraordinarias: payload.lista_jornadas_extraordinarias || [],
    lista_anexos: []
  };
};

// LocalDatabase helper object for full offline-persistence fallback
export const LocalDb = {
  getReports(): PoliceReport[] {
    const raw = localStorage.getItem('rdspm_local_reports');
    if (!raw) {
      localStorage.setItem('rdspm_local_reports', JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
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

  deleteReport(id: string | number): boolean {
    const reports = this.getReports();
    const idStr = String(id || '');
    const filtered = reports.filter(r => String(r?.id || '') !== idStr);
    localStorage.setItem('rdspm_local_reports', JSON.stringify(filtered));
    return true;
  }
};
