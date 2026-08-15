import type { DashboardNewsItem } from "@lifeos/contracts";
import { ExternalLink } from "lucide-react";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { openExternalUrl } from "../../../lib/openExternal.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface NewsWidgetProps {
  items: DashboardNewsItem[];
}

export function NewsWidget({ items }: NewsWidgetProps) {
  return (
    <DashboardPanel title="Catch-up" subtitle="tech news">
      <div className="flex flex-col h-full overflow-y-auto justify-center">
        {items.length === 0 ? (
          <EmptyState title="No news articles fetched" className="py-4" />
        ) : (
          <div className="flex flex-col divide-y divide-border/40 my-auto">
            {items.slice(0, 4).map((n) => (
              <a
                key={n.id}
                href={n.url}
                onClick={(e) => {
                  e.preventDefault();
                  openExternalUrl(n.url);
                }}
                className="py-1.5 px-1 group hover:bg-card-hover/40 rounded transition-colors flex items-start justify-between gap-1.5 cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-accent/90 mr-1.5 font-semibold">
                    [{n.source}]
                  </span>
                  <span className="text-[12px] text-primary group-hover:text-primary leading-snug line-clamp-2">
                    {n.title}
                  </span>
                </div>
                <ExternalLink
                  size={11}
                  className="text-muted group-hover:text-accent shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
