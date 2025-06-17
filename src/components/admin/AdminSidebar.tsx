
"use client";

import { MapPin } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingBasket, Pizza, Layers, Box, Settings, Users, ListChecks, ClipboardList, LogOut, Printer, DollarSign, Palette, Database, Clock, Truck, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ComponentType, SVGProps } from 'react';

interface MenuItem {
  href?: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isTitle?: boolean;
  disabled?: boolean; 
}


const menuItems: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/faturamento', label: 'Faturamento', icon: DollarSign },
  {
    label: 'Operações',
    isTitle: true,
    icon: Home, 
  },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  {
    label: 'Cardápio',
    isTitle: true,
    icon: Home, 
  },
  { href: '/admin/produtos', label: 'Produtos', icon: ShoppingBasket },
  { href: '/admin/categorias', label: 'Categorias', icon: Layers },
  { href: '/admin/pizzas', label: 'Pizza Meio a Meio', icon: Pizza },
  { href: '/admin/extras-e-combos', label: 'Extras & Combos (Grupos)', icon: Box },
  {
    label: 'Logística e Entrega',
    isTitle: true,
    icon: Home, 
  },
  { href: '/admin/bairros-e-frete', label: 'Bairros e Frete', icon: Truck },
  {
    label: 'Sistema',
    isTitle: true,
    icon: Home, 
  },
  { href: '/admin/configuracoes', label: 'Horário de Funcionamento', icon: Clock },
  { href: '/admin/personalizar', label: 'Personalizar Loja', icon: Palette },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminLoggedIn');
    }
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado do painel.',
    });
    router.push('/admin/login');
  };

  return (
    <TooltipProvider delayDuration={100}>
      <ScrollArea className="h-full bg-sidebar text-sidebar-foreground p-4 border-r border-sidebar-border">
        <div className="flex flex-col space-y-2 h-full">
          <div className="flex-grow">
            <Link href="/admin" className="mb-4 block">
              <h2 className="text-2xl font-headline font-semibold text-sidebar-primary flex items-center">
                <MapPin className="mr-2 h-6 w-6" /> Admin CheesePizza
              </h2>
            </Link>
            <nav className="flex flex-col space-y-1">
              {menuItems.map((item, index) => {
                if (item.isTitle) {
                  return (
                    <h3 key={index} className="px-2 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </h3>
                  );
                }

                let isDisabled = item.disabled || false;
                let tooltipMessage = item.disabled ? "Funcionalidade em breve." : null;

                const menuItemContent = (
                  <Button
                    key={item.href}
                    variant={pathname === item.href || (pathname.startsWith(item.href!) && item.href !== '/admin') ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      (pathname === item.href || (pathname.startsWith(item.href!) && item.href !== '/admin')) && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={isDisabled}
                    asChild
                  >
                    <Link href={item.href!} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                      {item.disabled && <span className="ml-auto text-xs text-muted-foreground">(Em breve)</span>}
                    </Link>
                  </Button>
                );

                if (isDisabled && tooltipMessage) {
                  return (
                    <Tooltip key={`${item.href}-tooltip`}>
                      <TooltipTrigger asChild>
                        <div className={cn(isDisabled && "cursor-not-allowed")}>{menuItemContent}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p>{tooltipMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return menuItemContent;
              })}
            </nav>
          </div>
          <div className="mt-auto pt-4 border-t border-sidebar-border">
              <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  onClick={handleLogout}
              >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
              </Button>
          </div>
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
