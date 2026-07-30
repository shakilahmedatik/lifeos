import {
  ChevronRight as ChevronRightIcon,
  Dumbbell as DumbbellIcon,
  Plus as PlusIcon,
} from "lucide-react";
import { type SubmitEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../components/ui/Card.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { Input } from "../components/ui/Input.js";
import Modal from "../components/ui/Modal.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import { CoachMode } from "../modules/workouts/CoachMode.js";
import { ExerciseLibrary } from "../modules/workouts/ExerciseLibrary.js";
import { useWorkouts } from "../modules/workouts/useWorkouts.js";
import { WorkoutDetail } from "../modules/workouts/WorkoutDetail.js";
import { WorkoutHistoryWithFilter } from "../modules/workouts/WorkoutHistoryWithFilter.js";
import { WorkoutProgress } from "../modules/workouts/WorkoutProgress.js";
import { WorkoutSessionDetail } from "../modules/workouts/WorkoutSessionDetail.js";

type Tab = "dashboard" | "history" | "plans" | "exercises";

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const location = useLocation();
  const navigate = useNavigate();

  // Views:
  // plans -> list (default), detail (selectedWorkoutId), coach (isCoaching)
  // history -> list (default), sessionDetail (selectedSessionId)

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { workouts, loading, error, createWorkout, refresh } = useWorkouts();
  const { success, error: showError } = useAppToast();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newWorkoutDesc, setNewWorkoutDesc] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const startSessionId = searchParams.get("startSession");
    const taskId = searchParams.get("taskId");

    if (startSessionId && workouts.length > 0) {
      const workoutExists = workouts.some((w) => w.id === startSessionId);
      if (workoutExists) {
        setSelectedWorkoutId(startSessionId);
        if (taskId) setSelectedTaskId(taskId);
        setIsCoaching(true);
        // Remove the query param so it doesn't auto-start again on refresh
        navigate("/workouts", { replace: true });
      }
    }
  }, [location.search, workouts, navigate]);

  const handleCreateWorkout = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!newWorkoutName.trim()) return;
    try {
      await createWorkout({ name: newWorkoutName, description: newWorkoutDesc });
      success("Workout created");
      setIsNewModalOpen(false);
      setNewWorkoutName("");
      setNewWorkoutDesc("");
    } catch {
      showError("Failed to create workout");
    }
  };

  const handleFinishCoaching = () => {
    setIsCoaching(false);
    setSelectedWorkoutId(null);
    setSelectedTaskId(null);
    success("Workout completed!");
    refresh();
  };

  // Rendering specific views
  if (isCoaching && selectedWorkoutId) {
    return (
      <CoachMode
        workoutId={selectedWorkoutId}
        taskId={selectedTaskId || undefined}
        onComplete={handleFinishCoaching}
        onExit={() => {
          setIsCoaching(false);
          setSelectedTaskId(null);
        }}
      />
    );
  }

  if (selectedWorkoutId) {
    return (
      <WorkoutDetail
        workoutId={selectedWorkoutId}
        onBack={() => setSelectedWorkoutId(null)}
        onStartSession={() => setIsCoaching(true)}
        onDeleted={() => {
          setSelectedWorkoutId(null);
          refresh();
        }}
      />
    );
  }

  if (selectedSessionId) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => setSelectedSessionId(null)}>
          &larr; Back to History
        </Button>
        <WorkoutSessionDetail
          sessionId={selectedSessionId}
          onDeleted={() => setSelectedSessionId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Workouts" description="Track your training" />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} variant="underline">
        <TabsList className="w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-200">Your Plans</h2>
              <Button onClick={() => setIsNewModalOpen(true)} variant="primary">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Workout
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">{error}</div>
            ) : workouts.length === 0 ? (
              <EmptyState
                icon={DumbbellIcon}
                title="No workout plans yet."
                description="Create your first workout plan to get started."
                action={
                  <Button onClick={() => setIsNewModalOpen(true)} variant="primary">
                    Create your first workout
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workouts.map((w) => (
                  <button
                    type="button"
                    key={w.id}
                    className="w-full text-left"
                    onClick={() => setSelectedWorkoutId(w.id)}
                  >
                    <Card className="group cursor-pointer hover:border-blue-500/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">{w.name}</CardTitle>
                        <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </CardHeader>
                      <CardContent>
                        {w.description && (
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{w.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-gray-800">
                            {w.exerciseCount || 0} exercises
                          </Badge>
                          {w.scheduledDay && (
                            <Badge
                              variant="blue"
                              className="bg-blue-900/30 text-blue-400 capitalize"
                            >
                              {w.scheduledDay}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            <WorkoutProgress
              onViewHistory={() => setActiveTab("history")}
              onViewSession={setSelectedSessionId}
            />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            <WorkoutHistoryWithFilter onViewSession={setSelectedSessionId} />
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <ExerciseLibrary />
        </TabsContent>
      </Tabs>

      <Modal
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="New Workout Plan"
      >
        <form onSubmit={handleCreateWorkout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <Input
              value={newWorkoutName}
              onChange={(e) => setNewWorkoutName(e.target.value)}
              placeholder="e.g. Upper Body Power"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Description (optional)
            </label>
            <Input
              value={newWorkoutDesc}
              onChange={(e) => setNewWorkoutDesc(e.target.value)}
              placeholder="Brief description of the workout"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
