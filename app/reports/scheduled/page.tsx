'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { Calendar, Clock, Mail, Play, Pause, Trash2, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import { usePageLoading } from '@/hooks/usePageLoading';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { ScheduledReport } from '@/lib/reports/sharing';

export default function ScheduledReportsPage() {
  const { isLoading: isPageLoading, setDataReady } = usePageLoading();

  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('Failed to load scheduled reports');
    } finally {
      setIsLoading(false);
      setDataReady(true); // Mark page data as ready
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleStatus = async (scheduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const response = await fetch('/api/reports/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scheduleId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setSchedules(schedules.map(s => 
          s.id === scheduleId ? { ...s, status: newStatus as 'active' | 'paused' | 'failed' } : s
        ));
      }
    } catch (err) {
      console.error('Failed to update schedule:', err);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      const response = await fetch(`/api/reports/schedules?id=${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSchedules(schedules.filter(s => s.id !== scheduleId));
      }
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  const getFrequencyLabel = (schedule: ScheduledReport) => {
    switch (schedule.schedule.frequency) {
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[schedule.schedule.dayOfWeek || 1]}`;
      case 'monthly':
        return `Monthly on day ${schedule.schedule.dayOfMonth || 1}`;
      case 'quarterly':
        return 'Quarterly';
      default:
        return schedule.schedule.frequency;
    }
  };

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''} (${date.toLocaleDateString()})`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  };

  return (
    <>
      {isPageLoading ? (
        <PageLoadingScreen />
      ) : (
        <AdminShell>
          <div className="space-y-6">
          {/* Page Header */}
          <div
            className="flex items-center justify-between animate-fade-in opacity-0"
            style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            <div>
              <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-tight">
                Scheduled Reports
              </h1>
              <p className="text-text-secondary mt-3 font-aileron text-lg">
                Manage automated report generation and delivery
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow" />
            </div>
          </div>

          {/* Schedules List */}
          <div
            className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm animate-fade-in opacity-0"
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
          >
            <div className="border-b border-border-card p-6 bg-bg-app/40">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bebasNeue uppercase text-text-primary tracking-wide">
                  Active Schedules
                </h2>
                <span className="text-sm text-text-secondary font-aileron">
                  {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow border-t-transparent mx-auto mb-4" />
                  <p className="text-text-secondary font-aileron">Loading schedules...</p>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl2 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400 font-aileron">{error}</p>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-text-secondary font-aileron">
                    No scheduled reports yet. Create one from the Reports page.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="bg-bg-app/60 border border-border-card rounded-xl2 p-6 hover:border-yellow/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bebasNeue uppercase text-text-primary">
                              {schedule.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                schedule.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : schedule.status === 'paused'
                                  ? 'bg-yellow/20 text-yellow'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {schedule.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary font-aileron">
                            {schedule.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(schedule.id, schedule.status)}
                            className="p-2 hover:bg-bg-card rounded-lg transition-colors"
                            title={schedule.status === 'active' ? 'Pause' : 'Resume'}
                          >
                            {schedule.status === 'active' ? (
                              <Pause className="w-5 h-5 text-yellow" />
                            ) : (
                              <Play className="w-5 h-5 text-green-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="p-2 hover:bg-bg-card rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-text-secondary font-aileron text-xs">Frequency</p>
                            <p className="text-text-primary font-medium">
                              {getFrequencyLabel(schedule)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-text-secondary font-aileron text-xs">Next Run</p>
                            <p className="text-text-primary font-medium">
                              {formatNextRun(schedule.nextRun)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-text-secondary font-aileron text-xs">Recipients</p>
                            <p className="text-text-primary font-medium">
                              {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {schedule.lastRun && (
                        <div className="mt-4 pt-4 border-t border-border-card flex items-center gap-2 text-xs text-text-secondary">
                          <CheckCircle className="w-4 h-4" />
                          Last run: {new Date(schedule.lastRun).toLocaleString()}
                          {schedule.runCount && ` • ${schedule.runCount} total runs`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl2 p-6 animate-fade-in opacity-0"
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-bebasNeue uppercase text-blue-400 text-lg mb-2">
                  Scheduling Tips
                </h3>
                <ul className="space-y-2 text-sm text-text-secondary font-aileron">
                  <li>• Reports are generated using the latest data at the scheduled time</li>
                  <li>• All times are in your local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</li>
                  <li>• Paused schedules can be resumed anytime without losing configuration</li>
                  <li>• Failed deliveries are automatically retried up to 3 times</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
      )}
    </>
  );
}
