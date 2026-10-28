# Backlog de tarefas — Weather App

## Revisão P8 — backlog de testes e contratos aprovados

Estas tarefas ajustam os critérios anteriores conflitantes conforme a revisão P8 da spec e do plano:

- **P8.1/P8.2:** extrair helpers compartilhados de temperatura/WMO/data e testar conversões, arredondamento, símbolos, fallback e calendário pt-BR.
- **P8.3:** bloquear busca vazia sem fetch; testar mapeamento, resultado ausente, HTTP inválido, precipitação explicitamente nula como zero e ausência de `current`/`daily` como `WeatherServiceError`.
- **P8.4:** bloquear submissão vazia com feedback acessível e testar `UnitToggle` + `CurrentWeather` em `0°C ↔ 32°F`.
- **P8.5/P8.6:** testar seleção explícita, região “Previsão de 5 dias”, conversão e vazio “Nenhuma cidade encontrada”, também em 375×812.
- **P8.7/P8.8:** cobrir falhas de rede/provedor e respostas parciais; eliminar assertions não aguardadas e promises sem resolução nos handlers de rota; validar lint, build, Vitest e Playwright.
- **Dependências:** P8.3/P8.4 dependem dos helpers P8.1/P8.2; P8.5/P8.6 dependem dos novos contratos P8.3/P8.4; P8.7/P8.8 validam todas as etapas.

Fonte principal: `plans/weather-app-plan.md`

Requisitos relacionados: `specs/weather-app-spec.md`

## Legenda de prioridade e tamanho

- **P0:** necessário para entregar e validar o fluxo principal aprovado antes do lançamento.
- **P1:** importante para qualidade/operabilidade, mas pode vir após a primeira fatia funcional.
- **P2:** condicional ou adiável sem bloquear o fluxo principal.
- **P:** tarefa pequena e focada; **M:** esforço intermediário; **G:** maior complexidade/incerteza relativa. São estimativas comparativas, não duração fixa.

## Sequência sugerida em fatias verticais

1. **Busca visível:** T-01, T-02, T-03, T-08, T-11, T-14, T-15, T-16 e testes T-25, T-28, T-30, T-32. Compor T-22 incrementalmente para que esta fatia já permita pesquisar e escolher uma cidade antes da previsão estar pronta.
2. **Condições atuais:** T-05, T-07, T-09, T-10, T-12, T-17, T-18 e testes T-27, T-29, T-31, T-33. Ao fim, seleção da cidade leva a condições atuais, erros e atualização manual observáveis.
3. **Previsão de cinco dias:** T-06, T-19, T-20 e ampliar T-22; validar com T-27, T-29, T-33 e T-35. Os dados diários ausentes permanecem em branco.
4. **Unidades e acabamento funcional:** T-04, T-13, T-21 e T-24; validar com T-26, T-31, T-34 e T-35. Fahrenheit funciona sem nova consulta.
5. **Hardening de interface e release:** T-23, T-36, T-37, T-38 (somente se houver aprovação), T-39 e T-40. Aplicar critérios de responsividade, acessibilidade, qualidade, atribuição e operação.

As dependências listadas em cada tarefa continuam sendo pré-requisitos para concluí-la. T-22 pode ser composta incrementalmente durante as primeiras fatias, mas só é considerada concluída após todas as dependências listadas. Os testes indicados em cada fatia devem ser executados junto com a implementação correspondente; não é necessário esperar a última fatia de testes para validar o que já está visível.

## Entrega 1 — Tipos e contratos

### T-01 — Definir contratos de domínio
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Declarar os tipos internos de localidade, condições atuais, previsão, snapshot e unidade.
- **Critérios de aceite:**
  - `City` contém `id`, `name`, `latitude`, `longitude`, `timezone` e qualificadores opcionais `country`/`admin1`.
  - `CurrentWeather`, `ForecastDay` e `WeatherSnapshot` contêm os campos nomeados no modelo do plano; `TemperatureUnit` aceita somente `celsius` ou `fahrenheit`.
  - Campos meteorológicos que representam dados ausentes aceitam explicitamente `null`; `WeatherSnapshot` exige cidade, condições atuais, dias, `fetchedAt` e `sourceValidAt`.
- **Dependências:** Nenhuma
- **Arquivos prováveis:** `src/types/weather.ts`
- **Requisitos:** FR-03, FR-04, FR-07; RNF-06

### T-02 — Definir contratos de estado e erro
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Declarar os status e erros independentes de busca e consulta meteorológica.
- **Critérios de aceite:**
  - Os tipos de status aceitam exatamente os estados de busca `idle`, `loading`, `success`, `empty`, `error` e de clima `idle`, `loading`, `success`, `error`.
  - Tipos de erro representam `timeout`, `network`, `provider` e `unavailable` sem confundir `empty` com falha.
  - Validação local representa separadamente `required`, `invalid` e `too-long`.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/types/weather.ts`
- **Requisitos:** FR-01, FR-07; CA-01, CA-07

## Entrega 2 — Funções puras de domínio

### T-03 — Normalizar e validar entrada de busca
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Implementar normalização NFC, redução de espaços e validação por grafemas.
- **Critérios de aceite:**
  - Entrada composta/decomposta equivalente resulta na mesma string NFC; trim e colapso de espaços internos ocorrem antes da validação.
  - Entradas com 1 e 200 grafemas formados por letras/espaços passam; entradas com 0 ou 201 grafemas falham com `required`/`too-long`.
  - Hífen, apóstrofo, dígitos e pontuação falham com `invalid`.
  - Testes da função confirmam o texto normalizado e o erro correspondente; a função não importa nem chama serviço de rede.
- **Dependências:** T-02
- **Arquivos prováveis:** `src/lib/search.ts`
- **Requisitos:** FR-01; CA-01, CA-07

### T-04 — Implementar conversão e arredondamento de temperatura
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar função pura para converter Celsius/Fahrenheit e arredondar a apresentação.
- **Critérios de aceite:**
  - Para os valores de teste `0 °C`, `-40 °C` e `20 °C`, a conversão retorna respectivamente `32 °F`, `-40 °F` e `68 °F`.
  - A conversão inversa retorna `0 °C` para `32 °F` e `-40 °C` para `-40 °F`.
  - O arredondamento ocorre após a conversão e arredonda casos de empate positivos e negativos para longe de zero.
  - Converter `null` mantém `null`; nenhum valor ausente vira número.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Requisitos:** FR-05, FR-06; CA-05, CA-06

### T-05 — Mapear códigos meteorológicos e direção do vento
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar funções puras de descrição WMO em pt-BR e conversão de azimute em setor cardeal.
- **Critérios de aceite:**
  - Cada código declarado na tabela WMO do módulo retorna uma descrição não vazia em pt-BR; um código não mapeado não retorna descrição inventada.
  - A função de direção retorna um dos 16 rótulos definidos para cada setor de 22,5°; 0° e 360° retornam norte e 22,5° é arredondado para o setor mais próximo.
  - Entrada ausente retorna ausência em vez de descrição ou direção.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/weather.ts`
- **Requisitos:** FR-03, FR-04; RNF-09, RNF-10

### T-06 — Construir datas civis da previsão
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Produzir hoje local e os quatro dias civis seguintes no fuso IANA da cidade.
- **Critérios de aceite:**
  - Para um instante e timezone fixos, a função retorna exatamente cinco datas `YYYY-MM-DD`: hoje local e os quatro dias civis seguintes.
  - Um caso de teste cujo dia local difere do UTC retorna as datas do timezone IANA informado, sem consultar o timezone do processo.
  - A função sempre retorna as cinco datas sem depender da existência de valores forecast.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/weather.ts`
- **Requisitos:** FR-04; CA-04

### T-07 — Formatar horário e determinar desatualização
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Implementar apresentação pt-BR de datas/horários e cálculo da idade da observação.
- **Critérios de aceite:**
  - A formatação com locale `pt-BR` usa o timezone da cidade e inclui abreviação ou deslocamento UTC no horário.
  - Com `sourceValidAt` exatamente 24 horas antes do instante de referência, a função não marca desatualizado; com idade superior, marca desatualizado.
  - Testes passam um instante de referência fixo, sem depender do relógio real.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/weather.ts`
- **Requisitos:** FR-03, FR-07; CA-03, CA-07; RNF-06, RNF-09

## Entrega 3 — Services Open-Meteo

### T-08 — Implementar busca de localidades
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Consultar geocodificação e converter resultados válidos em `City`.
- **Critérios de aceite:**
  - A requisição usa HTTPS e query params `name`, `count=100`, `language=pt`, `format=json`; testes verificam cada valor.
  - Resposta válida mapeia id, nome, latitude, longitude, timezone e `country`/`admin1` quando presentes; timezone ou campos obrigatórios ausentes resultam em `provider`.
  - `results` vazio ou ausente sem erro do provedor resulta em `[]`; HTTP não-2xx, erro declarado e JSON inválido resultam em `provider`; rejeição de transporte resulta em `network`.
  - A função encaminha o `AbortSignal`; chamada sem resposta termina como `timeout` em até 10 segundos e abort explícito não é classificado como sucesso.
- **Dependências:** T-01, T-02, T-03
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Requisitos:** FR-01, FR-02, FR-07; CA-01, CA-02; RNF-07, RNF-08

### T-09 — Consultar e validar resposta de previsão
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Solicitar os campos meteorológicos aprovados e validar a estrutura/unidades recebidas.
- **Critérios de aceite:**
  - Testes da URL confirmam coordenadas da cidade, `timezone=auto`, `temperature_unit=celsius`, `wind_speed_unit=kmh`, `forecast_days=5` e todos os campos `current`/`daily` do plano.
  - Resposta não-2xx, erro declarado, JSON inválido e unidade incompatível resultam em erro `provider`; rejeição de transporte resulta em `network`.
  - A função encaminha `AbortSignal`; timeout é classificado como `timeout` e encerra a espera em até 10 segundos.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Requisitos:** FR-03, FR-04, FR-07; RNF-07, RNF-08, RNF-10

### T-10 — Mapear resposta de previsão para snapshot
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Converter a resposta validada em modelo interno, associando séries diárias às datas construídas.
- **Critérios de aceite:**
  - Temperaturas no snapshot são Celsius e velocidade do vento é km/h; cada valor diário é associado pela correspondência exata entre `daily.time` e `days[].date`.
  - O snapshot contém exatamente as cinco datas de T-06 mesmo quando `daily`/séries estão ausentes, curtas ou não contêm a data; campos sem correspondência são `null`.
  - Se a mínima exceder a máxima, ambos os valores são `null`; ausência de temperatura atual ou `conditionCode` produz `unavailable`.
  - Ausência de qualquer campo não mínimo (incluindo valores diários) não produz `unavailable`.
  - Snapshot contém a cidade selecionada, `fetchedAt` ISO e `sourceValidAt` igual ao horário de origem ou `null` se ausente.
- **Dependências:** T-01, T-05, T-06, T-09
- **Arquivos prováveis:** `src/services/weatherService.ts`, `src/lib/weather.ts`
- **Requisitos:** FR-03, FR-04, FR-07; CA-03, CA-04, CA-07; RNF-06, RNF-10

## Entrega 4 — Hook e coordenação de estado

### T-11 — Coordenar estado e ações de busca
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Implementar no hook validação, geocodificação, estados da busca e proteção contra respostas obsoletas.
- **Critérios de aceite:**
  - Para entrada `required`, `invalid` ou `too-long`, status permanece fora de `loading` e `searchCities` não é chamado.
  - Busca pendente define `loading`; lista vazia define `empty`; lista não vazia define `success`; falha define `error` e a categoria correspondente.
  - Nenhum resultado altera `selectedCity` antes de ação explícita de seleção.
  - Em duas buscas resolvidas fora de ordem, somente a resposta da busca mais recente atualiza `searchResults`.
  - Após erro, nova chamada ocorre somente após nova ação explícita; não há chamada automática.
- **Dependências:** T-02, T-03, T-08
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Requisitos:** FR-01, FR-02, FR-07; CA-01, CA-02, CA-07

### T-12 — Coordenar consulta, atualização e snapshot
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Implementar seleção explícita, consulta meteorológica, atualização manual e retenção de dados anteriores no hook.
- **Critérios de aceite:**
  - Selecionar uma localidade chama `getWeather` uma vez com aquela cidade; acionar atualizar chama novamente para a cidade selecionada.
  - Sem seleção/ação explícita, avançar o tempo não inicia requests; não há polling nem retry automático.
  - Se existir snapshot e a atualização falhar, snapshot, cidade e `fetchedAt` permanecem inalterados e o erro fica disponível no estado.
  - Resposta de consulta substituída não altera o estado mais recente; estado inicial após montagem/reload não lê cache nem armazenamento persistente.
- **Dependências:** T-01, T-07, T-10, T-11
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Requisitos:** FR-02, FR-03, FR-07; CA-02, CA-03, CA-07; RNF-06, RNF-07

### T-13 — Coordenar unidade na sessão
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Manter unidade ativa em memória sem mutar o snapshot ou disparar novas consultas.
- **Critérios de aceite:**
  - Estado inicial de unidade é `celsius`.
  - Chamar a ação de alternância altera a unidade sem invocar `searchCities` ou `getWeather`.
  - Conteúdo do snapshot permanece idêntico antes/depois da alternância.
  - Após inicialização nova, a unidade volta a `celsius`; não é lida de storage/cookie.
- **Dependências:** T-04, T-11, T-12
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Requisitos:** FR-05, FR-06; CA-05, CA-06

## Entrega 5 — Componentes de UI

### T-14 — Criar campo de busca acessível
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Implementar entrada e envio explícito da consulta de cidade.
- **Critérios de aceite:**
  - Testing Library localiza o campo por label acessível e o botão por nome acessível.
  - Submeter por Enter e por botão chama a ação de busca uma vez; digitar ou focar não chama a ação.
  - Cada erro `required`, `invalid` e `too-long` aparece em pt-BR e é associado ao campo por `aria-describedby` ou mecanismo equivalente.
  - Durante `loading`, a UI expõe um status acessível e impede submissões duplicadas.
- **Dependências:** T-03, T-11
- **Arquivos prováveis:** `src/components/SearchBar.tsx`
- **Requisitos:** FR-01, FR-07; CA-01, CA-07; RNF-03, RNF-09

### T-15 — Apresentar opções de localidade
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Exibir resultados selecionáveis com qualificadores geográficos para distinguir homônimos.
- **Critérios de aceite:**
  - Cada resultado é renderizado com botão/opção nomeado por cidade e qualificadores, ativável por Enter e Espaço.
  - Todos os qualificadores não vazios recebidos (`country`, `admin1`) aparecem junto ao nome.
  - Renderizar resultados não chama `getWeather` nem seleciona `selectedCity`.
  - Quando dois ou mais resultados têm o mesmo nome e os mesmos qualificadores exibidos, a UI pede refinamento e nenhuma opção ambígua chama `getWeather`.
- **Dependências:** T-11
- **Arquivos prováveis:** `src/components/CityResults.tsx`
- **Requisitos:** FR-02; CA-02; RNF-02, RNF-03

### T-16 — Apresentar vazio e erros de busca
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Exibir cidade inexistente e falhas de geocodificação com retry manual.
- **Critérios de aceite:**
  - `empty` renderiza o texto “Cidade inexistente” e não renderiza mensagem de falha de rede.
  - `network`, `provider` e `timeout` renderizam mensagens distintas em pt-BR e um controle de retry.
  - O controle não chama nova busca ao ser renderizado; um clique/ativação por teclado chama uma única nova busca.
  - Mensagens de erro são expostas por região de alerta/status acessível e não usam semântica de sucesso.
- **Dependências:** T-11
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`, `src/components/states/ErrorState.tsx`
- **Requisitos:** FR-07; CA-01, CA-07; RNF-03, RNF-09

### T-17 — Apresentar carregamento e falhas meteorológicas
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Exibir carregamento, indisponibilidade, falha e ação manual de atualização.
- **Critérios de aceite:**
  - `loading` apresenta status acessível em pt-BR; `error` apresenta mensagem diferente de sucesso.
  - `network`, `provider`, `timeout` e `unavailable` produzem mensagens distintas.
  - Renderizar o controle de atualização não chama `getWeather`; ativá-lo chama uma vez.
  - Com snapshot anterior e falha, o nome da cidade e `fetchedAt` visíveis são os do snapshot e a UI o identifica como anterior.
- **Dependências:** T-12
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`, `src/components/states/ErrorState.tsx`
- **Requisitos:** FR-07; CA-07; RNF-03, RNF-06, RNF-09

### T-18 — Exibir condições atuais
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Apresentar as métricas atuais e diárias da cidade selecionada usando o modelo interno.
- **Critérios de aceite:**
  - Para snapshot completo, o painel contém cidade, temperatura, condição, mín./máx. diárias, precipitação, velocidade e direção do vento.
  - Para cada campo `null`, nenhum valor numérico ou rótulo de condição é renderizado; campos não nulos permanecem visíveis.
  - Mín./máx. e probabilidade são identificadas como métricas do dia, não como medições instantâneas.
  - Hora/data é formatada em `pt-BR`, usa o timezone da cidade e exibe abreviação ou deslocamento UTC.
  - Snapshot cuja idade de `sourceValidAt` excede 24 horas exibe indicação textual de desatualização; com idade de até 24 horas, não exibe essa indicação.
- **Dependências:** T-04, T-05, T-07, T-12
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Requisitos:** FR-03, FR-06, FR-07; CA-03, CA-06, CA-07; RNF-06, RNF-09, RNF-10

### T-19 — Exibir cartão de previsão diária
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Apresentar em um cartão a data local e os campos de um dia de previsão.
- **Critérios de aceite:**
  - Um cartão apresenta a data e cada campo não nulo do respectivo `ForecastDay`; `null` não é substituído ou estimado.
  - Com unidade Celsius, cada temperatura exibe °C; com Fahrenheit, exibe °F e valor convertido por T-04.
  - Condição usa descrição pt-BR; precipitação usa `%`; vento usa `km/h` e um dos 16 setores cardeais.
- **Dependências:** T-04, T-05, T-06, T-13
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`
- **Requisitos:** FR-04, FR-06; CA-04, CA-06; RNF-09, RNF-10

### T-20 — Exibir lista de cinco dias
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Renderizar os cinco cartões de previsão diária na ordem das datas locais.
- **Critérios de aceite:**
  - Para qualquer snapshot recebido com cinco dias, a lista renderiza exatamente cinco cartões na mesma ordem e com as mesmas datas.
  - A lista não cria cartão de previsão horária, mapa ou alerta.
- **Dependências:** T-06, T-19
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Requisitos:** FR-04; CA-04

### T-21 — Criar controle acessível de unidade
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Permitir alternar entre Celsius e Fahrenheit.
- **Critérios de aceite:**
  - Controle acessível expõe as opções Celsius/Fahrenheit e o estado ativo inicial é Celsius.
  - Selecionar Fahrenheit/Celsius atualiza todas as temperaturas não nulas atuais e diárias e seus sufixos; o mock de `getWeather` mantém o mesmo número de chamadas.
  - Temperaturas nulas permanecem sem valor após alternância.
  - Reinicializar o estado da aplicação seleciona Celsius.
- **Dependências:** T-04, T-13, T-18, T-19
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Requisitos:** FR-05, FR-06; CA-05, CA-06; RNF-03

## Entrega 6 — Integração da aplicação

### T-22 — Compor a tela principal
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Conectar componentes de busca, estados e clima à coordenação do hook.
- **Critérios de aceite:**
  - Um teste de integração submete uma busca, seleciona um resultado e observa exatamente uma consulta para a cidade escolhida.
  - Busca `loading/error/empty` e clima `loading/error` são renderizados por seus status independentes.
  - Testes de tela verificam unidade ativa igual à do hook, botão de atualização chamando a ação do hook uma vez, e snapshot anterior exibindo cidade/horário guardados nele.
  - Montagem da tela permite buscar sem login e não lê/grava `localStorage` ou cookies.
- **Dependências:** T-14, T-15, T-16, T-17, T-18, T-19, T-20, T-21
- **Arquivos prováveis:** `src/App.tsx`
- **Requisitos:** FR-01 a FR-07; CA-01 a CA-07

### T-23 — Ajustar responsividade e hierarquia visual
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Adaptar a tela composta a viewports mobile, tablet e desktop.
- **Critérios de aceite:**
  - Nos viewports de 320, 768, 1280 e 1920 CSS px, `scrollWidth <= clientWidth` e busca/resultados/condições/previsão não se sobrepõem.
  - Nos quatro viewports, cada input e botão funcional está dentro do viewport e pode receber foco/ativação; o teste valida as caixas de busca, resultados, condições e previsão sem interseção entre seções adjacentes.
  - Alterações usam as convenções Tailwind existentes sem introduzir dependência de estilo adicional.
- **Dependências:** T-22
- **Arquivos prováveis:** `src/App.tsx`, `src/styles/index.css`
- **Requisitos:** RNF-01, RNF-02

### T-24 — Exibir atribuição do provedor
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Adicionar atribuição visível e link do Open-Meteo de acordo com os termos vigentes.
- **Critérios de aceite:**
  - A UI renderiza o texto “Dados meteorológicos: Open-Meteo” junto aos dados e inclui link navegável para Open-Meteo.
  - O link tem nome acessível e destino HTTPS.
  - Checklist de pré-lançamento registra a verificação de formato, visibilidade e destino contra termos vigentes; restrição impeditiva bloqueia lançamento.
- **Dependências:** T-22
- **Arquivos prováveis:** `src/App.tsx`
- **Requisitos:** RNF-08

## Entrega 7 — Testes de domínio e services

### T-25 — Testar normalização e validação da busca
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Cobrir normalização Unicode, espaços, grafemas e limites permitidos.
- **Critérios de aceite:**
  - Suíte executável `pnpm test` inclui casos de NFC composto/decomposto, trim, espaços internos repetidos e letras acentuadas.
  - Casos de 199 e 200 grafemas passam; 201 falha com `too-long`.
  - Casos vazio/só espaços retornam `required`; hífen, apóstrofo, dígito e pontuação retornam `invalid`.
- **Dependências:** T-03
- **Arquivos prováveis:** `tests/unit/search.test.ts`
- **Requisitos:** CA-01, CA-07

### T-26 — Testar conversão de temperatura
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Verificar conversão, ordem de arredondamento, empates e valores ausentes.
- **Critérios de aceite:**
  - Testes verificam `0 °C ↔ 32 °F`, `-40 °C ↔ -40 °F`, `20 °C → 68 °F` e `-10 °C → 14 °F`.
  - Casos de empate de cada sinal verificam arredondamento para longe de zero.
  - A chamada com `null` retorna `null` em ambas as unidades.
- **Dependências:** T-04
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Requisitos:** CA-05, CA-06

### T-27 — Testar funções meteorológicas e temporais
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Cobrir códigos, setores de vento, datas locais, fuso e desatualização.
- **Critérios de aceite:**
  - Há pelo menos um caso de teste para cada código listado na tabela WMO implementada e para código desconhecido.
  - Testes cobrem todos os 16 setores, seus limites de 22,5°, 0° e 360°.
  - Com instante fixo `2026-03-08T12:00:00Z` e timezone `America/Los_Angeles`, teste espera `2026-03-08` até `2026-03-12`, independentemente do timezone do processo.
  - Teste de formatação valida locale `pt-BR` e sufixo/abreviação de fuso; teste de idade verifica exatamente 24 h e mais de 24 h usando relógio fixo.
- **Dependências:** T-05, T-06, T-07
- **Arquivos prováveis:** `tests/unit/weather.test.ts`
- **Requisitos:** CA-03, CA-04, CA-07; RNF-06, RNF-09, RNF-10

### T-28 — Testar service de geocodificação com mock de fetch
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Verificar parâmetros, mapeamento e falhas da operação de busca de localidades.
- **Critérios de aceite:**
  - Cada teste substitui `globalThis.fetch` por mock e verifica que nenhuma chamada real alcança hosts Open-Meteo.
  - Asserções verificam hostname HTTPS e valores de `name`, `count`, `language` e `format`.
  - Casos separados validam mapeamento com/sem qualificadores, lista vazia, HTTP não-2xx, erro de provedor, JSON inválido, rejeição de rede e cancelamento.
  - Com fake timers, avançar 10 segundos sem resposta produz erro `timeout` e encerra o estado pendente.
- **Dependências:** T-08
- **Arquivos prováveis:** `tests/services/geocoding.test.ts`
- **Requisitos:** CA-01, CA-02, CA-07; RNF-08

### T-29 — Testar service de previsão com mock de fetch
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Verificar parâmetros de forecast, mapeamento por data e tratamento de respostas parciais.
- **Critérios de aceite:**
  - Cada teste substitui `globalThis.fetch` por mock e verifica que nenhuma chamada real alcança hosts Open-Meteo.
  - Asserções verificam coordenadas, campos solicitados, Celsius, km/h, `timezone=auto` e `forecast_days=5`.
  - Fixtures cobrem arrays paralelos válidos, série curta, data sem correspondência e `daily` ausente/vazio.
  - Asserções verificam `null` opcional, `unavailable` sem temperatura/código e `null` para par min/max inconsistente.
  - Comparação profunda do snapshot de fixture determinística confirma exatamente cinco datas, cidade selecionada, `fetchedAt` e `sourceValidAt` definidos pela fixture.
  - Com fake timers, avançar 10 segundos sem resposta produz erro `timeout`; sinal de cancelamento é observado no mock de `fetch`.
- **Dependências:** T-09, T-10
- **Arquivos prováveis:** `tests/services/forecast.test.ts`, fixtures de resposta Open-Meteo
- **Requisitos:** CA-03, CA-04, CA-07; RNF-06, RNF-08, RNF-10

## Entrega 8 — Testes de hook e componentes

### T-30 — Testar fluxo e concorrência de busca no hook
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Validar estados da geocodificação, validação prévia e descarte de resposta obsoleta.
- **Critérios de aceite:**
  - Cada classe de entrada inválida não chama o método de serviço e não define status `loading`.
  - Testes observam `idle → loading → success`, `loading → empty` e `loading → error` com os erros correspondentes.
  - Em estado inicial sem localidade selecionada, uma busca bem-sucedida mantém `selectedCity === null` até ação explícita de seleção.
  - Teste com promises resolvidas em ordem inversa mantém resultados da segunda busca.
- **Dependências:** T-11, T-28
- **Arquivos prováveis:** `tests/hooks/useWeather.search.test.ts`
- **Requisitos:** CA-01, CA-02, CA-07

### T-31 — Testar consulta, unidade e retenção no hook
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Validar seleção, atualização manual, falhas e preservação do snapshot.
- **Critérios de aceite:**
  - `getWeather` é chamado uma vez por seleção e uma vez por atualização manual; renderização sem ação não chama novamente.
  - Em falha após snapshot prévio, comparação profunda confirma snapshot, cidade e `fetchedAt` inalterados e `weatherError` definido.
  - Alternar unidade não aumenta a contagem de chamadas de serviço e mantém snapshot idêntico.
  - Testes parametrizados confirmam erros distintos `timeout`, `network`, `provider` e `unavailable`.
  - Teste de duas consultas resolvidas fora de ordem mantém o resultado da operação mais recente.
- **Dependências:** T-12, T-13, T-29
- **Arquivos prováveis:** `tests/hooks/useWeather.weather.test.ts`
- **Requisitos:** CA-02, CA-03, CA-05, CA-06, CA-07; RNF-06, RNF-07

### T-32 — Testar componentes nos estados de busca
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Verificar interação, acessibilidade, resultados, vazio e erro de busca.
- **Critérios de aceite:**
  - Testes por role/name localizam campo, botão e mensagens associadas; erro tem `aria-describedby` ou associação semântica equivalente.
  - Enter submete busca e Enter/Espaço ativam opção de resultado sem mouse.
  - Renderização de resultados não chama seleção; fixture com qualificadores distintos apresenta todos e fixture com qualificadores idênticos exibe solicitação de refinamento.
  - `loading` apresenta indicador acessível e desativa submissões duplicadas; `empty` mostra “Cidade inexistente” sem mensagem de falha.
  - `error` cobre `network`, `provider` e `timeout` com mensagens distintas; retry só chama o serviço após ativação.
  - Os cenários `loading`, `empty` e `error` são renderizados por testes de componente, incluindo `EmptyState` e `ErrorState`.
- **Dependências:** T-14, T-15, T-16
- **Arquivos prováveis:** `tests/components/SearchBar.test.tsx`, `tests/components/CityResults.test.tsx`, `tests/components/states.test.tsx`
- **Requisitos:** CA-01, CA-02, CA-07; RNF-02, RNF-03, RNF-09

### T-33 — Testar componentes meteorológicos e estados
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Verificar dados apresentados, campos ausentes, falhas e atualização anterior.
- **Critérios de aceite:**
  - Fixtures verificam presença de cada campo não nulo no painel atual e nos cinco cartões.
  - Fixture com campo `null` verifica ausência de valor preenchido ou inferido nesse campo e preservação dos demais.
  - Casos verificam que sem snapshot CurrentWeather/ForecastList não exibem métricas; para snapshot válido, erro (`network`, `provider`, `timeout`) e `unavailable` não são apresentados como sucesso.
  - Snapshot anterior permanece associado à cidade e ao horário do próprio snapshot; idade superior a 24 h exibe indicação desatualizada.
  - Casos verificam descrição WMO, setor do vento, data local e indicação do timezone visíveis.
- **Dependências:** T-17, T-18, T-19, T-20
- **Arquivos prováveis:** `tests/components/CurrentWeather.test.tsx`, `tests/components/ForecastList.test.tsx`
- **Requisitos:** CA-03, CA-04, CA-07; RNF-03, RNF-06, RNF-09, RNF-10

### T-34 — Testar alternância de unidade na interface
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Verificar o controle e a conversão de todas as temperaturas visíveis.
- **Critérios de aceite:**
  - Teste localiza controle pelo role/nome acessível e confirma Celsius selecionado na montagem.
  - Com fixture não nula, alternar verifica atual, média diária, mínima e máxima em °F e retorno a °C.
  - Contagem de chamadas ao mock de serviço não muda após alternância; campos `null` continuam sem valor.
- **Dependências:** T-21
- **Arquivos prováveis:** `tests/components/UnitToggle.test.tsx`
- **Requisitos:** CA-05, CA-06; RNF-03

## Entrega 9 — Testes de integração e E2E

### T-35 — Testar fluxos funcionais ponta a ponta
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Cobrir os fluxos de busca, seleção, consulta, erro, atualização e unidade com APIs interceptadas.
- **Critérios de aceite:**
  - E2E interceptado verifica busca inválida sem request, zero resultados, homônimos sem auto-seleção e seleção explícita antes do forecast.
  - E2E verifica renderização dos cinco dias, troca de unidade sem request extra e falha de atualização com snapshot/cidade/horário anteriores visíveis.
  - E2E usa relógio/timeout controlado para verificar erro de timeout sem retry automático, retry após ativação e snapshot com idade >24 h marcado como desatualizado.
  - O fluxo principal completo (buscar cidade, selecionar resultado e ver condições/previsão) também é executado em viewport mobile de 320 CSS px, incluindo verificação de `scrollWidth <= clientWidth`.
  - Playwright falha se uma chamada não interceptada alcançar qualquer endpoint Open-Meteo.
- **Dependências:** T-22, T-23, T-24, T-28, T-29, T-30, T-31, T-32, T-33, T-34
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`
- **Requisitos:** CA-01 a CA-07; RNF-02, RNF-06

### T-36 — Validar responsividade e acessibilidade automatizada
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** G
- **Descrição:** Automatizar verificação de viewports, ausência de rolagem horizontal e violações críticas/serious.
- **Critérios de aceite:**
  - Testes Playwright executam fluxo essencial nos viewports de 320, 768, 1280 e 1920 CSS px.
  - Em cada viewport, `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
  - axe-core roda nos estados inicial, resultados, loading, erro e sucesso; não há violações `critical` ou `serious`.
- **Dependências:** T-23, T-35
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, configuração Playwright existente
- **Requisitos:** RNF-01, RNF-03

## Entrega 10 — Hardening e pré-lançamento

### T-37 — Confirmar gate de aprovação para telemetria
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Verificar se há serviço operacional/RUM aprovado e manter telemetria cliente desativada enquanto não houver aprovação.
- **Critérios de aceite:**
  - Registro de decisão identifica o serviço, aprovação organizacional (aprovado/rejeitado/pendente), campos e retenção antes de habilitar integração.
  - Sem aprovação explícita registrada, build/configuração mantém telemetria desativada e testes confirmam zero requests ao endpoint de telemetria.
  - O checklist/registro do release contém a decisão datada e a referência da aprovação ou registra explicitamente `pendente`/`rejeitado`.
- **Dependências:** Nenhuma
- **Arquivos prováveis:** documentação operacional existente; configuração de implantação se aplicável
- **Requisitos:** RNF-04, RNF-05, RNF-07

### T-38 — Integrar telemetria aprovada com minimização de dados
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** G
- **Descrição:** Instrumentar métricas operacionais apenas após aprovação formal do serviço.
- **Critérios de aceite:**
  - Sem aprovação explícita em T-37, nenhuma inicialização nem request do SDK é habilitada.
  - Com aprovação, payload de teste contém somente duração da navegação/busca, status/categoria da operação, timeout/erro e agregados de browser/SO permitidos.
  - Testes de payload confirmam ausência de texto de busca, coordenadas, localização precisa e identificadores de cidade.
  - Configuração do serviço define retenção de no máximo 30 dias e mecanismo de expurgo ao fim do prazo.
- **Dependências:** T-37
- **Arquivos prováveis:** integração aprovada e configuração de implantação; `src/hooks/useWeather.ts` somente se requerido
- **Requisitos:** RNF-04, RNF-05, RNF-07

### T-39 — Executar validações técnicas do projeto
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Garantir que os comandos de lint, build e testes existentes possam validar a entrega.
- **Critérios de aceite:**
  - `pnpm lint`, `pnpm build` e `pnpm test` terminam com exit code 0.
  - O build executa verificação TypeScript strict sem erros.
  - `pnpm exec playwright test` termina com exit code 0; Vitest e Playwright falham se houver request real a host Open-Meteo.
  - Configuração alterada é limitada aos scripts necessários para executar esses comandos e as verificações de T-35/T-36.
- **Dependências:** T-24, T-25, T-26, T-27, T-28, T-29, T-30, T-31, T-32, T-33, T-34, T-35, T-36, T-37, T-38
- **Arquivos prováveis:** `package.json`; configurações existentes somente se os comandos não estiverem conectados
- **Requisitos:** RNF-01 a RNF-04

### T-40 — Concluir verificações de pré-lançamento
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Verificar conformidade do provedor, telemetria, compatibilidade, performance e disponibilidade antes do lançamento.
- **Critérios de aceite:**
  - Checklist registra confirmação vigente dos termos/atribuição Open-Meteo; restrição impeditiva dos fluxos CA-01 a CA-04 bloqueia a aprovação de release.
  - Telemetria sem aprovação explícita fica desligada; se aprovada, payload exclui busca/localização precisa e retenção é ≤30 dias com expurgo configurado.
  - Validação controlada executa ao menos 100 medições por fluxo no perfil RNF-04 e calcula P95 por nearest-rank; metas são ≤2 s para busca e ≤2,5 s para shell utilizável.
  - Plano de sondas verifica shell a cada minuto em três regiões, calcula disponibilidade mensal alvo ≥99,5% e relata separadamente sucesso/disponibilidade do provedor.
  - Matriz de compatibilidade registra Firefox, Edge e Chrome nas versões estável atual/anterior, em Windows/macOS/Linux e viewports 320/768/1280/1920 CSS px.
- **Dependências:** T-24, T-37, T-38, T-39
- **Arquivos prováveis:** documentação e configuração operacional de implantação existentes
- **Requisitos:** RNF-01, RNF-04, RNF-05, RNF-07, RNF-08
