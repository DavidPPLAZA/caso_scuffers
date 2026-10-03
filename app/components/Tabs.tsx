"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Ventas" },
  { href: "/canales", label: "Canales" },
  { href: "/productos", label: "Productos" },
];

export default function Tabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-stone-300">
      {items.map((i) => {
        const activa = pathname === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activa
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}