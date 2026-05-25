/*
  # Base Schema for RDS-PM System

  1. New Tables
    - `policiais` - Police officers database
    - `relatorios` - Daily service reports
    - `guarnicoes` - Service teams/garrisons
    - `integrantes_guarnicao` - Many-to-many relationship between guarnicoes and policiais
    - `viaturas` - Vehicles assigned to reports
    - `atividades_delegadas` - Delegated activities
    - `jornadas_extraordinarias` - Extraordinary shifts
    - `ocorrencias` - Incident reports
    - `anexos` - Attachments
    - `usuarios` - User credentials
    - `usuarios_pm` - Legacy user table

  2. Security
    - Enable RLS on all tables
    - Initially permissive policies (to be tightened later)
*/

-- 1. TABELA DE POLICIAIS
CREATE TABLE IF NOT EXISTS public.policiais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  graduacao VARCHAR(50) NOT NULL,
  pelotao VARCHAR(100),
  cidade VARCHAR(100) NOT NULL DEFAULT 'Cuiabá',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.policiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral policiais" ON public.policiais FOR SELECT USING (true);
CREATE POLICY "Escrita geral policiais" ON public.policiais FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral policiais" ON public.policiais FOR UPDATE USING (true);
CREATE POLICY "Remocao geral policiais" ON public.policiais FOR DELETE USING (true);

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

-- 2. TABELA DE RELATÓRIOS
CREATE TABLE IF NOT EXISTS public.relatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID DEFAULT NULL,
  user_email VARCHAR(255),
  operacao VARCHAR(255) NOT NULL,
  turno VARCHAR(50) NOT NULL,
  horario_servico VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL DEFAULT 'Cuiabá',
  comandante_responsavel VARCHAR(255) NOT NULL,
  comandante_recebe VARCHAR(255),
  efetivo INTEGER NOT NULL DEFAULT 1,
  viaturas INTEGER NOT NULL DEFAULT 1,
  armas_apreendidas INTEGER NOT NULL DEFAULT 0,
  armas_detalhes TEXT,
  municoes INTEGER NOT NULL DEFAULT 0,
  municoes_detalhes TEXT,
  drogas_peso NUMERIC NOT NULL DEFAULT 0.0,
  drogas_detalhes TEXT,
  valores NUMERIC NOT NULL DEFAULT 0.0,
  observacoes TEXT,
  ocorrencias TEXT NOT NULL
);

ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral relatorios" ON public.relatorios FOR SELECT USING (true);
CREATE POLICY "Escrita geral relatorios" ON public.relatorios FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral relatorios" ON public.relatorios FOR UPDATE USING (true);
CREATE POLICY "Remocao geral relatorios" ON public.relatorios FOR DELETE USING (true);

-- 3. TABELA DE GUARNIÇÕES
CREATE TABLE IF NOT EXISTS public.guarnicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  nome_guarnicao VARCHAR(150) NOT NULL,
  tipo_guarnicao VARCHAR(100) NOT NULL,
  viatura VARCHAR(100) NOT NULL,
  comandante_guarnicao VARCHAR(255) NOT NULL,
  policiais_integrantes TEXT NOT NULL,
  horario_inicial VARCHAR(50) NOT NULL,
  horario_final VARCHAR(50) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guarnicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral guarnicoes" ON public.guarnicoes FOR SELECT USING (true);
CREATE POLICY "Escrita geral guarnicoes" ON public.guarnicoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral guarnicoes" ON public.guarnicoes FOR UPDATE USING (true);
CREATE POLICY "Remocao geral guarnicoes" ON public.guarnicoes FOR DELETE USING (true);

-- 4. TABELA DE INTEGRANTES DE GUARNIÇÃO
CREATE TABLE IF NOT EXISTS public.integrantes_guarnicao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guarnicao_id UUID REFERENCES public.guarnicoes(id) ON DELETE CASCADE NOT NULL,
  policial_matricula VARCHAR(50) REFERENCES public.policiais(matricula) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.integrantes_guarnicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral integrantes" ON public.integrantes_guarnicao FOR SELECT USING (true);
CREATE POLICY "Escrita geral integrantes" ON public.integrantes_guarnicao FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral integrantes" ON public.integrantes_guarnicao FOR UPDATE USING (true);
CREATE POLICY "Remocao geral integrantes" ON public.integrantes_guarnicao FOR DELETE USING (true);

-- 5. TABELA DE VIATURAS
CREATE TABLE IF NOT EXISTS public.viaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  prefixo VARCHAR(50) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  placa VARCHAR(20),
  km_inicial INTEGER,
  km_final INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral viaturas" ON public.viaturas FOR SELECT USING (true);
CREATE POLICY "Escrita geral viaturas" ON public.viaturas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral viaturas" ON public.viaturas FOR UPDATE USING (true);
CREATE POLICY "Remocao geral viaturas" ON public.viaturas FOR DELETE USING (true);

-- 6. TABELA DE ATIVIDADES DELEGADAS
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
CREATE POLICY "Acesso geral atividades" ON public.atividades_delegadas FOR SELECT USING (true);
CREATE POLICY "Escrita geral atividades" ON public.atividades_delegadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral atividades" ON public.atividades_delegadas FOR UPDATE USING (true);
CREATE POLICY "Remocao geral atividades" ON public.atividades_delegadas FOR DELETE USING (true);

-- 7. TABELA DE JORNADAS EXTRAORDINÁRIAS
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
CREATE POLICY "Acesso geral jornadas" ON public.jornadas_extraordinarias FOR SELECT USING (true);
CREATE POLICY "Escrita geral jornadas" ON public.jornadas_extraordinarias FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral jornadas" ON public.jornadas_extraordinarias FOR UPDATE USING (true);
CREATE POLICY "Remocao geral jornadas" ON public.jornadas_extraordinarias FOR DELETE USING (true);

-- 8. TABELA DE OCORRÊNCIAS
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  natureza_ocorrencia VARCHAR(150) NOT NULL,
  ocorrencia_bo VARCHAR(50),
  suspeitos_conduzidos INTEGER DEFAULT 0,
  observacoes TEXT NOT NULL,
  local_fato VARCHAR(255),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral ocorrencias" ON public.ocorrencias FOR SELECT USING (true);
CREATE POLICY "Escrita geral ocorrencias" ON public.ocorrencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral ocorrencias" ON public.ocorrencias FOR UPDATE USING (true);
CREATE POLICY "Remocao geral ocorrencias" ON public.ocorrencias FOR DELETE USING (true);

-- 9. TABELA DE ANEXOS
CREATE TABLE IF NOT EXISTS public.anexos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'imagem',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral anexos" ON public.anexos FOR SELECT USING (true);
CREATE POLICY "Escrita geral anexos" ON public.anexos FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral anexos" ON public.anexos FOR UPDATE USING (true);
CREATE POLICY "Remocao geral anexos" ON public.anexos FOR DELETE USING (true);

-- 10. TABELA DE USUÁRIOS (SISTEMA DE PRIMEIRO ACESSO)
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
CREATE POLICY "Acesso geral usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Escrita geral usuarios" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral usuarios" ON public.usuarios FOR UPDATE USING (true);
CREATE POLICY "Remocao geral usuarios" ON public.usuarios FOR DELETE USING (true);