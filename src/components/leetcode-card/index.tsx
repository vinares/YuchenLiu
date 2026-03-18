import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { skeleton } from '../../utils';

interface LeetcodeSolved {
  solvedProblem: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

const API_BASE = 'https://alfa-leetcode-api.onrender.com';
const CACHE_URL = `${import.meta.env.BASE_URL}leetcode-cache.json`;

const LeetcodeCard = ({ username }: { username: string }) => {
  const [solved, setSolved] = useState<LeetcodeSolved | null>(null);
  const [calendar, setCalendar] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // Try cached data first
      try {
        const cacheRes = await axios.get(CACHE_URL);
        const cache = cacheRes.data;
        if (cache.solved && cache.calendar) {
          setSolved(cache.solved);
          const raw = cache.calendar.submissionCalendar;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          setCalendar(parsed || {});
          setUpdatedAt(cache.updatedAt || null);
          return;
        }
      } catch {
        // Cache miss, fall through to API
      }

      // Fallback to live API
      const [solvedRes, calendarRes] = await Promise.all([
        axios.get(`${API_BASE}/${username}/solved`),
        axios.get(`${API_BASE}/${username}/calendar`),
      ]);
      setSolved(solvedRes.data);
      const raw = calendarRes.data.submissionCalendar;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setCalendar(parsed || {});
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load LeetCode data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) loadData();
  }, [username, loadData]);

  const getCalendarDays = () => {
    // End date is the cache pull date (or today), in UTC
    const now = updatedAt ? new Date(updatedAt) : new Date();
    const endMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    // Start date is 1 year before
    const startRaw = new Date(endMs);
    startRaw.setUTCFullYear(startRaw.getUTCFullYear() - 1);
    startRaw.setUTCDate(startRaw.getUTCDate() + 1);
    const startMs = Date.UTC(startRaw.getUTCFullYear(), startRaw.getUTCMonth(), startRaw.getUTCDate());

    // Align start to Sunday
    const startDate = new Date(startMs);
    const startDay = startDate.getUTCDay();
    const alignedStartMs = startMs - startDay * 86400000;

    // Align end to Saturday
    const endDate = new Date(endMs);
    const endDay = endDate.getUTCDay();
    const alignedEndMs = endDay === 6 ? endMs : endMs + (6 - endDay) * 86400000;

    const days: { date: Date; count: number }[] = [];
    let currentMs = alignedStartMs;
    while (currentMs <= alignedEndMs) {
      const ts = (currentMs / 1000).toString();
      days.push({
        date: new Date(currentMs),
        count: calendar[ts] || 0,
      });
      currentMs += 86400000;
    }
    return days;
  };

  const getColorStyle = (count: number): React.CSSProperties => {
    if (count === 0) return { backgroundColor: 'oklch(var(--b3))', opacity: 0.4 };
    if (count <= 3) return { backgroundColor: '#86efac' };
    if (count <= 8) return { backgroundColor: '#4ade80' };
    if (count <= 15) return { backgroundColor: '#22c55e' };
    if (count <= 25) return { backgroundColor: '#16a34a' };
    return { backgroundColor: '#15803d' };
  };

  const renderHeatmap = () => {
    const days = getCalendarDays();
    // Group into weeks (columns of 7 days, Sun-Sat)
    const weeks: { date: Date; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    // Month labels
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      const month = firstDay.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: firstDay.date.toLocaleString('default', { month: 'short' }),
          col: i,
        });
        lastMonth = month;
      }
    });

    const dayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

    return (
      <div className="overflow-x-auto">
        <div className="inline-flex">
          <div className="flex flex-col gap-[2px] mr-1 pt-[18px]">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="h-[10px] text-[9px] leading-[10px] text-base-content opacity-40"
              >
                {label}
              </div>
            ))}
          </div>
          <div>
            <div className="flex text-[10px] text-base-content opacity-50 mb-1">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${m.col * 12 + 36}px`,
                  }}
                >
                  {m.label}
                </span>
              ))}
              <span className="invisible">M</span>
            </div>
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className="w-[10px] h-[10px] rounded-sm"
                      style={getColorStyle(day.count)}
                      title={`${day.date.toLocaleDateString()}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card shadow-lg compact bg-base-100">
      <div className="card-body">
        <div className="mx-3">
          <h5 className="card-title">
            {loading ? (
              skeleton({ widthCls: 'w-32', heightCls: 'h-8' })
            ) : (
              <span className="text-base-content opacity-70">LeetCode</span>
            )}
          </h5>
        </div>
        <div className="p-3">
          {loading ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {skeleton({ widthCls: 'w-20', heightCls: 'h-6' })}
                {skeleton({ widthCls: 'w-16', heightCls: 'h-6' })}
                {skeleton({ widthCls: 'w-16', heightCls: 'h-6' })}
                {skeleton({ widthCls: 'w-16', heightCls: 'h-6' })}
              </div>
              <div className="flex gap-[2px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-[2px]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div
                        key={j}
                        className="w-[10px] h-[10px] rounded-sm bg-base-300 animate-pulse"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-2">
              <p className="text-base-content opacity-50 text-sm mb-2">
                Failed to load LeetCode data
              </p>
              <button className="btn btn-xs btn-outline" onClick={loadData}>
                Retry
              </button>
            </div>
          ) : solved ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="badge badge-lg badge-outline">
                  Solved: {solved.solvedProblem}
                </div>
                <div className="badge badge-lg badge-success badge-outline">
                  Easy: {solved.easySolved}
                </div>
                <div className="badge badge-lg badge-warning badge-outline">
                  Medium: {solved.mediumSolved}
                </div>
                <div className="badge badge-lg badge-error badge-outline">
                  Hard: {solved.hardSolved}
                </div>
              </div>
              {renderHeatmap()}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-1 text-[10px] text-base-content opacity-40">
                  <span>Less</span>
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: 'oklch(var(--b3))', opacity: 0.4 }} />
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: '#86efac' }} />
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: '#4ade80' }} />
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: '#22c55e' }} />
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: '#16a34a' }} />
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: '#15803d' }} />
                  <span>More</span>
                </div>
                {updatedAt && (
                  <span className="text-[10px] text-base-content opacity-30">
                    Updated {new Date(updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LeetcodeCard;
