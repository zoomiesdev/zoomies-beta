import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Input, Chip } from "../components/ui.jsx";
import { Search, MapPin, Users, PawPrint, Crown, Star } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../contexts/useAuth.js";

const onImgError = (e) => (e.currentTarget.src = "https://picsum.photos/seed/zoomies/1200/600");

export default function AmbassadorHubPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load animals from database
  useEffect(() => {
    const loadAnimals = async () => {
      try {
        setLoading(true);
        const { data: animalsData, error } = await supabase
          .from('animal_profiles')
          .select(`
            id,
            name,
            species,
            breed,
            age,
            bio,
            goal,
            raised,
            status,
            image_url,
            created_at,
            updated_at
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading animals:', error);
          return;
        }

        // Transform the data to match our component structure
        const transformedAnimals = animalsData.map(animal => ({
          id: animal.id,
          name: animal.name,
          handle: `@${animal.name.toLowerCase().replace(/\s+/g, '_')}`,
          type: "Animal",
          species: animal.species,
          location: "Animal Sanctuary",
          followers: 0,
          avatar: animal.image_url || `https://picsum.photos/seed/${animal.name}/120`,
          banner: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop`,
          verified: false,
          goal: animal.goal,
          raised: animal.raised,
          status: animal.status
        }));

        setAnimals(transformedAnimals);
      } catch (error) {
        console.error('Error loading animals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnimals();
  }, []);

  const filtered = useMemo(() => {
    let out = animals.filter((p) =>
      [p.name, p.handle, p.species].join(" ").toLowerCase().includes(q.toLowerCase())
    );
    if (species !== "All") out = out.filter((p) => p.species === species);
    if (sort === "Featured") out = out.slice().sort((a) => (a.verified ? -1 : 1));
    if (sort === "Top") out = out.slice().sort((a, b) => b.followers - a.followers);
    if (sort === "New") out = out.slice().sort((a, b) => (a.id < b.id ? 1 : -1));
    return out;
  }, [animals, q, species, sort]);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Header */}
        <div className="spread">
          <div>
            <h2 style={{ margin: 0 }}>Ambassador Hub</h2>
            <div className="muted" style={{ fontSize: 14 }}>Discover amazing animals making a difference.</div>
          </div>
        </div>

        {/* Controls */}
        <Card className="card" style={{ padding: "16px 16px 25px 16px", marginBottom: "24px" }}>
          
          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              Loading animals...
            </div>
          )}
          
          {!loading && animals.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              No animals found. Be the first to create an animal profile!
            </div>
          )}
          
          {!loading && animals.length > 0 && (
            <>
              {/* Top row - Filter chips */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["Featured", "All Animals"].map(s => (
                  <Chip key={s} active={s === sort} onClick={() => setSort(s)}>
                    {s === "Featured" ? <Star size={16} /> : <PawPrint size={16} />}
                    <span style={{ marginLeft: 6, position: "relative", top: "-2px" }}>{s}</span>
                  </Chip>
                ))}
              </div>

              {/* Bottom row - Search and filters */}
              <div className="row" style={{ alignItems: "end" }}>
                <div style={{ gridColumn: "span 4" }}>
                  <Input placeholder="Search animals..." value={q} onChange={(e)=>setQ(e.target.value)} />
                </div>

                <div style={{ gridColumn: "span 3" }}>
                  <select 
                    value={species} 
                    onChange={(e) => setSpecies(e.target.value)}
                    style={{ 
                      width: "100%", 
                      border: "1px solid var(--border, #ccc)",
                      borderRadius: "12px", 
                      padding: "8px 12px", 
                      background: "rgba(0,0,0,.04)",
                      color: "var(--text, #000)",
                      fontSize: "14px",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "12px auto",
                      paddingRight: "32px"
                    }}
                  >
                    {["All", "Dog", "Cat", "Bird", "Horse", "Other"].map(s => (
                      <option key={s} value={s}>{s === "All" ? "All Species" : s}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "span 3" }}>
                  <select 
                    value="All Sanctuaries"
                    style={{ 
                      width: "100%", 
                      border: "1px solid var(--border, #ccc)",
                      borderRadius: "12px", 
                      padding: "8px 12px", 
                      background: "rgba(0,0,0,.04)",
                      color: "var(--text, #000)",
                      fontSize: "14px",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "12px auto",
                      paddingRight: "32px"
                    }}
                  >
                    <option>All Sanctuaries</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" style={{ fontSize: "14px" }}>
                    Clear Filters
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>

        {!loading && animals.length > 0 && (
          <>
            <div className="muted" style={{ fontSize: 14, marginBottom: 5}}>
              Showing {filtered.length} of {animals.length} profiles
            </div>

            {/* Results grid */}
            <div className="row">
              {filtered.map((p) => (
                <Card key={p.id} className="card" style={{ gridColumn: "span 4", overflow: "hidden", cursor: "pointer" }}
                      onClick={() => window.open(`/animal/${p.id}`, '_blank')}>
                  <div style={{ position: "relative" }}>
                    <img src={p.banner} onError={onImgError} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                  </div>

                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: -20 }}>
                      <img
                        src={p.avatar}
                        onError={onImgError}
                        alt=""
                        style={{ height: 56, width: 56, borderRadius: 999, border: "3px solid var(--bg, #000)", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                          {p.name}
                          {p.verified && <PawPrint size={14} color="var(--accent)" />}
                          {p.type === "Sanctuary" && <Crown size={14} />}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {p.handle} • {p.species}
                        </div>
                      </div>
                    </div>

                    <div className="muted" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6, fontSize: 13 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {p.location}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Users size={14} /> {p.followers.toLocaleString()} followers</span>
                    </div>

                    {/* Fundraising Bar */}
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: "12px", fontWeight: 500 }}>Fundraiser</span>
                        <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>
                          ${p.raised ? p.raised.toLocaleString() : '0'} raised
                        </span>
                      </div>
                      <div style={{ 
                        width: "100%", 
                        height: "6px", 
                        backgroundColor: "var(--border, #e5e7eb)", 
                        borderRadius: "3px",
                        overflow: "hidden"
                      }}>
                        <div style={{ 
                          width: `${p.goal > 0 ? Math.min(100, Math.max(0, (p.raised / p.goal) * 100)) : 0}%`, 
                          height: "100%", 
                          backgroundColor: "var(--accent, #3b82f6)", 
                          borderRadius: "3px",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginTop: 4,
                        fontSize: "11px",
                        color: "var(--muted, #6b7280)"
                      }}>
                        <span>Goal: ${p.goal ? p.goal.toLocaleString() : '0'}</span>
                        <span>{p.goal > 0 ? Math.min(100, Math.max(0, Math.round((p.raised / p.goal) * 100))) : 0}%</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <Button variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/animal/${p.id}`, '_blank');
                      }}>
                        View Profile
                      </Button>
                      <Button>Follow</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

