import { useState, useEffect, useRef } from "react";
import { MapPin, Globe, Camera, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

const availableLanguages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Hindi",
  "Arabic",
  "Portuguese",
  "Russian",
  "Japanese",
  "Other"
];

// Frontend ↔ Backend enum mapping
const YEAR_OPTIONS = [
  { label: "Freshman", value: "Freshman" },
  { label: "Sophomore", value: "Sophomore" },
  { label: "Junior", value: "Junior" },
  { label: "Senior", value: "Senior" },
  { label: "Masters", value: "Masters" },
  { label: "PhD", value: "PhD" },
];

const normalizeArr = (array) =>
  Array.isArray(array) ? array : [];

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { user, updateUser } = useAuth();
  const imageInputRef = useRef(null);
  const localImagePreviewRef = useRef("");
  const pendingImageFileRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localImagePreviewUrl, setLocalImagePreviewUrl] = useState("");
  const [signedImageUrl, setSignedImageUrl] = useState("");
  // Support existing user documents that used the original capitalized name.
  const profilePictureKey = user?.profilePicKey || user?.ProfilePicKey || "";

  const [profile, setProfile] = useState(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    college: user?.college ?? "",
    residence: user?.residence ?? "",
    year: user?.year ?? "",
    bio: user?.bio ?? "",
    languages: normalizeArr(user?.languages),
    profilePic: user?.profilePic ?? "",
  }));

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user?.name ?? "",
      email: user?.email ?? "",
      college: user?.college ?? "",
      residence: user?.residence ?? "",
      year: user?.year ?? "",
      bio: user?.bio ?? "",
      languages: normalizeArr(user?.languages),
    });
  }, [user]);

  useEffect(() => {
    const key = profilePictureKey;
    if (!key || key.startsWith("http")) {
      setSignedImageUrl("");
      return undefined;
    }

    let isCurrent = true;
    let refreshTimer;

    async function refreshProfileImageUrl() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/me/profile-picture?key=${encodeURIComponent(key)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not retrieve the profile picture.");
        }
        if (!isCurrent) return;

        setSignedImageUrl(data.url);

        // Renew five minutes before the one-hour URL expires.
        const expiresAt = Date.parse(data.expiresAt);
        const refreshIn = Number.isFinite(expiresAt)
          ? Math.max(30_000, expiresAt - Date.now() - 5 * 60 * 1000)
          : 55 * 60 * 1000;
        refreshTimer = window.setTimeout(refreshProfileImageUrl, refreshIn);
      } catch (error) {
        // Keep the currently rendered URL in place and retry when the profile
        // is next opened or the component remounts.
        console.error("Profile-picture URL refresh failed:", error.message);
      }
    }

    refreshProfileImageUrl();

    return () => {
      isCurrent = false;
      window.clearTimeout(refreshTimer);
    };
  }, [profilePictureKey]);

  useEffect(() => () => {
    if (localImagePreviewRef.current) {
      URL.revokeObjectURL(localImagePreviewRef.current);
    }
  }, []);

  function handleImageSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }

    if (localImagePreviewRef.current) {
      URL.revokeObjectURL(localImagePreviewRef.current);
    }
    pendingImageFileRef.current = file;
    localImagePreviewRef.current = URL.createObjectURL(file);
    setLocalImagePreviewUrl(localImagePreviewRef.current);
  }

  async function uploadProfilePicture(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/users/me/profile-picture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Profile-picture upload failed.");
    return data.key;
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!profile.name || !profile.email) {
      toast.error("Name and email are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");

      const temp = {};
      if (profile.year) temp.year = profile.year;
      if (profile.bio !== undefined) temp.bio = profile.bio;
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: profile.name,
          college: profile.college,
          residence: profile.residence,
          year: temp.year,
          bio: temp.bio,
          languages: profile.languages,
          //profilePic: profile.profilePic
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      let updatedUser = data.user;
      if (pendingImageFileRef.current) {
        setIsUploadingImage(true);
        const key = await uploadProfilePicture(pendingImageFileRef.current, token);
        pendingImageFileRef.current = null;
        updatedUser = { ...updatedUser, profilePicKey: key, ProfilePicKey: key };
      }

      setProfile({
        name: updatedUser.name ?? "",
        email: updatedUser.email ?? "",
        college: updatedUser.college ?? "",
        residence: updatedUser.residence ?? "",
        year: updatedUser.year ?? "",
        bio: updatedUser.bio ?? "",
        languages: updatedUser.languages,
        profilePic: updatedUser.profilePic ?? "",
      });

      updateUser(updatedUser);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  function handleCancelEdit() {
    pendingImageFileRef.current = null;
    if (localImagePreviewRef.current) {
      URL.revokeObjectURL(localImagePreviewRef.current);
      localImagePreviewRef.current = "";
    }
    setLocalImagePreviewUrl("");
    setIsEditing(false);
  }

  
  const toggleLanguage = (language) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const profileImageSrc = localImagePreviewUrl || signedImageUrl ||
    (profilePictureKey.startsWith("http") ? profilePictureKey : user?.profilePic) ||
    "../logo.svg";
  

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl mb-2">My Profile</h2>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit} disabled={isUploadingImage}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploadingImage}>
              <Save className="w-4 h-4 mr-2" />
              {isUploadingImage ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Picture */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img 
                src={profileImageSrc}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  aria-label="Choose a profile image"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEditing && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Choose a picture, then save your changes to upload it</p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelected}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isUploadingImage ? "Uploading..." : "Choose Image"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled={true}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input
                id="college"
                placeholder="e.g., Georgia Tech"
                value={profile.college}
                onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Residence</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="residence"
                placeholder="e.g., North Ave Apartments"
                value={profile.residence}
                onChange={(e) => setProfile({ ...profile, residence: e.target.value })}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <div className="relative">
              <select
                id="year"
                value={profile.year}
                onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                disabled={!isEditing}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] 
                aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive">
                <option value="">Select year</option>
                {YEAR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell others about yourself (major, hobbies)..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>Languages you speak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableLanguages.map((language) => (
              <Badge
                key={language}
                variant={profile.languages.includes(language) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  isEditing ? "hover:bg-cyan-100" : "cursor-default"
                } ${
                  profile.languages.includes(language) 
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white" 
                    : ""
                }`}
                onClick={() => isEditing && toggleLanguage(language)}
              >
                <Globe className="w-3 h-3 mr-1" />
                {language}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
