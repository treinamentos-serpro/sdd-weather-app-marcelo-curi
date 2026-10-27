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
