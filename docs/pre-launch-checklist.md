# Checklist de pré-lançamento

Atualizado em: 2026-10-27

## Atribuição e termos do Open-Meteo

- [x] Conferida a licença oficial em [open-meteo.com/en/licence](https://open-meteo.com/en/licence): dados da API sob CC BY 4.0 e atribuição com link junto aos dados exibidos.
- [x] A aplicação exibe “Dados meteorológicos: Open-Meteo” junto às condições e à previsão; o link tem nome acessível e destino HTTPS.
- [ ] Antes de cada lançamento, confirmar novamente os termos vigentes, a visibilidade e o destino do link no ambiente publicado.
- [ ] Bloquear o lançamento se qualquer restrição impedir os fluxos funcionais CA-01 a CA-04.

## Privacidade e telemetria

### Decisão registrada em 2026-10-27 (T-37)

- Serviço operacional/RUM: nenhum serviço aprovado foi identificado no repositório.
- Aprovação organizacional: `pendente`; não há referência de aprovação formal disponível.
- Campos: nenhum campo é coletado enquanto a integração estiver desativada. Uma eventual proposta deverá limitar-se a duração, status/categoria, timeout/erro e agregados permitidos de navegador/SO, sem texto de busca, coordenadas, localização precisa ou identificadores de cidade.
- Retenção: não aplicável enquanto não houver coleta; qualquer aprovação futura deverá estabelecer retenção de no máximo 30 dias e mecanismo de expurgo.
- Endpoint/SDK: nenhum endpoint de telemetria ou SDK cliente está configurado.
- Decisão: manter a telemetria cliente desativada até que serviço, aprovação, campos e retenção sejam registrados.

- [x] Nenhum serviço de telemetria operacional/RUM com aprovação organizacional foi identificado no repositório.
- [x] Telemetria cliente permanece desativada; não há SDK nem endpoint de telemetria configurado.
- [x] Teste de montagem confirma zero chamadas de rede automáticas, inclusive para telemetria.
- [ ] Registrar serviço, aprovação formal, campos coletados e retenção (máximo de 30 dias) antes de qualquer ativação.

### T-38 — Integração condicional

Status em 2026-10-27: não habilitada; a aprovação registrada em T-37 continua `pendente`.
Nenhum SDK, inicialização, endpoint, payload ou configuração de coleta foi adicionado. A
implementação de métricas só poderá ser reaberta após aprovação formal e registro do serviço,
campos permitidos e retenção com expurgo.

## Operação e compatibilidade (T-40)

### Gate de release

**Status: BLOQUEADO para lançamento em produção** até concluir os ensaios controlados,
comissionar as sondas e preencher a matriz de compatibilidade abaixo. Os resultados de testes
automatizados locais não substituem medições em produção ou no perfil de referência.

### Evidências executadas em 2026-10-27

| Comando | Resultado |
|---|---|
| `pnpm lint` | Passou (exit code 0). |
| `pnpm build` | Passou (exit code 0), incluindo TypeScript strict. |
| `pnpm test` | Passou: 17 arquivos e 153 testes. |
| `pnpm exec playwright test` | Passou: 18 testes em Chromium e WebKit; chamadas Open-Meteo foram interceptadas. |
| axe-core | Sem violações `critical` ou `serious` nos estados inicial, resultados, carregamento, erro e sucesso. |

Essas execuções cobrem os viewports de 320, 768, 1280 e 1920 CSS px em Chromium e WebKit.
Firefox, Edge, os sistemas operacionais da matriz, leitores de tela e ensaios de produção ainda
não foram validados.

### Performance — RNF-04

**Pendente: nenhuma amostra controlada foi coletada; não atribuir P95 nem declarar o requisito
aprovado.** Executar antes do lançamento, com 100 medições independentes por fluxo:

- Perfil controlado: download 10 Mbps, upload 5 Mbps, RTT 50 ms, dispositivo com 4 núcleos
  lógicos e 8 GB de RAM.
- Fluxo de busca: medir do envio até os resultados visíveis, incluindo latência real do provedor;
  meta P95 ≤ 2 s.
- Shell utilizável: medir do início da navegação até a interface inicial interativa; meta P95
  ≤ 2,5 s.
- Para cada fluxo, ordenar as 100 durações e usar nearest-rank na posição
  `ceil(0,95 × n)` (posição 95 para n=100). Registrar data, navegador/SO, perfil, amostras e
  resultado P95.
- Repetir a medição operacional em produção e acompanhar RUM em janela móvel de 7 dias,
  segmentada por navegador/SO, somente após aprovação T-37.

| Fluxo | Amostras exigidas | P95 observado | Meta | Status |
|---|---:|---:|---:|---|
| Busca até resultados visíveis | 100 | Não medido | ≤ 2 s | Pendente |
| Navegação até shell utilizável | 100 | Não medido | ≤ 2,5 s | Pendente |

### Disponibilidade e sondas — RNF-05

**Pendente: não há URL de produção nem sondas implantadas neste repositório.** Plano para
comissionamento antes do lançamento:

- Executar a cada minuto, continuamente, uma sonda em cada uma de três regiões distintas.
- Considerar o shell disponível quando a página carrega e o campo de busca fica interativo;
  marcar um minuto indisponível quando a maioria das três sondas falhar.
- Calcular mensalmente `(minutos disponíveis ÷ minutos totais do mês) × 100`; meta ≥ 99,5%.
  Não excluir manutenção programada.
- Relatar separadamente disponibilidade e taxa de sucesso do Open-Meteo, sem imputar falhas
  do provedor à disponibilidade do shell.
- Registrar URL, regiões, período, minutos disponíveis/indisponíveis e métricas do provedor
  no relatório operacional. Não publicar o release até confirmar a configuração e o primeiro
  ciclo de verificação.

### Matriz de compatibilidade — RNF-01

Executar cada combinação nas versões estável atual e anterior, em 320, 768, 1280 e 1920 CSS px.
Preencher a evidência de execução em cada célula; os testes Playwright Chromium/WebKit acima não
substituem esta matriz.

| Navegador | Windows | macOS | Linux | Viewports CSS px | Status |
|---|---|---|---|---|---|
| Firefox (estável atual/anterior) | Pendente | Pendente | Pendente | 320, 768, 1280, 1920 | Pendente |
| Microsoft Edge (estável atual/anterior) | Pendente | Pendente | Pendente | 320, 768, 1280, 1920 | Pendente |
| Google Chrome (estável atual/anterior) | Pendente | Pendente | Pendente | 320, 768, 1280, 1920 | Pendente |

### Revisão manual de acessibilidade — RNF-03

axe-core passou nos estados principais em Chromium e WebKit. Permanecem pendentes os testes
manuais de teclado/foco e leitor de tela com NVDA + Firefox no Windows, VoiceOver + Chrome no
macOS e Orca + Firefox no Linux.
