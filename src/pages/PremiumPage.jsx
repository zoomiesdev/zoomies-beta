import React, { useMemo, useState } from "react";
import { Card, Button, Input, Chip } from "../components/ui.jsx";
import { 
  Heart, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Crown, 
  Star, 
  Gift,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function PremiumPage() {
  // Donation model demo controls
  const [amount, setAmount] = useState(100);
  const [tipAmount, setTipAmount] = useState(10);

  const { stripeFee, tipPct, calculatedTip, platformFee, nonprofitReceives, donorPays } = useMemo(() => {
    const stripe = amount * 0.029 + 0.3; // 2.9% + $0.30
    const platform = amount * 0.03; // 3% platform fee
    const tip = tipAmount;
    const totalFees = stripe + platform;
    
    // Calculate what the sanctuary receives
    let nonprofit, donor;
    if (tip >= totalFees) {
      // Tip covers all fees, sanctuary gets full donation
      nonprofit = amount;
    } else {
      // Tip covers some fees, remaining fees deducted from donation
      nonprofit = amount - (totalFees - tip);
    }
    donor = amount + tip; // Donor pays donation + tip
    
    // Calculate actual fees that remain after tip coverage
    const actualStripeFee = Math.max(0, stripe - Math.min(tip, stripe));
    const actualPlatformFee = Math.max(0, platform - Math.max(0, tip - stripe));
    
    return { 
      stripeFee: actualStripeFee, 
      tipPct: tip / amount, 
      calculatedTip: tip, 
      platformFee: actualPlatformFee, // Show actual platform fee amount
      nonprofitReceives: nonprofit, 
      donorPays: donor 
    };
  }, [amount, tipAmount]);

  const format = (n) => `$${n.toFixed(2)}`;

  return (
    <div className="container" style={{ paddingTop: "0", marginTop: "16px" }}>
              {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
  
          <h1 style={{ 
          fontSize: "48px", 
          fontWeight: 800, 
          margin: "0 0 16px 0",
          background: "linear-gradient(135deg, var(--text) 0%, var(--accent) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>

        </h1>

      </div>

      {/* 1. Donation Fees */}
      <Card style={{ 
        padding: "32px", 
        marginBottom: "32px",
        background: "linear-gradient(135deg, rgba(255, 111, 174, 0.05) 0%, rgba(255, 124, 94, 0.02) 100%)",
        border: "1px solid rgba(255, 111, 174, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ 
            background: "var(--accent)", 
            color: "white", 
            width: "48px", 
            height: "48px", 
            borderRadius: "12px",
            display: "grid",
            placeItems: "center"
          }}>
            <Heart size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>Donation Fees</h2>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)" }}>Understanding Platform Costs</p>
          </div>
        </div>
        
        <p style={{ 
          fontSize: "16px", 
          lineHeight: 1.7, 
          marginBottom: "32px",
          color: "var(--muted)"
        }}>
          Zoomies keeps the platform free for nonprofits. Donors can optionally add a small tip that helps cover platform fees.
        </p>

        {/* Controls */}
        <div style={{ 
          padding: "24px", 
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "center", justifyContent: "flex-end", marginBottom: "0px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ 
                fontSize: "12px", 
                textTransform: "uppercase", 
                letterSpacing: "0.6px",
                color: "var(--muted)",
                fontWeight: "600"
              }}>Donation</span>
              <div style={{ position: "relative" }}>
                <DollarSign 
                  size={16} 
                  style={{ 
                    position: "absolute", 
                    left: "12px", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "var(--muted)"
                  }} 
                />
                <Input 
                  type="number" 
                  min={1} 
                  step={1} 
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value || 1)))}
                  style={{ 
                    width: "100px", 
                    paddingLeft: "32px",
                    fontSize: "16px",
                    fontWeight: "600"
                  }} 
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ 
                fontSize: "12px", 
                textTransform: "uppercase", 
                letterSpacing: "0.6px",
                color: "var(--muted)",
                fontWeight: "600"
              }}>Tip</span>
              <div style={{ position: "relative" }}>
                <DollarSign 
                  size={16} 
                  style={{ 
                    position: "absolute", 
                    left: "12px", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "var(--muted)"
                  }} 
                />
                <Input 
                  type="number" 
                  min={0} 
                  step={1} 
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Math.max(0, Number(e.target.value || 0)))}
                  style={{ 
                    width: "100px", 
                    paddingLeft: "32px",
                    fontSize: "16px",
                    fontWeight: "600"
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="row" style={{ marginBottom: "24px" }}>
          <Card style={{ 
            gridColumn: "span 3", 
            padding: "20px", 
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(255, 77, 166, 0.08) 0%, rgba(255, 77, 166, 0.02) 100%)"
          }}>
            <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>Donation</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{format(amount)}</div>
          </Card>
          <Card style={{ 
            gridColumn: "span 3", 
            padding: "20px", 
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(255, 77, 166, 0.08) 0%, rgba(255, 77, 166, 0.02) 100%)"
          }}>
            <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
              Tip ({Math.round(tipPct * 100)}%)
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{format(calculatedTip)}</div>
          </Card>
          <Card style={{ 
            gridColumn: "span 3", 
            padding: "20px", 
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(255, 77, 166, 0.08) 0%, rgba(255, 77, 166, 0.02) 100%)"
          }}>
            <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
              Processing {stripeFee === 0 
                ? "(covered by tip)" 
                : calculatedTip > 0 
                  ? "(partially covered)"
                  : "(2.9% + $0.30)"
              }
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{format(stripeFee)}</div>
          </Card>
          <Card style={{ 
            gridColumn: "span 3", 
            padding: "20px", 
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(255, 77, 166, 0.08) 0%, rgba(255, 77, 166, 0.02) 100%)"
          }}>
            <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
              Platform {platformFee === 0 
                ? "(covered by tip)" 
                : calculatedTip > 0 
                  ? "(partially covered)"
                  : "(3%)"
              }
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)" }}>{format(platformFee)}</div>
          </Card>
        </div>

        <div className="row">
          <Card style={{ 
            gridColumn: "span 6", 
            padding: "24px", 
            background: "linear-gradient(135deg, #FF6FAE 0%, #FF7C5E 100%)",
            color: "white",
            border: "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <CheckCircle size={20} />
              <div style={{ fontWeight: 700, fontSize: "16px" }}>Nonprofit receives</div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>{format(nonprofitReceives)}</div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              {calculatedTip >= (stripeFee + platformFee) 
                ? "Full donation (fees covered by tip)" 
                : "Partial fees covered by tip"
              }
            </div>
          </Card>
          <Card style={{ 
            gridColumn: "span 6", 
            padding: "24px",
            border: "2px solid var(--accent)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <CreditCard size={20} />
              <div style={{ fontWeight: 700, fontSize: "16px" }}>Donor pays</div>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>{format(donorPays)}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>
              Donation + tip
            </div>
          </Card>
        </div>

        {/* Platform Benefits */}
        <div style={{ marginTop: "32px" }}>
          <h3 style={{ 
            fontSize: "20px", 
            fontWeight: 700, 
            margin: "0 0 20px 0",
            textAlign: "center"
          }}>
            Platform Benefits
          </h3>
          <div className="row" style={{ gap: "24px" }}>
            <div style={{ gridColumn: "span 4", textAlign: "center" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                background: "var(--accent)", 
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Heart size={24} color="white" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>Nonprofits pay nothing</div>
              <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                Zero out-of-pocket costs for using the platform
              </div>
            </div>
            <div style={{ gridColumn: "span 4", textAlign: "center" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                background: "var(--accent)", 
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <TrendingUp size={24} color="white" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>Donors feel empowered</div>
              <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                Transparent breakdown shows exactly where money goes
              </div>
            </div>
            <div style={{ gridColumn: "span 4", textAlign: "center" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                background: "var(--accent)", 
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Star size={24} color="white" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>Transparent fee structure</div>
              <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                Clear breakdown shows exactly where fees go
              </div>
            </div>
          </div>
        </div>
      </Card>


      <Card style={{ 
        padding: "32px", 
        marginBottom: "32px",
        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #6FB9FF 0%, #5ED2A0 100%)", 
            color: "white", 
            width: "48px", 
            height: "48px", 
            borderRadius: "12px",
            display: "grid",
            placeItems: "center"
          }}>
            <Users size={24} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>Organization Tiers</h2>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)" }}>Optional Upgrades</p>
          </div>
        </div>
        
        <p style={{ 
          fontSize: "16px", 
          lineHeight: 1.7, 
          marginBottom: "32px",
          color: "var(--muted)"
        }}>
          The core platform is free. Unlock premium fundraising tools and analytics with an optional paid
          plan tailored to your organization.
        </p>
        
        <div className="row" style={{ marginTop: "24px" }}>
          {/* Free */}
          <Card style={{ 
            gridColumn: "span 4", 
            padding: "24px", 
            display: "grid", 
            gap: "16px",
            height: "fit-content",
            border: "2px solid var(--border)",
            position: "relative"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "64px", 
                height: "64px", 
                background: "linear-gradient(135deg, #5ED2A0 0%, #6FB9FF 100%)", 
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Users size={32} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>Free</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--accent)", marginBottom: "8px" }}>$0/mo</div>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>Small sanctuaries & new partners</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
              <li>Ambassador profile pages (basic)</li>
              <li>Accept donations (crypto/fiat)</li>
              <li>Basic analytics dashboard</li>
              <li>Access to the community forum</li>
            </ul>
            <Button style={{ marginTop: "8px" }}>Get Started</Button>
          </Card>
          
          {/* Pro */}
          <Card style={{ 
            gridColumn: "span 4", 
            padding: "24px", 
            display: "grid", 
            gap: "16px",
            height: "fit-content",
            border: "2px solid var(--accent)",
            position: "relative",
            transform: "scale(1.02)"
          }}>
            <div style={{ 
              position: "absolute", 
              top: "-12px", 
              left: "50%", 
              transform: "translateX(-50%)",
              background: "var(--accent)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.6px"
            }}>
              Most Popular
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "64px", 
                height: "64px", 
                background: "linear-gradient(135deg, #FF6FAE 0%, #FF7C5E 100%)", 
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Crown size={32} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>Pro</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--accent)", marginBottom: "8px" }}>$49/mo</div>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>Growing organizations</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
              <li>Everything in Free, plus:</li>
              <li>Advanced analytics & reporting</li>
              <li>Custom donation forms</li>
              <li>Email marketing tools</li>
              <li>Priority support</li>
              <li>API access</li>
            </ul>
            <Button style={{ marginTop: "8px" }}>Start Pro Trial</Button>
          </Card>
          
          {/* Enterprise */}
          <Card style={{ 
            gridColumn: "span 4", 
            padding: "24px", 
            display: "grid", 
            gap: "16px",
            height: "fit-content",
            border: "2px solid var(--border)",
            position: "relative"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "64px", 
                height: "64px", 
                background: "linear-gradient(135deg, #6FB9FF 0%, #5ED2A0 100%)", 
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Star size={32} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>Enterprise</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--accent)", marginBottom: "8px" }}>Custom</div>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>Large organizations</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
              <li>Everything in Pro, plus:</li>
              <li>White-label solutions</li>
              <li>Custom integrations</li>
              <li>Dedicated account manager</li>
              <li>SLA guarantees</li>
              <li>On-site training</li>
            </ul>
            <Button style={{ marginTop: "8px" }}>Contact Sales</Button>
          </Card>
        </div>
      </Card>

      {/* 3. Community Premium Memberships */}
      <Card style={{ 
        padding: "32px", 
        marginBottom: "32px",
        background: "linear-gradient(135deg, rgba(255, 124, 94, 0.05) 0%, rgba(255, 111, 174, 0.02) 100%)",
        border: "1px solid rgba(255, 124, 94, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #FF7C5E 0%, #FF6FAE 100%)", 
            color: "white", 
            width: "48px", 
            height: "48px", 
            borderRadius: "12px",
            display: "grid",
            placeItems: "center"
          }}>
            <Gift size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>Community Premium Memberships</h2>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)" }}>Support the Platform</p>
          </div>
        </div>
        
        <p style={{ 
          fontSize: "16px", 
          lineHeight: 1.7, 
          marginBottom: "32px",
          color: "var(--muted)"
        }}>
          Animal lovers can support Zoomies directly through premium community memberships that unlock exclusive
          features and help keep the platform free for nonprofits.
        </p>
        
        <div className="row" style={{ marginTop: "24px" }}>
          {/* Supporter */}
          <Card style={{ 
            gridColumn: "span 6", 
            padding: "24px", 
            display: "grid", 
            gap: "16px",
            height: "fit-content",
            border: "2px solid var(--border)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "64px", 
                height: "64px", 
                background: "linear-gradient(135deg, #5ED2A0 0%, #6FB9FF 100%)", 
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Heart size={32} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>Supporter</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--accent)", marginBottom: "8px" }}>$9.99/mo</div>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>Animal lovers who want to help</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
              <li>Exclusive community badge</li>
              <li>Early access to new features</li>
              <li>Priority forum support</li>
              <li>Monthly impact report</li>
            </ul>
            <Button style={{ marginTop: "8px" }}>Become Supporter</Button>
          </Card>
          
          {/* Champion */}
          <Card style={{ 
            gridColumn: "span 6", 
            padding: "24px", 
            display: "grid", 
            gap: "16px",
            height: "fit-content",
            border: "2px solid var(--accent)",
            position: "relative",
            transform: "scale(1.02)"
          }}>
            <div style={{ 
              position: "absolute", 
              top: "-12px", 
              left: "50%", 
              transform: "translateX(-50%)",
              background: "var(--accent)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.6px"
            }}>
              Recommended
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                width: "64px", 
                height: "64px", 
                background: "linear-gradient(135deg, #FF6FAE 0%, #FF7C5E 100%)", 
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px auto"
              }}>
                <Crown size={32} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>Champion</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--accent)", marginBottom: "8px" }}>$24.99/mo</div>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>Dedicated supporters</div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
              <li>Everything in Supporter, plus:</li>
              <li>Exclusive ambassador events</li>
              <li>Direct access to Zoomies team</li>
              <li>Custom profile customization</li>
              <li>Quarterly impact calls</li>
            </ul>
            <Button style={{ marginTop: "8px" }}>Become Champion</Button>
          </Card>
        </div>
      </Card>

      {/* CTA Section */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ 
          fontSize: "32px", 
          fontWeight: 700, 
          margin: "0 0 16px 0"
        }}>
          Ready to Make a Difference?
        </h2>
        <p style={{ 
          fontSize: "18px", 
          color: "var(--muted)", 
          maxWidth: "600px", 
          margin: "0 auto 32px auto",
          lineHeight: 1.6
        }}>
          Join thousands of animal lovers and nonprofits making a difference through our platform.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Button style={{ 
            padding: "16px 32px", 
            fontSize: "18px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px" 
          }}>
            Get Started Free
            <ArrowRight size={20} />
          </Button>
          <Button variant="outline" style={{ 
            padding: "16px 32px", 
            fontSize: "18px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px" 
          }}>
            View Pricing
            <ArrowRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
