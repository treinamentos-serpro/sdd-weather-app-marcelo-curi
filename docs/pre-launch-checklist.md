# Checklist de pré-lançamento

Atualizado em: 2026-10-27

## Atribuição e termos do Open-Meteo

- [x] Conferida a licença oficial em [open-meteo.com/en/licence](https://open-meteo.com/en/licence): dados da API sob CC BY 4.0 e atribuição com link junto aos dados exibidos.
- [x] A aplicação exibe “Dados meteorológicos: Open-Meteo” junto às condições e à previsão; o link tem nome acessível e destino HTTPS.
- [ ] Antes de cada lançamento, confirmar novamente os termos vigentes, a visibilidade e o destino do link no ambiente publicado.
- [ ] Bloquear o lançamento se qualquer restrição impedir os fluxos funcionais CA-01 a CA-04.

## Privacidade e telemetria

- [x] Nenhum serviço de telemetria operacional/RUM com aprovação organizacional foi identificado no repositório.
- [x] Telemetria cliente permanece desativada; não há SDK nem endpoint de telemetria configurado.
- [ ] Registrar serviço, aprovação formal, campos coletados e retenção (máximo de 30 dias) antes de qualquer ativação.

