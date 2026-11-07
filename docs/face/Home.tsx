import type { JSX } from "react";
import { HomeHero } from "./home-hero";
import { HomeShots } from "./home-shots";

/** 门面首页. 空 hash 就是这一页, 一镜一件事. */
export function Home({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <main>
      <HomeHero onGo={onGo} />
      <HomeShots onGo={onGo} />
    </main>
  );
}
