import { MapPin, Calendar, Globe, MessageCircle, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";


export function ProfileDialog({ traveler, open, onOpenChange, onConnect }) {
  if (!traveler) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Traveler Profile</DialogTitle>
        </DialogHeader>

        {/* Destination Image */}
        <div className="relative h-64 -mx-6 -mt-6 mb-4 overflow-hidden">
          <img 
            src={traveler.destinationImage} 
            alt={traveler.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6">
            <h2 className="text-white text-2xl mb-1">{traveler.destination}</h2>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{traveler.startDate} - {traveler.endDate}</span>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-4 mb-6">
          <img 
            src={traveler.image}
            alt={traveler.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl">{traveler.name}, {traveler.age}</h3>
              {traveler.verified && (
                <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 20 20">
                  <path d="M10 0L12.39 6.26L19.18 6.26L13.82 10.48L16.18 16.74L10 12.52L3.82 16.74L6.18 10.48L0.82 6.26L7.61 6.26L10 0Z"/>
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{traveler.location}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onConnect(traveler.id)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Connect
              </Button>
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <h4 className="mb-2">About</h4>
          <p className="text-muted-foreground">{traveler.bio}</p>
        </div>

        {/* Travel Style */}
        <div className="mb-6">
          <h4 className="mb-2">Travel Style</h4>
          <div className="flex flex-wrap gap-2">
            {traveler.travelStyle.map((style, index) => (
              <Badge key={index} variant="secondary">
                {style}
              </Badge>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="mb-6">
          <h4 className="mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {traveler.interests.map((interest, index) => (
              <Badge key={index} variant="outline">
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <h4 className="mb-2">Languages</h4>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{traveler.languages.join(", ")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
