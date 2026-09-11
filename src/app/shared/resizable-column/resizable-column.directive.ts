import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';

@Directive({
  selector: '[appResizableColumn]',
  standalone: true,
})
export class ResizableColumnDirective implements OnInit {
  @Input('appResizableColumn') columnName!: string;
  @Input() minWidth: number = 60;

  private startX = 0;
  private startWidth = 0;
  private resizer!: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const headerCell = this.el.nativeElement as HTMLElement;

    // Force position relative on header cell
    this.renderer.setStyle(
      headerCell,
      'position',
      'relative',
      RendererStyleFlags2.Important
    );

    // Create drag handle
    this.resizer = this.renderer.createElement('div');
    this.renderer.addClass(this.resizer, 'resize-handle');

    // Force inline styles on handle so CSS specificity never blocks mouse cursor
    this.renderer.setStyle(
      this.resizer,
      'position',
      'absolute',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'top',
      '0',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'right',
      '0',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'width',
      '12px',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'height',
      '100%',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'cursor',
      'col-resize',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'z-index',
      '99999',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      this.resizer,
      'pointer-events',
      'auto',
      RendererStyleFlags2.Important
    );

    this.renderer.appendChild(headerCell, this.resizer);

    // Prevent sort action on click
    this.renderer.listen(this.resizer, 'click', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    });

    // Handle Mousedown & Drag
    this.renderer.listen(this.resizer, 'mousedown', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      this.startX = event.clientX;
      this.startWidth = headerCell.offsetWidth;

      // Find table dynamically at runtime when user drags
      const table = (headerCell.closest('.audit-table') ||
        headerCell.closest('mat-table') ||
        headerCell.closest('table')) as HTMLElement;

      if (!table) return;

      // Get ALL cells (header + body) belonging to this column
      const colClass = `mat-column-${this.columnName}`;
      const mdcColClass = `mat-mdc-column-${this.columnName}`;
      const columnCells = Array.from(
        table.querySelectorAll(`.${colClass}, .${mdcColClass}`)
      ) as HTMLElement[];

      this.renderer.addClass(document.body, 'resizing');

      const mouseMoveUnlisten = this.renderer.listen(
        'document',
        'mousemove',
        (e: MouseEvent) => {
          const deltaX = e.clientX - this.startX;
          const newWidth = Math.max(this.minWidth, this.startWidth + deltaX);

          // Apply width directly to all column cells with !important
          columnCells.forEach((cell) => {
            cell.style.setProperty('width', `${newWidth}px`, 'important');
            cell.style.setProperty('flex', `0 0 ${newWidth}px`, 'important');
            cell.style.setProperty('max-width', `${newWidth}px`, 'important');
            cell.style.setProperty('min-width', `${newWidth}px`, 'important');
          });
        }
      );

      const mouseUpUnlisten = this.renderer.listen(
        'document',
        'mouseup',
        () => {
          this.renderer.removeClass(document.body, 'resizing');
          mouseMoveUnlisten();
          mouseUpUnlisten();
        }
      );
    });
  }
}