# Mon Cher: contagem regressiva

Um contador em Angular 22 para o aniversário dela (**15 de setembro**), com uma
Área de Eventos onde cada presente destrava sozinho na hora marcada.

Visual inspirado no **Gambit**: magenta cinético, violeta, o marrom do sobretudo
e cartas de baralho carregadas de energia.

## Rodando

```bash
npm start          # http://localhost:4200
npm test           # testes (vitest)
npm run build      # build de produção com SSR + pré-renderização
```

## O que eu edito para deixar do meu jeito

Duas coisas, e só:

| Arquivo | O que tem lá |
| --- | --- |
| `src/app/core/config/celebration.config.ts` | Nome, data do aniversário, bordão, assinatura e a carta final aberta quando o contador zera. |
| `src/app/data/gift-events.data.ts` | A lista de presentes da Área de Eventos. |

Cada presente tem:

```ts
{
  id: 'gift-04',
  title: 'Sessão da noite',
  teaser: 'Luz apagada, cobertor, e você escolhe o filme.', // aparece borrado enquanto está selado
  message: 'Hoje a tela é sua.\n\nVocê escolhe o filme...',  // revelado na abertura
  icon: '🎬',
  accent: 'violet',              // 'magenta' | 'violet' | 'gold'
  opensAt: '2026-09-08T21:00',   // horário local do celular dela
  durationMinutes: 2880,         // 2 dias em destaque; depois vira "lembrança"
}
```

### Os três estados de uma carta

- **Selada:** título escondido, verso da carta, mini-contador `abre em 3d 04h`.
  Tocar nela só faz a carta se sacudir.
- **Disponível:** destrava sozinha no horário, ganha aura pulsante, selo `novo`
  e uma barra mostrando quanto resta da janela.
- **Lembrança:** a janela passou. Continua acessível, só sai dos holofotes.

O que ela já abriu fica guardado no navegador dela, então o selo `novo` não
volta a aparecer.

## O painel escondido

**Cinco toques no naipe ♠ do rodapé** (ou abrir `/?painel`). De lá dá para:

- criar, editar e apagar presentes sem mexer no código;
- **viajar no tempo** (`+1h`, `+1 dia`, `🎂 aniversário`) para conferir como cada
  carta vai se comportar, inclusive a festa de quando o contador zera;
- **re-selar** as cartas, para rever as animações de abertura;
- **copiar como código** e colar de volta em `gift-events.data.ts`, deixando as
  edições permanentes.

As edições feitas pelo painel ficam só naquele navegador. O que vai para o ar é
sempre o arquivo de dados.

## Estrutura

```
src/app/
  core/          # domínio, sem nenhuma dependência de UI
    config/      # CelebrationConfig (token de injeção)
    models/      # GiftEvent, GiftEventView, CountdownSnapshot
    services/    # ClockService, CountdownService, LocalStorageService
    state/       # GiftEventsStore (signals)
    utils/       # funções puras de tempo e projeção de eventos
  data/          # a lista de presentes
  features/
    home/        # a página, orquestrando as seções
    countdown/   # herói + casas do relógio (dígitos animados)
    events/      # Área de Eventos: lista, card e revelação
    celebration/ # o que aparece quando o contador zera
    admin/       # painel escondido (carregado sob demanda via @defer)
  shared/
    pipes/       # duration, schedule
    ui/          # carta de baralho, plano de fundo cinético
src/styles/      # tokens, reset, keyframes e primitivas compartilhadas
```

Decisões que valem a nota:

- **Zoneless + signals.** Todo o estado derivado é `computed`; nenhum
  `subscribe`, nenhum `ngOnDestroy` manual.
- **Um relógio só.** `ClockService` é a única fonte de "agora" e só começa a
  bater depois do primeiro render no navegador, e por isso o HTML do servidor e o
  primeiro render do cliente são idênticos (sem divergência de hidratação) e o
  `setInterval` nunca roda durante a pré-renderização.
- **Regra de tempo em função pura.** `describeGiftEvent()` recebe o evento e um
  instante e devolve a fase. É o que torna a viagem no tempo do painel possível
  sem nenhum código especial de teste.
- **Animações nativas.** `animate.enter` / `animate.leave` do Angular + CSS
  puro, animando só `transform`/`opacity`/`filter`. Sem `@angular/animations`.
  Tudo desligado sob `prefers-reduced-motion`.
- **Cenário que responde ao cursor.** Um halo carregado segue o ponteiro com
  atraso, as camadas do fundo se deslocam em profundidades diferentes
  (parallax) e cada clique solta uma carta de energia. As posições são escritas
  direto em variáveis CSS do elemento, fora do ciclo do Angular: mover o mouse
  não dispara detecção de mudanças, e o `requestAnimationFrame` dorme sozinho
  assim que o cursor para.
- **Mobile primeiro.** Tipografia fluida com `clamp()`, `safe-area-inset` para o
  notch, alvos de toque de 44px+ e menos elementos flutuando em telas pequenas.

## Publicando na Vercel

Já existe um `vercel.json` no repositório: é só importar o projeto na Vercel e
mandar ver. Nenhuma configuração no painel é necessária.

O que o arquivo diz:

- `buildCommand` / `outputDirectory`: roda `npm run build` e publica só
  `dist/Contador-dias/browser`. A rota é pré-renderizada no build, então a
  página sobe como site estático, sem servidor e sem cold start.
- `rewrites`: qualquer caminho cai no `index.html` (a Vercel só aplica isso
  depois de procurar o arquivo real, então os assets continuam sendo servidos
  direto).
- `headers`: cache eterno para os arquivos com hash no nome (`.js`, `.css`,
  `.woff2`) e revalidação sempre na página.

O `engines.node` no `package.json` fixa o piso de versão que o Angular 22 exige,
para a Vercel não escolher um Node velho demais para o build.

### Outros hosts

- **Estático** (Netlify, Cloudflare Pages, GitHub Pages): mesma ideia, publique
  `dist/Contador-dias/browser`.
- **Node com SSR** (Render, Railway, Fly): o build também gera o servidor
  Express; rode `dist/Contador-dias/server/server.mjs`. Só vale a pena se um dia
  o site passar a precisar de algo do lado do servidor.

## Ícone

Três arquivos em `public/`, todos com a mesma carta:

| Arquivo | Para quê |
| --- | --- |
| `favicon.svg` | Navegadores modernos. Nítido em qualquer tamanho, e é **este** que você edita se quiser mudar o desenho. |
| `favicon.ico` | Fallback (16, 32 e 48px). |
| `apple-touch-icon.png` | Ícone de 180px de quando ela salvar o site na tela inicial do iPhone. |
