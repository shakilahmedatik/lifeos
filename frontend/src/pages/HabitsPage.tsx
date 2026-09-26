import { useState } from "react";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import { HabitBuilder } from "../modules/habits/components/HabitBuilder.js";
import { HabitHistory } from "../modules/habits/components/HabitHistory.js";
import { HabitOverview } from "../modules/habits/components/HabitOverview.js";
import { useHabitBuilder } from "../modules/habits/hooks/useHabitBuilder.js";
import { useHabitProgress } from "../modules/habits/hooks/useHabitProgress.js";

type Tab = "overview" | "builder" | "history";

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
  } = useHabitBuilder();
  const { refresh: _refreshProgress } = useHabitProgress();

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
            onArchive={async (id) => {
              await toggleArchive(id);
            }}
            onReorder={reorderHabits}
          />
        </TabsContent>

        <TabsContent value="history">
          <HabitHistory habits={habits} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
