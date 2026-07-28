import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { Input } from "../../components/ui/Input.js";
import { api, fetchWithAuth } from "../../lib/api.js";
import { playNotificationSound } from "../notifications/sound-player.js";
import { addExerciseLog, cancelSession, completeSession, startSession } from "./api.js";
import { CoachStartModal } from "./components/CoachStartModal.js";
import { RestTimerDisplay } from "./components/RestTimerDisplay.js";
import { VideoPlayer } from "./components/VideoPlayer.js";
import { useExercises, useWorkout } from "./useWorkouts.js";
import { useWorkoutTimerSSE } from "./useWorkoutTimerSSE.js";

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
        fetchWithAuth(`/api/workouts/sessions/${sessionId}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(console.error);
        if (taskId) {
          fetchWithAuth(`/api/tasks/${taskId}/status`, {
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
    isFinishedRef.current = true;
    if (!sessionId || !startTime) return;

    const durationSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    await completeSession(sessionId, durationSeconds);
    if (taskId) {
      await api.updateTaskStatus(taskId, "done").catch(console.error);
    }
    playNotificationSound("workout_complete");
    onComplete();
  }, [sessionId, startTime, taskId, onComplete]);

  const handleCompleteSet = useCallback(async () => {
    if (!sessionId || !currentExercise || !workout) return;

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
        handleCompleteWorkout();
      }
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

  useWorkoutTimerSSE({
    onAlert: (alert) => {
      if (alert.sessionId === sessionId) {
        if (alert.type === "set_complete") {
          playNotificationSound("workout_set");
        } else if (alert.type === "rest_complete") {
          playNotificationSound("workout_rest");
        } else if (alert.type === "workout_complete") {
          playNotificationSound("workout_complete");
        }
      }
    },
    autoPlaySound: false,
  });

  if (loading) return <div className="p-4 text-gray-400">Loading workout...</div>;
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
    return <div className="p-4 text-gray-400">No exercises configured</div>;
  }

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800 pb-4">
        <CardTitle className="text-xl">{workout.name}</CardTitle>
        <Button onClick={handleExitClick} variant="secondary" size="sm">
          Exit
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Column: Controls & Timer */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-800">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-400">
                  Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  Set {currentSet} of {currentExercise.sets}
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                <div
                  className="bg-linear-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((currentExerciseIndex * currentExercise.sets + currentSet) /
                        workout.exercises.reduce((acc, we) => acc + we.sets, 0)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-4xl font-bold mb-3 text-gray-100">{exercise.name}</h3>
              <p className="text-lg font-medium text-gray-400 mb-4 tracking-wider uppercase">
                {exercise.muscleGroup}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Reps (Actual)</label>
                <Input
                  type="number"
                  min="1"
                  value={actualReps}
                  onChange={(e) => setActualReps(Number(e.target.value))}
                  className="bg-gray-800/50 text-gray-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Weight (Actual)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(Number(e.target.value))}
                  className="bg-gray-800/50 text-gray-300"
                />
              </div>
            </div>

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

          {/* Right Column: Video Player */}
          <div className="p-6 bg-gray-900/30 flex flex-col items-center justify-center">
            <h4 className="text-gray-400 font-medium mb-4 w-full text-left uppercase tracking-wider text-sm">
              Reference Video
            </h4>
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
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-y-auto w-screen h-screen">
      <div className="w-full min-h-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col justify-center">
        <CoachModeInner {...props} />
      </div>
    </div>,
    document.body,
  );
}
