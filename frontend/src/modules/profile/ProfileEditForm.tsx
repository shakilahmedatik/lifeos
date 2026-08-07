import { CheckCircle2, Mail, Save, User as UserIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import ErrorBanner from "../../components/ui/ErrorBanner.js";
import { Input } from "../../components/ui/Input.js";
import { FormField } from "../../components/ui/FormField.js";
import { type UserSession, useAuth } from "../../context/AuthContext.js";
import { api } from "../../lib/api.js";

interface ProfileEditFormProps {
  user: UserSession;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user }) => {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.updateProfile({ name, email });
      if (res.user) {
        updateUser(res.user);
        setSuccess("Profile details updated successfully!");
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = name !== user.name || email !== user.email;

  return (
    <Card className="bg-surface/60 border-border p-6 shadow-lg">
      <CardHeader className="mb-4">
        <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-amber-400" />
          Personal Details
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

          {success && (
            <div className="flex items-center gap-2.5 p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <FormField label="Full Name">
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              className="bg-surface/60 border-border text-primary placeholder-muted focus:border-amber-500"
            />
          </FormField>

          <FormField label="Email Address">
            <div className="relative">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-surface/60 border-border text-primary placeholder-muted focus:border-amber-500 pr-10"
              />
              <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </FormField>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={!hasChanges || loading}
              loading={loading}
              icon={<Save className="w-4 h-4 mr-1" />}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-all duration-200"
            >
              Save Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
