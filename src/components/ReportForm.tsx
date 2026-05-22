/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PoliceReport, 
  Viatura, 
  OcorrenciaItem, 
  AnexoItem, 
  UserSession,
  GuarnicaoItem,
  AtividadeDelegadaItem,
  JornadaExtraordinariaItem
} from '../types';
import { 
  LISTA_POLICIAIS_PMMT, 
  OBTER_PESO_PATENTE, 
  OBTER_NOME_GUERRA_OU_ABREVIADO, 
  PolicialPMMT 
} from '../data/policiais';
import { 
  ShieldAlert, 
  Calendar, 
  Users, 
  Car, 
  Flame, 
  CircleAlert, 
  DollarSign, 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  Compass, 
  AlertTriangle,
  Trash2,
  Paperclip,
  FileSpreadsheet,
  FileCheck2,
  FileImage,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  X
} from 'lucide-react';

interface ReportFormProps {
  onSubmit: (report: Omit<PoliceReport, 'id' | 'created_at'>) => Promise<boolean>;
  currentUserSession: UserSession;
}

const SHIFT_OPTIONS = [
  '1º Turno (Diurno)',
  '2º Turno (Noturno)',
];

const CITITES_OPTIONS = [
  'Cuiabá',
  'Várzea Grande',
  'Rondonópolis',
  'Sinop',
  'Tangará da Serra',
  'Cáceres',
  'Sorriso',
  'Lucas do Rio Verde',
  'Primavera do Leste',
  'Barra do Garças',
];

const SERVICE_HOURS_OPTIONS = [
  '07:00 às 19:00',
  '19:00 às 07:00',
  '18:00 às 06:00',
  '06:00 às 18:00',
  '08:00 às 14:00',
  '08:00 às 18:00',
];

const POPULAR_OPERATIONS = [
  'Operação Saturação Metropolitana',
  'Operação Lei Seca Integrada',
  'Operação Comércio Seguro',
  'Operação Dispersão / Tolerância Zero',
  'Patrulhamento Tático Motorizado (Força Tática / BOPE)',
  'Operação Divisões Integradas / Fronteira',
  'Policiamento Escolar / Comunitário',
  'Operação Bloqueio de Vias Públicas',
];

const POPULAR_NATURES = [
  'Tráfico de Entorpecentes',
  'Porte Ilegal de Arma de Fogo',
  'Furto / Roubo de Veículo',
  'Roubo a Estabelecimento Comercial',
  'Violência Doméstica (Lei Maria da Penha)',
  'Homicídio tentado / consumado',
  'Apreensão de Foragido da Justiça',
  'Lesão Corporal / Vias de Fato',
];

export default function ReportForm({ onSubmit, currentUserSession }: ReportFormProps) {
  // Main Report General States
  const [operacao, setOperacao] = useState('');
  const [turno, setTurno] = useState(SHIFT_OPTIONS[0]);
  const [horarioServico, setHorarioServico] = useState(SERVICE_HOURS_OPTIONS[1]);
  const [cidade, setCidade] = useState((currentUserSession && currentUserSession.cidade) || CITITES_OPTIONS[0]);
  const [comandanteResponsavel, setComandanteResponsavel] = useState(() => {
    const baseName = (currentUserSession && currentUserSession.name) || 'Sgt PM Sem Nome';
    const matricula = (currentUserSession && currentUserSession.matricula) || '';
    if (matricula && !baseName.includes('RG PM') && !baseName.includes(matricula)) {
      return `${baseName} - RG PM ${matricula}`;
    }
    return baseName;
  });
  const [passaSearchText, setPassaSearchText] = useState(() => {
    const baseName = (currentUserSession && currentUserSession.name) || 'Sgt PM Sem Nome';
    const matricula = (currentUserSession && currentUserSession.matricula) || '';
    if (matricula && !baseName.includes('RG PM') && !baseName.includes(matricula)) {
      return `${baseName} - RG PM ${matricula}`;
    }
    return baseName;
  });
  const [passaDropdownOpen, setPassaDropdownOpen] = useState(false);
  const [passaShowPMSelector, setPassaShowPMSelector] = useState(false);
  const [passaFilterRank, setPassaFilterRank] = useState('TODOS');
  const [efetivo, setEfetivo] = useState(2);
  const [viaturasCount, setViaturasCount] = useState(1);

  // Comandante que Recebe o Serviço Autocomplete State
  const [comandanteRecebe, setComandanteRecebe] = useState('');
  const [recebeSearchText, setRecebeSearchText] = useState('');
  const [recebeDropdownOpen, setRecebeDropdownOpen] = useState(false);
  const [recebeShowPMSelector, setRecebeShowPMSelector] = useState(false);
  const [recebeFilterRank, setRecebeFilterRank] = useState('TODOS');
  const [availablePoliciais, setAvailablePoliciais] = useState<PolicialPMMT[]>(LISTA_POLICIAIS_PMMT);

  // Fetch available police officers from Supabase
  useEffect(() => {
    const fetchPol = async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('../supabase');
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('policiais')
            .select('nome_completo, matricula, graduacao')
            .order('nome_completo', { ascending: true });
          if (data && data.length > 0) {
            const mapped: PolicialPMMT[] = data.map((d: any) => ({
              nome_completo: d.nome_completo,
              matricula: d.matricula,
              graduacao: d.graduacao
            }));
            setAvailablePoliciais(prev => {
              const combined = [...mapped, ...LISTA_POLICIAIS_PMMT];
              const unique = new Map<string, PolicialPMMT>();
              for (const p of combined) {
                if (p.matricula) {
                  unique.set(p.matricula, p);
                }
              }
              return Array.from(unique.values()).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
            });
          }
        }
      } catch (e) {
        console.error('Erro ao buscar policiais do Supabase:', e);
      }
    };
    fetchPol();
  }, []);

  // Consolidated seizure fields (cached sum)
  const [armas, setArmas] = useState(0);
  const [armasDetalhes, setArmasDetalhes] = useState('');
  const [municoes, setMunicoes] = useState(0);
  const [municoesDetalhes, setMunicoesDetalhes] = useState('');
  const [drogasPeso, setDrogasPeso] = useState(0);
  const [drogasDetalhes, setDrogasDetalhes] = useState('');
  const [valores, setValores] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [ocorrenciasConsolidadas, setOcorrenciasConsolidadas] = useState('');

  // 1. RELATIONAL CHILD TABLE: VIATURAS
  const [listaViaturas, setListaViaturas] = useState<Viatura[]>([
    { prefixo: 'VTR-1025', modelo: 'Toyota Hilux GLI', placa: 'OBO-4412', km_inicial: 98110, km_final: 98320 }
  ]);
  // Viatura Row Form Fields
  const [vtrPrefixo, setVtrPrefixo] = useState('');
  const [vtrModelo, setVtrModelo] = useState('');
  const [vtrPlaca, setVtrPlaca] = useState('');
  const [vtrKmInit, setVtrKmInit] = useState<number | undefined>(undefined);
  const [vtrKmFinal, setVtrKmFinal] = useState<number | undefined>(undefined);

  // 2. RELATIONAL CHILD TABLE: OCORRÊNCIAS
  const [listaOcorrencias, setListaOcorrencias] = useState<OcorrenciaItem[]>([
    { natureza_ocorrencia: 'Apreensão de Foragido da Justiça', ocorrencia_bo: 'BO-2026.11024', suspeitos_conduzidos: 1, observacoes: 'Suspeito com mandado em aberto localizado durante patrulhamento.', local_fato: 'Bairro CPA II, Cuiabá' }
  ]);
  // Ocorrência Row Form Fields
  const [ocoNatureza, setOcoNatureza] = useState(POPULAR_NATURES[0]);
  const [ocoBo, setOcoBo] = useState('');
  const [ocoSuspeitos, setOcoSuspeitos] = useState(0);
  const [ocoObs, setOcoObs] = useState('');
  const [ocoLocal, setOcoLocal] = useState('');

  // 3. RELATIONAL CHILD TABLE: ANEXOS
  const [listaAnexos, setListaAnexos] = useState<AnexoItem[]>([
    { nome_arquivo: 'foto_arma_apreendida.jpg', url_arquivo: 'data:image/png;base64,...', tipo: 'imagem' }
  ]);
  const [anexoNome, setAnexoNome] = useState('');
  const [anexoTipo, setAnexoTipo] = useState<'imagem' | 'pdf' | 'outro'>('imagem');

  // 4. GUARNIÇÃO DE SERVIÇO PMMT
  const [listaGuarnicoes, setListaGuarnicoes] = useState<GuarnicaoItem[]>([
    {
      nome_guarnicao: 'Guarnição 1901',
      tipo_guarnicao: 'Rádio Patrulha',
      viatura: 'VTR-1919 (Toyota Hilux)',
      policiais_integrantes: 'Sgt PM Mário, Cb PM J. Silva, Sd PM Ramos',
      comandante_guarnicao: 'Sgt PM Mário',
      horario_inicial: '07:00',
      horario_final: '19:00'
    }
  ]);
  const [gNome, setGNome] = useState('');
  const [gTipo, setGTipo] = useState<GuarnicaoItem['tipo_guarnicao']>('Rádio Patrulha');
  const [gVtr, setGVtr] = useState('');
  const [gPoliciais, setGPoliciais] = useState('');
  const [gComandante, setGComandante] = useState('');
  const [gHorarioInicial, setGHorarioInicial] = useState('07:00');
  const [gHorarioFinal, setGHorarioFinal] = useState('19:00');

  // 5. ATIVIDADE DELEGADA
  const [listaAtividadesDelegadas, setListaAtividadesDelegadas] = useState<AtividadeDelegadaItem[]>([
    {
      nome_equipe: 'Equipe Cidade Querência',
      viatura: 'VTR-1933 (Renault Duster)',
      policiais: 'Cb PM Douglas, Sd PM Lima',
      local_operacao: 'Centro Comercial de Querência',
      horario: '08:00 às 14:00',
      observacoes: 'Policiamento ostensivo preventivo intensificado nos comércios.'
    }
  ]);
  const [adNomeEquipe, setAdNomeEquipe] = useState('');
  const [adViatura, setAdViatura] = useState('');
  const [adPoliciais, setAdPoliciais] = useState('');
  const [adLocalOperacao, setAdLocalOperacao] = useState('');
  const [adHorario, setAdHorario] = useState('08:00 às 14:00');
  const [adObservacoes, setAdObservacoes] = useState('');

  // 6. JORNADA EXTRAORDINÁRIA
  const [listaJornadasExtraordinarias, setListaJornadasExtraordinarias] = useState<JornadaExtraordinariaItem[]>([
    {
      nome_equipe: 'Reforço Noturno Querência',
      viatura: 'VTR-1944 (Toyota Hilux)',
      policiais: 'Sgt PM Mota, Sd PM Antunes',
      tipo_reforco: 'Saturação de Área',
      horario: '18:00 às 23:00',
      observacoes: 'Saturação intensiva com foco no perímetro comercial bancário.'
    }
  ]);
  const [jeNomeEquipe, setJeNomeEquipe] = useState('');
  const [jeViatura, setJeViatura] = useState('');
  const [jePoliciais, setJePoliciais] = useState('');
  const [jeTipoReforco, setJeTipoReforco] = useState('Policiamento Ostensivo');
  const [jeHorario, setJeHorario] = useState('18:00 às 23:00');
  const [jeObservacoes, setJeObservacoes] = useState('');

  // SELEÇÕES DO BANCO DE DADOS DE POLICIAIS PMMT
  const [gSelectedPMs, setGSelectedPMs] = useState<PolicialPMMT[]>([]);
  const [adSelectedPMs, setAdSelectedPMs] = useState<PolicialPMMT[]>([]);
  const [jeSelectedPMs, setJeSelectedPMs] = useState<PolicialPMMT[]>([]);

  // Termos de busca e filtros do banco de dados de policiais
  const [gPMSearchText, setGPMSearchText] = useState('');
  const [gPMFilterRank, setGPMFilterRank] = useState('TODOS');
  const [gShowPMSelector, setGShowPMSelector] = useState(false);

  const [adPMSearchText, setAdPMSearchText] = useState('');
  const [adPMFilterRank, setAdPMFilterRank] = useState('TODOS');
  const [adShowPMSelector, setAdShowPMSelector] = useState(false);

  const [jePMSearchText, setJePMSearchText] = useState('');
  const [jePMFilterRank, setJePMFilterRank] = useState('TODOS');
  const [jeShowPMSelector, setJeShowPMSelector] = useState(false);

  // Toggle Handlers para o banco
  const handleToggleGMPolicial = (policial: PolicialPMMT) => {
    const exists = gSelectedPMs.some(p => p.matricula === policial.matricula);
    let updated: PolicialPMMT[];
    if (exists) {
      updated = gSelectedPMs.filter(p => p.matricula !== policial.matricula);
    } else {
      updated = [...gSelectedPMs, policial];
    }
    setGSelectedPMs(updated);

    // Formatar texto com graduação, nome e matrícula
    const pStr = updated.map(p => `${p.graduacao} ${p.nome_completo} (Mat. ${p.matricula})`).join(', ');
    setGPoliciais(pStr);

    // Definição automática do comandante pela maior patente
    if (updated.length > 0) {
      const sortedByRank = [...updated].sort((a, b) => OBTER_PESO_PATENTE(b.graduacao) - OBTER_PESO_PATENTE(a.graduacao));
      setGComandante(`${sortedByRank[0].graduacao} ${sortedByRank[0].nome_completo}`);
    } else {
      setGComandante('');
    }
  };

  const handleToggleAdPolicial = (policial: PolicialPMMT) => {
    const exists = adSelectedPMs.some(p => p.matricula === policial.matricula);
    let updated: PolicialPMMT[];
    if (exists) {
      updated = adSelectedPMs.filter(p => p.matricula !== policial.matricula);
    } else {
      updated = [...adSelectedPMs, policial];
    }
    setAdSelectedPMs(updated);

    const pStr = updated.map(p => `${p.graduacao} ${p.nome_completo} (Mat. ${p.matricula})`).join(', ');
    setAdPoliciais(pStr);
  };

  const handleToggleJePolicial = (policial: PolicialPMMT) => {
    const exists = jeSelectedPMs.some(p => p.matricula === policial.matricula);
    let updated: PolicialPMMT[];
    if (exists) {
      updated = jeSelectedPMs.filter(p => p.matricula !== policial.matricula);
    } else {
      updated = [...jeSelectedPMs, policial];
    }
    setJeSelectedPMs(updated);

    const pStr = updated.map(p => `${p.graduacao} ${p.nome_completo} (Mat. ${p.matricula})`).join(', ');
    setJePoliciais(pStr);
  };

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill Commander info if user details change
  useEffect(() => {
    if (currentUserSession) {
      if (currentUserSession.name) {
        setComandanteResponsavel(currentUserSession.name);
      }
      if (currentUserSession.cidade) {
        setCidade(currentUserSession.cidade);
      }
    }
  }, [currentUserSession]);

  const resetForm = () => {
    setOperacao('');
    setTurno(SHIFT_OPTIONS[0]);
    setHorarioServico(SERVICE_HOURS_OPTIONS[1]);
    const initialPassa = () => {
      const baseName = (currentUserSession && currentUserSession.name) || 'Sgt PM Sem Nome';
      const matricula = (currentUserSession && currentUserSession.matricula) || '';
      if (matricula && !baseName.includes('RG PM') && !baseName.includes(matricula)) {
        return `${baseName} - RG PM ${matricula}`;
      }
      return baseName;
    };
    const defaultPassaVal = initialPassa();
    setComandanteResponsavel(defaultPassaVal);
    setPassaSearchText(defaultPassaVal);
    setComandanteRecebe('');
    setRecebeSearchText('');
    setEfetivo(2);
    setViaturasCount(1);
    setArmas(0);
    setArmasDetalhes('');
    setMunicoes(0);
    setMunicoesDetalhes('');
    setDrogasPeso(0);
    setDrogasDetalhes('');
    setValores(0);
    setObservacoes('');
    setOcorrenciasConsolidadas('');
    setListaViaturas([]);
    setListaOcorrencias([]);
    setListaAnexos([]);
    setListaGuarnicoes([]);
    setListaAtividadesDelegadas([]);
    setListaJornadasExtraordinarias([]);
    setGNome('');
    setGVtr('');
    setGPoliciais('');
    setGComandante('');
    setAdNomeEquipe('');
    setAdViatura('');
    setAdPoliciais('');
    setAdLocalOperacao('');
    setAdObservacoes('');
    setJeNomeEquipe('');
    setJeViatura('');
    setJePoliciais('');
    setJeObservacoes('');
    setComandanteRecebe('');
    setRecebeSearchText('');
  };

  // Handlers for Guarnição
  const handleAddGuarnicao = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!gNome.trim() || !gVtr.trim() || !gPoliciais.trim() || !gComandante.trim()) {
      alert('Por favor, preencha os campos obrigatórios da Guarnição: Nome, Viatura, Policiais integrantes e Comandante.');
      return;
    }
    const row: GuarnicaoItem = {
      nome_guarnicao: gNome.trim(),
      tipo_guarnicao: gTipo,
      viatura: gVtr.trim(),
      policiais_integrantes: gPoliciais.trim(),
      comandante_guarnicao: gComandante.trim(),
      horario_inicial: gHorarioInicial,
      horario_final: gHorarioFinal,
    };
    setListaGuarnicoes([...listaGuarnicoes, row]);
    setGNome('');
    setGVtr('');
    setGPoliciais('');
    setGComandante('');
    setGSelectedPMs([]);
    setGPMSearchText('');
    setGShowPMSelector(false);
  };

  const handleRemoveGuarnicao = (index: number) => {
    setListaGuarnicoes(listaGuarnicoes.filter((_, idx) => idx !== index));
  };

  // Handlers for Atividade Delegada
  const handleAddAtividadeDelegada = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!adNomeEquipe.trim() || !adViatura.trim() || !adPoliciais.trim() || !adLocalOperacao.trim()) {
      alert('Por favor, preencha as informações obrigatórias da Equipe Delegada.');
      return;
    }
    const row: AtividadeDelegadaItem = {
      nome_equipe: adNomeEquipe.trim(),
      viatura: adViatura.trim(),
      policiais: adPoliciais.trim(),
      local_operacao: adLocalOperacao.trim(),
      horario: adHorario.trim(),
      observacoes: adObservacoes.trim() || undefined,
    };
    setListaAtividadesDelegadas([...listaAtividadesDelegadas, row]);
    setAdNomeEquipe('');
    setAdViatura('');
    setAdPoliciais('');
    setAdLocalOperacao('');
    setAdObservacoes('');
    setAdSelectedPMs([]);
    setAdPMSearchText('');
    setAdShowPMSelector(false);
  };

  const handleRemoveAtividadeDelegada = (index: number) => {
    setListaAtividadesDelegadas(listaAtividadesDelegadas.filter((_, idx) => idx !== index));
  };

  // Handlers for Jornada Extraordinária
  const handleAddJornadaExtra = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!jeNomeEquipe.trim() || !jeViatura.trim() || !jePoliciais.trim()) {
      alert('Por favor, preencha as informações obrigatórias da Jornada Extra.');
      return;
    }
    const row: JornadaExtraordinariaItem = {
      nome_equipe: jeNomeEquipe.trim(),
      viatura: jeViatura.trim(),
      policiais: jePoliciais.trim(),
      tipo_reforco: jeTipoReforco.trim(),
      horario: jeHorario.trim(),
      observacoes: jeObservacoes.trim() || undefined,
    };
    setListaJornadasExtraordinarias([...listaJornadasExtraordinarias, row]);
    setJeNomeEquipe('');
    setJeViatura('');
    setJePoliciais('');
    setJeObservacoes('');
    setJeSelectedPMs([]);
    setJePMSearchText('');
    setJeShowPMSelector(false);
  };

  const handleRemoveJornadaExtra = (index: number) => {
    setListaJornadasExtraordinarias(listaJornadasExtraordinarias.filter((_, idx) => idx !== index));
  };

  const handleQuickSelectOperacao = (opName: string) => {
    setOperacao(opName);
  };

  // Helper row managers for Viaturas
  const handleAddViatura = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!vtrPrefixo.trim() || !vtrModelo.trim()) {
      alert('Por favor, preencha o Prefixo e o Modelo da Viatura');
      return;
    }
    const row: Viatura = {
      prefixo: vtrPrefixo.toUpperCase().trim(),
      modelo: vtrModelo.trim(),
      placa: vtrPlaca.toUpperCase().trim() || undefined,
      km_inicial: vtrKmInit,
      km_final: vtrKmFinal
    };
    setListaViaturas([...listaViaturas, row]);
    setViaturasCount(prev => prev + 1);
    // Clear
    setVtrPrefixo('');
    setVtrModelo('');
    setVtrPlaca('');
    setVtrKmInit(undefined);
    setVtrKmFinal(undefined);
  };

  const handleRemoveViatura = (index: number) => {
    setListaViaturas(listaViaturas.filter((_, idx) => idx !== index));
    setViaturasCount(prev => Math.max(0, prev - 1));
  };

  // Helper row managers for Ocorrências
  const handleAddOcorrencia = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!ocoObs.trim()) {
      alert('Descreva brevemente as observações da ocorrência.');
      return;
    }
    const row: OcorrenciaItem = {
      natureza_ocorrencia: ocoNatureza,
      ocorrencia_bo: ocoBo.trim() || undefined,
      suspeitos_conduzidos: ocoSuspeitos,
      observacoes: ocoObs.trim(),
      local_fato: ocoLocal.trim() || undefined
    };
    setListaOcorrencias([...listaOcorrencias, row]);
    
    // Auto appending a bullet to consolidated history text area for convenience
    const currentListText = ocoBo 
      ? `• [${ocoNatureza}] - BO ${ocoBo}: ${ocoObs.trim()} (${ocoLocal || 'Local não informado'}).\n`
      : `• [${ocoNatureza}]: ${ocoObs.trim()} (${ocoLocal || 'Local não informado'}).\n`;
    setOcorrenciasConsolidadas(prev => prev + currentListText);

    // Clear row inputs
    setOcoBo('');
    setOcoSuspeitos(0);
    setOcoObs('');
    setOcoLocal('');
  };

  const handleRemoveOcorrencia = (index: number) => {
    setListaOcorrencias(listaOcorrencias.filter((_, idx) => idx !== index));
  };

  // Helper row managers for Anexos
  const handleAddAnexo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!anexoNome.trim()) {
      alert('Insira um nome fictício de arquivo para simular anexação.');
      return;
    }
    const row: AnexoItem = {
      nome_arquivo: anexoNome.trim(),
      url_arquivo: `${anexoTipo === 'imagem' ? 'data:image/png;base64,mockcode...' : 'https://supabase.storage/documents/file.pdf'}`,
      tipo: anexoTipo
    };
    setListaAnexos([...listaAnexos, row]);
    setAnexoNome('');
  };

  const simulateQuickSeizureAttachment = () => {
    const randomSeizures = [
      'termo_apreensao_drogas.pdf',
      'foto_armamento_clandestino.jpg',
      'auto_exibicao_dinheiro.pdf',
      'boletim_ocorrencia_pmmt.pdf',
    ];
    const chosen = randomSeizures[Math.floor(Math.random() * randomSeizures.length)];
    const rowType = chosen.endsWith('.jpg') ? 'imagem' : 'pdf';
    setListaAnexos([...listaAnexos, {
      nome_arquivo: chosen,
      url_arquivo: '#simulado',
      tipo: rowType as any
    }]);
  };

  const handleRemoveAnexo = (index: number) => {
    setListaAnexos(listaAnexos.filter((_, idx) => idx !== index));
  };


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operacao.trim()) {
      setErrorMsg('O nome ou tipo da Operação é obrigatório.');
      return;
    }

    // Auto-generate summary narrative if empty
    let finalOcorrenciaNarrative = ocorrenciasConsolidadas.trim();
    if (!finalOcorrenciaNarrative) {
      if (listaOcorrencias.length > 0) {
        finalOcorrenciaNarrative = listaOcorrencias.map(oc => {
          return `[${oc.natureza_ocorrencia}] - ${oc.observacoes} ${oc.ocorrencia_bo ? `(BO: ${oc.ocorrencia_bo})` : ''} ${oc.local_fato ? `no endereço: ${oc.local_fato}` : ''}`;
        }).join('\n');
      } else {
        finalOcorrenciaNarrative = 'Sem ocorrências registradas.';
      }
    }

    setErrorMsg(null);
    setSubmitting(true);

    const reportPayload: Omit<PoliceReport, 'id' | 'created_at'> = {
      user_email: (currentUserSession && currentUserSession.email) || 'militar@pm.mt.gov.br',
      operacao: operacao.trim(),
      turno,
      horario_servico: horarioServico,
      cidade,
      comandante_responsavel: comandanteResponsavel.trim(),
      comandante_recebe: comandanteRecebe.trim(),
      efetivo: Number(efetivo),
      viaturas: Number(viaturasCount),
      
      // Seizures
      armas_apreendidas: Number(armas),
      armas_detalhes: armas > 0 ? armasDetalhes.trim() : '',
      municoes: Number(municoes),
      municoes_detalhes: municoes > 0 ? municoesDetalhes.trim() : '',
      drogas_peso: Number(drogasPeso),
      drogas_detalhes: drogasPeso > 0 ? drogasDetalhes.trim() : '',
      valores: Number(valores),
      observacoes: observacoes.trim(),
      
      // Narrative text
      ocorrencias: finalOcorrenciaNarrative,

      // Nested structural entities
      lista_viaturas: listaViaturas,
      lista_ocorrencias: listaOcorrencias,
      lista_anexos: listaAnexos,
      lista_guarnicoes: listaGuarnicoes,
      lista_atividades_delegadas: listaAtividadesDelegadas,
      lista_jornadas_extraordinarias: listaJornadasExtraordinarias
    };

    try {
      const isOk = await onSubmit(reportPayload);
      if (isOk) {
        setSuccess(true);
        resetForm();
        // Clear success checkmark after 4 seconds
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setErrorMsg('Erro de comunicação. O relatório não pôde ser gravado nas tabelas do Supabase.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Houve um imprevisto ao enviar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl shadow-lg p-6 lg:p-8" id="report-form-container">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
        <div className="p-2.5 bg-blue-950/80 border border-blue-900 rounded-lg text-blue-400">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-sans">Cadastrar Relatório (RDS-PM) Completo</h3>
          <p className="text-xs text-slate-400">Inserção estruturada com validação de RLS e políticas de acesso</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-900 rounded-lg text-emerald-300 text-sm flex items-center gap-3 animate-bounce" id="form-success-banner">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold block">Relatório Relacional Gravado com Sucesso!</span>
            <span className="text-xs text-emerald-400/80">
              Dados integrados gravados na tabela principal de <b>relatorios</b>, com inserções em cascata para <b>viaturas</b>, <b>ocorrencias</b> e <b>anexos</b>!
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/55 border border-red-900 rounded-lg text-red-300 text-sm flex items-center gap-3 animate-shake">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        
        {/* BLOC 1: IDENTIFICAÇÃO DE SERVIÇO */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <Compass className="h-3.5 w-3.5" />
            <span>01. Identificação do Serviço e Comando</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operação */}
            <div className="md:col-span-2">
              <label htmlFor="input-operacao" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold">
                Nome da Operação *
              </label>
              <input
                id="input-operacao"
                type="text"
                required
                value={operacao}
                onChange={(e) => setOperacao(e.target.value)}
                placeholder="Ex: Operação Saturação Metropolitana, Comando de Trânsito"
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {POPULAR_OPERATIONS.slice(0, 4).map((op, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickSelectOperacao(op)}
                    className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800 hover:border-blue-500 rounded px-2 py-0.5 transition"
                  >
                    {op.replace('Operação ', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {/* Cidade */}
            <div>
              <label htmlFor="select-cidade" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>Cidade / Pelotão</span>
              </label>
              <select
                id="select-cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-amber-400"
              >
                {CITITES_OPTIONS.map((cid, idx) => (
                  <option key={idx} value={cid}>{cid}</option>
                ))}
              </select>
            </div>

            {/* Turno */}
            <div>
              <label htmlFor="select-turno" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold">
                Turno de Escala *
              </label>
              <select
                id="select-turno"
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-amber-400"
              >
                {SHIFT_OPTIONS.map((sh, idx) => (
                  <option key={idx} value={sh}>{sh}</option>
                ))}
              </select>
            </div>

            {/* Horário de Serviço */}
            <div>
              <label htmlFor="select-horario" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span>Horário Serviço *</span>
              </label>
              <select
                id="select-horario"
                value={horarioServico}
                onChange={(e) => setHorarioServico(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-amber-400"
              >
                {SERVICE_HOURS_OPTIONS.map((hs, idx) => (
                  <option key={idx} value={hs}>{hs}</option>
                ))}
              </select>
            </div>

            {/* Efetivo */}
            <div>
              <label htmlFor="input-efetivo" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <span>Efetivo Militar</span>
              </label>
              <input
                id="input-efetivo"
                type="number"
                min="1"
                required
                value={efetivo}
                onChange={(e) => setEfetivo(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* BLOCO: GUARNIÇÃO DE SERVIÇO */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4" id="bloco-guarnicao">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              <span>02. Guarnição de Serviço (Efetivo Operacional)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Estrutura Interna PMMT</span>
          </div>

          {/* New row Sub-Form */}
          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">Lançar nova Guarnição:</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Nome da Guarnição *</label>
                <input
                  type="text"
                  value={gNome}
                  onChange={(e) => setGNome(e.target.value)}
                  placeholder="Ex: Rádio Patrulha 1901"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Tipo da Guarnição *</label>
                <select
                  value={gTipo}
                  onChange={(e) => setGTipo(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                >
                  <option value="Rádio Patrulha">Rádio Patrulha</option>
                  <option value="Força Tática">Força Tática</option>
                  <option value="Patrulhamento Rural">Patrulhamento Rural</option>
                  <option value="CPU">CPU</option>
                  <option value="Maria da Penha">Maria da Penha</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Viatura *</label>
                <input
                  type="text"
                  value={gVtr}
                  onChange={(e) => setGVtr(e.target.value)}
                  placeholder="Ex: VTR-1919 (Toyota Hilux)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Policiais integrantes *</label>
                <input
                  type="text"
                  value={gPoliciais}
                  onChange={(e) => setGPoliciais(e.target.value)}
                  placeholder="Ex: Sgt PM Mário, Cb PM J. Silva, Sd PM Ramos"
                  className="w-full bg-slate-950 border border-slate-100/10 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                />
                
                {/* INTERACTIVE PMMT OFFICERS SELETOR */}
                <div className="mt-1.5 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setGShowPMSelector(!gShowPMSelector)}
                    className="text-[10px] text-amber-500 hover:text-amber-450 font-mono flex items-center gap-1 border border-amber-950/40 px-2 py-1 bg-amber-950/10 rounded transition cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-amber-500" />
                    <span>{gShowPMSelector ? 'Fechar Seletor de Policiais (-)' : 'Buscar / Selecionar do Banco PMMT (+)'}</span>
                  </button>

                  {gShowPMSelector && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-3 shadow-xl">
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                        <div className="w-full sm:w-1/2 relative">
                          <input 
                            type="text"
                            value={gPMSearchText}
                            onChange={(e) => setGPMSearchText(e.target.value)}
                            placeholder="Buscar por nome ou matrícula..."
                            className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs rounded p-1.5 pl-6 placeholder-slate-500 outline-none focus:border-amber-500"
                          />
                          <span className="absolute left-1.5 top-2 text-[10px] text-slate-500">🔍</span>
                        </div>

                        {/* Badges for Rank filtering */}
                        <div className="flex flex-wrap gap-1">
                          {['TODOS', 'CAP', 'TEN', 'SGT', 'CB', 'SD'].map((rank) => (
                            <button
                              key={rank}
                              type="button"
                              onClick={() => setGPMFilterRank(rank)}
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                gPMFilterRank === rank 
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                                  : 'bg-slate-900 text-slate-450 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {rank}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Officers Results Grid */}
                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-900/40 text-xs font-sans">
                        {LISTA_POLICIAIS_PMMT.filter(p => {
                          const textMatch = p.nome_completo.toLowerCase().includes(gPMSearchText.toLowerCase()) || 
                                            p.matricula.includes(gPMSearchText) || 
                                            p.graduacao.toLowerCase().includes(gPMSearchText.toLowerCase());
                          
                          if (gPMFilterRank === 'TODOS') return textMatch;
                          if (gPMFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                          if (gPMFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                          if (gPMFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                          if (gPMFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                          if (gPMFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                          return textMatch;
                        }).length === 0 ? (
                          <div className="text-center py-3 text-slate-500 text-xs italic">Nenhum policial encontrado.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1">
                            {LISTA_POLICIAIS_PMMT.filter(p => {
                              const textMatch = p.nome_completo.toLowerCase().includes(gPMSearchText.toLowerCase()) || 
                                                p.matricula.includes(gPMSearchText) || 
                                                p.graduacao.toLowerCase().includes(gPMSearchText.toLowerCase());
                              
                              if (gPMFilterRank === 'TODOS') return textMatch;
                              if (gPMFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                              if (gPMFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                              if (gPMFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                              if (gPMFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                              if (gPMFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                              return textMatch;
                            }).map((pol) => {
                              const isSelected = gSelectedPMs.some(item => item.matricula === pol.matricula);
                              return (
                                <button
                                  key={pol.matricula}
                                  type="button"
                                  onClick={() => handleToggleGMPolicial(pol)}
                                  className={`flex items-center justify-between p-1.5 rounded border text-left cursor-pointer transition text-[11px] ${
                                    isSelected 
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-200' 
                                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                                  }`}
                                >
                                  <div className="truncate max-w-[85%]">
                                    <div className="font-semibold flex items-center gap-1.5 text-white">
                                      <span className="text-amber-500 font-mono text-[9px] px-1 bg-slate-950 border border-slate-800 rounded">
                                        {pol.graduacao}
                                      </span>
                                      <span className="truncate">{OBTER_NOME_GUERRA_OU_ABREVIADO('', pol.nome_completo).replace(pol.graduacao, '').trim()}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500">Mat: {pol.matricula}</div>
                                  </div>
                                  <div>
                                    {isSelected ? (
                                      <span className="text-[9px] text-amber-400 font-bold bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/30">✓</span>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 hover:text-slate-350">+ Sec</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Comandante da guarnição *</label>
                <input
                  type="text"
                  value={gComandante}
                  onChange={(e) => setGComandante(e.target.value)}
                  placeholder="Ex: Sgt PM Mário (Definido por maior patente selecionada)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                />
                <span className="text-[9px] text-slate-500 font-mono block mt-1">Preenchido automaticamente ao selecionar os integrantes.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário Inicial *</label>
                <input
                  type="text"
                  value={gHorarioInicial}
                  onChange={(e) => setGHorarioInicial(e.target.value)}
                  placeholder="Ex: 07:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário Final *</label>
                <input
                  type="text"
                  value={gHorarioFinal}
                  onChange={(e) => setGHorarioFinal(e.target.value)}
                  placeholder="Ex: 19:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddGuarnicao}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 px-4 rounded border border-amber-600 flex items-center gap-1.5 transition active:scale-95"
              >
                <PlusCircle className="h-4 w-4 text-slate-950" />
                <span>+ Adicionar Guarnição</span>
              </button>
            </div>
          </div>

          {/* List of current Guarnições in local view */}
          {listaGuarnicoes.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-2">Nenhuma Guarnição de Serviço lançada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaGuarnicoes.map((g, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-lg p-3.5 relative flex flex-col justify-between hover:border-amber-500 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">
                          {g.tipo_guarnicao}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{g.nome_guarnicao}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuarnicao(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Remover Guarnição"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300 font-sans pt-1">
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Viatura:</span>
                        <span className="font-semibold text-white">{g.viatura}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Comandante:</span>
                        <span className="font-semibold text-white">{g.comandante_guarnicao}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Integrantes:</span>
                        <span className="text-slate-300">{g.policiais_integrantes}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Horário: {g.horario_inicial} às {g.horario_final}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOCO: ATIVIDADE DELEGADA */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4" id="bloco-integracao-delegada">
          <div className="text-xs font-mono text-blue-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>03. Atividade Delegada (Apoio Municipal SESP)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Convênios Municipais</span>
          </div>

          {/* Form */}
          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">Lançar Equipe Delegada:</span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Nome da Equipe *</label>
                <input
                  type="text"
                  value={adNomeEquipe}
                  onChange={(e) => setAdNomeEquipe(e.target.value)}
                  placeholder="Ex: Equipe Cidade Querência"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Viatura *</label>
                <input
                  type="text"
                  value={adViatura}
                  onChange={(e) => setAdViatura(e.target.value)}
                  placeholder="Ex: VTR-1933 (Renault Duster)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário de Atuação *</label>
                <input
                  type="text"
                  value={adHorario}
                  onChange={(e) => setAdHorario(e.target.value)}
                  placeholder="Ex: 08:00 às 14:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Policiais de Serviço *</label>
                <input
                  type="text"
                  value={adPoliciais}
                  onChange={(e) => setAdPoliciais(e.target.value)}
                  placeholder="Ex: Cb PM Douglas, Sd PM Lima"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                />

                {/* INTERACTIVE PMMT OFFICERS SELETOR FOR ATIVIDADE DELEGADA */}
                <div className="mt-1.5 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setAdShowPMSelector(!adShowPMSelector)}
                    className="text-[10px] text-blue-400 hover:text-blue-350 font-mono flex items-center gap-1 border border-blue-950/40 px-2 py-1 bg-blue-950/10 rounded transition cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-blue-400" />
                    <span>{adShowPMSelector ? 'Fechar Seletor de Policiais (-)' : 'Buscar / Selecionar do Banco PMMT (+)'}</span>
                  </button>

                  {adShowPMSelector && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-3 shadow-xl">
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                        <div className="w-full sm:w-1/2 relative">
                          <input 
                            type="text"
                            value={adPMSearchText}
                            onChange={(e) => setAdPMSearchText(e.target.value)}
                            placeholder="Buscar por nome ou matrícula..."
                            className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs rounded p-1.5 pl-6 placeholder-slate-500 outline-none focus:border-blue-400"
                          />
                          <span className="absolute left-1.5 top-2 text-[10px] text-slate-500">🔍</span>
                        </div>

                        {/* Badges for Rank filtering */}
                        <div className="flex flex-wrap gap-1">
                          {['TODOS', 'CAP', 'TEN', 'SGT', 'CB', 'SD'].map((rank) => (
                            <button
                              key={rank}
                              type="button"
                              onClick={() => setAdPMFilterRank(rank)}
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                adPMFilterRank === rank 
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                                  : 'bg-slate-900 text-slate-455 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {rank}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Officers Results Grid */}
                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-900/40 text-xs font-sans">
                        {LISTA_POLICIAIS_PMMT.filter(p => {
                          const textMatch = p.nome_completo.toLowerCase().includes(adPMSearchText.toLowerCase()) || 
                                            p.matricula.includes(adPMSearchText) || 
                                            p.graduacao.toLowerCase().includes(adPMSearchText.toLowerCase());
                          
                          if (adPMFilterRank === 'TODOS') return textMatch;
                          if (adPMFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                          if (adPMFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                          if (adPMFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                          if (adPMFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                          if (adPMFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                          return textMatch;
                        }).length === 0 ? (
                          <div className="text-center py-3 text-slate-500 text-xs italic">Nenhum policial encontrado.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1">
                            {LISTA_POLICIAIS_PMMT.filter(p => {
                              const textMatch = p.nome_completo.toLowerCase().includes(adPMSearchText.toLowerCase()) || 
                                                p.matricula.includes(adPMSearchText) || 
                                                p.graduacao.toLowerCase().includes(adPMSearchText.toLowerCase());
                              
                              if (adPMFilterRank === 'TODOS') return textMatch;
                              if (adPMFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                              if (adPMFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                              if (adPMFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                              if (adPMFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                              if (adPMFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                              return textMatch;
                            }).map((pol) => {
                              const isSelected = adSelectedPMs.some(item => item.matricula === pol.matricula);
                              return (
                                <button
                                  key={pol.matricula}
                                  type="button"
                                  onClick={() => handleToggleAdPolicial(pol)}
                                  className={`flex items-center justify-between p-1.5 rounded border text-left cursor-pointer transition text-[11px] ${
                                    isSelected 
                                      ? 'bg-blue-600/10 border-blue-600 text-blue-200' 
                                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                                  }`}
                                >
                                  <div className="truncate max-w-[85%]">
                                    <div className="font-semibold flex items-center gap-1.5 text-white">
                                      <span className="text-blue-400 font-mono text-[9px] px-1 bg-slate-950 border border-slate-800 rounded">
                                        {pol.graduacao}
                                      </span>
                                      <span className="truncate">{OBTER_NOME_GUERRA_OU_ABREVIADO('', pol.nome_completo).replace(pol.graduacao, '').trim()}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500">Mat: {pol.matricula}</div>
                                  </div>
                                  <div>
                                    {isSelected ? (
                                      <span className="text-[9px] text-blue-400 font-bold bg-blue-600/20 px-1 py-0.5 rounded border border-blue-600/30">✓</span>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 hover:text-slate-350">+ Sec</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Local da Operação *</label>
                <input
                  type="text"
                  value={adLocalOperacao}
                  onChange={(e) => setAdLocalOperacao(e.target.value)}
                  placeholder="Ex: Centro Comercial, Setor Leste"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-sans mb-1">Observações Operacionais</label>
              <textarea
                value={adObservacoes}
                onChange={(e) => setAdObservacoes(e.target.value)}
                placeholder="Ex: Apoio preventivo em eventos locais, ronda no comércio local."
                rows={1}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddAtividadeDelegada}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded border border-blue-700 flex items-center gap-1.5 transition active:scale-95"
              >
                <PlusCircle className="h-4 w-4 text-white" />
                <span>+ Adicionar Equipe Delegada</span>
              </button>
            </div>
          </div>

          {/* List delegadas */}
          {listaAtividadesDelegadas.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-2">Nenhuma equipe de Atividade Delegada lançada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaAtividadesDelegadas.map((ad, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-lg p-3.5 relative flex flex-col justify-between hover:border-blue-500 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-white">{ad.nome_equipe}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveAtividadeDelegada(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300 font-sans">
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Viatura:</span>
                        <span className="font-semibold text-white">{ad.viatura}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Horário:</span>
                        <span className="font-semibold text-white">{ad.horario}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Local:</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-blue-400" />
                          <span>{ad.local_operacao}</span>
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Policiais:</span>
                        <span className="text-slate-300">{ad.policiais}</span>
                      </div>
                      {ad.observacoes && (
                        <div className="col-span-2 border-t border-slate-800/60 pt-1 text-[11px] text-slate-400 italic">
                          Obs: {ad.observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOCO: JORNADA EXTRAORDINÁRIA */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4" id="bloco-jornada-extra">
          <div className="text-xs font-mono text-emerald-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              <span>04. Jornada Extraordinária (Reforço Escalar PMMT)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Reforço Especial</span>
          </div>

          {/* Form */}
          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">Lançar Equipe de Jornada Extraordinária:</span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Nome da Equipe *</label>
                <input
                  type="text"
                  value={jeNomeEquipe}
                  onChange={(e) => setJeNomeEquipe(e.target.value)}
                  placeholder="Ex: Reforço Noturno Querência"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Viatura *</label>
                <input
                  type="text"
                  value={jeViatura}
                  onChange={(e) => setJeViatura(e.target.value)}
                  placeholder="Ex: VTR-1944 (Toyota Hilux)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário *</label>
                <input
                  type="text"
                  value={jeHorario}
                  onChange={(e) => setJeHorario(e.target.value)}
                  placeholder="Ex: 18:00 às 23:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Policiais integrantes *</label>
                <input
                  type="text"
                  value={jePoliciais}
                  onChange={(e) => setJePoliciais(e.target.value)}
                  placeholder="Ex: Sgt PM Mota, Sd PM Antunes"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
                />

                {/* INTERACTIVE PMMT OFFICERS SELETOR FOR JORNADA EXTRAORDINÁRIA */}
                <div className="mt-1.5 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setJeShowPMSelector(!jeShowPMSelector)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-350 font-mono flex items-center gap-1 border border-emerald-950/40 px-2 py-1 bg-emerald-950/10 rounded transition cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-emerald-400" />
                    <span>{jeShowPMSelector ? 'Fechar Seletor de Policiais (-)' : 'Buscar / Selecionar do Banco PMMT (+)'}</span>
                  </button>

                  {jeShowPMSelector && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-3 shadow-xl">
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                        <div className="w-full sm:w-1/2 relative">
                          <input 
                            type="text"
                            value={jePMSearchText}
                            onChange={(e) => setJePMSearchText(e.target.value)}
                            placeholder="Buscar por nome ou matrícula..."
                            className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs rounded p-1.5 pl-6 placeholder-slate-500 outline-none focus:border-emerald-400"
                          />
                          <span className="absolute left-1.5 top-2 text-[10px] text-slate-500">🔍</span>
                        </div>

                        {/* Badges for Rank filtering */}
                        <div className="flex flex-wrap gap-1">
                          {['TODOS', 'CAP', 'TEN', 'SGT', 'CB', 'SD'].map((rank) => (
                            <button
                              key={rank}
                              type="button"
                              onClick={() => setJePMFilterRank(rank)}
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer ${
                                jePMFilterRank === rank 
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold' 
                                  : 'bg-slate-900 text-slate-455 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {rank}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Officers Results Grid */}
                      <div className="max-h-44 overflow-y-auto divide-y divide-slate-900/40 text-xs font-sans">
                        {LISTA_POLICIAIS_PMMT.filter(p => {
                          const textMatch = p.nome_completo.toLowerCase().includes(jePMSearchText.toLowerCase()) || 
                                            p.matricula.includes(jePMSearchText) || 
                                            p.graduacao.toLowerCase().includes(jePMSearchText.toLowerCase());
                          
                          if (jePMFilterRank === 'TODOS') return textMatch;
                          if (jePMFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                          if (jePMFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                          if (jePMFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                          if (jePMFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                          if (jePMFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                          return textMatch;
                        }).length === 0 ? (
                          <div className="text-center py-3 text-slate-500 text-xs italic">Nenhum policial encontrado.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1">
                            {LISTA_POLICIAIS_PMMT.filter(p => {
                              const textMatch = p.nome_completo.toLowerCase().includes(jePMSearchText.toLowerCase()) || 
                                                p.matricula.includes(jePMSearchText) || 
                                                p.graduacao.toLowerCase().includes(jePMSearchText.toLowerCase());
                              
                              if (jePMFilterRank === 'TODOS') return textMatch;
                              if (jePMFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                              if (jePMFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                              if (jePMFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                              if (jePMFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                              if (jePMFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                              return textMatch;
                            }).map((pol) => {
                              const isSelected = jeSelectedPMs.some(item => item.matricula === pol.matricula);
                              return (
                                <button
                                  key={pol.matricula}
                                  type="button"
                                  onClick={() => handleToggleJePolicial(pol)}
                                  className={`flex items-center justify-between p-1.5 rounded border text-left cursor-pointer transition text-[11px] ${
                                    isSelected 
                                      ? 'bg-emerald-600/10 border-emerald-600 text-emerald-200' 
                                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                                  }`}
                                >
                                  <div className="truncate max-w-[85%]">
                                    <div className="font-semibold flex items-center gap-1.5 text-white">
                                      <span className="text-emerald-400 font-mono text-[9px] px-1 bg-slate-950 border border-slate-800 rounded">
                                        {pol.graduacao}
                                      </span>
                                      <span className="truncate">{OBTER_NOME_GUERRA_OU_ABREVIADO('', pol.nome_completo).replace(pol.graduacao, '').trim()}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500">Mat: {pol.matricula}</div>
                                  </div>
                                  <div>
                                    {isSelected ? (
                                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-600/20 px-1 py-0.5 rounded border border-emerald-600/30">✓</span>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 hover:text-slate-350">+ Sec</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Tipo de Reforço / Operação *</label>
                <input
                  type="text"
                  value={jeTipoReforco}
                  onChange={(e) => setJeTipoReforco(e.target.value)}
                  placeholder="Ex: Saturação de Área, Lei Seca"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-sans mb-1">Observações Operacionais</label>
              <textarea
                value={jeObservacoes}
                onChange={(e) => setJeObservacoes(e.target.value)}
                placeholder="Ex: Policiamento intensivo com foco no perímetro comercial bancário."
                rows={1}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddJornadaExtra}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded border border-emerald-700 flex items-center gap-1.5 transition active:scale-95"
              >
                <PlusCircle className="h-4 w-4 text-white" />
                <span>+ Adicionar Jornada Extra</span>
              </button>
            </div>
          </div>

          {/* List extras */}
          {listaJornadasExtraordinarias.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-2">Nenhuma equipe de Jornada Extraordinária lançada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaJornadasExtraordinarias.map((je, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-lg p-3.5 relative flex flex-col justify-between hover:border-emerald-500 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">
                          {je.tipo_reforco}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{je.nome_equipe}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveJornadaExtra(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300 font-sans pt-1">
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Viatura:</span>
                        <span className="font-semibold text-white">{je.viatura}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Horário:</span>
                        <span className="font-semibold text-white">{je.horario}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono">Policiais:</span>
                        <span className="text-slate-300">{je.policiais}</span>
                      </div>
                      {je.observacoes && (
                        <div className="col-span-2 border-t border-slate-800/60 pt-1 text-[11px] text-slate-400 italic">
                          Obs: {je.observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOC 5: SUBTABELA INTERATIVA - VIATURAS EMPENHADAS */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5" />
              <span>05. Cadastro de Viaturas Empenhadas</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Tabela: viaturas (Relação 1-N)</span>
          </div>

          {/* VTR Row Sub-Form */}
          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">Vincular nova viatura a este relatório:</span>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Prefixo VTR</label>
                <input
                  type="text"
                  value={vtrPrefixo}
                  onChange={(e) => setVtrPrefixo(e.target.value)}
                  placeholder="Ex: VTR-1042"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Modelo VTR</label>
                <input
                  type="text"
                  value={vtrModelo}
                  onChange={(e) => setVtrModelo(e.target.value)}
                  placeholder="Ex: Toyota Hilux"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Placa VTR</label>
                <input
                  type="text"
                  value={vtrPlaca}
                  onChange={(e) => setVtrPlaca(e.target.value)}
                  placeholder="Ex: RRH-1A24"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">KM Inicial</label>
                <input
                  type="number"
                  value={vtrKmInit || ''}
                  onChange={(e) => setVtrKmInit(parseInt(e.target.value) || undefined)}
                  placeholder="Ex: 124500"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] text-slate-400 font-sans mb-1">KM Final</label>
                <input
                  type="number"
                  value={vtrKmFinal || ''}
                  onChange={(e) => setVtrKmFinal(parseInt(e.target.value) || undefined)}
                  placeholder="Ex: 124720"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddViatura}
                className="bg-blue-900 hover:bg-blue-800 text-xs text-white font-semibold py-1.5 px-4 rounded border border-blue-850 flex items-center gap-1.5 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Vincular Viatura
              </button>
            </div>
          </div>

          {/* VTR Registered list */}
          {listaViaturas.length === 0 ? (
            <p className="text-xs text-slate-500 italic pb-2 text-center">Nenhuma viatura vinculada ainda. Preencha os campos acima para vincular.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-850 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-mono">
                    <th className="p-3">Prefixo</th>
                    <th className="p-3">Modelo</th>
                    <th className="p-3">Placa</th>
                    <th className="p-3 text-center">KM Inicial</th>
                    <th className="p-3 text-center">KM Final</th>
                    <th className="p-3 text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono">
                  {listaViaturas.map((vtr, index) => (
                    <tr key={index} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white">{vtr.prefixo}</td>
                      <td className="p-3 text-slate-400">{vtr.modelo}</td>
                      <td className="p-3">{vtr.placa || '-'}</td>
                      <td className="p-3 text-center">{vtr.km_inicial ?? '-'}</td>
                      <td className="p-3 text-center">{vtr.km_final ?? '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveViatura(index)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* BLOC 3: SUBTABELA INTERATIVA - OCORRÊNCIAS REGISTRADAS */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>06. Registro de Ocorrências com Conduzidos</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Tabela: ocorrencias (Relação 1-N)</span>
          </div>

          {/* Ocorrencia Row Sub-Form */}
          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">Lançar ocorrência policial no relatório:</span>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Natureza da Ocorrência *</label>
                <select
                  value={ocoNatureza}
                  onChange={(e) => setOcoNatureza(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                >
                  {POPULAR_NATURES.map((nat, idx) => (
                    <option key={idx} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Nº do BO de Ocorrência</label>
                <input
                  type="text"
                  value={ocoBo}
                  onChange={(e) => setOcoBo(e.target.value)}
                  placeholder="Ex: BO-2026.04415"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Suspeitos Conduzidos</label>
                <input
                  type="number"
                  min="0"
                  value={ocoSuspeitos}
                  onChange={(e) => setOcoSuspeitos(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Local do Fato (Bairro/Ponto)</label>
                <input
                  type="text"
                  value={ocoLocal}
                  placeholder="Ex: Av. Pantanal, CPA IV"
                  onChange={(e) => setOcoLocal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-sans mb-1">Relato Descritivo da Ocorrência *</label>
              <textarea
                value={ocoObs}
                onChange={(e) => setOcoObs(e.target.value)}
                placeholder="Fato ocorrido, testemunhas, suspeitos localizados, objetos roubados..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddOcorrencia}
                className="bg-blue-900 hover:bg-blue-800 text-xs text-white font-semibold py-1.5 px-4 rounded border border-blue-850 flex items-center gap-1.5 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Lançar Ocorrência
              </button>
            </div>
          </div>

          {/* Ocorrências entries table */}
          {listaOcorrencias.length === 0 ? (
            <p className="text-xs text-slate-500 italic pb-2 text-center">Nenhuma ocorrência detalhada registrada. Preencha acima e clique em Lançar.</p>
          ) : (
            <div className="space-y-2">
              {listaOcorrencias.map((oc, index) => (
                <div key={index} className="p-3 bg-slate-900/80 border border-slate-850 rounded-lg flex items-start justify-between gap-3 text-xs leading-normal">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400">{oc.natureza_ocorrencia}</span>
                      {oc.ocorrencia_bo && (
                        <span className="bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 rounded px-1.5 py-0.5">
                          {oc.ocorrencia_bo}
                        </span>
                      )}
                      {oc.suspeitos_conduzidos && oc.suspeitos_conduzidos > 0 ? (
                        <span className="bg-red-950/40 border border-red-900/40 text-[10px] text-red-400 rounded px-1.5 py-0.5 font-bold font-mono">
                          {oc.suspeitos_conduzidos} Conduzido(s)
                        </span>
                      ) : null}
                    </div>
                    <p className="text-slate-300 font-normal">{oc.observacoes}</p>
                    {oc.local_fato && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <MapPin className="h-3 w-3 text-slate-600" />
                        <span>{oc.local_fato}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOcorrencia(index)}
                    className="text-slate-500 hover:text-red-400 transition shrink-0 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* BLOC 4: PRODUTIVIDADES DE APREENSÕES CONSOLIDADAS */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>07. Totalizador de Produtividade do Turno</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="input-armas" className="text-xs font-mono text-slate-300 uppercase font-semibold">
                  Armas de Fogo Apreendidas
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setArmas(Math.max(0, armas - 1))}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-755 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{armas}</span>
                  <button
                    type="button"
                    onClick={() => setArmas(armas + 1)}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-755 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              {armas > 0 && (
                <div className="animate-fadeIn">
                  <label htmlFor="textarea-armas-detalhes" className="block text-[10px] font-sans text-slate-450 mb-1">Especificações das armas:</label>
                  <textarea
                    id="textarea-armas-detalhes"
                    required
                    value={armasDetalhes}
                    onChange={(e) => setArmasDetalhes(e.target.value)}
                    placeholder="Ex: 01 Revólver .38 Smith&Wesson, 01 Pistola .40 Imbel"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Munições */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="input-municoes" className="text-xs font-mono text-slate-300 uppercase font-semibold">
                  Munições Apreendidas
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMunicoes(Math.max(0, municoes - 1))}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-755 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">{municoes}</span>
                  <button
                    type="button"
                    onClick={() => setMunicoes(municoes + 1)}
                    className="w-6 h-6 bg-slate-800 text-slate-300 rounded hover:bg-slate-755 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              {municoes > 0 && (
                <div className="animate-fadeIn">
                  <label htmlFor="textarea-municoes-detalhes" className="block text-[10px] font-sans text-slate-455 mb-1">Calibre e quantidade:</label>
                  <textarea
                    id="textarea-municoes-detalhes"
                    required
                    value={municoesDetalhes}
                    onChange={(e) => setMunicoesDetalhes(e.target.value)}
                    placeholder="Ex: 12 munições calibre .38 intactas"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drogas (Peso) */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div>
                <label htmlFor="input-drogas-peso" className="text-xs font-mono text-slate-300 uppercase font-semibold flex items-center justify-between mb-1.5">
                  <span>Drogas Apreendidas (Gramas)</span>
                  <span className="text-slate-500 font-normal">Ex: 1.5kg = 1500g</span>
                </label>
                <div className="relative">
                  <input
                    id="input-drogas-peso"
                    type="number"
                    min="0"
                    value={drogasPeso}
                    onChange={(e) => setDrogasPeso(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded p-2 outline-none pr-12 text-mono font-bold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[10px] font-mono text-slate-500 uppercase">
                    GRAMAS
                  </div>
                </div>
              </div>
              {drogasPeso > 0 && (
                <div className="animate-fadeIn">
                  <label htmlFor="textarea-drogas-detalhes" className="block text-[10px] font-sans text-slate-455 mb-1">Detalhamento dos Entorpecentes:</label>
                  <textarea
                    id="textarea-drogas-detalhes"
                    required
                    value={drogasDetalhes}
                    onChange={(e) => setDrogasDetalhes(e.target.value)}
                    placeholder="Ex: Substância análoga a Maconha prensada"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Valores apreendidos */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div>
                <label htmlFor="input-valores" className="text-xs font-mono text-slate-300 uppercase font-semibold flex items-center gap-1 mb-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span>Dinheiro / Valores Apreendidos (R$)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 text-xs font-mono">R$</span>
                  </div>
                  <input
                    id="input-valores"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valores || ''}
                    onChange={(e) => setValores(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded pl-8 pr-3 p-2 outline-none focus:border-amber-400 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* BLOC 5: TABELA SUB-RELAÇÃO - ANEXOS E TERMOS DE APREENSÃO */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              <span>08. Anexos e Termos de Apreensão Operacionais</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Tabela: anexos (Relação 1-N)</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Nome do Arquivo / Foto Digitalizada</label>
                <input
                  type="text"
                  value={anexoNome}
                  onChange={(e) => setAnexoNome(e.target.value)}
                  placeholder="Ex: foto_arma_fogo_cal38.jpg ou auto_apreensao.pdf"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Tipo de Documento</label>
                <select
                  value={anexoTipo}
                  onChange={(e: any) => setAnexoTipo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none"
                >
                  <option value="imagem">Foto / Imagem (.jpg)</option>
                  <option value="pdf">Documento PDF (.pdf)</option>
                  <option value="outro">Planilha ou Outro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center/ pt-1">
              <button
                type="button"
                onClick={simulateQuickSeizureAttachment}
                className="bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-mono border border-slate-800 py-1.5 px-3 rounded flex items-center gap-1.5 transition"
              >
                Simular Anexo Rápido
              </button>

              <button
                type="button"
                onClick={handleAddAnexo}
                className="bg-blue-900 hover:bg-blue-800 text-xs text-white font-semibold py-1.5 px-4 rounded border border-blue-850 flex items-center gap-1.5 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Vincular Anexo
              </button>
            </div>
          </div>

          {/* Anexos Registered list */}
          {listaAnexos.length === 0 ? (
            <p className="text-xs text-slate-500 italic pb-2 text-center font-mono">Nenhum termo ou anexo vinculado a esta ocorrência.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/20 p-2 rounded-xl">
              {listaAnexos.map((an, index) => {
                const isImage = an.nome_arquivo.endsWith('.jpg') || an.tipo === 'imagem';
                return (
                  <div key={index} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 relative">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-slate-950 rounded text-amber-500 shrink-0">
                        {isImage ? <FileImage className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] text-slate-250 font-semibold truncate leading-tight">{an.nome_arquivo}</span>
                        <span className="block text-[9px] text-slate-550 font-mono tracking-wider uppercase font-bold mt-0.5">{an.tipo}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-850">
                      <span className="text-[8px] text-slate-500 font-mono font-black">VINDO EM RDS</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnexo(index)}
                        className="text-red-400 hover:text-red-350 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* BLOC 6: NARRATIVA INTEGRADA E OBSERVAÇÕES GERAIS */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4 font-sans">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>06. Narrativa Consolidada e Observações da Direção</span>
          </div>

          <div>
            <label htmlFor="textarea-ocorrencias-consolido" className="block text-xs font-mono text-slate-300 uppercase mb-2 font-semibold">
              Resumo Diário Narrativo do Serviço (Narrativa Auto-Acoplada) *
            </label>
            <textarea
              id="textarea-ocorrencias-consolido"
              required
              rows={4}
              value={ocorrenciasConsolidadas}
              onChange={(e) => setOcorrenciasConsolidadas(e.target.value)}
              placeholder="Digite detalhadamente a narrativa geral do policiamento. Se preencheu o bloco de ocorrências acima, as linhas serão pré-anexadas automaticamente aqui."
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-3 outline-none focus:border-amber-400 transition leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="textarea-observacoes" className="block text-xs font-mono text-slate-300 uppercase mb-2 font-semibold">
              Observações Administrativas / Informações Gerais
            </label>
            <textarea
              id="textarea-observacoes"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Outras observações destinadas ao Comando da Diretoria Metropolitana..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* BLOC 7: TRANSIÇÃO E ASSINATURAS DE SERVIÇO */}
        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-6 font-sans">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center gap-1.5 border-b border-slate-800/60 pb-2 mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>07. Responsabilidade / Transição de Serviço</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* COMANDANTE QUE PASSA O SERVIÇO */}
            <div className="relative">
              <label htmlFor="input-passa-search" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-blue-400" />
                <span>Comandante que Passa o Serviço *</span>
              </label>
              <div className="relative">
                <input
                  id="input-passa-search"
                  type="text"
                  required
                  value={passaSearchText}
                  onChange={(e) => {
                    setPassaSearchText(e.target.value);
                    setComandanteResponsavel(e.target.value);
                    setPassaDropdownOpen(true);
                  }}
                  onFocus={() => setPassaDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setPassaDropdownOpen(false), 200);
                  }}
                  placeholder="Pesquise por nome, graduação ou RG..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  autoComplete="off"
                />
                {passaSearchText && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassaSearchText('');
                      setComandanteResponsavel('');
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {passaDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-slate-950 border border-slate-800 shadow-xl divide-y divide-slate-800 text-left">
                  <div className="p-2 bg-slate-950 flex flex-wrap gap-1 border-b border-slate-900 sticky top-0 z-10">
                    {['TODOS', 'CAP', 'TEN', 'SGT', 'CB', 'SD'].map((rank) => (
                      <button
                        key={rank}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPassaFilterRank(rank);
                        }}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                          passaFilterRank === rank 
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const filtered = availablePoliciais.filter(p => {
                      const searchStr = passaSearchText.toLowerCase();
                      const textMatch = p.nome_completo.toLowerCase().includes(searchStr) ||
                                        p.matricula.includes(searchStr) ||
                                        p.graduacao.toLowerCase().includes(searchStr);
                      
                      if (passaFilterRank === 'TODOS') return textMatch;
                      if (passaFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                      if (passaFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                      if (passaFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                      if (passaFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                      if (passaFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                      return textMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-3 text-xs text-slate-500 italic text-center">
                          Nenhum policial encontrado. Use o texto livre.
                        </div>
                      );
                    }

                    return filtered.map((pol) => {
                      const formattedValue = `${pol.graduacao} ${pol.nome_completo} - RG PM ${pol.matricula}`;
                      return (
                        <button
                          key={pol.matricula}
                          type="button"
                          onMouseDown={() => {
                            setComandanteResponsavel(formattedValue);
                            setPassaSearchText(formattedValue);
                            setPassaDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 transition-colors flex flex-col"
                        >
                          <span className="font-semibold text-slate-200">{pol.graduacao} {pol.nome_completo}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Matrícula/RG PM: {pol.matricula}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Interactive list picker */}
              <div className="mt-1.5 animate-fade-in relative text-left">
                <button
                  type="button"
                  onClick={() => setPassaShowPMSelector(!passaShowPMSelector)}
                  className="text-[10px] text-amber-500 hover:text-amber-450 font-mono flex items-center gap-1 border border-amber-950/40 px-2 py-0.5 bg-amber-950/10 rounded transition cursor-pointer"
                >
                  <Users className="w-2.5 h-2.5 text-amber-500" />
                  <span>{passaShowPMSelector ? 'Ocultar Lista (-)' : 'Pesquisar/Selecionar do Banco PMMT (+)'}</span>
                </button>

                {passaShowPMSelector && (
                  <div className="absolute left-0 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-slate-950 border border-slate-800 shadow-xl z-30 p-2 space-y-2 text-left">
                    <div className="flex flex-wrap gap-1 border-b border-slate-900 pb-1.5">
                      {['TODOS', 'CAP', 'TEN', 'SGT'].map((rank) => (
                        <button
                          key={rank}
                          type="button"
                          onClick={() => setPassaFilterRank(rank)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            passaFilterRank === rank 
                              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-900">
                      {availablePoliciais
                        .filter(p => {
                          const isHighRank = p.graduacao.includes('CAP') || p.graduacao.includes('TEN') || p.graduacao.includes('SGT');
                          if (!isHighRank) return false;
                          
                          if (passaFilterRank === 'TODOS') return true;
                          if (passaFilterRank === 'CAP') return p.graduacao.startsWith('CAP');
                          if (passaFilterRank === 'TEN') return p.graduacao.includes('TEN');
                          if (passaFilterRank === 'SGT') return p.graduacao.includes('SGT');
                          return true;
                        })
                        .map((pol) => {
                          const formattedValue = `${pol.graduacao} ${pol.nome_completo} - RG PM ${pol.matricula}`;
                          const isSelected = comandanteResponsavel === formattedValue;
                          return (
                            <button
                              key={pol.matricula}
                              type="button"
                              onClick={() => {
                                setComandanteResponsavel(formattedValue);
                                setPassaSearchText(formattedValue);
                                setPassaShowPMSelector(false);
                              }}
                              className={`w-full flex items-center justify-between p-1 rounded hover:bg-slate-900 text-left transition text-[10px] ${
                                isSelected 
                                  ? 'bg-amber-500/10 text-amber-200' 
                                  : 'text-slate-400'
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-semibold block text-slate-200">{pol.graduacao} {pol.nome_completo}</span>
                                <span className="text-[9px] font-mono text-slate-500 block">Matrícula/RG PM: {pol.matricula}</span>
                              </div>
                              {isSelected && <span className="text-[10px] text-amber-400 font-bold">✓</span>}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COMANDANTE QUE RECEBE O SERVIÇO */}
            <div className="relative font-sans">
              <label htmlFor="input-recebe-search" className="block text-xs font-mono text-slate-300 uppercase mb-1.5 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Comandante que Recebe o Serviço *</span>
              </label>
              <div className="relative">
                <input
                  id="input-recebe-search"
                  type="text"
                  required
                  value={recebeSearchText}
                  onChange={(e) => {
                    setRecebeSearchText(e.target.value);
                    setComandanteRecebe(e.target.value);
                    setRecebeDropdownOpen(true);
                  }}
                  onFocus={() => setRecebeDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setRecebeDropdownOpen(false), 200);
                  }}
                  placeholder="Pesquise por nome, graduação ou RG..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  autoComplete="off"
                />
                {recebeSearchText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecebeSearchText('');
                      setComandanteRecebe('');
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {recebeDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-slate-950 border border-slate-800 shadow-xl divide-y divide-slate-800 text-left">
                  <div className="p-2 bg-slate-950 flex flex-wrap gap-1 border-b border-slate-900 sticky top-0 z-10">
                    {['TODOS', 'CAP', 'TEN', 'SGT', 'CB', 'SD'].map((rank) => (
                      <button
                        key={rank}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setRecebeFilterRank(rank);
                        }}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                          recebeFilterRank === rank 
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const filtered = availablePoliciais.filter(p => {
                      const searchStr = recebeSearchText.toLowerCase();
                      const textMatch = p.nome_completo.toLowerCase().includes(searchStr) ||
                                        p.matricula.includes(searchStr) ||
                                        p.graduacao.toLowerCase().includes(searchStr);
                      
                      if (recebeFilterRank === 'TODOS') return textMatch;
                      if (recebeFilterRank === 'CAP') return textMatch && p.graduacao.startsWith('CAP');
                      if (recebeFilterRank === 'TEN') return textMatch && p.graduacao.includes('TEN');
                      if (recebeFilterRank === 'SGT') return textMatch && p.graduacao.includes('SGT');
                      if (recebeFilterRank === 'CB') return textMatch && p.graduacao.startsWith('CB');
                      if (recebeFilterRank === 'SD') return textMatch && p.graduacao.startsWith('SD');
                      return textMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-3 text-xs text-slate-500 italic text-center">
                          Nenhum policial encontrado. Use o texto livre.
                        </div>
                      );
                    }

                    return filtered.map((pol) => {
                      const formattedValue = `${pol.graduacao} ${pol.nome_completo} - RG PM ${pol.matricula}`;
                      return (
                        <button
                          key={pol.matricula}
                          type="button"
                          onMouseDown={() => {
                            setComandanteRecebe(formattedValue);
                            setRecebeSearchText(formattedValue);
                            setRecebeDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 transition-colors flex flex-col"
                        >
                          <span className="font-semibold text-slate-200">{pol.graduacao} {pol.nome_completo}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Matrícula/RG PM: {pol.matricula}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Interactive list picker */}
              <div className="mt-1.5 animate-fade-in relative text-left">
                <button
                  type="button"
                  onClick={() => setRecebeShowPMSelector(!recebeShowPMSelector)}
                  className="text-[10px] text-amber-500 hover:text-amber-450 font-mono flex items-center gap-1 border border-amber-950/40 px-2 py-0.5 bg-amber-950/10 rounded transition cursor-pointer"
                >
                  <Users className="w-2.5 h-2.5 text-amber-500" />
                  <span>{recebeShowPMSelector ? 'Ocultar Lista (-)' : 'Pesquisar/Selecionar do Banco PMMT (+)'}</span>
                </button>

                {recebeShowPMSelector && (
                  <div className="absolute left-0 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-slate-950 border border-slate-800 shadow-xl z-30 p-2 space-y-2 text-left">
                    <div className="flex flex-wrap gap-1 border-b border-slate-900 pb-1.5">
                      {['TODOS', 'CAP', 'TEN', 'SGT'].map((rank) => (
                        <button
                          key={rank}
                          type="button"
                          onClick={() => setRecebeFilterRank(rank)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            recebeFilterRank === rank 
                              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-900">
                      {availablePoliciais
                        .filter(p => {
                          const isHighRank = p.graduacao.includes('CAP') || p.graduacao.includes('TEN') || p.graduacao.includes('SGT');
                          if (!isHighRank) return false;
                          
                          if (recebeFilterRank === 'TODOS') return true;
                          if (recebeFilterRank === 'CAP') return p.graduacao.startsWith('CAP');
                          if (recebeFilterRank === 'TEN') return p.graduacao.includes('TEN');
                          if (recebeFilterRank === 'SGT') return p.graduacao.includes('SGT');
                          return true;
                        })
                        .map((pol) => {
                          const formattedValue = `${pol.graduacao} ${pol.nome_completo} - RG PM ${pol.matricula}`;
                          const isSelected = comandanteRecebe === formattedValue;
                          return (
                            <button
                              key={pol.matricula}
                              type="button"
                              onClick={() => {
                                setComandanteRecebe(formattedValue);
                                setRecebeSearchText(formattedValue);
                                setRecebeShowPMSelector(false);
                              }}
                              className={`w-full flex items-center justify-between p-1 rounded hover:bg-slate-900 text-left transition text-[10px] ${
                                isSelected 
                                  ? 'bg-amber-500/10 text-amber-200' 
                                  : 'text-slate-400'
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-semibold block text-slate-200">{pol.graduacao} {pol.nome_completo}</span>
                                <span className="text-[9px] font-mono text-slate-500 block">Matrícula/RG PM: {pol.matricula}</span>
                              </div>
                              {isSelected && <span className="text-[10px] text-amber-400 font-bold">✓</span>}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
          <button
            type="submit"
            disabled={submitting}
            id="btn-salvar-relatorio"
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm rounded-lg py-3 px-5 shadow-lg shadow-amber-950/20 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span>Salvar Relatório Diário de Serviço (RDS-PM)</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            id="btn-limpar-relatorio"
            className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 text-sm font-semibold rounded-lg py-3 px-5 transition duration-150 font-sans"
          >
            Limpar Campos
          </button>
        </div>
      </form>
    </div>
  );
}
