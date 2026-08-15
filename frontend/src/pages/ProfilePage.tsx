import { Settings, Shield, User } from "lucide-react";
import { OnlineOnlyBanner } from "../components/ui/OnlineOnlyBanner.js";
import PageHeader from "../components/ui/PageHeader.js";
import Tabs, { TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      <PageHeader
        title="User Profile & Settings"
        description="Manage your account profile details, systemwide application settings, backups, and security."
      />

      <OnlineOnlyBanner moduleName="User Profile" />

      <ProfileHeader user={user} />

      <Tabs defaultValue="account" variant="pill" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account" className="gap-2">
            <User className="w-4 h-4" /> Account Details
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="w-4 h-4" /> System Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" /> Security & Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileEditForm user={user} />
            <SystemSettingsCard />
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 gap-6">
            <SystemSettingsCard />
            <SystemManagementCard />
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountSecurityCard />
            <SystemManagementCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
