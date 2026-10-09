# Insumo Certo

Crie uma plataforma web responsiva, moderna e profissional chamada INSUM CERTO, focada no controle e rastreabilidade de insumos agrícolas. Objetivo: garantir rastreabilidade total do insumo do almoxarifado até a aplicação final, utilizando QR Code único por produto. O sistema deve permitir leitura do QR Code usando a câmera do celular para registrar saída do almoxarifado, transporte, chegada e aplicação no campo, sempre vinculado a Ordem de Serviço, fazenda, talhão, data, hora e responsável. Na saída do almoxarifado, ao ler o QR Code, registrar produto, lote, quantidade, veículo e destino, alterando o status para 'em transporte'. Na chegada à fazenda, ler novamente o QR Code e validar automaticamente se o destino confere com a OS e a fazenda programada, gerando alerta de divergência se houver qualquer inconsistência. Na aplicação, confirmar o uso lendo o mesmo QR Code, cruzando produto + OS + fazenda + talhão, registrando quantidade aplicada e responsável, finalizando o status como 'aplicado'. Criar um painel inicial com indicadores: insumos em transporte, entregues, aplicados, pendentes, divergências, gráficos por fazenda e por produto. Incluir uma tela de rastreabilidade com linha do tempo completa por QR Code, mostrando todas as etapas, quem fez e quando fez. Incluir uma Central de Divergências para destacar problemas como produto aplicado em fazenda diferente, produto não aplicado, quantidade diferente da retirada e QR Code duplicado. Adicionar tela de consulta de Ordens de Serviço com status, produtos vinculados e progresso. Incluir relatórios filtráveis por período, fazenda, produto e OS, com exportação em Excel e PDF. Criar controle de usuários com perfis: administrador, almoxarifado, motorista, operador de campo e gestor. Interface com design limpo e corporativo, cores verde e branco, nome INSUM CERTO em destaque. Menu lateral com Dashboard, Ler QR Code, Ordens de Serviço, Insumos, Rastreabilidade, Fazendas, Divergências, Relatórios, Usuários e Configurações. Priorize uma experiência muito simples no celular. com poucos cliques e botões grandes para leitura do QR. Garantir que todas as leituras gerem histórico permanente e consultável. Simular dados reais para demonstrar o funcionamento completo do fluxo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://insum-certo-trace.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd8304d0-f213-436a-a3be-282e4d5ecd1f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
