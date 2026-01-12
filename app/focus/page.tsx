"use client";

import { useEffect, useMemo, useState } from "react";
import TimerCircle from "@/components/TimerCircle";
import SubjectRow from "@/components/SubjectRow";
import AddSubjectButton from "@/components/AddSubjectButton";

import { fetchTodaySessions, insertSession } from "@/lib/db/sessions";
import { insertSubject } from "@/lib/db/subjects";
import { deleteSubjectById } from "@/lib/db/subjects";
import { fetchSubjectsFromDB } from "@/lib/db/subjects";
import { updateSubjectInDB } from "@/lib/db/subjects";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setElapsed,
  startFocus,
  stopFocus,
  tick,
  endSegment,
  setAccumulated,
  setLastSubject,
} from "@/store/slices/focusSlice";
import { setSubjects, selectSubject } from "@/store/slices/subjectsSlice";

import { Session, SessionInsert, Subject } from "@/lib/types";
import { load, save } from "@/lib/storage";
import SubjectDialog from "@/components/SubjectDialog";
import { getSupabaseClient } from "@/lib/supabase";
const supabase = getSupabaseClient();

import { formatHoursMinutes } from "@/lib/time";
import {
  fetchActiveSession,
  fetchAndDeleteActiveSession,
  getLocalUserId,
  startActiveSession,
} from "@/lib/db/activeSession";

const SUBJECTS_KEY = "subjects";
const ACTIVE_SESSION_KEY = "activeSession";

export default function FocusPage() {
  const dispatch = useAppDispatch();

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const focus = useAppSelector((s) => s.focus);
  const subjects = useAppSelector((s) => s.subjects.list);
  const activeSubjectId = useAppSelector((s) => s.subjects.selectedSubjectId);
  const [timeView, setTimeView] = useState<"today" | "week">("today");
  const [stopping, setStopping] = useState(false);
  const displaySeconds = focus.accumulatedSeconds + focus.elapsedSeconds;
  const FOCUS_DRAFT_KEY = "focus_draft";
  const isRunning = focus.status === "running";
  const isPaused =
    focus.status === "idle" &&
    focus.accumulatedSeconds > 0 &&
    !!focus.lastSubjectId;

  /* ---------------- INIT ---------------- */

  //> Load active session
  // useEffect(() => {
  //   const storedSession = load<any | null>(ACTIVE_SESSION_KEY, null);

  //   if (storedSession) {
  //     const elapsedSinceStart = Math.floor(
  //       (Date.now() - new Date(storedSession.startTime).getTime()) / 1000
  //     );

  //     dispatch(startFocus(storedSession));
  //     dispatch(setElapsed(elapsedSinceStart));
  //   }
  // }, [dispatch]);
  useEffect(() => {
    async function restoreSession() {
      // 1️⃣ Fetch active session from DB
      const dbSession = await fetchActiveSession(getLocalUserId());

      if (dbSession) {
        const elapsed = Math.floor(
          (Date.now() - new Date(dbSession.start_time).getTime()) / 1000
        );

        const session = {
          sessionId: dbSession.id,
          subjectId: dbSession.subject_id,
          startTime: dbSession.start_time,
        };

        save(ACTIVE_SESSION_KEY, session);
        dispatch(startFocus(session));
        dispatch(setElapsed(elapsed));
        return;
      }

      // 2️⃣ Fallback: localStorage only if DB empty
      const stored = load<any | null>(ACTIVE_SESSION_KEY, null);
      if (stored) {
        const elapsed = Math.floor(
          (Date.now() - new Date(stored.startTime).getTime()) / 1000
        );
        dispatch(startFocus(stored));
        dispatch(setElapsed(elapsed));
      }
    }

    restoreSession();
  }, [dispatch]);

  useEffect(() => {
    async function restoreFocusState() {
      // 1️⃣ Restore active DB session (highest priority)
      const dbSession = await fetchActiveSession(getLocalUserId());

      if (dbSession) {
        const elapsed = Math.floor(
          (Date.now() - new Date(dbSession.start_time).getTime()) / 1000
        );

        const session = {
          sessionId: dbSession.id,
          subjectId: dbSession.subject_id,
          startTime: dbSession.start_time,
        };

        save(ACTIVE_SESSION_KEY, session);
        dispatch(startFocus(session));
        dispatch(setElapsed(elapsed));
        return;
      }

      // 2️⃣ Restore paused draft (THIS FIXES YOUR BUG)
      const draft = load<any | null>(FOCUS_DRAFT_KEY, null);
      if (draft) {
        dispatch(setAccumulated(draft.accumulatedSeconds));
        dispatch(setLastSubject(draft.lastSubjectId));
      }
    }

    restoreFocusState();
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const dbSession = await fetchActiveSession(getLocalUserId());

      // Case 1: DB says RUNNING, UI is idle → RESUME
      if (dbSession && focus.status === "idle") {
        const elapsed = Math.floor(
          (Date.now() - new Date(dbSession.start_time).getTime()) / 1000
        );

        const session = {
          sessionId: dbSession.id,
          subjectId: dbSession.subject_id,
          startTime: dbSession.start_time,
        };

        save(ACTIVE_SESSION_KEY, session);
        dispatch(startFocus(session));
        dispatch(setElapsed(elapsed));
        return;
      }

      // Case 2: DB says STOPPED, UI is running → PAUSE
      if (!dbSession && focus.status === "running") {
        dispatch(endSegment());
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, [focus.status, dispatch]);

  //> Load subjects
  useEffect(() => {
    async function syncFromDB() {
      try {
        const dbSubjects = await fetchSubjectsFromDB();

        // 1. Update Redux
        dispatch(setSubjects(dbSubjects));

        // 2. Update localStorage cache
        save(SUBJECTS_KEY, dbSubjects);
      } catch {
        console.error("Failed to sync subjects from DB");
        // DB offline / error → silently fall back to cache
      }
    }

    syncFromDB();
  }, [dispatch]);

  //> Load today's sessions
  useEffect(() => {
    async function loadToday() {
      try {
        const sessions = await fetchTodaySessions();
        setTodaySessions(sessions);
      } catch {}
    }

    loadToday();
  }, []);

  //> Load all sessions of last 30 days
  useEffect(() => {
    async function loadSessions() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const from = new Date();
        from.setDate(from.getDate() - 30); // last 30 days

        const { data, error } = await supabase
          .from("sessions")
          .select("*")
          .gte("start_time", from.toISOString());

        if (error) throw error;

        setSessions(data ?? []);
      } catch (e) {
        console.error(e);
      }
    }

    loadSessions();
  }, []);
  /* ---------------- TIMER (THIS IS THE FIX) ---------------- */

  useEffect(() => {
    if (focus.status !== "running") return;

    const interval = setInterval(() => {
      dispatch(tick());
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, focus.status]);

  /* ---------------- START / STOP ---------------- */

  // async function handleStartStop() {
  //   if (focus.status === "running" && focus.activeSession) {
  //     const now = new Date().toISOString();

  //     const dbSession = {
  //       user_id: "local-user", // until auth
  //       subject_id: focus.activeSession.subjectId,
  //       start_time: focus.activeSession.startTime,
  //       end_time: now,
  //       description: null,
  //       is_interrupted: focus.isInterrupted,
  //       created_at: now,
  //     };

  //     try {
  //       await supabase.from("sessions").insert(dbSession);
  //     } catch {
  //       // optional: retry / queue offline later
  //     }

  //     localStorage.removeItem("activeSession");
  //     dispatch(stopFocus());
  //     return;
  //   }

  //   if (!activeSubjectId) return;

  //   const session = {
  //     sessionId: crypto.randomUUID(),
  //     subjectId: activeSubjectId,
  //     startTime: new Date().toISOString(),
  //   };

  //   save("activeSession", session);
  //   dispatch(startFocus(session));
  // }

  /*----------------- Add Pause / Resume / Stop controls */
  // function handlePauseResume() {
  //   if (focus.status === "running") {
  //     dispatch({ type: "focus/pause" }); // see note below
  //   } else if (focus.status === "paused") {
  //     dispatch({ type: "focus/resume" });
  //   }
  // }
  // async function handlePause() {
  //   // Pause = end current segment
  //   dispatch({ type: "focus/pause" }); // see note below
  //   await handleStop(); // reuse stop logic
  // }

  // async function handleResume() {
  //   if (!focus.lastSubjectId) return;
  //   dispatch({ type: "focus/resume" });
  //   await handleSubjectClick(focus.lastSubjectId);
  // }

  // function computeElapsed(events: FocusEvent[]) {
  // let elapsed = 0;
  // let lastStart: Date | null = null;

  // for (const e of events) {
  //   if (e.type === "start" || e.type === "resume") {
  //     lastStart = new Date(e.created_at);
  //   }

  //   if ((e.type === "pause" || e.type === "stop") && lastStart) {
  //     elapsed +=
  //       new Date(e.created_at).getTime() - lastStart.getTime();
  //     lastStart = null;
  //   }
  // }

  // if currently running
  //   if (lastStart) {
  //     elapsed += Date.now() - lastStart.getTime();
  //   }

  //   return Math.floor(elapsed / 1000);
  // }

  async function handlePause() {
    const active = focus.activeSession;
    if (!active) return;

    const now = new Date().toISOString();

    try {
      await fetchAndDeleteActiveSession(getLocalUserId());

      const payload: SessionInsert = {
        user_id: null,
        subject_id: active.subjectId,
        start_time: active.startTime,
        end_time: now,
        description: null,
        is_interrupted: false,
        created_at: now,
      };

      const inserted = await insertSession(payload);
      setTodaySessions((prev) => [...prev, inserted]);

      // 🔥 Redux: move elapsed → accumulated
      dispatch(endSegment());

      // 🔥 NEW: persist UI continuity
      save(FOCUS_DRAFT_KEY, {
        accumulatedSeconds: focus.accumulatedSeconds + focus.elapsedSeconds,
        lastSubjectId: active.subjectId,
      });

      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (err) {
      console.error("Pause failed", err);
    }
  }

  async function handleResume() {
    const subjectId = focus.lastSubjectId;
    if (!subjectId) return;

    try {
      // 1️⃣ Start new DB active session
      const dbSession = await startActiveSession(getLocalUserId(), subjectId);

      if (!dbSession) return;

      const session = {
        sessionId: dbSession.id,
        subjectId: dbSession.subject_id,
        startTime: dbSession.start_time,
      };

      // 2️⃣ Mirror to localStorage
      save(ACTIVE_SESSION_KEY, session);

      // 3️⃣ Redux: start new segment (DO NOT reset accumulatedSeconds)
      dispatch(startFocus(session));
    } catch (err) {
      console.error("Resume failed", err);
    }
  }

  /*----------------- Stop Timer --------------------*/
  // async function handleStop() {
  //   const active = focus.activeSession;
  //   if (!active) return;

  //   const now = new Date().toISOString();

  //   const insertPayload: SessionInsert = {
  //     user_id: null,
  //     subject_id: active.subjectId,
  //     start_time: active.startTime,
  //     end_time: now,
  //     description: null,
  //     is_interrupted: focus.isInterrupted,
  //     created_at: now,
  //   };

  //   let insertedSession: Session;

  //   try {
  //     insertedSession = await insertSession(insertPayload);
  //   } catch (err) {
  //     console.error("Session insert failed", err);
  //     return;
  //   }

  //   // ✅ Now TypeScript is happy (has id)
  //   setTodaySessions((prev) => [...prev, insertedSession]);

  //   localStorage.removeItem(ACTIVE_SESSION_KEY);
  //   dispatch(stopFocus());
  // }

  // async function handleStop() {
  //   const active = focus.activeSession;
  //   if (!active) return;

  //   const now = new Date().toISOString();

  //   try {
  //     // 1️⃣ End active session (fetch + delete)
  //     await fetchAndDeleteActiveSession(getLocalUserId());

  //     // 2️⃣ Insert completed session
  //     const insertPayload: SessionInsert = {
  //       user_id: null, // until auth
  //       subject_id: active.subjectId,
  //       start_time: active.startTime,
  //       end_time: now,
  //       description: null,
  //       // is_interrupted: focus.isInterrupted,
  //       created_at: now,
  //     };

  //     const insertedSession = await insertSession(insertPayload);

  //     setTodaySessions((prev) => [...prev, insertedSession]);

  //     // 3️⃣ Cleanup UI state
  //     localStorage.removeItem(ACTIVE_SESSION_KEY);
  //     dispatch(stopFocus());
  //   } catch (err) {
  //     console.error("Stop failed", err);
  //   }
  // }
  async function handleStop() {
    const active = focus.activeSession;
    if (!active) return;

    const now = new Date().toISOString();

    try {
      // 1️⃣ End active DB session (authoritative)
      await fetchAndDeleteActiveSession(getLocalUserId());

      // 2️⃣ Insert completed session (segment)
      const insertPayload: SessionInsert = {
        user_id: null, // until auth
        subject_id: active.subjectId,
        start_time: active.startTime,
        end_time: now,
        description: null,
        is_interrupted: false, // stop = intentional end
        created_at: now,
      };

      const insertedSession = await insertSession(insertPayload);

      // 3️⃣ Update in-memory analytics
      setTodaySessions((prev) => [...prev, insertedSession]);

      // 4️⃣ Cleanup local cache
      localStorage.removeItem(ACTIVE_SESSION_KEY);

      // 5️⃣ Redux: HARD reset (differs from pause)
      dispatch(stopFocus());
    } catch (err) {
      console.error("Stop failed", err);
    }
  }

  /* ---------------- DELETE SUBJECT ---------------- */
  async function handleDeleteSubject(subjectId: string) {
    // 1️⃣ DB delete first (source of truth)
    try {
      await deleteSubjectById(subjectId);
    } catch {
      return; // fail silently for now
    }

    // 2️⃣ Remove from local state
    const updated = subjects.filter((s) => s.id !== subjectId);

    // 3️⃣ Update localStorage
    save(SUBJECTS_KEY, updated);

    // 4️⃣ Update Redux
    dispatch(setSubjects(updated));

    // 5️⃣ If deleted subject was selected, clear selection
    if (activeSubjectId === subjectId) {
      dispatch(selectSubject(null));
    }
  }

  /*  --------------- Handle subject submit ----------------*/
  function openAddSubject() {
    setEditingSubject(null);
    setSubjectDialogOpen(true);
  }

  function openEditSubject(subject: Subject) {
    setEditingSubject(subject);
    setSubjectDialogOpen(true);
  }
  async function handleSubjectSubmit({
    name,
    color,
  }: {
    name: string;
    color: string;
  }) {
    const now = new Date().toISOString();

    // ✏️ EDIT
    if (editingSubject) {
      try {
        await updateSubjectInDB(editingSubject.id, {
          name,
          color,
        });
      } catch {
        return;
      }

      const updated = subjects.map((s) =>
        s.id === editingSubject.id ? { ...s, name, color } : s
      );

      dispatch(setSubjects(updated));
      save(SUBJECTS_KEY, updated);
      return;
    }

    // ➕ ADD
    const subject: Subject = {
      id: crypto.randomUUID(),
      user_id: "local-user",
      name,
      image: null,
      color,
      created_at: now,
    };

    try {
      await insertSubject(subject);
    } catch {
      return;
    }

    const updated = [...subjects, subject];
    dispatch(setSubjects(updated));
    save(SUBJECTS_KEY, updated);
  }

  /* ---------------- HANDLE SUBJECT CLICK ---------------- */
  // > Clicking a subject starts a new session
  // function handleSubjectClick(subjectId: string) {
  //   // If already running or paused, ignore for now
  //   if (focus.status !== "idle") return;

  //   dispatch(selectSubject(subjectId));

  //   const session = {
  //     sessionId: crypto.randomUUID(),
  //     subjectId,
  //     startTime: new Date().toISOString(),
  //   };

  //   save("activeSession", session);
  //   dispatch(startFocus(session));
  // }
  async function handleSubjectClick(subjectId: string) {
    if (focus.status !== "idle") return;

    try {
      const dbSession = await startActiveSession(getLocalUserId(), subjectId);

      if (!dbSession) return;

      const session = {
        sessionId: dbSession.id,
        subjectId: dbSession.subject_id,
        startTime: dbSession.start_time,
      };

      save(ACTIVE_SESSION_KEY, session);
      dispatch(selectSubject(subjectId));
      dispatch(startFocus(session));
      dispatch(setElapsed(0));
    } catch (err) {
      console.error("Failed to start session", err);
    }
  }

  /**************** Compute subject-wise minutes ************** */
  function getSecondsForSubject(subjectId: string) {
    const now = new Date();
    let from: Date;

    if (timeView === "today") {
      from = new Date();
      from.setHours(0, 0, 0, 0);
    } else {
      from = new Date();
      from.setDate(from.getDate() - from.getDay()); // start of week
      from.setHours(0, 0, 0, 0);
    }

    let seconds = 0;

    for (const s of todaySessions) {
      if (s.subject_id !== subjectId) continue;

      const start = new Date(s.start_time);
      if (start < from) continue;

      const end = s.end_time ? new Date(s.end_time) : new Date();

      seconds += Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    if (
      focus.activeSession &&
      focus.activeSession.subjectId === subjectId &&
      focus.status === "running"
    ) {
      seconds += focus.elapsedSeconds;
    }

    return seconds;
  }

  function getTotalSecondsForView() {
    let from: Date;

    if (timeView === "today") {
      from = new Date();
      from.setHours(0, 0, 0, 0);
    } else {
      from = new Date();
      from.setDate(from.getDate() - from.getDay()); // start of week
      from.setHours(0, 0, 0, 0);
    }

    let seconds = 0;

    // DB sessions (correct dataset now)
    for (const s of sessions) {
      const start = new Date(s.start_time);
      if (start < from) continue;

      const end = s.end_time ? new Date(s.end_time) : new Date();
      seconds += Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    // Live session
    if (focus.activeSession && focus.status === "running") {
      const start = new Date(focus.activeSession.startTime);
      if (start >= from) {
        seconds += focus.elapsedSeconds;
      }
    }

    return seconds;
  }

  // const totalSecondsForView = getTotalSecondsForView();
  const totalSecondsForView = useMemo(
    () => getTotalSecondsForView(),
    [sessions, focus.elapsedSeconds, focus.status, timeView]
  );
  const totalLabel = formatHoursMinutes(totalSecondsForView);

  /**************** Build heatmap ************** */
  function buildHeatmapData(sessions: Session[]) {
    const map: Record<string, number> = {};

    for (const s of sessions) {
      const day = s.start_time.slice(0, 10); // YYYY-MM-DD
      const start = new Date(s.start_time);
      const end = s.end_time ? new Date(s.end_time) : new Date();

      const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
      map[day] = (map[day] || 0) + seconds;
    }

    return map;
  }

  /* ---------------- UI ---------------- */
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#1a1f35] to-[#0f1419] text-white flex flex-col md:flex-row gap-8 lg:gap-16 pt-12 md:pt-20 px-4 md:px-8 lg:px-12">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* TIMER */}
      <div className="flex flex-col items-center relative z-10 mx-auto md:mx-0">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl hover:bg-white/[0.07] transition-all duration-500">
          <TimerCircle elapsed={displaySeconds} />
        </div>
        {isRunning && (
          <div className="mt-8 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handlePause}
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/20 font-medium"
            >
              ⏸ Pause
            </button>

            <button
              onClick={handleStop}
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-sm border border-red-400/20 hover:border-red-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 font-medium"
            >
              ⏹ Stop
            </button>
          </div>
        )}

        {!isRunning && isPaused && (
          <div className="mt-8 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleResume}
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 backdrop-blur-sm border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 font-medium"
            >
              ▶ Resume
            </button>

            <button
              onClick={handleStop}
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-sm border border-red-400/20 hover:border-red-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 font-medium"
            >
              ⏹ Stop
            </button>
          </div>
        )}

        {/* {focus.status !== "idle" && (
          <div className="mt-8 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handlePauseResume}
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-slate-700/80 to-slate-600/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/20 font-medium"
            >
              <span className="flex items-center gap-2">
                {focus.status === "running" ? "⏸ Pause" : "▶ Resume"}
              </span>
            </button>
            <button
              onClick={handleStop}
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-sm border border-red-400/20 hover:border-red-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 font-medium"
            >
              <span className="flex items-center gap-2">⏹ Stop</span>
            </button>
          </div>
        )} */}
      </div>

      {/* SUBJECT LIST */}
      <div className="w-full max-w-md md:max-w-lg relative z-10 mx-auto md:mx-0 pb-8">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Subjects
            </h3>
            <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-slate-300">
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
            </div>
          </div>
          {/* 
          <div className="flex gap-2 mb-3">
            {(["today", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTimeView(v)}
                className={`px-3 py-1 rounded-md text-sm
        ${
          timeView === v
            ? "bg-indigo-600 text-white"
            : "bg-[#0F1424] text-slate-400"
        }`}
              >
                {v === "today" ? "Today" : "This Week"}
              </button>
            ))}
          </div> */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {(["today", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTimeView(v)}
                  className={`px-3 py-1 rounded-md text-sm
          ${
            timeView === v
              ? "bg-indigo-600 text-white"
              : "bg-[#0F1424] text-slate-400"
          }`}
                >
                  {v === "today" ? "Today" : "This Week"}
                </button>
              ))}
            </div>

            {/* ✅ TOTAL TIME DISPLAY */}
            <div className="text-sm font-medium text-slate-300">
              {totalLabel}
            </div>
          </div>

          <div className="space-y-3">
            {subjects.map((s) => {
              const seconds = getSecondsForSubject(s.id);
              return (
                <SubjectRow
                  key={s.id}
                  subject={s}
                  active={s.id === activeSubjectId}
                  totalMinutes={Math.floor(seconds / 60)}
                  onSelect={() => handleSubjectClick(s.id)}
                  onEdit={openEditSubject}
                  onDelete={(subject) => handleDeleteSubject(subject.id)}
                />
              );
            })}
          </div>
          <div className="mt-6">
            <AddSubjectButton onAdd={openAddSubject} />
          </div>
        </div>
      </div>

      <SubjectDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        subject={editingSubject ?? undefined}
        onSubmit={handleSubjectSubmit}
      />
    </main>
  );
}
