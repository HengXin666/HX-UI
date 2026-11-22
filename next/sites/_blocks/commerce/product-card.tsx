import { m } from "motion/react";
import { Price } from "./price";
import { Rating } from "./rating";
import { cn } from "@/lib/utils";

export interface ProductSummary {
  id: string;
  name: string;
  image: string;
  hoverImage?: string;
  price: number;
  compareAt?: number;
  rating?: number;
  reviews?: number;
  tag?: string;
}

/** 商品卡: 悬停换第二张图 + 轻微上浮, 收藏按钮. */
export function ProductCard({ product, onOpen, className }: { product: ProductSummary; onOpen?: (id: string) => void; className?: string }) {
  return (
    <m.article layout whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className={cn("group", className)}>
      <button type="button" onClick={() => onOpen?.(product.id)} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          <img src={product.image} alt={product.name} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          {product.hoverImage && <img src={product.hoverImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
          {product.tag && <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">{product.tag}</span>}
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          {product.rating !== undefined && <Rating value={product.rating} count={product.reviews} className="text-xs" />}
          <Price amount={product.price} compareAt={product.compareAt} size="sm" />
        </div>
      </button>
    </m.article>
  );
}
