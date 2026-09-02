import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClockService } from '../../../core/services/clock.service';
import { GiftEventsStore } from '../../../core/state/gift-events.store';
import { DAY_MS } from '../../../core/utils/time.util';
import { AdminPanel } from './admin-panel';

describe('AdminPanel', () => {
  let fixture: ComponentFixture<AdminPanel>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AdminPanel] }).compileComponents();
    TestBed.inject(GiftEventsStore).restoreDefaults();
    TestBed.inject(ClockService).travelTo(null);

    fixture = TestBed.createComponent(AdminPanel);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('lista as cartas cadastradas', () => {
    expect(host.querySelectorAll('.list__item').length).toBe(
      TestBed.inject(GiftEventsStore).views().length,
    );
  });

  it('adia o relógio simulado em um dia', () => {
    const clock = TestBed.inject(ClockService);
    const before = clock.now();

    const jumpButton = [...host.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '+1 dia',
    );
    jumpButton!.click();
    fixture.detectChanges();

    expect(clock.now() - before).toBeGreaterThanOrEqual(DAY_MS - 1000);
    expect(clock.timeTravelling()).toBe(true);
  });

  it('só habilita salvar depois que a carta ganha um título', () => {
    const save = [...host.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Adicionar',
    ) as HTMLButtonElement;

    expect(save.disabled).toBe(true);

    fixture.componentInstance['patch']({ title: 'Uma carta nova' });
    fixture.detectChanges();

    expect(save.disabled).toBe(false);
  });
});
