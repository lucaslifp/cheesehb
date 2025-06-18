// src/components/admin/IconButton.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconButtonProps = React.ComponentProps<typeof Button> & {
  /** ícone (Lucide ou qualquer ReactNode) */
  icon: React.ReactNode;
  /** texto mostrado no tooltip */
  label: string;
  /** cor alternativa (destructive) */
  destructive?: boolean;
};

/**
 * Botão redondinho apenas‐ícone com tooltip.
 *
 * Exemplo de uso:
 * ```tsx
 * <IconButton
 *   icon={<Trash className="h-4 w-4" />}
 *   label="Excluir item"
 *   destructive
 *   onClick={handleDelete}
 * />
 * ```
 */
export function IconButton({
  icon,
  label,
  destructive,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={
              destructive
                ? `text-destructive hover:bg-destructive/10 ${className ?? ""}`
                : className
            }
            {...rest}
          >
            {icon}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
