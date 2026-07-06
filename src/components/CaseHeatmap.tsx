/**
 * CaseHeatmap — GitHub-style contribution heatmap showing case/evidence activity
 * for the past 365 days. Used on the Dashboard page.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface DayCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface CaseHeatmapProps {
  /** Array of date strings (ISO format) with optional counts */
  activityDates?: { date: string; count: number }[];
  title?: string;
}

const INTENSITY_COLORS: Record<number, string> = {
  0: 'rgba(255,255,255,0.03)',
  1: 'rgba(26,47,251,0.25)',
  2: 'rgba(26,47,251,0.5)',
  3: 'rgba(26,47,251,0.75)',
  4: '#1a2ffb',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function generateHeatmapData(activityDates: { date: string; count: number }[] = []): { weeks: DayCell[][]; totalDays: number } {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 1);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday

  const activityMap = new Map<string, number>();
  activityDates.forEach(({ date, count }) => activityMap.set(date.split('T')[0], count));

  const weeks: DayCell[][] = [];
  let current = new Date(startDate);
  let totalDays = 0;

  while (current <= today) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      const level = (count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4) as 0 | 1 | 2 | 3 | 4;
      week.push({ date: dateStr, count, level });
      current.setDate(current.getDate() + 1);
      totalDays++;
      if (current > today) break;
    }
    weeks.push(week);
  }

  return { weeks, totalDays };
}

export default function CaseHeatmap({ activityDates = [], title = 'Activity' }: CaseHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const { weeks } = useMemo(() => generateHeatmapData(activityDates), [activityDates]);
  const totalActivity = useMemo(() => activityDates.reduce((sum, d) => sum + d.count, 0), [activityDates]);

  // Get month labels
  const monthLabels: { label: string; weekIdx: number }[] = [];
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay) {
      const date = new Date(firstDay.date);
      if (date.getDate() <= 7) {
        monthLabels.push({ label: MONTHS[date.getMonth()], weekIdx: wi });
      }
    }
  });

  const cellSize = 11;
  const gap = 3;
  const step = cellSize + gap;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', color: '#7a7d8e', fontWeight: 500 }}>{title}</p>
        <p style={{ fontSize: '11px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace" }}>
          {totalActivity} events in the last year
        </p>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: '24px', marginBottom: '4px', position: 'relative', height: '14px' }}>
            {monthLabels.map(({ label, weekIdx }) => (
              <div
                key={`${label}-${weekIdx}`}
                style={{
                  position: 'absolute',
                  left: `${weekIdx * step}px`,
                  fontSize: '9px',
                  color: '#4a4d5c',
                  fontFamily: "'IBM Plex Mono', monospace",
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: '3px' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '2px' }}>
              {DAYS.map((day, i) => (
                <div
                  key={i}
                  style={{
                    height: `${cellSize}px`,
                    fontSize: '9px',
                    color: '#4a4d5c',
                    fontFamily: "'IBM Plex Mono', monospace",
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    minWidth: '20px',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {week.map((cell, di) => (
                  <motion.div
                    key={`${wi}-${di}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (wi + di) * 0.001, duration: 0.2 }}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      borderRadius: '2px',
                      background: INTENSITY_COLORS[cell.level],
                      cursor: cell.count > 0 ? 'pointer' : 'default',
                      border: cell.level === 4 ? '1px solid rgba(26,47,251,0.4)' : '1px solid rgba(255,255,255,0.02)',
                      transition: 'all 0.15s ease',
                      boxShadow: cell.level >= 3 ? '0 0 6px rgba(26,47,251,0.4)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (cell.count > 0 || true) {
                        setTooltip({
                          text: `${cell.count} events on ${cell.date}`,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    whileHover={{ scale: 1.3 }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '9px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace" }}>Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: '2px',
                  background: INTENSITY_COLORS[level],
                  border: level === 4 ? '1px solid rgba(26,47,251,0.4)' : '1px solid rgba(255,255,255,0.02)',
                }}
              />
            ))}
            <span style={{ fontSize: '9px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace" }}>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y - 36,
            left: tooltip.x,
            transform: 'translateX(-50%)',
            background: 'rgba(10,15,30,0.95)',
            border: '1px solid rgba(26,47,251,0.2)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '10px',
            color: '#b0b3c0',
            fontFamily: "'IBM Plex Mono', monospace",
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
