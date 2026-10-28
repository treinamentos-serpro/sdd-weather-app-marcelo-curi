# Especificação de Produto — Weather App

## Revisão P8 — contratos aprovados de testes

Esta revisão prevalece sobre os critérios anteriores conflitantes:

- Busca vazia ou somente com espaços não dispara `onSearch` nem `fetch`; o campo continua informando que o nome é obrigatório.
- Zero resultados, inclusive resposta `{}`, apresenta “Nenhuma cidade encontrada”.
- A região de previsão se chama “Previsão de 5 dias”; os dois primeiros cartões usam “Hoje” e “Amanhã”, os demais o dia da semana, todos com data curta em pt-BR.
- Precipitação explicitamente `null` é normalizada para `0`; campos ausentes continuam `null`.
- Respostas sem o objeto `current` ou `daily` (inclusive `null`) lançam `WeatherServiceError`. Séries diárias curtas ou campos opcionais ausentes continuam preservando os cinco dias e os valores disponíveis.
- Conversão cobre `0°C → 32°F`, `100°C → 212°F`, `-40°C → -40°F`, ambas as direções e arredondamento com símbolo. A seleção explícita da cidade permanece obrigatória.
- O fluxo E2E usa rede interceptada, relógio fixo e queries acessíveis, incluindo viewport 375×812, falha de API e resposta parcial.

## Overview

O Weather App é uma aplicação web responsiva que permite pesquisar uma cidade e consultar suas condições meteorológicas atuais e uma previsão diária para cinco dias. A experiência inicial será em português do Brasil (pt-BR), com temperaturas em Celsius por padrão e opção de alternar para Fahrenheit.

O produto atende principalmente a consultas rápidas em dispositivos móveis e ao planejamento de atividades nos dias seguintes. As personas descritas na discovery — Camila, Rafael e Morgan — são hipóteses para orientar o produto, não perfis validados por pesquisa com usuários.

Esta especificação define o escopo funcional aprovado e registra critérios verificáveis. A aprovação para produção ainda depende das verificações pré-lançamento de conformidade com os termos/atribuição do provedor e das políticas organizacionais de privacidade e telemetria descritas nos requisitos não funcionais.

**Decisões registradas na discovery:**

- Open-Meteo está aprovado como fonte de geocodificação e dados meteorológicos para todos os países, sem API key. O lançamento deve observar os termos e requisitos de atribuição do provedor.
- “Cinco dias” significa hoje e os quatro dias seguintes, em granularidade diária.
- Celsius é a unidade inicial; Fahrenheit também será oferecido.
- O idioma da interface será pt-BR.
- Não haverá autenticação nem persistência de dados no servidor no escopo inicial.

## Functional Requirements

- **FR-01 — Pesquisar cidades:** permitir consulta pelo nome de uma cidade em qualquer país. Normalizar a entrada em Unicode NFC, remover espaços do início e do fim e reduzir sequências de espaços internos a um espaço antes da validação e da busca. Aceitar até 200 caracteres percebidos (clusters de grafemas Unicode) compostos de letras e espaços; rejeitar entrada vazia e caracteres que não sejam letras ou espaços. Hífen e apóstrofo não são aceitos. A fonte de geocodificação é Open-Meteo.
- **FR-02 — Identificar a localidade:** apresentar o nome da cidade selecionada junto aos dados meteorológicos. Para resultados homônimos, apresentar os qualificadores geográficos disponíveis e exigir seleção explícita; nunca selecionar silenciosamente o primeiro resultado. Se os qualificadores não forem suficientes para distinguir resultados, solicitar que a pessoa refine o texto da busca.
- **FR-03 — Consultar condições atuais:** após selecionar uma cidade, apresentar temperatura atual, descrição da condição, temperaturas mínima e máxima do dia, probabilidade de chuva e velocidade e direção do vento. Interpretar a referência temporal no fuso da cidade selecionada.
- **FR-04 — Consultar previsão diária:** apresentar a previsão da cidade selecionada para cinco dias consecutivos: hoje e os quatro dias seguintes, determinados pelo fuso da cidade selecionada. Cada dia deve identificar sua data e exibir temperatura diária, temperaturas mínima e máxima, descrição da condição, probabilidade de chuva e velocidade e direção do vento. Campos ausentes permanecem em branco.
- **FR-05 — Escolher unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit; usar Celsius no início de cada sessão. A escolha permanece somente durante a sessão atual.
- **FR-06 — Aplicar unidade escolhida:** aplicar a unidade selecionada a todas as temperaturas apresentadas, incluindo temperatura atual e valores da previsão (temperatura, mínima e máxima).
- **FR-07 — Comunicar estados da consulta:** informar carregamento, cidade inexistente e falha ao obter ou atualizar dados. Uma nova consulta ocorre somente quando a pessoa envia uma nova busca ou solicita explicitamente a atualização da cidade selecionada. Após falha, apresentar mensagem amigável e disponibilizar nova tentativa manual. Se existirem dados anteriores na sessão, mantê-los visíveis e identificá-los como anteriores; dados cuja observação/validade tenha mais de 24 horas devem ser identificados como desatualizados. Nunca apresentar uma consulta malsucedida como atualizada com sucesso.

## User Stories

- **US-01 — Pesquisar uma cidade:** Como Camila, profissional em deslocamento, quero pesquisar e selecionar uma cidade para consultar o clima do lugar onde estou ou para onde vou. **Requisito funcional:** FR-01.
- **US-02 — Confirmar a localidade:** Como Morgan, viajante internacional, quero distinguir cidades com o mesmo nome para consultar a previsão do destino correto. **Requisito funcional:** FR-02.
- **US-03 — Consultar as condições atuais:** Como Camila, profissional em deslocamento, quero ver as condições atuais da cidade selecionada para decidir como me vestir e ajustar meus planos do dia. **Requisito funcional:** FR-03.
- **US-04 — Planejar os próximos dias:** Como Rafael, pessoa que planeja atividades ao ar livre, quero consultar a previsão diária de hoje e dos quatro dias seguintes para escolher quando realizar uma atividade externa. **Requisito funcional:** FR-04.
- **US-05 — Escolher uma unidade familiar:** Como Morgan, viajante internacional, quero alternar entre Celsius e Fahrenheit para escolher a unidade de temperatura que prefiro. **Requisito funcional:** FR-05.
- **US-06 — Interpretar temperaturas na unidade escolhida:** Como Morgan, viajante internacional, quero ver todas as temperaturas na unidade selecionada para compreender os dados sem fazer conversões por conta própria. **Requisito funcional:** FR-06.
- **US-07 — Entender falhas de consulta:** Como Camila, profissional em deslocamento, quero ser informada quando não for possível encontrar a cidade ou obter os dados meteorológicos para saber que a consulta não foi concluída. **Requisito funcional:** FR-07.

## Traceability Matrix

| User Story | Requisito(s) funcional(is) | Critérios de aceite | Requisitos não funcionais relevantes |
|---|---|---|---|
| US-01 — Pesquisar uma cidade | FR-01 | CA-01, CA-07 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-07, RNF-08, RNF-09 |
| US-02 — Confirmar a localidade | FR-02 | CA-02, CA-07 | RNF-01, RNF-02, RNF-03, RNF-08, RNF-09 |
| US-03 — Consultar as condições atuais | FR-03, FR-06, FR-07 | CA-03, CA-06, CA-07 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-06, RNF-08, RNF-09, RNF-10 |
| US-04 — Planejar os próximos dias | FR-04, FR-06, FR-07 | CA-04, CA-06, CA-07 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-06, RNF-08, RNF-09, RNF-10 |
| US-05 — Escolher uma unidade familiar | FR-05 | CA-05 | RNF-01, RNF-02, RNF-03, RNF-07, RNF-09 |
| US-06 — Interpretar temperaturas na unidade escolhida | FR-06 | CA-06 | RNF-01, RNF-02, RNF-03, RNF-09 |
| US-07 — Entender falhas de consulta | FR-07 | CA-01, CA-03, CA-04, CA-07 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-06, RNF-07, RNF-08, RNF-09 |

## Acceptance Criteria

- **CA-01 — Pesquisar cidades** (FR-01; US-01)
  - **Given** uma entrada com formas Unicode equivalentes, espaços no início/fim ou sequências de espaços internos, **When** a pessoa envia a busca, **Then** a entrada é normalizada em NFC, os espaços externos são removidos e cada sequência interna é reduzida a um espaço antes de validar e consultar.
  - **Given** uma entrada normalizada com 1 a 200 caracteres percebidos permitidos, inclusive exatamente 200, **When** a pessoa envia a busca e a geocodificação retorna resultados, **Then** cada resultado é apresentado como opção selecionável e nenhuma cidade é selecionada automaticamente.
  - **Given** uma cidade que pode ser encontrada, **When** a pessoa pesquisa seu nome usando letras maiúsculas, minúsculas ou acentuadas, **Then** a entrada é aceita e os resultados correspondentes são apresentados.
  - **Given** um campo vazio ou contendo somente espaços, **When** a pessoa envia a busca, **Then** nenhuma solicitação de geocodificação é iniciada e a interface informa que o nome da cidade é obrigatório.
  - **Given** uma entrada normalizada com mais de 200 caracteres percebidos ou contendo caractere diferente de letra permitida ou espaço, incluindo hífen ou apóstrofo, **When** a pessoa envia a busca, **Then** nenhuma solicitação de geocodificação é iniciada e a interface identifica a entrada como inválida.
  - **Given** uma consulta válida cuja geocodificação retorna uma lista vazia, **When** a resposta é apresentada, **Then** a interface informa “Cidade inexistente” e não exibe dados meteorológicos de outra localidade.
  - **Given** resultados apresentados, **When** a pessoa seleciona uma opção, **Then** a cidade selecionada passa a ser a localidade associada às próximas consultas meteorológicas.

- **CA-02 — Identificar a localidade** (FR-02; US-02)
  - **Given** uma cidade selecionada e dados meteorológicos visíveis, **When** a interface os apresenta, **Then** o nome da cidade selecionada está visível junto às condições atuais e à previsão.
  - **Given** resultados homônimos com qualificadores geográficos diferentes, **When** as opções são apresentadas, **Then** cada opção exibe os qualificadores disponíveis que permitem distingui-la.
  - **Given** resultados homônimos, **When** a pessoa ainda não selecionou uma opção, **Then** nenhum resultado é usado para consultar ou apresentar dados meteorológicos.
  - **Given** resultados homônimos sem qualificadores suficientes para distingui-los, **When** a interface os apresenta, **Then** solicita que a pessoa refine o texto da busca e não inicia uma consulta meteorológica.
  - **Given** uma cidade homônima selecionada, **When** a resposta meteorológica é apresentada, **Then** o nome da cidade visível e os dados exibidos correspondem à opção selecionada.

- **CA-03 — Consultar condições atuais** (FR-03; US-03)
  - **Given** uma cidade selecionada e uma resposta completa, **When** a consulta termina, **Then** a interface apresenta temperatura atual, temperaturas mínima e máxima do dia, descrição da condição, probabilidade de chuva (%), velocidade do vento (km/h) e direção do vento (16 pontos cardeais em português), além da unidade de temperatura e identificação da cidade.
  - **Given** uma ou mais medidas ausentes na resposta atual, **When** o resultado é apresentado, **Then** os campos ausentes ficam em branco e os demais valores válidos permanecem visíveis.
  - **Given** um resultado meteorológico exibido, **When** a interface o apresenta, **Then** também mostra quando os dados foram obtidos com sucesso, em data e hora local da cidade selecionada, incluindo indicação do fuso.
  - **Given** uma cidade cujo fuso horário difere do fuso do dispositivo, **When** a interface determina a referência temporal local da consulta, **Then** usa o fuso da cidade selecionada, não o fuso do dispositivo.
  - **Given** dados meteorológicos cuja observação/validade informada pelo provedor ocorreu há mais de 24 horas, **When** a interface apresenta esses dados, **Then** identifica-os como desatualizados e mostra o horário em que foram obtidos.
  - **Given** uma resposta atual sem temperatura ou sem descrição da condição, **When** a consulta termina, **Then** a interface não inventa o dado ausente e indica que as condições atuais não puderam ser apresentadas integralmente.

- **CA-04 — Consultar previsão diária de cinco dias** (FR-04; US-04)
  - **Given** uma cidade selecionada e uma resposta de previsão, **When** os períodos diários são apresentados, **Then** as datas são hoje e os quatro dias seguintes no fuso da cidade selecionada, mesmo que o fuso do dispositivo seja diferente.
  - **Given** um período com todos os campos recebidos, **When** a previsão é apresentada, **Then** o período mostra data, temperatura diária fornecida pelo provedor, temperatura mínima e máxima com unidade, descrição da condição, probabilidade de chuva (%), velocidade do vento (km/h) e direção do vento (16 pontos cardeais em português).
  - **Given** uma resposta de direção do vento em graus como azimute meteorológico (0° = norte, aumentando no sentido horário), **When** a direção é apresentada, **Then** ela é mapeada para o ponto cardeal mais próximo entre os 16 disponíveis (um setor a cada 22,5°), com 0° e 360° apresentados como norte.
  - **Given** um campo ausente em um período da previsão, **When** esse período é apresentado, **Then** os campos disponíveis permanecem visíveis e o campo correspondente ao valor ausente fica em branco, sem valor inferido ou substituído.
  - **Given** uma resposta sem dados para um ou mais dos cinco períodos, **When** a previsão é apresentada, **Then** as cinco datas continuam visíveis e os campos de dados dos períodos sem resposta ficam em branco.
  - **Given** valores mínimo e máximo disponíveis para um dia, **When** a previsão é apresentada, **Then** o valor mínimo não excede o máximo; se a resposta violar essa relação, o par é tratado como inválido e não é apresentado como válido.
  - **Given** dados meteorológicos anteriores com mais de 24 horas mantidos após uma falha, **When** a interface os exibe, **Then** identifica os dados como desatualizados e apresenta seu horário de atualização.

- **CA-05 — Escolher unidade de temperatura** (FR-05; US-05)
  - **Given** a aplicação aberta antes de qualquer escolha de unidade, **When** as temperaturas são apresentadas, **Then** Celsius está selecionado e indicado como unidade ativa.
  - **Given** a interface de escolha de unidade, **When** a pessoa seleciona Celsius ou Fahrenheit, **Then** a unidade escolhida fica indicada como ativa sem exigir nova busca de cidade.
  - **Given** Fahrenheit selecionado durante uma sessão, **When** a aplicação é recarregada ou uma nova sessão é iniciada, **Then** a preferência anterior não é restaurada e Celsius volta a ser a unidade ativa.

- **CA-06 — Aplicar a unidade escolhida** (FR-06; US-06)
  - **Given** temperaturas atuais e previstas visíveis e Celsius ativo, **When** a pessoa seleciona Fahrenheit, **Then** todas as temperaturas presentes — atual, diária, mínima e máxima — são convertidas e exibidas com °F; ao selecionar Celsius, todas são exibidas com °C.
  - **Given** um valor de origem de 0 °C, **When** Fahrenheit é selecionado, **Then** o valor convertido é 32 °F; **Given** um valor de origem de 32 °F, **When** Celsius é selecionado, **Then** o valor convertido é 0 °C.
  - **Given** um valor de origem de -40 °C, **When** Fahrenheit é selecionado, **Then** o valor convertido é -40 °F.
  - **Given** uma temperatura em Celsius ou Fahrenheit, **When** a aplicação converte o valor para exibição, **Then** aplica a conversão antes do arredondamento e arredonda ao inteiro mais próximo, com valores exatamente no meio arredondados para longe de zero.
  - **Given** uma temperatura ausente, **When** a pessoa alterna a unidade, **Then** o campo permanece em branco e nenhuma temperatura é calculada para ele.
  - **Given** uma cidade e sua previsão visíveis, **When** a pessoa alterna a unidade, **Then** a cidade selecionada e as datas da previsão permanecem inalteradas.

- **CA-07 — Comunicar estados e falhas da consulta** (FR-07; US-07)
  - **Given** uma solicitação de busca ou dados meteorológicos iniciada, **When** a resposta ainda não foi recebida, **Then** a interface apresenta um indicador de carregamento.
  - **Given** dados meteorológicos apresentados, **When** a pessoa não solicita uma nova consulta ou atualização, **Then** a aplicação não inicia uma atualização automática.
  - **Given** uma cidade selecionada, **When** a pessoa aciona a ação explícita de atualizar, **Then** a aplicação inicia uma nova consulta para essa cidade.
  - **Given** uma operação de busca ou consulta meteorológica iniciada pela pessoa, **When** 10 segundos se passam desde o início dessa operação sem resposta final, **Then** a interface encerra o carregamento, informa timeout e permite nova tentativa manual; nenhuma tentativa automática é iniciada.
  - **Given** uma geocodificação concluída com zero resultados, **When** a interface apresenta o resultado, **Then** informa “Cidade inexistente”, sem classificar a situação como falha de API.
  - **Given** uma falha de rede ou resposta de erro do provedor, **When** a solicitação termina, **Then** a interface informa de forma compreensível que não foi possível obter ou atualizar os dados e disponibiliza nova tentativa manual.
  - **Given** uma falha durante uma nova consulta ou atualização e dados anteriores visíveis na sessão, **When** a solicitação falha, **Then** a interface mantém os dados anteriores, informa a falha e mostra o horário da última atualização; se tiverem mais de 24 horas, também os identifica como desatualizados.
  - **Given** uma solicitação encerrada por timeout ou erro, **When** a pessoa não aciona a nova tentativa, **Then** nenhuma nova solicitação é enviada automaticamente.

## Non-Functional Requirements

- **RNF-01 — Responsividade e compatibilidade:** suportar Firefox, Microsoft Edge e Google Chrome em Windows, macOS e Linux. A interface deve se adaptar a viewports a partir de 320 CSS px, sem rolagem horizontal; validar pelo menos 320, 768, 1280 e 1920 CSS px em cada navegador/SO suportado. Considerar as versões estável atual e anterior de cada navegador.
- **RNF-02 — Usabilidade:** todos os fluxos funcionais devem ser completáveis usando os controles apresentados, com erros e resultados associados à ação que os causou. A verificação cobre os cenários Given/When/Then de CA-01 a CA-07; não há métrica de usabilidade quantitativa aprovada.
- **RNF-03 — Acessibilidade:** atender WCAG 2.2 AA. Verificar automaticamente cada tela/estado principal com axe-core e complementar com testes manuais de teclado (sem mouse, foco visível e ordem coerente) e leitor de tela: NVDA com Firefox no Windows, VoiceOver com Chrome no macOS e Orca com Firefox no Linux. Nenhuma violação automatizada crítica/serious pode permanecer; os critérios AA aplicáveis devem passar revisão manual.
- **RNF-04 — Performance:** cumprir P95 de até 2 segundos desde o envio da busca até os resultados visíveis e P95 de até 2,5 segundos desde o início da navegação até a interface inicial utilizável. Medir em produção por Real User Monitoring em janela móvel de 7 dias, segmentado por navegador/SO. Complementar antes do lançamento com ao menos 100 execuções por fluxo em perfil controlado (10 Mbps de download, 5 Mbps de upload, RTT de 50 ms, dispositivo de referência com 4 núcleos lógicos e 8 GB de RAM); a busca inclui a latência do provedor. Calcular P95 pelo método nearest-rank: ordenar os tempos e selecionar a posição `ceil(0,95 × n)`.
- **RNF-05 — Disponibilidade:** disponibilidade mensal do shell da aplicação de pelo menos 99,5%, calculada como `(minutos disponíveis ÷ minutos totais do mês) × 100`, em que a página deve carregar e os controles de busca ficar interativos. Medir com sondas sintéticas a cada minuto em três regiões; um minuto é indisponível se a maioria das sondas falhar. Não excluir manutenção programada. Medir separadamente disponibilidade e taxa de sucesso do provedor meteorológico, sem atribuir falhas externas à disponibilidade do shell.
- **RNF-06 — Atualidade dos dados:** todo resultado meteorológico exibido deve incluir o horário em que foi obtido com sucesso, no fuso da cidade selecionada. Considerar idade dos dados a diferença entre o horário de observação/validade informado pelo provedor e o momento atual; dados com idade de até 24 horas podem ser apresentados como atuais. Dados com idade superior a 24 horas, novos ou mantidos na sessão após falha, devem ser identificados como desatualizados.
- **RNF-07 — Segurança e privacidade:** toda comunicação deve usar HTTPS. Não persistir buscas, localização ou preferências como dados do produto no servidor. Todos os campos de telemetria operacional são permitidos, exceto o texto bruto da busca e a localização precisa; reter por no máximo 30 dias e depois eliminar. A unidade escolhida permanece somente na sessão e volta a Celsius após recarga ou nova sessão.
- **RNF-08 — Dependência externa:** Open-Meteo está aprovado como fonte para cobertura global, geocodificação e meteorologia. Antes do lançamento, confirmar conformidade com os termos e atribuição do provedor e monitorar limites e falhas. Qualquer restrição que impeça os fluxos de CA-01 a CA-04 bloqueia o lançamento.
- **RNF-09 — Idioma:** textos funcionais, mensagens de erro, rótulos e datas da interface devem estar em pt-BR. Nomes próprios de localidades podem manter a grafia retornada pela fonte de geocodificação.
- **RNF-10 — Unidades meteorológicas:** apresentar probabilidade de chuva em porcentagem; apresentar velocidade do vento em km/h e direção por ponto cardeal em português (16 direções, por exemplo, N, NE e NNE). Interpretar direção em graus como azimute meteorológico: 0° = norte, aumentando no sentido horário; converter para o setor de 22,5° mais próximo.

## Edge Cases

- **Entrada vazia, espaços ou entrada inválida:** não enviar a consulta; manter o campo disponível para correção e identificar o motivo da rejeição.
- **Cidade inexistente:** resposta bem-sucedida do geocodificador com zero resultados gera o estado “Cidade inexistente”; não é erro do serviço e não consulta outra localidade.
- **Cidade homônima:** apresentar os qualificadores geográficos retornados e aguardar seleção explícita; não usar o primeiro resultado automaticamente.
- **Homônimos sem desambiguação:** solicitar refinamento do termo de busca e não carregar dados de qualquer resultado até que a pessoa selecione uma localidade distinguível.
- **Caractere inválido ou limite excedido:** rejeitar antes da chamada de geocodificação; a entrada válida tem no máximo 200 caracteres e não contém caracteres especiais.
- **Erro de rede/provedor:** encerrar carregamento, apresentar mensagem de falha, permitir nova tentativa manual e não iniciar retry automático. Dados anteriores, se mantidos na tela, devem ser identificados como anteriores.
- **Timeout:** aos 10 segundos contados do início da solicitação, encerrar carregamento e apresentar a ação manual de nova tentativa.
- **Resposta parcial de previsão:** manter os cinco dias e mostrar os valores disponíveis; deixar em branco somente os campos ausentes. Não calcular ou inventar valores ausentes.
- **Probabilidade de chuva ou vento ausentes:** manter os demais dados válidos; deixar em branco somente o campo ausente.
- **Resposta parcial de condições atuais:** sem temperatura ou descrição, não apresentar o bloco como completo; comunicar que as condições não puderam ser apresentadas integralmente.
- **Resposta incoerente:** não apresentar como válido um par de mínima/máxima em que a mínima seja superior à máxima; comunicar indisponibilidade desses valores.
- **Fuso horário diferente do dispositivo:** determinar a data local da cidade e os cinco períodos usando o fuso da cidade selecionada.
- **Troca de unidade durante consulta:** aplicar a unidade ativa quando os dados forem apresentados; não alterar cidade, datas ou campos que estejam ausentes.
- **Dados potencialmente desatualizados:** sempre mostrar o horário da última atualização; se a idade exceder 24 horas, identificar os dados anteriores como desatualizados e não como atuais.
- **Localidade sem dados meteorológicos:** se a cidade foi encontrada, mas o serviço não fornece previsão, tratar como indisponibilidade de dados, não como cidade inexistente.

## Assumptions

- A experiência é uma aplicação web responsiva; PWA ou aplicativos nativos não estão definidos como escopo inicial.
- A pessoa inicia a busca e seleciona uma cidade; localização automática não é necessária.
- A busca aceita nomes de cidades de qualquer país; normaliza Unicode para NFC, remove espaços externos, reduz espaços internos repetidos e mede o limite de 200 por clusters de grafemas Unicode.
- Condições atuais incluem temperatura, descrição, mínima e máxima do dia, probabilidade de chuva e velocidade/direção do vento.
- Cada período da previsão inclui temperatura diária fornecida pelo provedor, mínima e máxima, descrição, probabilidade de chuva e velocidade/direção do vento.
- Probabilidade de chuva é exibida em porcentagem; velocidade do vento em km/h e direção em uma das 16 direções cardeais em português.
- Campos ausentes na previsão são exibidos em branco, sem inferência ou substituição.
- As condições atuais são consultadas para a cidade selecionada e sua referência temporal usa o fuso dessa cidade; as datas dos cinco períodos também são determinadas nesse fuso.
- Todo resultado inclui o horário da última atualização no fuso da cidade selecionada; dados com mais de 24 horas são identificados como desatualizados.
- O timeout de uma solicitação é de 10 segundos; nova tentativa é sempre iniciada manualmente.
- A aplicação só consulta ou atualiza dados após ação explícita da pessoa. Dados anteriores permanecem na tela durante a sessão se uma nova consulta falhar; não há cache nem funcionamento offline.
- A conversão de temperatura ocorre antes do arredondamento ao inteiro mais próximo; valores no meio são arredondados para longe de zero.
- Celsius e Fahrenheit são as únicas unidades de temperatura do escopo inicial.
- A previsão é diária para hoje e os quatro dias seguintes, conforme decisão da discovery.
- Open-Meteo está aprovado para geocodificação e meteorologia com cobertura global; seus termos e atribuição devem ser observados.
- Compatibilidade: Firefox, Edge e Chrome em Windows, macOS e Linux; viewports a partir de 320 CSS px.
- Acessibilidade: conformidade WCAG 2.2 AA, com testes automatizados e manuais descritos em RNF-03.
- Performance: P95 de busca até 2 s e carregamento inicial até 2,5 s conforme o método de medição definido em RNF-04.
- Disponibilidade mensal do shell da aplicação de pelo menos 99,5%, conforme RNF-05.
- Telemetria operacional sem texto bruto de busca nem localização precisa; retenção máxima de 30 dias.
- As personas são hipóteses. As necessidades e métricas devem ser validadas com usuários reais.
- Não há contas nem persistência de dados no servidor; a preferência de unidade existe somente durante a sessão.

## Risks

| Risco | Impacto | Mitigação |
|---|---|---|
| Indisponibilidade, limite de requisições ou mudança nos termos do provedor | Consultas podem falhar, ser limitadas ou exigir mudanças/custos não planejados. | Monitorar uso e falhas; observar termos e atribuição; manter mensagens de erro e nova tentativa manual. |
| Dados atrasados, incompletos ou inconsistentes | Usuários podem tomar decisões com informação incorreta ou perder confiança. | Validar respostas, deixar campos ausentes em branco e sempre exibir atualização; marcar dados com mais de 24 horas como desatualizados. |
| Ambiguidade entre cidades homônimas | A pessoa pode consultar a localidade errada. | Exigir seleção explícita; pedir refinamento quando qualificadores geográficos forem insuficientes. |
| Falhas em redes móveis ou dispositivos de menor capacidade | A busca e a previsão podem ser lentas ou inutilizáveis. | Medir P95 conforme o perfil controlado e o monitoramento real definidos em RNF-04. |
| Conversão ou arredondamento inconsistente | Temperaturas podem parecer contraditórias entre telas ou unidades. | Converter antes de arredondar ao inteiro mais próximo, com empates afastados de zero; testar valores positivos e negativos. |
| Restrição da busca exclui nomes de cidades com pontuação | Localidades com hífen ou apóstrofo não podem ser pesquisadas diretamente. | Exibir validação clara e permitir refinamento da busca sem caracteres rejeitados. |
| Problemas de responsividade, compatibilidade ou acessibilidade | Usuários podem não conseguir completar os fluxos essenciais. | Testar navegadores, sistemas e larguras de RNF-01 e validar WCAG 2.2 AA conforme RNF-03. |
| Coleta excessiva ou retenção prolongada de telemetria | Risco de privacidade ou descumprimento da política de dados. | Excluir texto bruto da busca e localização precisa; eliminar telemetria em até 30 dias. |

## Out of Scope

- **Contas e persistência de produto:** autenticação, perfil, favoritos, histórico de buscas, sincronização entre dispositivos e persistência de preferências. A unidade escolhida só dura na sessão atual.
- **Localização automática:** detectar ou solicitar localização do dispositivo; a pessoa informa e seleciona a cidade manualmente.
- **Consultas e previsões adicionais:** previsão horária, períodos além de hoje e dos quatro dias seguintes, histórico meteorológico e comparação simultânea entre várias cidades.
- **Visualizações geográficas:** mapas, radar, camadas meteorológicas ou visualização por coordenadas.
- **Métricas meteorológicas adicionais:** índices de qualidade do ar, alertas severos, recomendações, notificações e dados que não estejam explicitamente listados em FR-03, FR-04 e RNF-10.
- **Personalização regional:** idiomas além de pt-BR, unidades de temperatura além de Celsius/Fahrenheit e unidades de velocidade do vento além de km/h.
- **Plataformas de aplicativo:** PWA instalável, aplicativos nativos para iOS/Android, widgets e distribuição em lojas de aplicativos.
- **Operação offline e cache:** funcionamento sem rede, cache persistente ou sincronização offline. Dados anteriores podem ser preservados somente em memória durante a sessão se uma nova consulta falhar.
- **Atualização automática:** atualização periódica, em segundo plano ou disparada apenas pela passagem do tempo; novas consultas dependem de ação explícita da pessoa.
- **Analytics de produto:** perfilamento, publicidade, rastreamento comportamental e personalização baseada em histórico. Telemetria operacional necessária para saúde do serviço permanece sujeita ao RNF-07.

## Open Questions

As decisões funcionais e operacionais registradas nesta versão estão resolvidas. A aprovação de governança será confirmada quando a implementação for solicitada.

1. **Governança:** quando a implementação for solicitada, confirmar com a pessoa solicitante quem aprova esta especificação e seus critérios de aceite.
