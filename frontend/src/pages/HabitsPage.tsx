import { useState } from "react";
import BackupPanel from "../components/ui/BackupPanel.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import { habitApi } from "../modules/habits/api.js";
import { HabitBuilder } from "../modules/habits/components/HabitBuilder.js";
import { HabitHistory } from "../modules/habits/components/HabitHistory.js";
import { HabitOverview } from "../modules/habits/components/HabitOverview.js";
import { useHabitBuilder } from "../modules/habits/hooks/useHabitBuilder.js";
import { useHabitProgress } from "../modules/habits/hooks/useHabitProgress.js";

type Tab = "overview" | "builder" | "history" | "backup";

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const {
    habits,
    loading: builderLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleArchive,
    reorderHabits,
    refresh: refreshBuilder,
  } = useHabitBuilder();
  const { refresh: refreshProgress } = useHabitProgress();

  const handleImportComplete = () => {
    refreshBuilder();
    refreshProgress();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Habits"
        description="Build positive routines and track your daily progress"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} variant="underline">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <HabitOverview
            habits={habits}
            loading={builderLoading}
            onNavigateBuilder={() => setActiveTab("builder")}
          />
        </TabsContent>

        <TabsContent value="builder">
          <HabitBuilder
            habits={habits}
            loading={builderLoading}
            onCreate={createHabit}
            onUpdate={updateHabit}
            onDelete={deleteHabit}
            onArchive={toggleArchive}
            onReorder={reorderHabits}
          />
        </TabsContent>

        <TabsContent value="history">
          <HabitHistory habits={habits} />
        </TabsContent>

        <TabsContent value="backup">
          <BackupPanel
            entityName="Habits"
            onExportJson={() => habitApi.exportData()}
            onImportJson={async (data) => {
              await habitApi.importData(data);
              handleImportComplete();
              return { success: true, message: "Habits imported successfully" };
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
