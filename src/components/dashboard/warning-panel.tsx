import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WarningPanel({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 text-amber-600 dark:text-amber-200" size={20} />
        <div>
          <h2 className="font-display text-sm font-bold text-amber-900 dark:text-amber-100">Advertencias de integracion</h2>
          <div className="mt-2 grid gap-1 text-sm text-amber-800 dark:text-amber-100/80">
            {warnings.slice(0, 6).map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
