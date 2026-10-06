import { MapPin, Calendar, Heart, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";


export function TravelerCard({ traveler, onConnect, onViewProfile }) {

  const AIRPORT_MAP = {
    EWR: "Newark, NJ",
    ATL: "Atlanta, GA",
    DFW: "Dallas, TX",
    LAX: "Los Angeles, CA",
    MCO: "Orlando, FL",
    DEL: "Delhi, India",
  };

  const MONTH_MAP = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sept",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec"
  };

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
        return `${MONTH_MAP[month]} ${day}, ${year}`;
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      {/* Destination Image
      <div className="relative h-48 overflow-hidden" onClick={() => onViewProfile(traveler)}>
        
        <img 
          src={traveler.destinationImage} 
          alt={traveler.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-black hover:bg-white">
            {traveler.travelStyle[0]}
          </Badge>
        </div>
      </div>
       */}
      {/* Profile Section */}
      <div className="p-4" onClick={() => onViewProfile(traveler)}>
        {/* User Info */}
        <div className="flex items-start gap-3 mb-3">
          {/*}
          <img 
            src={traveler.image}
            alt={traveler.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
          />
          */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{ traveler.userId.name }</h3>
              <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 20 20">
                <path d="M10 0L12.39 6.26L19.18 6.26L13.82 10.48L16.18 16.74L10 12.52L3.82 16.74L6.18 10.48L0.82 6.26L7.61 6.26L10 0Z"/>
              </svg>
            </div>
            <p className="text-sm text-muted-foreground"> {traveler?.userId?.residence && traveler?.userId?.college
                ? `${traveler.userId.residence}, ${traveler.userId.college}`
                : traveler?.userId?.residence || traveler?.userId?.college || "—"}</p>
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{ AIRPORT_MAP[traveler.depAirport] || traveler.depAirport }</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span> { `${splitDateAndTime(traveler.depAt, "non-reg", "date", false)} - ${splitDateAndTime(traveler.arrAt, "non-reg", "date", false)}`} </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          { traveler.userId.bio }
        </p>

    
        {/* Interests */}
        {/*
        <div className="flex flex-wrap gap-1.5 mb-4">
          {traveler.interests.slice(0, 3).map((interest, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
          {traveler.interests.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{traveler.interests.length - 3}
            </Badge>
          )}
        </div>
      */}
      </div>
      

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onConnect(traveler.id);
          }}
          className="flex-1"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Connect
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
