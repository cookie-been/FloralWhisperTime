import { Link } from "react-router-dom";
import { Tag } from "antd";
import type { Flower } from "@/types";

interface FlowerCardProps {
  flower: Flower;
  compact?: boolean;
}

export function FlowerCard({ flower, compact = false }: FlowerCardProps) {
  return (
    <Link to={`/gallery/${flower.id}`} className="surface-card group block overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(88,69,48,0.12)]">
      <div className={compact ? "aspect-square overflow-hidden bg-mint" : "aspect-[4/4.6] overflow-hidden bg-mint"}>
        <img
          src={flower.images[0]}
          alt={flower.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={compact ? "text-base font-semibold text-ink" : "text-lg font-semibold text-ink"}>{flower.name}</h3>
            <p className={compact ? "mt-1 line-clamp-2 text-sm leading-6 text-muted" : "mt-2 line-clamp-3 text-sm leading-7 text-muted"}>{flower.description}</p>
          </div>
          <span className={compact ? "shrink-0 text-sm font-semibold text-forest" : "shrink-0 text-base font-semibold text-forest"}>¥{flower.price}</span>
        </div>
        {!compact && (
          <div className="mt-4 flex flex-wrap gap-2">
            {flower.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} color="green" className="m-0">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
