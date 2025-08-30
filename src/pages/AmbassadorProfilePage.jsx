import React, { useMemo, useState } from "react";
import { Card, Button, Input, Textarea, Chip } from "../components/ui";
import {
  MapPin, Users, Share2, Camera, MessageCircle, Heart, CalendarClock, Link as LinkIcon, PawPrint
} from "lucide-react";

// --- demo data for one animal ---
const animal = {
  name: "Mocha",
  species: "Cat",
  breed: "Maine Coon",
  sanctuary: "Whisker Woods",
  age: 3,
  rescued: "Jan 2024",
  location: "Portland, OR",
  followers: 120,
  personality: ["silly", "lazy", "loves pets"],
  banner: "https://picsum.photos/seed/mocha-banner/1200/480",
  avatar: "https://picsum.photos/seed/mocha/240",
  raised: 120,
  goal: 800,
  links: { website: "whiskerwoods.example", instagram: "@whiskerwoods" },
};

// sample timeline posts
const POSTS = [
  {
    id: "p1",
    author: "Whisker Woods",
    time: "2h",
    text: "Mocha loved her new puzzle feeder today! 🧩",
    images: ["https://picsum.photos/seed/p1a/700/400", "https://picsum.photos/seed/p1b/700/400"],
    likes: 23, comments: 4,
  },
  {
    id: "p2",
    author: "Whisker Woods",
    time: "1d",
    text: "Vet check went great — thank you for supporting her care 💖",
    images: ["https://picsum.photos/seed/p2a/700/400"],
    likes: 58, comments: 9,
  },
];

const onImgError = (e) => (e.currentTarget.src = "https://picsum.photos/seed/zoomies/1200/600");

export default function AnimalProfilePage() {
  const [tab, setTab] = useState("Timeline"); // Timeline | Gallery | About
  const pct = Math.min(100, Math.round((animal.raised / animal.goal) * 100));
  const gallery = useMemo(() => POSTS.flatMap(p => p.images), []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <Card className="card" style={{ overflow: "hidden" }}>
        <div style={{ position: "relative", height: 200, background: `url(${animal.banner}) center/cover` }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16 }}>
          <img
            src={animal.avatar}
            onError={onImgError}
            alt=""
            style={{
              height: 96, width: 96, borderRadius: 999, objectFit: "cover",
              border: "4px solid var(--bg, #000)", marginTop: -64
            }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{animal.name}</h2>
            <div className="muted" style={{ fontSize: 14 }}>
              {animal.species} • {animal.breed} • {animal.sanctuary}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} /> {animal.location}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Users size={14} /> {animal.followers} followers
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline">Follow</Button>
            <Button variant="ghost"><Share2 size={16}/> Share</Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="card" style={{ padding: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["Timeline", "Gallery", "About"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`chip ${tab === t ? "active" : ""}`}
              style={{ padding: "8px 14px" }}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Body: sidebar + main */}
      <div className="row">
        {/* Sidebar (About + Support) */}
        <div style={{ gridColumn: "span 4", display: "grid", gap: 16 }}>
          <Card className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>About</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
              <div><span className="muted">Age:</span> {animal.age}</div>
              <div><span className="muted">Rescued:</span> {animal.rescued}</div>
              <div><span className="muted">Location:</span> {animal.location}</div>
              <div><span className="muted">Followers:</span> {animal.followers}</div>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {animal.personality.map((t) => (
                <span key={t} className="chip" style={{ textTransform: "capitalize" }}>{t}</span>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 6, fontSize: 14 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <LinkIcon size={16}/> {animal.links.website}
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <PawPrint size={16}/> {animal.links.instagram}
              </div>
            </div>
          </Card>

          <Card className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Support Mocha</h3>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
              Every donation goes toward food, vet care, enrichment, and sanctuary costs.
            </div>
            <div style={{ height: 8, borderRadius: 8, background: "rgba(0,0,0,.12)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} />
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              ${animal.raised} raised of ${animal.goal} goal
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[10, 25, 50].map(v => <Button key={v} variant="ghost">${v}</Button>)}
              <Button variant="outline">Custom</Button>
            </div>
            <Button style={{ marginTop: 10 }}><Heart size={16}/> Donate</Button>
          </Card>

          <Card className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Recent Supporters</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={`https://picsum.photos/seed/supporter${i}/80`} alt="" style={{ height: 32, width: 32, borderRadius: 999 }} />
                    <div style={{ fontSize: 14 }}>
                      <div>Supporter {i}</div>
                      <div className="muted" style={{ fontSize: 12 }}>donated ${[25,15,40][i-1]}</div>
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}><CalendarClock size={14}/> 2d</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main column */}
        <div style={{ gridColumn: "span 8", display: "grid", gap: 16 }}>
          {tab === "Timeline" && (
            <>
              {/* Composer */}
              <Card className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <img src={animal.avatar} alt="" style={{ height: 36, width: 36, borderRadius: 999 }} />
                  <div style={{ flex: 1, display: "grid", gap: 8 }}>
                    <Input placeholder={`Share an update about ${animal.name}…`} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div className="muted" style={{ display: "flex", gap: 12, fontSize: 14 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Camera size={16}/> Photo/Video</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MessageCircle size={16}/> Poll</span>
                      </div>
                      <Button disabled>Post</Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Feed */}
              {POSTS.map(p => (
                <Card key={p.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={animal.avatar} alt="" style={{ height: 36, width: 36, borderRadius: 999 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.author}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.time} ago</div>
                    </div>
                    <Button variant="ghost"><Share2 size={16}/> Share</Button>
                  </div>
                  <p style={{ marginTop: 10, marginBottom: 10 }}>{p.text}</p>
                  {p.images?.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: p.images.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
                      {p.images.map((src, i) => (
                        <img key={i} src={src} onError={onImgError} alt="" style={{ width: "100%", borderRadius: 12 }} />
                      ))}
                    </div>
                  ) : null}
                  <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 14 }} className="muted">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Heart size={16}/> {p.likes}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MessageCircle size={16}/> {p.comments}</span>
                  </div>
                </Card>
              ))}
            </>
          )}

          {tab === "Gallery" && (
            <Card className="card" style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {gallery.map((src, i) => (
                  <img key={i} src={src} onError={onImgError} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }} />
                ))}
              </div>
            </Card>
          )}

          {tab === "About" && (
            <Card className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>About {animal.name}</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                {animal.name} is a {animal.age}-year-old {animal.breed.toLowerCase()} who loves wand toys, sunbeams, and naps on soft blankets.
                Your support helps with vet visits, high-quality food, and enrichment activities.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <div><strong>Sanctuary:</strong> {animal.sanctuary}</div>
                <div><strong>Rescued:</strong> {animal.rescued}</div>
                <div><strong>Location:</strong> {animal.location}</div>
                <div><strong>Followers:</strong> {animal.followers}</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
