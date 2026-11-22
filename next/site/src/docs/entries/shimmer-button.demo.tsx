import { ArrowRight } from "lucide-react";
import { ShimmerButton } from "@/effects/shimmer-button";
import type { DemoProps } from "../types";

export default function ShimmerButtonDemo({ values }: DemoProps) {
  return (
    <ShimmerButton className={values.size === "lg" ? "h-14 px-8 text-base" : undefined}>
      {String(values.label)} {values.icon ? <ArrowRight className="size-4" /> : null}
    </ShimmerButton>
  );
}
