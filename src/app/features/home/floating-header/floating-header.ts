import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

const THROW_MS = 660;

/**
 * Frações visíveis em que pedimos para ser avisados.
 *
 * Os limites de decisão abaixo são de propósito *diferentes* destes: ao cruzar
 * um limiar, o navegador reporta a razão exatamente no valor declarado, então
 * comparar com o mesmo número deixa o gatilho preso num empate e ele nunca
 * dispara. A folga entre avisar e decidir é o que faz isto funcionar.
 */
const THRESHOLDS = [0, 0.4, 0.9];

/**
 * Menos que isto visível: a carta é arremessada. Escolhido para pegá-la já
 * sumindo sob a borda de cima, mas com pedaço suficiente na tela para o voo
 * começar à vista.
 */
const PIN_BELOW = 0.5;
/** Mais que isto de volta na tela: o cabeçalho se recolhe. */
const UNPIN_ABOVE = 0.8;

/**
 * A faixa que aparece no topo quando ela passa do contador.
 *
 * O gesto é o do próprio Gambit: assim que a carta do herói começa a sumir sob
 * a borda de cima, ela é *arremessada* — sai girando da posição real em que
 * está e pousa, já pequena, no cabeçalho.
 *
 * Quem voa é um clone posicionado de forma fixa, animado pela Web Animations
 * API (só `transform`, então roda no compositor). O original fica onde está e
 * a carta do cabeçalho só aparece quando o voo termina.
 *
 * Para saber a hora, um `IntersectionObserver` vigia a própria carta do herói:
 * nada de escutar `scroll`.
 */
@Component({
  selector: 'app-floating-header',
  imports: [PlayingCard],
  templateUrl: './floating-header.html',
  styleUrl: './floating-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-pinned]': 'pinned()' },
})
export class FloatingHeader {
  /** Marca de reserva, usada quando não há carta de herói na tela (dia 15). */
  readonly sentinel = input.required<HTMLElement>();
  /** A carta do herói: a que é arremessada. */
  readonly origin = input<HTMLElement | null>(null);
  /** Mesma carga do contador, para a carta seguir se carregando aqui em cima. */
  readonly charge = input(0.5);

  protected readonly pinned = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Voo em curso, se houver. Nunca mais de um. */
  private flight?: {
    travel: Animation;
    spin: Animation;
    flier: HTMLElement;
    source: HTMLElement;
    target: HTMLElement;
  };

  constructor() {
    inject(DestroyRef).onDestroy(() => this.endFlight());

    // O efeito se refaz sozinho se o alvo trocar (por exemplo, quando o herói
    // dá lugar à comemoração do dia 15).
    effect((onCleanup) => {
      if (typeof IntersectionObserver === 'undefined') return;

      // A carta do herói é o alvo certo: é a saída dela do topo que manda o
      // cabeçalho entrar. A busca no DOM cobre o caso de a referência não
      // chegar pela entrada — sem ela, sobraria a marca do fim do contador, e
      // aí o cabeçalho só apareceria muito depois, bem longe da carta.
      const target =
        this.origin() ?? document.querySelector<HTMLElement>('.hero__card') ?? this.sentinel();
      if (!target) return;

      const observer = new IntersectionObserver(
        (entries) => this.onCross(entries[entries.length - 1]),
        { threshold: THRESHOLDS },
      );

      observer.observe(target);
      onCleanup(() => observer.disconnect());
    });
  }

  private onCross(entry: IntersectionObserverEntry): void {
    // `top < 0` separa "já passei por cima" de "ainda nem cheguei lá": nos dois
    // casos o alvo está fora da tela, mas só um deles vale.
    const above = entry.boundingClientRect.top < 0;

    if (!this.pinned() && above && entry.intersectionRatio < PIN_BELOW) {
      // O cabeçalho aparece primeiro e o arremesso vem depois, nesta ordem de
      // propósito: a animação é enfeite, e não pode levar o cabeçalho junto se
      // alguma coisa der errado nela.
      this.pinned.set(true);
      this.throwCard();
      return;
    }

    if (this.pinned() && (!above || entry.intersectionRatio > UNPIN_ABOVE)) {
      // Voltou para o topo no meio do voo: a carta original precisa reaparecer
      // no lugar dela, senão fica um buraco no contador.
      this.endFlight();
      this.pinned.set(false);
    }
  }

  /** Arremessa um clone da carta do herói até o lugar dela no cabeçalho. */
  private throwCard(): void {
    // Um voo por vez: rolar para cima e para baixo depressa chegava a soltar
    // várias cartas ao mesmo tempo, e a que pousasse primeiro revelava a do
    // cabeçalho no meio do voo das outras.
    this.endFlight();

    // Procurados no DOM em vez de por `viewChild`: a consulta de view só tem
    // valor depois que o Angular a resolve, e este retorno de chamada vem do
    // navegador, fora desse ciclo. Aqui o elemento ou existe, ou é nulo.
    const source = this.origin() ?? document.querySelector<HTMLElement>('.hero__card');
    const target = this.host.nativeElement.querySelector<HTMLElement>('.bar__card');

    if (!source || !target || typeof document === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const from = source.getBoundingClientRect();
    // O destino já está no lugar certo mesmo invisível: o cabeçalho só muda de
    // opacidade, nunca de posição — foi por isso que ele não desliza.
    const to = target.getBoundingClientRect();

    // Tamanho de layout, e NÃO o do retângulo delimitador. As duas cartas estão
    // inclinadas, e o retângulo de um elemento girado é maior que ele: usá-lo
    // fazia o clone (que voa sem inclinação) nascer e pousar visivelmente mais
    // gordo que a carta que ele substitui.
    const fromW = source.offsetWidth || from.width;
    const fromH = source.offsetHeight || from.height;
    const toW = target.offsetWidth || to.width;
    if (!fromW || !toW) return;

    // O centro, esse sim, o retângulo dá certo: girar em torno do meio não o move.
    const fromX = from.left + from.width / 2;
    const fromY = from.top + from.height / 2;

    // O invólucro cuida do deslocamento; a carta dentro dele cuida do giro.
    // Separar os dois deixa cada um com a sua curva de tempo: o trajeto
    // desacelera ao chegar, enquanto o giro segue quase constante. Numa
    // animação só, a mesma curva servia aos dois e a carta girava tudo nos
    // primeiros milissegundos e depois se arrastava.
    const flier = document.createElement('div');
    flier.className = 'card-flight';
    flier.setAttribute('aria-hidden', 'true');
    flier.style.cssText = `
      position: fixed;
      left: ${fromX - fromW / 2}px;
      top: ${fromY - fromH / 2}px;
      width: ${fromW}px;
      height: ${fromH}px;
      margin: 0;
      z-index: 45;
      pointer-events: none;
      will-change: transform;
    `;

    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.cssText += `
      position: relative;
      inset: auto;
      width: 100%;
      height: 100%;
      margin: 0;
      rotate: 0deg;
      opacity: 1;
      will-change: transform, filter;
      --tilt-x: 0deg;
      --tilt-y: 0deg;
      /* O clone traz a classe do herói, e com ela a animação de entrada dele,
         que reinicia ao ser inserido no DOM e disputa 'transform' e 'opacity'
         com o voo. Sem calar as duas aqui, a carta fica parada e apagando. */
      animation: none !important;
      transition: none !important;
    `;

    flier.append(clone);
    document.body.append(flier);

    const dx = to.left + to.width / 2 - fromX;
    const dy = to.top + to.height / 2 - fromY;
    const scale = toW / fromW;

    // Enquanto a carta voa, a original some e a do cabeçalho ainda não chegou:
    // assim existe uma carta só na tela, do começo ao fim do movimento.
    source.style.visibility = 'hidden';
    target.style.opacity = '0';

    const travel = flier.animate(
      [
        { transform: 'translate(0, 0) scale(1)' },
        {
          // O arco: a carta sobe um pouco antes de cair no lugar.
          transform: `translate(${dx * 0.45}px, ${dy * 0.32 - 46}px) scale(${(1 + scale) / 2})`,
          offset: 0.5,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: THROW_MS, easing: 'cubic-bezier(0.25, 0.85, 0.35, 1)', fill: 'forwards' },
    );

    const spin = clone.animate(
      [
        // -368° = uma volta inteira mais os 8° em que a carta do cabeçalho
        // descansa. Sem fechar nessa conta, a troca no fim daria um pulo.
        { transform: 'rotate(0deg)', filter: 'drop-shadow(0 0 22px rgba(255, 45, 149, 0.85))' },
        // O brilho se apaga na chegada para encostar no da carta do cabeçalho:
        // com a energia acesa, a troca piscava.
        { transform: 'rotate(-368deg)', filter: 'drop-shadow(0 0 6px rgba(255, 45, 149, 0.3))' },
      ],
      { duration: THROW_MS, easing: 'cubic-bezier(0.2, 0.62, 0.4, 1)', fill: 'forwards' },
    );

    const flight = { travel, spin, flier, source, target };
    this.flight = flight;

    const land = () => {
      if (this.flight !== flight) return;
      this.endFlight();
    };

    travel.finished.then(land, land);
  }

  /**
   * Encerra o voo em curso, se houver, devolvendo as duas cartas ao normal.
   * É seguro chamar a qualquer momento e quantas vezes for.
   */
  private endFlight(): void {
    const flight = this.flight;
    if (!flight) return;

    this.flight = undefined;
    flight.travel.cancel();
    flight.spin.cancel();
    flight.source.style.visibility = '';
    // A carta do cabeçalho aparece no mesmo quadro em que o clone sai: como os
    // dois terminam na mesma posição, tamanho e ângulo, a troca não se vê.
    flight.target.style.opacity = '';
    flight.flier.remove();
  }
}
