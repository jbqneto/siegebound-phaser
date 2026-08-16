# LegendaryBound — Diário de observação

Este arquivo registra observações feitas durante a comparação do protótipo Siegebound com o LegendaryBound. Fatos visuais ficam separados de hipóteses até serem confirmados por novas capturas.

## Sessão inicial — 15/08/2026

### Acesso e contexto

- A sessão autenticada foi acessada no Chrome do usuário via conexão CDP.
- A sala observada atualmente é a `room-8` do servidor 1. O link inicial mencionava a `room-12`, mas a partida ativa mudou de sala.
- O jogador visível é `jbqneto`, contra `Tutorial Bot`.
- As capturas foram feitas sem pressionar teclas ou interferir na partida.

### Controles exibidos pelo próprio jogo

- Setas esquerda/direita: mover.
- Setas cima/baixo: ajustar ângulo.
- Espaço segurado: carregar o disparo.
- Botão esquerdo do mouse: modo Drag.
- Barra de poder/tela touch: interação alternativa para carregar.

### HUD e fluxo de turno

- O jogo mostra uma lista de turnos no canto inferior esquerdo.
- Há indicação visual de vento em um mostrador circular no topo.
- O ângulo e a potência aparecem em uma barra inferior, com marcações graduais.
- Há seleção de armas e slots de itens na área inferior.
- O estado observado avançou de `2/40` para `4/40` entre duas capturas.
- Os valores exibidos para os jogadores mudaram entre as capturas; ainda não está confirmado se representam HP, pontuação, bônus ou uma combinação desses dados.

### Câmera e composição visual

- A partida usa uma câmera de batalha enquadrando a máquina ativa em uma área ampla do cenário.
- O cenário combina relevo jogável em primeiro plano com estruturas, montanhas e construções decorativas ao fundo.
- O terreno possui silhueta irregular, vales, elevações e elementos que podem esconder visualmente os jogadores.
- O chat/tutorial permanece sobreposto no canto superior esquerdo durante a partida.
- A máquina ativa aparece com mira circular, indicador numérico acima e barra/nome abaixo.

### Física ainda não confirmada

- Não foi possível medir ainda a curva exata de potência, gravidade, vento ou colisão.
- Ainda falta capturar uma sequência completa: estado antes do carregamento → carga parcial → carga máxima → disparo → impacto.
- Também falta confirmar se o projétil segue uma previsão pontilhada, uma linha de mira ou apenas o indicador de ângulo/potência.

## Próximas capturas planejadas

1. Capturar o mesmo estado imediatamente antes e depois de mover.
2. Registrar carga curta, média e máxima sem disparar, se possível.
3. Registrar a trajetória completa de um disparo e o ponto de impacto.
4. Comparar um disparo com vento favorável e outro com vento contrário.
5. Observar a troca de turno e a movimentação da câmera.
6. Identificar quais elementos do cenário são colisores e quais são somente decoração.

## Sessão do boss — observação técnica

### Estado observado

- Partida contra `Maestro Rochi`, na sala 8 do servidor 1.
- O boss exibiu mensagens de uso de item `Dual` e falas contextuais durante a partida.
- O contador de turno avançou rapidamente durante a observação; o limite visível é de aproximadamente 20 segundos por turno.
- A tela mostra um cenário noturno/fantástico com plataformas e um grande elemento central que pode bloquear a visão entre os jogadores.
- O jogador e o boss ficaram próximos em altura, mas separados por uma estrutura central.
- O indicador circular de direção/mira aparece sobre a máquina ativa.
- A barra inferior possui uma região vermelha de potência, marcações e um marcador móvel; ela parece ser o controle mais direto para uma carga rápida.
- O jogo possui slots de armas e itens na faixa inferior, incluindo ícones de armas, item Dual e outros itens selecionáveis.

### Controles e interface confirmados no DOM/console

- O jogo principal é renderizado em um canvas de `1249×937` CSS/pixels na sessão observada.
- Foram encontrados vários canvases auxiliares pequenos para interface, mas os controles da batalha não aparecem como botões HTML acessíveis.
- Os controles de batalha são provavelmente tratados por eventos de teclado/mouse diretamente no canvas.
- Elementos HTML encontrados fora do canvas: `Criar`, `Install Game`, controles de replay (`⏮`, `⏸`), `Copy`, `Custom`, `Limpar` e `Redefinir`.
- O console inicializa a aplicação como `LegendaryBound 2025`.
- O console registrou avisos de áudio bloqueado por falta de interação (`UnPauseMusic failed / NotAllowedError`); isso é limitação de autoplay, não erro de física.

### Aprendizado operacional para a próxima partida

- Não usar capturas entre cada tecla: o tempo de round trip pode consumir grande parte do turno.
- Fazer uma única sequência rápida: ajustar ângulo → clicar/arrastar na barra de potência → soltar/disparar → capturar apenas o resultado.
- Confirmar primeiro qual jogador está ativo pelo marcador/contador, pois o boss pode agir enquanto a observação está em andamento.
- Registrar separadamente o item usado, o ângulo, a posição do marcador da barra e o resultado do tiro.

### Controles confirmados pelo usuário

- `ArrowLeft` / `ArrowRight`: mover para esquerda/direita.
- `ArrowUp` / `ArrowDown`: ajustar o ângulo do tiro.
- `Space`: disparo com carregamento semelhante ao protótipo — segurar para carregar e soltar para atirar.
- Para a próxima partida, o controle será feito somente por teclado; a barra/mouse não será usada como substituto.

## Nova partida — teste de controle rápido

- Cenário observado: mapa nevado/lunar, com grande coluna luminosa central e terreno de gelo/terra.
- Adversário: `Picoro`; máquina verde posicionada à direita do jogador.
- No início da captura, `jbqneto` estava ativo com cerca de 13 segundos restantes.
- Sequência enviada: dez eventos de `ArrowUp`, seguidos de `Space` segurado por aproximadamente 1,8 segundos e solto.
- Resultado visual posterior: o turno avançou para `5/40` e surgiu uma cratera grande no terreno à esquerda/abaixo do jogador.
- O adversário passou a exibir marcador azul `18`, indicando troca de turno ou contador de ação.
- Os valores da lista de turnos mudaram para aproximadamente `1450` e `2210`; ainda não foi confirmado se são HP, pontuação ou saldo acumulado.
- O disparo confirmou que a sequência de teclado pode ser enviada rapidamente, mas a mira precisa ser calibrada com mais cuidado para evitar impactos fora do alvo.

## Regra do diário

Cada nova entrada deve indicar o horário/captura, o que foi observado diretamente e o que ainda é hipótese. Nenhuma ação de jogo deve ser executada sem autorização explícita do usuário.
