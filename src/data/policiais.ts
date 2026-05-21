export interface PolicialPMMT {
  graduacao: string;
  nome_completo: string;
  matricula: string;
}

export const LISTA_POLICIAIS_PMMT: PolicialPMMT[] = [
  { graduacao: 'CAP PM', nome_completo: 'JEORGE AUGUSTO FERNANDES DE JESUS', matricula: '882.437' },
  { graduacao: '2º TEN PM', nome_completo: 'FRANCKCINEY CANAVARROS MAGALHÃES', matricula: '880.279' },
  { graduacao: '2º TEN PM', nome_completo: 'WELLINGTON ALVES DA SILVA', matricula: '881.504' },
  { graduacao: '1º SGT PM', nome_completo: 'JUSCELINO FERREIRA DA LUZ', matricula: '880.492' },
  { graduacao: '2º SGT PM', nome_completo: 'EDUARDO SILVA RODRIGUES', matricula: '883.694' },
  { graduacao: '2º SGT PM', nome_completo: 'ALLAN M. OLIVEIRA BOSAIPO', matricula: '885.109' },
  { graduacao: '2º SGT PM', nome_completo: 'TIAGO RODRIGUES ALVES', matricula: '886.302' },
  { graduacao: '2º SGT PM', nome_completo: 'DOUGLAS SOUZA PORTO', matricula: '887.198' },
  { graduacao: '3º SGT PM', nome_completo: 'GLAUKO A. S. RODRIGUES DE LIMA', matricula: '884.122' },
  { graduacao: '3º SGT PM', nome_completo: 'LEANDRO DE JESUS SOUZA', matricula: '885.136' },
  { graduacao: '3º SGT PM', nome_completo: 'DIEGO A. DE SOUSA BOHRER', matricula: '885.117' },
  { graduacao: 'CB PM', nome_completo: 'MATEUS FETTER', matricula: '885.982' },
  { graduacao: 'CB PM', nome_completo: 'MARCELO DIAS BATISTA', matricula: '885.918' },
  { graduacao: 'CB PM', nome_completo: 'RHANGEL NUNES RAMOS', matricula: '886.045' },
  { graduacao: 'CB PM', nome_completo: 'KEVEN ALLEF FERREIRA DA COSTA', matricula: '886.245' },
  { graduacao: 'CB PM', nome_completo: 'JOSEAN EVARISTO DA SILVA', matricula: '886.343' },
  { graduacao: 'CB PM', nome_completo: 'RENAN FRANCISCO GOMES', matricula: '886.469' },
  { graduacao: 'CB PM', nome_completo: 'ILDEONES SILVA DA LUZ', matricula: '886.451' },
  { graduacao: 'CB PM', nome_completo: 'MARCOS SILVA OLIVEIRA', matricula: '886.462' },
  { graduacao: 'CB PM', nome_completo: 'THIAGO MARTINS DA SILVA', matricula: '886.594' },
  { graduacao: 'CB PM', nome_completo: 'VENILSON SOUZA MATOS', matricula: '887.688' },
  { graduacao: 'SD PM', nome_completo: 'THIAGO FAUSTINO DE OLIVEIRA', matricula: '886.471' },
  { graduacao: 'SD PM', nome_completo: 'FRANCISCO ANTONIO DA SILVA FILHO', matricula: '888.550' }
];

export const OBTER_PRIMEIRO_NOME = (nomeCompleto: string) => {
  const parts = nomeCompleto.split(' ');
  if (parts.length <= 1) return nomeCompleto;
  // returns e.g. "JEORGE" (sometimes we want first and last)
  return parts[0];
};

export const OBTER_NOME_GUERRA_OU_ABREVIADO = (graduacao: string, nomeCompleto: string) => {
  const parts = nomeCompleto.split(' ');
  let nomeDeGuerra = parts[0];
  if (parts.length > 2) {
    nomeDeGuerra = `${parts[0]} ${parts[parts.length - 1]}`;
  } else if (parts.length === 2) {
    nomeDeGuerra = `${parts[0]} ${parts[1]}`;
  }
  return `${graduacao} ${nomeDeGuerra}`;
};

export const OBTER_PESO_PATENTE = (graduacao: string): number => {
  const cleanGrad = graduacao.toUpperCase().trim();
  if (cleanGrad.includes('CAP PM') || cleanGrad.startsWith('CAP')) return 70;
  if (cleanGrad.includes('1º TEN') || cleanGrad.includes('1ºTEN')) return 61;
  if (cleanGrad.includes('2º TEN') || cleanGrad.includes('2ºTEN')) return 60;
  if (cleanGrad.includes('1º SGT') || cleanGrad.includes('1ºSGT')) return 50;
  if (cleanGrad.includes('2º SGT') || cleanGrad.includes('2ºSGT')) return 40;
  if (cleanGrad.includes('3º SGT') || cleanGrad.includes('3ºSGT')) return 30;
  if (cleanGrad.includes('CB PM') || cleanGrad.startsWith('CB')) return 20;
  if (cleanGrad.includes('SD PM') || cleanGrad.startsWith('SD')) return 10;
  return 0;
};
