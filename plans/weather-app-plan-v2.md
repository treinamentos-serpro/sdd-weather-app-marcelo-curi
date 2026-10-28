# Plano Técnico — Weather App (v2)

## Objetivo e precedência

Este plano deriva das alterações de busca registradas em [`specs/weather-app-spec.md`](../specs/weather-app-spec.md), em especial FR-01 e CA-01. Ele complementa [`weather-app-plan.md`](./weather-app-plan.md): arquitetura, stack, modelo meteorológico, fluxo de seleção de cidades e demais decisões do plano base permanecem válidos.

Para a busca, este documento substitui qualquer decisão anterior que permitia somente letras e espaços ou bloqueava hífen. A especificação é a fonte da verdade; não implementar comportamento incompatível com FR-01 ou CA-01.

## Escopo da revisão

- Permitir que a pessoa digite letras, espaços, hífen (`-`) e vírgula (`,`) no campo de busca.
- Permitir informar a cidade com estado/região e/ou país no mesmo texto, por exemplo, `Winston-Salem, North Carolina, USA` ou `Porto Alegre, Rio Grande do Sul, Brasil`.
- Preservar a normalização, o limite de 200 clusters de grafemas e a validação de entrada vazia.
- Continuar rejeitando apóstrofo e quaisquer caracteres fora do conjunto permitido.
- Não alterar seleção explícita de resultados, desambiguação, consulta meteorológica ou demais fluxos.

## Arquitetura e componentes afetados

Manter a arquitetura client-side existente: `SearchBar` recolhe a consulta, a lógica compartilhada de busca normaliza e valida a entrada, `useWeather` coordena o estado e `weatherService` encaminha a consulta à API de geocodificação.

Superfícies a ajustar durante a implementação:

| Superfície | Decisão |
|---|---|
| `src/components/SearchBar.tsx` | Permitir que hífen e vírgula sejam digitados e mantidos no valor controlado. Não remover esses caracteres em manipuladores de digitação. |
| `src/lib/search.ts` | Atualizar o contrato de caracteres permitidos, mantendo a normalização e a validação comuns ao componente e ao serviço. |
| `src/hooks/useWeather.ts` | Manter o envio explícito, erros de validação associados à busca e estados de carregamento/resultados já definidos no plano base. |
| `src/services/weatherService.ts` | Encaminhar a consulta completa normalizada ao parâmetro `name` da Open-Meteo Geocoding API, com codificação de URL apropriada. |
| Testes existentes | Atualizar os casos que esperavam rejeição de hífen e adicionar cobertura para vírgula, qualificadores geográficos e apóstrofo rejeitado. |

Esta revisão não exige novos componentes, novos serviços ou alterações no modelo `City`: os qualificadores fazem parte do texto da consulta; os resultados continuam sendo as localidades retornadas pela API.

## Stack e dependências externas

Sem mudanças de stack ou dependências. Continuam válidos TypeScript strict, React, Vite, Vitest, Testing Library, Playwright, Biome e Open-Meteo.

Usar o endpoint existente `GET https://geocoding-api.open-meteo.com/v1/search`. Enviar a busca normalizada como valor integral de `name`; não separar o texto em parâmetros de cidade, estado ou país nem construir filtros locais não definidos pela API. Os parâmetros de idioma, formato e quantidade de resultados continuam conforme o plano base.

## Contrato de normalização e validação

Aplicar na ordem:

1. Normalizar a entrada para Unicode NFC.
2. Remover espaços do início e do fim.
3. Reduzir cada sequência de espaços internos a um espaço.
4. Contar clusters de grafemas Unicode sobre o texto normalizado.
5. Rejeitar entrada vazia, entrada acima de 200 grafemas ou qualquer caractere fora do conjunto permitido.

Conjunto permitido: letras Unicode, espaços, hífen ASCII (`-`) e vírgula ASCII (`,`). Hífen e vírgula podem ocorrer no nome da cidade e nos qualificadores; não impor uma gramática adicional, quantidade fixa de separadores ou interpretação manual das partes. Apóstrofo permanece inválido.

O campo deve preservar a entrada permitida enquanto a pessoa digita. A validação final ocorre conforme o contrato da busca ao enviar; não truncar silenciosamente entradas acima de 200 grafemas. Entrada inválida ou vazia não deve iniciar requisição de geocodificação. Em busca válida, enviar o valor normalizado integral, incluindo qualificadores, para que o provedor determine os resultados.

Contrato conceitual:

```ts
type SearchError = "required" | "invalid" | "too-long";

interface SearchInputContract {
  rawValue: string;
  normalizedValue: string;
  graphemeCount: number;
  error: SearchError | null;
}
```

O contrato é descritivo; manter nomes e tipos concretos já adotados no código quando equivalentes. Não introduzir estados ou tipos adicionais apenas para representar hífen e vírgula.

## Fluxo de dados

1. A pessoa digita o nome da cidade e, opcionalmente, estado/região e/ou país.
2. O componente mantém hífen e vírgula no texto digitado e submete a busca explicitamente.
3. A validação normaliza Unicode e espaços, conta grafemas e verifica limite e caracteres permitidos.
4. Se inválida, a interface apresenta o erro correspondente sem chamar o serviço.
5. Se válida, o hook inicia a busca e o serviço encaminha a consulta normalizada completa como `name` à geocodificação Open-Meteo.
6. A UI apresenta os resultados como opções explícitas; a pessoa ainda seleciona a localidade desejada. Resultados vazios, falhas e qualificadores seguem FR-02/FR-07 e o plano base.

## Estados e erros

Reutilizar os estados atuais de busca (`idle`, `loading`, `success`, `empty`, `error`) e os erros de validação (`required`, `invalid`, `too-long`) definidos no plano base.

- Hífen e vírgula não são erros de validação.
- Apóstrofo, outros sinais de pontuação e caracteres não permitidos continuam gerando `invalid`, sem requisição.
- Entrada vazia/composta somente de espaços continua gerando `required`, sem requisição.
- Mais de 200 grafemas continua gerando `too-long`, sem truncamento ou requisição.
- Uma consulta aceita que não encontra resultados segue o estado vazio definido pela spec; não classificar como erro de validação.

## Estratégia de testes

### Vitest e Testing Library

- Testar normalização NFC, remoção de espaços externos e redução de sequências de espaços internos antes da validação.
- Testar letras acentuadas e Unicode, hífen e vírgula aceitos, inclusive combinados em consultas com qualificadores como `Winston-Salem, North Carolina, USA`.
- Testar limite de 200 grafemas: exatamente 200 é aceito; 201 é rejeitado. Fazer a contagem após a normalização.
- Testar apóstrofo e outros caracteres não permitidos como inválidos.
- Testar busca vazia e inválida sem chamada ao serviço/geocodificação.
- Testar no componente que hífen e vírgula permanecem visíveis no campo durante a digitação e que o envio encaminha a consulta normalizada.
- Preservar os testes existentes de estados de carregamento, vazio, falha e seleção explícita.

### Playwright

- Adicionar ou adaptar um fluxo com rede interceptada que digita uma consulta com hífen e qualificadores separados por vírgula, submete a busca e verifica que o parâmetro `name` recebido pela requisição contém a consulta completa.
- Verificar que a busca continua exigindo seleção explícita e que a consulta meteorológica ocorre somente após seleção.
- Verificar que uma entrada com apóstrofo é sinalizada como inválida e não dispara a requisição de geocodificação.
- Manter interceptação determinística e assertions aguardadas, sem dependência da API real ou sleeps.

## Critérios de conclusão e riscos

A revisão está implementada quando:

- o campo permite digitar e mantém hífen e vírgula;
- a validação aceita esses caracteres dentro do limite e encaminha a busca completa;
- apóstrofo e demais caracteres não permitidos continuam bloqueados sem chamada de rede;
- buscas vazias e acima de 200 grafemas continuam bloqueadas sem chamada de rede;
- os resultados ainda exigem seleção explícita;
- os testes unitários, de componente e E2E relevantes passam.

Risco principal: a aceitação no campo não garante que o provedor encontre uma correspondência para toda combinação de cidade, região e país. A aplicação deve apresentar os resultados retornados, inclusive resultado vazio, sem prometer correspondência ou selecionar uma localidade automaticamente. Não remover pontuação adicional nem reescrever a consulta para contornar limitações do provedor.
