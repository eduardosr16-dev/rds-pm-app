/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const connectionString =
  'postgresql://postgres:136694@db.svvxthekfgsjvwskipmc.supabase.co:5432/postgres';

const dbUrl = process.env.SUPABASE_DB_URL || connectionString;

app.get('/api/db-bootstrap-status', async (req, res) => {
  try {
    const client = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'usuarios'
      );
    `);

    await client.end();

    return res.json({
      configured: true,
      tableExists: result.rows[0].exists,
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: false,
      error: err.message,
    });
  }
});

app.post('/api/db-bootstrap-run', async (req, res) => {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Create table usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        rg_pm VARCHAR(20) UNIQUE NOT NULL,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        senha VARCHAR(100) DEFAULT '1234',
        primeiro_acesso BOOLEAN DEFAULT true
      );
    `);

    // Create table policiais
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.policiais (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        rg_pm VARCHAR(20) UNIQUE NOT NULL,
        nome VARCHAR(100) NOT NULL,
        senha VARCHAR(100) DEFAULT '1234',
        matricula VARCHAR(20),
        nome_completo VARCHAR(100),
        graduacao VARCHAR(30)
      );
    `);

    // Create table relatorios
    await client.query(`
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
    `);

    // Feed initial officers so they exist on DB
    const listOfficers = [
      { rg: '882437', nome: 'CAP PM JEORGE AUGUSTO FERNANDES DE JESUS' },
      { rg: '880279', nome: '2º TEN PM FRANCKCINEY CANAVARROS MAGALHÃES' },
      { rg: '881504', nome: '2º TEN PM WELLINGTON ALVES DA SILVA' },
      { rg: '880492', nome: '1º SGT PM JUSCELINO FERREIRA DA LUZ' },
      { rg: '883694', nome: '2º SGT PM EDUARDO SILVA RODRIGUES' },
      { rg: '885109', nome: '2º SGT PM ALLAN M. OLIVEIRA BOSAIPO' },
      { rg: '886302', nome: '2º SGT PM TIAGO RODRIGUES ALVES' },
      { rg: '887198', nome: '2º SGT PM DOUGLAS SOUZA PORTO' },
      { rg: '884122', nome: '3º SGT PM GLAUKO A. S. RODRIGUES DE LIMA' },
      { rg: '885136', nome: '3º SGT PM LEANDRO DE JESUS SOUZA' },
      { rg: '885117', nome: '3º SGT PM DIEGO A. DE SOUSA BOHRER' },
      { rg: '885982', nome: 'CB PM MATEUS FETTER' },
      { rg: '885918', nome: 'CB PM MARCELO DIAS BATISTA' },
      { rg: '886045', nome: 'CB PM RHANGEL NUNES RAMOS' },
      { rg: '886245', nome: 'CB PM KEVEN ALLEF FERREIRA DA COSTA' },
      { rg: '886343', nome: 'CB PM JOSEAN EVARISTO DA SILVA' },
      { rg: '886469', nome: 'CB PM RENAN FRANCISCO GOMES' },
      { rg: '886451', nome: 'CB PM ILDEONES SILVA DA LUZ' },
      { rg: '886462', nome: 'CB PM MARCOS SILVA OLIVEIRA' },
      { rg: '886594', nome: 'CB PM THIAGO MARTINS DA SILVA' },
      { rg: '887688', nome: 'CB PM VENILSON SOUZA MATOS' },
      { rg: '886471', nome: 'SD PM THIAGO FAUSTINO DE OLIVEIRA' },
      { rg: '888550', nome: 'SD PM FRANCISCO ANTONIO DA SILVA FILHO' }
    ];

    for (const off of listOfficers) {
      await client.query(`
        INSERT INTO public.usuarios (rg_pm, nome, email, senha, primeiro_acesso)
        VALUES ($1, $2, $3, '1234', true)
        ON CONFLICT (rg_pm) DO NOTHING;
      `, [off.rg, off.nome, `\${off.rg}@pm.mt.gov.br`]);

      // Parse rank (graduação) and clean name for form autocomplete mapping
      let graduacao = 'SD PM';
      let nomeCompleto = off.nome;

      if (off.nome.startsWith('CAP PM')) {
        graduacao = 'CAP PM';
        nomeCompleto = off.nome.replace('CAP PM ', '');
      } else if (off.nome.startsWith('2º TEN PM')) {
        graduacao = '2º TEN PM';
        nomeCompleto = off.nome.replace('2º TEN PM ', '');
      } else if (off.nome.startsWith('1º SGT PM')) {
        graduacao = '1º SGT PM';
        nomeCompleto = off.nome.replace('1º SGT PM ', '');
      } else if (off.nome.startsWith('2º SGT PM')) {
        graduacao = '2º SGT PM';
        nomeCompleto = off.nome.replace('2º SGT PM ', '');
      } else if (off.nome.startsWith('3º SGT PM')) {
        graduacao = '3º SGT PM';
        nomeCompleto = off.nome.replace('3º SGT PM ', '');
      } else if (off.nome.startsWith('CB PM')) {
        graduacao = 'CB PM';
        nomeCompleto = off.nome.replace('CB PM ', '');
      } else if (off.nome.startsWith('SD PM')) {
        graduacao = 'SD PM';
        nomeCompleto = off.nome.replace('SD PM ', '');
      }

      const matriculaMapped = off.rg.slice(0, 3) + '.' + off.rg.slice(3);

      await client.query(`
        INSERT INTO public.policiais (rg_pm, nome, senha, matricula, nome_completo, graduacao)
        VALUES ($1, $2, '1234', $3, $4, $5)
        ON CONFLICT (rg_pm) DO NOTHING;
      `, [off.rg, off.nome, matriculaMapped, nomeCompleto, graduacao]);
    }

    // Create public.viaturas table
    await client.query(`
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
    `);

    // Enable RLS and add basic security policies on public.viaturas if direct permissions are needed
    await client.query(`
      ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;
    `).catch(() => {});
    await client.query(`
      CREATE POLICY "Controle livre viaturas" ON public.viaturas FOR ALL TO public USING (true) WITH CHECK (true);
    `).catch(() => {});

    // Create public.abastecimentos_viaturas table
    await client.query(`
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
    `);

    // Enable RLS and policies
    await client.query(`
      ALTER TABLE public.abastecimentos_viaturas ENABLE ROW LEVEL SECURITY;
    `).catch(() => {});
    await client.query(`
      CREATE POLICY "Controle livre abastecimentos" ON public.abastecimentos_viaturas FOR ALL TO public USING (true) WITH CHECK (true);
    `).catch(() => {});

    // Seed standard initial viaturas
    const initialViaturas = [
      {
        modelo: "Triton L200",
        placa: "SPY-7D90",
        chassi: "93XDLLC2TTCS07563",
        renavam: "1455673401",
        obs: "BAIXADA DIA 23/04 NA OFICINA DALMOCAR EM QUERÊNCIA"
      },
      {
        modelo: "Triton L200",
        placa: "RRX3B80",
        chassi: "93XLJKL1TRCP74674",
        renavam: "1360696986",
        obs: "S/A"
      },
      {
        modelo: "Renault Duster",
        placa: "SPU-1C95",
        chassi: "93YHJD20XSJ146780",
        renavam: "1421440196",
        obs: "S/A"
      },
      {
        modelo: "Nissan Kicks",
        placa: "SPQ-5I51",
        chassi: "94DFCAP15RB180533",
        renavam: "1414398724",
        obs: "S/A"
      }
    ];

    for (const v of initialViaturas) {
      await client.query(`
        INSERT INTO public.viaturas (modelo, placa, chassi, renavam, observacao_operacional, ativo)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (placa) DO NOTHING;
      `, [v.modelo, v.placa, v.chassi, v.renavam, v.obs]);
    }

    await client.end();
    return res.json({ success: true, message: 'Database bootstrapped successfully!' });
  } catch (err: any) {
    console.error('[BOOTSTRAP] Error:', err);
    try {
      await client.end();
    } catch {}
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/primeiro-acesso', async (req, res) => {
  const { rg_pm, password } = req.body;

  if (!rg_pm || !password) {
    return res.status(400).json({
      success: false,
      message: 'RG PM e senha obrigatórios.',
    });
  }

  const cleanRg = rg_pm.replace(/\D/g, '');

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const usuario = await client.query(
      `
      SELECT *
      FROM public.usuarios
      WHERE rg_pm = $1
      `,
      [cleanRg]
    );

    if (usuario.rowCount === 0) {
      await client.end();

      return res.status(404).json({
        success: false,
        message: 'RG PM não encontrado.',
      });
    }

    const dados = usuario.rows[0];

    const email = dados.email;

    const authUser = await client.query(
      `
      SELECT id
      FROM auth.users
      WHERE email = $1
      `,
      [email]
    );

    let userId;

    if (authUser.rowCount > 0) {
      userId = authUser.rows[0].id;

      await client.query(
        `
        UPDATE auth.users
        SET
          encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = NOW(),
          confirmed_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        `,
        [password, userId]
      );
    } else {
      const newUser = await client.query(
        `
        INSERT INTO auth.users (
          id,
          instance_id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          confirmed_at,
          created_at,
          updated_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          is_sso_user
        )
        VALUES (
          gen_random_uuid(),
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          $1,
          crypt($2, gen_salt('bf')),
          NOW(),
          NOW(),
          NOW(),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          '{}',
          false,
          false
        )
        RETURNING id
        `,
        [email, password]
      );

      userId = newUser.rows[0].id;

      await client.query(
        `
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          jsonb_build_object(
            'sub', $1,
            'email', $2
          ),
          'email',
          $2,
          NOW(),
          NOW()
        )
        `,
        [userId, email]
      );
    }

    await client.query(
      `
      UPDATE public.usuarios
      SET primeiro_acesso = false
      WHERE rg_pm = $1
      `,
      [cleanRg]
    );

    await client.end();

    return res.json({
      success: true,
      email,
    });
  } catch (err: any) {
    console.error(err);

    try {
      await client.end();
    } catch {}

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor RDS-PM rodando na porta ${PORT}`);
  });
}

startServer();