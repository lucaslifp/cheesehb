"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ShoppingBasket,
  Pizza,
  Layers,
  Box,
  Users,
  ClipboardList,
  LogOut,
  DollarSign,
  Palette,
  Clock,
  Truck,
  CircleDot,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ComponentType, SVGProps } from "react";

/* ---------- Tipagem e itens ---------- */
interface MenuItem {
  href?: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isTitle?: boolean;
  disabled?: boolean;
}

const menuItems: MenuItem[] = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/faturamento", label: "Faturamento", icon: DollarSign },

  { label: "Operações", isTitle: true, icon: Home },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: Users },

  { label: "Cardápio", isTitle: true, icon: Home },
  { href: "/admin/produtos", label: "Produtos", icon: ShoppingBasket },
  { href: "/admin/categorias", label: "Categorias", icon: Layers },
  { href: "/admin/pizzas", label: "Pizza Meio a Meio", icon: Pizza },

  /* ▼ sub-itens recuados (indent = pl-6) */
  {
    href: "/admin/pizzas/sabores-pizza",
    label: "Sabores da Pizza",
    icon: CircleDot,
  },
  {
    href: "/admin/pizzas/bordas-pizza",
    label: "Bordas da Pizza",
    icon: CircleDot,
  },

  {
    href: "/admin/extras-e-combos",
    label: "Extras & Combos (Grupos)",
    icon: Box,
  },

  { label: "Logística e Entrega", isTitle: true, icon: Home },
  { href: "/admin/bairros-e-frete", label: "Bairros e Frete", icon: Truck },

  { label: "Sistema", isTitle: true, icon: Home },
  {
    href: "/admin/configuracoes",
    label: "Horário de Funcionamento",
    icon: Clock,
  },
  { href: "/admin/personalizar", label: "Personalizar Loja", icon: Palette },
];

/* ---------- Componente ---------- */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("isAdminLoggedIn");
    toast({ title: "Logout realizado", description: "Você foi desconectado." });
    router.push("/admin/login");
  }

  return (
    <TooltipProvider delayDuration={100}>
      <ScrollArea className="h-full bg-sidebar text-sidebar-foreground p-4 border-r border-sidebar-border">
        <div className="flex flex-col h-full space-y-2">
          {/* ---------- Logo ---------- */}
          <Link href="/admin" className="mb-4 block">
            <h2 className="text-2xl font-headline font-semibold text-sidebar-primary flex items-center">
              <MapPin className="mr-2 h-6 w-6" />
              Admin&nbsp;CheesePizza
            </h2>
          </Link>

          {/* ---------- Navegação ---------- */}
          <nav className="flex flex-col space-y-1 flex-grow">
            {menuItems.map((item, i) => {
              /* Títulos de seção */
              if (item.isTitle) {
                return (
                  <h3
                    key={"title-" + i}
                    className="px-2 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {item.label}
                  </h3>
                );
              }

              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href!));

              const needsIndent =
                item.label.startsWith("Sabores") ||
                item.label.startsWith("Bordas");

              const button = (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  asChild
                  className={cn(
                    "w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                    needsIndent && "pl-6",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={item.disabled}
                >
                  <Link href={item.href!} prefetch={false}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );

              /* Se estiver desativado, envolve em Tooltip */
              return item.disabled ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Funcionalidade em breve</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                button
              );
            })}
          </nav>

          {/* ---------- Logout ---------- */}
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
