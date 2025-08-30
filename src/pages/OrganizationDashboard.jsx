import React, { useState, useEffect } from "react";
import { Card, Button, Input, Textarea, Tooltip } from "../components/ui.jsx";
import KPI from "../components/KPI.jsx";
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Users, 
  Heart, 
  DollarSign, 
  Calendar,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Settings,
  FileSpreadsheet,
  FileText,
  Image,
  ImagePlus,
  Twitter,
  Music,
  Youtube,
  Video
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { supabase } from "../lib/supabase.js";
import { Link, useNavigate } from "react-router-dom";

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Species options for dropdown
  const speciesOptions = [
    "Cat", "Dog", "Reptile", "Horse", "Pig", "Bird", "Rabbit", "Guinea Pig", 
    "Hamster", "Fish", "Turtle", "Snake", "Lizard", "Ferret", "Chinchilla",
    "Rat", "Mouse", "Gerbil", "Parrot", "Canary", "Finch", "Duck", "Goose",
    "Chicken", "Turkey", "Goat", "Sheep", "Cow", "Donkey", "Mule", "Other"
  ];
  const [activeTab, setActiveTab] = useState('overview');
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  
  // Enhanced analytics state
  const [analytics, setAnalytics] = useState({
    totalAnimals: 0,
    activeFundraisers: 0,
    totalRaised: 0,
    totalDonors: 0,
    monthlyGrowth: 0,
    avgDonation: 0,
    monthlyGoal: 0,
    monthlyRaised: 0,
    cryptoDonations: 0,
    fiatDonations: 0,
    totalFollowers: 0,
    totalEngagement: 0
  });

  // New animal form state
  const [newAnimal, setNewAnimal] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    bio: "",
    goal: "",
    status: "active"
  });

  // Enhanced dashboard state
  const [donations, setDonations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [ambassadorHighlights, setAmbassadorHighlights] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (user) {
      checkDatabaseConnection();
      loadAnimals();
      loadAnalytics();
      loadDonations();
      loadRecentActivity();
      loadTopDonors();
      loadAmbassadorHighlights();
    }
  }, [user]);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      // First check if user_profiles table exists and user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, username, full_name, user_type')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code === '42P01') {
        console.error('user_profiles table does not exist. Please run the complete-setup-script.sql script in your Supabase SQL Editor.');
        alert('Database setup required: The user_profiles table does not exist. Please run the complete-setup-script.sql script in your Supabase SQL Editor.');
        return;
      }
      
      if (profileError && profileError.code === 'PGRST116') {
        // User profile doesn't exist, create one
        console.log('Creating user profile for:', user.id);
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            user_type: user.user_metadata?.user_type || 'individual'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating user profile:', createError);
          alert('Failed to create user profile. Please check the console for details.');
          return;
        }
        
        console.log('User profile created successfully:', newProfile);
      } else if (profileError) {
        console.error('Error checking user profile:', profileError);
        return;
      } else {
        console.log('User profile exists:', profileData);
      }
      
      // Now check if animal_profiles table exists
      const { data, error } = await supabase
        .from('animal_profiles')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.error('animal_profiles table does not exist. Please run the complete-setup-script.sql script in your Supabase SQL Editor.');
        alert('Database setup required: The animal_profiles table does not exist. Please run the complete-setup-script.sql script in your Supabase SQL Editor.');
        return;
      }
      
      if (error) {
        console.error('Database connection error:', error);
        return;
      }
      
      console.log('Database connection successful. animal_profiles table exists.');
    } catch (error) {
      console.error('Error checking database connection:', error);
    }
  };

  const loadAnimals = async () => {
    try {
      setLoading(true);
      
      // Fetch real animal profiles from the database
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
        .eq('organization_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading animals:', error);
        if (error.code === '42P01') {
          console.error('animal_profiles table does not exist. Please run the animal-profiles-schema.sql script.');
          return;
        }
        return;
      }

      // Transform the data to match our component structure
      const transformedAnimals = animalsData.map(animal => ({
        id: animal.id,
        name: animal.name,
        species: animal.species,
        breed: animal.breed || 'Unknown',
        age: animal.age || 'Unknown',
        status: animal.status,
        goal: parseFloat(animal.goal) || 0,
        raised: parseFloat(animal.raised) || 0,
        image: animal.image_url || 'https://picsum.photos/seed/default/200',
        lastUpdated: formatTimeAgo(animal.updated_at || animal.created_at)
      }));

      setAnimals(transformedAnimals);
    } catch (error) {
      console.error('Error loading animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Fetch real analytics from the database
      const { data: animalsData, error: animalsError } = await supabase
        .from('animal_profiles')
        .select('id, goal, raised, status, created_at')
        .eq('organization_id', user.id);

      if (animalsError) {
        console.error('Error loading animals for analytics:', animalsError);
        return;
      }

      // Calculate analytics from real data
      const totalAnimals = animalsData.length;
      const activeFundraisers = animalsData.filter(a => a.status === 'active').length;
      const totalRaised = animalsData.reduce((sum, a) => sum + (parseFloat(a.raised) || 0), 0);
      
      // Get donor count from donations table
      const { data: donationsData, error: donationsError } = await supabase
        .from('animal_profiles_donations')
        .select('donor_id, amount, created_at')
        .in('animal_id', animalsData.map(a => a.id));

      if (donationsError) {
        console.error('Error loading donations for analytics:', donationsError);
      }

      const totalDonors = donationsData ? new Set(donationsData.map(d => d.donor_id)).size : 0;
      const avgDonation = donationsData && donationsData.length > 0 
        ? donationsData.reduce((sum, d) => sum + parseFloat(d.amount), 0) / donationsData.length 
        : 0;

      // Calculate monthly growth (simplified - you can make this more sophisticated)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthDonations = donationsData ? donationsData.filter(d => 
        new Date(d.created_at) >= lastMonth
      ).reduce((sum, d) => sum + parseFloat(d.amount), 0) : 0;
      
      const monthlyGrowth = lastMonthDonations > 0 ? Math.round((lastMonthDonations / totalRaised) * 100) : 0;

      setAnalytics({
        totalAnimals,
        activeFundraisers,
        totalRaised: Math.round(totalRaised * 100) / 100, // Round to 2 decimal places
        totalDonors,
        monthlyGrowth,
        avgDonation: Math.round(avgDonation * 100) / 100,
        monthlyGoal: Math.round(totalRaised * 0.3 * 100) / 100, // 30% of total as monthly goal
        monthlyRaised: Math.round(lastMonthDonations * 100) / 100,
        cryptoDonations: Math.round(totalRaised * 0.15 * 100) / 100, // 15% crypto estimate
        fiatDonations: Math.round(totalRaised * 0.85 * 100) / 100, // 85% fiat estimate
        totalFollowers: 0, // Will be loaded separately
        totalEngagement: 0 // Will be loaded separately
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadDonations = async () => {
    try {
      const { data: donationsData, error } = await supabase
        .from('animal_profiles_donations')
        .select(`
          id,
          amount,
          message,
          anonymous,
          created_at,
          animal_id,
          donor_id
        `)
        .in('animal_id', animals.map(a => a.id))
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading donations:', error);
        return;
      }

      setDonations(donationsData || []);
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Load recent donations, follows, and updates
      const { data: activityData, error } = await supabase
        .from('animal_profiles_donations')
        .select(`
          id,
          amount,
          created_at,
          animal_id,
          donor_id
        `)
        .in('animal_id', animals.map(a => a.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading recent activity:', error);
        return;
      }

      setRecentActivity(activityData || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadTopDonors = async () => {
    try {
      const { data: donorsData, error } = await supabase
        .from('animal_profiles_donations')
        .select(`
          donor_id,
          amount
        `)
        .in('animal_id', animals.map(a => a.id));

      if (error) {
        console.error('Error loading top donors:', error);
        return;
      }

      // Group by donor and sum amounts
      const donorTotals = {};
      donorsData.forEach(donation => {
        if (donation.donor_id) {
          donorTotals[donation.donor_id] = (donorTotals[donation.donor_id] || 0) + parseFloat(donation.amount);
        }
      });

      // Convert to array and sort by total amount
      const topDonorsArray = Object.entries(donorTotals)
        .map(([donorId, total]) => ({ donorId, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setTopDonors(topDonorsArray);
    } catch (error) {
      console.error('Error loading top donors:', error);
    }
  };

  const loadAmbassadorHighlights = async () => {
    try {
      // For now, create highlights from existing animal data
      // In the future, this would include real engagement metrics
      const highlights = animals
        .filter(animal => animal.status === 'active')
        .map(animal => ({
          id: animal.id,
          name: animal.name,
          species: animal.species,
          progress: formatPercentage(animal.raised, animal.goal),
          followers: Math.floor(Math.random() * 100) + 10, // Mock data for now
          engagement: Math.floor(Math.random() * 50) + 5, // Mock data for now
          image: animal.image
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5);

      setAmbassadorHighlights(highlights);
    } catch (error) {
      console.error('Error loading ambassador highlights:', error);
    }
  };

  const handleAddAnimal = async () => {
    try {
      // Validate required fields
      if (!newAnimal.name.trim() || !newAnimal.species.trim() || !newAnimal.goal) {
        alert('Please fill in all required fields (name, species, and goal)');
        return;
      }

      // First ensure user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, user_type')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error checking user profile:', profileError);
        alert('User profile not found. Please refresh the page and try again.');
        return;
      }
      
      if (profileData.user_type !== 'organization') {
        alert('Only organization accounts can create animal profiles.');
        return;
      }

      // Create new animal profile in the database
      const { data: animalData, error } = await supabase
        .from('animal_profiles')
        .insert({
          organization_id: user.id,
          name: newAnimal.name.trim(),
          species: newAnimal.species.trim(),
          breed: newAnimal.breed.trim() || null,
          age: newAnimal.age.trim() || null,
          bio: newAnimal.bio.trim() || null,
          goal: parseFloat(newAnimal.goal),
          raised: 0,
          status: newAnimal.status,
          image_url: null // Will be updated when image upload is implemented
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating animal profile:', error);
        alert(`Failed to create animal profile: ${error.message || error.details || 'Unknown error'}. Please check the console for details.`);
        return;
      }

      // Add the new animal to the local state
      const newAnimalProfile = {
        id: animalData.id,
        name: animalData.name,
        species: animalData.species,
        breed: animalData.breed || 'Unknown',
        age: animalData.age || 'Unknown',
        status: animalData.status,
        goal: parseFloat(animalData.goal),
        raised: 0,
        image: 'https://picsum.photos/seed/default/200', // Default image until real image is uploaded
        lastUpdated: 'Just now'
      };
      
      setAnimals(prev => [newAnimalProfile, ...prev]);
      setShowAddAnimal(false);
      setNewAnimal({ name: "", species: "", breed: "", age: "", bio: "", goal: "", status: "active" });
      
      // Refresh analytics to reflect the new animal
      loadAnalytics();
      
      alert('Animal profile created successfully!');
    } catch (error) {
      console.error('Error adding animal:', error);
      alert('Failed to create animal profile. Please try again.');
    }
  };

  const handleEditAnimal = async (animal) => {
    try {
      // Validate required fields
      if (!animal.name.trim() || !animal.species.trim() || !animal.goal) {
        alert('Please fill in all required fields (name, species, and goal)');
        return;
      }

      // Update animal profile in the database
      const { error } = await supabase
        .from('animal_profiles')
        .update({
          name: animal.name.trim(),
          species: animal.species.trim(),
          breed: animal.breed.trim() || null,
          age: animal.age.trim() || null,
          bio: animal.bio.trim() || null,
          goal: parseFloat(animal.goal),
          status: animal.status
        })
        .eq('id', animal.id);

      if (error) {
        console.error('Error updating animal profile:', error);
        alert('Failed to update animal profile. Please try again.');
        return;
      }

      // Update the animal in local state
      setAnimals(prev => prev.map(a => 
        a.id === animal.id 
          ? { ...a, ...animal, goal: parseFloat(animal.goal) }
          : a
      ));

      setEditingAnimal(null);
      alert('Animal profile updated successfully!');
      
      // Refresh analytics to reflect any changes
      loadAnalytics();
    } catch (error) {
      console.error('Error editing animal:', error);
      alert('Failed to update animal profile. Please try again.');
    }
  };

  const handleDeleteAnimal = async (animalId) => {
    if (window.confirm('Are you sure you want to delete this animal profile? This action cannot be undone.')) {
      try {
        // Delete animal profile from the database
        const { error } = await supabase
          .from('animal_profiles')
          .delete()
          .eq('id', animalId);

        if (error) {
          console.error('Error deleting animal profile:', error);
          alert('Failed to delete animal profile. Please try again.');
          return;
        }

        // Remove the animal from local state
        setAnimals(prev => prev.filter(a => a.id !== animalId));
        
        alert('Animal profile deleted successfully!');
        
        // Refresh analytics to reflect the deletion
        loadAnalytics();
      } catch (error) {
        console.error('Error deleting animal:', error);
        alert('Failed to delete animal profile. Please try again.');
      }
    }
  };

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         animal.species.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || animal.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (raised, goal) => {
    if (goal <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((raised / goal) * 100)));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <div className="container" style={{ paddingTop: "0", marginTop: "16px" }}>
      {/* Header */}
      <header style={{
        padding: "16px 0",
        marginBottom: "24px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Organization Dashboard
            </h1>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
              Manage your animal ambassadors and track fundraising progress
            </p>
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <Button onClick={() => setShowAddAnimal(true)}>
              <Plus size={16} style={{ marginRight: "8px" }} />
              Add Animal
            </Button>
            <Button variant="outline">
              <FileSpreadsheet size={16} style={{ marginRight: "8px" }} />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div 
        role="tablist" 
        aria-label="Dashboard sections"
        style={{ marginBottom: "24px" }}
        onKeyDown={(e) => {
          const tabs = ['overview', 'ambassadors', 'donations', 'analytics', 'settings'];
          const currentIndex = tabs.indexOf(activeTab);
          
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
              setActiveTab(tabs[prevIndex]);
              break;
            case 'ArrowRight':
              e.preventDefault();
              const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
              setActiveTab(tabs[nextIndex]);
              break;
            case 'Home':
              e.preventDefault();
              setActiveTab('overview');
              break;
            case 'End':
              e.preventDefault();
              setActiveTab('settings');
              break;
          }
        }}
      >
        <div style={{ 
          display: "flex", 
          background: "var(--panel)", 
          padding: "4px", 
          borderRadius: "9999px",
          border: "1px solid var(--border)"
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ambassadors', label: 'Ambassadors' },
            { id: 'donations', label: 'Donations' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'settings', label: 'Settings' }
          ].map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "none",
                borderRadius: "9999px",
                background: activeTab === tab.id ? "var(--accent)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text)",
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                position: "relative"
              }}
              onFocus={(e) => {
                e.target.style.outline = "2px solid var(--accent-2)";
                e.target.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.target.style.outline = "none";
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = "var(--bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = "transparent";
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab Content */}
      <div
        role="tabpanel"
        id="panel-overview"
        aria-labelledby="tab-overview"
        hidden={activeTab !== 'overview'}
      >
        <>
                    {/* Analytics Overview */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "20px", 
            marginBottom: "32px" 
          }}>
            <KPI
              icon={<Users size={20} color="white" />}
              label="Total Animals"
              value={analytics.totalAnimals}
              iconBackground="var(--accent)"
            />
            
            <KPI
              icon={<Target size={20} color="white" />}
              label="Active Fundraisers"
              value={analytics.activeFundraisers}
              iconBackground="#10b981"
            />
            
            <KPI
              icon={<DollarSign size={20} color="white" />}
              label="Total Raised"
              value={formatCurrency(analytics.totalRaised)}
              iconBackground="#f59e0b"
            />
            
            <KPI
              icon={<Heart size={20} color="white" />}
              label="Total Donors"
              value={analytics.totalDonors}
              iconBackground="#8b5cf6"
            />
            
            <KPI
              icon={<TrendingUp size={20} color="white" />}
              label="Monthly Growth"
              value={`${analytics.monthlyGrowth}%`}
              iconBackground="#ef4444"
            />
            
            <KPI
              icon={<Award size={20} color="white" />}
              label="Avg Donation"
              value={formatCurrency(analytics.avgDonation)}
              iconBackground="#06b6d4"
            />
          </div>

          {/* Donation Summary Card */}
          <Card style={{ padding: "24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600 }}>Donation Summary</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--accent)", marginBottom: "8px" }}>
                  {formatCurrency(analytics.monthlyRaised)}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "14px" }}>Raised This Month</div>
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "#10b981", marginBottom: "8px" }}>
                  {formatCurrency(analytics.monthlyGoal)}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "14px" }}>Monthly Goal</div>
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px" }}>
                  {analytics.monthlyGoal > 0 ? Math.min(100, Math.max(0, Math.round((analytics.monthlyRaised / analytics.monthlyGoal) * 100))) : 0}%
                </div>
                <div style={{ color: "var(--muted)", fontSize: "14px" }}>Goal Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>Monthly Progress</span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {analytics.monthlyGoal > 0 ? Math.min(100, Math.max(0, Math.round((analytics.monthlyRaised / analytics.monthlyGoal) * 100))) : 0}%
                </span>
              </div>
              <div style={{ 
                width: "100%", 
                height: "12px", 
                background: "var(--border)", 
                borderRadius: "var(--radius)",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, analytics.monthlyGoal > 0 ? (analytics.monthlyRaised / analytics.monthlyGoal) * 100 : 0))}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--accent), #10b981)",
                  borderRadius: "var(--radius)",
                  transition: "width 0.5s ease"
                }} />
              </div>
            </div>

            {/* Fiat vs Crypto Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ 
                padding: "16px", 
                background: "var(--panel)", 
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)"
              }}>
                <div style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "4px" }}>Fiat Donations</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#10b981" }}>
                  {formatCurrency(analytics.fiatDonations)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {analytics.totalRaised > 0 ? Math.min(100, Math.max(0, Math.round((analytics.fiatDonations / analytics.totalRaised) * 100))) : 0}% of total
                </div>
              </div>
              
              <div style={{ 
                padding: "16px", 
                background: "var(--panel)", 
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)"
              }}>
                <div style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "4px" }}>Crypto Donations</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b" }}>
                  {formatCurrency(analytics.cryptoDonations)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {analytics.totalRaised > 0 ? Math.min(100, Math.max(0, Math.round((analytics.cryptoDonations / analytics.totalRaised) * 100))) : 0}% of total
                </div>
              </div>
            </div>
                    </Card>

          {/* Active Campaigns Widget */}
          <Card style={{ padding: "24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600 }}>Active Campaigns</h3>
            
            <div style={{ display: "grid", gap: "16px" }}>
              {animals.filter(a => a.status === 'active').slice(0, 5).map(animal => (
                <div key={animal.id} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--panel)"
                }}>
                  <img 
                    src={animal.image} 
                    alt={animal.name}
                    style={{ 
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "var(--radius)", 
                      objectFit: "cover",
                      marginRight: "16px"
                    }}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                        {animal.name} • {animal.species}
                      </h4>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>
                        {animal.goal > 0 ? (
                          `${Math.min(100, Math.max(0, Math.round((animal.raised / animal.goal) * 100)))}% funded`
                        ) : (
                          <span style={{ 
                            fontSize: "12px", 
                            padding: "2px 6px", 
                            background: "var(--muted)", 
                            color: "white", 
                            borderRadius: "var(--radius)",
                            fontWeight: 500
                          }}>
                            No goal
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {animal.goal > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ 
                          width: "100%", 
                          height: "6px", 
                          background: "var(--border)", 
                          borderRadius: "var(--radius)",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${Math.min(100, Math.max(0, (animal.raised / animal.goal) * 100))}%`,
                            height: "100%",
                            background: "var(--accent)",
                            borderRadius: "var(--radius)",
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                        {formatCurrency(animal.raised)} raised of {formatCurrency(animal.goal)} goal
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button size="sm" variant="outline" style={{ fontSize: "12px" }}>
                          🚀 Boost
                        </Button>
                        <Button size="sm" variant="outline" style={{ fontSize: "12px" }}>
                          📤 Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {animals.filter(a => a.status === 'active').length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <Target size={48} color="var(--muted)" />
                  </div>
                  <div style={{ fontSize: "16px", marginBottom: "8px" }}>No active campaigns</div>
                  <div style={{ fontSize: "14px" }}>Start your first fundraising campaign!</div>
                </div>
              )}
            </div>
          </Card>


        </>
      </div>

      {/* Ambassadors Tab Content */}
      <div
        role="tabpanel"
        id="panel-ambassadors"
        aria-labelledby="tab-ambassadors"
        hidden={activeTab !== 'ambassadors'}
      >
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>Animal Ambassadors</h2>
            <Button onClick={() => setShowAddAnimal(true)}>
              <Plus size={16} style={{ marginRight: "8px" }} />
              Add New Animal
            </Button>
          </div>

          {/* Search and Filters Toolbar */}
          <Card style={{ 
            padding: "16px", 
            marginBottom: "24px",
            background: "var(--panel)",
            border: "1px solid var(--border)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Search Input with Inset Icon */}
              <div style={{ flex: 1, position: "relative" }}>
                <Input
                  placeholder="Search animals by name or species..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    paddingLeft: "40px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: "var(--bg)"
                  }}
                />
                <Search size={16} style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--muted)"
                }} />
              </div>
              
              {/* Filter Pills */}
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "completed", label: "Completed" },
                  { value: "paused", label: "Paused" }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value)}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      background: filterStatus === filter.value ? "var(--accent)" : "transparent",
                      color: filterStatus === filter.value ? "white" : "var(--text)",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background: filterStatus === filter.value ? "var(--accent)" : "var(--panel)",
                        borderColor: filterStatus === filter.value ? "var(--accent)" : "var(--accent-2)"
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (filterStatus !== filter.value) {
                        e.currentTarget.style.background = "var(--panel)";
                        e.currentTarget.style.borderColor = "var(--accent-2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterStatus !== filter.value) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Animals Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              Loading animals...
            </div>
          ) : filteredAnimals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              <div style={{ marginBottom: "16px" }}>
                <Heart size={48} color="var(--muted)" />
              </div>
              <div style={{ fontSize: "18px", marginBottom: "8px" }}>No animals found</div>
              <div style={{ fontSize: "14px" }}>
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first animal ambassador"
                }
              </div>
            </div>
          ) : (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: "20px" 
            }}>
              {filteredAnimals.map(animal => (
                <Card key={animal.id} style={{ 
                  padding: "16px",
                  position: "relative",
                  transition: "border-color 0.2s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "var(--accent-2)"
                  }
                }}
                onClick={() => navigate(`/animal/${animal.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}>
                  {/* Animal Image */}
                  <div style={{ 
                    width: "100%", 
                    height: "140px", 
                    borderRadius: "var(--radius)", 
                    overflow: "hidden",
                    marginBottom: "12px"
                  }}>
                    <img 
                      src={animal.image} 
                      alt={animal.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Animal Info */}
                  <div style={{ marginBottom: "12px" }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 600 }}>
                      {animal.name}
                    </h3>
                    <div style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "2px" }}>
                      {animal.species} • {animal.breed}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "13px" }}>
                      {animal.age} • {animal.status}
                    </div>
                  </div>

                  {/* Fundraising Progress */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>Progress</span>
                      {animal.goal > 0 ? (
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>
                          {Math.min(100, Math.max(0, Math.round((animal.raised / animal.goal) * 100)))}%
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: "11px", 
                          padding: "2px 6px", 
                          background: "var(--muted)", 
                          color: "white", 
                          borderRadius: "var(--radius)",
                          fontWeight: 500
                        }}>
                          No goal set
                        </span>
                      )}
                    </div>
                    
                    {animal.goal > 0 ? (
                      <>
                        <div style={{ 
                          width: "100%", 
                          height: "6px", 
                          background: "var(--border)", 
                          borderRadius: "var(--radius)",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${Math.min(100, Math.max(0, (animal.raised / animal.goal) * 100))}%`,
                            height: "100%",
                            background: "var(--accent)",
                            borderRadius: "var(--radius)",
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          marginTop: "6px",
                          fontSize: "13px"
                        }}>
                          <span style={{ color: "var(--muted)" }}>
                            {formatCurrency(animal.raised)} raised
                          </span>
                          <span style={{ color: "var(--muted)" }}>
                            Goal: {formatCurrency(animal.goal)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        marginTop: "6px",
                        fontSize: "13px"
                      }}>
                        <span style={{ color: "var(--muted)" }}>
                          {formatCurrency(animal.raised)} raised
                        </span>
                        <span style={{ color: "var(--muted)" }}>
                          No goal set
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingAnimal(animal)}
                      style={{ flex: 1, fontSize: "12px", padding: "8px 12px" }}
                    >
                      <Edit3 size={16} style={{ marginRight: "4px" }} />
                      Edit
                    </Button>
                    
                    {/* View Button with Tooltip */}
                    <Tooltip content="View animal profile">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/animal/${animal.id}`)}
                        style={{ 
                          width: "36px", 
                          height: "36px", 
                          padding: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        aria-label="View animal profile"
                      >
                        <Eye size={16} />
                      </Button>
                    </Tooltip>
                    
                    {/* Delete Button with Tooltip */}
                    <Tooltip content="Delete animal">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteAnimal(animal.id)}
                        style={{ 
                          width: "36px", 
                          height: "36px", 
                          padding: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ef4444", 
                          borderColor: "#ef4444"
                        }}
                        aria-label="Delete animal"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Footer Row with Last Updated */}
                  <div style={{ 
                    borderTop: "1px solid var(--border)",
                    paddingTop: "8px",
                    marginTop: "auto"
                  }}>
                    <div style={{ 
                      fontSize: "11px", 
                      color: "var(--muted)", 
                      textAlign: "center"
                    }}>
                      Updated {animal.lastUpdated}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Donations Tab Content */}
      <div
        role="tabpanel"
        id="panel-donations"
        aria-labelledby="tab-donations"
        hidden={activeTab !== 'donations'}
      >
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 24px 0", fontSize: "24px", fontWeight: 600 }}>Donations & Fundraising</h2>
          
          {/* Top Donors Leaderboard */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Top Donors</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {topDonors.map((donor, index) => (
                <div key={donor.donorId} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: index < 3 ? "var(--accent)" : "transparent",
                  color: index < 3 ? "white" : "var(--text)"
                }}>
                  <div style={{ 
                    width: "32px", 
                    height: "32px", 
                    borderRadius: "50%", 
                    background: index < 3 ? "rgba(255,255,255,0.2)" : "var(--border)",
                    display: "grid",
                    placeItems: "center",
                    marginRight: "16px",
                    fontWeight: "bold"
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {donor.anonymous ? 'Anonymous Donor' : `Donor ${donor.donorId.slice(0, 8)}`}
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.8 }}>
                      {donor.total} donations
                    </div>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700 }}>
                    {formatCurrency(donor.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Donations */}
          <div>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Recent Donations</h3>
            
            {/* Desktop Table View */}
            {!isMobile && (
              <div style={{ 
                display: "table",
                width: "100%",
                borderCollapse: "collapse"
              }}>
              <thead style={{
                position: "sticky",
                top: 0,
                background: "var(--bg)",
                borderBottom: "2px solid var(--border)",
                zIndex: 10
              }}>
                <tr>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)"
                  }}>
                    Donor
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)"
                  }}>
                    Animal
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)"
                  }}>
                    Amount
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)"
                  }}>
                    Message
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)"
                  }}>
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 10).map(donation => {
                  // Find the animal name for this donation
                  const animal = animals.find(a => a.id === donation.animal_id);
                  const animalName = animal ? animal.name : 'Unknown Animal';
                  
                  return (
                    <tr key={donation.id} style={{
                      borderBottom: "1px solid var(--border)",
                      "&:hover": {
                        background: "var(--panel)"
                      }
                    }}>
                      <td style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight: 500
                      }}>
                        {donation.anonymous ? 'Anonymous Donor' : `Donor ${donation.donor_id?.slice(0, 8) || 'Unknown'}`}
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "var(--muted)"
                      }}>
                        {animalName}
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--accent)"
                      }}>
                        {formatCurrency(donation.amount)}
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        maxWidth: "200px"
                      }}>
                        <div 
                          title={donation.message || 'No message'}
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: donation.message ? "var(--text)" : "var(--muted)"
                          }}
                        >
                          {donation.message || 'No message'}
                        </div>
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "var(--muted)"
                      }}>
                        {formatTimeAgo(donation.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </div>
            )}
            
            {/* Mobile Card View */}
            {isMobile && (
              <div style={{ 
                display: "grid", 
                gap: "12px"
              }}>
              {donations.slice(0, 10).map(donation => {
                // Find the animal name for this donation
                const animal = animals.find(a => a.id === donation.animal_id);
                const animalName = animal ? animal.name : 'Unknown Animal';
                
                return (
                  <div key={donation.id} style={{
                    padding: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    background: "var(--panel)"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          marginBottom: "4px",
                          fontSize: "14px"
                        }}>
                          {donation.anonymous ? 'Anonymous Donor' : `Donor ${donation.donor_id?.slice(0, 8) || 'Unknown'}`}
                        </div>
                        <div style={{ 
                          fontSize: "14px", 
                          color: "var(--muted)",
                          marginBottom: "8px"
                        }}>
                          {animalName}
                        </div>
                        <div 
                          title={donation.message || 'No message'}
                          style={{
                            fontSize: "14px",
                            color: donation.message ? "var(--text)" : "var(--muted)",
                            lineHeight: 1.4
                          }}
                        >
                          {donation.message || 'No message'}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", marginLeft: "16px" }}>
                        <div style={{ 
                          fontSize: "18px", 
                          fontWeight: 700, 
                          color: "var(--accent)",
                          marginBottom: "4px"
                        }}>
                          {formatCurrency(donation.amount)}
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "var(--muted)" 
                        }}>
                          {formatTimeAgo(donation.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </Card>
      </div>

      {/* Analytics Tab Content */}
      <div
        role="tabpanel"
        id="panel-analytics"
        aria-labelledby="tab-analytics"
        hidden={activeTab !== 'analytics'}
      >
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 24px 0", fontSize: "24px", fontWeight: 600 }}>Analytics & Reports</h2>
          
          {/* Charts Placeholder */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "24px",
            marginBottom: "32px"
          }}>
            {/* Donations Over Time Chart */}
            <Card style={{ padding: "20px" }}>
              {/* Header Row */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "16px" 
              }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Donations Over Time</h3>
                <select style={{
                  padding: "4px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: "12px",
                  cursor: "pointer"
                }}>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              
              {/* Chart Content Area */}
              <div style={{ 
                height: "200px", 
                background: "var(--panel)", 
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}>
                {/* Chart Placeholder */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  gap: "8px",
                  color: "var(--muted)"
                }}>
                  <BarChart3 size={32} color="var(--muted)" />
                  <div style={{ fontSize: "14px", textAlign: "center" }}>
                    Chart data will appear here
                  </div>
                </div>
                
                {/* Recharts Import Stub */}
                {/* import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'; */}
              </div>
              
              {/* Footer Caption */}
              <div style={{ 
                marginTop: "12px", 
                fontSize: "12px", 
                color: "var(--muted)",
                textAlign: "center"
              }}>
                Daily donation trends and patterns
              </div>
            </Card>
            
            {/* Donor Source Breakdown Chart */}
            <Card style={{ padding: "20px" }}>
              {/* Header Row */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "16px" 
              }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Donor Source Breakdown</h3>
                <select style={{
                  padding: "4px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: "12px",
                  cursor: "pointer"
                }}>
                  <option value="all">All time</option>
                  <option value="monthly">This month</option>
                  <option value="quarterly">This quarter</option>
                </select>
              </div>
              
              {/* Chart Content Area */}
              <div style={{ 
                height: "200px", 
                background: "var(--panel)", 
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}>
                {/* Chart Placeholder */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  gap: "8px",
                  color: "var(--muted)"
                }}>
                  <PieChart size={32} color="var(--muted)" />
                  <div style={{ fontSize: "14px", textAlign: "center" }}>
                    Chart data will appear here
                  </div>
                </div>
                
                {/* Recharts Import Stub */}
                {/* import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'; */}
              </div>
              
              {/* Footer Caption */}
              <div style={{ 
                marginTop: "12px", 
                fontSize: "12px", 
                color: "var(--muted)",
                textAlign: "center"
              }}>
                Distribution of donations by source
              </div>
            </Card>
            
            {/* Ambassador Engagement Chart */}
            <Card style={{ padding: "20px" }}>
              {/* Header Row */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "16px" 
              }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Ambassador Engagement</h3>
                <select style={{
                  padding: "4px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: "12px",
                  cursor: "pointer"
                }}>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="quarter">This quarter</option>
                </select>
              </div>
              
              {/* Chart Content Area */}
              <div style={{ 
                height: "200px", 
                background: "var(--panel)", 
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}>
                {/* Chart Placeholder */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  gap: "8px",
                  color: "var(--muted)"
                }}>
                  <TrendingUp size={32} color="var(--muted)" />
                  <div style={{ fontSize: "14px", textAlign: "center" }}>
                    Chart data will appear here
                  </div>
                </div>
                
                {/* Recharts Import Stub */}
                {/* import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'; */}
              </div>
              
              {/* Footer Caption */}
              <div style={{ 
                marginTop: "12px", 
                fontSize: "12px", 
                color: "var(--muted)",
                textAlign: "center"
              }}>
                Engagement metrics by ambassador
              </div>
            </Card>
          </div>

          {/* Export Options */}
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Export Reports</h3>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Button variant="outline">
                <FileSpreadsheet size={16} style={{ marginRight: "8px" }} />
                Export to CSV
              </Button>
              <Button variant="outline">
                <FileText size={16} style={{ marginRight: "8px" }} />
                Export to PDF
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Tab Content */}
      <div
        role="tabpanel"
        id="panel-settings"
        aria-labelledby="tab-settings"
        hidden={activeTab !== 'settings'}
      >
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 24px 0", fontSize: "24px", fontWeight: 600 }}>Branding & Settings</h2>
          
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Logo & Branding */}
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Logo & Branding</h3>
              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ 
                  width: "120px", 
                  height: "120px", 
                  border: "2px dashed var(--border)", 
                  borderRadius: "var(--radius-lg)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <Image size={24} color="var(--muted)" />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>Upload Logo</div>
                  </div>
                </div>
                <div style={{ 
                  width: "100%", 
                  height: "80px", 
                  border: "2px dashed var(--border)", 
                  borderRadius: "var(--radius-lg)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <ImagePlus size={24} color="var(--muted)" />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>Upload Banner</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Colors */}
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Theme Colors</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px" }}>
                {['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'].map(color => (
                  <div key={color} style={{
                    width: "100%",
                    height: "60px",
                    background: color,
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "border-color 0.2s ease"
                  }} />
                ))}
              </div>
            </div>

            {/* Payout Settings */}
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Payout Settings</h3>
              <div style={{ display: "grid", gap: "16px" }}>
                <Input placeholder="Stripe Account ID" />
                <Input placeholder="PayPal Email" />
                <Input placeholder="Crypto Wallet Address" />
              </div>
            </div>

            {/* Integrations */}
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600 }}>Social Integrations</h3>
              <div style={{ display: "grid", gap: "12px" }}>
                <Button variant="outline" style={{ justifyContent: "flex-start" }}>
                  <Twitter size={16} style={{ marginRight: "8px" }} />
                  Connect Twitter
                </Button>
                <Button variant="outline" style={{ justifyContent: "flex-start" }}>
                  <Music size={16} style={{ marginRight: "8px" }} />
                  Connect TikTok
                </Button>
                <Button variant="outline" style={{ justifyContent: "flex-start" }}>
                  <Youtube size={16} style={{ marginRight: "8px" }} />
                  Connect YouTube
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add New Animal Modal */}
      {showAddAnimal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <Card style={{
            padding: "24px",
            maxWidth: 500,
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h3 style={{ margin: "0 0 24px 0" }}>Add New Animal Ambassador</h3>
            
            <div style={{ display: "grid", gap: "20px" }}>
              <Input
                placeholder="Animal name"
                value={newAnimal.name}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <select
                  value={newAnimal.species}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, species: e.target.value }))}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    background: "var(--panel)",
                    color: "var(--text)",
                    fontSize: "14px",
                    width: "100%"
                  }}
                >
                  <option value="">Select Species</option>
                  {speciesOptions.map(species => (
                    <option key={species} value={species}>{species}</option>
                  ))}
                </select>
                <Input
                  placeholder="Breed"
                  value={newAnimal.breed}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, breed: e.target.value }))}
                />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input
                  placeholder="Age"
                  value={newAnimal.age}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, age: e.target.value }))}
                />
                <Input
                  placeholder="Fundraising goal ($)"
                  type="number"
                  value={newAnimal.goal}
                  onChange={(e) => setNewAnimal(prev => ({ ...prev, goal: e.target.value }))}
                />
              </div>
              
              <Textarea
                placeholder="Tell the animal's story..."
                value={newAnimal.bio}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Button onClick={handleAddAnimal} style={{ flex: 1 }}>
                Add Animal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddAnimal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Animal Modal */}
      {editingAnimal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <Card style={{
            padding: "24px",
            maxWidth: 500,
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h3 style={{ margin: "0 0 24px 0" }}>Edit Animal: {editingAnimal.name}</h3>
            
            <div style={{ display: "grid", gap: "20px" }}>
              <Input
                placeholder="Animal name"
                value={editingAnimal.name}
                onChange={(e) => setEditingAnimal(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <select
                  value={editingAnimal.species}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, species: e.target.value }))}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    background: "var(--panel)",
                    color: "var(--text)",
                    fontSize: "14px",
                    width: "100%"
                  }}
                >
                  <option value="">Select Species</option>
                  {speciesOptions.map(species => (
                    <option key={species} value={species}>{species}</option>
                  ))}
                </select>
                <Input
                  placeholder="Breed"
                  value={editingAnimal.breed}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, breed: e.target.value }))}
                />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <Input
                  placeholder="Age"
                  value={editingAnimal.age}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, age: e.target.value }))}
                />
                <Input
                  placeholder="Fundraising goal ($)"
                  type="number"
                  value={editingAnimal.goal}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, goal: e.target.value }))}
                />
              </div>
              
              <Textarea
                placeholder="Tell the animal's story..."
                value={editingAnimal.bio || ''}
                onChange={(e) => setEditingAnimal(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Button onClick={() => handleEditAnimal(editingAnimal)} style={{ flex: 1 }}>
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingAnimal(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
