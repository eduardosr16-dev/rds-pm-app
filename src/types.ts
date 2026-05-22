/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Viatura {
  id?: string;
  prefixo: string; // Ex: VTR-1049
  modelo: string;  // Ex: Toyota Hilux
  placa?: string;
  km_inicial?: number;
  km_final?: number;
}

export interface OcorrenciaItem {
  id?: string;
  natureza_ocorrencia: string; // Ex: Roubo de veículo, Tráfico de drogas
  ocorrencia_bo?: string;      // Nº do Boletim de Ocorrência
  suspeitos_conduzidos?: number;
  observacoes: string;         // Descrição detalhada do fato relatado
  local_fato?: string;         // Bairro ou endereço do fato
}

export interface AnexoItem {
  id?: string;
  nome_arquivo: string;
  url_arquivo: string; // Base64 data ou link fictício
  tipo: 'imagem' | 'pdf' | 'outro';
}

export interface GuarnicaoItem {
  id?: string;
  nome_guarnicao: string;
  tipo_guarnicao: 'Rádio Patrulha' | 'Força Tática' | 'Patrulhamento Rural' | 'CPU' | 'Maria da Penha' | 'Outro';
  viatura: string;
  policiais_integrantes: string;
  comandante_guarnicao: string;
  horario_inicial: string;
  horario_final: string;
}

export interface AtividadeDelegadaItem {
  id?: string;
  nome_equipe: string;
  viatura: string;
  policiais: string;
  local_operacao: string;
  horario: string;
  observacoes?: string;
}

export interface JornadaExtraordinariaItem {
  id?: string;
  nome_equipe: string;
  viatura: string;
  policiais: string;
  tipo_reforco: string;
  horario: string;
  observacoes?: string;
}

export interface PoliceReport {
  id: string;
  created_at: string;
  user_id?: string;
  user_email?: string;
  
  // Identificação do Serviço
  operacao: string;                  // Nome da Operação (Ex: Saturação)
  turno: string;                     // Turno de escala (Noturno, Vespertino, etc)
  horario_servico: string;           // Horário de Serviço (Ex: 07:00 às 19:00)
  cidade: string;                    // Cidade do policiamento (Ex: Cuiabá)
  comandante_responsavel: string;    // Nome do Oficial/Sargento Comandante
  comandante_recebe?: string;        // Nome post/graduação e RG do Comandante que recebe

  // Efetivo e Viaturas Gerais
  efetivo: number;
  viaturas: number;

  // Produtividade Integrada
  armas_apreendidas: number;
  armas_detalhes?: string;
  municoes: number;
  municoes_detalhes?: string;
  drogas_peso: number;               // Peso em gramas
  drogas_detalhes?: string;
  valores: number;                   // Dinheiro em espécie (R$)
  observacoes?: string;              // Observações gerais da seção

  // Relato de Ocorrências Principal (Backward compatibility)
  ocorrencias: string;               

  // Relacionados (Enriquecimento da estrutura no Supabase)
  lista_viaturas?: Viatura[];
  lista_ocorrencias?: OcorrenciaItem[];
  lista_anexos?: AnexoItem[];
  lista_guarnicoes?: GuarnicaoItem[];
  lista_atividades_delegadas?: AtividadeDelegadaItem[];
  lista_jornadas_extraordinarias?: JornadaExtraordinariaItem[];
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  role?: string;
  matricula?: string;
  pelotao?: string;
  cidade?: string;
  isDemo: boolean;
}
