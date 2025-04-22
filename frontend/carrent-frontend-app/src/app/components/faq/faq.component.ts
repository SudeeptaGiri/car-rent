import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: false,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class FaqComponent implements OnInit {
  faqItems: FaqItem[] = [];
  expandedId: number | null = 1; // First item expanded by default
  loading: boolean = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<FaqItem[]>('assets/data/faq-items.json').subscribe({
      next: (data) => {
        this.faqItems = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading FAQ items:', err);
        this.error = 'Failed to load FAQ items. Please try again later.';
        this.loading = false;
      }
    });
  }

  toggleItem(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  isExpanded(id: number): boolean {
    return this.expandedId === id;
  }

  getItemState(id: number): string {
    return this.isExpanded(id) ? 'expanded' : 'collapsed';
  }
}