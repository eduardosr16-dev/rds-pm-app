/*
  # Enhance Atividade Delegada and Jornada Extraordinaria with Comandante, Motorista, Patrulheiros

  1. New Tables
    - `patrulheiros_atividade` - Patrol officers for delegated activities
    - `patrulheiros_jornada` - Patrol officers for extraordinary shifts

  2. Modified Tables
    - `atividades_delegadas` - Add motorista, remove manual policiais text
    - `jornadas_extraordinarias` - Add motorista, remove manual policiais text

  3. Seeded Data
    - Add default PMMT vehicles: KICKS, DUSTER, TRITON, TRITON RURAL
*/

-- Add columns to atividades_delegadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atividades_delegadas' AND column_name = 'comandante_matricula'
  ) THEN
    ALTER TABLE public.atividades_delegadas ADD COLUMN comandante_matricula VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atividades_delegadas' AND column_name = 'motorista_matricula'
  ) THEN
    ALTER TABLE public.atividades_delegadas ADD COLUMN motorista_matricula VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atividades_delegadas' AND column_name = 'viatura_prefixo'
  ) THEN
    ALTER TABLE public.atividades_delegadas ADD COLUMN viatura_prefixo VARCHAR(50);
  END IF;
END $$;

-- Add columns to jornadas_extraordinarias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jornadas_extraordinarias' AND column_name = 'comandante_matricula'
  ) THEN
    ALTER TABLE public.jornadas_extraordinarias ADD COLUMN comandante_matricula VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jornadas_extraordinarias' AND column_name = 'motorista_matricula'
  ) THEN
    ALTER TABLE public.jornadas_extraordinarias ADD COLUMN motorista_matricula VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jornadas_extraordinarias' AND column_name = 'viatura_prefixo'
  ) THEN
    ALTER TABLE public.jornadas_extraordinarias ADD COLUMN viatura_prefixo VARCHAR(50);
  END IF;
END $$;

-- Create patrulheiros_atividade table
CREATE TABLE IF NOT EXISTS public.patrulheiros_atividade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID REFERENCES public.atividades_delegadas(id) ON DELETE CASCADE NOT NULL,
  policial_matricula VARCHAR(50) REFERENCES public.policiais(matricula) ON DELETE CASCADE NOT NULL,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patrulheiros_atividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral patrulheiros_atividade" ON public.patrulheiros_atividade FOR SELECT USING (true);
CREATE POLICY "Escrita geral patrulheiros_atividade" ON public.patrulheiros_atividade FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral patrulheiros_atividade" ON public.patrulheiros_atividade FOR UPDATE USING (true);
CREATE POLICY "Remocao geral patrulheiros_atividade" ON public.patrulheiros_atividade FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_patrulheiros_atividade_id ON public.patrulheiros_atividade(atividade_id);

-- Create patrulheiros_jornada table
CREATE TABLE IF NOT EXISTS public.patrulheiros_jornada (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jornada_id UUID REFERENCES public.jornadas_extraordinarias(id) ON DELETE CASCADE NOT NULL,
  policial_matricula VARCHAR(50) REFERENCES public.policiais(matricula) ON DELETE CASCADE NOT NULL,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.patrulheiros_jornada ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso geral patrulheiros_jornada" ON public.patrulheiros_jornada FOR SELECT USING (true);
CREATE POLICY "Escrita geral patrulheiros_jornada" ON public.patrulheiros_jornada FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização geral patrulheiros_jornada" ON public.patrulheiros_jornada FOR UPDATE USING (true);
CREATE POLICY "Remocao geral patrulheiros_jornada" ON public.patrulheiros_jornada FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_patrulheiros_jornada_id ON public.patrulheiros_jornada(jornada_id);

-- Enhance viaturas table for better KM tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'viaturas' AND column_name = 'km_abastecimento'
  ) THEN
    ALTER TABLE public.viaturas ADD COLUMN km_abastecimento INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'viaturas' AND column_name = 'litros_abastecidos'
  ) THEN
    ALTER TABLE public.viaturas ADD COLUMN litros_abastecidos NUMERIC DEFAULT 0.0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'viaturas' AND column_name = 'valor_abastecimento'
  ) THEN
    ALTER TABLE public.viaturas ADD COLUMN valor_abastecimento NUMERIC DEFAULT 0.0;
  END IF;
END $$;

-- Enhance ocorrencias for auto-productivity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'tipo_registro'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN tipo_registro VARCHAR(50) DEFAULT 'BO';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'armas_apreendidas'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN armas_apreendidas INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'municoes_apreendidas'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN municoes_apreendidas INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'drogas_peso_gramas'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN drogas_peso_gramas NUMERIC DEFAULT 0.0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'valores_apreendidos'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN valores_apreendidos NUMERIC DEFAULT 0.0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'veiculos_recuperados'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN veiculos_recuperados INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'veiculos_apreendidos'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN veiculos_apreendidos INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'veiculos_notificados'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN veiculos_notificados INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'tco_registrados'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN tco_registrados INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocorrencias' AND column_name = 'prisao_flagrante'
  ) THEN
    ALTER TABLE public.ocorrencias ADD COLUMN prisao_flagrante INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create trigger function to auto-update productivity
CREATE OR REPLACE FUNCTION atualizar_produtividade_automatica()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update relatorio totals when ocorrencia is inserted/updated
  UPDATE public.relatorios SET
    armas_apreendidas = (
      SELECT COALESCE(SUM(armas_apreendidas), 0) FROM public.ocorrencias 
      WHERE relatorio_id = NEW.relatorio_id
    ),
    municoes = (
      SELECT COALESCE(SUM(municoes_apreendidas), 0) FROM public.ocorrencias 
      WHERE relatorio_id = NEW.relatorio_id
    ),
    drogas_peso = (
      SELECT COALESCE(SUM(drogas_peso_gramas), 0) FROM public.ocorrencias 
      WHERE relatorio_id = NEW.relatorio_id
    ),
    valores = (
      SELECT COALESCE(SUM(valores_apreendidos), 0) FROM public.ocorrencias 
      WHERE relatorio_id = NEW.relatorio_id
    )
  WHERE id = NEW.relatorio_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_produtividade_automatica ON public.ocorrencias;
CREATE TRIGGER trigger_produtividade_automatica
  AFTER INSERT OR UPDATE ON public.ocorrencias
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_produtividade_automatica();

-- Add default PMMT vehicles
INSERT INTO public.catalogo_viaturas (prefixo, modelo, placa) VALUES
('KICKS-001', 'Nissan Kicks', 'KCK-0001'),
('DUSTER-001', 'Renault Duster', 'DST-0001'),
('TRITON-001', 'Mitsubishi Triton', 'TRT-0001'),
('TRITON-RURAL-001', 'Mitsubishi Triton Rural', 'TRR-0001'),
('VTR-1901', 'Toyota Hilux', 'PM-0001'),
('VTR-1902', 'Toyota Hilux', 'PM-0002'),
('VTR-1903', 'Ford Ranger', 'PM-0003'),
('VTR-1904', 'Chevrolet S10', 'PM-0004')
ON CONFLICT (prefixo) DO NOTHING;