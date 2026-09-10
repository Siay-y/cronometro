import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { SealedLetter } from '../../../core/models/gift-event.model';
import { LetterEnvelope } from './letter-envelope';
import { LetterReply } from '../letter-reply/letter-reply';

const UNSEAL_MS = 860;
const RISE_MS = 900;

const LETTER: SealedLetter = {
  cta: 'Abrir a carta',
  body: 'Primeiro parágrafo.\n\nSegundo parágrafo.\n\nTerceiro parágrafo.',
  closing: 'Sempre teu,',
  signature: 'Gambit',
};

describe('LetterEnvelope', () => {
  let fixture: ComponentFixture<LetterEnvelope>;
  let host: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({ imports: [LetterEnvelope] }).compileComponents();

    fixture = TestBed.createComponent(LetterEnvelope);
    fixture.componentRef.setInput('letter', LETTER);
    fixture.detectChanges();

    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function button(): HTMLButtonElement {
    return host.querySelector('.unseal') as HTMLButtonElement;
  }

  function sheet(): HTMLElement | null {
    return host.querySelector('.sheet');
  }

  function advance(ms: number): void {
    vi.advanceTimersByTime(ms);
    fixture.detectChanges();
  }

  /** Aperta o botão e espera o lacre, a aba e a subida do papel. */
  function openIt(): void {
    button().click();
    advance(UNSEAL_MS + RISE_MS);
  }

  it('começa lacrada, sem entregar nada do que está escrito', () => {
    expect(host.querySelector('.envelope')).toBeTruthy();
    expect(button().textContent).toContain('Abrir a carta');
    expect(sheet()).toBeNull();
    expect(host.textContent).not.toContain('Primeiro parágrafo');
  });

  it('quebra o lacre e levanta a aba no primeiro toque', () => {
    button().click();
    fixture.detectChanges();

    expect(host.classList.contains('is-unsealed')).toBe(true);
    // A aba mal levantou: o papel ainda está dentro e o texto, escondido.
    expect(host.classList.contains('is-rising')).toBe(false);
    expect(sheet()).toBeNull();
  });

  it('só puxa o papel depois que a aba termina de abrir', () => {
    button().click();
    advance(UNSEAL_MS);

    expect(host.classList.contains('is-rising')).toBe(true);
    expect(sheet()).toBeNull();
  });

  it('abre a folha grande com tudo o que estava escrito', () => {
    openIt();

    const paragraphs = [...host.querySelectorAll('.sheet p')].map((p) => p.textContent?.trim());

    expect(sheet()).toBeTruthy();
    expect(paragraphs).toContain('Primeiro parágrafo.');
    expect(paragraphs).toContain('Terceiro parágrafo.');
    expect(host.textContent).toContain('Sempre teu,');
  });

  it('assina o Gambit no fim da folha, e não no meio', () => {
    openIt();

    const sign = sheet()!.lastElementChild as HTMLElement;

    expect(sign.classList.contains('sheet__sign')).toBe(true);
    expect(sign.textContent).toContain('Gambit');
    expect(sign.querySelector('svg')).toBeTruthy();
  });

  it('recolhe o envelope quando a folha toma o lugar dele', () => {
    openIt();

    expect(host.querySelector('.envelope')).toBeNull();
    expect(host.querySelector('.unseal')).toBeNull();
  });

  it('escreve a tinta de cima para baixo, o fecho depois do texto', () => {
    openIt();

    const closing = host.querySelector<HTMLElement>('.sheet__closing')!;
    const sign = host.querySelector<HTMLElement>('.sheet__sign')!;

    // Três parágrafos: 420 + 3 * 180.
    expect(closing.style.animationDelay).toBe('960ms');
    expect(sign.style.animationDelay).toBe('1140ms');
    // O floreio da assinatura vem por último, com a tinta já na folha.
    expect(host.querySelector<HTMLElement>('.sheet__flourish path')!.style.animationDelay).toBe(
      '1380ms',
    );
  });

  it('escreve o nome e só depois carimba o espadilha', () => {
    openIt();

    const name = host.querySelector<HTMLElement>('.sign__name')!;
    const swash = host.querySelector<HTMLElement>('.flourish__swash')!;
    const spade = host.querySelector<HTMLElement>('.flourish__spade')!;

    expect(name.textContent?.trim()).toBe('Gambit');
    // Nome, floreio e carimbo, nessa ordem, um esperando o outro.
    expect(name.style.animationDelay).toBe('1140ms');
    expect(swash.style.animationDelay).toBe('1380ms');
    expect(spade.style.animationDelay).toBe('2020ms');
  });

  it('ignora o segundo toque: uma abertura só, do começo ao fim', () => {
    button().click();
    fixture.detectChanges();
    button().click();
    advance(UNSEAL_MS + RISE_MS);

    expect(host.querySelectorAll('.sheet').length).toBe(1);
  });

  it('entrega a carta aberta a quem pediu menos movimento', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    button().click();
    fixture.detectChanges();

    // Sem esperar nada: a encenação não pode virar pedágio para o conteúdo.
    expect(sheet()).toBeTruthy();
    expect(host.textContent).toContain('Primeiro parágrafo.');
  });

  it('não monta álbum nenhum numa carta sem fotos', () => {
    openIt();

    expect(host.querySelector('.album')).toBeNull();
  });

  it('empilha as fotos do envelope e passa uma para o fim a cada toque', () => {
    fixture.componentRef.setInput('letter', {
      ...LETTER,
      photos: [
        { src: '/fotos/a.jpg', alt: 'A', caption: 'primeira' },
        { src: '/fotos/b.jpg', alt: 'B', caption: 'segunda' },
        { src: '/fotos/c.jpg', alt: 'C', caption: 'terceira' },
      ],
    });
    openIt();

    const frames = () => [...host.querySelectorAll<HTMLElement>('.album__frame')];

    expect(frames().length).toBe(3);
    expect(frames()[0].classList.contains('is-top')).toBe(true);
    expect(host.querySelector('.album__caption')!.textContent).toContain('primeira');

    (host.querySelector('.album__stack') as HTMLElement).click();
    fixture.detectChanges();

    // A de cima foi para o fim da pilha e a seguinte assumiu.
    expect(frames()[0].classList.contains('is-top')).toBe(false);
    expect(frames()[1].classList.contains('is-top')).toBe(true);
    expect(host.querySelector('.album__caption')!.textContent).toContain('segunda');
  });

  it('tira da pilha, em silêncio, a foto cujo arquivo não existe', () => {
    fixture.componentRef.setInput('letter', {
      ...LETTER,
      photos: [
        { src: '/fotos/a.jpg', alt: 'A' },
        { src: '/fotos/sumiu.jpg', alt: 'B' },
      ],
    });
    openIt();

    host.querySelectorAll('img')[1].dispatchEvent(new Event('error'));
    fixture.detectChanges();

    // Sobra uma foto só, e nenhum ícone de imagem quebrada no meio da carta.
    expect(host.querySelectorAll('.album__frame').length).toBe(1);
    expect(host.querySelector('.album__count')).toBeNull();
  });

  it('não convida ninguém a responder quando a carta não pede resposta', () => {
    openIt();

    expect(host.querySelector('app-letter-reply')).toBeNull();
  });

  it('fecha a carta e avisa quando o textinho dela vai embora', () => {
    fixture.componentRef.setInput('letter', {
      ...LETTER,
      reply: { invite: 'Sua vez.', placeholder: '...' },
    });
    openIt();

    const reply = fixture.debugElement.query(By.directive(LetterReply))
      .componentInstance as LetterReply;

    expect(reply).toBeTruthy();
    reply.sent.emit();
    fixture.detectChanges();

    expect(host.querySelector('.posted')).toBeTruthy();
    // Frouxo de propósito: o texto do aviso é seu para reescrever.
    expect(host.textContent).toContain('Textinho enviado');
    expect(host.textContent).toContain('ler com muito carinho');
  });

  it('não deixa temporizador solto se ela fechar no meio da abertura', () => {
    button().click();
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
});
