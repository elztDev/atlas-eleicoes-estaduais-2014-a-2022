ATLAS POLÍTICO DOS ESTADOS — protótipo funcional
Revisão do arquivo: 18/09/2026

ARQUIVOS
- index.html: interface principal
- styles.css: layout e responsividade
- data.js: base política e metadados
- app.js: tabelas, detalhes, mapas, comparação e exportação

COMO ABRIR
1. Extraia a pasta inteira.
2. Abra index.html em um navegador moderno.
3. Para publicar, envie os quatro arquivos da pasta para qualquer hospedagem estática.

RECURSOS
- Aba Governadores: 2014, 2018 e 2022.
- Aba Assembleias Legislativas: maior bancada, total de cadeiras e aliança/grupo com mais cadeiras.
- Aba Mapas: partido/coligação do governador, maior bancada e composição do plenário por partido/federação.
- Paleta ideológica única, baseada nas referências acadêmicas documentadas no próprio site.
- Comparação lado a lado entre eleições.
- URLs preservam aba, ano, modo, comparação e UF selecionada.
- Exportação CSV das tabelas.
- Seção recolhida “Sobre os dados e a metodologia”.
- Estados dos dados são distinguidos visualmente: “—” (não se aplica), “Em validação” (ainda sendo conferido) e “Não localizado” (fonte consultada sem o dado).

OBSERVAÇÃO SOBRE O MAPA
A geometria simplificada das UFs é carregada de uma fonte TopoJSON externa. Em uma publicação definitiva, é recomendável hospedar a malha junto do próprio site para eliminar essa dependência.

DADOS
A estrutura está preenchida para os 27 Estados. Governadores de 2014, 2018 e 2022 estão cadastrados com partido, coligação e integrantes da aliança eleitoral. O campo de apoio no 2º turno presidencial está preenchido para 2018 e 2022. Em 2014, foram preenchidos os 15 estados informados; os demais permanecem em validação.

As Assembleias/Câmara Legislativa estão preenchidas para 2014, 2018 e 2022 com:
- maior bancada partidária/federação;
- total de cadeiras;
- lista/coligação proporcional com mais cadeiras quando aplicável;
- composição completa por partido/federação para o plenário.

A soma das bancadas foi conferida contra o total de cadeiras em cada UF. Não substituir “Em validação” por inferências nos campos que ainda dependam de checagem específica.

- Fontes centralizadas em “Sobre os dados e a metodologia”, sem links repetidos nas tabelas ou páginas de Estado.

LAYOUT CONGELADO
- Cabeçalho das tabelas fixo durante a rolagem (no celular, dentro da área rolável da tabela).
- Governadores: cor sempre derivada da ideologia do partido do candidato eleito.
- Plenário: cada grupo é colorido pela ideologia do partido/federação efetivamente representado.
- Total de cadeiras destacado acima do plenário.


Atualização de dados — Assembleias Legislativas 2014, 2018 e 2022
- Composição eleita reconstruída para as 27 UFs nos três pleitos.
- Em 2014 e 2018, as listas/coligações proporcionais são registradas separadamente da maior bancada partidária.
- Em 2022, federações são agregadas como unidades eleitorais quando aplicável.
- A soma dos grupos foi validada contra o total de cadeiras de cada Casa.
