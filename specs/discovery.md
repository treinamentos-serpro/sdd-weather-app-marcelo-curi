# Discovery — Aplicação de previsão do tempo

## Contexto

A empresa deseja disponibilizar uma aplicação que permita aos usuários consultar informações meteorológicas de cidades. A experiência deve incluir condições atuais e previsão para os próximos cinco dias, com opção de exibição em Celsius ou Fahrenheit e suporte ao uso em dispositivos móveis.

O briefing define as capacidades principais, mas não especifica público-alvo, critérios de desempenho, fontes de dados, detalhes da previsão ou requisitos operacionais. Esses pontos devem ser esclarecidos antes da elaboração da especificação detalhada.

## Personas Propostas

Personas hipotéticas para orientar discovery e validação. Não representam pesquisa com usuários; os perfis e métricas devem ser confirmados com usuários reais.

### Persona 1 — Camila, profissional em deslocamento

- **Objetivo principal:** verificar rapidamente o clima atual e a previsão para decidir como se vestir e se precisa ajustar seus planos do dia.
- **Contexto de uso:** principalmente mobile, em deslocamentos e com conexões que podem ser instáveis; pode usar desktop para consultar a previsão com antecedência.
- **Métrica de sucesso do ponto de vista dela:** encontrar a cidade desejada e entender as condições atuais em menos de um minuto, sem ambiguidade sobre a localidade ou a unidade.

### Persona 2 — Rafael, pessoa que planeja atividades ao ar livre

- **Objetivo principal:** comparar a previsão dos próximos dias para escolher quando realizar uma atividade externa.
- **Contexto de uso:** mobile para consultas rápidas e desktop em casa ou no trabalho para visualizar e comparar os dias com mais atenção.
- **Métrica de sucesso do ponto de vista dele:** consultar os cinco dias e identificar rapidamente os dias adequados à atividade, com dados claros e atualizados.

### Persona 3 — Morgan, viajante internacional

- **Objetivo principal:** consultar o clima de cidades que visitará e compreender as temperaturas na unidade com que está familiarizado.
- **Contexto de uso:** principalmente mobile durante a viagem; pode alternar entre Celsius e Fahrenheit e pesquisar cidades em diferentes países.
- **Métrica de sucesso do ponto de vista dela:** selecionar a cidade correta, especialmente quando há nomes semelhantes, e interpretar temperaturas sem fazer conversões por conta própria.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades para consultar suas condições meteorológicas.
- **RF-02 — Identificar a cidade selecionada:** apresentar a cidade correspondente aos dados exibidos, reduzindo ambiguidades entre cidades de mesmo nome.
- **RF-03 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF-04 — Consultar previsão:** exibir a previsão para cinco dias da cidade selecionada.
- **RF-05 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit para os valores de temperatura apresentados.
- **RF-06 — Aplicar unidade selecionada:** apresentar os valores de temperatura do clima atual e da previsão na unidade selecionada pelo usuário.
- **RF-07 — Informar falhas de consulta:** comunicar quando não for possível encontrar uma cidade ou obter/atualizar os dados meteorológicos.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade e compatibilidade móvel:** a aplicação deve adaptar conteúdo e controles a dispositivos móveis e telas maiores, sem rolagem horizontal. Navegadores e larguras de tela suportados devem ser definidos antes dos testes de aceite.
- **RNF-02 — Usabilidade:** busca, seleção da cidade e alternância de unidade devem ser compreensíveis e consistentes.
- **RNF-03 — Acessibilidade:** a interface deve permitir navegação por teclado, apresentar foco visível, oferecer nomes acessíveis aos controles e atender ao nível WCAG 2.2 AA.
- **RNF-04 — Performance:** como meta inicial a validar, 95% das buscas devem apresentar resultados em até 2 segundos e a página principal deve carregar em até 2,5 segundos, sob condições de rede e dispositivo acordadas.
- **RNF-05 — Disponibilidade:** definir e monitorar uma meta mensal de disponibilidade para a aplicação. Como referência inicial sujeita à validação, considerar 99,5%; falhas do serviço meteorológico externo devem ser medidas e reportadas separadamente.
- **RNF-06 — Atualidade dos dados:** definir a idade máxima aceitável dos dados meteorológicos e, quando aplicável, apresentar ao usuário o horário da última atualização.
- **RNF-07 — Segurança e privacidade:** usar HTTPS e definir quais dados de busca ou localização são armazenados, por quanto tempo e sob quais condições de consentimento.

## Decisões

| Decisão | Justificativa | Perguntas em aberto resolvidas |
|---|---|---|
| **Fonte de dados: Open-Meteo, sem API key.** | Adotar uma fonte sem chave simplifica a integração inicial e evita a gestão de credenciais de API. Cobertura, limites de uso, termos e atribuição ainda devem ser verificados antes do lançamento. | Define a fonte para geocodificação e dados meteorológicos (pergunta 14) e reduz a incerteza sobre credenciais do provedor (pergunta 26). Não resolve limites, custos ou requisitos de atribuição. |
| **“Cinco dias” significa hoje mais os quatro dias seguintes.** | Define um intervalo concreto para a previsão e elimina a ambiguidade sobre a inclusão do dia atual. | Resolve a inclusão do dia atual na previsão (pergunta 9). A granularidade e os campos da previsão permanecem em aberto. |
| **Unidade padrão: Celsius.** | Estabelece um comportamento inicial previsível para a primeira consulta; o usuário ainda poderá alternar para Fahrenheit. | Resolve qual unidade será usada inicialmente (pergunta 12). Persistência da preferência e regras de arredondamento continuam em aberto. |
| **Sem autenticação e sem persistência de servidor.** | Mantém o escopo inicial simples e evita contas e armazenamento de dados no servidor. | Resolve se haverá login, favoritos, histórico persistido e sincronização entre dispositivos (pergunta 24); também delimita o armazenamento de consultas no servidor (pergunta 25). Não define eventual armazenamento local no dispositivo nem elimina obrigações de privacidade. |
| **Idioma da interface: português do Brasil (pt-BR).** | Define um idioma e uma convenção regional para a experiência inicial. | Resolve o idioma inicial e as convenções regionais da interface (pergunta 23). Não define suporte futuro a outros idiomas nem o formato de dados meteorológicos de outras regiões. |

## Riscos

Estimativas preliminares de probabilidade e impacto; devem ser revistas após definição do público, do escopo e dos provedores.

| Tipo | Risco | Probabilidade | Impacto | Estratégia de mitigação |
|---|---|---|---|---|
| Técnico | Indisponibilidade, limite de requisições ou mudança nos termos da API meteorológica | Média | Alto: consultas podem falhar, ser limitadas ou gerar custos e mudanças não planejados. | Avaliar cobertura, limites, custos e termos antes de escolher o provedor; monitorar falhas e uso; definir tratamento de indisponibilidade e cache compatível com os termos. |
| Técnico | Dados meteorológicos atrasados, incompletos ou diferentes do esperado | Média | Alto: reduz a confiança e pode levar a decisões baseadas em informações incorretas. | Definir requisitos de atualidade e campos necessários; indicar a hora da última atualização quando relevante; validar a qualidade dos dados e comunicar limitações. |
| Técnico | Busca ambígua entre cidades com o mesmo nome | Alta | Médio a alto: o usuário pode consultar a localidade errada. | Mostrar informações de desambiguação, como estado, região e país; definir a ordenação e seleção dos resultados. |
| Técnico | Desempenho ruim em redes móveis ou dispositivos de menor capacidade | Média | Alto: consultas lentas ou falhas reduzem o uso da aplicação. | Definir metas e condições de medição; otimizar carregamento e quantidade de dados; testar em dispositivos e redes representativos; estabelecer limites de tempo e recuperação. |
| Técnico | Falhas de conectividade sem tratamento claro | Alta | Médio: o usuário pode não entender por que não há dados ou se a consulta ainda está em andamento. | Especificar estados de carregamento, erro e ausência de resultados; apresentar mensagens claras; decidir se dados em cache podem ser exibidos e com qual indicação de atualização. |
| Técnico | Conversão ou arredondamento inconsistente entre Celsius e Fahrenheit | Média | Médio: reduz a confiança e pode exibir informações contraditórias entre clima atual e previsão. | Definir regras de conversão e arredondamento; aplicar a unidade de forma uniforme; cobrir as conversões com testes. |
| Técnico | Problemas de responsividade ou compatibilidade em dispositivos e navegadores relevantes | Média | Alto: usuários podem não conseguir pesquisar ou consultar a previsão em seus aparelhos. | Definir a matriz de navegadores, sistemas e larguras de tela; testar os fluxos principais nessa matriz; validar ausência de rolagem horizontal e controles utilizáveis. |
| Técnico | Barreiras de acessibilidade | Média | Alto: pessoas com deficiência podem não conseguir usar funções essenciais e correções tardias podem ser custosas. | Definir nível e critérios de acessibilidade; validar teclado, foco, leitores de tela, contraste e nomes acessíveis desde o início. |
| Produto | Escopo de “clima atual” e “previsão de cinco dias” não está definido | Alta | Alto: interpretações distintas podem levar a entregas incompletas e retrabalho. | Validar os campos meteorológicos, a granularidade da previsão e se o dia atual está incluído; registrar critérios de aceite antes da implementação. |
| Produto | Proposta de valor e público-alvo não estão claros | Média | Alto: funcionalidades e linguagem podem não resolver as necessidades dos usuários, reduzindo adoção. | Identificar segmentos e tarefas prioritárias; validar fluxos com usuários; definir métricas de sucesso antes do lançamento. |
| Produto | Requisitos de localização, idioma e unidades regionais são decididos tarde | Média | Médio a alto: pode exigir mudanças em busca, interface e apresentação dos dados. | Definir regiões e idiomas prioritários; esclarecer se haverá localização do dispositivo e quais unidades além da temperatura devem ser oferecidas. |
| Produto | Metas de disponibilidade e performance não são validadas | Média | Médio a alto: equipes podem discordar sobre qualidade aceitável ou medir resultados em condições irrelevantes. | Acordar metas, condições de teste e responsabilidades entre aplicação e provedor externo; monitorar indicadores após o lançamento. |
| Produto / privacidade | Coleta ou armazenamento de buscas e localização sem regras claras | Baixa a média | Alto: pode criar exposição de dados pessoais, perda de confiança e obrigações legais. | Minimizar dados coletados; definir consentimento, retenção e finalidade; documentar a política de privacidade antes de habilitar localização ou histórico. |
| Produto / operação | Limites e custos do provedor crescem com o uso | Média | Alto: pode gerar custos inesperados ou bloqueio de consultas. | Estimar volume, acompanhar consumo e configurar alertas; revisar limites e modelo de custos; adotar cache somente conforme os termos do provedor. |

## Perguntas em Aberto

As perguntas abaixo registram ambiguidades e lacunas do briefing. O impacto descreve o risco de tomar decisões ou implementar sem uma resposta validada.

| # | Pergunta em aberto | Impacto de seguir sem resposta |
|---|---|---|
| 1 | Quem são os usuários-alvo e quais necessidades ou tarefas principais a aplicação deve atender? | Pode-se priorizar funcionalidades, linguagem e fluxos que não correspondam aos usuários reais, reduzindo adoção e valor do produto. |
| 2 | Em quais países ou regiões a aplicação será usada? | A busca, a cobertura meteorológica, os formatos de data/hora, os idiomas e a desambiguação de cidades podem ser inadequados para o público. |
| 3 | A aplicação será apenas web responsiva ou também deverá ser instalável como PWA ou oferecida em lojas de aplicativos? | A arquitetura, os requisitos de instalação, notificações, funcionamento offline e critérios de aceite podem mudar significativamente. |
| 4 | A busca aceitará apenas nomes de cidades ou também códigos postais, estados/regiões e localização do dispositivo? | O fluxo de busca e a escolha do serviço de geocodificação podem ficar incompletos; localização automática também introduz implicações de permissão e privacidade. |
| 5 | Como distinguir cidades homônimas: país, estado, região, código postal ou coordenadas? | Usuários podem escolher a localidade errada e receber dados meteorológicos incorretos para sua intenção. |
| 6 | A busca deve sugerir resultados enquanto o usuário digita? Qual deve ser o comportamento para consultas parciais, erros de digitação e nenhum resultado? | A experiência pode ser inconsistente, frustrante ou exigir retrabalho nos fluxos e testes de busca. |
| 7 | Quais informações compõem o “clima atual” (por exemplo, temperatura, sensação térmica, condição, umidade, vento, pressão ou precipitação)? | Sem um conjunto definido de dados, produto, design e implementação podem divergir sobre o conteúdo essencial e a capacidade da fonte escolhida. |
| 8 | Qual período define “atual” e quando os dados devem ser considerados desatualizados? | A interface pode apresentar dados antigos como atuais, comprometendo confiança e decisões do usuário. |
| 9 | “Previsão de 5 dias” inclui o dia atual ou os cinco dias seguintes? Será uma visão diária, por hora ou ambas? | O número de períodos, o conteúdo e a apresentação podem diferir do esperado, exigindo mudanças nos componentes e nos critérios de aceite. |
| 10 | Quais valores e condições devem aparecer na previsão (mínima/máxima, precipitação, probabilidade de chuva, ícones, descrição)? | A previsão pode ser insuficiente para as tarefas do usuário ou inconsistente com a expectativa de “previsão”. |
| 11 | Quais unidades além da temperatura devem ser suportadas (velocidade do vento, precipitação, pressão)? | A unidade de temperatura pode alternar enquanto outros dados permanecem em unidades inadequadas ao mercado-alvo. |
| 12 | A seleção Celsius/Fahrenheit deve ser aplicada imediatamente? Deve persistir entre cidades, recargas e sessões? | A unidade pode mudar de forma inesperada ou a preferência pode se perder, prejudicando consistência e usabilidade. |
| 13 | Como devem ser arredondadas as temperaturas e outras medidas ao converter unidades? | Valores podem parecer inconsistentes entre telas ou diferir do serviço de dados, causando confusão. |
| 14 | Qual fonte de geocodificação e previsão será usada, e quais são seus termos, cobertura, limites de uso e atribuição exigida? | Pode haver limitações legais, custos, falta de cobertura, rate limits ou impossibilidade de entregar os dados planejados. |
| 15 | Qual é a frequência de atualização esperada e existe um orçamento para uso da API ou infraestrutura? | Sem limites definidos, custos e tráfego podem crescer inesperadamente ou dados podem ficar menos atualizados do que o esperado. |
| 16 | O que deve acontecer se a API falhar, exceder o tempo limite ou retornar dados incompletos: mensagem, nova tentativa, cache ou dados anteriores? | O usuário pode ficar sem orientação; estratégias de recuperação e a UX de erro podem ser inconsistentes. |
| 17 | Deve haver cache? Se sim, por quanto tempo e quando dados em cache podem ser exibidos? | Sem política, pode-se aumentar custos e latência ou, no sentido oposto, apresentar dados desatualizados sem indicação. |
| 18 | A aplicação precisa funcionar sem conexão ou oferecer algum modo degradado? | Se necessário e não planejado, usuários móveis em redes instáveis podem perder totalmente o acesso; implementar offline depois pode ser caro. |
| 19 | Qual meta de disponibilidade é requerida e como indisponibilidade da aplicação será distinguida da indisponibilidade do provedor externo? | Não será possível estabelecer SLA, alertas ou expectativas confiáveis; uma meta sem definição de medição pode ser enganosa. |
| 20 | Quais metas de performance se aplicam e em quais condições de dispositivo, rede, região e volume de dados serão medidas? | Os números podem não representar a experiência real e as equipes podem discordar sobre o que significa desempenho aceitável. |
| 21 | Quais navegadores, sistemas operacionais, dispositivos e larguras de tela devem ser suportados? | Testes e implementação podem deixar de cobrir plataformas importantes ou criar compromissos de compatibilidade desnecessários. |
| 22 | Qual nível de acessibilidade deve ser atendido e quais tecnologias assistivas fazem parte da validação? | Barreiras podem impedir o uso por pessoas com deficiência e correções tardias podem exigir mudanças estruturais. |
| 23 | A aplicação será oferecida em quais idiomas e convenções regionais (data, hora, separadores e nomes de condições)? | Conteúdo e valores podem ser incompreensíveis ou apresentados em formatos incompatíveis com a região do usuário. |
| 24 | Será necessário login, favoritos, histórico de buscas ou sincronização entre dispositivos? | A ausência ou inclusão equivocada de conta e persistência afeta escopo, arquitetura, privacidade e esforço de entrega. |
| 25 | A aplicação armazenará consultas, localização ou identificadores de usuário? Qual retenção, consentimento e política de privacidade se aplicam? | Pode haver coleta desnecessária de dados, risco de privacidade e obrigações legais não consideradas. |
| 26 | Há requisitos de segurança, proteção contra abuso e tratamento de segredos/chaves do provedor? | Endpoints podem ser abusados, limites de API consumidos por terceiros ou credenciais expostas, gerando custo e indisponibilidade. |
| 27 | Como será medido o sucesso do produto (por exemplo, conclusão de busca, retorno de usuários ou uso da previsão)? | A equipe pode entregar funcionalidades sem saber se atendem ao objetivo do negócio ou quais melhorias priorizar. |
| 28 | Quais são o prazo, orçamento, plataformas prioritárias e escopo mínimo da primeira versão? | O escopo pode crescer sem critério, comprometer prazos ou deixar de priorizar o valor essencial. |
| 29 | Quem é responsável por aprovar requisitos, conteúdo meteorológico e critérios de aceite? | Decisões podem permanecer sem dono, causando bloqueios, interpretações conflitantes e retrabalho. |

### Perguntas sobre metas não funcionais sugeridas

As metas numéricas abaixo são referências preliminares, não compromissos aprovados.

- **Performance:** 95% das buscas em até 2 segundos e carregamento da página principal em até 2,5 segundos são metas adequadas? Qual rede, dispositivo e região de medição devem ser usados? **Impacto:** metas sem contexto podem ser impossíveis de validar ou otimizar para condições pouco representativas.
- **Disponibilidade:** a referência mensal de 99,5% é adequada? O cálculo inclui falhas do provedor meteorológico? **Impacto:** escopo de medição não acordado pode criar expectativas de disponibilidade incompatíveis com dependências externas.
- **Acessibilidade:** WCAG 2.2 AA é o nível esperado? **Impacto:** sem um padrão e critérios de verificação, conformidade e priorização ficam subjetivas.
- **Atualidade:** qual idade máxima dos dados é aceitável e em que situações mostrar o horário da última atualização? **Impacto:** os usuários podem confiar em informação vencida ou ver avisos desnecessários.
- **Responsividade:** a meta de evitar rolagem horizontal vale para todas as telas suportadas? **Impacto:** sem uma matriz de telas, o aceite visual será subjetivo e pode omitir aparelhos relevantes.

## Suposições

- A busca e a consulta de previsão são iniciadas pelo usuário, sem necessidade de localização automática.
- O usuário deve selecionar uma cidade antes de visualizar seus dados meteorológicos.
- Celsius e Fahrenheit são as únicas unidades de temperatura necessárias no escopo inicial.
- “Cinco dias” refere-se a uma previsão diária para cinco dias; a inclusão do dia atual precisa ser confirmada.
- A aplicação deve funcionar em navegadores de dispositivos móveis, além de telas maiores; a matriz específica de suporte ainda precisa ser definida.
- Os dados meteorológicos serão fornecidos por um serviço externo, ainda a definir.
- Os valores de performance e disponibilidade registrados como metas iniciais são sugestões para validação, não compromissos aprovados.
