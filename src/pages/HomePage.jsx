import React from "react";
import { Card, Button, Input } from "../components/ui.jsx";
import { Camera, Hash, Image as ImageIcon, Users } from "lucide-react";

export default function HomePage(){
  return (
    <div className="container" style={{ paddingTop: "0", marginTop: "16px" }}>
      <div className="row">
      <aside className="card" style={{ gridColumn: "span 3", padding: 16 }}>
        <h4>Thanks to our Sponsors</h4>
        <div className="card" style={{ height: 96, background: "rgba(0,0,0,.05)" }} />
      </aside>

      <main style={{ gridColumn: "span 6", display: "grid", gap: 16 }}>
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: `1px solid var(--border)`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 8, background: "#22c55e" }} />
            <span className="muted">GiveAnimalsTheZoomies.app</span>
          </div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", gap: 16 }}>
            {["$0 Raised Today","0 Animals Helped","0 Supporters","0 Sanctuaries"].map(s=>(
              <div key={s}><div style={{ fontWeight: 800, fontSize: 18 }}>{s.split(" ")[0]}</div><div className="muted" style={{ fontSize: 12 }}>{s.split(" ").slice(1).join(" ")}</div></div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <ImageIcon size={18} />
            <Input placeholder="Login to post…" />
          </div>
          <div className="muted" style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 14 }}>
            <span><Camera size={16}/> Photo/Video</span>
            <span><ImageIcon size={16}/> GIF</span>
            <span><Hash size={16}/> Poll</span>
          </div>
        </Card>

        <Card style={{ padding: 24, textAlign: "center", background: "linear-gradient(135deg, rgba(0,0,0,.04), transparent)" }}>
          <h3 style={{ margin: 0 }}>Join the Movement</h3>
          <p className="muted">Be part of a community helping animals.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Button variant="outline">Find Animals to Support</Button>
            <Button><Users size={16}/> Join the Community</Button>
          </div>
        </Card>
      </main>

      <aside className="card" style={{ gridColumn: "span 3", padding: 16 }}>
        <h4>Live Streams</h4>
        <div className="card" style={{ height: 130, marginBottom: 12 }} />
        <Button style={{ width: "100%" }}>Join</Button>
      </aside>
      </div>
    </div>
  );
}
