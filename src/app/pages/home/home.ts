import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  categories = [
    { icon: 'bi-cup-hot-fill',  label: 'Café Caliente' },
    { icon: 'bi-snow',          label: 'Café Frío'      },
    { icon: 'bi-cup-straw',     label: 'Frappés'        },
    { icon: 'bi-droplet-fill',  label: 'Tés'            },
    { icon: 'bi-cake2-fill',    label: 'Postres'        },
    { icon: 'bi-gift-fill',     label: 'Combos'         },
  ];

  featured = [
    {
      id: '1',
      name: 'Cappuccino Clásico',
      category: 'Café Caliente',
      icon: 'bi-cup-hot-fill',
      price: 22.00,
      description: 'Espresso intenso con leche espumada y toque de canela.',
      image: 'https://images.ctfassets.net/0e6jqcgsrcye/6Dnzkf1ylG7IxDRG9Ez1Ia/0db4f0be1ff6199ae89afa4a0ae26687/How_to_make_a_perfect_cappuccino_at_home.jpg'
    },
    {
      id: '2',
      name: 'Frappé Matcha',
      category: 'Frappés',
      icon: 'bi-cup-straw',
      price: 26.00,
      description: 'Frappé cremoso de té matcha japonés con leche de avena.',
      image: 'https://www.riquisimo.net/wp-content/uploads/sites/11/2025/06/frappuccino-de-matcha.jpg'
    },
    {
      id: '3',
      name: 'Té Matcha Latte',
      category: 'Tés',
      icon: 'bi-droplet-fill',
      price: 24.00,
      description: 'Té matcha japonés con leche vaporizada y espuma suave.',
      image: 'https://cdn.shopify.com/s/files/1/0799/3475/1065/files/Matcha_Latte_con_Leche_de_Avena_480x480.jpg?v=1734452278'
    },
  ];

  benefits = [
    { icon: 'bi-leaf-fill',        title: 'Café Artesanal', desc: 'Granos de origen único, seleccionados y tostados en pequeños lotes.' },
    { icon: 'bi-lightning-fill',   title: 'Entrega Rápida', desc: 'Recibe tu pedido en menos de 30 minutos en toda la ciudad.'          },
    { icon: 'bi-shield-lock-fill', title: 'Pago Seguro',    desc: 'Transacciones 100% seguras con cifrado de extremo a extremo.'        },
    { icon: 'bi-star-fill',        title: 'Alta Calidad',   desc: 'Ingredientes frescos y naturales en cada producto que preparamos.'    },
  ];
}