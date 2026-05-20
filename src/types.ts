/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PoliceReport {
  id: string;
  created_at: string;
  user_id?: string;
  user_email?: string;
  operacao: string;         // Nome da Operação (Ex: Saturação, Comando de Trânsito, etc.)
  turno: string;            // Turno de serviço (Matutino, Vespertino, Noturno, etc.)
  efetivo: number;          // Quantidade de policiais em serviço
  viaturas: number;         // Número de viaturas empenhadas
  armas_apreendidas: number; // Quantidade de armas de fogo apreendidas
  armas_detalhes?: string;  // Tipos e calibres das armas
  municoes: number;         // Quantidade de munições confiscadas
  municoes_detalhes?: string;// Calibres das munições
  drogas_peso: number;      // Quantidade de drogas em gramas (peso aproximado)
  drogas_detalhes?: string; // Descrição das drogas (Maconha, Cocaína, Crack, etc.)
  valores: number;          // Dinheiro ou valores apreendidos/recuperados (R$)
  ocorrencias: string;      // Histórico / Resumo detalhado das ocorrências atendidas
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isDemo: boolean;
}
