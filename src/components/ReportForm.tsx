/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
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
import { viaturasPMMT } from '../data/viaturas';
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
  X,
  Edit,
  Filter
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

const NATUREZAS_BO = [
  "Tráfico de entorpecentes",
  "Furto",
  "Furto qualificado",
  "Roubo",
  "Roubo majorado",
  "Lesão corporal",
  "Violência doméstica",
  "Ameaça",
  "Desacato",
  "Resistência",
  "Desobediência",
  "Homicídio",
  "Tentativa de homicídio",
  "Receptação",
  "Estelionato",
  "Dano",
  "Apropriação indébita",
  "Porte ilegal de arma",
  "Disparo de arma de fogo",
  "Mandado de prisão",
  "Veículo recuperado",
  "Veículo roubado/furtado",
  "Cumprimento de mandado",
  "Tráfico interestadual",
  "Associação criminosa",
  "Uso ilícito de drogas",
  "Perturbação do sossego",
  "Acidente de trânsito",
  "Embriaguez ao volante",
  "Direção perigosa",
  "Corrupção de menores",
  "Maus tratos",
  "Violação de domicílio",
  "Cárcere privado",
  "Encontrado morto",
  "Suicídio",
  "Tentativa de suicídio",
  "Apoio a outros órgãos",
  "Averiguação",
  "Apoio SAMU",
  "Apoio Conselho Tutelar",
  "Apoio Polícia Civil",
  "Apoio PRF",
  "Outro"
];

const NATUREZAS_TCO = [
  "Perturbação do sossego",
  "Vias de fato",
  "Ameaça",
  "Injúria",
  "Difamação",
  "Calúnia",
  "Desobediência",
  "Desacato",
  "Resistência leve",
  "Posse de droga para consumo",
  "Jogo de azar",
  "Perturbação da tranquilidade",
  "Direção sem habilitação",
  "Entregar veículo a não habilitado",
  "Embriaguez",
  "Omissão de cautela na guarda de animais",
  "Maus tratos a animais",
  "Porte de arma branca",
  "Exercício ilegal da profissão",
  "Dano simples",
  "Violação de domicílio",
  "Perturbação do trabalho",
  "Outras contravenções penais",
  "Outro"
];

export default function ReportForm({ onSubmit, currentUserSession }: ReportFormProps) {
  // Main Report General States
  const [operacao, setOperacao] = useState('');
  const [turno, setTurno] = useState(SHIFT_OPTIONS[0]);
  const [horarioServico, setHorarioServico] = useState(SERVICE_HOURS_OPTIONS[1]);
  const [cidade, setCidade] = useState((currentUserSession && currentUserSession.cidade) || "19ª CIPM - Querência/MT");
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

  // --- NOVOS ESTADOS REQUISITADOS PARA RDS ---
  // 1. Resultados do Serviço
  const [pessoasAbordadas, setPessoasAbordadas] = useState(0);
  const [veiculosAbordados, setVeiculosAbordados] = useState(0);
  const [carrosAbordados, setCarrosAbordados] = useState(0);
  const [motosAbordadas, setMotosAbordadas] = useState(0);

  // 2. Checagens Realizadas (Removidas do formulário mas campo guardado para compatibilidade administrativa)
  const [listaPessoasChecadasTexto, setListaPessoasChecadasTexto] = useState('');

  // 3. Produtividade Diária
  const [tcoRegistrados, setTcoRegistrados] = useState(0);
  const [prisoesFlagrante, setPrisoesFlagrante] = useState(0);
  const [pessoasConduzidasDepol, setPessoasConduzidasDepol] = useState(0);

  // 4. Apreensões (Novos campos)
  const [veiculosApreendidos, setVeiculosApreendidos] = useState(0);
  const [armaBrancaApreendida, setArmaBrancaApreendida] = useState(0);
  const [numAutosRemocao, setNumAutosRemocao] = useState(0);
  const [veiculosNotificados, setVeiculosNotificados] = useState(0);
  const [veiculosRecuperados, setVeiculosRecuperados] = useState(0);
  const [diversosApreendidos, setDiversosApreendidos] = useState('');

  // 5. BO / TCO Form específico para cálculo de apreensões automático
  const [boPrisaoFlagrante, setBoPrisaoFlagrante] = useState<number>(0);
  const [boArmasDeFogo, setBoArmasDeFogo] = useState<number>(0);
  const [boDrogasPeso, setBoDrogasPeso] = useState<number>(0);
  const [boMunicoes, setBoMunicoes] = useState<number>(0);
  const [boValores, setBoValores] = useState<number>(0);
  const [boVeiculosApreendidos, setBoVeiculosApreendidos] = useState<number>(0);

  const [tcoPessoasConduzidas, setTcoPessoasConduzidas] = useState<number>(0);
  const [tcoArmasDeFogo, setTcoArmasDeFogo] = useState<number>(0);
  const [tcoDrogasPeso, setTcoDrogasPeso] = useState<number>(0);
  const [tcoMunicoes, setTcoMunicoes] = useState<number>(0);
  const [tcoValores, setTcoValores] = useState<number>(0);
  const [tcoVeiculosApreendidos, setTcoVeiculosApreendidos] = useState<number>(0);

  // 6. Administrativo e Serviços Internos Estaduais
  const [listaAdministrativo, setListaAdministrativo] = useState<any[]>([]);
  const [adminSelectedPolicialMatricula, setAdminSelectedPolicialMatricula] = useState('');
  const [adminFuncao, setAdminFuncao] = useState('Auxiliar Sistêmico');
  const [adminHorario, setAdminHorario] = useState('08h00min às 12h00min e 14h00min às 18h00min');

  // New Custom fleet VTR Addition Fields
  const [newVtrModelo, setNewVtrModelo] = useState('');
  const [newVtrPlaca, setNewVtrPlaca] = useState('');

  // 7. Ocorrências do turno (Campos do form rápido)
  const [ocoTurnoBairro, setOcoTurnoBairro] = useState('');
  const [ocoTurnoNatureza, setOcoTurnoNatureza] = useState(NATUREZAS_BO[0]);
  const [ocoTurnoNumero, setOcoTurnoNumero] = useState('');
  const [ocoTurnoHora, setOcoTurnoHora] = useState('');

  // 7. Pontos Demonstrativos
  const [barreirasPoliciais, setBarreirasPoliciais] = useState(0);
  const [patrulhamentoRural, setPatrulhamentoRural] = useState(0);
  const [pontosDemonstrativos, setPontosDemonstrativos] = useState(0);
  const [rondasComerciais, setRondasComerciais] = useState(0);

  // 1. RELATIONAL CHILD TABLE: VIATURAS
  const [listaViaturas, setListaViaturas] = useState<Viatura[]>([]);
  
  // Available list loaded from Supabase Database
  const [availableViaturas, setAvailableViaturas] = useState<Viatura[]>([]);
  const [loadingViaturas, setLoadingViaturas] = useState(false);

  // Viatura Row Form Fields
  const [selectedViaturaId, setSelectedViaturaId] = useState<string | number>('');
  const [selectedViaturaObj, setSelectedViaturaObj] = useState<Viatura | null>(null);
  
  // Fuel supply input values
  const [vtrKmAbastecimento, setVtrKmAbastecimento] = useState<number | ''>('');
  const [vtrLitros, setVtrLitros] = useState<number | ''>('');
  const [vtrSaldoRestante, setVtrSaldoRestante] = useState<number | ''>('');
  const [vtrValorAbastecido, setVtrValorAbastecido] = useState<number | ''>('');

  // Fetch available active vehicles from the database/localStorage on mount
  useEffect(() => {
    let active = true;
    const fetchActiveFleet = async () => {
      setLoadingViaturas(true);
      try {
        const { data, error } = await supabase
          .from('viaturas')
          .select('*')
          .order('modelo', { ascending: true });

        if (error) {
          throw error;
        }

        if (active) {
          // Check for stale Hilux "OBO-4412" or duplicates in DB records
          const hasOldHilux = data && data.some(v => v.placa === 'OBO-4412');
          const platesSeen = new Set<string>();
          let hasDuplicates = false;
          if (data) {
            for (const v of data) {
              if (platesSeen.has(v.placa)) {
                hasDuplicates = true;
                break;
              }
              platesSeen.add(v.placa);
            }
          }

          if (hasOldHilux || hasDuplicates || !data || data.length === 0) {
            // Re-seed defaults
            const defaultList: Viatura[] = viaturasPMMT.map((v, i) => ({
              id: "local-" + (i + 1),
              modelo: v.modelo,
              placa: v.placa,
              chassi: v.chassi,
              renavam: v.renavam,
              observacao_operacional: v.observacao,
              ativo: true
            }));
            localStorage.setItem('rdspm_viaturas', JSON.stringify(defaultList));
            setAvailableViaturas(defaultList);

            // Seed to DB in background
            try {
              await supabase.from('viaturas').delete().neq('id', 0);
              const seedListForDb = viaturasPMMT.map(v => ({
                modelo: v.modelo,
                placa: v.placa,
                chassi: v.chassi,
                renavam: v.renavam,
                observacao_operacional: v.observacao,
                ativo: true
              }));
              const { data: dbData } = await supabase.from('viaturas').insert(seedListForDb).select();
              if (dbData && dbData.length > 0) {
                localStorage.setItem('rdspm_viaturas', JSON.stringify(dbData));
                const activeOnly = dbData.filter(v => v.ativo ?? true);
                setAvailableViaturas(activeOnly);
              }
            } catch (se) {
              console.warn('[REPORT-FORM] Background DB fleet re-seed failed:', se);
            }
          } else {
            localStorage.setItem('rdspm_viaturas', JSON.stringify(data));
            const activeOnly = data.filter(v => v.ativo ?? true);
            setAvailableViaturas(activeOnly);
          }
        }
      } catch (err) {
        console.warn('[REPORT-FORM] Error fetching active fleet from Supabase, applying localStorage:', err);
        if (active) {
          const cached = localStorage.getItem('rdspm_viaturas');
          if (cached) {
            const parsed: Viatura[] = JSON.parse(cached);
            const hasOldHilux = parsed.some(v => v.placa === 'OBO-4412');
            const cachePlates = new Set<string>();
            let hasCacheDuplicates = false;
            for (const v of parsed) {
              if (cachePlates.has(v.placa)) {
                hasCacheDuplicates = true;
                break;
              }
              cachePlates.add(v.placa);
            }

            if (hasOldHilux || hasCacheDuplicates) {
              const defaultList: Viatura[] = viaturasPMMT.map((v, i) => ({
                id: "local-" + (i + 1),
                modelo: v.modelo,
                placa: v.placa,
                chassi: v.chassi,
                renavam: v.renavam,
                observacao_operacional: v.observacao,
                ativo: true
              }));
              localStorage.setItem('rdspm_viaturas', JSON.stringify(defaultList));
              setAvailableViaturas(defaultList);
            } else {
              const activeOnly = parsed.filter(v => v.ativo ?? true);
              setAvailableViaturas(activeOnly);
            }
          } else {
            const defaultList: Viatura[] = viaturasPMMT.map((v, i) => ({
              id: "local-" + (i + 1),
              modelo: v.modelo,
              placa: v.placa,
              chassi: v.chassi,
              renavam: v.renavam,
              observacao_operacional: v.observacao,
              ativo: true
            }));
            localStorage.setItem('rdspm_viaturas', JSON.stringify(defaultList));
            setAvailableViaturas(defaultList);
          }
        }
      } finally {
        if (active) setLoadingViaturas(false);
      }
    };
    fetchActiveFleet();
    return () => {
      active = false;
    };
  }, []);

  // Sync chosen vehicle info when selection changes
  useEffect(() => {
    if (selectedViaturaId) {
      const match = availableViaturas.find(v => String(v.id) === String(selectedViaturaId));
      setSelectedViaturaObj(match || null);
    } else {
      setSelectedViaturaObj(null);
    }
  }, [selectedViaturaId, availableViaturas]);

  // Seeding initial default vehicles and auto-filling KM Inicial from last reports
  useEffect(() => {
    const initializeFleetAndKms = async () => {
      // 1. Set the initial 4 fixed vehicles
      const fixedBase: Viatura[] = [
        { id: "fixed-1", modelo: "KICKS", placa: "SPQ-5151", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true },
        { id: "fixed-2", modelo: "DUSTER", placa: "SPU-1C95", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true },
        { id: "fixed-3", modelo: "TRITON", placa: "RRX-3B80", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true },
        { id: "fixed-4", modelo: "TRITON RURAL", placa: "RRP-0I46", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true }
      ];

      // Add custom ones added by user in current session or previous sessions
      const savedCustom = localStorage.getItem('rdspm_custom_viaturas');
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed)) {
            parsed.forEach(c => {
              if (!fixedBase.some(b => b.placa.toUpperCase() === c.placa.toUpperCase())) {
                fixedBase.push(c);
              }
            });
          }
        } catch (e) {}
      }

      // Feed this to current list
      let currentList = [...fixedBase];

      // 2. Fetch recent reports from database to auto-fill KMs
      try {
        const { data, error } = await supabase
          .from('relatorios')
          .select('id, created_at, lista_viaturas')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          const lastKmsByPlate: { [plate: string]: number } = {};

          // Scan oldest to newest of the fetched batch to let the newest override
          for (let i = data.length - 1; i >= 0; i--) {
            const report = data[i];
            let vtrs: Viatura[] = [];
            if (typeof report.lista_viaturas === 'string') {
              try { vtrs = JSON.parse(report.lista_viaturas); } catch (e) {}
            } else if (Array.isArray(report.lista_viaturas)) {
              vtrs = report.lista_viaturas;
            }

            if (Array.isArray(vtrs)) {
              vtrs.forEach(v => {
                const plateUpper = v.placa.trim().toUpperCase();
                const kmFinal = Number(v.km_final) || 0;
                if (kmFinal > 0) {
                  lastKmsByPlate[plateUpper] = kmFinal;
                }
              });
            }
          }

          // Apply to our base list
          currentList = currentList.map(v => {
            const plateUpper = v.placa.trim().toUpperCase();
            if (lastKmsByPlate[plateUpper] !== undefined) {
              return {
                ...v,
                km_inicial: lastKmsByPlate[plateUpper]
              };
            }
            return v;
          });
        }
      } catch (err) {
        console.warn('[REPORT-FORM] Fetching latest report KMs failed:', err);
      }

      setListaViaturas(currentList);

      // Enforce custom fleet in availableViaturas for dropdown/occurrences
      setAvailableViaturas(prev => {
        const updated = [...prev];
        fixedBase.forEach(f => {
          if (!updated.some(u => u.placa.toUpperCase() === f.placa.toUpperCase())) {
            updated.push(f);
          }
        });
        return updated;
      });
    };

    initializeFleetAndKms();
  }, [availableViaturas.length]);

  // 2. RELATIONAL CHILD TABLE: OCORRÊNCIAS
  const [listaOcorrencias, setListaOcorrencias] = useState<OcorrenciaItem[]>([
    {
      tipo: 'BO',
      natureza_ocorrencia: 'Apreensão de Foragido da Justiça',
      rua_avenida: 'Av. Mato Grosso',
      bairro: 'CPA II',
      cidade: 'Querência',
      data: '2026-05-23',
      hora: '10:30',
      guarnicao_responsavel: 'Força Tática 1902',
      viatura_id_placa: 'Triton L200 - RRX3B80',
      qtd_envolvidos: 1,
      observacoes: 'Durante patrulhamento táctico, o suspeito foi localizado e constatado mandado de prisão em aberto contra o mesmo.',
      objetos_apreendidos: 'Nenhum',
      drogas_apreendidas: 'Nenhum',
      armas_apreendidas_texto: 'Nenhum',
      observacoes_finais: 'Suspeito encaminhado para a delegacia de Querência.',
      ocorrencia_bo: 'BO-2026.11024',
      suspeitos_conduzidos: 1,
      local_fato: 'Av. Mato Grosso, CPA II, Querência'
    }
  ]);

  // Combined occurrences view & creation states
  const [ocoActiveTab, setOcoActiveTab] = useState<'BO' | 'TCO'>('BO');
  const [editingOcoIndex, setEditingOcoIndex] = useState<number | null>(null);

  // BO Form Fields
  const [boNatureza, setBoNatureza] = useState(NATUREZAS_BO[0]);
  const [boNaturezaOutro, setBoNaturezaOutro] = useState('');
  const [boRua, setBoRua] = useState('');
  const [boBairro, setBoBairro] = useState('');
  const [boCidade, setBoCidade] = useState('Querência');
  const [boData, setBoData] = useState(() => new Date().toISOString().substring(0, 10));
  const [boHora, setBoHora] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [boGuarnicao, setBoGuarnicao] = useState('');
  const [boViatura, setBoViatura] = useState('');
  const [boQtdEnvolvidos, setBoQtdEnvolvidos] = useState(1);
  const [boRelatoCompleto, setBoRelatoCompleto] = useState('');
  const [boObjetosApreendidos, setBoObjetosApreendidos] = useState('');
  const [boDrogasApreendidas, setBoDrogasApreendidas] = useState('');
  const [boArmasApreendidas, setBoArmasApreendidas] = useState('');
  const [boObservacoesFinais, setBoObservacoesFinais] = useState('');

  // TCO Form Fields
  const [tcoNatureza, setTcoNatureza] = useState(NATUREZAS_TCO[0]);
  const [tcoNaturezaOutro, setTcoNaturezaOutro] = useState('');
  const [tcoAutor, setTcoAutor] = useState('');
  const [tcoVitima, setTcoVitima] = useState('');
  const [tcoRua, setTcoRua] = useState('');
  const [tcoBairro, setTcoBairro] = useState('');
  const [tcoCidade, setTcoCidade] = useState('Querência');
  const [tcoData, setTcoData] = useState(() => new Date().toISOString().substring(0, 10));
  const [tcoHora, setTcoHora] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [tcoRelatoResumido, setTcoRelatoResumido] = useState('');
  const [tcoObjetosApreendidos, setTcoObjetosApreendidos] = useState('');
  const [tcoObservacoes, setTcoObservacoes] = useState('');

  // Occurrence query filter states
  const [ocoFilterNatureza, setOcoFilterNatureza] = useState('');
  const [ocoFilterData, setOcoFilterData] = useState('');
  const [ocoFilterPolicial, setOcoFilterPolicial] = useState('');
  const [ocoFilterBairro, setOcoFilterBairro] = useState('');
  const [ocoFilterViatura, setOcoFilterViatura] = useState('');

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
  const [gHorarioInicial, setGHorarioInicial] = useState('07:00');
  const [gHorarioFinal, setGHorarioFinal] = useState('19:00');

  // 5. ATIVIDADE DELEGADA
  const [listaAtividadesDelegadas, setListaAtividadesDelegadas] = useState<AtividadeDelegadaItem[]>([
    {
      nome_equipe: 'Equipe Cidade Querência',
      viatura: 'VTR-1933 (Renault Duster) [Placa: QRE-1234]',
      policiais: 'Cb PM Douglas (RG: 12245) [Comandante], Sd PM Lima (RG: 45543) [Motorista]',
      local_operacao: 'Centro Comercial de Querência',
      horario: '08:00 às 14:00',
      observacoes: 'Policiamento ostensivo preventivo intensificado nos comércios.'
    }
  ]);
  const [adNomeEquipe, setAdNomeEquipe] = useState('');
  const [adLocalOperacao, setAdLocalOperacao] = useState('');
  const [adHorario, setAdHorario] = useState('08:00 às 14:00');
  const [adObservacoes, setAdObservacoes] = useState('');

  // 6. JORNADA EXTRAORDINÁRIA
  const [listaJornadasExtraordinarias, setListaJornadasExtraordinarias] = useState<JornadaExtraordinariaItem[]>([
    {
      nome_equipe: 'Reforço Noturno Querência',
      viatura: 'VTR-1944 (Toyota Hilux) [Placa: TOY-9988]',
      policiais: 'Sgt PM Mota (RG: 99112) [Comandante], Sd PM Antunes (RG: 88112) [Motorista]',
      tipo_reforco: 'Saturação de Área',
      horario: '18:00 às 23:00',
      observacoes: 'Saturação intensiva com foco no perímetro comercial bancário.'
    }
  ]);
  const [jeNomeEquipe, setJeNomeEquipe] = useState('');
  const [jeTipoReforco, setJeTipoReforco] = useState('Policiamento Ostensivo');
  const [jeHorario, setJeHorario] = useState('18:00 às 23:00');
  const [jeObservacoes, setJeObservacoes] = useState('');

  // --- NOVOS CAMPOS RICOS PARA COMPOSIÇÃO DE GUARNIÇÃO COM SELECTS (SUPABASE) ---
  const [gComandanteMatricula, setGComandanteMatricula] = useState('');
  const [gMotoristaMatricula, setGMotoristaMatricula] = useState('');
  const [gPatrulheirosMatriculas, setGPatrulheirosMatriculas] = useState<string[]>([]);
  const [gSelectedViaturaId, setGSelectedViaturaId] = useState<string | number>('');
  const [gViaturaModelo, setGViaturaModelo] = useState('');
  const [gViaturaPlaca, setGViaturaPlaca] = useState('');
  const [gViaturaChassi, setGViaturaChassi] = useState('');
  const [gViaturaRenavam, setGViaturaRenavam] = useState('');
  const [gViaturaObservacao, setGViaturaObservacao] = useState('');
  const [gTipoOutro, setGTipoOutro] = useState('');
  const [gEditingIndex, setGEditingIndex] = useState<number | null>(null);

  // --- NOVOS CAMPOS PARA ATIVIDADE DELEGADA ---
  const [adComandanteMatricula, setAdComandanteMatricula] = useState('');
  const [adMotoristaMatricula, setAdMotoristaMatricula] = useState('');
  const [adPatrulheirosMatriculas, setAdPatrulheirosMatriculas] = useState<string[]>([]);
  const [adSelectedViaturaId, setAdSelectedViaturaId] = useState<string | number>('');
  const [adViaturaModelo, setAdViaturaModelo] = useState('');
  const [adViaturaPlaca, setAdViaturaPlaca] = useState('');
  const [adViaturaChassi, setAdViaturaChassi] = useState('');
  const [adViaturaRenavam, setAdViaturaRenavam] = useState('');
  const [adViaturaObservacao, setAdViaturaObservacao] = useState('');
  const [adEditingIndex, setAdEditingIndex] = useState<number | null>(null);

  // --- NOVOS CAMPOS PARA JORNADA EXTRAORDINÁRIA ---
  const [jeComandanteMatricula, setJeComandanteMatricula] = useState('');
  const [jeMotoristaMatricula, setJeMotoristaMatricula] = useState('');
  const [jePatrulheirosMatriculas, setJePatrulheirosMatriculas] = useState<string[]>([]);
  const [jeSelectedViaturaId, setJeSelectedViaturaId] = useState<string | number>('');
  const [jeViaturaModelo, setJeViaturaModelo] = useState('');
  const [jeViaturaPlaca, setJeViaturaPlaca] = useState('');
  const [jeViaturaChassi, setJeViaturaChassi] = useState('');
  const [jeViaturaRenavam, setJeViaturaRenavam] = useState('');
  const [jeViaturaObservacao, setJeViaturaObservacao] = useState('');
  const [jeEditingIndex, setJeEditingIndex] = useState<number | null>(null);
  const [jeTipoOutro, setJeTipoOutro] = useState('');

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
    setListaViaturas([
      { id: "fixed-1", modelo: "KICKS", placa: "SPQ-5151", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true },
      { id: "fixed-2", modelo: "DUSTER", placa: "SPU-1C95", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true },
      { id: "fixed-3", modelo: "TRITON", placa: "RRX-3B80", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true },
      { id: "fixed-4", modelo: "TRITON RURAL", placa: "RRP-0I46", local: "19ª CIPM", situacao: "SERVIÇO DIÁRIO", km_inicial: 0, km_final: 0, km_abastecimento: 0, litros: 0, valor_abastecido: 0, saldo: 0, ativo: true }
    ]);
    setSelectedViaturaId('');
    setSelectedViaturaObj(null);
    setVtrKmAbastecimento('');
    setVtrLitros('');
    setVtrSaldoRestante('');
    setVtrValorAbastecido('');
    setListaOcorrencias([]);
    setListaAnexos([]);
    setListaGuarnicoes([]);
    setListaAtividadesDelegadas([]);
    setListaJornadasExtraordinarias([]);
    setListaAdministrativo([]);
    setAdminSelectedPolicialMatricula('');
    setAdminFuncao('Auxiliar Sistêmico');
    setAdminHorario('08h00min às 12h00min e 14h00min às 18h00min');
    setGNome('');
    setGComandanteMatricula('');
    setGMotoristaMatricula('');
    setGPatrulheirosMatriculas([]);
    setGSelectedViaturaId('');
    setGViaturaModelo('');
    setGViaturaPlaca('');
    setGViaturaChassi('');
    setGViaturaRenavam('');
    setGViaturaObservacao('');
    setGTipoOutro('');
    setGHorarioInicial('07:00');
    setGHorarioFinal('19:00');
    setGEditingIndex(null);

    setAdNomeEquipe('');
    setAdComandanteMatricula('');
    setAdMotoristaMatricula('');
    setAdPatrulheirosMatriculas([]);
    setAdSelectedViaturaId('');
    setAdViaturaModelo('');
    setAdViaturaPlaca('');
    setAdViaturaChassi('');
    setAdViaturaRenavam('');
    setAdViaturaObservacao('');
    setAdLocalOperacao('');
    setAdHorario('08:00 às 14:00');
    setAdObservacoes('');
    setAdEditingIndex(null);

    setJeNomeEquipe('');
    setJeComandanteMatricula('');
    setJeMotoristaMatricula('');
    setJePatrulheirosMatriculas([]);
    setJeSelectedViaturaId('');
    setJeViaturaModelo('');
    setJeViaturaPlaca('');
    setJeViaturaChassi('');
    setJeViaturaRenavam('');
    setJeViaturaObservacao('');
    setJeTipoReforco('Policiamento Ostensivo');
    setJeTipoOutro('');
    setJeHorario('18:00 às 23:00');
    setJeObservacoes('');
    setJeEditingIndex(null);

    // --- RESET DO LANÇAMENTO DE RDS OPERACIONAL ---
    setPessoasAbordadas(0);
    setCarrosAbordados(0);
    setMotosAbordadas(0);
    setPessoasChecadas(0);
    setCarrosChecados(0);
    setMotosChecadas(0);
    setListaPessoasChecadasTexto('');
    setTcoRegistrados(0);
    setPrisoesFlagrante(0);
    setPessoasConduzidasDepol(0);
    setVeiculosApreendidos(0);
    setArmaBrancaApreendida(0);
    setNumAutosRemocao(0);
    setVeiculosNotificados(0);
    setVeiculosRecuperados(0);
    setDiversosApreendidos('');
    setOcoTurnoBairro('');
    setOcoTurnoNatureza(NATUREZAS_BO[0]);
    setOcoTurnoNumero('');
    setOcoTurnoHora('');
    setBarreirasPoliciais(0);
    setPatrulhamentoRural(0);
    setPontosDemonstrativos(0);
    setRondasComerciais(0);

    setComandanteRecebe('');
    setRecebeSearchText('');
  };

  // Handlers for Guarnição Ordinária
  const handleAddGuarnicao = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!gNome.trim()) {
      alert('Por favor, informe o Nome da Guarnição.');
      return;
    }
    
    // Comandante Obj
    const pmComandante = availablePoliciais.find(p => p.matricula === gComandanteMatricula);
    if (!pmComandante) {
      alert('Por favor, selecione o Comandante.');
      return;
    }

    // Motorista Obj
    const pmMotorista = availablePoliciais.find(p => p.matricula === gMotoristaMatricula);
    if (!pmMotorista) {
      alert('Por favor, selecione o Motorista.');
      return;
    }

    // Patrulheiros list
    const activePatrulheiros = gPatrulheirosMatriculas
      .map(m => availablePoliciais.find(p => p.matricula === m))
      .filter((p): p is NonNullable<typeof p> => !!p);

    // Auto-filled Viatura
    if (!gViaturaModelo || !gViaturaPlaca) {
      alert('Por favor, selecione uma viatura empenhada.');
      return;
    }

    // Format Policiais Integrantes
    const formatPM = (p: typeof pmComandante, label: string) => `${p.graduacao} ${p.nome_completo} (Mat: ${p.matricula}) [${label}]`;
    const parts = [
      formatPM(pmComandante, 'Comandante'),
      formatPM(pmMotorista, 'Motorista'),
      ...activePatrulheiros.map(p => formatPM(p, 'Patrulheiro'))
    ];
    const policialStr = parts.join(', ');

    const formattedVtr = `${gViaturaModelo} [Placa: ${gViaturaPlaca}]${gViaturaChassi ? ` (Chassi: ${gViaturaChassi})` : ''}${gViaturaRenavam ? ` (Renavam: ${gViaturaRenavam})` : ''}`;

    const row: GuarnicaoItem = {
      nome_guarnicao: gNome.trim(),
      tipo_guarnicao: (gTipo === 'Outro' ? 'Outro' : gTipo) as any,
      tipo_guarnicao_outro: gTipo === 'Outro' ? gTipoOutro.trim() : undefined,
      viatura: formattedVtr,
      policiais_integrantes: policialStr,
      comandante_guarnicao: `${pmComandante.graduacao} ${pmComandante.nome_completo}`,
      horario_inicial: gHorarioInicial,
      horario_final: gHorarioFinal,
      ...({
        comandante_matricula: gComandanteMatricula,
        motorista_matricula: gMotoristaMatricula,
        patrulheiros_matriculas: gPatrulheirosMatriculas,
        viatura_id: gSelectedViaturaId,
        viatura_modelo: gViaturaModelo,
        viatura_placa: gViaturaPlaca,
        viatura_chassi: gViaturaChassi,
        viatura_renavam: gViaturaRenavam,
        viatura_observacao: gViaturaObservacao,
      } as any)
    };

    if (gEditingIndex !== null) {
      const listCopy = [...listaGuarnicoes];
      listCopy[gEditingIndex] = row;
      setListaGuarnicoes(listCopy);
      setGEditingIndex(null);
    } else {
      setListaGuarnicoes([...listaGuarnicoes, row]);
    }

    // Clear Form fields
    setGNome('');
    setGTipo('Rádio Patrulha');
    setGTipoOutro('');
    setGComandanteMatricula('');
    setGMotoristaMatricula('');
    setGPatrulheirosMatriculas([]);
    setGSelectedViaturaId('');
    setGViaturaModelo('');
    setGViaturaPlaca('');
    setGViaturaChassi('');
    setGViaturaRenavam('');
    setGViaturaObservacao('');
    setGHorarioInicial('07:00');
    setGHorarioFinal('19:00');
  };

  const handleEditGuarnicao = (index: number) => {
    const g = listaGuarnicoes[index];
    const anyG = g as any;
    setGNome(g.nome_guarnicao);
    setGTipo(g.tipo_guarnicao);
    setGTipoOutro(g.tipo_guarnicao_outro || '');
    
    setGComandanteMatricula(anyG.comandante_matricula || '');
    setGMotoristaMatricula(anyG.motorista_matricula || '');
    setGPatrulheirosMatriculas(anyG.patrulheiros_matriculas || []);
    setGSelectedViaturaId(anyG.viatura_id || '');
    setGViaturaModelo(anyG.viatura_modelo || '');
    setGViaturaPlaca(anyG.viatura_placa || '');
    setGViaturaChassi(anyG.viatura_chassi || '');
    setGViaturaRenavam(anyG.viatura_renavam || '');
    setGViaturaObservacao(anyG.viatura_observacao || '');
    setGHorarioInicial(g.horario_inicial);
    setGHorarioFinal(g.horario_final);
    setGEditingIndex(index);
  };

  const handleRemoveGuarnicao = (index: number) => {
    setListaGuarnicoes(listaGuarnicoes.filter((_, idx) => idx !== index));
    if (gEditingIndex === index) {
      setGEditingIndex(null);
    }
  };

  // Handlers for Atividade Delegada
  const handleAddAtividadeDelegada = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!adNomeEquipe.trim()) {
      alert('Por favor, informe o Nome da Equipe.');
      return;
    }

    const pmComandante = availablePoliciais.find(p => p.matricula === adComandanteMatricula);
    if (!pmComandante) {
      alert('Por favor, selecione o Comandante.');
      return;
    }

    const pmMotorista = availablePoliciais.find(p => p.matricula === adMotoristaMatricula);
    if (!pmMotorista) {
      alert('Por favor, selecione o Motorista.');
      return;
    }

    const activePatrulheiros = adPatrulheirosMatriculas
      .map(m => availablePoliciais.find(p => p.matricula === m))
      .filter((p): p is NonNullable<typeof p> => !!p);

    if (!adViaturaModelo || !adViaturaPlaca) {
      alert('Por favor, selecione uma viatura.');
      return;
    }

    const formatPM = (p: typeof pmComandante, label: string) => `${p.graduacao} ${p.nome_completo} (Mat: ${p.matricula}) [${label}]`;
    const parts = [
      formatPM(pmComandante, 'Comandante'),
      formatPM(pmMotorista, 'Motorista'),
      ...activePatrulheiros.map(p => formatPM(p, 'Patrulheiro'))
    ];
    const policialStr = parts.join(', ');

    const formattedVtr = `${adViaturaModelo} [Placa: ${adViaturaPlaca}]${adViaturaChassi ? ` (Chassi: ${adViaturaChassi})` : ''}${adViaturaRenavam ? ` (Renavam: ${adViaturaRenavam})` : ''}`;

    const row: AtividadeDelegadaItem = {
      nome_equipe: adNomeEquipe.trim(),
      viatura: formattedVtr,
      policiais: policialStr,
      local_operacao: adLocalOperacao.trim(),
      horario: adHorario,
      observacoes: adObservacoes.trim() || undefined,
      ...({
        comandante_matricula: adComandanteMatricula,
        motorista_matricula: adMotoristaMatricula,
        patrulheiros_matriculas: adPatrulheirosMatriculas,
        viatura_id: adSelectedViaturaId,
        viatura_modelo: adViaturaModelo,
        viatura_placa: adViaturaPlaca,
        viatura_chassi: adViaturaChassi,
        viatura_renavam: adViaturaRenavam,
        viatura_observacao: adViaturaObservacao,
      } as any)
    };

    if (adEditingIndex !== null) {
      const listCopy = [...listaAtividadesDelegadas];
      listCopy[adEditingIndex] = row;
      setListaAtividadesDelegadas(listCopy);
      setAdEditingIndex(null);
    } else {
      setListaAtividadesDelegadas([...listaAtividadesDelegadas, row]);
    }

    // Clear fields
    setAdNomeEquipe('');
    setAdComandanteMatricula('');
    setAdMotoristaMatricula('');
    setAdPatrulheirosMatriculas([]);
    setAdSelectedViaturaId('');
    setAdViaturaModelo('');
    setAdViaturaPlaca('');
    setAdViaturaChassi('');
    setAdViaturaRenavam('');
    setAdViaturaObservacao('');
    setAdLocalOperacao('');
    setAdHorario('08:00 às 14:00');
    setAdObservacoes('');
  };

  const handleEditAtividadeDelegada = (index: number) => {
    const ad = listaAtividadesDelegadas[index];
    const anyAd = ad as any;
    setAdNomeEquipe(ad.nome_equipe);
    setAdComandanteMatricula(anyAd.comandante_matricula || '');
    setAdMotoristaMatricula(anyAd.motorista_matricula || '');
    setAdPatrulheirosMatriculas(anyAd.patrulheiros_matriculas || []);
    setAdSelectedViaturaId(anyAd.viatura_id || '');
    setAdViaturaModelo(anyAd.viatura_modelo || '');
    setAdViaturaPlaca(anyAd.viatura_placa || '');
    setAdViaturaChassi(anyAd.viatura_chassi || '');
    setAdViaturaRenavam(anyAd.viatura_renavam || '');
    setAdViaturaObservacao(anyAd.viatura_observacao || '');
    setAdLocalOperacao(ad.local_operacao);
    setAdHorario(ad.horario);
    setAdObservacoes(ad.observacoes || '');
    setAdEditingIndex(index);
  };

  const handleRemoveAtividadeDelegada = (index: number) => {
    setListaAtividadesDelegadas(listaAtividadesDelegadas.filter((_, idx) => idx !== index));
    if (adEditingIndex === index) {
      setAdEditingIndex(null);
    }
  };

  // Handlers for Jornada Extraordinária
  const handleAddJornadaExtra = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!jeNomeEquipe.trim()) {
      alert('Por favor, informe o Nome da Equipe.');
      return;
    }

    const pmComandante = availablePoliciais.find(p => p.matricula === jeComandanteMatricula);
    if (!pmComandante) {
      alert('Por favor, selecione o Comandante.');
      return;
    }

    const pmMotorista = availablePoliciais.find(p => p.matricula === jeMotoristaMatricula);
    if (!pmMotorista) {
      alert('Por favor, selecione o Motorista.');
      return;
    }

    const activePatrulheiros = jePatrulheirosMatriculas
      .map(m => availablePoliciais.find(p => p.matricula === m))
      .filter((p): p is NonNullable<typeof p> => !!p);

    if (!jeViaturaModelo || !jeViaturaPlaca) {
      alert('Por favor, selecione uma viatura.');
      return;
    }

    const finalTipo = jeTipoReforco === 'Outro' ? jeTipoOutro.trim() : jeTipoReforco;
    if (!finalTipo) {
      alert('Por favor, escolha o tipo de reforço.');
      return;
    }

    const formatPM = (p: typeof pmComandante, label: string) => `${p.graduacao} ${p.nome_completo} (Mat: ${p.matricula}) [${label}]`;
    const parts = [
      formatPM(pmComandante, 'Comandante'),
      formatPM(pmMotorista, 'Motorista'),
      ...activePatrulheiros.map(p => formatPM(p, 'Patrulheiro'))
    ];
    const policialStr = parts.join(', ');

    const formattedVtr = `${jeViaturaModelo} [Placa: ${jeViaturaPlaca}]${jeViaturaChassi ? ` (Chassi: ${jeViaturaChassi})` : ''}${jeViaturaRenavam ? ` (Renavam: ${jeViaturaRenavam})` : ''}`;

    const row: JornadaExtraordinariaItem = {
      nome_equipe: jeNomeEquipe.trim(),
      viatura: formattedVtr,
      policiais: policialStr,
      tipo_reforco: finalTipo,
      horario: jeHorario,
      observacoes: jeObservacoes.trim() || undefined,
      ...({
        tipo_reforco_opcao: jeTipoReforco,
        tipo_reforco_outro: jeTipoReforco === 'Outro' ? jeTipoOutro : undefined,
        comandante_matricula: jeComandanteMatricula,
        motorista_matricula: jeMotoristaMatricula,
        patrulheiros_matriculas: jePatrulheirosMatriculas,
        viatura_id: jeSelectedViaturaId,
        viatura_modelo: jeViaturaModelo,
        viatura_placa: jeViaturaPlaca,
        viatura_chassi: jeViaturaChassi,
        viatura_renavam: jeViaturaRenavam,
        viatura_observacao: jeViaturaObservacao,
      } as any)
    };

    if (jeEditingIndex !== null) {
      const listCopy = [...listaJornadasExtraordinarias];
      listCopy[jeEditingIndex] = row;
      setListaJornadasExtraordinarias(listCopy);
      setJeEditingIndex(null);
    } else {
      setListaJornadasExtraordinarias([...listaJornadasExtraordinarias, row]);
    }

    // Clear fields
    setJeNomeEquipe('');
    setJeComandanteMatricula('');
    setJeMotoristaMatricula('');
    setJePatrulheirosMatriculas([]);
    setJeSelectedViaturaId('');
    setJeViaturaModelo('');
    setJeViaturaPlaca('');
    setJeViaturaChassi('');
    setJeViaturaRenavam('');
    setJeViaturaObservacao('');
    setJeTipoReforco('Policiamento Ostensivo');
    setJeTipoOutro('');
    setJeHorario('18:00 às 23:00');
    setJeObservacoes('');
  };

  const handleEditJornadaExtra = (index: number) => {
    const je = listaJornadasExtraordinarias[index];
    const anyJe = je as any;
    setJeNomeEquipe(je.nome_equipe);
    
    const rawOption = anyJe.tipo_reforco_opcao || 
      (['Policiamento Ostensivo', 'Saturação de Área', 'Ronda Escolar'].includes(je.tipo_reforco) ? je.tipo_reforco : 'Outro');
    setJeTipoReforco(rawOption);
    if (rawOption === 'Outro') {
      setJeTipoOutro(anyJe.tipo_reforco_outro || je.tipo_reforco);
    } else {
      setJeTipoOutro('');
    }

    setJeComandanteMatricula(anyJe.comandante_matricula || '');
    setJeMotoristaMatricula(anyJe.motorista_matricula || '');
    setJePatrulheirosMatriculas(anyJe.patrulheiros_matriculas || []);
    setJeSelectedViaturaId(anyJe.viatura_id || '');
    setJeViaturaModelo(anyJe.viatura_modelo || '');
    setJeViaturaPlaca(anyJe.viatura_placa || '');
    setJeViaturaChassi(anyJe.viatura_chassi || '');
    setJeViaturaRenavam(anyJe.viatura_renavam || '');
    setJeViaturaObservacao(anyJe.viatura_observacao || '');
    setJeHorario(je.horario);
    setJeObservacoes(je.observacoes || '');
    setJeEditingIndex(index);
  };

  const handleRemoveJornadaExtra = (index: number) => {
    setListaJornadasExtraordinarias(listaJornadasExtraordinarias.filter((_, idx) => idx !== index));
    if (jeEditingIndex === index) {
      setJeEditingIndex(null);
    }
  };

  const handleQuickSelectOperacao = (opName: string) => {
    setOperacao(opName);
  };

  // Helper row managers for Viaturas
  const handleAddViatura = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedViaturaObj) {
      alert('Por favor, selecione uma viatura operacional.');
      return;
    }
    
    // Check if duplicate
    const alreadyLinked = listaViaturas.some(v => String(v.id) === String(selectedViaturaObj.id));
    if (alreadyLinked) {
      alert('Esta viatura já está vinculada ao relatório.');
      return;
    }

    const row: Viatura = {
      id: selectedViaturaObj.id,
      modelo: selectedViaturaObj.modelo,
      placa: selectedViaturaObj.placa,
      chassi: selectedViaturaObj.chassi,
      renavam: selectedViaturaObj.renavam,
      observacao_operacional: selectedViaturaObj.observacao_operacional,
      km_abastecimento: vtrKmAbastecimento !== '' ? Number(vtrKmAbastecimento) : undefined,
      litros: vtrLitros !== '' ? Number(vtrLitros) : undefined,
      saldo: vtrSaldoRestante !== '' ? Number(vtrSaldoRestante) : undefined,
      valor_abastecido: vtrValorAbastecido !== '' ? Number(vtrValorAbastecido) : undefined
    };

    const novaLista = [...listaViaturas, row];

setListaViaturas(novaLista);

// Atualiza automaticamente TODOS os selects de viaturas
setAvailableViaturas(prev => {
  const existe = prev.some(v => v.placa === row.placa);

  if (existe) {
    return prev;
  }

  return [...prev, row];
});

setViaturasCount(prev => prev + 1);

    // Clear
    setSelectedViaturaId('');
    setSelectedViaturaObj(null);
    setVtrKmAbastecimento('');
    setVtrLitros('');
    setVtrSaldoRestante('');
    setVtrValorAbastecido('');
  };

  const handleRemoveViatura = (index: number) => {
    setListaViaturas(listaViaturas.filter((_, idx) => idx !== index));
    setViaturasCount(prev => Math.max(0, prev - 1));
  };

  // Helper row managers for Ocorrências
  const clearOccurranceInputs = () => {
    setEditingOcoIndex(null);
    
    // Clear BO inputs
    setBoNatureza(NATUREZAS_BO[0]);
    setBoNaturezaOutro('');
    setBoRua('');
    setBoBairro('');
    setBoCidade('Querência');
    setBoGuarnicao('');
    setBoViatura('');
    setBoQtdEnvolvidos(1);
    setBoRelatoCompleto('');
    setBoObjetosApreendidos('');
    setBoDrogasApreendidas('');
    setBoArmasApreendidas('');
    setBoObservacoesFinais('');

    // Clear TCO inputs
    setTcoNatureza(NATUREZAS_TCO[0]);
    setTcoNaturezaOutro('');
    setTcoAutor('');
    setTcoVitima('');
    setTcoRua('');
    setTcoBairro('');
    setTcoCidade('Querência');
    setTcoRelatoResumido('');
    setTcoObjetosApreendidos('');
    setTcoObservacoes('');
  };

  const handleEditOcorrenciaItem = (index: number) => {
    const item = listaOcorrencias[index];
    setEditingOcoIndex(index);
    setOcoActiveTab(item.tipo);

    if (item.tipo === 'BO') {
      setBoNatureza(item.natureza_ocorrencia);
      setBoNaturezaOutro(item.natureza_outro || '');
      setBoRua(item.rua_avenida || '');
      setBoBairro(item.bairro || '');
      setBoCidade(item.cidade || 'Querência');
      setBoData(item.data || '');
      setBoHora(item.hora || '');
      setBoGuarnicao(item.guarnicao_responsavel || '');
      setBoViatura(item.viatura_id_placa || '');
      setBoQtdEnvolvidos(item.qtd_envolvidos || 1);
      setBoRelatoCompleto(item.observacoes || '');
      setBoObjetosApreendidos(item.objetos_apreendidos || '');
      setBoDrogasApreendidas(item.drogas_apreendidas || '');
      setBoArmasApreendidas(item.armas_apreendidas_texto || '');
      setBoObservacoesFinais(item.observacoes_finais || '');
    } else {
      setTcoNatureza(item.natureza_ocorrencia);
      setTcoNaturezaOutro(item.natureza_outro || '');
      setTcoAutor(item.autor_fato || '');
      setTcoVitima(item.vitima || '');
      setTcoRua(item.rua_avenida || '');
      setTcoBairro(item.bairro || '');
      setTcoCidade(item.cidade || 'Querência');
      setTcoData(item.data || '');
      setTcoHora(item.hora || '');
      setTcoRelatoResumido(item.observacoes || '');
      setTcoObjetosApreendidos(item.objetos_apreendidos || '');
      setTcoObservacoes(item.observacoes_finais || '');
    }
  };

  const handleAddOcorrencia = (e: React.MouseEvent) => {
    e.preventDefault();

    if (ocoActiveTab === 'BO') {
      // Validate BO
      if (boNatureza === 'Outro' && !boNaturezaOutro.trim()) {
        alert('Por favor, digite a natureza customizada do BO.');
        return;
      }
      if (!boRua.trim() || !boBairro.trim() || !boCidade.trim()) {
        alert('Por favor, preencha o local do BO (Rua, Bairro e Cidade).');
        return;
      }
      if (!boData || !boHora) {
        alert('Por favor, preencha a Data e Hora do BO.');
        return;
      }
      if (!boGuarnicao.trim() || !boViatura.trim()) {
        alert('Por favor, preencha a guarnição responsável e a viatura.');
        return;
      }
      if (!boRelatoCompleto.trim()) {
        alert('Por favor, preencha o relato completo do BO.');
        return;
      }

      const row: OcorrenciaItem = {
        tipo: 'BO',
        natureza_ocorrencia: boNatureza,
        natureza_outro: boNatureza === 'Outro' ? boNaturezaOutro.trim() : undefined,
        rua_avenida: boRua.trim(),
        bairro: boBairro.trim(),
        cidade: boCidade.trim(),
        data: boData,
        hora: boHora,
        guarnicao_responsavel: boGuarnicao.trim(),
        viatura_id_placa: boViatura.trim(),
        qtd_envolvidos: boQtdEnvolvidos,
        observacoes: boRelatoCompleto.trim(), // principal
        objetos_apreendidos: boObjetosApreendidos.trim() || 'Nenhum',
        drogas_apreendidas: boDrogasApreendidas.trim() || 'Nenhum',
        armas_apreendidas_texto: boArmasApreendidas.trim() || 'Nenhum',
        observacoes_finais: boObservacoesFinais.trim() || 'Sem observações finais.',
        // Back compatibility fields
        ocorrencia_bo: `BO-${boNatureza === 'Outro' ? boNaturezaOutro.trim().toUpperCase() : boNatureza.toUpperCase()}`,
        suspeitos_conduzidos: boQtdEnvolvidos,
        local_fato: `${boRua.trim()}, ${boBairro.trim()}, ${boCidade.trim()}`
      };

      let newList = [...listaOcorrencias];
      if (editingOcoIndex !== null) {
        newList[editingOcoIndex] = row;
        alert('Ocorrência BO atualizada na lista provisória!');
      } else {
        newList.push(row);
        alert('Ocorrência BO inserida na lista provisória!');
      }
      setListaOcorrencias(newList);

      // Log/append consolidated text
      const nameNat = boNatureza === 'Outro' ? boNaturezaOutro : boNatureza;
      const currentListText = `• [BO - ${nameNat}] em ${boData} ${boHora}. Local: ${boRua}, ${boBairro}. Relato: ${boRelatoCompleto.trim()}.\n`;
      setOcorrenciasConsolidadas(prev => prev + currentListText);
      clearOccurranceInputs();

    } else {
      // Validate TCO
      if (tcoNatureza === 'Outro' && !tcoNaturezaOutro.trim()) {
        alert('Por favor, digite a natureza customizada do TCO.');
        return;
      }
      if (!tcoAutor.trim() || !tcoVitima.trim()) {
        alert('Por favor, preencha o Autor do Fato e a Vítima para o TCO.');
        return;
      }
      if (!tcoRua.trim() || !tcoBairro.trim() || !tcoCidade.trim()) {
        alert('Por favor, preencha o local do TCO (Rua, Bairro e Cidade).');
        return;
      }
      if (!tcoData || !tcoHora) {
        alert('Por favor, preencha a Data e Hora do TCO.');
        return;
      }
      if (!tcoRelatoResumido.trim()) {
        alert('Por favor, preencha o relato resumido do TCO.');
        return;
      }

      const row: OcorrenciaItem = {
        tipo: 'TCO',
        natureza_ocorrencia: tcoNatureza,
        natureza_outro: tcoNatureza === 'Outro' ? tcoNaturezaOutro.trim() : undefined,
        rua_avenida: tcoRua.trim(),
        bairro: tcoBairro.trim(),
        cidade: tcoCidade.trim(),
        data: tcoData,
        hora: tcoHora,
        autor_fato: tcoAutor.trim(),
        vitima: tcoVitima.trim(),
        observacoes: tcoRelatoResumido.trim(), // principal
        objetos_apreendidos: tcoObjetosApreendidos.trim() || 'Nenhum',
        observacoes_finais: tcoObservacoes.trim() || 'Sem observações.',
        // Back compatibility fields
        ocorrencia_bo: `TCO-${tcoNatureza === 'Outro' ? tcoNaturezaOutro.trim().toUpperCase() : tcoNatureza.toUpperCase()}`,
        suspeitos_conduzidos: 0,
        local_fato: `${tcoRua.trim()}, ${tcoBairro.trim()}, ${tcoCidade.trim()}`
      };

      let newList = [...listaOcorrencias];
      if (editingOcoIndex !== null) {
        newList[editingOcoIndex] = row;
        alert('Ocorrência TCO atualizada na lista provisória!');
      } else {
        newList.push(row);
        alert('Ocorrência TCO inserida na lista provisória!');
      }
      setListaOcorrencias(newList);

      const nameNat = tcoNatureza === 'Outro' ? tcoNaturezaOutro : tcoNatureza;
      const currentListText = `• [TCO - ${nameNat}] em ${tcoData} ${tcoHora}. Autor: ${tcoAutor}. Relato: ${tcoRelatoResumido.trim()}.\n`;
      setOcorrenciasConsolidadas(prev => prev + currentListText);
      clearOccurranceInputs();
    }
  };

  const handleRemoveOcorrencia = (index: number) => {
    setListaOcorrencias(listaOcorrencias.filter((_, idx) => idx !== index));
    if (editingOcoIndex === index) {
      setEditingOcoIndex(null);
    }
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
        finalOcorrenciaNarrative = listaOcorrencias.map((oc, index) => {
          const nat = oc.natureza_ocorrencia === 'Outro' ? oc.natureza_outro : oc.natureza_ocorrencia;
          if (oc.tipo === 'BO') {
            return `${index + 1}. [BO - ${nat}] no endereço: ${oc.rua_avenida}, ${oc.bairro}, ${oc.cidade} em ${oc.data} às ${oc.hora}. Guarnição: ${oc.guarnicao_responsavel}. Viatura: ${oc.viatura_id_placa}. Relato: ${oc.observacoes}`;
          } else {
            return `${index + 1}. [TCO - ${nat}] Autor: ${oc.autor_fato}. Vítima: ${oc.vitima}. Endereço: ${oc.rua_avenida}, ${oc.bairro}, ${oc.cidade} em ${oc.data} às ${oc.hora}. Relato resumido: ${oc.observacoes}`;
          }
        }).join('\n\n');
      } else {
        finalOcorrenciaNarrative = 'Sem ocorrências registradas.';
      }
    }

    setErrorMsg(null);
    setSubmitting(true);

    const reportPayload: Omit<PoliceReport, 'id' | 'created_at'> = {
      user_email: (currentUserSession && currentUserSession.email) || '',
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
                <option value="19ª CIPM - Querência/MT">
                  19ª CIPM - Querência/MT
                </option>
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
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">
              {gEditingIndex !== null ? 'Editar Guarnição Selecionada:' : 'Lançar nova Guarnição:'}
            </span>
            
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setGTipo(value as any);
                    if (value !== 'Outro') {
                      setGTipoOutro('');
                    }
                  }}
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

              {gTipo === 'Outro' && (
                <div className="animate-fade-in col-span-1">
                  <label className="block text-[10px] text-amber-400 font-mono mb-1">Digite o tipo da guarnição *</label>
                  <input
                    type="text"
                    value={gTipoOutro}
                    onChange={(e) => setGTipoOutro(e.target.value)}
                    placeholder="E.g. GIRO, Força Rural"
                    className="w-full bg-slate-950 border border-amber-600/60 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500 animate-pulse"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Viatura *</label>
                <select
                  value={gSelectedViaturaId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGSelectedViaturaId(val);
                    const found = availableViaturas.find(v => String(v.id) === String(val));
                    if (found) {
                      setGViaturaModelo(found.modelo);
                      setGViaturaPlaca(found.placa);
                      setGViaturaChassi(found.chassi || '');
                      setGViaturaRenavam(found.renavam || '');
                      setGViaturaObservacao(found.observacao_operacional || '');
                    } else {
                      setGViaturaModelo('');
                      setGViaturaPlaca('');
                      setGViaturaChassi('');
                      setGViaturaRenavam('');
                      setGViaturaObservacao('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500 font-mono"
                >
                  <option value="">-- SELECIONE A VIATURA (MODELO - PLACA) --</option>
                  {availableViaturas.map(v => (
                    <option key={v.id} value={v.id}>{v.modelo} - {v.placa}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AUTO-FILL PREVIEW FOR VIATURA */}
            {gViaturaModelo && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-xs text-slate-300">
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Modelo</span>
                  <span className="text-white font-semibold font-mono">{gViaturaModelo}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Placa</span>
                  <span className="text-white font-semibold font-mono">{gViaturaPlaca}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Chassi</span>
                  <span className="text-white/80 font-mono">{gViaturaChassi || '(Nenhum)'}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Renavam</span>
                  <span className="text-white/80 font-mono">{gViaturaRenavam || '(Nenhum)'}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Opção</span>
                  <span className="text-indigo-400 font-mono text-[10px] uppercase font-bold bg-indigo-950/40 px-1 border border-indigo-900 rounded">Preenchido Auto</span>
                </div>
                {gViaturaObservacao && (
                  <div className="col-span-2 md:col-span-5 border-t border-slate-900/60 pt-1.5 text-[11px] text-amber-300 font-serif">
                    <span className="font-mono text-[8px] text-slate-500 uppercase block font-bold">Observação operacional</span>
                    <span>Obs: {gViaturaObservacao}</span>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO COMPOSIÇÃO DA GUARNIÇÃO */}
            <div className="border border-slate-800/60 p-3.5 bg-slate-950/20 rounded-lg space-y-3">
              <span className="text-[10px] font-mono text-amber-400 uppercase block font-black tracking-wider">
                COMPOSIÇÃO DA GUARNIÇÃO
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">1. COMANDANTE *</label>
                  <select
                    value={gComandanteMatricula}
                    onChange={(e) => setGComandanteMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                  >
                    <option value="">-- SELECIONE O COMANDANTE --</option>
                    {availablePoliciais.map((p) => (
                      <option key={p.matricula} value={p.matricula}>
                        {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">2. MOTORISTA *</label>
                  <select
                    value={gMotoristaMatricula}
                    onChange={(e) => setGMotoristaMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                  >
                    <option value="">-- SELECIONE O MOTORISTA --</option>
                    {availablePoliciais.map((p) => (
                      <option key={p.matricula} value={p.matricula}>
                        {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">3. PATRULHEIROS</label>
                
                <div className="space-y-1.5">
                  {gPatrulheirosMatriculas.map((mat, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 mt-1 animate-fade-in">
                      <select
                        value={mat}
                        onChange={(e) => {
                          const updated = [...gPatrulheirosMatriculas];
                          updated[pIdx] = e.target.value;
                          setGPatrulheirosMatriculas(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500"
                      >
                        <option value="">-- SELECIONE PATRULHEIRO --</option>
                        {availablePoliciais.map((p) => (
                          <option key={p.matricula} value={p.matricula}>
                            {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setGPatrulheirosMatriculas(gPatrulheirosMatriculas.filter((_, idx) => idx !== pIdx));
                        }}
                        className="bg-red-950/40 text-red-400 hover:bg-red-900/40 p-2 border border-red-900/60 rounded transition cursor-pointer"
                        title="Remover Patrulheiro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setGPatrulheirosMatriculas([...gPatrulheirosMatriculas, ''])}
                  className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 border border-amber-950/60 px-2 py-1.5 bg-amber-950/15 rounded transition cursor-pointer uppercase font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Adicionar patrulheiro</span>
                </button>
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
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário Final *</label>
                <input
                  type="text"
                  value={gHorarioFinal}
                  onChange={(e) => setGHorarioFinal(e.target.value)}
                  placeholder="Ex: 19:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1 gap-2">
              {gEditingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setGEditingIndex(null);
                    setGNome('');
                    setGTipo('Rádio Patrulha');
                    setGTipoOutro('');
                    setGComandanteMatricula('');
                    setGMotoristaMatricula('');
                    setGPatrulheirosMatriculas([]);
                    setGSelectedViaturaId('');
                    setGViaturaModelo('');
                    setGViaturaPlaca('');
                    setGViaturaChassi('');
                    setGViaturaRenavam('');
                    setGViaturaObservacao('');
                  }}
                  className="bg-slate-755 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded border border-slate-650 transition active:scale-95 cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="button"
                onClick={handleAddGuarnicao}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 px-4 rounded border border-amber-600 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-slate-950" />
                <span>{gEditingIndex !== null ? '✓ SALVAR ALTERAÇÕES' : '+ Adicionar Guarnição'}</span>
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
                          {g.tipo_guarnicao === 'Outro' ? (g.tipo_guarnicao_outro || 'Outro') : g.tipo_guarnicao}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{g.nome_guarnicao}</h4>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditGuarnicao(idx)}
                          className="bg-slate-800 hover:bg-slate-700 hover:text-amber-400 border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-1 rounded transition uppercase font-semibold"
                        >
                          EDITAR GUARNIÇÃO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuarnicao(idx)}
                          className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-mono px-2 py-1 rounded transition uppercase font-semibold"
                        >
                          EXCLUIR GUARNIÇÃO
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300 font-sans pt-1">
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Viatura Vinculada:</span>
                        <span className="font-semibold text-white font-mono break-all">{g.viatura}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Comandante da equipe:</span>
                        <span className="font-semibold text-white">{g.comandante_guarnicao}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Composição do Efetivo:</span>
                        <span className="text-slate-300 text-[11px] leading-relaxed">{g.policiais_integrantes}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-amber-300 font-mono mt-1 pt-1 border-t border-slate-800/40">
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
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">
              {adEditingIndex !== null ? 'Editar Equipe Delegada Selecionada:' : 'Lançar Equipe Delegada:'}
            </span>

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
                <select
                  value={adSelectedViaturaId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdSelectedViaturaId(val);
                    const found = availableViaturas.find(v => String(v.id) === String(val));
                    if (found) {
                      setAdViaturaModelo(found.modelo);
                      setAdViaturaPlaca(found.placa);
                      setAdViaturaChassi(found.chassi || '');
                      setAdViaturaRenavam(found.renavam || '');
                      setAdViaturaObservacao(found.observacao_operacional || '');
                    } else {
                      setAdViaturaModelo('');
                      setAdViaturaPlaca('');
                      setAdViaturaChassi('');
                      setAdViaturaRenavam('');
                      setAdViaturaObservacao('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                >
                  <option value="">-- SELECIONE A VIATURA (MODELO - PLACA) --</option>
                  {availableViaturas.map(v => (
                    <option key={v.id} value={v.id}>{v.modelo} - {v.placa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário de Atuação *</label>
                <input
                  type="text"
                  value={adHorario}
                  onChange={(e) => setAdHorario(e.target.value)}
                  placeholder="Ex: 08:00 às 14:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                />
              </div>
            </div>

            {/* AUTO-FILL PREVIEW FOR VIATURA - ATIVIDADE DELEGADA */}
            {adViaturaModelo && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-xs text-slate-300 animate-fade-in">
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Modelo</span>
                  <span className="text-white font-semibold font-mono">{adViaturaModelo}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Placa</span>
                  <span className="text-white font-semibold font-mono">{adViaturaPlaca}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Chassi</span>
                  <span className="text-white/80 font-mono">{adViaturaChassi || '(Nenhum)'}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Renavam</span>
                  <span className="text-white/80 font-mono">{adViaturaRenavam || '(Nenhum)'}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Estatuto</span>
                  <span className="text-blue-400 font-mono text-[10px] uppercase font-bold bg-blue-950/40 px-1 border border-blue-900 rounded">Preenchido Auto</span>
                </div>
                {adViaturaObservacao && (
                  <div className="col-span-2 md:col-span-5 border-t border-slate-900/60 pt-1.5 text-[11px] text-amber-300 font-serif">
                    <span className="font-mono text-[8px] text-slate-500 uppercase block font-bold">Observação operacional</span>
                    <span>Obs: {adViaturaObservacao}</span>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO COMPOSIÇÃO DA GUARNIÇÃO - ATIVIDADE DELEGADA */}
            <div className="border border-slate-800/60 p-3.5 bg-slate-950/20 rounded-lg space-y-3">
              <span className="text-[10px] font-mono text-blue-400 uppercase block font-black tracking-wider">
                COMPOSIÇÃO DA GUARNIÇÃO (CONVÊNIO SESP)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">1. COMANDANTE *</label>
                  <select
                    value={adComandanteMatricula}
                    onChange={(e) => setAdComandanteMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                  >
                    <option value="">-- SELECIONE O COMANDANTE --</option>
                    {availablePoliciais.map((p) => (
                      <option key={p.matricula} value={p.matricula}>
                        {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">2. MOTORISTA *</label>
                  <select
                    value={adMotoristaMatricula}
                    onChange={(e) => setAdMotoristaMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                  >
                    <option value="">-- SELECIONE O MOTORISTA --</option>
                    {availablePoliciais.map((p) => (
                      <option key={p.matricula} value={p.matricula}>
                        {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">3. PATRULHEIROS</label>
                
                <div className="space-y-1.5">
                  {adPatrulheirosMatriculas.map((mat, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 mt-1 animate-fade-in">
                      <select
                        value={mat}
                        onChange={(e) => {
                          const updated = [...adPatrulheirosMatriculas];
                          updated[pIdx] = e.target.value;
                          setAdPatrulheirosMatriculas(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400"
                      >
                        <option value="">-- SELECIONE PATRULHEIRO --</option>
                        {availablePoliciais.map((p) => (
                          <option key={p.matricula} value={p.matricula}>
                            {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setAdPatrulheirosMatriculas(adPatrulheirosMatriculas.filter((_, idx) => idx !== pIdx));
                        }}
                        className="bg-red-950/40 text-red-400 hover:bg-red-900/40 p-2 border border-red-900/60 rounded transition cursor-pointer"
                        title="Remover Patrulheiro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAdPatrulheirosMatriculas([...adPatrulheirosMatriculas, ''])}
                  className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 border border-blue-950/60 px-2 py-1.5 bg-blue-950/15 rounded transition cursor-pointer uppercase font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Adicionar patrulheiro</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>

            <div className="flex justify-end pt-1 gap-2">
              {adEditingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setAdEditingIndex(null);
                    setAdNomeEquipe('');
                    setAdComandanteMatricula('');
                    setAdMotoristaMatricula('');
                    setAdPatrulheirosMatriculas([]);
                    setAdSelectedViaturaId('');
                    setAdViaturaModelo('');
                    setAdViaturaPlaca('');
                    setAdViaturaChassi('');
                    setAdViaturaRenavam('');
                    setAdViaturaObservacao('');
                    setAdLocalOperacao('');
                    setAdHorario('08:00 às 14:00');
                    setAdObservacoes('');
                  }}
                  className="bg-slate-755 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded border border-slate-650 transition active:scale-95 cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="button"
                onClick={handleAddAtividadeDelegada}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded border border-blue-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-white" />
                <span>{adEditingIndex !== null ? '✓ SALVAR ALTERAÇÕES' : '+ Adicionar Equipe Delegada'}</span>
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
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditAtividadeDelegada(idx)}
                          className="bg-slate-800 hover:bg-slate-700 hover:text-blue-400 border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-1 rounded transition uppercase font-semibold"
                        >
                          EDITAR GUARNIÇÃO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAtividadeDelegada(idx)}
                          className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-mono px-2 py-1 rounded transition uppercase font-semibold"
                        >
                          EXCLUIR GUARNIÇÃO
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300 font-sans">
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Viatura Vinculada:</span>
                        <span className="font-semibold text-white font-mono break-all">{ad.viatura}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Horário de atuação:</span>
                        <span className="font-semibold text-white">{ad.horario}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Local:</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-blue-400" />
                          <span>{ad.local_operacao}</span>
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Composition do Efetivo:</span>
                        <span className="text-slate-300 text-[11px] leading-relaxed">{ad.policiais}</span>
                      </div>
                      {ad.observacoes && (
                        <div className="col-span-2 border-t border-slate-800/60 pt-1.5 text-[11px] text-slate-400 italic">
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
            <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">
              {jeEditingIndex !== null ? 'Editar Equipe de Jornada Extraordinária Selecionada:' : 'Lançar Equipe de Jornada Extraordinária:'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Nome da Equipe *</label>
                <input
                  type="text"
                  value={jeNomeEquipe}
                  onChange={(e) => setJeNomeEquipe(e.target.value)}
                  placeholder="Ex: Reforço Noturno Querência"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Viatura *</label>
                <select
                  value={jeSelectedViaturaId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setJeSelectedViaturaId(val);
                    const found = availableViaturas.find(v => String(v.id) === String(val));
                    if (found) {
                      setJeViaturaModelo(found.modelo);
                      setJeViaturaPlaca(found.placa);
                      setJeViaturaChassi(found.chassi || '');
                      setJeViaturaRenavam(found.renavam || '');
                      setJeViaturaObservacao(found.observacao_operacional || '');
                    } else {
                      setJeViaturaModelo('');
                      setJeViaturaPlaca('');
                      setJeViaturaChassi('');
                      setJeViaturaRenavam('');
                      setJeViaturaObservacao('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-mono"
                >
                  <option value="">-- SELECIONE A VIATURA (MODELO - PLACA) --</option>
                  {availableViaturas.map(v => (
                    <option key={v.id} value={v.id}>{v.modelo} - {v.placa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Horário *</label>
                <input
                  type="text"
                  value={jeHorario}
                  onChange={(e) => setJeHorario(e.target.value)}
                  placeholder="Ex: 18:00 às 23:00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>

            {/* AUTO-FILL PREVIEW FOR VIATURA - JORNADA EXTRAORDINÁRIA */}
            {jeViaturaModelo && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-xs text-slate-300 animate-fade-in animate-pulse">
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Modelo</span>
                  <span className="text-white font-semibold font-mono">{jeViaturaModelo}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Placa</span>
                  <span className="text-white font-semibold font-mono">{jeViaturaPlaca}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Chassi</span>
                  <span className="text-white/80 font-mono">{jeViaturaChassi || '(Nenhum)'}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Renavam</span>
                  <span className="text-white/80 font-mono">{jeViaturaRenavam || '(Nenhum)'}</span>
                </div>
                <div className="col-span-1">
                  <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Origem</span>
                  <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold bg-emerald-950/40 px-1 border border-emerald-900 rounded">Preenchido Auto</span>
                </div>
                {jeViaturaObservacao && (
                  <div className="col-span-2 md:col-span-5 border-t border-slate-900/60 pt-1.5 text-[11px] text-amber-300 font-serif">
                    <span className="font-mono text-[8px] text-slate-500 uppercase block font-bold">Observação operacional</span>
                    <span>Obs: {jeViaturaObservacao}</span>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO COMPOSIÇÃO DA GUARNIÇÃO - JORNADA EXTRAORDINÁRIA */}
            <div className="border border-slate-800/60 p-3.5 bg-slate-950/30 rounded-lg space-y-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block font-black tracking-wider">
                COMPOSIÇÃO DA GUARNIÇÃO (JORNADA EXTRA)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">1. COMANDANTE *</label>
                  <select
                    value={jeComandanteMatricula}
                    onChange={(e) => setJeComandanteMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">-- SELECIONE O COMANDANTE --</option>
                    {availablePoliciais.map((p) => (
                      <option key={p.matricula} value={p.matricula}>
                        {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">2. MOTORISTA *</label>
                  <select
                    value={jeMotoristaMatricula}
                    onChange={(e) => setJeMotoristaMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">-- SELECIONE O MOTORISTA --</option>
                    {availablePoliciais.map((p) => (
                      <option key={p.matricula} value={p.matricula}>
                        {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">3. PATRULHEIROS</label>
                
                <div className="space-y-1.5">
                  {jePatrulheirosMatriculas.map((mat, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 mt-1 animate-fade-in">
                      <select
                        value={mat}
                        onChange={(e) => {
                          const updated = [...jePatrulheirosMatriculas];
                          updated[pIdx] = e.target.value;
                          setJePatrulheirosMatriculas(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-500"
                      >
                        <option value="">-- SELECIONE PATRULHEIRO --</option>
                        {availablePoliciais.map((p) => (
                          <option key={p.matricula} value={p.matricula}>
                            {p.graduacao} {p.nome_completo} (RG: {p.matricula})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setJePatrulheirosMatriculas(jePatrulheirosMatriculas.filter((_, idx) => idx !== pIdx));
                        }}
                        className="bg-red-950/40 text-red-400 hover:bg-red-900/40 p-2 border border-red-900/60 rounded transition cursor-pointer"
                        title="Remover Patrulheiro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setJePatrulheirosMatriculas([...jePatrulheirosMatriculas, ''])}
                  className="mt-2 text-[10px] text-emerald-400 hover:text-emerald-350 font-mono flex items-center gap-1 border border-emerald-950/60 px-2 py-1.5 bg-emerald-950/15 rounded transition cursor-pointer uppercase font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Adicionar patrulheiro</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans mb-1">Tipo de Reforço / Operação *</label>
                <select
                  value={jeTipoReforco}
                  onChange={(e) => {
                    const value = e.target.value;
                    setJeTipoReforco(value);
                    if (value !== 'Outro') {
                      setJeTipoOutro('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400"
                >
                  <option value="Policiamento Ostensivo">Policiamento Ostensivo</option>
                  <option value="Saturação de Área">Saturação de Área</option>
                  <option value="Ronda Escolar">Ronda Escolar</option>
                  <option value="Outro">Outro (Especifique abaixo)</option>
                </select>
              </div>

              {jeTipoReforco === 'Outro' && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] text-emerald-400 font-mono mb-1">Digite o tipo de reforço *</label>
                  <input
                    type="text"
                    value={jeTipoOutro}
                    onChange={(e) => setJeTipoOutro(e.target.value)}
                    placeholder="E.g. Blitz Lei Seca, Apoio Ambiental"
                    className="w-full bg-slate-950 border border-emerald-600/60 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 animate-pulse"
                  />
                </div>
              )}

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
            </div>

            <div className="flex justify-end pt-1 gap-2">
              {jeEditingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setJeEditingIndex(null);
                    setJeNomeEquipe('');
                    setJeComandanteMatricula('');
                    setJeMotoristaMatricula('');
                    setJePatrulheirosMatriculas([]);
                    setJeSelectedViaturaId('');
                    setJeViaturaModelo('');
                    setJeViaturaPlaca('');
                    setJeViaturaChassi('');
                    setJeViaturaRenavam('');
                    setJeViaturaObservacao('');
                    setJeTipoReforco('Policiamento Ostensivo');
                    setJeTipoOutro('');
                    setJeHorario('18:00 às 23:00');
                    setJeObservacoes('');
                  }}
                  className="bg-slate-755 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded border border-slate-650 transition active:scale-95 cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="button"
                onClick={handleAddJornadaExtra}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded border border-emerald-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-white" />
                <span>{jeEditingIndex !== null ? '✓ SALVAR ALTERAÇÕES' : '+ Adicionar Jornada Extra'}</span>
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
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditJornadaExtra(idx)}
                          className="bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-1 rounded transition uppercase font-semibold"
                        >
                          EDITAR GUARNIÇÃO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveJornadaExtra(idx)}
                          className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-mono px-2 py-1 rounded transition uppercase font-semibold"
                        >
                          EXCLUIR GUARNIÇÃO
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-300 font-sans pt-1">
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Viatura Vinculada:</span>
                        <span className="font-semibold text-white font-mono break-all">{je.viatura}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Horário de atuação:</span>
                        <span className="font-semibold text-white">{je.horario}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] text-slate-500 uppercase font-mono font-bold">Composition do Efetivo:</span>
                        <span className="text-slate-300 text-[11px] leading-relaxed">{je.policiais}</span>
                      </div>
                      {je.observacoes && (
                        <div className="col-span-2 border-t border-slate-800/60 pt-1.5 text-[11px] text-slate-400 italic">
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
        {/* 05 - CADASTRO DE VIATURAS */}
<div className="border border-slate-700 rounded-xl p-6 mb-6">
  <h2 className="text-yellow-400 font-bold text-xl mb-6">
    05. CADASTRO DE VIATURAS EMPENHADAS
  </h2>

  {/* MAPA DAS VIATURAS */}
  <div className="overflow-x-auto mb-8">
    <h3 className="text-cyan-400 font-bold mb-4">
      03 — MAPA DAS VIATURAS DA 19ª CIPM
    </h3>

    <table className="w-full border border-slate-700 text-sm">
      <thead className="bg-slate-800">
        <tr>
          <th className="border border-slate-700 p-2">VTR</th>
          <th className="border border-slate-700 p-2">PLACA</th>
          <th className="border border-slate-700 p-2">LOCAL</th>
          <th className="border border-slate-700 p-2">SITUAÇÃO</th>
          <th className="border border-slate-700 p-2">KM INICIAL</th>
          <th className="border border-slate-700 p-2">KM FINAL</th>
          <th className="border border-slate-700 p-2">AÇÕES</th>
        </tr>
      </thead>

      <tbody>
        {[
          { vtr: "KICKS", placa: "SPQ-5I51" },
          { vtr: "DUSTER", placa: "SPU-1C95" },
          { vtr: "TRITON", placa: "RRX-3B80" },
          { vtr: "TRITON RURAL", placa: "RRP-0I46" },
        ].map((item, index) => (
          <tr key={index}>
            <td className="border border-slate-700 p-2">
              {item.vtr}
            </td>

            <td className="border border-slate-700 p-2">
              {item.placa}
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                placeholder="19ª CIPM"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                placeholder="SERVIÇO DIÁRIO"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                placeholder="000000"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                placeholder="000000"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2 text-center">
              <button className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs">
                EXCLUIR
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* NOVA VIATURA */}
  <div className="border border-slate-700 rounded-lg p-4 mb-8">
    <h3 className="text-cyan-400 font-bold mb-4">
      + ADICIONAR NOVA VIATURA
    </h3>

    <div className="grid md:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Nome da VTR"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Placa"
        className="bg-black border border-slate-700 rounded p-3"
      />
    </div>

    <button className="mt-4 bg-green-700 hover:bg-green-600 px-4 py-2 rounded">
      SALVAR VIATURA
    </button>
  </div>

  {/* ABASTECIMENTO */}
  <div className="overflow-x-auto">
    <h3 className="text-cyan-400 font-bold mb-4">
      04 — ABASTECIMENTO
    </h3>

    <table className="w-full border border-slate-700 text-sm">
      <thead className="bg-slate-800">
        <tr>
          <th className="border border-slate-700 p-2">VTR</th>
          <th className="border border-slate-700 p-2">PLACA</th>
          <th className="border border-slate-700 p-2">KM</th>
          <th className="border border-slate-700 p-2">LITROS</th>
          <th className="border border-slate-700 p-2">VALOR</th>
          <th className="border border-slate-700 p-2">SALDO</th>
        </tr>
      </thead>

      <tbody>
        {[
          { vtr: "KICKS", placa: "SPQ-5I51" },
          { vtr: "DUSTER", placa: "SPU-1C95" },
          { vtr: "TRITON", placa: "RRX-3B80" },
          { vtr: "TRITON RURAL", placa: "RRP-0I46" },
        ].map((item, index) => (
          <tr key={index}>
            <td className="border border-slate-700 p-2">
              {item.vtr}
            </td>

            <td className="border border-slate-700 p-2">
              {item.placa}
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                className="bg-black w-full p-1 rounded"
              />
            </td>

            <td className="border border-slate-700 p-2">
              <input
                type="text"
                className="bg-black w-full p-1 rounded"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


        {/* BLOC 3: SUBTABELA INTERATIVA - OCORRÊNCIAS REGISTRADAS */}
        <div id="secao-modulo-ocorrencias" className="bg-slate-950/50 p-5 rounded-xl border border-slate-850/60 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase font-semibold flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              <span>06. MÓDULO DE OCORRÊNCIAS OPERACIONAIS</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Boletim de Ocorrência & TCO</span>
          </div>

          {/* Form container */}
          <div className="p-4 bg-slate-900 border border-slate-800/60 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase block font-black">
                  {editingOcoIndex !== null ? (
                    <span className="text-amber-400">Modo Edição: Editando Ocorrência #{editingOcoIndex + 1}</span>
                  ) : (
                    <span>Lançar nova ocorrência policial:</span>
                  )}
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Informe todas as especificidades regulamentares de acordo com o padrão institucional PMMT.
                </p>
              </div>
              {editingOcoIndex !== null && (
                <button
                  type="button"
                  onClick={clearOccurranceInputs}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded inline-flex items-center gap-1 transition"
                >
                  <X className="h-3 w-3 text-red-400" /> Descartar Edição
                </button>
              )}
            </div>

            {/* Abas de Navegação */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                id="tab-btn-bo"
                onClick={() => {
                  setOcoActiveTab('BO');
                  if (editingOcoIndex === null) {
                    setBoNatureza(NATUREZAS_BO[0]);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-black font-mono uppercase tracking-wider transition ${
                  ocoActiveTab === 'BO'
                    ? 'bg-blue-900/40 border border-blue-700/60 text-blue-300 shadow-sm'
                    : 'text-slate-450 hover:text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                <ShieldAlert className={`h-4 w-4 ${ocoActiveTab === 'BO' ? 'text-blue-450' : 'text-slate-500'}`} />
                Boletim de Ocorrência (BO)
              </button>
              <button
                type="button"
                id="tab-btn-tco"
                onClick={() => {
                  setOcoActiveTab('TCO');
                  if (editingOcoIndex === null) {
                    setTcoNatureza(NATUREZAS_TCO[0]);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-black font-mono uppercase tracking-wider transition ${
                  ocoActiveTab === 'TCO'
                    ? 'bg-emerald-950/40 border border-emerald-800/45 text-emerald-300 shadow-sm'
                    : 'text-slate-450 hover:text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                <FileText className={`h-4 w-4 ${ocoActiveTab === 'TCO' ? 'text-emerald-400' : 'text-slate-500'}`} />
                Termo Circunstanciado (TCO)
              </button>
            </div>

            {/* ABA 1: BOLETIM DE OCORRÊNCIA */}
            {ocoActiveTab === 'BO' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Natureza da ocorrência *</label>
                    <select
                      id="select-bo-natureza"
                      value={boNatureza}
                      onChange={(e) => setBoNatureza(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                    >
                      {NATUREZAS_BO.map((nat, idx) => (
                        <option key={idx} value={nat}>{nat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Rua / Avenida *</label>
                    <input
                      type="text"
                      value={boRua}
                      onChange={(e) => setBoRua(e.target.value)}
                      placeholder="Ex: Av. Governador Valadares, 442"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Bairro *</label>
                    <input
                      type="text"
                      value={boBairro}
                      onChange={(e) => setBoBairro(e.target.value)}
                      placeholder="Ex: Setor Comercial"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Cidade *</label>
                    <input
                      type="text"
                      value={boCidade}
                      onChange={(e) => setBoCidade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans font-bold"
                    />
                  </div>
                </div>

                {/* Condicional se escolher Outro */}
                {boNatureza === 'Outro' && (
                  <div className="bg-blue-950/20 border border-blue-900/40 p-3 rounded-lg animate-fadeIn">
                    <label className="block text-[10px] text-blue-350 font-sans mb-1 font-bold uppercase">Digite a natureza do BO *</label>
                    <input
                      type="text"
                      value={boNaturezaOutro}
                      onChange={(e) => setBoNaturezaOutro(e.target.value)}
                      placeholder="Especificar natureza da ocorrência policial..."
                      className="w-full bg-slate-950 border border-blue-900/60 text-slate-100 text-xs rounded p-2 outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Data do Fato *</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={boData}
                        onChange={(e) => setBoData(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Hora do Fato *</label>
                    <input
                      type="time"
                      value={boHora}
                      onChange={(e) => setBoHora(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Guarnição Responsável *</label>
                    <input
                      type="text"
                      value={boGuarnicao}
                      onChange={(e) => setBoGuarnicao(e.target.value)}
                      placeholder="Ex: VTR-1902 Força Tática"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Viatura Associada *</label>
                    <select
                      value={boViatura}
                      onChange={(e) => setBoViatura(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                    >
                      <option value="">-- SELECIONE --</option>
                      {availableViaturas.map((v, i) => (
                        <option key={i} value={`${v.modelo} - ${v.placa}`}>
                          {v.modelo} - {v.placa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Qtd de envolvidos *</label>
                    <input
                      type="number"
                      min="1"
                      value={boQtdEnvolvidos}
                      onChange={(e) => setBoQtdEnvolvidos(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-mono"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Objetos apreendidos *</label>
                    <input
                      type="text"
                      value={boObjetosApreendidos}
                      onChange={(e) => setBoObjetosApreendidos(e.target.value)}
                      placeholder="Ex: 01 celular iPhone 13 Pro Max, R$ 250,50 em espécie"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Drogas apreendidas *</label>
                    <input
                      type="text"
                      value={boDrogasApreendidas}
                      onChange={(e) => setBoDrogasApreendidas(e.target.value)}
                      placeholder="Ex: 450g de maconha prensada, 12 pinos de cocaína"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Armas apreendidas *</label>
                    <input
                      type="text"
                      value={boArmasApreendidas}
                      onChange={(e) => setBoArmasApreendidas(e.target.value)}
                      placeholder="Ex: 01 revólver Taurus calibre 38, nº raspado"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Relato Completo da Ocorrência *</label>
                  <textarea
                    value={boRelatoCompleto}
                    onChange={(e) => setBoRelatoCompleto(e.target.value)}
                    placeholder="Narrativa detalhada dos fatos ocorridos, testemunhos, abordagem policial, estado dos envolvidos..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Observações Finais *</label>
                  <textarea
                    value={boObservacoesFinais}
                    onChange={(e) => setBoObservacoesFinais(e.target.value)}
                    placeholder="Ex: Conduzidos entregues à PJC sem lesões corporais para providências cabíveis."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-blue-400 font-sans"
                  />
                </div>
              </div>
            )}

            {/* ABA 2: TCO */}
            {ocoActiveTab === 'TCO' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Natureza TCO *</label>
                    <select
                      id="select-tco-natureza"
                      value={tcoNatureza}
                      onChange={(e) => setTcoNatureza(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-mono"
                    >
                      {NATUREZAS_TCO.map((nat, idx) => (
                        <option key={idx} value={nat}>{nat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Autor do Fato *</label>
                    <input
                      type="text"
                      value={tcoAutor}
                      onChange={(e) => setTcoAutor(e.target.value)}
                      placeholder="Ex: Nome do infrator / autor"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Vítima *</label>
                    <input
                      type="text"
                      value={tcoVitima}
                      onChange={(e) => setTcoVitima(e.target.value)}
                      placeholder="Ex: Nome da vítima"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                    />
                  </div>
                </div>

                {/* Condicional se escolher Outro */}
                {tcoNatureza === 'Outro' && (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg animate-fadeIn">
                    <label className="block text-[10px] text-emerald-355 font-sans mb-1 font-bold uppercase">Digite a natureza TCO *</label>
                    <input
                      type="text"
                      value={tcoNaturezaOutro}
                      onChange={(e) => setTcoNaturezaOutro(e.target.value)}
                      placeholder="Especificar contravenção penal ou ilícito tco..."
                      className="w-full bg-slate-950 border border-emerald-900/60 text-slate-100 text-xs rounded p-2 outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Rua / Avenida *</label>
                    <input
                      type="text"
                      value={tcoRua}
                      onChange={(e) => setTcoRua(e.target.value)}
                      placeholder="Ex: Rua dos Pinhais, s/n"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Bairro *</label>
                    <input
                      type="text"
                      value={tcoBairro}
                      onChange={(e) => setTcoBairro(e.target.value)}
                      placeholder="Ex: Setor Sul"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Cidade *</label>
                    <input
                      type="text"
                      value={tcoCidade}
                      onChange={(e) => setTcoCidade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Data do TCO *</label>
                    <input
                      type="date"
                      value={tcoData}
                      onChange={(e) => setTcoData(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Hora do TCO *</label>
                    <input
                      type="time"
                      value={tcoHora}
                      onChange={(e) => setTcoHora(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Objetos apreendidos *</label>
                    <input
                      type="text"
                      value={tcoObjetosApreendidos}
                      onChange={(e) => setTcoObjetosApreendidos(e.target.value)}
                      placeholder="Ex: 01 aparelho de som Mondial, 01 caixa amplificada"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Relato Resumido *</label>
                  <textarea
                    value={tcoRelatoResumido}
                    onChange={(e) => setTcoRelatoResumido(e.target.value)}
                    placeholder="Sustentação fática sintética, constatação operacional do termo de compromisso..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-sans mb-1 font-bold uppercase">Observações *</label>
                  <textarea
                    value={tcoObservacoes}
                    onChange={(e) => setTcoObservacoes(e.target.value)}
                    placeholder="Procedimento lavrado no local. Compromisso de comparecimento assinado."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-2 outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
              </div>
            )}

            {/* Ações do Form de Ocorrências */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddOcorrencia}
                className={`text-xs text-slate-950 font-black py-2.5 px-6 rounded border flex items-center gap-1.5 transition cursor-pointer shadow-lg ${
                  ocoActiveTab === 'BO'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 border-blue-500/50'
                    : 'bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-505 border-emerald-550/50'
                }`}
              >
                {editingOcoIndex !== null ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Salvar Alterações da Ocorrência</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Lançar Ocorrência à Lista</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PESQUISA E FILTRAGEM (FUNCIONALIDADE OBRIGATÓRIA DA SOLICITAÇÃO) */}
          <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filtrar Ocorrências Atendidas no Plantão:
            </span>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[9px] text-slate-500 font-sans uppercase mb-1">Por Natureza</label>
                <input
                  type="text"
                  value={ocoFilterNatureza}
                  onChange={(e) => setOcoFilterNatureza(e.target.value)}
                  placeholder="Pesquisar natureza..."
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-[11px] rounded p-1.5 outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-sans uppercase mb-1">Por Data</label>
                <input
                  type="date"
                  value={ocoFilterData}
                  onChange={(e) => setOcoFilterData(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-[11px] rounded p-1.5 outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-sans uppercase mb-1">Policial / Autor / Vítima</label>
                <input
                  type="text"
                  value={ocoFilterPolicial}
                  onChange={(e) => setOcoFilterPolicial(e.target.value)}
                  placeholder="Nome ou Guarnição..."
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-[11px] rounded p-1.5 outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-sans uppercase mb-1">Por Bairro</label>
                <input
                  type="text"
                  value={ocoFilterBairro}
                  onChange={(e) => setOcoFilterBairro(e.target.value)}
                  placeholder="Pesquisar bairro..."
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-[11px] rounded p-1.5 outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 font-sans uppercase mb-1">Por Viatura</label>
                <input
                  type="text"
                  value={ocoFilterViatura}
                  onChange={(e) => setOcoFilterViatura(e.target.value)}
                  placeholder="Modelo ou placa..."
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-[11px] rounded p-1.5 outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {(ocoFilterNatureza || ocoFilterData || ocoFilterPolicial || ocoFilterBairro || ocoFilterViatura) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setOcoFilterNatureza('');
                    setOcoFilterData('');
                    setOcoFilterPolicial('');
                    setOcoFilterBairro('');
                    setOcoFilterViatura('');
                  }}
                  className="text-[10px] text-red-400 font-mono hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Limpar Filtros de Pesquisa
                </button>
              </div>
            )}
          </div>

          {/* LISTAGEM DE OCORRÊNCIAS LANÇADAS */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-450 uppercase block font-bold tracking-wider">
              Ocorrências Atendidas ({listaOcorrencias.length} lançadas
              {(ocoFilterNatureza || ocoFilterData || ocoFilterPolicial || ocoFilterBairro || ocoFilterViatura) ? ' - filtrando listagem' : ''}):
            </span>

            {listaOcorrencias.length === 0 ? (
              <p className="text-xs text-slate-500 italic pb-2 text-center bg-slate-900 border border-slate-850 rounded-lg py-4">
                Nenhuma ocorrência detalhada registrada. Utilize as opções do módulo acima para lançar no relatório.
              </p>
            ) : (
              (() => {
                const results = listaOcorrencias.filter(oc => {
                  if (ocoFilterNatureza) {
                    const natName = (oc.natureza_ocorrencia || '').toLowerCase();
                    const bOther = (oc.natureza_outro || '').toLowerCase();
                    if (!natName.includes(ocoFilterNatureza.toLowerCase()) && !bOther.includes(ocoFilterNatureza.toLowerCase())) {
                      return false;
                    }
                  }
                  if (ocoFilterData && oc.data !== ocoFilterData) return false;
                  if (ocoFilterBairro && !(oc.bairro || '').toLowerCase().includes(ocoFilterBairro.toLowerCase())) return false;
                  if (ocoFilterViatura && !(oc.viatura_id_placa || '').toLowerCase().includes(ocoFilterViatura.toLowerCase())) return false;
                  if (ocoFilterPolicial) {
                    const searchField = ocoFilterPolicial.toLowerCase();
                    const gResp = (oc.guarnicao_responsavel || '').toLowerCase();
                    const aFat = (oc.autor_fato || '').toLowerCase();
                    const vTco = (oc.vitima || '').toLowerCase();
                    if (!gResp.includes(searchField) && !aFat.includes(searchField) && !vTco.includes(searchField)) {
                      return false;
                    }
                  }
                  return true;
                });

                if (results.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 italic pb-2 text-center bg-slate-900 border border-slate-850 rounded-lg py-4">
                      Nenhuma ocorrência corresponde aos filtros de pesquisa inseridos.
                    </p>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {results.map((oc, actualIdx) => {
                      // Find real list index
                      const originalIndex = listaOcorrencias.indexOf(oc);

                      const natDesc = oc.natureza_ocorrencia === 'Outro' ? oc.natureza_outro : oc.natureza_ocorrencia;
                      const isBO = oc.tipo === 'BO';

                      return (
                        <div
                          key={actualIdx}
                          className={`p-3.5 bg-slate-900/90 border rounded-lg hover:border-slate-700/80 transition-all text-xs font-sans flex flex-col md:flex-row justify-between gap-4 ${
                            isBO ? 'border-blue-900/40 hover:bg-slate-900' : 'border-emerald-900/40 hover:bg-slate-900'
                          }`}
                        >
                          <div className="space-y-2 flex-1">
                            {/* Header do card de ocorrência */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
                                isBO ? 'bg-blue-950 border border-blue-800 text-blue-300' : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                              }`}>
                                {isBO ? 'BOLETIM DE OCORRÊNCIA' : 'TCO'}
                              </span>

                              <span className="font-bold text-white text-sm">
                                {natDesc}
                              </span>

                              <span className="text-[10px] text-slate-500 font-mono">
                                ({oc.data} às {oc.hora})
                              </span>
                            </div>

                            {/* Detalhes específicos em grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-2 bg-slate-950/40 border border-slate-850 rounded font-mono">
                              <div>
                                <span className="text-slate-500 uppercase">Local: </span>
                                <span className="text-slate-300 font-sans">{oc.rua_avenida}, {oc.bairro}, {oc.cidade}</span>
                              </div>
                              {isBO ? (
                                <>
                                  <div>
                                    <span className="text-slate-500 uppercase">Guarnição: </span>
                                    <span className="text-blue-300 font-sans">{oc.guarnicao_responsavel}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase">Viatura: </span>
                                    <span className="text-slate-300">{oc.viatura_id_placa || 'Sem viatura vinculada'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase">Envolvidos: </span>
                                    <span className="text-red-400 font-bold">{oc.qtd_envolvidos} pessoa(s)</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-slate-500 uppercase">Autor do Fato: </span>
                                    <span className="text-amber-400 font-sans">{oc.autor_fato}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase">Vítima: </span>
                                    <span className="text-teal-300 font-sans">{oc.vitima}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Apreensões detalhadas */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                              <div>
                                <span className="text-slate-500 uppercase">Objetos Apreendidos: </span>
                                <span className="text-slate-350">{oc.objetos_apreendidos || 'Não informado'}</span>
                              </div>
                              {isBO && (
                                <>
                                  <div>
                                    <span className="text-slate-500 uppercase">Drogas: </span>
                                    <span className="text-red-300">{oc.drogas_apreendidas || 'Nenhuma'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase">Armas: </span>
                                    <span className="text-yellow-350">{oc.armas_apreendidas_texto || 'Nenhuma'}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="border-t border-slate-800/50 pt-1.5 mt-1">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold mb-0.5">Narrativa dos fatos:</span>
                              <p className="text-slate-300 leading-normal font-sans italic whitespace-pre-line bg-slate-950 p-2 rounded border border-slate-855">
                                {oc.observacoes}
                              </p>
                            </div>

                            {oc.observacoes_finais && (
                              <div className="text-[11px] text-slate-400 font-sans mt-1">
                                <span className="font-bold text-slate-500 text-[10px] font-mono uppercase">Observações Complementares: </span>
                                {oc.observacoes_finais}
                              </div>
                            )}
                          </div>

                          {/* Botões de Ação para o item de ocorrência */}
                          <div className="flex md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                            <button
                              type="button"
                              onClick={() => handleEditOcorrenciaItem(originalIndex)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold py-1.5 px-3 rounded border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
                              title="Editar ocorrência para correção"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveOcorrencia(originalIndex)}
                              className="text-xs bg-red-950/30 hover:bg-red-900/40 text-red-400 font-semibold py-1.5 px-3 rounded border border-red-900/35 flex items-center justify-center gap-1.5 transition cursor-pointer"
                              title="Excluir ocorrência permanentemente"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
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

{/* 05 - RESULTADOS DO SERVIÇO */}
<div className="border border-slate-700 rounded-xl p-6 mb-6">
  <h2 className="text-yellow-400 font-bold text-xl mb-6">
    05 — RESULTADOS DO SERVIÇO
  </h2>

  {/* ABORDAGENS */}
  <div className="grid md:grid-cols-2 gap-6 mb-6">

    <div className="border border-slate-700 rounded-lg p-4">
      <h3 className="text-cyan-400 font-bold mb-4">
        ABORDAGENS REALIZADAS
      </h3>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="text-sm text-slate-400">
            PESSOAS ABORDADAS
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            VEÍCULOS ABORDADOS
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            CARROS
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            MOTOCICLETAS
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

      </div>
    </div>

    {/* PRODUTIVIDADE */}
    <div className="border border-slate-700 rounded-lg p-4">
      <h3 className="text-cyan-400 font-bold mb-4">
        PRODUTIVIDADE DIÁRIA
      </h3>

      <div className="grid grid-cols-1 gap-4">

        <div>
          <label className="text-sm text-slate-400">
            TCO REGISTRADOS
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            PRISÃO EM FLAGRANTE
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            PESSOAS CONDUZIDAS
          </label>

          <input
            type="number"
            className="w-full bg-black border border-slate-700 rounded p-3 mt-1"
            placeholder="0"
          />
        </div>

      </div>
    </div>
  </div>

  {/* APREENSÕES */}
  <div className="border border-slate-700 rounded-lg p-4">
    <h3 className="text-cyan-400 font-bold mb-4">
      APREENSÕES (QUANTIDADE)
    </h3>

    <div className="grid md:grid-cols-2 gap-4">

      <input
        type="text"
        placeholder="Veículos apreendidos"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Arma branca apreendida"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Autos de remoção"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Veículos notificados"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Veículos recuperados"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Arma de fogo"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Munições"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Drogas"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Valores"
        className="bg-black border border-slate-700 rounded p-3"
      />

      <input
        type="text"
        placeholder="Diversos"
        className="bg-black border border-slate-700 rounded p-3"
      />

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
