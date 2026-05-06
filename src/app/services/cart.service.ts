import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((acc, i) => acc + i.quantity, 0));
  readonly total = computed(() => this._items().reduce((acc, i) => acc + i.price * i.quantity, 0));

  add(product: Omit<CartItem, 'quantity'>) {
    const current = this._items();
    const existing = current.find(i => i.id === product.id);
    if (existing) {
      this._items.set(current.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      this._items.set([...current, { ...product, quantity: 1 }]);
    }
  }

  remove(id: string) {
    this._items.set(this._items().filter(i => i.id !== id));
  }

  clear() {
    this._items.set([]);
  }
}