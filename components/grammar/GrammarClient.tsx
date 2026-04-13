"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Check, Play, Trophy } from "lucide-react";

type Props = {
  playlistId: string;
  initialWatchedIds: string[];
};

type YTPlayer = {
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData: () => { video_id: string; title: string };
  playVideoAt: (index: number) => void;
  loadPlaylist: (params: {
    list: string;
    listType: string;
    index?: number;
  }) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        config: Record<string, unknown>,
      ) => YTPlayer;
      PlayerState: { PLAYING: number; ENDED: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const existing = document.getElementById("youtube-iframe-api");
    const prevHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevHandler?.();
      resolve();
    };
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

export function GrammarClient({ playlistId, initialWatchedIds }: Props) {
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingMarkRef = useRef<Set<string>>(new Set());

  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [watched, setWatched] = useState<Set<string>>(
    () => new Set(initialWatchedIds),
  );
  const [loading, setLoading] = useState(true);

  const markWatched = useCallback(async (videoId: string) => {
    if (pendingMarkRef.current.has(videoId)) return;
    pendingMarkRef.current.add(videoId);
    setWatched((prev) => {
      if (prev.has(videoId)) return prev;
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });
    try {
      await fetch("/api/grammar/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
    } catch {
      // ignore; localStorage fallback below preserves UI state
    }
  }, []);

  const toggleWatched = useCallback(
    async (videoId: string) => {
      const isWatched = watched.has(videoId);
      setWatched((prev) => {
        const next = new Set(prev);
        if (isWatched) next.delete(videoId);
        else next.add(videoId);
        return next;
      });
      try {
        await fetch("/api/grammar/watched", {
          method: isWatched ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
      } catch {
        // ignore
      }
    },
    [watched],
  );

  // Load YouTube iframe player
  useEffect(() => {
    let disposed = false;
    (async () => {
      await loadYouTubeAPI();
      if (disposed || !playerContainerRef.current) return;

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          list: playlistId,
          listType: "playlist",
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            const list = playerRef.current?.getPlaylist() ?? [];
            setVideoIds(list);
            const idx = playerRef.current?.getPlaylistIndex() ?? 0;
            setCurrentIndex(idx);
            setLoading(false);
          },
          onStateChange: (e: { data: number }) => {
            const state = e.data;
            if (state === window.YT.PlayerState.PLAYING) {
              const data = playerRef.current?.getVideoData();
              if (data?.title && data.video_id) {
                setTitles((prev) =>
                  prev[data.video_id] === data.title
                    ? prev
                    : { ...prev, [data.video_id]: data.title },
                );
              }
              const idx = playerRef.current?.getPlaylistIndex() ?? -1;
              setCurrentIndex(idx);

              if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
              }
              progressTimerRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p) return;
                const cur = p.getCurrentTime();
                const dur = p.getDuration();
                if (dur > 0 && cur / dur >= 0.9) {
                  const d = p.getVideoData();
                  if (d?.video_id) void markWatched(d.video_id);
                  if (progressTimerRef.current) {
                    clearInterval(progressTimerRef.current);
                    progressTimerRef.current = null;
                  }
                }
              }, 2000);
            } else if (state === window.YT.PlayerState.ENDED) {
              const d = playerRef.current?.getVideoData();
              if (d?.video_id) void markWatched(d.video_id);
              if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = null;
              }
            } else if (
              state === window.YT.PlayerState.PAUSED &&
              progressTimerRef.current
            ) {
              clearInterval(progressTimerRef.current);
              progressTimerRef.current = null;
            }
          },
        },
      });
    })();

    return () => {
      disposed = true;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [playlistId, markWatched]);

  const handleSelect = (index: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.playVideoAt(index);
    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const watchedCount = videoIds.filter((id) => watched.has(id)).length;
  const total = videoIds.length;
  const pct = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          文法レッスン
        </h1>
        <p className="text-sm text-muted-foreground">
          英検3級の文法を動画でゼロから学べます
        </p>
      </header>

      {/* Progress */}
      <Card className="card-study border-0 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                視聴進捗
              </span>
              <span className="text-sm font-bold text-foreground">
                {loading ? "—" : `${watchedCount} / ${total}`}
                {total > 0 && watchedCount === total && " 達成!"}
              </span>
            </div>
            <div className="daily-progress-bar mt-2 h-2.5">
              <div
                className="daily-progress-fill h-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Player */}
      <Card className="card-study overflow-hidden border-0 p-0">
        <div className="relative aspect-video w-full bg-black">
          <div
            ref={playerContainerRef}
            className="absolute inset-0 h-full w-full"
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              読み込み中…
            </div>
          )}
        </div>
      </Card>

      {/* Video list */}
      <Card className="card-study border-0 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            レッスン一覧
          </h2>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">全{total}本</span>
          )}
        </div>

        <ul className="mt-4 flex flex-col gap-2">
          {videoIds.map((id, i) => {
            const isWatched = watched.has(id);
            const isCurrent = i === currentIndex;
            const title = titles[id];
            return (
              <li key={id}>
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(i)}
                    className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-muted"
                    aria-label={`第${i + 1}回を再生`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {isCurrent ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play
                          className="h-5 w-5 text-white"
                          fill="currentColor"
                        />
                      </span>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
                        <Play
                          className="h-5 w-5 text-white/0 transition-opacity hover:text-white"
                          fill="currentColor"
                        />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelect(i)}
                    className="flex min-w-0 flex-1 flex-col items-start text-left"
                  >
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      第{i + 1}回
                    </span>
                    <span
                      className={`line-clamp-2 text-sm font-medium ${
                        isWatched ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {title ?? "(読み込み中…)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleWatched(id)}
                    aria-label={
                      isWatched ? "視聴済みを解除" : "視聴済みにする"
                    }
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isWatched
                        ? "border-transparent bg-[oklch(0.55_0.16_145)] text-white"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </li>
            );
          })}
          {loading && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              プレイリスト読み込み中…
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
