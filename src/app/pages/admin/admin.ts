import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { SupabaseService } from '../../services/supabase.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



Chart.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler);

type AdminTab = 'overview' | 'ventas' | 'productos' | 'clientes' | 'pedidos';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, BaseChartDirective],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  activeTab = signal<AdminTab>('overview');
  loading   = signal(true);

  orders   = signal<any[]>([]);
  profiles = signal<any[]>([]);

  // KPIs
  totalIngresos  = computed(() => this.orders().reduce((s, o) => s + o.total, 0));
  totalPedidos   = computed(() => this.orders().length);
  totalClientes  = computed(() => this.profiles().length);
  ticketPromedio = computed(() =>
    this.totalPedidos() ? this.totalIngresos() / this.totalPedidos() : 0);

  // ── Gráfica 1: Ingresos últimos 14 días (línea) ──
  ingresosLabels: string[] = [];
  ingresosData: ChartData<'line'> = { labels: [], datasets: [] };
  ingresosOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,   // ← AGREGADO
    plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => 'Bs. ' + v } }
    }
  };

  // ── Gráfica 2: Productos más vendidos (barras) ──
  productosData: ChartData<'bar'> = { labels: [], datasets: [] };
  productosOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,   // ← AGREGADO
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  // ── Gráfica 3: Métodos de pago (dona) ──
  pagosData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  pagosOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,   // ← AGREGADO
    plugins: { legend: { position: 'bottom' } }
  };

  // ── Gráfica 4: Clientes nuevos por día (barras) ──
  clientesData: ChartData<'bar'> = { labels: [], datasets: [] };
  clientesOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,   // ← AGREGADO
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

    async ngOnInit() {
    const [ordersRes, profilesRes] = await Promise.all([
      this.supabase.getAllOrders(),
      this.supabase.getAllProfiles()
    ]);
    this.orders.set(ordersRes.data ?? []);
    this.profiles.set(profilesRes.data ?? []);
    this.buildCharts();
    this.loading.set(false);
    this.cdr.detectChanges(); // ← ESTO resuelve el NG0100
  }

  private buildCharts() {
    this.buildIngresosChart();
    this.buildProductosChart();
    this.buildPagosChart();
    this.buildClientesChart();
  }

  private buildIngresosChart() {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    const labels = days.map(d => format(d, 'dd/MM', { locale: es }));
    const totales = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return this.orders()
        .filter(o => o.created_at?.startsWith(dayStr))
        .reduce((s: number, o: any) => s + o.total, 0);
    });
    this.ingresosData = {
      labels,
      datasets: [{
        data: totales,
        borderColor: '#5d4037',
        backgroundColor: 'rgba(93,64,55,0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3e2723',
        pointRadius: 4
      }]
    };
  }

  private buildProductosChart() {
    const conteo: Record<string, number> = {};
    this.orders().forEach(order => {
      (order.items ?? []).forEach((item: any) => {
        conteo[item.name] = (conteo[item.name] ?? 0) + (item.quantity ?? 1);
      });
    });
    const sorted = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);
    this.productosData = {
      labels: sorted.map(([name]) => name),
      datasets: [{
        data: sorted.map(([, qty]) => qty),
        backgroundColor: [
          '#3e2723','#5d4037','#795548','#8d6e63',
          '#a1887f','#bcaaa4','#d7ccc8','#efebe9'
        ]
      }]
    };
  }

  private buildPagosChart() {
    const efectivo = this.orders().filter(o => o.payment_method === 'efectivo').length;
    const qr       = this.orders().filter(o => o.payment_method === 'qr').length;
    this.pagosData = {
      labels: ['Efectivo', 'QR BancoSol'],
      datasets: [{
        data: [efectivo, qr],
        backgroundColor: ['#5d4037', '#a1887f'],
        borderWidth: 0
      }]
    };
  }

  private buildClientesChart() {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    const labels = days.map(d => format(d, 'dd/MM', { locale: es }));
    const counts = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return this.profiles().filter(p => p.created_at?.startsWith(dayStr)).length;
    });
    this.clientesData = {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: '#a1887f',
        borderRadius: 6
      }]
    };
  }

  setTab(tab: AdminTab) { this.activeTab.set(tab); }

  exportarPDF() {
    const doc = new jsPDF();
    const fecha = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

    doc.setFontSize(20);
    doc.setTextColor(62, 39, 35);
    doc.text('CoffeeTime — Reporte de Admin', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120, 100, 90);
    doc.text(`Generado: ${fecha}`, 14, 28);

    doc.setFontSize(13);
    doc.setTextColor(62, 39, 35);
    doc.text('Resumen General', 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total ingresos', `Bs. ${this.totalIngresos().toFixed(2)}`],
        ['Total pedidos',  `${this.totalPedidos()}`],
        ['Clientes registrados', `${this.totalClientes()}`],
        ['Ticket promedio', `Bs. ${this.ticketPromedio().toFixed(2)}`]
      ],
      headStyles: { fillColor: [62, 39, 35] },
      alternateRowStyles: { fillColor: [253, 248, 240] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Pedidos Recientes', 14, finalY);
    autoTable(doc, {
      startY: finalY + 4,
      head: [['Fecha', 'Cliente', 'Total', 'Pago', 'Estado']],
      body: this.orders().slice(0, 20).map(o => [
        format(parseISO(o.created_at), 'dd/MM/yyyy', { locale: es }),
        o.name ?? '—',
        `Bs. ${o.total?.toFixed(2)}`,
        o.payment_method ?? '—',
        o.status ?? '—'
      ]),
      headStyles: { fillColor: [93, 64, 55] },
      alternateRowStyles: { fillColor: [253, 248, 240] }
    });

    doc.save(`coffeetime-reporte-${format(new Date(), 'yyyyMMdd')}.pdf`);
  }
  



  async updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await this.supabase.updateOrderStatus(orderId, newStatus);
    if (error) { console.error(error); return; }

    this.orders.update(list =>
      list.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  }

  async deleteOrder(orderId: string) {
    if (!confirm('¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.')) return;

    const { error } = await this.supabase.deleteOrder(orderId);
    if (error) { console.error(error); return; }

    this.orders.update(list => list.filter(o => o.id !== orderId));
  }
}