import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://svvxthekfgsjwvskipmc.supabase.co';
const supabaseAnonKey = 'sb_publishable_eS3HNjiuw7re2VGsGx5fZg_FxlMvOGf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

console.log('[RDS-PM] SUPABASE CLIENT ACTIVE');

// Robust SQL Database migration system schema for bootstrapping PMMT tables
export const DB_SQL_SCHEMA = `-- SISTEMA RDS-PM • SCRIPT DO BANCO DE DADOS (PMMT)
-- Executar no Editor SQL do seu painel Supabase para criar e seedar as tabelas táticas.

-- 1. CRIAR TABELA DE POLICIAIS (ALINHADA COM LOGIN E REPORT FORM QUERY SYSTEM)
CREATE TABLE IF NOT EXISTS public.policiais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rg_pm VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(100) DEFAULT '1234',
    matricula VARCHAR(20),
    nome_completo VARCHAR(100),
    graduacao VARCHAR(30)
);

-- Habilitar RLS (Row Level Security) na tabela policiais
ALTER TABLE public.policiais ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública para policiais
CREATE POLICY "Leitura pública poli" ON public.policiais
    FOR SELECT TO public USING (true);

-- Criar política de escrita irrestrita para policiais (para redefinir senhas)
CREATE POLICY "Escrita livre poli" ON public.policiais
    FOR ALL TO public USING (true) WITH CHECK (true);


-- 2. CRIAR TABELA DE USUARIOS (USADA PELO SERVIDOR NODE)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rg_pm VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(100) DEFAULT '1234',
    primeiro_acesso BOOLEAN DEFAULT true
);

-- Habilitar RLS na tabela usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Criar política de ação livre para usuarios
CREATE POLICY "Acao livre usuarios" ON public.usuarios
    FOR ALL TO public USING (true) WITH CHECK (true);


-- 3. CRIAR TABELA DE RELATÓRIOS (LIVRO DE REGISTROS)
CREATE TABLE IF NOT EXISTS public.relatorios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_servico VARCHAR(20) NOT NULL,
    operacao VARCHAR(100) NOT NULL,
    turno VARCHAR(30) NOT NULL,
    horario_servico VARCHAR(50),
    cidade VARCHAR(80) DEFAULT 'Cuiabá',
    comandante_responsavel VARCHAR(100) NOT NULL,
    comandante_recebe VARCHAR(100) NOT NULL,
    efetivo INTEGER DEFAULT 1,
    viaturas INTEGER DEFAULT 1,
    armas_apreendidas INTEGER DEFAULT 0,
    armas_detalhes TEXT,
    municoes INTEGER DEFAULT 0,
    municoes_detalhes TEXT,
    drogas_peso NUMERIC DEFAULT 0,
    drogas_detalhes TEXT,
    valores NUMERIC DEFAULT 0,
    observacoes TEXT,
    ocorrencias JSONB DEFAULT '[]'::jsonb,
    lista_viaturas JSONB DEFAULT '[]'::jsonb,
    guarnicao JSONB DEFAULT '[]'::jsonb,
    lista_anexos JSONB DEFAULT '[]'::jsonb,
    user_email VARCHAR(100) NOT NULL,
    pessoas_abordadas INTEGER DEFAULT 0,
    carros_abordados INTEGER DEFAULT 0,
    motos_abordadas INTEGER DEFAULT 0,
    pessoas_checadas INTEGER DEFAULT 0,
    carros_checados INTEGER DEFAULT 0,
    motos_checadas INTEGER DEFAULT 0,
    lista_pessoas_checadas_texto TEXT,
    tco_registrados INTEGER DEFAULT 0,
    prisoes_flagrante INTEGER DEFAULT 0,
    pessoas_conduzidas_depol INTEGER DEFAULT 0,
    veiculos_apreendidos INTEGER DEFAULT 0,
    arma_branca_apreendida INTEGER DEFAULT 0,
    num_autos_remocao INTEGER DEFAULT 0,
    veiculos_notificados INTEGER DEFAULT 0,
    veiculos_recuperados INTEGER DEFAULT 0,
    diversos_apreendidos TEXT,
    barreiras_policiais INTEGER DEFAULT 0,
    patrulhamento_rural INTEGER DEFAULT 0,
    pontos_demonstrativos INTEGER DEFAULT 0,
    rondas_comerciais INTEGER DEFAULT 0
);

-- Habilitar RLS na tabela relatorios
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- Criar política irrestrita de leitura e escrita para relatórios
CREATE POLICY "Controle livre relatorios" ON public.relatorios
    FOR ALL TO public USING (true) WITH CHECK (true);


-- 4. CRIAR TABELA DE VIATURAS
CREATE TABLE IF NOT EXISTS public.viaturas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    modelo VARCHAR(100) NOT NULL,
    placa VARCHAR(20) UNIQUE NOT NULL,
    chassi VARCHAR(100),
    renavam VARCHAR(100),
    observacao_operacional TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela viaturas
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;

-- Criar política livre de leitura e escrita para viaturas
CREATE POLICY "Controle livre viaturas" ON public.viaturas
    FOR ALL TO public USING (true) WITH CHECK (true);


-- 5. CRIAR TABELA DE ABASTECIMENTOS
CREATE TABLE IF NOT EXISTS public.abastecimentos_viaturas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    relatorio_id VARCHAR(100),
    viatura_id bigint,
    km_abastecimento integer,
    litros numeric,
    saldo numeric,
    valor_abastecido numeric,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela abastecimentos_viaturas
ALTER TABLE public.abastecimentos_viaturas ENABLE ROW LEVEL SECURITY;

-- Criar política livre de leitura e escrita para abastecimentos
CREATE POLICY "Controle livre abastecimentos" ON public.abastecimentos_viaturas
    FOR ALL TO public USING (true) WITH CHECK (true);


-- 6. SEEDAR TABELAS COM OS POLICIAIS DA LISTA OFICIAL DO MATO GROSSO (PMMT)
INSERT INTO public.policiais (rg_pm, nome, senha, matricula, nome_completo, graduacao) VALUES
('882437', 'CAP PM JEORGE AUGUSTO FERNANDES DE JESUS', '1234', '882.437', 'JEORGE AUGUSTO FERNANDES DE JESUS', 'CAP PM'),
('880279', '2º TEN PM FRANCKCINEY CANAVARROS MAGALHÃES', '1234', '880.279', 'FRANCKCINEY CANAVARROS MAGALHÃES', '2º TEN PM'),
('881504', '2º TEN PM WELLINGTON ALVES DA SILVA', '1234', '881.504', 'WELLINGTON ALVES DA SILVA', '2º TEN PM'),
('880492', '1º SGT PM JUSCELINO FERREIRA DA LUZ', '1234', '880.492', 'JUSCELINO FERREIRA DA LUZ', '1º SGT PM'),
('883694', '2º SGT PM EDUARDO SILVA RODRIGUES', '1234', '883.694', 'EDUARDO SILVA RODRIGUES', '2º SGT PM'),
('885109', '2º SGT PM ALLAN M. OLIVEIRA BOSAIPO', '1234', '885.109', 'ALLAN M. OLIVEIRA BOSAIPO', '2º SGT PM'),
('886302', '2º SGT PM TIAGO RODRIGUES ALVES', '1234', '886.302', 'TIAGO RODRIGUES ALVES', '2º SGT PM'),
('887198', '2º SGT PM DOUGLAS SOUZA PORTO', '1234', '887.198', 'DOUGLAS SOUZA PORTO', '2º SGT PM'),
('884122', '3º SGT PM GLAUKO A. S. RODRIGUES DE LIMA', '1234', '884.122', 'GLAUKO A. S. RODRIGUES DE LIMA', '3º SGT PM'),
('885136', '3º SGT PM LEANDRO DE JESUS SOUZA', '1234', '885.136', 'LEANDRO DE JESUS SOUZA', '3º SGT PM'),
('885117', '3º SGT PM DIEGO A. DE SOUSA BOHRER', '1234', '885.117', 'DIEGO A. DE SOUSA BOHRER', '3º SGT PM'),
('885982', 'CB PM MATEUS FETTER', '1234', '885.982', 'MATEUS FETTER', 'CB PM'),
('885918', 'CB PM MARCELO DIAS BATISTA', '1234', '885.918', 'MARCELO DIAS BATISTA', 'CB PM'),
('886045', 'CB PM RHANGEL NUNES RAMOS', '1234', '886.045', 'RHANGEL NUNES RAMOS', 'CB PM'),
('886245', 'CB PM KEVEN ALLEF FERREIRA DA COSTA', '1234', '886.245', 'KEVEN ALLEF FERREIRA DA COSTA', 'CB PM'),
('886343', 'CB PM JOSEAN EVARISTO DA SILVA', '1234', '886.343', 'JOSEAN EVARISTO DA SILVA', 'CB PM'),
('886469', 'CB PM RENAN FRANCISCO GOMES', '1234', '886.469', 'RENAN FRANCISCO GOMES', 'CB PM'),
('886451', 'CB PM ILDEONES SILVA DA LUZ', '1234', '886.451', 'ILDEONES SILVA DA LUZ', 'CB PM'),
('886462', 'CB PM MARCOS SILVA OLIVEIRA', '1234', '886.462', 'MARCOS SILVA OLIVEIRA', 'CB PM'),
('886594', 'CB PM THIAGO MARTINS DA SILVA', '1234', '886.594', 'THIAGO MARTINS DA SILVA', 'CB PM'),
('887688', 'CB PM VENILSON SOUZA MATOS', '1234', '887.688', 'VENILSON SOUZA MATOS', 'CB PM'),
('886471', 'SD PM THIAGO FAUSTINO DE OLIVEIRA', '1234', '886.471', 'SD PM THIAGO FAUSTINO DE OLIVEIRA', 'SD PM'),
('888550', 'SD PM FRANCISCO ANTONIO DA SILVA FILHO', '1234', '888.550', 'SD PM FRANCISCO ANTONIO DA SILVA FILHO', 'SD PM')
ON CONFLICT (rg_pm) DO NOTHING;

INSERT INTO public.usuarios (rg_pm, nome, email, senha, primeiro_acesso) VALUES
('882437', 'CAP PM JEORGE AUGUSTO FERNANDES DE JESUS', '882437@pm.mt.gov.br', '1234', true),
('880279', '2º TEN PM FRANCKCINEY CANAVARROS MAGALHÃES', '880279@pm.mt.gov.br', '1234', true),
('881504', '2º TEN PM WELLINGTON ALVES DA SILVA', '881504@pm.mt.gov.br', '1234', true),
('880492', '1º SGT PM JUSCELINO FERREIRA DA LUZ', '880492@pm.mt.gov.br', '1234', true),
('883694', '2º SGT PM EDUARDO SILVA RODRIGUES', '883694@pm.mt.gov.br', '1234', true),
('885109', '2º SGT PM ALLAN M. OLIVEIRA BOSAIPO', '885109@pm.mt.gov.br', '1234', true),
('886302', '2º SGT PM TIAGO RODRIGUES ALVES', '886302@pm.mt.gov.br', '1234', true),
('887198', '2º SGT PM DOUGLAS SOUZA PORTO', '887198@pm.mt.gov.br', '1234', true),
('884122', '3º SGT PM GLAUKO A. S. RODRIGUES DE LIMA', '884122@pm.mt.gov.br', '1234', true),
('885136', '3º SGT PM LEANDRO DE JESUS SOUZA', '885136@pm.mt.gov.br', '1234', true),
('885117', '3º SGT PM DIEGO A. DE SOUSA BOHRER', '885117@pm.mt.gov.br', '1234', true),
('885982', 'CB PM MATEUS FETTER', '885982@pm.mt.gov.br', '1234', true),
('885918', 'CB PM MARCELO DIAS BATISTA', '885918@pm.mt.gov.br', '1234', true),
('886045', 'CB PM RHANGEL NUNES RAMOS', '886045@pm.mt.gov.br', '1234', true),
('886245', 'CB PM KEVEN ALLEF FERREIRA DA COSTA', '886245@pm.mt.gov.br', '1234', true),
('886343', 'CB PM JOSEAN EVARISTO DA SILVA', '886343@pm.mt.gov.br', '1234', true),
('886469', 'CB PM RENAN FRANCISCO GOMES', '886469@pm.mt.gov.br', '1234', true),
('886451', 'CB PM ILDEONES SILVA DA LUZ', '886451@pm.mt.gov.br', '1234', true),
('886462', 'CB PM MARCOS SILVA OLIVEIRA', '886462@pm.mt.gov.br', '1234', true),
('886594', 'CB PM THIAGO MARTINS DA SILVA', '886594@pm.mt.gov.br', '1234', true),
('887688', 'CB PM VENILSON SOUZA MATOS', '887688@pm.mt.gov.br', '1234', true),
('886471', 'SD PM THIAGO FAUSTINO DE OLIVEIRA', '886471@pm.mt.gov.br', '1234', true),
('888550', 'SD PM FRANCISCO ANTONIO DA SILVA FILHO', '888550@pm.mt.gov.br', '1234', true)
ON CONFLICT (rg_pm) DO NOTHING;

-- SEEDAR VIATURAS INICIAIS
INSERT INTO public.viaturas (modelo, placa, chassi, renavam, observacao_operacional, ativo) VALUES
('Triton L200', 'SPY-7D90', '93XDLLC2TTCS07563', '1455673401', 'BAIXADA DIA 23/04 NA OFICINA DALMOCAR EM QUERÊNCIA', true),
('Triton L200', 'RRX3B80', '93XLJKL1TRCP74674', '1360696986', 'S/A', true),
('Renault Duster', 'SPU-1C95', '93YHJD20XSJ146780', '1421440196', 'S/A', true),
('Nissan Kicks', 'SPQ-5I51', '94DFCAP15RB180533', '1414398724', 'S/A', true)
ON CONFLICT (placa) DO NOTHING;
`;
