# Backlog de tarefas — Weather App (v2)

## Objetivo e escopo

Este backlog decompõe [`plans/weather-app-plan-v2.md`](../plans/weather-app-plan-v2.md), que complementa [`plans/weather-app-plan.md`](../plans/weather-app-plan.md) para as mudanças de busca especificadas em [`specs/weather-app-spec.md`](../specs/weather-app-spec.md), FR-01 e CA-01.

As tarefas descrevem trabalho futuro. **Nenhum código é implementado por este documento.** As regras existentes de seleção explícita, desambiguação, estados de busca e consulta meteorológica permanecem inalteradas.

## Ordem de execução

1. **T2-01 — Atualizar validação de busca.**
2. Em seguida, executar **T2-02**, **T2-03** e **T2-04**; dependem do novo contrato de validação e podem ser feitas em paralelo.
3. Concluir com **T2-05**, que valida o fluxo ponta a ponta e depende das tarefas anteriores.

## T2-01 — Aceitar hífen e vírgula na validação

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Atualizar a validação compartilhada da busca para aceitar os caracteres aprovados em FR-01, sem alterar a normalização, o limite de grafemas ou as demais regras.
- **Critérios de aceite:**
  - Após normalização NFC, trim e redução de espaços internos, letras Unicode, espaços, hífen ASCII (`-`) e vírgula ASCII (`,`) são aceitos.
  - A contagem continua sendo de clusters de grafemas Unicode após normalização; até 200, inclusive, é permitido.
  - Entrada vazia/composta somente de espaços continua inválida como obrigatória; mais de 200 grafemas continua inválida por tamanho.
  - Apóstrofo e caracteres fora do conjunto permitido continuam inválidos.
  - A lógica de validação permanece pura, sem acesso ao serviço ou à rede.
- **Dependências:** Nenhuma
- **Arquivos prováveis:** `src/lib/search.ts`
- **Requisitos:** FR-01; CA-01

## T2-02 — Testar o contrato atualizado de validação

- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Adicionar ou adaptar testes unitários para cobrir caracteres permitidos, rejeições e limites da validação de busca.
- **Critérios de aceite:**
  - Testes confirmam que hífen e vírgula são aceitos juntos em entradas como `Winston-Salem, North Carolina, USA`, e que letras acentuadas continuam aceitas.
  - Testes verificam NFC, remoção de espaços externos e redução de sequências de espaços internos antes da validação.
  - Uma entrada com exatamente 200 grafemas permitidos passa e uma com 201 falha como `too-long`.
  - Apóstrofo e outros caracteres não permitidos falham como `invalid`.
  - Entradas vazias ou somente com espaços falham como `required`.
- **Dependências:** T2-01
- **Arquivos prováveis:** `src/lib/search.ts`, testes unitários existentes da busca em `tests/` ou junto ao módulo conforme a convenção vigente
- **Requisitos:** FR-01; CA-01

## T2-03 — Preservar hífen e vírgula no campo de busca

- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Garantir que o campo de busca aceite e mantenha os caracteres permitidos enquanto a pessoa digita, e que o envio continue associado à validação existente.
- **Critérios de aceite:**
  - A pessoa consegue digitar e editar hífen e vírgula; o valor controlado do campo não os remove.
  - A consulta permanece editável e é normalizada/validada no envio conforme FR-01.
  - O campo não trunca silenciosamente entradas acima de 200 grafemas.
  - Busca válida submete a consulta; entrada vazia ou inválida apresenta o erro apropriado e não inicia geocodificação.
  - Rótulos, mensagens e associação acessível do erro ao campo permanecem funcionais.
- **Dependências:** T2-01
- **Arquivos prováveis:** `src/components/SearchBar.tsx`, testes de componente existentes em `tests/`
- **Requisitos:** FR-01; CA-01, CA-07; RNF-03, RNF-09

## T2-04 — Encaminhar a consulta completa à geocodificação

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Confirmar que o serviço envia a busca normalizada integral, incluindo cidade e qualificadores separados por vírgula, ao parâmetro `name` da Open-Meteo Geocoding API.
- **Critérios de aceite:**
  - O parâmetro `name` contém a consulta completa normalizada, sem separar ou descartar cidade, estado/região ou país.
  - A consulta é codificada corretamente na URL e os parâmetros existentes de geocodificação permanecem preservados.
  - Uma consulta válida com hífen/vírgula chama a API; entrada vazia ou inválida não gera requisição.
  - Resposta vazia, falhas do provedor, timeout e seleção explícita continuam seguindo o comportamento já definido no plano base.
- **Dependências:** T2-01
- **Arquivos prováveis:** `src/services/weatherService.ts`, testes unitários existentes do serviço em `tests/`
- **Requisitos:** FR-01, FR-02, FR-07; CA-01, CA-02

## T2-05 — Validar busca qualificada ponta a ponta

- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Cobrir com teste de integração/E2E, usando rede interceptada, a digitação, validação, envio e seleção de resultados de uma busca qualificada.
- **Critérios de aceite:**
  - O fluxo digita uma consulta com hífen e qualificadores separados por vírgula, submete e confirma que a requisição interceptada inclui o valor completo no parâmetro `name`.
  - Os resultados continuam apresentados como opções e nenhuma cidade é selecionada automaticamente; a consulta meteorológica só ocorre após seleção explícita.
  - O fluxo com apóstrofo apresenta erro de validação e não envia requisição de geocodificação.
  - Entradas vazias e acima de 200 grafemas não enviam requisição; o fluxo também confirma que a regra de normalização anterior permanece.
  - Interceptações são configuradas antes da navegação, assertions são aguardadas e não há dependência da Open-Meteo real nem sleeps.
- **Dependências:** T2-02, T2-03, T2-04
- **Arquivos prováveis:** testes Playwright existentes em `tests/`
- **Requisitos:** FR-01, FR-02, FR-07; CA-01, CA-02, CA-07; RNF-02, RNF-08
