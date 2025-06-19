/* ----------------------------------------------------------------------------
 * src/components/admin/IconButton.tsx
 * --------------------------------------------------------------------------*/
"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface IconButtonProps {
  icon: LucideIcon;
  tooltip?: string;
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "icon" | "sm" | "default";
  onClick?: () => void;
  asLink?: string;
  className?: string;
}

export function IconButton({
  icon: Icon,
  tooltip,
  variant = "ghost",
  size = "icon",
  onClick,
  asLink,
  className,
}: IconButtonProps) {
  const Btn = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      asChild={!!asLink}
      className={className}
    >
      {asLink ? (
        <Link href={asLink}>
          <Icon className="h-4 w-4" />
        </Link>
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </Button>
  );

  /* ---- com / sem tooltip (Provider embutido) ---- */
  if (!tooltip) return Btn;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>{Btn}</TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
