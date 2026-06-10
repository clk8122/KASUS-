import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-aura" aria-hidden="true" />
      <div className="home-shell">
        <section className="home-hero" aria-label="Accueil KASUS">
          <Image
            className="home-logo"
            src="/kasus-logo-transparent.png"
            alt="KASUS"
            width={1042}
            height={222}
            priority
          />
          <ButtonLink href="/kasus" primary>
            Se connecter
          </ButtonLink>
        </section>
      </div>
    </main>
  );
}
