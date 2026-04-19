import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket, { voluntaryLeave, setVoluntaryLeave } from '../services/socket';
import useGameStore from '../store/gameStore';

/**
 * Central hook that wires all Socket.IO events to the Zustand store.
 * Mount once at App level. Handles:
 *  - Room lifecycle (join, leave, host transfer)
 *  - Game phases (countdown, battle, end)
 *  - Submissions / leaderboard
 *  - Typing indicators, commentary, power-ups
 */
export function useGame() {
  const navigate = useNavigate();
  const {
    setPlayer, setRoom, setPlayers, updateRoom, updatePlayerInRoom,
    setGamePhase, setProblem, setLeaderboard, setTimer, setStartTime,
    setFirstBlood, setWinner, setFinalLeaderboard,
    setSubmissionResult, setRunResult, setIsSubmitting, setIsRunning,
    setTypingPlayer, addCommentary, setPowerUpEffect, setFrozen,
    setAnonymousMode, setCountdownValue, player, room,
    setCode, language,
    resetGame,
    setProblemPool, setVotes, setVotingTimeLeft,
    setCursorPosition, removeCursorPosition, setTeams,
    setWarnings, setDisqualified,
  } = useGameStore();

  useEffect(() => {
    // Defensive: always remove before re-adding to prevent duplicate listeners
    // in React 18 StrictMode (which mounts/unmounts twice in dev).
    const off = (ev, fn) => { socket.off(ev, fn); socket.on(ev, fn); };

    // ── Room events ─────────────────────────────────────────────────────
    const onRoomCreated = ({ roomId, player: p, room: r }) => {
      localStorage.setItem('codearena_roomId', roomId);
      setPlayer(p);
      setRoom(r);
      setPlayers(r.players || {});
      setGamePhase('lobby');
      navigate(`/lobby/${roomId}`);
    };
    off('roomCreated', onRoomCreated);

    const onRoomJoined = ({ player: p, room: r }) => {
      // If the user voluntarily left, ignore reconnect-triggered roomJoined events.
      if (voluntaryLeave) {
        setVoluntaryLeave(false); // reset for next session
        return;
      }
      localStorage.setItem('codearena_roomId', r.id);
      setPlayer(p);
      setRoom(r);
      setPlayers(r.players || {});
      setGamePhase('lobby');
      navigate(`/lobby/${r.id}`);
    };
    off('roomJoined', onRoomJoined);

    // Reset voluntaryLeave flag on clean reconnect (network hiccup recovery)
    const onReconnect = () => {
      // Only allow re-entry if the user didn't explicitly leave
      if (voluntaryLeave) setVoluntaryLeave(false);
    };
    socket.on('reconnect', onReconnect);

    const onPlayerJoined = ({ players }) => setPlayers(players);
    off('playerJoined', onPlayerJoined);

    const onPlayerLeft = ({ players }) => setPlayers(players);
    off('playerLeft', onPlayerLeft);

    const onPlayersUpdate = ({ players }) => {
      setPlayers(players);
      // Sync the current player slice so their own ready/host state stays current
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && players[currentPlayer.id]) {
        setPlayer({ ...currentPlayer, ...players[currentPlayer.id] });
      }
    };
    off('playersUpdate', onPlayersUpdate);

    const onHostTransferred = ({ message }) => {
      toast.success(message, { icon: '👑' });
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer) setPlayer({ ...currentPlayer, isHost: true });
    };
    off('hostTransferred', onHostTransferred);

    const onSettingsUpdate = ({ anonymousMode }) => setAnonymousMode(anonymousMode);
    off('settingsUpdate', onSettingsUpdate);

    // Room reset (rematch)
    const onRoomReset = ({ players }) => {
      setPlayers(players);
      useGameStore.getState().resetGame();
      setGamePhase('lobby');
    };
    off('roomReset', onRoomReset);

    // ── Voting (2v2) ────────────────────────────────────────────────────
    const onGameVoting = ({ problems, teams, players }) => {
      setProblemPool(problems);
      setTeams(teams);
      setPlayers(players);
      setGamePhase('voting');
      navigate(`/lobby/${useGameStore.getState().room?.id}`); // Voting UI within lobby or separate
    };
    off('gameVoting', onGameVoting);

    const onVotingTick = ({ timeLeft }) => setVotingTimeLeft(timeLeft);
    off('votingTick', onVotingTick);

    const onVotesUpdate = ({ votes }) => setVotes(votes);
    off('votesUpdate', onVotesUpdate);

    // ── Countdown ───────────────────────────────────────────────────────
    const onGameCountdown = ({ problem }) => {
      setProblem(problem);
      setGamePhase('countdown');
    };
    off('gameCountdown', onGameCountdown);

    const onCountdownTick = ({ count }) => setCountdownValue(count);
    off('countdownTick', onCountdownTick);

    // ── Game start ──────────────────────────────────────────────────────
    const onGameStarted = ({ startTime, problem, duration }) => {
      setProblem(problem);
      setStartTime(startTime);
      setTimer(duration);
      setGamePhase('battle');
      setCountdownValue(null);
      // Read language fresh from store (not stale closure)
      const lang = useGameStore.getState().language;
      const starter = problem?.starterCode?.[lang] || '';
      setCode(starter);
      navigate(`/battle/${useGameStore.getState().room?.id}`);
    };
    off('gameStarted', onGameStarted);

    // ── Timer ────────────────────────────────────────────────────────────
    const onTimerTick = ({ remaining }) => {
      setTimer(remaining);
      if (remaining === 60) {
        toast('⏳ 1 minute remaining!', { icon: '⏰', duration: 3000 });
      }
    };
    off('timerTick', onTimerTick);

    // ── Submissions ──────────────────────────────────────────────────────
    const onSubmissionQueued = () => setIsSubmitting(true);
    off('submissionQueued', onSubmissionQueued);

    const onSubmissionResult = (result) => {
      setIsSubmitting(false);
      setSubmissionResult(result);
      if (result.accepted) {
        toast.success(`✅ Accepted! ${result.passed}/${result.total} tests passed`, { duration: 5000 });
      } else if (result.passed > 0) {
        toast(`⚠️ Partial: ${result.passed}/${result.total} tests passed`, { duration: 4000 });
      } else {
        toast.error(`❌ Wrong answer. ${result.passed}/${result.total} passed`, { duration: 4000 });
      }
    };
    off('submissionResult', onSubmissionResult);

    const onSubmitError = ({ message }) => {
      setIsSubmitting(false);
      toast.error(message, { duration: 4000 });
    };
    off('submitError', onSubmitError);

    const onRunQueued = () => setIsRunning(true);
    off('runQueued', onRunQueued);

    const onRunResult = (result) => {
      setIsRunning(false);
      setRunResult(result);
    };
    off('runResult', onRunResult);

    // ── Leaderboard ──────────────────────────────────────────────────────
    const onLeaderboardUpdate = ({ leaderboard, players }) => {
      setLeaderboard(leaderboard);
      setPlayers(players);
    };
    off('leaderboardUpdate', onLeaderboardUpdate);

    // ── Cursor Updates ───────────────────────────────────────────────────
    const onCursorUpdate = ({ playerId, playerName, position }) => {
      setCursorPosition(playerId, { ...position, playerName });
    };
    off('cursorUpdate', onCursorUpdate);

    const onProblemSwitched = ({ problem, team, message }) => {
      setProblem(problem);
      toast(message, { icon: '⚠️' });
    };
    off('problemSwitched', onProblemSwitched);

    // ── First Blood ──────────────────────────────────────────────────────
    const onFirstBlood = ({ playerId, playerName }) => {
      setFirstBlood(playerId);
      toast(`🩸 FIRST BLOOD — ${playerName}!`, {
        duration: 5000,
        style: { background: '#1a0010', border: '1px solid #ff206e', color: '#ff206e' },
      });
    };
    off('firstBlood', onFirstBlood);

    // ── Anti-Cheat ───────────────────────────────────────────────────────
    const onPlayerWarned = ({ warnings, reason }) => {
      setWarnings(warnings);
      toast(`⚠️ INTEGRITY WARNING ${warnings}/5 — ${reason}`, {
        duration: 5000,
        style: { background: '#1a0a00', border: '1px solid #f97316', color: '#f97316' },
        icon: '🚨',
      });
    };
    off('playerWarned', onPlayerWarned);

    const onPlayerDisqualified = ({ reason }) => {
      setDisqualified(true);
      toast.error(`🚫 DISQUALIFIED — ${reason}`, {
        duration: 999999,
        style: { background: '#1a0000', border: '2px solid #ef4444', color: '#ef4444' },
      });
    };
    off('playerDisqualified', onPlayerDisqualified);

    // ── Player activity ──────────────────────────────────────────────────
    const onPlayerTyping = ({ playerId, isTyping }) => setTypingPlayer(playerId, isTyping);
    off('playerTyping', onPlayerTyping);

    const onProgressUpdate = ({ playerId, progress }) => updatePlayerInRoom(playerId, { progress });
    off('progressUpdate', onProgressUpdate);

    // ── Commentary & Chat ────────────────────────────────────────────────
    const onCommentary = ({ message }) => addCommentary(message);
    off('commentary', onCommentary);

    const onChatMessage = (msg) => useGameStore.getState().addChatMessage(msg);
    off('chatMessage', onChatMessage);

    // ── Power-ups ────────────────────────────────────────────────────────
    const onPowerUpEffect = ({ type, message, duration }) => {
      setPowerUpEffect({ type, message });
      toast(message, {
        duration: duration || 4000,
        style: { background: '#0d0d1a', border: '1px solid #bf5fff', color: '#bf5fff' },
      });
      if (type === 'freeze') {
        setFrozen(true);
        setTimeout(() => setFrozen(false), duration || 5000);
      }
    };
    off('powerUpEffect', onPowerUpEffect);

    const onPowerUpUsed = ({ playerName, type }) => {
      const icons = { freeze: '❄️', hint: '💡', doubleScore: '⚡' };
      addCommentary(`${icons[type] || '🔮'} ${playerName} used ${type}!`);
    };
    off('powerUpUsed', onPowerUpUsed);

    // ── Game end ─────────────────────────────────────────────────────────
    const onGameEnded = ({ leaderboard, winner, message }) => {
      localStorage.removeItem('codearena_roomId');
      setFinalLeaderboard(leaderboard);
      setWinner(winner);
      setGamePhase('result');
      toast.success(message, { duration: 6000, icon: '🏆' });
      navigate(`/result/${useGameStore.getState().room?.id}`);
    };
    off('gameEnded', onGameEnded);

    // ── Errors ───────────────────────────────────────────────────────────
    const onError = ({ message, silent }) => {
      if (message === 'Room not found' || silent) {
        localStorage.removeItem('codearena_roomId');
      }
      if (!silent) {
        toast.error(message, { duration: 5000 });
      }
    };
    off('error', onError);

    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomJoined', onRoomJoined);
      socket.off('reconnect', onReconnect);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('playerLeft', onPlayerLeft);
      socket.off('playersUpdate', onPlayersUpdate);
      socket.off('hostTransferred', onHostTransferred);
      socket.off('settingsUpdate', onSettingsUpdate);
      socket.off('roomReset', onRoomReset);
      socket.off('gameVoting', onGameVoting);
      socket.off('votingTick', onVotingTick);
      socket.off('votesUpdate', onVotesUpdate);
      socket.off('gameCountdown', onGameCountdown);
      socket.off('countdownTick', onCountdownTick);
      socket.off('gameStarted', onGameStarted);
      socket.off('timerTick', onTimerTick);
      socket.off('submissionQueued', onSubmissionQueued);
      socket.off('submissionResult', onSubmissionResult);
      socket.off('submitError', onSubmitError);
      socket.off('runQueued', onRunQueued);
      socket.off('runResult', onRunResult);
      socket.off('leaderboardUpdate', onLeaderboardUpdate);
      socket.off('cursorUpdate', onCursorUpdate);
      socket.off('problemSwitched', onProblemSwitched);
      socket.off('firstBlood', onFirstBlood);
      socket.off('playerWarned', onPlayerWarned);
      socket.off('playerDisqualified', onPlayerDisqualified);
      socket.off('playerTyping', onPlayerTyping);
      socket.off('progressUpdate', onProgressUpdate);
      socket.off('commentary', onCommentary);
      socket.off('chatMessage', onChatMessage);
      socket.off('powerUpEffect', onPowerUpEffect);
      socket.off('powerUpUsed', onPowerUpUsed);
      socket.off('gameEnded', onGameEnded);
      socket.off('error', onError);
    };
  }, []);
}
