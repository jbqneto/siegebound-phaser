# Siegebound — Physics Prototype

Protótipo técnico de um artillery game 2D inspirado no loop de mira/potência/vento de Gunbound e na destruição de terreno de Worms, mas com máquinas de cerco atravessando diferentes eras.

## Objetivo desta versão

Validar **game feel** antes de construir multiplayer, contas, progressão, arte final ou backend:

- balística customizada com timestep fixo;
- vento por turno;
- diferenças reais entre máquinas;
- terreno heightmap destrutível;
- crateras e dano por distância;
- movimentação limitada por turno;
- turnos com limite de 20 segundos e troca automática;
- iniciativa determinística por linha do tempo, com custo da máquina, arma e tempo gasto;
- três armas data-driven por máquina (Primary, Secondary e Signature);
- prévia dos próximos jogadores na fila de iniciativa;
- estados explícitos de turno e condições de campo determinísticas;
- renderização Phaser 4 inteiramente vetorial/procedural;
- eras como configuração de dados;
- trajetória de debug ativável;
- regras de jogo desacopladas do renderer.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- npm

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente `http://localhost:5173`).

## Testes e build

```bash
npm test
npm run build
```

## Controles

| Tecla | Ação |
|---|---|
| `←` / `→` | mover a máquina ativa para frente/trás |
| `↑` / `↓` | alterar ângulo |
| `Space` (segurar) | carregar potência por até 7 segundos |
| `Space` (soltar) | disparar com a potência carregada |
| `1` / `2` / `3` | selecionar Primary / Secondary / Signature |
| `Q` | passar o turno, aplicando custo de iniciativa |
| `M` | trocar a máquina do jogador atual |
| `N` | trocar de fase |
| `T` | trocar era, tema e roster de teste |
| `P` | ligar/desligar previsão de trajetória (debug) |
| `R` | reiniciar |

Cada turno dura 20 segundos. O contador fica no topo direito e fica vermelho nos últimos 5 segundos. O mostrador direcional de vento ao lado indica a direção e a intensidade aproximada. O disparo soma à linha do tempo o `baseDelay` da máquina, o `delay` da arma e o tempo gasto no turno; por isso uma ação barata pode colocar o mesmo jogador novamente na frente.

As condições atuais aparecem como `FIELD → NEXT FIELD` no topo. Elas são determinísticas por semente e alteram o disparo: Strong Gust, Wind Shift, Thermal Updraft, Heavy Rain e Supply Restriction.

## Máquinas do protótipo

- **Ballista** — trajetória baixa, rápida e precisa; Heavy Bolt, Split Bolt e Piercing Lance.
- **Onager** — perfil equilibrado; Stone, Stone Cluster e Siege Boulder.
- **Traction Trebuchet** — arco mais alto e maior influência do vento; Sling Stone, Double Sling e Fire Pot.
- **Counterweight Trebuchet** — pesado, destrutivo e com grande cratera; Heavy Stone, Demolition Shot e Great Boulder.

Os valores são **gameplay tuning**, não uma tentativa de simulação histórica fiel.

## Fases do protótipo

- **Open Field** — campo aberto, com contato visual direto.
- **Long Ridge** — mapa mais extenso, que pode exigir o radar.
- **Hidden Basin** — máquinas distantes e frequentemente ocultas pelo relevo.

Pressione `N` para alternar entre as fases. Quando o relevo ou a distância impedem o contato visual, o radar quadrado aparece no canto inferior esquerdo com a posição dos dois jogadores.

## Arquitetura

```text
src/
├── core/       # matemática, terrain, RNG, tipos; sem Phaser
├── data/       # catálogo de eras e máquinas
├── game/       # estado e regras da partida
├── render/     # desenho das máquinas
├── scenes/     # integração Phaser / input / rendering
└── ui/         # HUD
docs/           # direção de game design e decisões do protótipo
```

A regra principal é: **`core` não depende de Phaser**. Isso permite no futuro executar a mesma simulação no servidor autoritativo, em testes, replays e bots.

## Decisões intencionais

### 1. Não usamos Arcade Physics/Matter/Box2D para o projétil

O projétil usa integração própria com fixed timestep (`1/120 s`). Para um artillery game competitivo, a física principal precisa ser simples, previsível, testável e reproduzível.

### 2. Heightmap primeiro

O terreno atual guarda apenas uma altura por coordenada X. Isso suporta colinas e crateras com implementação pequena e rápida. Não suporta cavernas, pontes de terreno ou overhangs. Se o core loop funcionar, a próxima evolução pode ser uma binary terrain mask / render texture.

### 3. Sem assets

Tudo é desenhado com `Phaser.GameObjects.Graphics`. O objetivo é provar física, leitura visual e game design. Arte 2D/3D pré-renderizada entra depois.

## Próximas milestones sugeridas

1. Fazer 15–20 sessões curtas ajustando velocidade, gravidade, vento, ângulo e power curve.
2. Trocar o indicador linear de power por charge bar com timing.
3. Melhorar terreno para máscara destrutível, somente se cavernas realmente forem importantes.
4. Adicionar estados explícitos de turno (`PREPARE`, `ACTIVE`, `PROJECTILE`, `RESOLVE`).
5. Introduzir condições de campo visíveis e previsíveis.
6. Adicionar itens táticos com limite de slots e custo de iniciativa.
7. Extrair `game-core` para um package independente.
8. Só então adicionar Colyseus e transformar o servidor em autoridade da partida.
9. Criar assets no Blender e exportar sprites/atlases ortográficos para Phaser.

## Nota sobre as eras

Para não forçar todas as máquinas em um único período histórico, o projeto já trata `Era` e `Machine` como dados separados. Isso permite campanha/mapas por período e, em modos arcade, liberar cross-era matchups deliberadamente estilizados.
