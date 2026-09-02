import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon, IconName } from './icon';

describe('Icon', () => {
  let fixture: ComponentFixture<Icon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Icon] }).compileComponents();
    fixture = TestBed.createComponent(Icon);
  });

  function render(name: IconName): HTMLElement {
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('cria os traços no namespace do SVG (senão o navegador não desenha nada)', () => {
    const paths = render('lock').querySelectorAll('path');

    expect(paths.length).toBe(3);
    expect(paths[0].namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(paths[0].getAttribute('d')).toContain('M8.2 10.6');
  });

  it('herda a cor do texto ao redor', () => {
    const svg = render('letter').querySelector('svg')!;

    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('fill')).toBe('none');
  });

  it('desenha o brilho como forma sólida', () => {
    const svg = render('spark').querySelector('svg')!;

    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('stroke')).toBe('none');
  });
});
