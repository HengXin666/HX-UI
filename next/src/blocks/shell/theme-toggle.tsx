import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeAccent } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const ACCENTS: { id: ThemeAccent; label: string; swatch: string }[] = [
  { id: "indigo", label: "靛蓝", swatch: "oklch(0.58 0.2 275)" },
  { id: "emerald", label: "翠绿", swatch: "oklch(0.62 0.15 160)" },
  { id: "rose", label: "玫红", swatch: "oklch(0.62 0.21 12)" },
  { id: "amber", label: "琥珀", swatch: "oklch(0.72 0.16 65)" },
  { id: "zinc", label: "石墨", swatch: "oklch(0.45 0.01 270)" },
];

/** 亮暗 + 强调色切换. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, resolved, accent, setMode, setAccent } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-9", className)} aria-label="切换主题">
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">外观</DropdownMenuLabel>
        {([["light", "亮色", Sun], ["dark", "暗色", Moon], ["system", "跟随系统", Monitor]] as const).map(([m, label, I]) => (
          <DropdownMenuItem key={m} onSelect={() => setMode(m)} className={cn(mode === m && "bg-accent")}>
            <I className="size-4" /> {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">强调色</DropdownMenuLabel>
        <div className="flex gap-2 px-2 pb-2 pt-1">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-label={a.label}
              title={a.label}
              onClick={() => setAccent(a.id)}
              className={cn("size-6 rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110", accent === a.id && "ring-2 ring-foreground")}
              style={{ background: a.swatch }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
