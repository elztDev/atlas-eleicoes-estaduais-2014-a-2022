const ATLAS_META = {
  revisao:'18/09/2026',
  status:'Governadores preenchidos; Assembleias 2014, 2018 e 2022 preenchidas'
};

const ATLAS_DATA = [
  ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']
].map(([uf,nome]) => ({
  uf,nome,
  governadores:{2014:null,2018:null,2022:null},
  assembleia:{2014:null,2018:null,2022:null},
  notes:[]
}));



/*
  Escala visual de ideologia usada SOMENTE para cores nos mapas/plenários.
  A classificação não é inferida pelo site: ela é baseada em surveys acadêmicos.

  2014: referência histórica mais ampla (classificação esquerda/centro/direita)
  a partir de estudo com dados de 2014/2021 sobre blocos partidários.
  2018: scores do survey UFPR/ABCP publicados em Bolognesi et al. (2021).
  2022: scores de experts publicados em Bolognesi et al. (2025).

  Para 2018/2022, o site usa os cortes metodológicos publicados em Bolognesi et al.:
  0–1,50 extrema esquerda; 1,51–3 esquerda; 3,01–4,49 centro-esquerda;
  4,50–5,50 centro; 5,51–7 centro-direita; 7,01–8,50 direita;
  8,51–10 extrema direita.
*/
const IDEOLOGY_META = {
  source2014:'https://www.scielo.br/j/eh/a/kwtYrccH8PpypSzW9mgkWfv/?lang=pt',
  source2018:'https://www.scielo.br/j/dados/a/zzyM3gzHD4P45WWdytXjZWg/?format=html&lang=pt',
  source2022:'https://www.scielo.br/j/op/a/hv8GBg9hfCCZLwcWktfYhtC/abstract/?lang=pt',
  colors:{
    'extrema esquerda':'#7f1d1d',
    'esquerda':'#b91c1c',
    'centro-esquerda':'#e05a5a',
    'centro':'#8b8b8b',
    'centro-direita':'#6b9fd4',
    'direita':'#2f6fb2',
    'extrema direita':'#173f73',
    'mista':'#776a9f',
    'não classificada':'#d7d5d0'
  }
};

const PARTY_ALIASES = {
  'PC DO B':'PCDOB','PCDOB':'PCDOB','PCdoB':'PCDOB',
  'PSOL':'PSOL','PSTU':'PSTU','PCO':'PCO','PCB':'PCB','UP':'UP',
  'PT':'PT','PSB':'PSB','REDE':'REDE','PDT':'PDT','PV':'PV',
  'SOLIDARIEDADE':'SDD','SDD':'SDD',
  'CIDADANIA':'CDD','CDD':'CDD','PPS':'PPS',
  'AVANTE':'AVANTE','MDB':'MDB','PMDB':'PMDB','PMN':'PMN','PHS':'PHS',
  'PSDB':'PSDB','PSD':'PSD','PMB':'PMB','PODE':'PODE','PODEMOS':'PODE',
  'PROS':'PROS','PRTB':'PRTB','AGIR':'AGIR','PTB':'PTB',
  'PP':'PP','PROGRESSISTAS':'PP','PROGRE':'PP',
  'DC':'DC','DEMOCRACIA CRISTÃ':'DC','PSDC':'PSDC',
  'REPUBLICANOS':'REP','REP':'REP','PRB':'PRB',
  'PSC':'PSC','UNIÃO':'UNIAO','UNIÃO BRASIL':'UNIAO','UNIAO':'UNIAO',
  'PATRIOTA':'PATRI','PATRI':'PATRI','NOVO':'NOVO','PL':'PL','PR':'PR',
  'PSL':'PSL','DEM':'DEM','PTC':'PTC','PTN':'PTN','PRP':'PRP','PT DO B':'PTDOB'
};

const PARTY_IDEOLOGY_SCORES = {
  2018:{
    PSTU:.51,PCO:.61,PCB:.91,PSOL:1.28,PCDOB:1.92,PT:2.97,PDT:3.92,PSB:4.05,REDE:4.77,PPS:4.92,PV:5.29,
    PTB:6.10,AVANTE:6.32,SDD:6.50,PMN:6.88,PMB:6.90,PHS:6.96,MDB:7.01,PSD:7.09,PSDB:7.11,PODE:7.24,
    PRTB:7.45,PROS:7.47,PRP:7.59,PRB:7.78,REP:7.78,PR:7.78,PTC:7.86,DC:8.11,PSL:8.11,NOVO:8.13,PP:8.20,
    PSC:8.33,PATRI:8.55,DEM:8.57
  },
  2022:{
    PSTU:.51,PCO:.55,PCB:.69,PSOL:1.41,UP:1.63,PCDOB:1.78,PT:2.68,PSB:3.59,REDE:3.69,PDT:3.86,PV:4.12,
    SDD:6.01,CDD:6.17,AVANTE:6.47,MDB:6.50,PMN:6.74,PSDB:6.76,PSD:6.94,PMB:7.29,PODE:7.44,PROS:7.45,
    PRTB:7.49,AGIR:7.55,PTB:7.72,PP:8.15,DC:8.21,REP:8.33,PRB:8.33,PSC:8.41,UNIAO:8.49,PATRI:8.60,NOVO:8.67,PL:8.80
  }
};

const PARTY_IDEOLOGY_2014 = {
  esquerda:['PCDOB','PT','PDT','PSB','PPS'],
  centro:['PMDB','PSDB'],
  direita:['PP','DEM','PSD','PR','PTB','PRB','PSC','PHS','PTDOB','PTC','PTN','PSL','PRTB','PSDC','PRP','PMN','SDD','PROS','PPL','PEN']
};

const SOURCES = {
  tse2014:'https://dadosabertos.tse.jus.br/dataset/resultados-2014',
  tse2018:'https://dadosabertos.tse.jus.br/dataset/resultados-2018',
  tse2022:'https://dadosabertos.tse.jus.br/dataset/resultados-2022',
  colig2014:'https://dadosabertos.tse.jus.br/dataset/candidatos-2014/resource/112f7dca-2960-4668-ada8-d09476259667',
  colig2018:'https://dadosabertos.tse.jus.br/dataset/candidatos-2018/resource/f7ea0bb9-bc76-45b4-8565-32eb096d64c5',
  colig2022:'https://dadosabertos.tse.jus.br/dataset/candidatos-2022/resource/dbcf2dfb-14b1-430a-a22a-327cc6601737',
  aux2022Nacional:'https://www.dci.com.br/politica/eleicoes-2022/eleicoes-2022-veja-todos-os-deputados-estaduais-eleitos-por-estado/',
  aux2022DF:'https://pt.wikipedia.org/wiki/Lista_de_deputados_distritais_do_Distrito_Federal_da_9.%C2%AA_legislatura',
  aux2022MS:'https://www.tre-ms.jus.br/comunicacao/noticias/2022/Dezembro/tre-ms-diploma-candidatos-eleitos-em-2022',
  aux2022SE:'https://www.tre-se.jus.br/comunicacao/noticias/2022/Dezembro/tre-se-realiza-solenidade-de-diplomacao-dos-eleitos',
  aux2022MA:'https://www.al.ma.leg.br/noticias2/45850',
  aux2022PA:'https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_estaduais_no_Par%C3%A1_em_2022',
  aux2022PB:'https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_estaduais_na_Para%C3%ADba_em_2022'
};

function seed(uf, patch){
  const item = ATLAS_DATA.find(x => x.uf === uf);
  if (!item) return;
  Object.assign(item.governadores, patch.governadores || {});
  Object.assign(item.assembleia, patch.assembleia || {});
  item.notes = patch.notes || item.notes;
}

/*
  Estados de disponibilidade dos dados:
  - null = Em validação (ainda estamos conferindo)
  - {status:'nao-aplica'} = — (não se aplica / não existia naquela eleição)
  - {status:'nao-localizado'} = Não localizado (a fonte consultada não forneceu o dado)

  Estrutura dos dados da Assembleia:
  {
    bancada: 'PARTIDO/FEDERAÇÃO',
    cadeiras: 12,
    total: 70,
    maiorAlianca: { nome:'...', cadeiras:20, tipo:'Coligação' },
    grupos: [
      { nome:'Partido/Federação A', cadeiras:20, partidos:['A'] },
      { nome:'Federação B-C', cadeiras:15, partidos:['B','C'] }
    ]
  }

  No plenário, "grupos" deve representar partidos e/ou federações efetivamente
  representados, inclusive em 2014 e 2018. A coligação/federação com mais cadeiras
  permanece registrada separadamente em "maiorAlianca". Não preencher por inferência.
*/

/* Governadores — base histórica preenchida a partir de registros/resultados da Justiça Eleitoral.
   O campo apoioSegundoTurno foi preenchido conforme as relações consolidadas fornecidas para esta versão do site.
   Em 2014, estados não incluídos na relação fornecida permanecem em validação. */
seed("AC",{governadores:{2014:{candidato:"Tião Viana",partido:"PT",coligacao:"Frente Popular do Acre",partidos:["PT","PDT","PRB","PSL","PTN","PSDC","PHS","PSB","PRP","PEN","PPL","PCdoB","PROS","PTB"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/acre-tiao-viana-e-reeleito-governador-do-acre"},2018:{candidato:"Gladson Cameli",partido:"PP",coligacao:"Mudança e Competência",partidos:["PP","MDB","PSDB","DEM","PSD","PTB","PMN","Solidariedade","PTC","PR","PPS"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/eleitores-do-acre-elegem-governador-em-1o-turno"},2022:{candidato:"Gladson Cameli",partido:"PP",coligacao:"Avançar para Fazer Mais",partidos:["PP","PDT","Federação PSDB-Cidadania","PODE","Solidariedade","Patriota","DC","PMN","PMB"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("AL",{governadores:{2014:{candidato:"Renan Filho",partido:"PMDB",coligacao:"Com o Povo Pra Alagoas Mudar",partidos:["PMDB","PT","PDT","PV","PCdoB","PROS","PSD","PTB","PSC","PTdoB","PHS"],apoioSegundoTurno:null,source:SOURCES.colig2014},2018:{candidato:"Renan Filho",partido:"MDB",coligacao:"Avança Mais Alagoas",partidos:["MDB","PT","PTB","PDT","PODE","PPS","Solidariedade","PR","PCdoB","PHS","PV","AVANTE","PSD","PRTB","DC","PRP","PMB","PMN"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Paulo Dantas",partido:"MDB",coligacao:"Alagoas Daqui pra Melhor",partidos:["MDB","Federação Brasil da Esperança (PT/PCdoB/PV)","PDT","PSC","PODE","Solidariedade"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("AP",{governadores:{2014:{candidato:"Waldez Góes",partido:"PDT",coligacao:"A Força do Povo",partidos:["PDT","PP","PMDB"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/waldez-goes-vence-eleicao-no-amapa"},2018:{candidato:"Waldez Góes",partido:"PDT",coligacao:"Com a Força do Povo por Mais Conquistas",partidos:["PDT","PROS","PTB","MDB","DC","PRB","PRP","PCdoB","PMB"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/no-amapa-a-disputa-para-o-governo-do-estado-ira-a-segundo-turno"},2022:{candidato:"Clécio Luís",partido:"Solidariedade",coligacao:"Amapá para Todos",partidos:["Federação PSDB-Cidadania","Republicanos","PP","PL","PDT","União","Solidariedade"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("AM",{governadores:{2014:{candidato:"José Melo",partido:"PROS",coligacao:"Fazendo Mais Por Nossa Gente",partidos:["PROS","DEM","PSL","PTN","PSC","PR","PRTB","PHS","PTC","PV","PRP","PSDB","PEN","PSD","SD","PTdoB"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/amazonas-jose-melo-e-reeleito-governador"},2018:{candidato:"Wilson Lima",partido:"PSC",coligacao:"Transformação por um Novo Amazonas",partidos:["PSC","PRTB","REDE"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/no-amazonas-disputa-pelo-governo-do-estado-sera-decidida-no-2o-turno"},2022:{candidato:"Wilson Lima",partido:"União",coligacao:"Aqui é Trabalho",partidos:["Republicanos","PP","PTB","PSC","PL","PRTB","PMN","União","Patriota","AVANTE"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("BA",{governadores:{2014:{candidato:"Rui Costa",partido:"PT",coligacao:"Pra Bahia Mudar Mais",partidos:["PT","PP","PCdoB","PDT","PR","PTB","PSD","PMN","PTdoB"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:SOURCES.colig2014},2018:{candidato:"Rui Costa",partido:"PT",coligacao:"Mais Trabalho por Toda a Bahia",partidos:["PT","PP","PDT","PSD","PSB","PCdoB","PR","PMB","PRP","PODE","AVANTE","PMN","PROS","PTC"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/governador-da-bahia-e-reeleito-em-1o-turno"},2022:{candidato:"Jerônimo Rodrigues",partido:"PT",coligacao:"Pela Bahia, Pelo Brasil",partidos:["Federação Brasil da Esperança (PT/PCdoB/PV)","PSB","PSD","AVANTE","MDB"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("CE",{governadores:{2014:{candidato:"Camilo Santana",partido:"PT",coligacao:"Pro Ceará Seguir Mudando",partidos:["PT","PROS","PDT","PCdoB","PP","PTB","PV","PRB","PSD","PSL","PMN","SD","PTC","PTdoB","PHS","PRTB","PEN","PPL"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:SOURCES.colig2014},2018:{candidato:"Camilo Santana",partido:"PT",coligacao:"Por Um Ceará Cada Vez Mais Forte",partidos:["PP","PDT","PT","PTB","PR","PPS","DEM","PRTB","PMN","PMB","PSB","PV","PRP","PATRI","PPL","PCdoB"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Elmano de Freitas",partido:"PT",coligacao:"Ceará Cada Vez Mais Forte",partidos:["Federação Brasil da Esperança (PT/PCdoB/PV)","PP","MDB","PRTB","Federação PSOL-REDE","Solidariedade"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("DF",{governadores:{2014:{candidato:"Rodrigo Rollemberg",partido:"PSB",coligacao:"Somos Todos Brasília",partidos:["PSB","SD","PDT","PSD"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/rodrigo-rollemberg-psb-e-eleito-governador-do-df"},2018:{candidato:"Ibaneis Rocha",partido:"MDB",coligacao:"Pra Fazer a Diferença",partidos:["MDB","PP","AVANTE","PSL","PPL"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Ibaneis Rocha",partido:"MDB",coligacao:"Unidos pelo DF",partidos:["AVANTE","PROS","AGIR","PP","Solidariedade","MDB","PL"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("ES",{governadores:{2014:{candidato:"Paulo Hartung",partido:"PMDB",coligacao:"O Espírito Santo Pode Muito Mais",partidos:["PMDB","PSDB","DEM","SD","PEN","PROS","PRP"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/espirito-santo-paulo-hartung-e-eleito-governador-do-espirito-santo"},2018:{candidato:"Renato Casagrande",partido:"PSB",coligacao:"Espírito Santo Mais Igual",partidos:["PSB","PHS","PROS","PV","PSC","AVANTE","PTC","PPS","PSDB","PP","DEM","PDT","PPL","DC","Solidariedade","PRP","PSD"],apoioSegundoTurno:{candidato:"Nenhum dos dois",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Renato Casagrande",partido:"PSB",coligacao:"Juntos por um Espírito Santo mais Forte",partidos:["MDB","PP","PROS","PSB","PODE","Federação Brasil da Esperança (PT/PCdoB/PV)","Federação PSDB-Cidadania","PDT"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("GO",{governadores:{2014:{candidato:"Marconi Perillo",partido:"PSDB",coligacao:"Garantia de um Futuro Melhor para Goiás",partidos:["PRB","PP","PDT","PTB","PSL","PR","PPS","PHS","PMN","PTC","PV","PSDB","PEN","PSD","PTdoB","PROS"],apoioSegundoTurno:{candidato:"Aécio Neves",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/marconi-perillo-e-reeleito-governador-de-goias"},2018:{candidato:"Ronaldo Caiado",partido:"DEM",coligacao:"A Mudança é Agora",partidos:["DEM","PRP","PROS","PMN","PMB","PSC","DC","PSL","PODE","PTC","PRTB","PDT"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/ronaldo-caiado-dem-e-eleito-governador-de-goias-em-1o-turno"},2022:{candidato:"Ronaldo Caiado",partido:"União",coligacao:"Pra Seguir em Frente",partidos:["MDB","União","PODE","PTB","PSC","PSD","AVANTE","PRTB","PP","Solidariedade","PROS","PDT"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("MA",{governadores:{2014:{candidato:"Flávio Dino",partido:"PCdoB",coligacao:"Todos Pelo Maranhão",partidos:["PP","SD","PROS","PSDB","PCdoB","PSB","PDT","PTC","PPS"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:SOURCES.colig2014},2018:{candidato:"Flávio Dino",partido:"PCdoB",coligacao:"Todos Pelo Maranhão",partidos:["PCdoB","PRB","PDT","PPS","PT","AVANTE","PTB","PROS","PSB","PR","DEM","PP","PATRI","PTC","Solidariedade","PPL"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Carlos Brandão",partido:"PSB",coligacao:"Para o Bem do Maranhão",partidos:["PSB","MDB","PP","Patriota","PODE","Federação Brasil da Esperança (PT/PCdoB/PV)","Federação PSDB-Cidadania"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("MT",{governadores:{2014:{candidato:"Pedro Taques",partido:"PDT",coligacao:"Coragem e Atitude para Mudar",partidos:["PDT","PP","DEM","PSDB","PSB","PPS","PV","PTB","PSDC","PSC","PRP","PSL","PRB"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/mato-grosso-pedro-taques-e-eleito-governador"},2018:{candidato:"Mauro Mendes",partido:"DEM",coligacao:"Pra Mudar Mato Grosso",partidos:["DEM","PSD","PDT","PSC","MDB","PMB","PHS","PTC"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/eleicao-para-governador-em-mato-grosso-e-decidida-em-1o-turno"},2022:{candidato:"Mauro Mendes",partido:"União",coligacao:"Mato Grosso Avançando, Sua Vida Melhorando",partidos:["Federação PSDB-Cidadania","União","Republicanos","PL","MDB","PODE","PSB","PROS"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("MS",{governadores:{2014:{candidato:"Reinaldo Azambuja",partido:"PSDB",coligacao:"Novo Tempo",partidos:["PSDB","DEM","PSD","SD","PPS","PMN"],apoioSegundoTurno:{candidato:"Aécio Neves",observacao:""},source:SOURCES.colig2014},2018:{candidato:"Reinaldo Azambuja",partido:"PSDB",coligacao:"Avançar com Responsabilidade",partidos:["PMN","DEM","PP","PSB","PTB","PSDB","PATRI","PSD","PPS","AVANTE","Solidariedade","PROS"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/reinaldo-azambuja-e-juiz-odilon-vao-ao-segundo-turno-no-mato-grosso-do-sul"},2022:{candidato:"Eduardo Riedel",partido:"PSDB",coligacao:"Trabalhando por um Novo Futuro",partidos:["Federação PSDB-Cidadania","Republicanos","PP","PSB","PL","PDT"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("MG",{governadores:{2014:{candidato:"Fernando Pimentel",partido:"PT",coligacao:"Minas pra Você",partidos:["PT","PMDB","PCdoB","PROS","PRB"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/minas-gerais-fernando-pimentel-e-eleito-governador"},2018:{candidato:"Romeu Zema",partido:"NOVO",coligacao:"sem coligação",partidos:["NOVO"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Romeu Zema",partido:"NOVO",coligacao:"Minas nos Trilhos",partidos:["PP","PODE","Solidariedade","Patriota","AVANTE","PMN","AGIR","DC","MDB","NOVO"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("PA",{governadores:{2014:{candidato:"Simão Jatene",partido:"PSDB",coligacao:"Juntos com o Povo",partidos:["PSDB","PSD","PSB","PP","SD","PRB","PSC","PTB","PPS","PEN","PMN","PTC","PSDC","PTdoB","PRP"],apoioSegundoTurno:{candidato:"Aécio Neves",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/simao-jatene-e-reeleito-governador-do-para"},2018:{candidato:"Helder Barbalho",partido:"MDB",coligacao:"O Pará Daqui Pra Frente",partidos:["MDB","PP","PSD","PRB","PR","PTC","PSC","PROS","PTB","PATRI","PODE","DC","AVANTE","PMB","PSL","PHS","PRTB"],apoioSegundoTurno:{candidato:"Nenhum dos dois",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/paraenses-voltarao-as-urnas-para-escolher-governador-em-2o-turno"},2022:{candidato:"Helder Barbalho",partido:"MDB",coligacao:"Pra Seguir em Frente",partidos:["MDB","Federação PSDB-Cidadania","Federação Brasil da Esperança (PT/PCdoB/PV)","PP","PSD","PDT","Republicanos","AVANTE","PODE","União","DC","PTB","PSB"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("PB",{governadores:{2014:{candidato:"Ricardo Coutinho",partido:"PSB",coligacao:"A Força do Trabalho",partidos:["PSB","PT","DEM","PCdoB","PV","PDT","PSL","PPL","PRTB","PRP","PHS"],apoioSegundoTurno:null,source:SOURCES.colig2014},2018:{candidato:"João Azevêdo",partido:"PSB",coligacao:"A Força do Trabalho",partidos:["PRB","PDT","PT","PTB","REDE","PODE","PPS","DEM","PMN","PSB","PRP","PCdoB","AVANTE","PROS"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/joao-azevedo-lins-filho-psb-e-eleito-no-primeiro-turno-governador-da-pb"},2022:{candidato:"João Azevêdo",partido:"PSB",coligacao:"Juntos pela Paraíba",partidos:["PSB","AGIR","PP","AVANTE","PMN","PSD","Solidariedade","PODE","Republicanos","Patriota","PROS"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("PR",{governadores:{2014:{candidato:"Beto Richa",partido:"PSDB",coligacao:"Todos Pelo Paraná",partidos:["PSDB","PROS","DEM","PSB","PSD","PTB","PP","PPS","PSC","PR","SD","PSL","PSDC","PMN","PHS","PEN","PTdoB"],apoioSegundoTurno:{candidato:"Aécio Neves",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/beto-richa-psdb-e-reeleito-no-primeiro-turno"},2018:{candidato:"Ratinho Junior",partido:"PSD",coligacao:"Paraná Inovador",partidos:["PSD","PSC","PV","PR","PRB","PHS","PPS","PODE","AVANTE"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/ratinho-junior-e-eleito-governador-do-parana-no-1o-turno"},2022:{candidato:"Ratinho Junior",partido:"PSD",coligacao:"A Mudança Não Para, Pra Frente Paraná",partidos:["Republicanos","MDB","Solidariedade","PL","PSD","União","PMB","PP","AGIR","PROS","PTB"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("PE",{governadores:{2014:{candidato:"Paulo Câmara",partido:"PSB",coligacao:"Frente Popular de Pernambuco",partidos:["PSB","PMDB","PSDB","DEM","PCdoB","PPS","PSD","PP","PV","PR","PROS","PSDC","PSL","PTC","PEN","PHS","PRP","SD","PRTB","PTN","PPL"],apoioSegundoTurno:null,source:SOURCES.colig2014},2018:{candidato:"Paulo Câmara",partido:"PSB",coligacao:"Frente Popular de Pernambuco",partidos:["PSB","PCdoB","PT","MDB","PP","PR","PMN","PTC","PRP","PATRI","PSD","PPL","Solidariedade"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/paulo-camara-e-reeleito-governador-de-pernambuco-em-1o-turno"},2022:{candidato:"Raquel Lyra",partido:"PSDB",coligacao:"Pernambuco Quer Mudar",partidos:["Federação PSDB-Cidadania","PRTB"],apoioSegundoTurno:{candidato:"Nenhum dos dois",observacao:""},source:SOURCES.colig2022}}});
seed("PI",{governadores:{2014:{candidato:"Wellington Dias",partido:"PT",coligacao:"A Vitória Com a Força do Povo",partidos:["PT","PP","PROS","PTB","PHS","SD","PRP"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:SOURCES.colig2014},2018:{candidato:"Wellington Dias",partido:"PT",coligacao:"A Vitória Com a Força do Povo",partidos:["PT","MDB","PP","PR","PDT","PSD","PCdoB","PTB","PRTB"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/wellington-dias-e-reeleito-governador-do-piaui"},2022:{candidato:"Rafael Fonteles",partido:"PT",coligacao:"A Força do Povo",partidos:["Federação Brasil da Esperança (PT/PCdoB/PV)","MDB","PSD","Solidariedade","PSB","PROS","AGIR"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("RJ",{governadores:{2014:{candidato:"Luiz Fernando Pezão",partido:"PMDB",coligacao:"O Rio em 1º lugar",partidos:["PMDB","PP","PSC","PTB","PSL","PPS","PTN","DEM","PSDC","PRTB","PHS","PMN","PTC","PRP","PSDB","PEN","PSD","SD"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/luiz-fernando-pezao-e-eleito-govluiz-fernando-pezao-e-eleito-governador-do-rio-de-janeiroernador-do-rio-de-janeiro"},2018:{candidato:"Wilson Witzel",partido:"PSC",coligacao:"Mais Ordem, Mais Progresso",partidos:["PSC","PROS"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Cláudio Castro",partido:"PL",coligacao:"Rio Unido e Mais Forte",partidos:["AVANTE","DC","MDB","PL","PMN","PODE","PP","PROS","PRTB","PSC","PTB","Republicanos","Solidariedade","União"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("RN",{governadores:{2014:{candidato:"Robinson Faria",partido:"PSD",coligacao:"Liderados Pelo Povo",partidos:["PSD","PCdoB","PT","PP","PTC","PRTB","PEN","PTdoB"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:SOURCES.colig2014},2018:{candidato:"Fátima Bezerra",partido:"PT",coligacao:"Do Lado Certo",partidos:["PT","PCdoB","PHS"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Fátima Bezerra",partido:"PT",coligacao:"O Melhor Vai Começar!",partidos:["Federação Brasil da Esperança (PT/PCdoB/PV)","PDT","MDB","PROS","Republicanos"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("RS",{governadores:{2014:{candidato:"José Ivo Sartori",partido:"PMDB",coligacao:"O Novo Caminho para o Rio Grande",partidos:["PMDB","PSD","PPS","PSB","PHS","PTdoB","PSL","PSDC"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/jose-ivo-sartori-e-eleito-governador-do-rio-grande-do-sul"},2018:{candidato:"Eduardo Leite",partido:"PSDB",coligacao:"Rio Grande da Gente",partidos:["PSDB","PTB","PP","PRB","PPS","REDE","PHS"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Eduardo Leite",partido:"PSDB",coligacao:"Um Só Rio Grande",partidos:["Federação PSDB-Cidadania","MDB","PSD","PODE","União"],apoioSegundoTurno:{candidato:"Nenhum dos dois",observacao:""},source:SOURCES.colig2022}}});
seed("RO",{governadores:{2014:{candidato:"Confúcio Moura",partido:"PMDB",coligacao:"Aliança por Uma Rondônia Melhor para Todos",partidos:["PDT","PMDB","PRTB","PCdoB","DEM"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/rondonia-confucio-moura-pmdb-e-eleito-governador-do-estado"},2018:{candidato:"Marcos Rocha",partido:"PSL",coligacao:"sem coligação",partidos:["PSL"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Marcos Rocha",partido:"União",coligacao:"Compromisso, Trabalho e Fé",partidos:["União","Republicanos","AVANTE","MDB","Patriota","PSC","Federação PSDB-Cidadania"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("RR",{governadores:{2014:{candidato:"Suely Campos",partido:"PP",coligacao:"Salve Roraima",partidos:["PP","PTB","DEM"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/roraima-suely-campos-e-a-nova-governadora-do-estado"},2018:{candidato:"Antonio Denarium",partido:"PSL",coligacao:"Agora é Roraima com Tudo",partidos:["PSL","PRB","PTC","PRP","PROS","PSC","PPL"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/antonio-denarium-e-jose-de-anchieta-vao-ao-segundo-turno-em-roraima"},2022:{candidato:"Antonio Denarium",partido:"PP",coligacao:"Roraima Trabalhando e Deus Abençoando",partidos:["PSD","PP","PRTB","Republicanos","União"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("SC",{governadores:{2014:{candidato:"Raimundo Colombo",partido:"PSD",coligacao:"Santa Catarina em Primeiro Lugar",partidos:["PSD","PRB","PMDB","PR","PTB","PSC","PSDC","PROS","PV","PCdoB","PDT","DEM"],apoioSegundoTurno:{candidato:"Dilma Rousseff",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/santa-catarina-raimundo-colombo-e-eleito-governador-no-primeiro-turno"},2018:{candidato:"Carlos Moisés",partido:"PSL",coligacao:"sem coligação",partidos:["PSL"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Jorginho Mello",partido:"PL",coligacao:"sem coligação",partidos:["PL"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("SP",{governadores:{2014:{candidato:"Geraldo Alckmin",partido:"PSDB",coligacao:"Aqui é São Paulo",partidos:["PSDB","DEM","PEN","PMN","PTdoB","PTC","PTN","SD","PPS","PRB","PSB","PSC","PSDC","PSL"],apoioSegundoTurno:{candidato:"Aécio Neves",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/alckmin-e-reeleito-com-mais-de-57-dos-votos-validos"},2018:{candidato:"João Doria",partido:"PSDB",coligacao:"Acelera SP",partidos:["PSDB","DEM","PSD","PRB","PP","PTC"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Tarcísio de Freitas",partido:"Republicanos",coligacao:"São Paulo Pode Mais",partidos:["Republicanos","PL","PSD","PTB","PSC","PMN"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});
seed("SE",{governadores:{2014:{candidato:"Jackson Barreto",partido:"PMDB",coligacao:"Agora é o Povo",partidos:["PMDB","PSB","PT","PDT","PCdoB","PROS","PSD","PRB","PRTB","PSDC","PRP"],apoioSegundoTurno:null,source:SOURCES.colig2014},2018:{candidato:"Belivaldo Chagas",partido:"PSD",coligacao:"Pra Sergipe Avançar",partidos:["PSD","PT","MDB","PP","DC","PHS","PCdoB"],apoioSegundoTurno:{candidato:"Haddad",observacao:""},source:"https://www.tse.jus.br/comunicacao/noticias/2018/Outubro/sergipe-tera-segundo-turno-entre-belivaldo-chagas-psd-e-valadares-filho-psb"},2022:{candidato:"Fábio Mitidieri",partido:"PSD",coligacao:"Novo Tempo pra Sergipe",partidos:["PDT","PSC","União","Republicanos","PP","PSD","AVANTE"],apoioSegundoTurno:{candidato:"Lula",observacao:""},source:SOURCES.colig2022}}});
seed("TO",{governadores:{2014:{candidato:"Marcelo Miranda",partido:"PMDB",coligacao:"A Experiência Faz a Mudança",partidos:["PMDB","PT","PSD","PV"],apoioSegundoTurno:null,source:"https://www.tse.jus.br/comunicacao/noticias/2014/Outubro/tocantins-marcelo-miranda-e-eleito-governador-em-1o-turno"},2018:{candidato:"Mauro Carlesse",partido:"PHS",coligacao:"Governo de Atitude",partidos:["PHS","Solidariedade","PP","DEM","PTC","PRB","AVANTE","PATRI","PROS"],apoioSegundoTurno:{candidato:"Nenhum dos dois",observacao:""},source:SOURCES.colig2018},2022:{candidato:"Wanderlei Barbosa",partido:"Republicanos",coligacao:"União pelo Tocantins",partidos:["Federação PSDB-Cidadania","União","PDT","Solidariedade","PTB","Republicanos","PSC"],apoioSegundoTurno:{candidato:"Bolsonaro",observacao:""},source:SOURCES.colig2022}}});

/* Assembleias Legislativas — 2022 validado por composição eleita.
   2014 e 2018 permanecem em validação porque exigem reconstrução das coligações proporcionais. */
/* Assembleias Legislativas — 2014.
   Composição saída das urnas; grupos representam bancadas por partido.
   A maior aliança registra a lista/coligação proporcional com mais cadeiras.
   Fonte principal: resultados oficiais do TSE; conferência de composição/coligações: Radar do Voto (dados TSE). */
seed("AC",{assembleia:{2014:{bancada:"PT",cadeiras:5,total:24,maiorAlianca:{nome:"PT / PROS",cadeiras:6,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:5,partidos:["PT"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"PMDB",cadeiras:2,partidos:["PMDB"]},
  {nome:"PTN",cadeiras:2,partidos:["PTN"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PRP",cadeiras:1,partidos:["PRP"]},
  {nome:"PSD",cadeiras:1,partidos:["PSD"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PSDC",cadeiras:1,partidos:["PSDC"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=AC",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("AL",{assembleia:{2014:{bancada:"PSDB",cadeiras:4,total:27,maiorAlianca:{nome:"PMDB / PDT / PSD / PSC",cadeiras:8,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSDB",cadeiras:4,partidos:["PSDB"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PRTB",cadeiras:3,partidos:["PRTB"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PSD",cadeiras:2,partidos:["PSD"]},
  {nome:"PROS",cadeiras:2,partidos:["PROS"]},
  {nome:"PPS",cadeiras:2,partidos:["PPS"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PSC",cadeiras:1,partidos:["PSC"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=AL",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("AP",{assembleia:{2014:{bancada:"PRB",cadeiras:4,total:24,maiorAlianca:{nome:"PRB / PHS",cadeiras:5,tipo:"Coligação proporcional"},grupos:[
  {nome:"PRB",cadeiras:4,partidos:["PRB"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PMDB",cadeiras:2,partidos:["PMDB"]},
  {nome:"PROS",cadeiras:2,partidos:["PROS"]},
  {nome:"PSOL",cadeiras:2,partidos:["PSOL"]},
  {nome:"PSDB",cadeiras:2,partidos:["PSDB"]},
  {nome:"PTB",cadeiras:2,partidos:["PTB"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PSDC",cadeiras:1,partidos:["PSDC"]},
  {nome:"PT do B",cadeiras:1,partidos:["PT do B"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=AP",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("AM",{assembleia:{2014:{bancada:"PSD / PMDB",cadeiras:3,total:24,maiorAlianca:{nome:"PMDB / PT / PP / PRB · PSD / PSDB / PROS / PSC",cadeiras:7,tipo:"Coligações proporcionais (empate)"},grupos:[
  {nome:"PSD",cadeiras:3,partidos:["PSD"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PTN",cadeiras:2,partidos:["PTN"]},
  {nome:"PSDB",cadeiras:2,partidos:["PSDB"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PSC",cadeiras:1,partidos:["PSC"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=AM",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PSD e PMDB como maiores bancadas, com 3 cadeiras cada. Também houve empate entre duas coligações proporcionais no topo, com 7 cadeiras cada."}}});

seed("BA",{assembleia:{2014:{bancada:"PT",cadeiras:11,total:63,maiorAlianca:{nome:"PT / PSD / PDT / PP / PR",cadeiras:30,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:11,partidos:["PT"]},
  {nome:"PSD",cadeiras:8,partidos:["PSD"]},
  {nome:"DEM",cadeiras:6,partidos:["DEM"]},
  {nome:"PMDB",cadeiras:6,partidos:["PMDB"]},
  {nome:"PDT",cadeiras:5,partidos:["PDT"]},
  {nome:"PP",cadeiras:5,partidos:["PP"]},
  {nome:"PSDB",cadeiras:3,partidos:["PSDB"]},
  {nome:"PCdoB",cadeiras:3,partidos:["PCdoB"]},
  {nome:"PTN",cadeiras:3,partidos:["PTN"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"PRB",cadeiras:2,partidos:["PRB"]},
  {nome:"PV",cadeiras:2,partidos:["PV"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"PRP",cadeiras:2,partidos:["PRP"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=BA",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("CE",{assembleia:{2014:{bancada:"PROS",cadeiras:12,total:46,maiorAlianca:{nome:"PROS / PT / Solidariedade / PSD / PRB / PV / PSL / PHS",cadeiras:22,tipo:"Coligação proporcional"},grupos:[
  {nome:"PROS",cadeiras:12,partidos:["PROS"]},
  {nome:"PMDB",cadeiras:6,partidos:["PMDB"]},
  {nome:"PDT",cadeiras:3,partidos:["PDT"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
  {nome:"PSD",cadeiras:2,partidos:["PSD"]},
  {nome:"PCdoB",cadeiras:2,partidos:["PCdoB"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"PSDC",cadeiras:1,partidos:["PSDC"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PSC",cadeiras:1,partidos:["PSC"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PSOL",cadeiras:1,partidos:["PSOL"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PTN",cadeiras:1,partidos:["PTN"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"PRP",cadeiras:1,partidos:["PRP"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=CE",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("DF",{assembleia:{2014:{bancada:"PT",cadeiras:4,total:24,maiorAlianca:{nome:"PT / PP",cadeiras:5,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:4,partidos:["PT"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PDT",cadeiras:3,partidos:["PDT"]},
  {nome:"PRTB",cadeiras:2,partidos:["PRTB"]},
  {nome:"PPL",cadeiras:1,partidos:["PPL"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PTB",cadeiras:1,partidos:["PTB"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PTC",cadeiras:1,partidos:["PTC"]},
  {nome:"PTN",cadeiras:1,partidos:["PTN"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=DF",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("ES",{assembleia:{2014:{bancada:"PMDB",cadeiras:4,total:30,maiorAlianca:{nome:"PMDB / DEM / PEN",cadeiras:7,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:4,partidos:["PMDB"]},
  {nome:"PRP",cadeiras:3,partidos:["PRP"]},
  {nome:"PT",cadeiras:3,partidos:["PT"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PSDB",cadeiras:2,partidos:["PSDB"]},
  {nome:"PPS",cadeiras:2,partidos:["PPS"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PSD",cadeiras:1,partidos:["PSD"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]},
  {nome:"PTC",cadeiras:1,partidos:["PTC"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PRTB",cadeiras:1,partidos:["PRTB"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=ES",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("GO",{assembleia:{2014:{bancada:"PSDB",cadeiras:7,total:41,maiorAlianca:{nome:"PSDB / PSD / PTB / PR",cadeiras:19,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSDB",cadeiras:7,partidos:["PSDB"]},
  {nome:"PMDB",cadeiras:5,partidos:["PMDB"]},
  {nome:"PSD",cadeiras:5,partidos:["PSD"]},
  {nome:"PTB",cadeiras:5,partidos:["PTB"]},
  {nome:"PT",cadeiras:4,partidos:["PT"]},
  {nome:"PHS",cadeiras:2,partidos:["PHS"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PRTB",cadeiras:1,partidos:["PRTB"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]},
  {nome:"PSC",cadeiras:1,partidos:["PSC"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PRP",cadeiras:1,partidos:["PRP"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=GO",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("MA",{assembleia:{2014:{bancada:"PMDB / PV",cadeiras:4,total:42,maiorAlianca:{nome:"PMDB / PV / PR / PSC / DEM / PRTB / PT do B",cadeiras:16,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:4,partidos:["PMDB"]},
  {nome:"PV",cadeiras:4,partidos:["PV"]},
  {nome:"PRB",cadeiras:3,partidos:["PRB"]},
  {nome:"PDT",cadeiras:3,partidos:["PDT"]},
  {nome:"PCdoB",cadeiras:3,partidos:["PCdoB"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"PSL",cadeiras:2,partidos:["PSL"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PSDB",cadeiras:2,partidos:["PSDB"]},
  {nome:"PTN",cadeiras:2,partidos:["PTN"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PSDC",cadeiras:1,partidos:["PSDC"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PTC",cadeiras:1,partidos:["PTC"]},
  {nome:"PRTB",cadeiras:1,partidos:["PRTB"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PT do B",cadeiras:1,partidos:["PT do B"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=MA",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PMDB e PV como maiores bancadas partidárias, com 4 cadeiras cada."}}});

seed("MT",{assembleia:{2014:{bancada:"PR",cadeiras:5,total:24,maiorAlianca:{nome:"PR / PMDB / PT",cadeiras:9,tipo:"Coligação proporcional"},grupos:[
  {nome:"PR",cadeiras:5,partidos:["PR"]},
  {nome:"PSD",cadeiras:4,partidos:["PSD"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PSB",cadeiras:3,partidos:["PSB"]},
  {nome:"PSDB",cadeiras:3,partidos:["PSDB"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PT",cadeiras:1,partidos:["PT"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=MT",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("MS",{assembleia:{2014:{bancada:"PMDB",cadeiras:6,total:24,maiorAlianca:{nome:"PMDB · PT / PR",cadeiras:6,tipo:"Listas proporcionais (empate)"},grupos:[
  {nome:"PMDB",cadeiras:6,partidos:["PMDB"]},
  {nome:"PT",cadeiras:4,partidos:["PT"]},
  {nome:"PSDB",cadeiras:4,partidos:["PSDB"]},
  {nome:"PDT",cadeiras:3,partidos:["PDT"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PT do B",cadeiras:2,partidos:["PT do B"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=MS",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate no topo entre a lista própria do PMDB e a coligação PT/PR, ambas com 6 cadeiras."}}});

seed("MG",{assembleia:{2014:{bancada:"PT / PMDB",cadeiras:10,total:77,maiorAlianca:{nome:"PT / PMDB / PRB / PROS",cadeiras:23,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:10,partidos:["PT"]},
  {nome:"PMDB",cadeiras:10,partidos:["PMDB"]},
  {nome:"PSDB",cadeiras:9,partidos:["PSDB"]},
  {nome:"PSD",cadeiras:4,partidos:["PSD"]},
  {nome:"PV",cadeiras:4,partidos:["PV"]},
  {nome:"PTB",cadeiras:4,partidos:["PTB"]},
  {nome:"PDT",cadeiras:4,partidos:["PDT"]},
  {nome:"PR",cadeiras:3,partidos:["PR"]},
  {nome:"PT do B",cadeiras:3,partidos:["PT do B"]},
  {nome:"PCdoB",cadeiras:3,partidos:["PCdoB"]},
  {nome:"PSB",cadeiras:3,partidos:["PSB"]},
  {nome:"PTN",cadeiras:3,partidos:["PTN"]},
  {nome:"PP",cadeiras:3,partidos:["PP"]},
  {nome:"PPS",cadeiras:3,partidos:["PPS"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PRB",cadeiras:2,partidos:["PRB"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]},
  {nome:"PTC",cadeiras:1,partidos:["PTC"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=MG",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PT e PMDB como maiores bancadas partidárias, com 10 cadeiras cada."}}});

seed("PA",{assembleia:{2014:{bancada:"PMDB",cadeiras:8,total:41,maiorAlianca:{nome:"PSDB / PSD / PTB / PP",cadeiras:12,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:8,partidos:["PMDB"]},
  {nome:"PSDB",cadeiras:6,partidos:["PSDB"]},
  {nome:"PT",cadeiras:3,partidos:["PT"]},
  {nome:"PSD",cadeiras:3,partidos:["PSD"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"PTB",cadeiras:2,partidos:["PTB"]},
  {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
  {nome:"PROS",cadeiras:2,partidos:["PROS"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PPL",cadeiras:1,partidos:["PPL"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=PA",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PB",{assembleia:{2014:{bancada:"PSB",cadeiras:5,total:36,maiorAlianca:{nome:"PSDB / PEN / PP / PTB / PR",cadeiras:12,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSB",cadeiras:5,partidos:["PSB"]},
  {nome:"PSDB",cadeiras:4,partidos:["PSDB"]},
  {nome:"PEN",cadeiras:4,partidos:["PEN"]},
  {nome:"PMDB",cadeiras:4,partidos:["PMDB"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"PSD",cadeiras:2,partidos:["PSD"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PSL",cadeiras:2,partidos:["PSL"]},
  {nome:"PT do B",cadeiras:2,partidos:["PT do B"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"PTN",cadeiras:1,partidos:["PTN"]},
  {nome:"PTB",cadeiras:1,partidos:["PTB"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=PB",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PR",{assembleia:{2014:{bancada:"PSC",cadeiras:12,total:54,maiorAlianca:{nome:"PSDB / DEM / PSB",cadeiras:13,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSC",cadeiras:12,partidos:["PSC"]},
  {nome:"PMDB",cadeiras:8,partidos:["PMDB"]},
  {nome:"PSDB",cadeiras:7,partidos:["PSDB"]},
  {nome:"DEM",cadeiras:4,partidos:["DEM"]},
  {nome:"PDT",cadeiras:4,partidos:["PDT"]},
  {nome:"PT",cadeiras:3,partidos:["PT"]},
  {nome:"PSD",cadeiras:3,partidos:["PSD"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"PPS",cadeiras:2,partidos:["PPS"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PTB",cadeiras:1,partidos:["PTB"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PPL",cadeiras:1,partidos:["PPL"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=PR",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PE",{assembleia:{2014:{bancada:"PSB",cadeiras:15,total:49,maiorAlianca:{nome:"PSB / PMDB / PR / PSD / PSDB / DEM / PTC",cadeiras:26,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSB",cadeiras:15,partidos:["PSB"]},
  {nome:"PTB",cadeiras:6,partidos:["PTB"]},
  {nome:"PP",cadeiras:4,partidos:["PP"]},
  {nome:"PT",cadeiras:3,partidos:["PT"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PR",cadeiras:3,partidos:["PR"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PSD",cadeiras:2,partidos:["PSD"]},
  {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PRP",cadeiras:1,partidos:["PRP"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"PSOL",cadeiras:1,partidos:["PSOL"]},
  {nome:"PTC",cadeiras:1,partidos:["PTC"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=PE",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PI",{assembleia:{2014:{bancada:"PMDB",cadeiras:6,total:30,maiorAlianca:{nome:"PMDB / PSB / PSD / PSDB / PDT / PRB",cadeiras:18,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:6,partidos:["PMDB"]},
  {nome:"PTB",cadeiras:5,partidos:["PTB"]},
  {nome:"PSB",cadeiras:3,partidos:["PSB"]},
  {nome:"PT",cadeiras:3,partidos:["PT"]},
  {nome:"PSD",cadeiras:3,partidos:["PSD"]},
  {nome:"PSDB",cadeiras:3,partidos:["PSDB"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PTC",cadeiras:2,partidos:["PTC"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=PI",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RJ",{assembleia:{2014:{bancada:"PMDB",cadeiras:15,total:70,maiorAlianca:{nome:"PMDB",cadeiras:15,tipo:"Lista proporcional"},grupos:[
  {nome:"PMDB",cadeiras:15,partidos:["PMDB"]},
  {nome:"PR",cadeiras:8,partidos:["PR"]},
  {nome:"PSD",cadeiras:7,partidos:["PSD"]},
  {nome:"PT",cadeiras:6,partidos:["PT"]},
  {nome:"PSOL",cadeiras:5,partidos:["PSOL"]},
  {nome:"PP",cadeiras:4,partidos:["PP"]},
  {nome:"PDT",cadeiras:3,partidos:["PDT"]},
  {nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},
  {nome:"PRB",cadeiras:2,partidos:["PRB"]},
  {nome:"PSL",cadeiras:2,partidos:["PSL"]},
  {nome:"PTB",cadeiras:2,partidos:["PTB"]},
  {nome:"PSDB",cadeiras:2,partidos:["PSDB"]},
  {nome:"PPS",cadeiras:2,partidos:["PPS"]},
  {nome:"PSDC",cadeiras:1,partidos:["PSDC"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]},
  {nome:"PT do B",cadeiras:1,partidos:["PT do B"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PTN",cadeiras:1,partidos:["PTN"]},
  {nome:"PSC",cadeiras:1,partidos:["PSC"]},
  {nome:"PTC",cadeiras:1,partidos:["PTC"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=RJ",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RN",{assembleia:{2014:{bancada:"PMDB",cadeiras:5,total:24,maiorAlianca:{nome:"PMDB / PROS / PSB / DEM / PR / Solidariedade / PDT",cadeiras:16,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:5,partidos:["PMDB"]},
  {nome:"PROS",cadeiras:4,partidos:["PROS"]},
  {nome:"PSD",cadeiras:3,partidos:["PSD"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PT",cadeiras:1,partidos:["PT"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PMN",cadeiras:1,partidos:["PMN"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]},
  {nome:"PT do B",cadeiras:1,partidos:["PT do B"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=RN",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RS",{assembleia:{2014:{bancada:"PT",cadeiras:11,total:55,maiorAlianca:{nome:"PT",cadeiras:11,tipo:"Lista proporcional"},grupos:[
  {nome:"PT",cadeiras:11,partidos:["PT"]},
  {nome:"PMDB",cadeiras:8,partidos:["PMDB"]},
  {nome:"PDT",cadeiras:8,partidos:["PDT"]},
  {nome:"PP",cadeiras:7,partidos:["PP"]},
  {nome:"PTB",cadeiras:5,partidos:["PTB"]},
  {nome:"PSDB",cadeiras:4,partidos:["PSDB"]},
  {nome:"PSB",cadeiras:3,partidos:["PSB"]},
  {nome:"PCdoB",cadeiras:2,partidos:["PCdoB"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PSOL",cadeiras:1,partidos:["PSOL"]},
  {nome:"PSD",cadeiras:1,partidos:["PSD"]},
  {nome:"PR",cadeiras:1,partidos:["PR"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PPL",cadeiras:1,partidos:["PPL"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=RS",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RO",{assembleia:{2014:{bancada:"PMDB / PP",cadeiras:3,total:24,maiorAlianca:{nome:"PMDB / PTN / PTB",cadeiras:5,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PP",cadeiras:3,partidos:["PP"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"PT do B",cadeiras:2,partidos:["PT do B"]},
  {nome:"PSDC",cadeiras:2,partidos:["PSDC"]},
  {nome:"PDT",cadeiras:2,partidos:["PDT"]},
  {nome:"PRP",cadeiras:1,partidos:["PRP"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PSD",cadeiras:1,partidos:["PSD"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PTN",cadeiras:1,partidos:["PTN"]},
  {nome:"PTB",cadeiras:1,partidos:["PTB"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=RO",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PMDB e PP como maiores bancadas partidárias, com 3 cadeiras cada."}}});

seed("RR",{assembleia:{2014:{bancada:"PRB / PMDB",cadeiras:3,total:24,maiorAlianca:{nome:"PMDB / PSB / PSDB / PROS",cadeiras:6,tipo:"Coligação proporcional"},grupos:[
  {nome:"PRB",cadeiras:3,partidos:["PRB"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PRP",cadeiras:2,partidos:["PRP"]},
  {nome:"PSDC",cadeiras:2,partidos:["PSDC"]},
  {nome:"PSL",cadeiras:2,partidos:["PSL"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PRTB",cadeiras:1,partidos:["PRTB"]},
  {nome:"PV",cadeiras:1,partidos:["PV"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]},
  {nome:"PEN",cadeiras:1,partidos:["PEN"]},
  {nome:"PSC",cadeiras:1,partidos:["PSC"]},
  {nome:"PT",cadeiras:1,partidos:["PT"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=RR",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PRB e PMDB como maiores bancadas partidárias, com 3 cadeiras cada."}}});

seed("SC",{assembleia:{2014:{bancada:"PMDB",cadeiras:10,total:40,maiorAlianca:{nome:"PMDB / PSD / DEM",cadeiras:20,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:10,partidos:["PMDB"]},
  {nome:"PSD",cadeiras:9,partidos:["PSD"]},
  {nome:"PT",cadeiras:5,partidos:["PT"]},
  {nome:"PP",cadeiras:4,partidos:["PP"]},
  {nome:"PSDB",cadeiras:4,partidos:["PSDB"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=SC",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("SP",{assembleia:{2014:{bancada:"PSDB",cadeiras:22,total:94,maiorAlianca:{nome:"PSDB / DEM / PPS / PRB",cadeiras:37,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSDB",cadeiras:22,partidos:["PSDB"]},
  {nome:"PT",cadeiras:15,partidos:["PT"]},
  {nome:"DEM",cadeiras:8,partidos:["DEM"]},
  {nome:"PV",cadeiras:6,partidos:["PV"]},
  {nome:"PSB",cadeiras:6,partidos:["PSB"]},
  {nome:"PMDB",cadeiras:5,partidos:["PMDB"]},
  {nome:"PSD",cadeiras:4,partidos:["PSD"]},
  {nome:"PRB",cadeiras:4,partidos:["PRB"]},
  {nome:"PSC",cadeiras:3,partidos:["PSC"]},
  {nome:"PR",cadeiras:3,partidos:["PR"]},
  {nome:"PPS",cadeiras:3,partidos:["PPS"]},
  {nome:"PTB",cadeiras:2,partidos:["PTB"]},
  {nome:"PCdoB",cadeiras:2,partidos:["PCdoB"]},
  {nome:"PEN",cadeiras:2,partidos:["PEN"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"PSOL",cadeiras:2,partidos:["PSOL"]},
  {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PHS",cadeiras:1,partidos:["PHS"]},
  {nome:"PTN",cadeiras:1,partidos:["PTN"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=SP",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("SE",{assembleia:{2014:{bancada:"PMDB",cadeiras:4,total:24,maiorAlianca:{nome:"PP / PTB / PSL / PSC / PR / DEM / PT do B / PTC / Solidariedade / PSDB",cadeiras:11,tipo:"Coligação proporcional"},grupos:[
  {nome:"PMDB",cadeiras:4,partidos:["PMDB"]},
  {nome:"PTC",cadeiras:3,partidos:["PTC"]},
  {nome:"PSD",cadeiras:3,partidos:["PSD"]},
  {nome:"PT",cadeiras:2,partidos:["PT"]},
  {nome:"DEM",cadeiras:2,partidos:["DEM"]},
  {nome:"PSC",cadeiras:2,partidos:["PSC"]},
  {nome:"PP",cadeiras:2,partidos:["PP"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"PDT",cadeiras:1,partidos:["PDT"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PRB",cadeiras:1,partidos:["PRB"]},
  {nome:"PT do B",cadeiras:1,partidos:["PT do B"]},
  {nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=SE",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("TO",{assembleia:{2014:{bancada:"Solidariedade",cadeiras:4,total:24,maiorAlianca:{nome:"DEM / PP / PSDB / Solidariedade / PPS / PR / PTB / PEN",cadeiras:12,tipo:"Coligação proporcional"},grupos:[
  {nome:"Solidariedade",cadeiras:4,partidos:["Solidariedade"]},
  {nome:"PT",cadeiras:3,partidos:["PT"]},
  {nome:"PMDB",cadeiras:3,partidos:["PMDB"]},
  {nome:"PSD",cadeiras:2,partidos:["PSD"]},
  {nome:"PR",cadeiras:2,partidos:["PR"]},
  {nome:"PTB",cadeiras:2,partidos:["PTB"]},
  {nome:"PSB",cadeiras:1,partidos:["PSB"]},
  {nome:"PP",cadeiras:1,partidos:["PP"]},
  {nome:"PSDB",cadeiras:1,partidos:["PSDB"]},
  {nome:"PROS",cadeiras:1,partidos:["PROS"]},
  {nome:"PPS",cadeiras:1,partidos:["PPS"]},
  {nome:"DEM",cadeiras:1,partidos:["DEM"]},
  {nome:"PSL",cadeiras:1,partidos:["PSL"]},
  {nome:"PRTB",cadeiras:1,partidos:["PRTB"]}
],source:SOURCES.tse2014,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2014?fed=1&ue=TO",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});


seed("AC",{assembleia:{2022:{bancada:"PDT",cadeiras:4,total:24,maiorAlianca:{nome:"PDT",cadeiras:4,tipo:"Partido/federação"},grupos:[
        {nome:"PDT",cadeiras:4,partidos:["PDT"]},
        {nome:"MDB",cadeiras:3,partidos:["MDB"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"Republicanos",cadeiras:3,partidos:["Republicanos"]},
        {nome:"PL",cadeiras:2,partidos:["PL"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"UNIÃO",cadeiras:2,partidos:["UNIÃO"]},
        {nome:"Federação Brasil da Esperança",cadeiras:1,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Federação PSDB Cidadania",cadeiras:1,partidos:["PSDB", "Cidadania"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]}
      ],source:SOURCES.tse2022}}});
seed("AL",{assembleia:{2022:{bancada:"MDB",cadeiras:14,total:27,maiorAlianca:{nome:"MDB",cadeiras:14,tipo:"Partido/federação"},grupos:[
        {nome:"MDB",cadeiras:14,partidos:["MDB"]},
        {nome:"PP",cadeiras:4,partidos:["PP"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"Federação Brasil da Esperança",cadeiras:2,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},
        {nome:"PL",cadeiras:1,partidos:["PL"]}
      ],source:SOURCES.tse2022}}});
seed("AP",{assembleia:{2022:{bancada:"PDT / UNIÃO",cadeiras:3,total:24,maiorAlianca:{nome:"PDT / UNIÃO",cadeiras:3,tipo:"Partido/federação"},grupos:[
        {nome:"PDT",cadeiras:3,partidos:["PDT"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"Federação Brasil da Esperança",cadeiras:2,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Federação PSOL REDE",cadeiras:2,partidos:["PSOL", "REDE"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PL",cadeiras:2,partidos:["PL"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
        {nome:"Federação PSDB Cidadania",cadeiras:1,partidos:["PSDB", "Cidadania"]},
        {nome:"PODE",cadeiras:1,partidos:["PODE"]},
        {nome:"PP",cadeiras:1,partidos:["PP"]},
        {nome:"PROS",cadeiras:1,partidos:["PROS"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]},
        {nome:"Republicanos",cadeiras:1,partidos:["Republicanos"]}
      ],source:SOURCES.tse2022,nota:"Empate entre as maiores bancadas: PDT, UNIÃO."}}});
seed("AM",{assembleia:{2022:{bancada:"UNIÃO",cadeiras:6,total:24,maiorAlianca:{nome:"UNIÃO",cadeiras:6,tipo:"Partido/federação"},grupos:[
        {nome:"UNIÃO",cadeiras:6,partidos:["UNIÃO"]},
        {nome:"AVANTE",cadeiras:4,partidos:["AVANTE"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"PSC",cadeiras:3,partidos:["PSC"]},
        {nome:"Federação Brasil da Esperança",cadeiras:2,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"Federação PSDB Cidadania",cadeiras:1,partidos:["PSDB", "Cidadania"]},
        {nome:"MDB",cadeiras:1,partidos:["MDB"]},
        {nome:"PMB",cadeiras:1,partidos:["PMB"]},
        {nome:"Patriota",cadeiras:1,partidos:["Patriota"]}
      ],source:SOURCES.tse2022}}});
seed("BA",{assembleia:{2022:{bancada:"Federação Brasil da Esperança",cadeiras:17,total:63,maiorAlianca:{nome:"Federação Brasil da Esperança",cadeiras:17,tipo:"Partido/federação"},grupos:[
        {nome:"Federação Brasil da Esperança",cadeiras:17,partidos:["PT", "PCdoB", "PV"]},
        {nome:"UNIÃO",cadeiras:10,partidos:["UNIÃO"]},
        {nome:"PSD",cadeiras:9,partidos:["PSD"]},
        {nome:"PP",cadeiras:6,partidos:["PP"]},
        {nome:"PL",cadeiras:4,partidos:["PL"]},
        {nome:"Federação PSDB Cidadania",cadeiras:3,partidos:["PSDB", "Cidadania"]},
        {nome:"Republicanos",cadeiras:3,partidos:["Republicanos"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PSB",cadeiras:2,partidos:["PSB"]},
        {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
        {nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]},
        {nome:"PSC",cadeiras:1,partidos:["PSC"]},
        {nome:"Patriota",cadeiras:1,partidos:["Patriota"]}
      ],source:SOURCES.tse2022}}});
seed("CE",{assembleia:{2022:{bancada:"PDT",cadeiras:13,total:46,maiorAlianca:{nome:"PDT",cadeiras:13,tipo:"Partido/federação"},grupos:[
        {nome:"PDT",cadeiras:13,partidos:["PDT"]},
        {nome:"Federação Brasil da Esperança",cadeiras:9,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:4,partidos:["PL"]},
        {nome:"UNIÃO",cadeiras:4,partidos:["UNIÃO"]},
        {nome:"MDB",cadeiras:3,partidos:["MDB"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"PSD",cadeiras:3,partidos:["PSD"]},
        {nome:"Federação PSDB Cidadania",cadeiras:2,partidos:["PSDB", "Cidadania"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"PMN",cadeiras:1,partidos:["PMN"]}
      ],source:SOURCES.tse2022}}});
seed("DF",{assembleia:{2022:{bancada:"PL",cadeiras:4,total:24,maiorAlianca:{nome:"PL",cadeiras:4,tipo:"Partido/federação"},grupos:[
        {nome:"PL",cadeiras:4,partidos:["PL"]},
        {nome:"Federação Brasil da Esperança",cadeiras:3,partidos:["PT", "PCdoB", "PV"]},
        {nome:"MDB",cadeiras:3,partidos:["MDB"]},
        {nome:"AGIR",cadeiras:2,partidos:["AGIR"]},
        {nome:"Federação PSOL REDE",cadeiras:2,partidos:["PSOL", "REDE"]},
        {nome:"PP",cadeiras:2,partidos:["PP"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},
        {nome:"Federação PSDB Cidadania",cadeiras:1,partidos:["PSDB", "Cidadania"]},
        {nome:"PMN",cadeiras:1,partidos:["PMN"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"Republicanos",cadeiras:1,partidos:["Republicanos"]},
        {nome:"UNIÃO",cadeiras:1,partidos:["UNIÃO"]}
      ],source:SOURCES.tse2022}}});
seed("ES",{assembleia:{2022:{bancada:"PL",cadeiras:5,total:30,maiorAlianca:{nome:"PL",cadeiras:5,tipo:"Partido/federação"},grupos:[
        {nome:"PL",cadeiras:5,partidos:["PL"]},
        {nome:"Republicanos",cadeiras:4,partidos:["Republicanos"]},
        {nome:"Federação PSDB Cidadania",cadeiras:3,partidos:["PSDB", "Cidadania"]},
        {nome:"PODE",cadeiras:3,partidos:["PODE"]},
        {nome:"PSB",cadeiras:3,partidos:["PSB"]},
        {nome:"Federação Brasil da Esperança",cadeiras:2,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PDT",cadeiras:2,partidos:["PDT"]},
        {nome:"PP",cadeiras:2,partidos:["PP"]},
        {nome:"UNIÃO",cadeiras:2,partidos:["UNIÃO"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"PSC",cadeiras:1,partidos:["PSC"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]},
        {nome:"Patriota",cadeiras:1,partidos:["Patriota"]}
      ],source:SOURCES.tse2022}}});
seed("GO",{assembleia:{2022:{bancada:"MDB",cadeiras:7,total:41,maiorAlianca:{nome:"MDB",cadeiras:7,tipo:"Partido/federação"},grupos:[
        {nome:"MDB",cadeiras:7,partidos:["MDB"]},
        {nome:"UNIÃO",cadeiras:6,partidos:["UNIÃO"]},
        {nome:"PRTB",cadeiras:4,partidos:["PRTB"]},
        {nome:"Federação Brasil da Esperança",cadeiras:3,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"AGIR",cadeiras:2,partidos:["AGIR"]},
        {nome:"AVANTE",cadeiras:2,partidos:["AVANTE"]},
        {nome:"Federação PSDB Cidadania",cadeiras:2,partidos:["PSDB", "Cidadania"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"Patriota",cadeiras:2,partidos:["Patriota"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"PSC",cadeiras:1,partidos:["PSC"]},
        {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
      ],source:SOURCES.tse2022}}});
seed("MA",{assembleia:{2022:{bancada:"PSB",cadeiras:11,total:42,maiorAlianca:{nome:"PSB",cadeiras:11,tipo:"Partido/federação"},grupos:[
        {nome:"PSB",cadeiras:11,partidos:["PSB"]},
        {nome:"Federação Brasil da Esperança",cadeiras:5,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:5,partidos:["PL"]},
        {nome:"PDT",cadeiras:4,partidos:["PDT"]},
        {nome:"PP",cadeiras:4,partidos:["PP"]},
        {nome:"Patriota",cadeiras:3,partidos:["Patriota"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"PSC",cadeiras:2,partidos:["PSC"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"Republicanos",cadeiras:1,partidos:["Republicanos"]},
        {nome:"UNIÃO",cadeiras:1,partidos:["UNIÃO"]}
      ],source:SOURCES.tse2022}}});
seed("MT",{assembleia:{2022:{bancada:"MDB / PSB / UNIÃO",cadeiras:4,total:24,maiorAlianca:{nome:"MDB / PSB / UNIÃO",cadeiras:4,tipo:"Partido/federação"},grupos:[
        {nome:"MDB",cadeiras:4,partidos:["MDB"]},
        {nome:"PSB",cadeiras:4,partidos:["PSB"]},
        {nome:"UNIÃO",cadeiras:4,partidos:["UNIÃO"]},
        {nome:"Federação Brasil da Esperança",cadeiras:2,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Federação PSDB Cidadania",cadeiras:2,partidos:["PSDB", "Cidadania"]},
        {nome:"PL",cadeiras:2,partidos:["PL"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"PP",cadeiras:1,partidos:["PP"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]}
      ],source:SOURCES.tse2022,nota:"Empate entre as maiores bancadas: MDB, PSB, UNIÃO."}}});
seed("MS",{assembleia:{2022:{bancada:"Federação PSDB Cidadania",cadeiras:6,total:24,maiorAlianca:{nome:"Federação PSDB Cidadania",cadeiras:6,tipo:"Partido/federação"},grupos:[
        {nome:"Federação PSDB Cidadania",cadeiras:6,partidos:["PSDB", "Cidadania"]},
        {nome:"Federação Brasil da Esperança",cadeiras:3,partidos:["PT", "PCdoB", "PV"]},
        {nome:"MDB",cadeiras:3,partidos:["MDB"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"PP",cadeiras:2,partidos:["PP"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]},
        {nome:"PODE",cadeiras:1,partidos:["PODE"]},
        {nome:"PRTB",cadeiras:1,partidos:["PRTB"]},
        {nome:"PSD",cadeiras:1,partidos:["PSD"]},
        {nome:"Patriota",cadeiras:1,partidos:["Patriota"]},
        {nome:"Republicanos",cadeiras:1,partidos:["Republicanos"]},
        {nome:"UNIÃO",cadeiras:1,partidos:["UNIÃO"]}
      ],source:SOURCES.tse2022}}});
seed("MG",{assembleia:{2022:{bancada:"Federação Brasil da Esperança",cadeiras:17,total:77,maiorAlianca:{nome:"Federação Brasil da Esperança",cadeiras:17,tipo:"Partido/federação"},grupos:[
        {nome:"Federação Brasil da Esperança",cadeiras:17,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:9,partidos:["PL"]},
        {nome:"PSD",cadeiras:9,partidos:["PSD"]},
        {nome:"PP",cadeiras:6,partidos:["PP"]},
        {nome:"Federação PSDB Cidadania",cadeiras:4,partidos:["PSDB", "Cidadania"]},
        {nome:"AVANTE",cadeiras:3,partidos:["AVANTE"]},
        {nome:"Federação PSOL REDE",cadeiras:3,partidos:["PSOL", "REDE"]},
        {nome:"PMN",cadeiras:3,partidos:["PMN"]},
        {nome:"PSC",cadeiras:3,partidos:["PSC"]},
        {nome:"Patriota",cadeiras:3,partidos:["Patriota"]},
        {nome:"Republicanos",cadeiras:3,partidos:["Republicanos"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"NOVO",cadeiras:2,partidos:["NOVO"]},
        {nome:"PDT",cadeiras:2,partidos:["PDT"]},
        {nome:"DC",cadeiras:1,partidos:["DC"]},
        {nome:"PODE",cadeiras:1,partidos:["PODE"]},
        {nome:"PROS",cadeiras:1,partidos:["PROS"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
      ],source:SOURCES.tse2022}}});
seed("PA",{assembleia:{2022:{bancada:"MDB",cadeiras:13,total:41,maiorAlianca:{nome:"MDB",cadeiras:13,tipo:"Partido/federação"},grupos:[
        {nome:"MDB",cadeiras:13,partidos:["MDB"]},
        {nome:"Federação Brasil da Esperança",cadeiras:4,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Federação PSDB Cidadania",cadeiras:4,partidos:["PSDB", "Cidadania"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"PDT",cadeiras:2,partidos:["PDT"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"PSC",cadeiras:2,partidos:["PSC"]},
        {nome:"PSD",cadeiras:2,partidos:["PSD"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]},
        {nome:"UNIÃO",cadeiras:1,partidos:["UNIÃO"]}
      ],source:SOURCES.tse2022}}});
seed("PB",{assembleia:{2022:{bancada:"Republicanos",cadeiras:8,total:36,maiorAlianca:{nome:"Republicanos",cadeiras:8,tipo:"Partido/federação"},grupos:[
        {nome:"Republicanos",cadeiras:8,partidos:["Republicanos"]},
        {nome:"PSB",cadeiras:6,partidos:["PSB"]},
        {nome:"PP",cadeiras:4,partidos:["PP"]},
        {nome:"Federação Brasil da Esperança",cadeiras:3,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Federação PSDB Cidadania",cadeiras:3,partidos:["PSDB", "Cidadania"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"PSD",cadeiras:1,partidos:["PSD"]}
      ],source:SOURCES.tse2022}}});
seed("PR",{assembleia:{2022:{bancada:"PSD",cadeiras:15,total:54,maiorAlianca:{nome:"PSD",cadeiras:15,tipo:"Partido/federação"},grupos:[
        {nome:"PSD",cadeiras:15,partidos:["PSD"]},
        {nome:"Federação Brasil da Esperança",cadeiras:7,partidos:["PT", "PCdoB", "PV"]},
        {nome:"UNIÃO",cadeiras:7,partidos:["UNIÃO"]},
        {nome:"PL",cadeiras:5,partidos:["PL"]},
        {nome:"PP",cadeiras:5,partidos:["PP"]},
        {nome:"Federação PSDB Cidadania",cadeiras:3,partidos:["PSDB", "Cidadania"]},
        {nome:"Republicanos",cadeiras:3,partidos:["Republicanos"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"PROS",cadeiras:2,partidos:["PROS"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
      ],source:SOURCES.tse2022}}});
seed("PE",{assembleia:{2022:{bancada:"PSB",cadeiras:14,total:49,maiorAlianca:{nome:"PSB",cadeiras:14,tipo:"Partido/federação"},grupos:[
        {nome:"PSB",cadeiras:14,partidos:["PSB"]},
        {nome:"PP",cadeiras:8,partidos:["PP"]},
        {nome:"Federação Brasil da Esperança",cadeiras:7,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:5,partidos:["PL"]},
        {nome:"UNIÃO",cadeiras:5,partidos:["UNIÃO"]},
        {nome:"Federação PSDB Cidadania",cadeiras:3,partidos:["PSDB", "Cidadania"]},
        {nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"Patriota",cadeiras:1,partidos:["Patriota"]}
      ],source:SOURCES.tse2022}}});
seed("PI",{assembleia:{2022:{bancada:"Federação Brasil da Esperança",cadeiras:12,total:30,maiorAlianca:{nome:"Federação Brasil da Esperança",cadeiras:12,tipo:"Partido/federação"},grupos:[
        {nome:"Federação Brasil da Esperança",cadeiras:12,partidos:["PT", "PCdoB", "PV"]},
        {nome:"MDB",cadeiras:9,partidos:["MDB"]},
        {nome:"PP",cadeiras:7,partidos:["PP"]},
        {nome:"Republicanos",cadeiras:1,partidos:["Republicanos"]},
        {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
      ],source:SOURCES.tse2022}}});
seed("RJ",{assembleia:{2022:{bancada:"PL",cadeiras:17,total:70,maiorAlianca:{nome:"PL",cadeiras:17,tipo:"Partido/federação"},grupos:[
        {nome:"PL",cadeiras:17,partidos:["PL"]},
        {nome:"Federação Brasil da Esperança",cadeiras:8,partidos:["PT", "PCdoB", "PV"]},
        {nome:"UNIÃO",cadeiras:8,partidos:["UNIÃO"]},
        {nome:"PSD",cadeiras:6,partidos:["PSD"]},
        {nome:"Federação PSOL REDE",cadeiras:5,partidos:["PSOL", "REDE"]},
        {nome:"PP",cadeiras:4,partidos:["PP"]},
        {nome:"Republicanos",cadeiras:3,partidos:["Republicanos"]},
        {nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PDT",cadeiras:2,partidos:["PDT"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"PROS",cadeiras:2,partidos:["PROS"]},
        {nome:"PSB",cadeiras:2,partidos:["PSB"]},
        {nome:"AGIR",cadeiras:1,partidos:["AGIR"]},
        {nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},
        {nome:"PMN",cadeiras:1,partidos:["PMN"]},
        {nome:"PSC",cadeiras:1,partidos:["PSC"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]},
        {nome:"Patriota",cadeiras:1,partidos:["Patriota"]}
      ],source:SOURCES.tse2022}}});
seed("RN",{assembleia:{2022:{bancada:"Federação PSDB Cidadania",cadeiras:10,total:24,maiorAlianca:{nome:"Federação PSDB Cidadania",cadeiras:10,tipo:"Partido/federação"},grupos:[
        {nome:"Federação PSDB Cidadania",cadeiras:10,partidos:["PSDB", "Cidadania"]},
        {nome:"Federação Brasil da Esperança",cadeiras:6,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},
        {nome:"UNIÃO",cadeiras:2,partidos:["UNIÃO"]},
        {nome:"MDB",cadeiras:1,partidos:["MDB"]}
      ],source:SOURCES.tse2022}}});
seed("RS",{assembleia:{2022:{bancada:"Federação Brasil da Esperança",cadeiras:12,total:55,maiorAlianca:{nome:"Federação Brasil da Esperança",cadeiras:12,tipo:"Partido/federação"},grupos:[
        {nome:"Federação Brasil da Esperança",cadeiras:12,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PP",cadeiras:7,partidos:["PP"]},
        {nome:"MDB",cadeiras:6,partidos:["MDB"]},
        {nome:"Federação PSDB Cidadania",cadeiras:5,partidos:["PSDB", "Cidadania"]},
        {nome:"PL",cadeiras:5,partidos:["PL"]},
        {nome:"Republicanos",cadeiras:5,partidos:["Republicanos"]},
        {nome:"PDT",cadeiras:4,partidos:["PDT"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"Federação PSOL REDE",cadeiras:2,partidos:["PSOL", "REDE"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"NOVO",cadeiras:1,partidos:["NOVO"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"PSD",cadeiras:1,partidos:["PSD"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]}
      ],source:SOURCES.tse2022}}});
seed("RO",{assembleia:{2022:{bancada:"UNIÃO",cadeiras:5,total:24,maiorAlianca:{nome:"UNIÃO",cadeiras:5,tipo:"Partido/federação"},grupos:[
        {nome:"UNIÃO",cadeiras:5,partidos:["UNIÃO"]},
        {nome:"PSD",cadeiras:3,partidos:["PSD"]},
        {nome:"Patriota",cadeiras:3,partidos:["Patriota"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PL",cadeiras:2,partidos:["PL"]},
        {nome:"PSC",cadeiras:2,partidos:["PSC"]},
        {nome:"Republicanos",cadeiras:2,partidos:["Republicanos"]},
        {nome:"Federação Brasil da Esperança",cadeiras:1,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PODE",cadeiras:1,partidos:["PODE"]},
        {nome:"PP",cadeiras:1,partidos:["PP"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]}
      ],source:SOURCES.tse2022}}});
seed("RR",{assembleia:{2022:{bancada:"Republicanos",cadeiras:4,total:24,maiorAlianca:{nome:"Republicanos",cadeiras:4,tipo:"Partido/federação"},grupos:[
        {nome:"Republicanos",cadeiras:4,partidos:["Republicanos"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"MDB",cadeiras:2,partidos:["MDB"]},
        {nome:"PMB",cadeiras:2,partidos:["PMB"]},
        {nome:"PODE",cadeiras:2,partidos:["PODE"]},
        {nome:"PROS",cadeiras:2,partidos:["PROS"]},
        {nome:"PRTB",cadeiras:2,partidos:["PRTB"]},
        {nome:"Federação PSDB Cidadania",cadeiras:1,partidos:["PSDB", "Cidadania"]},
        {nome:"PL",cadeiras:1,partidos:["PL"]},
        {nome:"PSC",cadeiras:1,partidos:["PSC"]},
        {nome:"PSD",cadeiras:1,partidos:["PSD"]}
      ],source:SOURCES.tse2022}}});
seed("SC",{assembleia:{2022:{bancada:"PL",cadeiras:11,total:40,maiorAlianca:{nome:"PL",cadeiras:11,tipo:"Partido/federação"},grupos:[
        {nome:"PL",cadeiras:11,partidos:["PL"]},
        {nome:"MDB",cadeiras:6,partidos:["MDB"]},
        {nome:"Federação Brasil da Esperança",cadeiras:4,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PODE",cadeiras:3,partidos:["PODE"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"PSD",cadeiras:3,partidos:["PSD"]},
        {nome:"UNIÃO",cadeiras:3,partidos:["UNIÃO"]},
        {nome:"Federação PSDB Cidadania",cadeiras:2,partidos:["PSDB", "Cidadania"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"NOVO",cadeiras:1,partidos:["NOVO"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]},
        {nome:"PTB",cadeiras:1,partidos:["PTB"]},
        {nome:"Republicanos",cadeiras:1,partidos:["Republicanos"]}
      ],source:SOURCES.tse2022}}});
seed("SP",{assembleia:{2022:{bancada:"Federação Brasil da Esperança / PL",cadeiras:19,total:94,maiorAlianca:{nome:"Federação Brasil da Esperança / PL",cadeiras:19,tipo:"Partido/federação"},grupos:[
        {nome:"Federação Brasil da Esperança",cadeiras:19,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:19,partidos:["PL"]},
        {nome:"Federação PSDB Cidadania",cadeiras:11,partidos:["PSDB", "Cidadania"]},
        {nome:"Republicanos",cadeiras:8,partidos:["Republicanos"]},
        {nome:"UNIÃO",cadeiras:8,partidos:["UNIÃO"]},
        {nome:"Federação PSOL REDE",cadeiras:6,partidos:["PSOL", "REDE"]},
        {nome:"MDB",cadeiras:4,partidos:["MDB"]},
        {nome:"PODE",cadeiras:4,partidos:["PODE"]},
        {nome:"PSD",cadeiras:4,partidos:["PSD"]},
        {nome:"PP",cadeiras:3,partidos:["PP"]},
        {nome:"PSB",cadeiras:3,partidos:["PSB"]},
        {nome:"PSC",cadeiras:2,partidos:["PSC"]},
        {nome:"NOVO",cadeiras:1,partidos:["NOVO"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]},
        {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
      ],source:SOURCES.tse2022,nota:"Empate entre as maiores bancadas: Federação Brasil da Esperança, PL."}}});
seed("SE",{assembleia:{2022:{bancada:"PSD",cadeiras:5,total:24,maiorAlianca:{nome:"PSD",cadeiras:5,tipo:"Partido/federação"},grupos:[
        {nome:"PSD",cadeiras:5,partidos:["PSD"]},
        {nome:"UNIÃO",cadeiras:4,partidos:["UNIÃO"]},
        {nome:"Federação Brasil da Esperança",cadeiras:3,partidos:["PT", "PCdoB", "PV"]},
        {nome:"PL",cadeiras:3,partidos:["PL"]},
        {nome:"Republicanos",cadeiras:3,partidos:["Republicanos"]},
        {nome:"Federação PSDB Cidadania",cadeiras:2,partidos:["PSDB", "Cidadania"]},
        {nome:"PP",cadeiras:2,partidos:["PP"]},
        {nome:"Federação PSOL REDE",cadeiras:1,partidos:["PSOL", "REDE"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]}
      ],source:SOURCES.tse2022}}});
seed("TO",{assembleia:{2022:{bancada:"Republicanos",cadeiras:7,total:24,maiorAlianca:{nome:"Republicanos",cadeiras:7,tipo:"Partido/federação"},grupos:[
        {nome:"Republicanos",cadeiras:7,partidos:["Republicanos"]},
        {nome:"PL",cadeiras:4,partidos:["PL"]},
        {nome:"PSD",cadeiras:3,partidos:["PSD"]},
        {nome:"Federação Brasil da Esperança",cadeiras:2,partidos:["PT", "PCdoB", "PV"]},
        {nome:"Federação PSDB Cidadania",cadeiras:2,partidos:["PSDB", "Cidadania"]},
        {nome:"UNIÃO",cadeiras:2,partidos:["UNIÃO"]},
        {nome:"PDT",cadeiras:1,partidos:["PDT"]},
        {nome:"PSB",cadeiras:1,partidos:["PSB"]},
        {nome:"PSC",cadeiras:1,partidos:["PSC"]},
        {nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
      ],source:SOURCES.tse2022}}});


// Assembleias Legislativas — rodada validada de 2018.
// Regra: grupos = partidos efetivamente eleitos; maiorAlianca = coligação proporcional com mais cadeiras.
seed("GO",{assembleia:{2018:{bancada:"PSDB",cadeiras:6,total:41,maiorAlianca:{nome:"PSDB / PSB / PPS",cadeiras:8,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSDB",cadeiras:6,partidos:["PSDB"]},{nome:"MDB",cadeiras:4,partidos:["MDB"]},{nome:"DEM",cadeiras:4,partidos:["DEM"]},{nome:"PROS",cadeiras:3,partidos:["PROS"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"PSD",cadeiras:2,partidos:["PSD"]},{nome:"PSL",cadeiras:2,partidos:["PSL"]},{nome:"DC",cadeiras:2,partidos:["DC"]},{nome:"PRTB",cadeiras:2,partidos:["PRTB"]},{nome:"SD",cadeiras:2,partidos:["Solidariedade"]},{nome:"PSC",cadeiras:1,partidos:["PSC"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PTC",cadeiras:1,partidos:["PTC"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]},{nome:"PP",cadeiras:1,partidos:["PP"]}
],source:"https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_estaduais_em_Goi%C3%A1s_em_2018",nota:"Composição partidária e coligações proporcionais conferidas a partir da lista dos 41 eleitos; soma = 41."}}});

seed("MS",{assembleia:{2018:{bancada:"PSDB",cadeiras:5,total:24,maiorAlianca:{nome:"Avançar com Responsabilidade",cadeiras:16,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSDB",cadeiras:5,partidos:["PSDB"]},{nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PSL",cadeiras:2,partidos:["PSL"]},{nome:"DEM",cadeiras:2,partidos:["DEM"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"SD",cadeiras:2,partidos:["Solidariedade"]},{nome:"PP",cadeiras:2,partidos:["PP"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PR",cadeiras:1,partidos:["PR"]}
],source:"https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_estaduais_em_Mato_Grosso_do_Sul_em_2018",nota:"Composição partidária e coligações proporcionais conferidas a partir da lista dos 24 eleitos; soma = 24."}}});

seed("PA",{assembleia:{2018:{bancada:"MDB",cadeiras:6,total:41,maiorAlianca:{nome:"Lutando Pelo Pará / Esperança Renovada",cadeiras:10,tipo:"Coligação proporcional"},grupos:[
  {nome:"MDB",cadeiras:6,partidos:["MDB"]},{nome:"PSDB",cadeiras:5,partidos:["PSDB"]},{nome:"PR",cadeiras:3,partidos:["PR"]},{nome:"PSD",cadeiras:3,partidos:["PSD"]},{nome:"PT",cadeiras:3,partidos:["PT"]},{nome:"DEM",cadeiras:3,partidos:["DEM"]},{nome:"PRB",cadeiras:2,partidos:["PRB"]},{nome:"PDT",cadeiras:2,partidos:["PDT"]},{nome:"PTB",cadeiras:2,partidos:["PTB"]},{nome:"PSC",cadeiras:2,partidos:["PSC"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]},{nome:"SD",cadeiras:1,partidos:["Solidariedade"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"DC",cadeiras:1,partidos:["DC"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]},{nome:"PMN",cadeiras:1,partidos:["PMN"]},{nome:"PP",cadeiras:1,partidos:["PP"]}
],source:"https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_estaduais_no_Par%C3%A1_em_2018",nota:"Empate entre as maiores coligações proporcionais: Lutando Pelo Pará e Esperança Renovada, com 10 cadeiras cada. Soma partidária = 41."}}});


seed("AC",{assembleia:{2018:{bancada:"MDB / PP",cadeiras:3,total:24,maiorAlianca:{nome:"PP / PR / PT / PCdoB",cadeiras:4,tipo:"Coligação proporcional (empate)"},grupos:[
  {nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PP",cadeiras:3,partidos:["PP"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PCdoB",cadeiras:2,partidos:["PCdoB"]},{nome:"PV",cadeiras:2,partidos:["PV"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PR",cadeiras:1,partidos:["PR"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=AC",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre as maiores bancadas: MDB e PP, com 3 cadeiras. Empate entre as maiores coligações proporcionais: PP/PR e PT/PCdoB, com 4 cadeiras."}}});

seed("AP",{assembleia:{2018:{bancada:"PR",cadeiras:4,total:24,maiorAlianca:{nome:"PR",cadeiras:4,tipo:"Lista proporcional"},grupos:[
  {nome:"PR",cadeiras:4,partidos:["PR"]},{nome:"PTC",cadeiras:2,partidos:["PTC"]},{nome:"DEM",cadeiras:2,partidos:["DEM"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"REDE",cadeiras:1,partidos:["REDE"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PSC",cadeiras:1,partidos:["PSC"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PMB",cadeiras:1,partidos:["PMB"]},{nome:"DC",cadeiras:1,partidos:["DC"]},{nome:"PPL",cadeiras:1,partidos:["PPL"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=AP",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("AM",{assembleia:{2018:{bancada:"PP",cadeiras:4,total:24,maiorAlianca:{nome:"PP / PR",cadeiras:6,tipo:"Coligação proporcional"},grupos:[
  {nome:"PP",cadeiras:4,partidos:["PP"]},{nome:"PV",cadeiras:3,partidos:["PV"]},{nome:"PSD",cadeiras:2,partidos:["PSD"]},{nome:"PHS",cadeiras:2,partidos:["PHS"]},{nome:"PR",cadeiras:2,partidos:["PR"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PT",cadeiras:1,partidos:["PT"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"MDB",cadeiras:1,partidos:["MDB"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=AM",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("AL",{assembleia:{2018:{bancada:"MDB",cadeiras:6,total:27,maiorAlianca:{nome:"MDB / PSD / PTB / Solidariedade",cadeiras:10,tipo:"Coligação proporcional"},grupos:[
  {nome:"MDB",cadeiras:6,partidos:["MDB"]},{nome:"PRTB",cadeiras:4,partidos:["PRTB"]},{nome:"PP",cadeiras:4,partidos:["PP"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PSD",cadeiras:2,partidos:["PSD"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PMN",cadeiras:1,partidos:["PMN"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PV",cadeiras:1,partidos:["PV"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=AL",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("BA",{assembleia:{2018:{bancada:"PT",cadeiras:10,total:63,maiorAlianca:{nome:"PT / PSD / PP / PSB / PDT / PR / PODE / AVANTE / PRP",cadeiras:38,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:10,partidos:["PT"]},{nome:"PSD",cadeiras:9,partidos:["PSD"]},{nome:"PP",cadeiras:7,partidos:["PP"]},{nome:"DEM",cadeiras:6,partidos:["DEM"]},{nome:"PCdoB",cadeiras:5,partidos:["PCdoB"]},{nome:"PSB",cadeiras:5,partidos:["PSB"]},{nome:"PSDB",cadeiras:3,partidos:["PSDB"]},{nome:"PDT",cadeiras:3,partidos:["PDT"]},{nome:"PSC",cadeiras:3,partidos:["PSC"]},{nome:"PSL",cadeiras:2,partidos:["PSL"]},{nome:"PRB",cadeiras:2,partidos:["PRB"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]},{nome:"MDB",cadeiras:1,partidos:["MDB"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=BA",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("CE",{assembleia:{2018:{bancada:"PDT",cadeiras:14,total:46,maiorAlianca:{nome:"PDT / PP / PR / DEM",cadeiras:19,tipo:"Coligação proporcional"},grupos:[
  {nome:"PDT",cadeiras:14,partidos:["PDT"]},{nome:"MDB",cadeiras:4,partidos:["MDB"]},{nome:"PT",cadeiras:4,partidos:["PT"]},{nome:"PP",cadeiras:3,partidos:["PP"]},{nome:"PATRI",cadeiras:3,partidos:["PATRI"]},{nome:"PSD",cadeiras:2,partidos:["PSD"]},{nome:"PSL",cadeiras:2,partidos:["PSL"]},{nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PROS",cadeiras:2,partidos:["PROS"]},{nome:"PCdoB",cadeiras:2,partidos:["PCdoB"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=CE",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("ES",{assembleia:{2018:{bancada:"PSL",cadeiras:4,total:30,maiorAlianca:{nome:"PSL / PRB",cadeiras:6,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSL",cadeiras:4,partidos:["PSL"]},{nome:"PSDB",cadeiras:3,partidos:["PSDB"]},{nome:"PSB",cadeiras:2,partidos:["PSB"]},{nome:"MDB",cadeiras:2,partidos:["MDB"]},{nome:"PRB",cadeiras:2,partidos:["PRB"]},{nome:"PRP",cadeiras:2,partidos:["PRP"]},{nome:"PV",cadeiras:2,partidos:["PV"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PT",cadeiras:1,partidos:["PT"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"REDE",cadeiras:1,partidos:["REDE"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},{nome:"DC",cadeiras:1,partidos:["DC"]},{nome:"PMN",cadeiras:1,partidos:["PMN"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=ES",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("MA",{assembleia:{2018:{bancada:"PDT",cadeiras:7,total:42,maiorAlianca:{nome:"PDT / PCdoB / DEM / PR / PP / PSB / PRB",cadeiras:26,tipo:"Coligação proporcional"},grupos:[
  {nome:"PDT",cadeiras:7,partidos:["PDT"]},{nome:"PCdoB",cadeiras:6,partidos:["PCdoB"]},{nome:"DEM",cadeiras:5,partidos:["DEM"]},{nome:"PR",cadeiras:3,partidos:["PR"]},{nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},{nome:"PV",cadeiras:3,partidos:["PV"]},{nome:"PRTB",cadeiras:2,partidos:["PRTB"]},{nome:"MDB",cadeiras:2,partidos:["MDB"]},{nome:"PP",cadeiras:2,partidos:["PP"]},{nome:"PSB",cadeiras:2,partidos:["PSB"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PT",cadeiras:1,partidos:["PT"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PMN",cadeiras:1,partidos:["PMN"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=MA",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("MT",{assembleia:{2018:{bancada:"MDB",cadeiras:3,total:24,maiorAlianca:{nome:"MDB / DEM / PSC / PSD / PDT",cadeiras:9,tipo:"Coligação proporcional"},grupos:[
  {nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PSL",cadeiras:2,partidos:["PSL"]},{nome:"PV",cadeiras:2,partidos:["PV"]},{nome:"DEM",cadeiras:2,partidos:["DEM"]},{nome:"PSB",cadeiras:2,partidos:["PSB"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"PSC",cadeiras:2,partidos:["PSC"]},{nome:"DC",cadeiras:2,partidos:["DC"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=MT",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("SC",{assembleia:{2018:{bancada:"MDB",cadeiras:9,total:40,maiorAlianca:{nome:"MDB / PSDB",cadeiras:11,tipo:"Coligação proporcional"},grupos:[
  {nome:"MDB",cadeiras:9,partidos:["MDB"]},{nome:"PSL",cadeiras:6,partidos:["PSL"]},{nome:"PSD",cadeiras:5,partidos:["PSD"]},{nome:"PT",cadeiras:4,partidos:["PT"]},{nome:"PP",cadeiras:3,partidos:["PP"]},{nome:"PSB",cadeiras:3,partidos:["PSB"]},{nome:"PR",cadeiras:3,partidos:["PR"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PDT",cadeiras:2,partidos:["PDT"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PSC",cadeiras:1,partidos:["PSC"]},{nome:"PV",cadeiras:1,partidos:["PV"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=SC",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});


seed("PI",{assembleia:{2018:{bancada:"MDB",cadeiras:6,total:30,maiorAlianca:{nome:"MDB / PT / PP / PR / PTB / PSD / PDT / PRTB",cadeiras:24,tipo:"Coligação proporcional"},grupos:[
  {nome:"MDB",cadeiras:6,partidos:["MDB"]},{nome:"PT",cadeiras:5,partidos:["PT"]},{nome:"PP",cadeiras:5,partidos:["PP"]},{nome:"PR",cadeiras:3,partidos:["PR"]},{nome:"PTB",cadeiras:2,partidos:["PTB"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]},{nome:"PTC",cadeiras:1,partidos:["PTC"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PRTB",cadeiras:1,partidos:["PRTB"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=PI",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RN",{assembleia:{2018:{bancada:"PSDB",cadeiras:5,total:24,maiorAlianca:{nome:"PSDB / PSD / PR / PROS",cadeiras:10,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSDB",cadeiras:5,partidos:["PSDB"]},{nome:"PSD",cadeiras:3,partidos:["PSD"]},{nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},{nome:"MDB",cadeiras:2,partidos:["MDB"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"AVANTE",cadeiras:2,partidos:["AVANTE"]},{nome:"PTC",cadeiras:2,partidos:["PTC"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PPL",cadeiras:1,partidos:["PPL"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=RN",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RO",{assembleia:{2018:{bancada:"PRB",cadeiras:4,total:24,maiorAlianca:{nome:"MDB / PV",cadeiras:4,tipo:"Coligação proporcional"},grupos:[
  {nome:"PRB",cadeiras:4,partidos:["PRB"]},{nome:"PODE",cadeiras:3,partidos:["PODE"]},{nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PSB",cadeiras:2,partidos:["PSB"]},{nome:"PTB",cadeiras:2,partidos:["PTB"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PT",cadeiras:1,partidos:["PT"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]},{nome:"PMN",cadeiras:1,partidos:["PMN"]},{nome:"PV",cadeiras:1,partidos:["PV"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"PP",cadeiras:1,partidos:["PP"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=RO",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"A maior bancada partidária foi o PRB (4); a maior coligação proporcional MDB/PV também somou 4 cadeiras."}}});

seed("RR",{assembleia:{2018:{bancada:"PRB / Solidariedade",cadeiras:3,total:24,maiorAlianca:{nome:"PRB / Solidariedade",cadeiras:3,tipo:"Listas proporcionais (empate)"},grupos:[
  {nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},{nome:"PRB",cadeiras:3,partidos:["PRB"]},{nome:"PTC",cadeiras:2,partidos:["PTC"]},{nome:"MDB",cadeiras:2,partidos:["MDB"]},{nome:"PRTB",cadeiras:2,partidos:["PRTB"]},{nome:"PATRI",cadeiras:2,partidos:["PATRI"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PV",cadeiras:1,partidos:["PV"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=RR",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PRB e Solidariedade, com 3 cadeiras cada."}}});

seed("SE",{assembleia:{2018:{bancada:"PSD / PSC",cadeiras:4,total:24,maiorAlianca:{nome:"PSD / MDB / PT",cadeiras:9,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSD",cadeiras:4,partidos:["PSD"]},{nome:"PSC",cadeiras:4,partidos:["PSC"]},{nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"REDE",cadeiras:2,partidos:["REDE"]},{nome:"PR",cadeiras:2,partidos:["PR"]},{nome:"PPS",cadeiras:2,partidos:["PPS"]},{nome:"PODE",cadeiras:2,partidos:["PODE"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=SE",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"Empate entre PSD e PSC como maiores bancadas, com 4 cadeiras cada."}}});

seed("TO",{assembleia:{2018:{bancada:"MDB",cadeiras:5,total:24,maiorAlianca:{nome:"MDB / PSDB / PR / PSB",cadeiras:9,tipo:"Coligação proporcional"},grupos:[
  {nome:"MDB",cadeiras:5,partidos:["MDB"]},{nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"PV",cadeiras:2,partidos:["PV"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"PTC",cadeiras:1,partidos:["PTC"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PSL",cadeiras:1,partidos:["PSL"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=TO",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});


seed("MG",{assembleia:{2018:{bancada:"PT",cadeiras:10,total:77,maiorAlianca:{nome:"MDB / PV / PRB / PODE / PDT",cadeiras:19,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:10,partidos:["PT"]},{nome:"MDB",cadeiras:7,partidos:["MDB"]},{nome:"PSDB",cadeiras:7,partidos:["PSDB"]},{nome:"PSL",cadeiras:6,partidos:["PSL"]},{nome:"PV",cadeiras:5,partidos:["PV"]},{nome:"PSD",cadeiras:4,partidos:["PSD"]},{nome:"PRB",cadeiras:3,partidos:["PRB"]},{nome:"PHS",cadeiras:3,partidos:["PHS"]},{nome:"PTB",cadeiras:3,partidos:["PTB"]},{nome:"PSC",cadeiras:3,partidos:["PSC"]},{nome:"NOVO",cadeiras:3,partidos:["NOVO"]},{nome:"Solidariedade",cadeiras:2,partidos:["Solidariedade"]},{nome:"PODE",cadeiras:2,partidos:["PODE"]},{nome:"PDT",cadeiras:2,partidos:["PDT"]},{nome:"AVANTE",cadeiras:2,partidos:["AVANTE"]},{nome:"PATRI",cadeiras:2,partidos:["PATRI"]},{nome:"PR",cadeiras:2,partidos:["PR"]},{nome:"DEM",cadeiras:1,partidos:["DEM"]},{nome:"PSB",cadeiras:1,partidos:["PSB"]},{nome:"PRTB",cadeiras:1,partidos:["PRTB"]},{nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"DC",cadeiras:1,partidos:["DC"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"REDE",cadeiras:1,partidos:["REDE"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=MG",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PB",{assembleia:{2018:{bancada:"PSB",cadeiras:8,total:36,maiorAlianca:{nome:"PSB / PODE / PTB / PRB / PCdoB",cadeiras:15,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSB",cadeiras:8,partidos:["PSB"]},{nome:"AVANTE",cadeiras:4,partidos:["AVANTE"]},{nome:"PODE",cadeiras:3,partidos:["PODE"]},{nome:"PSDB",cadeiras:3,partidos:["PSDB"]},{nome:"PPS",cadeiras:2,partidos:["PPS"]},{nome:"PATRI",cadeiras:2,partidos:["PATRI"]},{nome:"PP",cadeiras:2,partidos:["PP"]},{nome:"PSL",cadeiras:2,partidos:["PSL"]},{nome:"PTB",cadeiras:2,partidos:["PTB"]},{nome:"MDB",cadeiras:1,partidos:["MDB"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PRTB",cadeiras:1,partidos:["PRTB"]},{nome:"PSC",cadeiras:1,partidos:["PSC"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},{nome:"REDE",cadeiras:1,partidos:["REDE"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=PB",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PE",{assembleia:{2018:{bancada:"PSB",cadeiras:11,total:49,maiorAlianca:{nome:"PSB / PSD / MDB",cadeiras:15,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSB",cadeiras:11,partidos:["PSB"]},{nome:"PP",cadeiras:10,partidos:["PP"]},{nome:"PSC",cadeiras:5,partidos:["PSC"]},{nome:"PT",cadeiras:3,partidos:["PT"]},{nome:"DEM",cadeiras:3,partidos:["DEM"]},{nome:"PSD",cadeiras:3,partidos:["PSD"]},{nome:"PTB",cadeiras:2,partidos:["PTB"]},{nome:"PR",cadeiras:2,partidos:["PR"]},{nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},{nome:"PSDB",cadeiras:1,partidos:["PSDB"]},{nome:"PRTB",cadeiras:1,partidos:["PRTB"]},{nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"MDB",cadeiras:1,partidos:["MDB"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=PE",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("PR",{assembleia:{2018:{bancada:"PSD",cadeiras:6,total:54,maiorAlianca:{nome:"PSB / PP / PSDB / DEM / PTB",cadeiras:15,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSD",cadeiras:6,partidos:["PSD"]},{nome:"PSB",cadeiras:5,partidos:["PSB"]},{nome:"PT",cadeiras:4,partidos:["PT"]},{nome:"PSC",cadeiras:4,partidos:["PSC"]},{nome:"PSL",cadeiras:4,partidos:["PSL"]},{nome:"PSDB",cadeiras:3,partidos:["PSDB"]},{nome:"PP",cadeiras:3,partidos:["PP"]},{nome:"PPS",cadeiras:3,partidos:["PPS"]},{nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PV",cadeiras:3,partidos:["PV"]},{nome:"DEM",cadeiras:3,partidos:["DEM"]},{nome:"PR",cadeiras:2,partidos:["PR"]},{nome:"PDT",cadeiras:2,partidos:["PDT"]},{nome:"PROS",cadeiras:2,partidos:["PROS"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]},{nome:"PRB",cadeiras:1,partidos:["PRB"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PRTB",cadeiras:1,partidos:["PRTB"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"PMN",cadeiras:1,partidos:["PMN"]},{nome:"PPL",cadeiras:1,partidos:["PPL"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=PR",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

seed("RS",{assembleia:{2018:{bancada:"PT",cadeiras:9,total:55,maiorAlianca:{nome:"PP / PTB",cadeiras:10,tipo:"Coligação proporcional"},grupos:[
  {nome:"PT",cadeiras:9,partidos:["PT"]},{nome:"MDB",cadeiras:8,partidos:["MDB"]},{nome:"PP",cadeiras:6,partidos:["PP"]},{nome:"PSL",cadeiras:4,partidos:["PSL"]},{nome:"PDT",cadeiras:4,partidos:["PDT"]},{nome:"PTB",cadeiras:4,partidos:["PTB"]},{nome:"PSDB",cadeiras:4,partidos:["PSDB"]},{nome:"PSB",cadeiras:3,partidos:["PSB"]},{nome:"PRB",cadeiras:2,partidos:["PRB"]},{nome:"NOVO",cadeiras:2,partidos:["NOVO"]},{nome:"PR",cadeiras:2,partidos:["PR"]},{nome:"DEM",cadeiras:2,partidos:["DEM"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=RS",label:"Composição por partido e coligação — Radar do Voto/TSE"}]}}});

// Fechamento da rodada 2018 — DF, RJ e SP.
seed("DF",{assembleia:{2018:{bancada:"PSB / AVANTE / PT / PRB / PDT",cadeiras:2,total:24,maiorAlianca:{nome:"Diversas listas (empate)",cadeiras:2,tipo:"Listas proporcionais (empate)"},grupos:[
  {nome:"PSB",cadeiras:2,partidos:["PSB"]},{nome:"AVANTE",cadeiras:2,partidos:["AVANTE"]},{nome:"PT",cadeiras:2,partidos:["PT"]},{nome:"PRB",cadeiras:2,partidos:["PRB"]},{nome:"PDT",cadeiras:2,partidos:["PDT"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"PP",cadeiras:1,partidos:["PP"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"MDB",cadeiras:1,partidos:["MDB"]},{nome:"PSC",cadeiras:1,partidos:["PSC"]},{nome:"NOVO",cadeiras:1,partidos:["NOVO"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PRP",cadeiras:1,partidos:["PRP"]},{nome:"PTC",cadeiras:1,partidos:["PTC"]},{nome:"PSOL",cadeiras:1,partidos:["PSOL"]},{nome:"REDE",cadeiras:1,partidos:["REDE"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]},{nome:"PSD",cadeiras:1,partidos:["PSD"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?ue=DF",label:"Composição por partido — Radar do Voto/TSE"}],nota:"Empate entre cinco maiores bancadas partidárias, com 2 cadeiras. Também houve empate entre diversas listas proporcionais no topo, com 2 cadeiras; por isso o campo de maior aliança registra o empate em vez de selecionar arbitrariamente uma delas."}}});

seed("RJ",{assembleia:{2018:{bancada:"PSL",cadeiras:12,total:70,maiorAlianca:{nome:"PSL",cadeiras:12,tipo:"Lista proporcional"},grupos:[
  {nome:"PSL",cadeiras:12,partidos:["PSL"]},{nome:"DEM",cadeiras:5,partidos:["DEM"]},{nome:"MDB",cadeiras:5,partidos:["MDB"]},{nome:"PSOL",cadeiras:5,partidos:["PSOL"]},{nome:"PSD",cadeiras:4,partidos:["PSD"]},{nome:"PDT",cadeiras:3,partidos:["PDT"]},{nome:"PT",cadeiras:3,partidos:["PT"]},{nome:"PRB",cadeiras:3,partidos:["PRB"]},{nome:"Solidariedade",cadeiras:3,partidos:["Solidariedade"]},{nome:"PP",cadeiras:2,partidos:["PP"]},{nome:"PSDB",cadeiras:2,partidos:["PSDB"]},{nome:"PRP",cadeiras:2,partidos:["PRP"]},{nome:"PHS",cadeiras:2,partidos:["PHS"]},{nome:"NOVO",cadeiras:2,partidos:["NOVO"]},{nome:"PSB",cadeiras:2,partidos:["PSB"]},{nome:"PSC",cadeiras:2,partidos:["PSC"]},{nome:"DC",cadeiras:2,partidos:["DC"]},{nome:"PRTB",cadeiras:1,partidos:["PRTB"]},{nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},{nome:"PTC",cadeiras:1,partidos:["PTC"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]},{nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},{nome:"PR",cadeiras:1,partidos:["PR"]},{nome:"PMB",cadeiras:1,partidos:["PMB"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"PPS",cadeiras:1,partidos:["PPS"]},{nome:"PTB",cadeiras:1,partidos:["PTB"]},{nome:"PODE",cadeiras:1,partidos:["PODE"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?ue=RJ",label:"Composição por partido e coligação — Radar do Voto/TSE"}],nota:"O PSL, que concorreu em lista própria nessa disputa proporcional, foi simultaneamente a maior bancada partidária e a lista com mais cadeiras, com 12 das 70 vagas."}}});

seed("SP",{assembleia:{2018:{bancada:"PSL",cadeiras:15,total:94,maiorAlianca:{nome:"PSDB / DEM / PRB / PP / PSD",cadeiras:27,tipo:"Coligação proporcional"},grupos:[
  {nome:"PSL",cadeiras:15,partidos:["PSL"]},{nome:"PT",cadeiras:10,partidos:["PT"]},{nome:"PSDB",cadeiras:8,partidos:["PSDB"]},{nome:"PSB",cadeiras:8,partidos:["PSB"]},{nome:"DEM",cadeiras:7,partidos:["DEM"]},{nome:"PR",cadeiras:6,partidos:["PR"]},{nome:"PRB",cadeiras:6,partidos:["PRB"]},{nome:"PSOL",cadeiras:4,partidos:["PSOL"]},{nome:"PODE",cadeiras:4,partidos:["PODE"]},{nome:"PP",cadeiras:4,partidos:["PP"]},{nome:"NOVO",cadeiras:4,partidos:["NOVO"]},{nome:"MDB",cadeiras:3,partidos:["MDB"]},{nome:"PSD",cadeiras:2,partidos:["PSD"]},{nome:"PTB",cadeiras:2,partidos:["PTB"]},{nome:"PPS",cadeiras:2,partidos:["PPS"]},{nome:"PV",cadeiras:1,partidos:["PV"]},{nome:"PHS",cadeiras:1,partidos:["PHS"]},{nome:"PATRI",cadeiras:1,partidos:["PATRI"]},{nome:"PROS",cadeiras:1,partidos:["PROS"]},{nome:"PDT",cadeiras:1,partidos:["PDT"]},{nome:"PCdoB",cadeiras:1,partidos:["PCdoB"]},{nome:"Solidariedade",cadeiras:1,partidos:["Solidariedade"]},{nome:"AVANTE",cadeiras:1,partidos:["AVANTE"]},{nome:"REDE",cadeiras:1,partidos:["REDE"]}
],source:SOURCES.tse2018,sources:[{url:"https://radardovoto.com/pleito/deputado-estadual-2018?fed=1&ue=SP",label:"Composição por coligação — Radar do Voto/TSE"},{url:"https://radardovoto.com/pleito/deputado-estadual-2018?ue=SP",label:"Composição por partido — Radar do Voto/TSE"}],nota:"Maior bancada partidária: PSL (15). Maior coligação proporcional: PSDB/DEM/PRB/PP/PSD (27). Soma partidária = 94."}}});
