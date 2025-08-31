import React from "react";
import { Link } from "react-router-dom";
import { Card, Button, Input } from "../components/ui.jsx";
import {
  Camera,
  Hash,
  Image as ImageIcon,
  Users,
  Heart,
  PawPrint,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/**
 * Zoomies HomePage – feed-first, product-aware (rev B)
 * Changes from rev A per request:
 * - Removed site status bar (GiveAnimalsTheZoomies.app)
 * - Moved "What is Zoomies?" explainer ABOVE the composer
 * - Added a lightweight top "hero strip" for first‑timers
 * - Added a clean footer with basic links
 */

export default function HomePage() {
  // Mock auth + data
  const isLoggedIn = false;
  const stats = {
    raisedToday: 2485,
    animalsHelped: 37,
    supporters: 912,
    sanctuaries: 51,
  };

  const posts = [
    {
      id: "p1",
      author: "Whisker Woods",
      handle: "@whiskerwoods",
      time: "2h",
      avatar: "https://picsum.photos/seed/whisker/64/64",
      text:
        "Mocha just hit her monthly milestone! Thank you for helping fund her dental care.",
      media: "https://picsum.photos/seed/mocha/800/480",
      likes: 128,
      donations: 12,
      tags: ["#cat", "#dental", "#milestone"],
    },
    {
      id: "p2",
      author: "Sunny Hooves Farm",
      handle: "@sunnyhooves",
      time: "5h",
      avatar: "https://picsum.photos/seed/hooves/64/64",
      text: "Live now! Come hang during pasture time ",
      media: null,
      likes: 76,
      donations: 4,
      tags: ["#goatcam", "#livestream"],
    },
  ];

  return (
    <div className="container" style={{ paddingTop: 0, marginTop: 16 }}>
      {/* HERO STRIP (first-time orientation; can be hidden after login) */}
      <Card
        style={{
          marginBottom: 12,
          padding: 16,
          background: "linear-gradient(135deg, rgba(255,20,147,.10), rgba(255,255,255,.04))",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ margin: 0 }}>Give animals the Zoomies</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Follow real animals, join live streams, and power rescues with tips.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/community" style={{ textDecoration: 'none' }}>
              <Button>
                <Users size={16} style={{ marginRight: 6 }} /> Join the Community
              </Button>
            </Link>
            <Link to="/ambassador" style={{ textDecoration: 'none' }}>
              <Button variant="outline">
                <PawPrint size={16} style={{ marginRight: 6 }} /> Find Animals
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="row">
        {/* Left rail */}
        <aside className="card" style={{ gridColumn: "span 3", padding: 16 }}>
          {/* sponsor carousel placeholder */}
          <div
            className="card"
            style={{
              height: 120,
              background: "linear-gradient(135deg, rgba(255,20,147,.12), rgba(255,255,255,.06))",
              display: "grid",
              placeItems: "center",
              border: "1px dashed var(--border)",
            }}
          >
            <span className="muted">Sponsor logos carousel</span>
          </div>

          <div style={{ height: 12 }} />

          <Card style={{ padding: 12 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <Button variant="outline">
                <PawPrint size={16} style={{ marginRight: 6 }} /> Become a Sanctuary Partner
              </Button>
              <Button variant="outline">
                <Users size={16} style={{ marginRight: 6 }} /> Invite Friends
              </Button>
            </div>
          </Card>

          <div style={{ height: 16 }} />

          <Card style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, textAlign: "center" }}>
              {[
                { label: "Raised Today", value: `$${formatNumber(stats.raisedToday)}` },
                { label: "Animals Helped", value: `${formatNumber(stats.animalsHelped)}` },
                { label: "Supporters", value: `${formatNumber(stats.supporters)}` },
                { label: "Sanctuaries", value: `${formatNumber(stats.sanctuaries)}` },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{s.value}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* Center column */}
        <main style={{ gridColumn: "span 6", display: "grid", gap: 16 }}>


          {/* COMPOSER */}
          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.08)",
                }}
              />
              <Input placeholder={isLoggedIn ? "Share an update…" : "Login to post…"} disabled={!isLoggedIn} />
            </div>
            <div className="muted" style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Camera size={16} /> Photo/Video
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ImageIcon size={16} /> GIF
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Hash size={16} /> Poll
              </span>
            </div>
          </Card>

          {/* FEED TABS */}
          <Card style={{ padding: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "forYou", label: "For you" },
                { key: "following", label: "Following" },
                { key: "local", label: "Local" },
              ].map((t, i) => (
                <Button key={t.key} variant={i === 0 ? undefined : "outline"}>
                  {t.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* FEED */}
          <div style={{ display: "grid", gap: 12 }}>
            {posts.map((p) => (
              <Card key={p.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <img
                    src={p.avatar}
                    alt="avatar"
                    width={40}
                    height={40}
                    style={{ borderRadius: 999, objectFit: "cover" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                      <strong>{p.author}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {p.handle} • {p.time}
                      </span>
                    </div>
                    <p style={{ marginTop: 6, marginBottom: 8 }}>{p.text}</p>
                    {p.media && (
                      <div
                        className="card"
                        style={{
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,.04)",
                        }}
                      >
                        <img src={p.media} alt="media" style={{ width: "100%", display: "block" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Heart size={16} /> {p.likes}
                      </div>
                      <Button variant="outline" size="sm">
                        <PawPrint size={16} style={{ marginRight: 6 }} /> Donate ({p.donations})
                      </Button>
                      <div className="muted" style={{ marginLeft: "auto", display: "flex", gap: 8, fontSize: 12 }}>
                        {p.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>

        {/* Right rail */}
        <aside className="card" style={{ gridColumn: "span 3", padding: 16 }}>
          {/* Live Streams */}
          <Card style={{ padding: 12, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: "rgba(255,255,255,.08)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <PlayCircle size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Sunny Hooves Farm</div>
                <div className="muted" style={{ fontSize: 12 }}>Pasture cam • 124 watching</div>
              </div>
            </div>
            <Button style={{ width: "100%", marginTop: 10 }}>Join</Button>
          </Card>



          <div style={{ height: 12 }} />

          {/* Trending */}
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Hash size={16} /> <strong>Trending</strong>
            </div>
            <div className="muted" style={{ display: "grid", gap: 6, fontSize: 14 }}>
              <span>#goatcam</span>
              <span>#adoptionday</span>
              <span>#catrescue</span>
              <span>#wildlife</span>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          {/* Newsletter */}
          <Card style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Get Zoomies updates</div>
            <Input placeholder="you@sanctuary.org" />
            <Button style={{ width: "100%", marginTop: 8 }}>Subscribe</Button>
          </Card>
        </aside>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 20,
          padding: 16,
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
        }}
      >
        <div className="muted">© {new Date().getFullYear()} Zoomies</div>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "About", href: "/about" },
            { label: "Pricing", href: "/pricing" },
            { label: "Docs", href: "/docs" },
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="muted" style={{ textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}
