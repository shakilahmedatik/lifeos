import { OnlineOnlyBanner } from "../components/ui/OnlineOnlyBanner.js";
import PageHeader from "../components/ui/PageHeader.js";
import { useAuth } from "../context/AuthContext.js";
import { AccountSecurityCard } from "../modules/profile/AccountSecurityCard.js";
import { ProfileEditForm } from "../modules/profile/ProfileEditForm.js";
import { ProfileHeader } from "../modules/profile/ProfileHeader.js";
import { SystemManagementCard } from "../modules/profile/SystemManagementCard.js";
import { SystemSettingsCard } from "../modules/profile/SystemSettingsCard.js";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      <PageHeader
        title="User Profile & Settings"
        description="Manage your account profile, visual preferences, system health, and session security in one place."
      />

      <OnlineOnlyBanner moduleName="User Profile" />

      {/* Hero Profile Overview Card */}
      <ProfileHeader user={user} />

      {/* Unified 2-Column Section (No Tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Details & Security */}
        <div className="lg:col-span-7 space-y-6">
          <ProfileEditForm user={user} />
          <AccountSecurityCard />
        </div>

        {/* Right Column: System Preferences & Infrastructure */}
        <div className="lg:col-span-5 space-y-6">
          <SystemSettingsCard />
          <SystemManagementCard />
        </div>
      </div>
    </div>
  );
}
