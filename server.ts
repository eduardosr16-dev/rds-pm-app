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

// Use the Supabase database URL from environment or the VITE_SUPABASE_URL
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseProjectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const dbUrl = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || 'postgres'}@db.${supabaseProjectRef}.supabase.co:5432/postgres`;

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

app.post('/api/primeiro-acesso', async (req, res) => {
  const { rg_pm, password } = req.body;

  if (!rg_pm || !password) {
    return res.status(400).json({
      success: false,
      message: 'RG PM e senha obrigatórios.',
    });
  }

  const cleanRg = rg_pm.replace(/\D/g, '');

  // Check if the database URL is configured
  if (!dbUrl || dbUrl.includes('undefined')) {
    return res.status(500).json({
      success: false,
      message: 'Database connection not configured. Please set DATABASE_URL or Supabase environment variables.',
    });
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Check if usuarios table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'usuarios'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      await client.end();
      return res.status(500).json({
        success: false,
        message: 'Tabela usuarios não existe no banco de dados. Execute as migrations primeiro.',
      });
    }

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
        message: 'RG PM não encontrado na tabela usuarios. Verifique se o militar está cadastrado.',
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
      posto: dados.posto || dados.graduacao,
      nome: dados.nome,
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