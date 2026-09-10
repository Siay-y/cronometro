import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ReplyInvite } from '../../../core/models/gift-event.model';
import { LetterReply } from './letter-reply';

const SEAL_MS = 1200;

const INVITE: ReplyInvite = {
  invite: 'E agora é a sua vez.',
  placeholder: 'pode ser uma linha só...',
};

describe('LetterReply', () => {
  let fixture: ComponentFixture<LetterReply>;
  let host: HTMLElement;

  async function mount(): Promise<void> {
    await TestBed.configureTestingModule({ imports: [LetterReply] }).compileComponents();

    fixture = TestBed.createComponent(LetterReply);
    fixture.componentRef.setInput('invite', INVITE);
    fixture.componentRef.setInput('storageKey', 'gift-teste');
    fixture.detectChanges();

    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    await mount();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  function field(): HTMLTextAreaElement {
    return host.querySelector('.reply__text') as HTMLTextAreaElement;
  }

  function wax(): HTMLButtonElement {
    return host.querySelector('.wax') as HTMLButtonElement;
  }

  function type(value: string): void {
    field().value = value;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function stamp(): void {
    (host.querySelector('.stamp') as HTMLElement).click();
    fixture.detectChanges();
  }

  /** Segura o lacre até a cera fechar. */
  function seal(): void {
    wax().dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(SEAL_MS);
    fixture.detectChanges();
  }

  it('abre com a folha em branco e o convite dela', () => {
    expect(host.textContent).toContain('E agora é a sua vez.');
    expect(field().value).toBe('');
    expect(wax().disabled).toBe(true);
  });

  it('não deixa lacrar carta vazia', () => {
    type('   ');

    expect(wax().disabled).toBe(true);
    expect(host.textContent).toContain('escreva alguma coisinha primeiro');
  });

  it('guarda o rascunho a cada tecla, para ela terminar depois', () => {
    type('oi, eu');

    expect(localStorage.getItem('mon-cher:resposta:gift-teste')).toContain('oi, eu');
  });

  it('devolve o rascunho guardado quando ela volta', async () => {
    localStorage.setItem('mon-cher:resposta:gift-teste', JSON.stringify('escrevi ontem'));
    TestBed.resetTestingModule();
    await mount();

    expect(field().value).toBe('escrevi ontem');
  });

  it('conta as palavras enquanto ela escreve', () => {
    type('uma palavra só');

    expect(host.querySelector('.reply__count')!.textContent).toContain('3 palavras');
  });

  it('lacra quando ela segura a cera até o fim', () => {
    type('eu também te amo');
    seal();

    expect(host.classList.contains('is-sealed')).toBe(true);
    expect(host.textContent).toContain('Lacrada');
    expect(host.querySelector('.done__preview')!.textContent).toContain('eu também te amo');
  });

  it('esfria a cera se ela soltar antes da hora', () => {
    type('eu também te amo');
    wax().dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(SEAL_MS - 300);
    wax().dispatchEvent(new Event('pointerup'));
    vi.advanceTimersByTime(3000);
    fixture.detectChanges();

    expect(host.classList.contains('is-sealed')).toBe(false);
    expect(field()).toBeTruthy();
  });

  it('não manda o textinho para lugar nenhum fora do aparelho dela', () => {
    type('eu também');
    seal();

    // Nada de link para fora: o selo é um botão, e o texto fica guardado aqui.
    expect(host.querySelector('a')).toBeNull();
    expect(host.innerHTML).not.toContain('wa.me');
  });

  it('bate o carimbo no selo e só depois avisa que o textinho foi', () => {
    type('eu também te amo');
    seal();

    let sent = 0;
    fixture.componentInstance.sent.subscribe(() => sent++);
    stamp();

    // O carimbo bate na hora; o aviso espera ele secar.
    expect(host.querySelector('.stamp')!.classList.contains('is-stamped')).toBe(true);
    expect(sent).toBe(0);

    vi.advanceTimersByTime(620);
    fixture.detectChanges();

    expect(sent).toBe(1);
    expect(localStorage.getItem('mon-cher:resposta-enviada:gift-teste')).toBe('true');
  });

  it('lembra que o textinho já foi quando ela volta na carta', async () => {
    type('eu também te amo');
    seal();
    stamp();
    vi.advanceTimersByTime(620);

    TestBed.resetTestingModule();
    await mount();

    expect(host.textContent).toContain('já enviado');
    expect(host.querySelector('.stamp')!.classList.contains('is-stamped')).toBe(true);
  });

  it('não tem mais botão de copiar', () => {
    type('eu também');
    seal();

    expect(host.textContent).not.toContain('copiar');
  });

  it('continua lacrada quando ela volta na carta depois', async () => {
    type('eu também');
    seal();

    TestBed.resetTestingModule();
    await mount();

    expect(host.classList.contains('is-sealed')).toBe(true);
  });

  it('deixa ela quebrar o próprio lacre e reescrever', () => {
    type('eu também');
    seal();

    (host.querySelector('.done__reopen') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.classList.contains('is-sealed')).toBe(false);
    // O que ela já tinha escrito continua lá, para continuar de onde parou.
    expect(field().value).toBe('eu também');
  });

  it('lacra direto pelo teclado, sem precisar segurar nada', () => {
    type('eu também');
    // Enter e Espaço disparam `click` sem nenhum `pointerdown` antes.
    wax().click();
    fixture.detectChanges();

    expect(host.classList.contains('is-sealed')).toBe(true);
  });

  it('não deixa temporizador solto se ela fechar no meio do lacre', () => {
    type('eu também');
    wax().dispatchEvent(new Event('pointerdown'));
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
});
