import { useState, useEffect } from "react";
import { Plus, Plane, Calendar, Clock, MapPin, Users, Car, Bus, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

// Frontend ↔ Backend enum mapping
const TRANSPORT_OPTIONS = [
  { label: "Personal car", value: "Personal car" },
  { label: "Rideshare (Uber/Lyft)", value: "Rideshare" },
  { label: "Public bus", value: "Public transit" },
  { label: "Public train", value: "Public transit" },
  { label: "Other", value: "Other" },
];

// Helper function to convert time (from front-end React) to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper function to combine date and time (from front-end React) to a UTC format used by MongoDB
function combineDateAndTime(dateStr, timeStr, type) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

// Helper function to split Date object (from MongoDB) to date and time (for front-end React)
function splitDateAndTime(dateVal, dateType = "reg", type, isEditing = false) {
  if (!dateVal) return "";
  const dateObj = new Date(dateVal);
  if (isNaN(dateObj)) return "";

  if (type === "date") {
    if (dateType === "reg") {
      return dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
    } else {
      const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
      const day = String(dateObj.getDate()).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${month}-${day}-${year}`;
    }
  } else if (type === "time") {
    let hours = dateObj.getHours(); // 0-23
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

    if (isEditing) {
      // 24-hour format required for <input type="time">
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    } else {
      // 12-hour format with AM/PM for display
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12; // convert 0 → 12
      return `${hours}:${minutes} ${period}`;
    }
  }
}

// Helper function to calculate time leaving for the airport (readable)
function calculateLeaveTime(dateVal, minutesBefore, isEditing = false) {
  if (!dateVal) return "";

  const dateObj = new Date(dateVal);
  if (isNaN(dateObj)) return "";

  // Subtract the minutes safely
  dateObj.setMinutes(dateObj.getMinutes() - Number(minutesBefore));

  const hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  if (isEditing) {
    // 24-hour format for <input type="time">
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  } else {
    // 12-hour format with AM/PM for display
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // convert 0 → 12
    return `${displayHours}:${minutes} ${period}`;
  }
}

const initialTripData = {
  id: "",
  airline: "",
  flightNum: "",
  depAirport: "",
  arrAirport: "",
  depDate: "",
  depTime: "",
  arrDate: "",
  arrTime: "",
  timeDepToAirport: "",
  transportMode: "",
  addNotes: ""
}

export function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) return;

    async function fetchTrips() {
      try {
      const res = await fetch(`${API_BASE_URL}/api/trips/trips?userId=${user._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json", 
        },
        });
        if (!res.ok) throw new Error("Failed to fetch trips");
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        alert(err.message);
        setTrips([]);
      }
    }
    fetchTrips();
  }, [user?._id]);

  const [newTripData, setNewTripData] = useState(initialTripData);

  const getTransportIcon = (mode) => {
    switch (mode) {
      case "car": return <Car className="w-4 h-4" />;
      case "bus": return <Bus className="w-4 h-4" />;
      case "rideshare": return <Users className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  async function handleAddTrip() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE_URL}/api/trips/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          airline: newTripData.airline,
          flightNum: newTripData.flightNum,
          depAirport: newTripData.depAirport,
          arrAirport: newTripData.arrAirport,
          transportMode: newTripData.transportMode,
          depAt: combineDateAndTime(newTripData.depDate, newTripData.depTime),
          arrAt: combineDateAndTime(newTripData.arrDate, newTripData.arrTime),
          timeDepToAirport: (timeToMinutes(newTripData.depTime) - timeToMinutes(newTripData.timeDepToAirport)),
          addNotes: newTripData.addNotes
        })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Cannot add trip");
        setNewTripData(initialTripData);
        setTrips(prevTrips => [...prevTrips, data]);
        toast.success("Trip added successfully!");
        setDialogOpen(false);
      } catch (err) {
        alert(err.message);
      }
  }

  async function handleEditTrip(trip) {
    setEditingTrip(true);
    setDialogOpen(true);
    setNewTripData(
      {
        id: trip._id,
        airline: trip.airline,
        flightNum: trip.flightNum,
        depAirport: trip.depAirport,
        arrAirport: trip.arrAirport,
        depDate: splitDateAndTime(trip.depAt, "reg", "date", true),
        depTime: splitDateAndTime(trip.depAt, "reg", "time", true),
        arrDate: splitDateAndTime(trip.arrAt, "reg", "date", true),
        arrTime: splitDateAndTime(trip.arrAt, "reg", "time", true),
        timeDepToAirport: calculateLeaveTime(trip.depAt, trip.timeDepToAirport, true),
        transportMode: trip.transportMode,
        addNotes: trip.addNotes
      }
    );
  }

  async function saveTrip() {
    const token = localStorage.getItem("token");
    try {
      const tripId = newTripData.id;
      const res = await fetch(`${API_BASE_URL}/api/trips/trips/${tripId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          airline: newTripData.airline,
          flightNum: newTripData.flightNum,
          depAirport: newTripData.depAirport,
          arrAirport: newTripData.arrAirport,
          transportMode: newTripData.transportMode,
          depAt: combineDateAndTime(newTripData.depDate, newTripData.depTime),
          arrAt: combineDateAndTime(newTripData.arrDate, newTripData.arrTime),
          timeDepToAirport: (timeToMinutes(newTripData.depTime) - timeToMinutes(newTripData.timeDepToAirport)),
          addNotes: newTripData.addNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      console.log(data);
      toast.success("Trip updated successfully!");
      setTrips(prevTrips => prevTrips.map(trip => 
      trip._id === data._id ? data : trip
      ));
      setNewTripData(initialTripData);
      setDialogOpen(false);
      setEditingTrip(false);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTrip(tripId) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE_URL}/api/trips/trips/${tripId}?userId=${user._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error deleting trip");
      setTrips(prev => prev.filter(trip => trip._id !== tripId));
      toast.success("Trip deleted successfully!");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl mb-2">My Trips</h2>
          <p className="text-muted-foreground">Manage your upcoming travel plans and find travel buddies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrip ? "Edit Trip" : "Add New Trip"}</DialogTitle>
              <DialogDescription>
                Enter your trip details to find travel companions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Flight Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Flight Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="airline">Airline *</Label>
                    <Input
                      id="airline"
                      placeholder="e.g., United Airlines"
                      value={newTripData.airline}
                      onChange={(e) => setNewTripData({ ...newTripData, airline: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flightNumber">Flight Number *</Label>
                    <Input
                      id="flightNumber"
                      placeholder="e.g., UA1234"
                      value={newTripData.flightNum}
                      onChange={(e) => setNewTripData({ ...newTripData, flightNum: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureAirport">Departure Airport *</Label>
                    <Input
                      id="departureAirport"
                      placeholder="e.g., ATL"
                      value={newTripData.depAirport}
                      onChange={(e) => setNewTripData({ ...newTripData, depAirport: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalAirport">Arrival Airport *</Label>
                    <Input
                      id="arrivalAirport"
                      placeholder="e.g., EWR"
                      value={newTripData.arrAirport}
                      onChange={(e) => setNewTripData({ ...newTripData, arrAirport: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureDate">Departure Date *</Label>
                    <Input
                      id="departureDate"
                      type="date"
                      value={newTripData.depDate}
                      onChange={(e) => setNewTripData({ ...newTripData, depDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departureTime">Departure Time *</Label>
                    <Input
                      id="departureTime"
                      type="time"
                      value={newTripData.depTime}
                      onChange={(e) => setNewTripData({ ...newTripData, depTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDate">Arrival Date *</Label>
                    <Input
                      id="arrivalDate"
                      type="date"
                      value={newTripData.arrDate}
                      onChange={(e) => setNewTripData({ ...newTripData, arrDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalTime">Arrival Time *</Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={newTripData.arrTime}
                      onChange={(e) => setNewTripData({ ...newTripData, arrTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* College Transportation */}
              <div className="space-y-4">
                <h3 className="font-semibold">Transportation to Airport</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveCollegeTime">Time Leaving College *</Label>
                    <Input
                      id="leaveCollegeTime"
                      type="time"
                      value={newTripData.timeDepToAirport}
                      onChange={(e) => setNewTripData({ ...newTripData, timeDepToAirport: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportMode">Mode of Transportation *</Label>
                    <select
                      id="mode"
                      value={newTripData.transportMode}
                      onChange={(e) => setNewTripData({ ...newTripData, transportMode: e.target.value })}
                      required
                      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] 
                      aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive">
                      <option value="">Select mode</option>
                      {TRANSPORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                  </div>
                </div>
              </div>

              {/* Group Matching
              <div className="space-y-4">
                <h3 className="font-semibold">Group Matching Preferences</h3>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="openToGroupMatching"
                    checked={formData.openToGroupMatching}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      openToGroupMatching: e.target.checked 
                    })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="openToGroupMatching" className="cursor-pointer">
                    Open to group matching (2-4 people)
                  </Label>
                </div>

                {formData.openToGroupMatching && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="openSeats">Open Seats Available</Label>
                      <Select 
                        value={formData.openSeats?.toString()} 
                        onValueChange={(value) => setFormData({ ...formData, openSeats: parseInt(value) })}
                      >
                        <SelectTrigger id="openSeats">
                          <SelectValue placeholder="Select seats" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 seat</SelectItem>
                          <SelectItem value="2">2 seats</SelectItem>
                          <SelectItem value="3">3 seats</SelectItem>
                          <SelectItem value="4">4 seats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxGroupSize">Max Group Size</Label>
                      <Select 
                        value={formData.maxGroupSize?.toString()} 
                        onValueChange={(value) => setFormData({ ...formData, maxGroupSize: parseInt(value) })}
                      >
                        <SelectTrigger id="maxGroupSize">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 people</SelectItem>
                          <SelectItem value="3">3 people</SelectItem>
                          <SelectItem value="4">4 people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              */}
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Input
                  id="notes"
                  placeholder="Any additional details about your trip..."
                  value={newTripData.addNotes}
                  onChange={(e) => setNewTripData({ ...newTripData, addNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button onClick={ editingTrip ? saveTrip : handleAddTrip}>
                {editingTrip ? "Update Trip" : "Add Trip"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Plane className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-4">Add your first trip to start finding travel buddies</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trips.map((trip) => (
            <Card key={trip._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Plane className="w-5 h-5 text-teal-600" />
                      <h3 className="text-xl">
                        {trip.airline} {trip.flightNum && `- ${trip.flightNum}`}
                      </h3>
                      {trip.openToGroupMatching && (
                        <Badge className="bg-cyan-500">
                          <Users className="w-3 h-3 mr-1" />
                          Group Trip
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.depAirport} → {trip.arrAirport}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditTrip(trip)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteTrip(trip._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Departure */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Departure</p>
                      <p className="font-medium">{splitDateAndTime(trip.depAt, "non-reg", "date")}</p>
                      <p className="text-sm">{splitDateAndTime(trip.depAt, "reg", "time")}</p>
                    </div>
                  </div>

                  {/* Arrival */}
                  {trip.arrAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Arrival</p>
                        <p className="font-medium">{splitDateAndTime(trip.arrAt, "non-reg", "date")}</p>
                        {trip.arrAt && <p className="text-sm">{splitDateAndTime(trip.arrAt, "reg", "time")}</p>}
                      </div>
                    </div>
                  )}

                  {/* Leave College */}
                  {trip.timeDepToAirport && (
                    <div className="flex items-center gap-2">
                      {getTransportIcon(trip.transportMode)}
                      <div>
                        <p className="text-sm text-muted-foreground">Leaving College</p>
                        <p className="font-medium">{calculateLeaveTime(trip.depAt, trip.timeDepToAirport)}</p>
                        <p className="text-sm capitalize">{trip.transportMode}</p>
                      </div>
                    </div>
                  )}
                </div>

                
                {/* Group Info 
                {trip.openToGroupMatching && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{trip.openSeats} open seat{trip.openSeats > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Max group:</span>
                        <span>{trip.maxGroupSize} people</span>
                      </div>
                    </div>
                  </div>
                )}
                */}

                {/* Notes */}
                {trip.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{trip.addNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
