import { useState, useEffect } from "react";
import { Plane, MapPin, Users, Heart, LogOut, User, Briefcase, MessageCircle, Settings } from "lucide-react";
import { TravelerCard, Traveler } from "../components/TravelerCard";
import { ProfileDialog } from "../components/ProfileDialog";
import { FilterBar } from "../components/FilterBar";
import { ProfilePage, UserProfile } from "../components/ProfilePage";
import { TripsPage } from "../components/TripsPage";
import { ChatPage } from "../components/ChatPage";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";


export default function Home() {
    const navigate = useNavigate();
    const { user, login, logout } = useAuth();

   // Navigation tab states
   const [currentPage, setCurrentPage] = useState("browse");

   // Filter bar states
   const [filteredTrips, setFilteredTrips] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedDestination, setSelectedDestination] = useState("ALL");
   const [selectedTransportMode, setSelectedTransportMode] = useState("ALL");

   // Profile page states
   const [profileDialogOpen, setProfileDialogOpen] = useState(false);

    async function handleLogout(e) {
        e.preventDefault();
        logout();
        toast.success(`Successfully logged out!`);
        navigate("/");
    }

    async function fetchFilteredTrips(dest, mode) {
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams();
            if (dest) params.append("dest", dest);
            if (mode) params.append("mode", mode);
            const res = await fetch(`${API_BASE_URL}/api/matches/filter?${params.toString()}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Update failed");
            toast.success(`${data.length} trips found!`);
            setFilteredTrips(data);
        } catch (err) {
            alert(err.message);
        }
    }

    useEffect(() => {
        async function fetchTrips() {
            try {
                const token = localStorage.getItem("token");
                const hasFilters = (selectedDestination && selectedDestination !== "ALL")|| (selectedTransportMode && selectedTransportMode !== "ALL");

                const url = hasFilters
                    ? `${API_BASE_URL}/api/matches/filter?${new URLSearchParams({
                        ...(selectedDestination && { dest: selectedDestination }),
                        ...(selectedTransportMode && { mode: selectedTransportMode })
                    }).toString()}`
                    : `${API_BASE_URL}/api/matches/allMatches`;

                console.log(url);
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });
        
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Update failed");
                toast.success(`${data.length} trips found!`);
                setFilteredTrips(data);
            } catch (err) {
                alert(err.message);
            }
        }
        fetchTrips();
      }, [selectedDestination, selectedTransportMode]);

    async function handleDestinationChange(dest) {
        setSelectedDestination(dest);
        //fetchFilteredTrips(dest, selectedTransportMode);
    };

    async function handleModeChange(mode) {
        setSelectedTransportMode(mode);
        //fetchFilteredTrips(selectedDestination, mode);
    };

    async function handleConnect() {
        toast.success("Connected!");
    }

    async function handleViewProfile() {
        toast.success("View Profile!");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
            <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl">TravelBuddy</h1>
                    <p className="text-xs text-muted-foreground">Find your perfect travel companion</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <div className="hidden md:block text-sm text-muted-foreground mr-2">
                    Welcome, {user?.name ?? ""}!
                </div>
                <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Saved</span>
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setProfileDialogOpen(true)}
                    className="bg-teal-50 border-teal-200 hover:bg-teal-100"
                >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Profile</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
                </div>
            </div>
            </div>
            </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 text-white py-12">
            <div className="container mx-auto px-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl mb-3">Discover Your Next Travel Adventure</h2>
                <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                Connect with like-minded travelers, share experiences, and explore the world together
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center">
                <Tabs value={currentPage} onValueChange={setCurrentPage} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:text-teal-600">
                    <Users className="w-4 h-4 mr-2" />
                    Browse
                    </TabsTrigger>
                    <TabsTrigger value="trips" className="data-[state=active]:bg-white data-[state=active]:text-teal-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    My Trips
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-teal-600">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                    </TabsTrigger>
                </TabsList>
                </Tabs>
            </div>
            </div>
        </section>

        {currentPage === "browse" && (
            <>
            <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDestination={selectedDestination}
                onDestinationChange={handleDestinationChange}
                selectedTransportMode={selectedTransportMode}
                onSelectedTransportMode={handleModeChange}
            />
            {/* Results Section */}
            <section className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl mb-1">
                    All travel buddies
                    </h3>
                    <p className="text-muted-foreground">
                    {filteredTrips.length} {filteredTrips.length === 1 ? 'traveler' : 'travelers'} found
                    </p>
                </div>
                </div>

                {filteredTrips.length === 0 ? (
                <div className="text-center py-16">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl mb-2">No travelers found</h3>
                    <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                    </p>
                    <Button 
                    variant="outline"
                    onClick={() => {
                        setSearchQuery("");
                        setSelectedDestination("All Destinations");
                        setSelectedTransportMode("All Transport Modes");
                        //fetchAllTrips();
                    }}
                    >
                    Clear All Filters
                    </Button>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTrips.map((traveler) => (
                    <TravelerCard
                        key={traveler.id}
                        traveler={traveler}
                        onConnect={handleConnect}
                        onViewProfile={handleViewProfile}
                    />
                    ))}
                </div>
                )}
            </section>
            </>
        )}

        {currentPage === "trips" && (
        <TripsPage />
        )}

        {currentPage === "chat" && (
        <ChatPage />
        )}

        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>My Profile</DialogTitle>
            </DialogHeader>
            <ProfilePage/>
            </DialogContent>
        </Dialog>

            
      </div>
    );
}
