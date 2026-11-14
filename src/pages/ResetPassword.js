import { useState } from "react";
import { CheckCircle, Eye, EyeOff, Lock, Mail, Plane } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { API_BASE_URL } from "../config";

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleResetPassword(event) {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword })
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Password reset service is unavailable. Please try again after the server has been updated.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to reset password");

      setIsComplete(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl">TravelBuddy</h1>
        </div>

        <Card>
          {isComplete ? (
            <CardContent className="py-10 text-center space-y-5">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Password Successfully Changed</h2>
                <p className="text-sm text-muted-foreground">Your password has been updated. You can now sign in with it.</p>
              </div>
              <Button className="w-full" onClick={() => navigate("/")}>Back to Login</Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Set a new password</CardTitle>
                <CardDescription>Your new password must be at least 8 characters.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <PasswordField
                    id="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    showPassword={showPassword}
                    onToggleVisibility={() => setShowPassword(!showPassword)}
                  />
                  <PasswordField
                    id="confirm-new-password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    showPassword={showPassword}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
                    {isSubmitting ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, showPassword, onToggleVisibility }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10 pr-10"
          required
        />
        {onToggleVisibility && (
          <button type="button" onClick={onToggleVisibility} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
