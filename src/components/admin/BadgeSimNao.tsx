// src/components/admin/BadgeSimNao.tsx
import React from "react";

/**
 * Chip "Sim / Não" usado em várias tabelas do Admin.
 * Recebe um booleano e mostra a cor certa.
 */
export function BadgeSimNao({ value }: { value: boolean }) {
  return (
    <span
      className={
        value
          ? "inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700"
          : "inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground"
      }
    >
      {value ? "Sim" : "Não"}
    </span>
  );
}
