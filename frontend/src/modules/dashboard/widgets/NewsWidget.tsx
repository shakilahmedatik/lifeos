import type { DashboardNewsItem } from "@lifeos/contracts";
import { ExternalLink } from "lucide-react";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface NewsWidgetProps {
  items: DashboardNewsItem[];
}

export function NewsWidget({ items }: NewsWidgetProps) {
  return (
    <DashboardPanel title="Catch-up" subtitle="tech news">
      <div className="flex flex-col h-full overflow-y-auto divide-y divide-border/40">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-muted text-xs py-4">
            No news articles fetched
          </div>
        ) : (
          items.slice(0, 4).map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-0.5 group hover:bg-card-hover/40 rounded transition-colors flex items-start justify-between gap-1.5"
            >
              <div className="min-w-0">
                <span className="font-mono text-[9px] uppercase tracking-widest text-accent/90 mr-1.5 font-semibold">
                  [{n.source}]
                </span>
                <span className="text-[12px] text-gray-300 group-hover:text-primary leading-snug line-clamp-2">
                  {n.title}
                </span>
              </div>
              <ExternalLink
                size={11}
                className="text-muted group-hover:text-accent shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
