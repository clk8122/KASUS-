import { TopBar } from "@/components/layout/TopBar";

export function LegalPage({ title, items }: { title: string; items: string[] }) {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/" />
        <section style={{ padding: "54px 0" }}>
          <div className="glass panel" style={{ margin: "0 auto", maxWidth: 840 }}>
            <h1 className="title-md">{title}</h1>
            <div className="list" style={{ marginTop: 24 }}>
              {items.map((item) => <div className="glass panel" key={item}>{item}</div>)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
