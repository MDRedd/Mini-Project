import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { Users, Clock, AlertTriangle, CheckCircle, Flame, Sparkles, Filter } from 'lucide-react';
import { Faculty, TimetableEntry, Course } from '../types';

interface FacultyLoadDashboardProps {
  faculty: Faculty[];
  entries: TimetableEntry[];
  courses: Course[];
}

export default function FacultyLoadDashboard({ faculty, entries, courses }: FacultyLoadDashboardProps) {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Distinct divisions / departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    faculty.forEach(f => {
      if (f.division) set.add(f.division);
    });
    return Array.from(set);
  }, [faculty]);

  // Filtered faculty based on department
  const filteredFacultyList = useMemo(() => {
    if (departmentFilter === 'all') return faculty;
    return faculty.filter(f => f.division === departmentFilter);
  }, [faculty, departmentFilter]);

  // Calculate teaching load for each faculty in filtered set
  const loadData = useMemo(() => {
    return filteredFacultyList.map(f => {
      // Find all scheduled entries for this faculty
      const assignedEntries = entries.filter(e => e.facultyId === f.id);
      
      // Calculate total periods and total hours
      // Standard period is 50 minutes, which is 0.83 hours
      let totalPeriods = 0;
      let totalHours = 0;
      
      assignedEntries.forEach(entry => {
        const course = courses.find(c => c.id === entry.courseId);
        if (course) {
          totalPeriods += 1;
          totalHours += 50 / 60; // 50 minutes in hours
        }
      });

      return {
        id: f.id,
        name: f.name,
        division: f.division,
        periods: totalPeriods,
        hours: parseFloat(totalHours.toFixed(1)),
      };
    });
  }, [filteredFacultyList, entries, courses]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const activeStaff = filteredFacultyList.length;
    const totalHoursScheduled = loadData.reduce((acc, curr) => acc + curr.hours, 0);
    const avgLoad = activeStaff > 0 ? totalHoursScheduled / activeStaff : 0;
    
    // Find highest loaded faculty
    const sortedByLoad = [...loadData].sort((a, b) => b.hours - a.hours);
    const peakFaculty = sortedByLoad[0] && sortedByLoad[0].hours > 0 ? sortedByLoad[0] : null;

    // Faculty with zero hours
    const zeroLoadFaculty = loadData.filter(f => f.hours === 0);

    // Overloaded faculty (>16 hours is standard limit for assistant professors)
    const overloadedFaculty = loadData.filter(f => f.hours > 16);

    return {
      activeStaff,
      totalHoursScheduled: parseFloat(totalHoursScheduled.toFixed(1)),
      avgLoad: parseFloat(avgLoad.toFixed(1)),
      peakFaculty,
      zeroLoadFaculty,
      overloadedFaculty
    };
  }, [filteredFacultyList, loadData]);

  // Custom tooltips for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl text-[11px] text-slate-300">
          <p className="font-bold text-white text-xs mb-1">{data.name}</p>
          <p className="font-semibold text-blue-400 font-mono">{data.division}</p>
          <div className="mt-1.5 border-t border-slate-800 pt-1.5 space-y-1">
            <p>Scheduled Load: <strong className="text-white">{data.hours} hours</strong>/week</p>
            <p>Classes per week: <strong className="text-white">{data.periods} sessions</strong></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Faculty Registered</span>
            <span className="text-xl font-extrabold text-slate-900">{metrics.activeStaff} Professors</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Hours Assigned</span>
            <span className="text-xl font-extrabold text-slate-900">{metrics.totalHoursScheduled} hrs/wk</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Instructor Load</span>
            <span className="text-xl font-extrabold text-slate-900">{metrics.avgLoad} hrs/wk</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-xl ${metrics.overloadedFaculty.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {metrics.overloadedFaculty.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Load Balance Status</span>
            <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
              {metrics.overloadedFaculty.length > 0 
                ? `${metrics.overloadedFaculty.length} Overworked Profs` 
                : 'Perfect Workload Balance'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Workload Visualizer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                Faculty Weekly Load distribution
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated teaching hours based on 50-minute periods. Reference limit: 16 hrs (AICTE standard).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Divisions ({faculty.length})</option>
                {departments.map((dept) => {
                  const count = faculty.filter(f => f.division === dept).length;
                  return (
                    <option key={dept} value={dept}>
                      {dept} ({count})
                    </option>
                  );
                })}
              </select>

              <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-blue-500"></span> Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-rose-500"></span> Over Limit
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={loadData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  unit="h"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <ReferenceLine 
                  y={16} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  label={{ value: 'AICTE 16h Max Limit', fill: '#ef4444', fontSize: 8, fontWeight: 'bold', position: 'insideTopRight' }} 
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {loadData.map((entry, index) => {
                    const isOverLimit = entry.hours > 16;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isOverLimit ? 'url(#overloadGradient)' : 'url(#normalGradient)'} 
                      />
                    );
                  })}
                </Bar>
                {/* Visual gradients definition */}
                <defs>
                  <linearGradient id="normalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="overloadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Load Analysis Panels */}
        <div className="space-y-6">
          {/* Peak Workload / Overload Alert Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              Overutilization alerts
            </h4>
            
            {metrics.overloadedFaculty.length > 0 ? (
              <div className="space-y-3">
                {metrics.overloadedFaculty.map(f => (
                  <div key={f.id} className="p-3 bg-rose-50 border border-rose-100/50 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{f.name}</p>
                      <span className="text-[10px] text-rose-600 font-medium">{f.division}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600 font-mono">{f.hours} hrs/wk</p>
                      <span className="text-[9px] text-slate-500">{f.periods} periods</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                No faculty members exceed recommended workloads.
              </div>
            )}
          </div>

          {/* Underutilization Alert Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Underutilization alerts
            </h4>

            {metrics.zeroLoadFaculty.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {metrics.zeroLoadFaculty.map(f => (
                  <div key={f.id} className="p-2.5 bg-amber-50/40 border border-amber-100/30 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{f.name}</p>
                      <span className="text-[9px] text-slate-500">{f.division}</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-bold font-mono">0 hrs</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                All registered faculty have teaching duties assigned.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
