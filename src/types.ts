/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Viatura {
  id?: number | string;
  modelo: string;
  placa: string;
  chassi?: string;
  renavam?: string;
  observacao_operacional?: string;
  ativo?: boolean;
  km_abastecimento?: number;
  litros?: number;
  saldo?: number;
  valor_abastecido?: number;
}

export interface OcorrenciaItem {
  id?: string;
  tipo: 'BO' | 'TCO';
  
  // Commons
  natureza_ocorrencia: string; // Natureza selecionada
  natureza_outro?: string;      // Caso selecionado "Outro", o texto inserido
  rua_avenida: string;          // Rua ou Avenida
  bairro: string;              // Bairro
  cidade: string;              // Cidade do fato
  data: string;                // Data do fato
  hora: string;                // Hora do fato
  objetos_apreendidos?: string; // Objetos apreendidos
  observacoes: string;         // Relato completo (BO) ou relato resumido (TCO)

  // BO Specific
  guarnicao_responsavel?: string; // Guarnição responsável
  viatura_id_placa?: string;      // Viatura associada (ID / Placa)
  qtd_envolvidos?: number;        // Quantidade de envolvidos
  drogas_apreendidas?: string;    // Drogas apreendidas
  armas_apreendidas_texto?: string; // Armas apreendidas
  observacoes_finais?: string;    // Observações finais do BO

  // TCO Specific
  autor_fato?: string;            // Autor do fato (TCO)
  vitima?: string;                // Vítima (TCO)

  // Backward compatibility fields
  ocorrencia_bo?: string;         // BO Nº ou similar
  suspeitos_conduzidos?: number;  // Compatibilidade com listagem antiga
  local_fato?: string;            // Compatibilidade com visualizador antigo
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

  // --- NOVOS CAMPOS OPERACIONAIS RDS-PM ---
  pessoas_abordadas?: number;
  carros_abordados?: number;
  motos_abordadas?: number;
  pessoas_checadas?: number;
  carros_checados?: number;
  motos_checadas?: number;
  lista_pessoas_checadas_texto?: string;
  tco_registrados?: number;
  prisoes_flagrante?: number;
  pessoas_conduzidas_depol?: number;
  veiculos_apreendidos?: number;
  arma_branca_apreendida?: number;
  num_autos_remocao?: number;
  veiculos_notificados?: number;
  veiculos_recuperados?: number;
  diversos_apreendidos?: string;
  barreiras_policiais?: number;
  patrulhamento_rural?: number;
  pontos_demonstrativos?: number;
  rondas_comerciais?: number;

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
