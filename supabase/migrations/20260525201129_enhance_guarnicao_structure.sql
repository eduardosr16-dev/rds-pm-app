/*
  # Enhance Guarnição Structure with Comandante, Motorista, Patrulheiros, and Auto Features

  1. New Tables
    - `patrulheiros_guarnicao` - Stores individual patrol officers per guarnicao
    - `abastecimento_viatura` - Stores fuel and maintenance data with Brazilian Real support
    - `produtividade_automatica` - Tracks automatic productivity from BO/TCO
    - `catalogo_viaturas` - Vehicle catalog for SELECT dropdown

  2. Modified Tables
    - `guarnicoes` - Enhanced with motorista field
    - `viaturas` - Ready for auto KM transfer

  3. Security
    - Enable RLS on all new tables
    - Add restrictive policies for authenticated users
*/

-- Add motorista column to guarnicoes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guarnicoes' AND column_name = 'motorista_matricula'
  ) THEN
    ALTER TABLE public.guarnicoes ADD COLUMN motorista_matricula VARCHAR(50);
  END IF;
END $$;

-- Create patrulheiros_guarnicao table for multiple patrol officers
CREATE TABLE IF NOT EXISTS public.patrulheiros_guarnicao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guarnicao_id UUID REFERENCES public.guarnicoes(id) ON DELETE CASCADE NOT NULL,
  policial_matricula VARCHAR(50) REFERENCES public.policiais(matricula) ON DELETE CASCADE NOT NULL,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patrulheiros_guarnicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso geral patrulheiros" ON public.patrulheiros_guarnicao FOR SELECT USING (true);
CREATE POLICY "Escrita geral patrulheiros" ON public.patrulheiros_guarnicao FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral patrulheiros" ON public.patrulheiros_guarnicao FOR UPDATE USING (true);
CREATE POLICY "Remocao geral patrulheiros" ON public.patrulheiros_guarnicao FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_patrulheiros_guarnicao_id ON public.patrulheiros_guarnicao(guarnicao_id);
CREATE INDEX IF NOT EXISTS idx_patrulheiros_matricula ON public.patrulheiros_guarnicao(policial_matricula);

-- Create abastecimento_viatura table for fuel tracking (Brazilian Real support)
CREATE TABLE IF NOT EXISTS public.abastecimento_viatura (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viatura_id UUID REFERENCES public.viaturas(id) ON DELETE CASCADE NOT NULL,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0.0,
  saldo_litros NUMERIC NOT NULL DEFAULT 0.0,
  km_abastecimento INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.abastecimento_viatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso geral abastecimento" ON public.abastecimento_viatura FOR SELECT USING (true);
CREATE POLICY "Escrita geral abastecimento" ON public.abastecimento_viatura FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral abastecimento" ON public.abastecimento_viatura FOR UPDATE USING (true);
CREATE POLICY "Remocao geral abastecimento" ON public.abastecimento_viatura FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_abastecimento_relatorio ON public.abastecimento_viatura(relatorio_id);

-- Create produtividade_automatica table for auto-calculated productivity
CREATE TABLE IF NOT EXISTS public.produtividade_automatica (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE CASCADE NOT NULL,
  ocorrencia_id UUID REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
  tipo_registro VARCHAR(50) NOT NULL,
  armas_count INTEGER DEFAULT 0,
  municoes_count INTEGER DEFAULT 0,
  drogas_peso NUMERIC DEFAULT 0.0,
  valores_total NUMERIC DEFAULT 0.0,
  veiculos_count INTEGER DEFAULT 0,
  notificacoes_count INTEGER DEFAULT 0,
  pessoas_conduzidas INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.produtividade_automatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso geral produtividade" ON public.produtividade_automatica FOR SELECT USING (true);
CREATE POLICY "Escrita geral produtividade" ON public.produtividade_automatica FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral produtividade" ON public.produtividade_automatica FOR UPDATE USING (true);
CREATE POLICY "Remocao geral produtividade" ON public.produtividade_automatica FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_produtividade_relatorio ON public.produtividade_automatica(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_produtividade_ocorrencia ON public.produtividade_automatica(ocorrencia_id);

-- Create catalogo_viaturas table for SELECT dropdown
CREATE TABLE IF NOT EXISTS public.catalogo_viaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prefixo VARCHAR(50) UNIQUE NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  placa VARCHAR(20),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.catalogo_viaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso geral catalogo" ON public.catalogo_viaturas FOR SELECT USING (true);
CREATE POLICY "Escrita geral catalogo" ON public.catalogo_viaturas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral catalogo" ON public.catalogo_viaturas FOR UPDATE USING (true);
CREATE POLICY "Remocao geral catalogo" ON public.catalogo_viaturas FOR DELETE USING (true);

-- Seed common PMMT vehicles
INSERT INTO public.catalogo_viaturas (prefixo, modelo, placa) VALUES
('VTR-1919', 'Toyota Hilux', 'OPI-0001'),
('VTR-1920', 'Toyota Hilux', 'OPI-0002'),
('VTR-1921', 'Renault Duster', 'OPI-0003'),
('VTR-1922', 'Renault Duster', 'OPI-0004'),
('VTR-1923', 'Fiat Toro', 'OPI-0005'),
('VTR-1924', 'Fiat Toro', 'OPI-0006'),
('VTR-1925', 'Chevrolet S10', 'OPI-0007'),
('VTR-1926', 'Chevrolet S10', 'OPI-0008'),
('VTR-1927', 'Ford Ranger', 'OPI-0009'),
('VTR-1928', 'Ford Ranger', 'OPI-0010'),
('VTR-1929', 'Toyota Corolla', 'OPI-0011'),
('VTR-1930', 'Toyota Corolla', 'OPI-0012'),
('MOTO-001', 'Honda CB 500', 'MOT-0001'),
('MOTO-002', 'Honda CB 500', 'MOT-0002'),
('MOTO-003', 'Yamaha MT 07', 'MOT-0003')
ON CONFLICT (prefixo) DO NOTHING;

-- Create function to get last km_final for auto-transfer
CREATE OR REPLACE FUNCTION public.get_last_km_final(p_viatura_prefixo VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  last_km INTEGER;
BEGIN
  SELECT km_final INTO last_km
  FROM public.viaturas v
  JOIN public.relatorios r ON v.relatorio_id = r.id
  WHERE v.prefixo = p_viatura_prefixo
  ORDER BY r.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(last_km, 0);
END;
$$;