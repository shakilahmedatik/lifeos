import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { Input } from "../../components/ui/Input.js";
import { api, request } from "../../lib/api.js";
import { playNotificationSound } from "../notifications/sound-player.js";
import { addExerciseLog, cancelSession, completeSession, startSession } from "./api.js";
import { CoachStartModal } from "./components/CoachStartModal.js";
import { RestTimerDisplay } from "./components/RestTimerDisplay.js";
import { VideoPlayer } from "./components/VideoPlayer.js";
import { useExercises, useWorkout } from "./useWorkouts.js";

interface CoachModeProps {
  workoutId: string;
  taskId?: string;
  onComplete: () => void;
  onExit: () => void;
}

interface TimerState {
  isRunning: boolean;
  isResting: boolean;
  seconds: number;
  targetSeconds: number;
}

function CoachModeInner({ workoutId, taskId, onComplete, onExit }: CoachModeProps) {
  const { workout, loading, error } = useWorkout(workoutId);
  const { exercises } = useExercises();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);

  // User overrides
  const [actualReps, setActualReps] = useState<number>(0);
  const [actualWeight, setActualWeight] = useState<number>(0);

  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isResting: false,
    seconds: 0,
    targetSeconds: 0,
  });
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && !isFinishedRef.current) {
        request(`/api/workouts/sessions/${sessionId}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(console.error);
        if (taskId) {
          request(`/api/routine/tasks/${taskId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: "planned" }),
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch(console.error);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (sessionId && !isFinishedRef.current) {
        cancelSession(sessionId).catch(console.error);
        if (taskId) {
          api.updateTaskStatus(taskId, "planned").catch(console.error);
        }
      }
    };
  }, [sessionId, taskId]);

  const currentExercise = workout?.exercises?.[currentExerciseIndex];
  const exercise = exercises.find((e) => e.id === currentExercise?.exerciseId);

  // Init override values when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setActualReps(currentExercise.repsArray?.[currentSet - 1] ?? currentExercise.reps);
      const weightForSet = currentExercise.weights?.[currentSet - 1];
      setActualWeight(weightForSet !== undefined ? weightForSet : currentExercise.weight || 0);
    }
  }, [currentExercise, currentSet]);

  const startTimer = useCallback((duration: number, isRest: boolean) => {
    setTimer({
      isRunning: true,
      isResting: isRest,
      seconds: duration,
      targetSeconds: duration,
    });
  }, []);

  useEffect(() => {
    if (!timer.isRunning) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev.seconds <= 1) {
          clearInterval(interval);
          return { ...prev, isRunning: false, seconds: 0 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning]);

  useEffect(() => {
    if (timer.seconds === 0 && !timer.isRunning && timer.targetSeconds > 0) {
      if (!timer.isResting) {
        handleCompleteSetRef.current?.();
      } else if (currentExercise) {
        startTimer(
          (currentExercise.repsArray?.[currentSet - 1] || currentExercise.reps) * 4,
          false,
        );
      }
    }
  }, [
    timer.seconds,
    timer.isRunning,
    timer.targetSeconds,
    timer.isResting,
    currentExercise,
    currentSet,
    startTimer,
  ]);

  const handleExitConfirmed = async () => {
    isFinishedRef.current = true;
    if (sessionId) {
      await cancelSession(sessionId);
    }
    if (taskId) {
      await api.updateTaskStatus(taskId, "planned").catch(console.error);
    }
    onExit();
  };

  const handleExitClick = () => {
    if (isStarted) {
      setIsExitConfirmOpen(true);
    } else {
      onExit();
    }
  };

  const handleStartWorkout = async () => {
    try {
      if (!workout) return;
      const session = await startSession(workout.id);
      setSessionId(session.id);
      setIsStarted(true);
      setStartTime(new Date());
      if (workout.exercises.length > 0) {
        const firstExercise = workout.exercises[0];
        startTimer(firstExercise.restSeconds || 60, true);
      }
      if (taskId) {
        await api.updateTaskStatus(taskId, "in_progress").catch(console.error);
      }
    } catch (err) {
      console.error("Failed to start session", err);
    }
  };

  const handleCompleteWorkout = useCallback(async () => {
    if (!sessionId || !startTime) return;

    try {
      const durationSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      await completeSession(sessionId, durationSeconds);
      isFinishedRef.current = true;
      if (taskId) {
        await api.updateTaskStatus(taskId, "done").catch(console.error);
      }
      playNotificationSound("workout_complete");
      onComplete();
    } catch (err) {
      console.error("Failed to complete session", err);
    }
  }, [sessionId, startTime, taskId, onComplete]);

  const [, setIsSubmittingSet] = useState(false);
  const isSubmittingSetRef = useRef(false);

  const handleCompleteSet = useCallback(async () => {
    if (isSubmittingSetRef.current || !sessionId || !currentExercise || !workout) return;

    isSubmittingSetRef.current = true;
    setIsSubmittingSet(true);
    try {
      await addExerciseLog(sessionId, {
        exerciseId: currentExercise.exerciseId,
        setNumber: currentSet,
        actualReps: actualReps,
        actualWeight: actualWeight,
      });

      if (currentSet < currentExercise.sets) {
        setCurrentSet(currentSet + 1);
        startTimer(currentExercise.restSeconds || 60, true);
      } else {
        if (currentExerciseIndex < workout.exercises.length - 1) {
          const nextExerciseIndex = currentExerciseIndex + 1;
          const nextExercise = workout.exercises[nextExerciseIndex];
          const restDuration = currentExercise.restSeconds || nextExercise?.restSeconds || 60;
          setCurrentExerciseIndex(nextExerciseIndex);
          setCurrentSet(1);
          startTimer(restDuration, true);
        } else {
          await handleCompleteWorkout();
        }
      }
    } catch (err) {
      console.error("Failed to complete set", err);
    } finally {
      isSubmittingSetRef.current = false;
      setIsSubmittingSet(false);
    }
  }, [
    sessionId,
    currentExercise,
    workout,
    currentSet,
    actualReps,
    actualWeight,
    currentExerciseIndex,
    startTimer,
    handleCompleteWorkout,
  ]);

  const handleSkipRest = useCallback(() => {
    if (!currentExercise) return;
    startTimer((currentExercise.repsArray?.[currentSet - 1] || currentExercise.reps) * 4, false);
  }, [currentExercise, currentSet, startTimer]);

  const handleAddRestTime = (additionalSeconds: number) => {
    setTimer((prev) => ({
      ...prev,
      seconds: prev.seconds + additionalSeconds,
      targetSeconds: prev.targetSeconds + additionalSeconds,
      isRunning: true,
    }));
  };

  const handleCompleteSetRef = useRef<() => void>(null);
  handleCompleteSetRef.current = handleCompleteSet;

  if (loading) return <div className="p-4 text-secondary">Loading workout...</div>;
  if (error || !workout)
    return <div className="p-4 text-red-400">Error: {error || "Workout not found"}</div>;

  if (!isStarted) {
    return (
      <CoachStartModal
        workout={workout}
        exercises={exercises}
        onStart={handleStartWorkout}
        onExit={handleExitClick}
      />
    );
  }

  if (!currentExercise || !exercise) {
    return <div className="p-4 text-secondary">No exercises configured</div>;
  }

  return (
    <Card className="animate-fade-in overflow-hidden h-full max-h-full flex flex-col shadow-2xl border-border/80 bg-surface-elevated/95">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-border py-2 px-3 sm:py-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <CardTitle className="text-base sm:text-lg md:text-xl truncate">{workout.name}</CardTitle>
          <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-surface border border-border text-secondary shrink-0">
            Ex {currentExerciseIndex + 1}/{workout.exercises.length} • Set {currentSet}/{currentExercise.sets}
          </span>
        </div>
        <Button onClick={handleExitClick} variant="secondary" size="sm" className="shrink-0 text-xs sm:text-sm">
          Exit
        </Button>
      </CardHeader>

      {/* Progress Bar */}
      <div className="w-full bg-card-hover h-1 overflow-hidden shrink-0">
        <div
          className="bg-linear-to-r from-blue-500 to-emerald-500 h-1 transition-all duration-500"
          style={{
            width: `${
              ((currentExerciseIndex * currentExercise.sets + currentSet) /
                workout.exercises.reduce((acc, we) => acc + we.sets, 0)) *
              100
            }%`,
          }}
        />
      </div>

      {/* Main Content Area */}
      <CardContent className="p-2 sm:p-4 md:p-6 flex-1 min-h-0 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Left Column on Desktop / Bottom on Mobile: Exercise details + Inputs + Timer */}
        <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 flex flex-col justify-between min-h-0 flex-1 gap-2 sm:gap-4">
          
          {/* Compact Exercise Name & Inputs Bar */}
          <div className="bg-surface p-2.5 sm:p-4 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-primary truncate">
                  {exercise.name}
                </h3>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  {exercise.muscleGroup}
                </span>
              </div>
            </div>

            {/* Reps and Weight inputs */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="flex-1 sm:w-24">
                <label className="block text-[10px] font-medium text-secondary mb-0.5">Reps</label>
                <Input
                  type="number"
                  min="1"
                  value={actualReps}
                  onChange={(e) => setActualReps(Number(e.target.value))}
                  className="bg-card text-primary h-8 sm:h-9 text-xs sm:text-sm py-1 px-2"
                />
              </div>
              <div className="flex-1 sm:w-28">
                <label className="block text-[10px] font-medium text-secondary mb-0.5">Weight (kg)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(Number(e.target.value))}
                  className="bg-card text-primary h-8 sm:h-9 text-xs sm:text-sm py-1 px-2"
                />
              </div>
            </div>
          </div>

          {/* Rest Timer Display */}
          <RestTimerDisplay
            timer={timer}
            currentSet={currentSet}
            totalSets={currentExercise.sets}
            actualReps={actualReps}
            actualWeight={actualWeight}
            onSkipRest={handleSkipRest}
            onAddRestTime={handleAddRestTime}
            onCompleteSet={handleCompleteSet}
            onToggleTimer={(isRunning) => setTimer((prev) => ({ ...prev, isRunning }))}
          />
        </div>

        {/* Right Column on Desktop / Top on Mobile: Video Player */}
        <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5 flex flex-col justify-center min-h-0 shrink-0 mb-2 lg:mb-0 lg:h-full">
          <div className="w-full h-36 sm:h-48 lg:h-full lg:max-h-[500px] flex items-center justify-center">
            <VideoPlayer url={exercise.videoUrl} isRunning={timer.isRunning} />
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={isExitConfirmOpen}
        title="End Session"
        message="Are you sure you want to end this session early? Your progress will not be saved."
        confirmLabel="End Session"
        onConfirm={handleExitConfirmed}
        onCancel={() => setIsExitConfirmOpen(false)}
        variant="danger"
      />
    </Card>
  );
}

export function CoachMode(props: CoachModeProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-surface flex flex-col h-dvh w-dvw overflow-hidden p-2 sm:p-4 md:p-6">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col min-h-0 overflow-hidden">
        <CoachModeInner {...props} />
      </div>
    </div>,
    document.body,
  );
}
