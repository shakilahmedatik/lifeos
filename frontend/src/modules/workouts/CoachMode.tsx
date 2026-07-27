import { useCallback, useEffect, useState } from "react";

import type { WorkoutWithExercises } from "@lifeos/contracts";
import { playNotificationSound } from "../notifications/sound-player.js";
import { addExerciseLog, completeSession, startSession } from "./api.js";
import { useWorkoutTimerSSE } from "./useWorkoutTimerSSE.js";
import { useExercises } from "./useWorkouts.js";

interface CoachModeProps {
  workout: WorkoutWithExercises;
  onComplete: () => void;
  onExit: () => void;
}

interface TimerState {
  isRunning: boolean;
  isResting: boolean;
  seconds: number;
  targetSeconds: number;
}

export function CoachMode({ workout, onComplete, onExit }: CoachModeProps) {
  const { exercises } = useExercises();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isResting: false,
    seconds: 0,
    targetSeconds: 0,
  });
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const exercise = exercises.find((e) => e.id === currentExercise?.exerciseId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  const handleStart = async () => {
    const session = await startSession(workout.id);
    setSessionId(session.id);
    setStartTime(new Date());
    setIsStarted(true);
    if (currentExercise) {
      startTimer(currentExercise.restSeconds, false);
    }
  };

  const handleCompleteSet = async () => {
    if (!sessionId || !currentExercise) return;

    await addExerciseLog(sessionId, {
      exerciseId: currentExercise.exerciseId,
      setNumber: currentSet,
      actualReps: currentExercise.reps,
      actualWeight: currentExercise.weight,
    });

    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      startTimer(currentExercise.restSeconds, true);
    } else {
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        const nextExercise = workout.exercises[currentExerciseIndex + 1];
        startTimer(nextExercise.restSeconds, false);
      } else {
        handleCompleteWorkout();
      }
    }
  };

  const handleCompleteWorkout = async () => {
    if (!sessionId || !startTime) return;

    const durationSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    await completeSession(sessionId, durationSeconds);
    playNotificationSound("workout_complete");
    onComplete();
  };

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

  if (!isStarted) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">{workout.name}</h2>
        <p className="text-gray-600 mb-4">{workout.description}</p>
        <p className="mb-4">
          {workout.exercises.length} exercises •{" "}
          {workout.exercises.reduce((acc, we) => acc + we.sets, 0)} total sets
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleStart}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Workout
          </button>
          <button
            type="button"
            onClick={onExit}
            className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  if (!currentExercise || !exercise) {
    return <div className="p-4">No exercises configured</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{workout.name}</h2>
        <button type="button" onClick={onExit} className="text-gray-500 hover:text-gray-700">
          Exit
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
          </span>
          <span className="text-sm text-gray-600">
            Set {currentSet} of {currentExercise.sets}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
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

      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold mb-2">{exercise.name}</h3>
        <p className="text-gray-600 mb-4">{exercise.muscleGroup}</p>
        {exercise.videoUrl && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            Watch Video Reference
          </a>
        )}
      </div>

      <div className="text-center mb-6">
        <p className="text-lg mb-2">
          {currentExercise.reps} reps
          {currentExercise.weight && ` @ ${currentExercise.weight} kg`}
        </p>
        <p className="text-sm text-gray-600">{currentExercise.restSeconds}s rest between sets</p>
      </div>

      {timer.isRunning && (
        <div className="text-center mb-6">
          <p
            className={`text-6xl font-mono ${timer.isResting ? "text-yellow-500" : "text-green-500"}`}
          >
            {formatTime(timer.seconds)}
          </p>
          <p className="text-sm text-gray-600">{timer.isResting ? "Rest Period" : "Set Time"}</p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        {!timer.isRunning && (
          <button
            type="button"
            onClick={handleCompleteSet}
            className="px-8 py-4 bg-green-500 text-white text-lg rounded hover:bg-green-600"
          >
            Complete Set
          </button>
        )}
        {timer.isRunning && (
          <button
            type="button"
            onClick={() => setTimer((prev) => ({ ...prev, isRunning: false }))}
            className="px-8 py-4 bg-yellow-500 text-white text-lg rounded hover:bg-yellow-600"
          >
            Pause
          </button>
        )}
      </div>
    </div>
  );
}
