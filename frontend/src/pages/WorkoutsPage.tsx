import { type SubmitEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { ChevronRightIcon, DumbbellIcon, PlusIcon } from "../components/ui/icons.js";
import Modal from "../components/ui/Modal.js";
import { CoachMode } from "../modules/workouts/CoachMode.js";
import { ExerciseLibrary } from "../modules/workouts/ExerciseLibrary.js";
import { useWorkouts } from "../modules/workouts/useWorkouts.js";
import { WorkoutDetail } from "../modules/workouts/WorkoutDetail.js";
import { WorkoutHistoryWithFilter } from "../modules/workouts/WorkoutHistoryWithFilter.js";
import { WorkoutProgress } from "../modules/workouts/WorkoutProgress.js";
import { WorkoutSessionDetail } from "../modules/workouts/WorkoutSessionDetail.js";

type Tab = "plans" | "history" | "exercises";

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("plans");
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Workouts</h1>
          <p className="text-sm text-gray-500 mt-1">Track your training</p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-700/50 pb-px">
        {(["plans", "history", "exercises"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "plans" && (
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
            <Card className="text-center py-12 border-dashed border-gray-700/50">
              <CardContent>
                <DumbbellIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No workout plans yet.</p>
                <Button onClick={() => setIsNewModalOpen(true)} variant="primary">
                  Create your first workout
                </Button>
              </CardContent>
            </Card>
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
                          <Badge variant="blue" className="bg-blue-900/30 text-blue-400 capitalize">
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
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <WorkoutProgress />
          <WorkoutHistoryWithFilter onViewSession={setSelectedSessionId} />
        </div>
      )}

      {activeTab === "exercises" && <ExerciseLibrary />}

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
