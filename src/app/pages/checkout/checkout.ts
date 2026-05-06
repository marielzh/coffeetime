import { Component, inject, signal, computed, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { SupabaseService } from '../../services/supabase.service';
import { CartService } from '../../services/cart.service';

type PaymentMethod = 'efectivo' | 'qr';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  supabase       = inject(SupabaseService);
  private cart   = inject(CartService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  items    = this.cart.items;
  total    = this.cart.total;
  loading  = signal(false);
  success  = signal(false);
  errorMsg = signal('');

  name          = signal('');
  phone         = signal('');
  address       = signal('');
  notes         = signal('');
  paymentMethod = signal<PaymentMethod>('efectivo');
  qrScanned     = signal(false);

  // Nueva señal para guardar los datos del comprobante antes de limpiar el carrito
  datosComprobante = signal<any>(null);

  // Mapa
  showMap       = signal(false);
  gpsLoading    = signal(false);
  mapReady      = signal(false);

  private map: any = null;
  private marker: any = null;
  private L: any = null;

  qrImageUrl = 'https://lyqdmjoklxpkyttalqgs.supabase.co/storage/v1/object/public/assets/qrmariel.png';

  delivery   = 5.00;
  grandTotal = computed(() => this.total() + this.delivery);

  ngOnInit() {
    if (this.items().length === 0) {
      this.router.navigate(['/catalogo']);
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  setPayment(method: PaymentMethod) {
    this.paymentMethod.set(method);
    this.qrScanned.set(false);
  }

  removeItem(id: string) {
    this.cart.remove(id);
    if (this.items().length === 0) {
      this.router.navigate(['/catalogo']);
    }
  }

  async toggleMap() {
    this.showMap.set(!this.showMap());
    if (this.showMap()) {
      setTimeout(() => this.initMap(), 100);
    } else {
      if (this.map) {
        this.map.remove();
        this.map = null;
        this.marker = null;
        this.mapReady.set(false);
      }
    }
  }

  private async initMap(lat = -21.5355, lng = -64.7296) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.L) {
      this.L = (window as any)['L'];
    }
    if (!this.L) return;

    const el = document.getElementById('leaflet-map');
    if (!el) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = this.L.map('leaflet-map').setView([lat, lng], 15);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const coffeeIcon = this.L.divIcon({
      className: '',
      html: `<div class="map-pin"><i class="bi bi-geo-alt-fill"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    this.marker = this.L.marker([lat, lng], {
      draggable: true,
      icon: coffeeIcon
    }).addTo(this.map);

    this.marker.on('dragend', async (e: any) => {
      const pos = e.target.getLatLng();
      await this.reverseGeocode(pos.lat, pos.lng);
    });

    this.map.on('click', async (e: any) => {
      this.marker.setLatLng(e.latlng);
      await this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    this.mapReady.set(true);
    await this.reverseGeocode(lat, lng);
  }

  async usarGPS() {
    if (!navigator.geolocation) {
      this.errorMsg.set('Tu navegador no soporta geolocalización.');
      return;
    }
    this.gpsLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!this.showMap()) {
          this.showMap.set(true);
          setTimeout(() => this.initMap(lat, lng), 100);
        } else if (this.map && this.marker) {
          this.map.setView([lat, lng], 17);
          this.marker.setLatLng([lat, lng]);
          await this.reverseGeocode(lat, lng);
        }
        this.gpsLoading.set(false);
      },
      () => {
        this.gpsLoading.set(false);
        this.errorMsg.set('No se pudo obtener tu ubicación.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private async reverseGeocode(lat: number, lng: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();
      if (data && data.display_name) {
        const a = data.address;
        const parts = [
          a.road || a.pedestrian || a.footway || '',
          a.house_number || '',
          a.neighbourhood || a.suburb || a.quarter || '',
          a.city || a.town || a.village || ''
        ].filter(Boolean);
        this.address.set(parts.join(', ') || data.display_name);
      }
    } catch (e) {}
  }

  async confirmarPedido() {
    if (!this.name() || !this.phone() || !this.address()) {
      this.errorMsg.set('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (this.paymentMethod() === 'qr' && !this.qrScanned()) {
      this.errorMsg.set('Por favor confirma que realizaste el pago por QR.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    // 1. Preparamos una copia de los datos para la vista del comprobante
    const infoParaTicket = {
      cliente: this.name(),
      productos: [...this.items()], // Copia para que no se borre al limpiar el carrito
      subtotal: this.total(),
      envio: this.delivery,
      totalFinal: this.grandTotal(),
      fecha: new Date(),
      metodo: this.paymentMethod()
    };

    // 2. Guardamos en Supabase
    const { error } = await this.supabase.createOrder(
      this.grandTotal(),
      this.items(),
      this.notes(),
      this.name(),
      this.phone(),
      this.address(),
      this.paymentMethod()
    );

    if (error) {
      this.errorMsg.set('Error al procesar el pedido. Intenta de nuevo.');
      this.loading.set(false);
    } else {
      // 3. Si todo salió bien, guardamos los datos en la señal y activamos el éxito
      this.datosComprobante.set(infoParaTicket);
      this.cart.clear();
      this.success.set(true);
      this.loading.set(false);
    }
  }

  volverAlMenu() {
    this.router.navigate(['/catalogo']);
  }
}