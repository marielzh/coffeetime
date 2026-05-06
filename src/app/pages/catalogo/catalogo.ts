import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { SupabaseService, Product } from '../../services/supabase.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  supabase       = inject(SupabaseService);
  private cart   = inject(CartService);
  private router = inject(Router);

  products       = signal<Product[]>([]);
  loading        = signal(true);
  activeCategory = signal('Todos');
  addedId        = signal<string | null>(null);
  searchQuery    = signal('');
  linkCopied     = signal(false);

  categories = [
    { icon: 'bi-grid-fill',      label: 'Todos'         },
    { icon: 'bi-cup-hot-fill',   label: 'Café Caliente' },
    { icon: 'bi-snow',           label: 'Café Frío'     },
    { icon: 'bi-cake2-fill',     label: 'Postres'       },
    { icon: 'bi-gift-fill',      label: 'Combos'        },
    { icon: 'bi-cup-straw',      label: 'Frappés'       },
    { icon: 'bi-droplet-fill',   label: 'Tés'           },
    ];

  categoryIcons: Record<string, string> = {
    'Café Caliente': 'bi-cup-hot-fill',
    'Café Frío':     'bi-snow',
    'Postres':       'bi-cake2-fill',
    'Combos':        'bi-gift-fill',
    'Frappés':       'bi-cup-straw',
    'Tés':           'bi-droplet-fill',
  };

  filtered = computed(() => {
    let list = this.products();
    if (this.activeCategory() !== 'Todos') {
      list = list.filter(p => p.category === this.activeCategory());
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  async ngOnInit() {
    this.loading.set(true);
    const { data } = await this.supabase.getProducts();
    this.products.set(data ?? []);
    this.loading.set(false);
  }

  setCategory(cat: string) {
    this.activeCategory.set(cat);
    this.searchQuery.set('');
  }

  clearSearch() { this.searchQuery.set(''); }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] ?? 'bi-cup-hot-fill';
  }

  getCategoryCount(label: string): number {
    if (label === 'Todos') return this.products().length;
    return this.products().filter(p => p.category === label).length;
  }

  addToCart(product: Product) {
    if (!this.supabase.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/catalogo' } });
      return;
    }
    this.cart.add({
      id:    product.id,
      name:  product.name,
      price: product.price,
      image: product.image_url ?? ''
    });
    this.addedId.set(product.id);
    setTimeout(() => this.addedId.set(null), 1500);
  }

  isInCart(id: string) {
    return this.cart.items().some(i => i.id === id);
  }

  copyMenuLink() {
    const url = `${window.location.origin}/catalogo`;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    });
  }

  whatsappShare(): string {
    const url  = `${window.location.origin}/catalogo`;
    const text = encodeURIComponent(`☕ Mira el menú de CoffeeTime: ${url}`);
    return `https://wa.me/?text=${text}`;
  }
  // Navegar a login sin RouterLink
  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/catalogo' } });
  }

  // Imagen rota — fallback
  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80';
  }
}