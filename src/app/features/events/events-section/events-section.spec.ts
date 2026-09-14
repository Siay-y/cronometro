import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClockService } from '../../../core/services/clock.service';
import { GiftEventsStore } from '../../../core/state/gift-events.store';
import { EventsSection } from './events-section';

describe('EventsSection', () => {
  let fixture: ComponentFixture<EventsSection>;
  let host: HTMLElement;
  let clock: ClockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventsSection] }).compileComponents();

    clock = TestBed.inject(ClockService);
    TestBed.inject(GiftEventsStore).restoreDefaults();
    fixture = TestBed.createComponent(EventsSection);
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    clock.travelTo(null);
    TestBed.inject(GiftEventsStore).clearOpened();
  });

  function at(when: string): void {
    clock.travelTo(new Date(when));
    fixture.detectChanges();
  }

  /** Abre a carta das 23:00 (já disponível) pelo teclado: um clique só. */
  function openLastHourCard(): void {
    const card = [...host.querySelectorAll('app-event-card')].find((item) =>
      item.textContent?.includes('meia-noite'),
    );
    (card?.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('fecha o presente aberto quando a contagem final começa', () => {
    at('2026-09-14T23:30:00.500');
    openLastHourCard();
    expect(host.querySelector('app-event-reveal')).toBeTruthy();

    at('2026-09-14T23:58:00.500');
    expect(host.querySelector('app-event-reveal')).toBeTruthy();

    at('2026-09-14T23:59:52.500');
    expect(host.querySelector('app-event-reveal')).toBeNull();
  });
});
