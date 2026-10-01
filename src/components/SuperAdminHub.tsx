import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  ShieldCheck, 
  Users, 
  Settings, 
  FileText, 
  Database, 
  Zap, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Search, 
  RefreshCw, 
  Sliders, 
  Building2, 
  KeyRound, 
  Sparkles, 
  Check, 
  X,
  Activity,
  Layers,
  ArrowRight,
  BookOpen,
  Warehouse,
  GraduationCap
} from 'lucide-react';
import { 
  UserAccount, 
  UserRole, 
  AdminPermissions,
  AuditLogEntry, 
  SystemPolicySettings, 
  Batch, 
  Faculty, 
  Course, 
  Room, 
  FacultyCourseMapping, 
  SemesterCourseMap, 
  TimetableEntry 
} from '../types';
import { 
  saveUserAccounts, 
  saveSystemPolicies, 
  recordAuditLog, 
  clearAllAuditLogs, 
  performDatabaseHealthCheck, 
  repairDatabaseInconsistencies, 
  exportMasterUniversityBackup,
  HealthCheckReport,
  DEFAULT_ADMIN_PERMISSIONS
} from '../utils/superAdminData';

interface SuperAdminHubProps {
  currentUser: UserAccount;
  userAccounts: UserAccount[];
  onUpdateUserAccounts: (accounts: UserAccount[]) => void;
  policies: SystemPolicySettings;
  onUpdatePolicies: (policies: SystemPolicySettings) => void;
  auditLogs: AuditLogEntry[];
  onUpdateAuditLogs: (logs: AuditLogEntry[]) => void;
  batches: Batch[];
  faculty: Faculty[];
  courses: Course[];
  rooms: Room[];
  mappings: FacultyCourseMapping[];
  semesterCourseMaps: SemesterCourseMap[];
  entries: TimetableEntry[];
  onUpdateBatches: (batches: Batch[]) => void;
  onUpdateFaculty: (faculty: Faculty[]) => void;
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateRooms: (rooms: Room[]) => void;
  onUpdateMappings: (mappings: FacultyCourseMapping[]) => void;
  onUpdateSemesterCourseMaps: (maps: SemesterCourseMap[]) => void;
  onUpdateEntries: (entries: TimetableEntry[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export type SuperAdminSubTab = 'overview' | 'admin-permissions' | 'users' | 'policies' | 'audit' | 'database' | 'overrides';

export default function SuperAdminHub({
  currentUser,
  userAccounts,
  onUpdateUserAccounts,
  policies,
  onUpdatePolicies,
  auditLogs,
  onUpdateAuditLogs,
  batches,
  faculty,
  courses,
  rooms,
  mappings,
  semesterCourseMaps,
  entries,
  onUpdateBatches,
  onUpdateFaculty,
  onUpdateCourses,
  onUpdateRooms,
  onUpdateMappings,
  onUpdateSemesterCourseMaps,
  onUpdateEntries,
  onShowToast,
  onNavigateToTab,
}: SuperAdminHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<SuperAdminSubTab>('overview');

  // Policy form state
  const [policyForm, setPolicyForm] = useState<SystemPolicySettings>(policies);

  // Admin Permissions Form State (Decided by Super Admin!)
  const [adminPermsForm, setAdminPermsForm] = useState<AdminPermissions>(
    policies.adminPermissions || DEFAULT_ADMIN_PERMISSIONS
  );

  // New User Form State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'admin' as UserRole,
    department: 'Computer Science & Engineering',
    designation: '',
    pin: '1234',
  });

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Audit Log Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('all');

  // Health Check State
  const [healthReport, setHealthReport] = useState<HealthCheckReport | null>(null);
  const [isScanningHealth, setIsScanningHealth] = useState(false);

  // Master Factory Reset State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');


  // 1. Admin Permissions Handlers (Decided by Super Admin!)
  const handleToggleAdminPerm = (key: keyof AdminPermissions) => {
    setAdminPermsForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyPermissionPreset = (preset: 'full' | 'coordinator' | 'curriculum' | 'readonly') => {
    let newPerms: AdminPermissions;
    if (preset === 'full') {
      newPerms = {
        canRunCspSolver: true,
        canEditTimetableSlots: true,
        canManageFaculty: true,
        canManageCourses: true,
        canManageRooms: true,
        canManageCurriculum: true,
        canManageBatches: true,
        canClearGrids: true,
        canExportReports: true,
        canViewAnalytics: true,
        canAssignFacultyMappings: true,
      };
    } else if (preset === 'coordinator') {
      newPerms = {
        canRunCspSolver: true,
        canEditTimetableSlots: true,
        canManageFaculty: true,
        canManageCourses: true,
        canManageRooms: true,
        canManageCurriculum: true,
        canManageBatches: false,
        canClearGrids: false,
        canExportReports: true,
        canViewAnalytics: true,
        canAssignFacultyMappings: true,
      };
    } else if (preset === 'curriculum') {
      newPerms = {
        canRunCspSolver: false,
        canEditTimetableSlots: false,
        canManageFaculty: true,
        canManageCourses: true,
        canManageRooms: true,
        canManageCurriculum: true,
        canManageBatches: false,
        canClearGrids: false,
        canExportReports: true,
        canViewAnalytics: true,
        canAssignFacultyMappings: true,
      };
    } else {
      // readonly
      newPerms = {
        canRunCspSolver: false,
        canEditTimetableSlots: false,
        canManageFaculty: false,
        canManageCourses: false,
        canManageRooms: false,
        canManageCurriculum: false,
        canManageBatches: false,
        canClearGrids: false,
        canExportReports: true,
        canViewAnalytics: true,
        canAssignFacultyMappings: false,
      };
    }
    setAdminPermsForm(newPerms);
    onShowToast('info', 'Preset Loaded', `Applied "${preset.toUpperCase()}" template. Click "Save Admin Permissions" to enforce.`);
  };

  const handleSaveAdminPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPolicies = { ...policies, adminPermissions: adminPermsForm };
    setPolicyForm(updatedPolicies);
    onUpdatePolicies(updatedPolicies);
    saveSystemPolicies(updatedPolicies);

    const updatedLogs = recordAuditLog(
      'Updated Admin Role Permissions',
      currentUser,
      `Super Admin updated permissions granted to Admins (Solver: ${adminPermsForm.canRunCspSolver}, SlotEdit: ${adminPermsForm.canEditTimetableSlots}, BatchMgmt: ${adminPermsForm.canManageBatches}, GridWipe: ${adminPermsForm.canClearGrids}).`,
      'security',
      'warning'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', 'Admin Permissions Enforced', 'Admin role access rules updated successfully by Super Admin.');
  };

  // 2. Policy Update Handler
  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePolicies(policyForm);
    saveSystemPolicies(policyForm);
    const updatedLogs = recordAuditLog(
      'Updated System Policies',
      currentUser,
      `Configured policies: Freeze=${policyForm.emergencyFreezeTimetables}, AICTE strictness=${policyForm.strictAicteEnforcement}, Max Hours=${policyForm.maxDailyFacultyHours}`,
      'system',
      'warning'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', 'Policies Applied', 'University governance and system policy settings saved successfully.');
  };

  // Toggle freeze immediately
  const handleToggleFreeze = () => {
    const newFreeze = !policies.emergencyFreezeTimetables;
    const updated = { ...policies, emergencyFreezeTimetables: newFreeze };
    setPolicyForm(updated);
    onUpdatePolicies(updated);
    saveSystemPolicies(updated);
    const updatedLogs = recordAuditLog(
      newFreeze ? 'Enabled Emergency Timetable Freeze' : 'Lifted Emergency Timetable Freeze',
      currentUser,
      newFreeze ? 'Campus-wide timetable editing and generation locked for standard admins.' : 'Timetable editing and solver unlocked.',
      'override',
      newFreeze ? 'warning' : 'info'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast(newFreeze ? 'warning' : 'info', newFreeze ? 'Timetables Frozen' : 'Timetables Unfrozen', newFreeze ? 'All timetable edits are now locked campus-wide.' : 'Timetable edits are now allowed.');
  };

  // 2. User Management Handlers
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      onShowToast('warning', 'Missing Fields', 'Please provide user full name and email.');
      return;
    }

    if (userAccounts.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      onShowToast('error', 'Duplicate Email', 'A user with this email address already exists.');
      return;
    }

    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      designation: newUser.designation || (newUser.role === 'super_admin' ? 'Super Administrator' : 'Administrator'),
      pin: newUser.pin || '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: undefined
    };

    const updated = [...userAccounts, created];
    onUpdateUserAccounts(updated);
    saveUserAccounts(updated);
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', role: 'admin', department: 'Computer Science & Engineering', designation: '', pin: '1234' });

    const updatedLogs = recordAuditLog(
      'Created User Account',
      currentUser,
      `Created ${created.role.replace('_', ' ')} account for "${created.name}" (${created.email}).`,
      'security',
      'info'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', 'User Created', `Added ${created.name} as ${created.role.replace('_', ' ')}.`);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      onShowToast('error', 'Cannot Delete Self', 'You cannot delete your own active Super Admin account.');
      return;
    }
    if (userAccounts.filter(u => u.role === 'super_admin').length <= 1 && user.role === 'super_admin') {
      onShowToast('error', 'Super Admin Required', 'At least one Super Admin account must remain in the system.');
      return;
    }

    const updated = userAccounts.filter(u => u.id !== user.id);
    onUpdateUserAccounts(updated);
    saveUserAccounts(updated);

    const updatedLogs = recordAuditLog(
      'Deleted User Account',
      currentUser,
      `Removed user account "${user.name}" (${user.email}, ${user.role}).`,
      'security',
      'warning'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('info', 'User Removed', `Account for ${user.name} was deleted.`);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = userAccounts.map(u => u.id === editingUser.id ? editingUser : u);
    onUpdateUserAccounts(updated);
    saveUserAccounts(updated);
    setEditingUser(null);

    const updatedLogs = recordAuditLog(
      'Modified User Account',
      currentUser,
      `Updated profile for "${editingUser.name}" (${editingUser.role}, PIN updated=${Boolean(editingUser.pin)}).`,
      'security',
      'info'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', 'User Updated', `Updated settings for ${editingUser.name}.`);
  };

  // 3. Audit Log Handlers
  const handleExportAuditLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SECURITY_AUDIT_LOGS_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('success', 'Logs Exported', 'Audit trail exported as JSON report.');
  };

  const handleClearAuditLogs = () => {
    if (window.confirm('Are you sure you want to clear all security and audit logs? This action is recorded.')) {
      clearAllAuditLogs();
      const freshLogs = recordAuditLog(
        'Audit Trail Purged',
        currentUser,
        'All prior security and schedule logs were purged by Super Admin.',
        'security',
        'critical'
      );
      onUpdateAuditLogs(freshLogs);
      onShowToast('warning', 'Logs Purged', 'All previous audit logs were wiped.');
    }
  };

  // 4. Database Health & Maintenance Handlers
  const handleRunHealthCheck = () => {
    setIsScanningHealth(true);
    setTimeout(() => {
      const report = performDatabaseHealthCheck(
        batches,
        faculty,
        courses,
        rooms,
        mappings,
        semesterCourseMaps,
        entries
      );
      setHealthReport(report);
      setIsScanningHealth(false);
      if (report.isHealthy) {
        onShowToast('success', 'Integrity Verified', 'All foreign keys and schedule relationships are 100% healthy!');
      } else {
        onShowToast('warning', 'Issues Detected', `Found ${report.totalIssues} inconsistencies in the timetable database.`);
      }
    }, 400);
  };

  const handleRepairDatabase = () => {
    const { repairedEntries, repairedMappings, repairedSemesterMaps, fixedCount } = repairDatabaseInconsistencies(
      batches,
      faculty,
      courses,
      rooms,
      mappings,
      semesterCourseMaps,
      entries
    );
    onUpdateEntries(repairedEntries);
    onUpdateMappings(repairedMappings);
    onUpdateSemesterCourseMaps(repairedSemesterMaps);
    
    // Re-run health check
    const report = performDatabaseHealthCheck(
      batches,
      faculty,
      courses,
      rooms,
      repairedMappings,
      repairedSemesterMaps,
      repairedEntries
    );
    setHealthReport(report);

    const updatedLogs = recordAuditLog(
      'Database Reference Auto-Repair',
      currentUser,
      `Cleaned up ${fixedCount} orphaned/broken records across timetables and mappings.`,
      'system',
      'success'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', 'Database Repaired', `Repaired database! Fixed ${fixedCount} broken references.`);
  };

  const handleMasterBackupDownload = () => {
    exportMasterUniversityBackup(
      currentUser,
      policies,
      userAccounts,
      batches,
      faculty,
      courses,
      rooms,
      mappings,
      semesterCourseMaps,
      entries,
      auditLogs
    );
    const updatedLogs = recordAuditLog(
      'Master Database Export',
      currentUser,
      `Generated full university master JSON backup containing ${entries.length} slots, ${batches.length} batches, ${faculty.length} faculty.`,
      'system',
      'info'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', 'Master Backup Exported', 'Full institutional database JSON downloaded.');
  };

  const handleMasterRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.batches && parsed.faculty && parsed.courses && parsed.timetableEntries) {
            onUpdateBatches(parsed.batches);
            onUpdateFaculty(parsed.faculty);
            onUpdateCourses(parsed.courses);
            if (parsed.rooms) onUpdateRooms(parsed.rooms);
            if (parsed.mappings) onUpdateMappings(parsed.mappings);
            if (parsed.semesterCourseMaps) onUpdateSemesterCourseMaps(parsed.semesterCourseMaps);
            onUpdateEntries(parsed.timetableEntries);
            if (parsed.policies) {
              onUpdatePolicies(parsed.policies);
              setPolicyForm(parsed.policies);
            }
            if (parsed.userAccounts) onUpdateUserAccounts(parsed.userAccounts);

            const updatedLogs = recordAuditLog(
              'Master Database Restored',
              currentUser,
              `Restored full database from backup file (${parsed.timetableEntries.length} entries, ${parsed.batches.length} batches).`,
              'system',
              'critical'
            );
            onUpdateAuditLogs(updatedLogs);
            onShowToast('success', 'Database Restored', `Restored ${parsed.timetableEntries.length} entries from master archive.`);
          } else {
            throw new Error('Missing essential university schema fields in JSON.');
          }
        } catch (err: any) {
          onShowToast('error', 'Restore Failed', err.message || 'Invalid master backup JSON format.');
        }
      };
    }
  };

  // 5. Executive Overrides Handlers
  const handleMassLockAll = (lock: boolean) => {
    const updated = entries.map(e => ({ ...e, isLocked: lock }));
    onUpdateEntries(updated);
    const updatedLogs = recordAuditLog(
      lock ? 'Mass Locked All Timetable Slots' : 'Mass Unlocked All Timetable Slots',
      currentUser,
      `${lock ? 'Locked' : 'Unlocked'} ${entries.length} scheduled slots university-wide.`,
      'override',
      'warning'
    );
    onUpdateAuditLogs(updatedLogs);
    onShowToast('success', lock ? 'All Slots Locked' : 'All Slots Unlocked', `${entries.length} slots were ${lock ? 'locked' : 'unlocked'}.`);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesCategory = auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
    const matchesSeverity = auditSeverityFilter === 'all' || log.severity === auditSeverityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* 1. Super Admin Royal Glassmorphic Hero Banner */}
      <div className="relative overflow-hidden bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-50/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-2xl shadow-md shadow-amber-500/20 shrink-0 text-white">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
                  Super Admin Governance Hub
                </h1>
                <span className="text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                  👑 Institutional Master Tier
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Centralized university administration, Role-Based Access Control (RBAC), AICTE governance, campus timetable freeze protocols, and disaster recovery.
              </p>
            </div>
          </div>

          {/* Quick Freeze Switch & Status */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 px-4 rounded-2xl">
            <div>
              <div className="text-[10px] font-mono uppercase font-black text-slate-600 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${policies.emergencyFreezeTimetables ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                Campus Timetable Freeze
              </div>
              <p className="text-xs font-bold text-[#0F172A]">
                {policies.emergencyFreezeTimetables ? 'FROZEN (Edits Blocked)' : 'ACTIVE (Edits Allowed)'}
              </p>
            </div>
            <button
              onClick={handleToggleFreeze}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                policies.emergencyFreezeTimetables
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-indigo-500/20'
              }`}
            >
              {policies.emergencyFreezeTimetables ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Lift Freeze</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Freeze All Edits</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metric Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">Admin Accounts</span>
            <span className="text-lg font-black text-[#0F172A]">{userAccounts.filter(u => u.role === 'admin' || u.role === 'super_admin').length} Active</span>
          </div>
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">Campus Batches</span>
            <span className="text-lg font-black text-[#0F172A]">{batches.length} Sections (Sem 1-8)</span>
          </div>
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">Scheduled Slots</span>
            <span className="text-lg font-black text-[#0F172A]">{entries.length} Slots</span>
          </div>
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">Security Audit Logs</span>
            <span className="text-lg font-black text-[#0F172A]">{auditLogs.length} Events Logged</span>
          </div>
        </div>
      </div>

      {/* 2. Super Admin Navigation Sub-Tabs Strip */}
      <div className="bg-white border border-slate-200/90 p-2 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Executive Dashboard', icon: Activity },
            { id: 'admin-permissions', label: 'Admin Access & Permissions', icon: ShieldCheck, badge: 'Role Control' },
            { id: 'users', label: 'User & Admin RBAC', icon: Users, badge: `${userAccounts.length}` },
            { id: 'policies', label: 'Institutional Policies', icon: Sliders },
            { id: 'audit', label: 'Security Audit Trail', icon: FileText, badge: `${auditLogs.length}` },
            { id: 'database', label: 'Master DB & Backups', icon: Database },
            { id: 'overrides', label: 'Executive Overrides', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as SuperAdminSubTab)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-amber-800 bg-amber-50 border border-amber-300/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Tab Content */}

      {/* SECTION 1: EXECUTIVE DASHBOARD */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Freeze & Security Protocol */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Campus Governance
                </span>
              </div>
              <h3 className="font-black text-slate-950 text-base">Campus Lock & Freeze Protocol</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When Timetable Freeze is activated, standard Administrators and Faculty are restricted to read-only views. Only Super Admins can alter slots or run the CSP solver.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleToggleFreeze}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    policies.emergencyFreezeTimetables
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {policies.emergencyFreezeTimetables ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {policies.emergencyFreezeTimetables ? 'Lift Emergency Freeze' : 'Activate Campus Freeze'}
                </button>
              </div>
            </div>

            {/* Card 2: Database Integrity Audit */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Activity className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Data Reliability
                </span>
              </div>
              <h3 className="font-black text-slate-950 text-base">Foreign Key & Schedule Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect 40 Batches, 24 Faculty, 18 Rooms, and all scheduled timetable slots for dangling references or broken cross-table links.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunHealthCheck}
                  disabled={isScanningHealth}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanningHealth ? 'animate-spin' : ''}`} />
                  {isScanningHealth ? 'Scanning Database...' : 'Run Integrity Scan'}
                </button>
              </div>
            </div>

            {/* Card 3: Master Raw JSON Export */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Database className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Disaster Recovery
                </span>
              </div>
              <h3 className="font-black text-slate-950 text-base">Full University Master Archive</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a self-contained, complete backup bundle including all batches, faculty workloads, curriculum maps, policies, and audit trails.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleMasterBackupDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" />
                  Export Master JSON Backup
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Security Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Super Admin Quick Commands
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleMassLockAll(true)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 mb-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    Lock All 40 Batches
                  </div>
                  <p className="text-[11px] text-slate-500">Prevent accidental slot edits</p>
                </button>

                <button
                  onClick={() => handleMassLockAll(false)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 mb-1">
                    <Unlock className="w-3.5 h-3.5 text-amber-600" />
                    Unlock All Slots
                  </div>
                  <p className="text-[11px] text-slate-500">Enable universal drag & drop</p>
                </button>

                <button
                  onClick={() => setActiveSubTab('users')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Manage Administrators
                  </div>
                  <p className="text-[11px] text-slate-500">Add or edit admin PINs</p>
                </button>

                <button
                  onClick={() => setActiveSubTab('policies')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 mb-1">
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    AICTE Workload Rules
                  </div>
                  <p className="text-[11px] text-slate-500">Configure teaching hours</p>
                </button>
              </div>
            </div>

            {/* Recent Audit Trail Preview */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Recent Governance Activity
                </h3>
                <button
                  onClick={() => setActiveSubTab('audit')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Logs</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          log.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                          log.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                          log.severity === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ADMIN ACCESS & PERMISSIONS CONTROL (DECIDED BY SUPER ADMIN) */}
      {activeSubTab === 'admin-permissions' && (
        <form onSubmit={handleSaveAdminPermissions} className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-black text-slate-950">
                    Admin Role Access & Task Delegation Control
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  As <strong>Super Admin</strong>, you decide which modules, solvers, and data editing tools standard Administrators are allowed to use. Disabled works will be locked or hidden for Admins.
                </p>
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Save & Enforce Permissions</span>
              </button>
            </div>

            {/* Quick Presets Strip */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
              <span className="text-[10px] font-mono uppercase font-black text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Quick Role Permission Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('full')}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-purple-300 text-purple-900 font-bold text-xs shadow-2xs hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  🌟 Full Admin (All Permissions)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('coordinator')}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-900 font-bold text-xs shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  📋 Timetable Coordinator (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('curriculum')}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-300 text-emerald-900 font-bold text-xs shadow-2xs hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  📚 Curriculum Editor Only
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('readonly')}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  👁️ Read-Only Timetable Auditor
                </button>
              </div>
            </div>

            {/* 11 Granular Permission Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: 'canRunCspSolver' as keyof AdminPermissions,
                  title: 'CSP Auto-Timetable Solver',
                  desc: 'Execute Single-Section and Full-Campus constraint backtracking solvers to auto-generate weekly schedules.',
                  icon: Sparkles,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                },
                {
                  key: 'canEditTimetableSlots' as keyof AdminPermissions,
                  title: 'Drag & Drop Slot Editing',
                  desc: 'Manually move, swap, and drag courses into slots on the timetable grid, lock periods, and edit cells.',
                  icon: Layers,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50',
                },
                {
                  key: 'canManageFaculty' as keyof AdminPermissions,
                  title: 'Faculty Directory & Workload',
                  desc: 'Add, update, or remove academic faculty profiles, assign teaching designations, and adjust workload limits.',
                  icon: Users,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  key: 'canAssignFacultyMappings' as keyof AdminPermissions,
                  title: 'Faculty Course Assignments',
                  desc: 'Map specific specialized professors and lecturers to courses in the faculty mapping matrix.',
                  icon: RefreshCw,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                },
                {
                  key: 'canManageCourses' as keyof AdminPermissions,
                  title: 'Syllabus & Course Catalog',
                  desc: 'Create new course codes, define credits, specify theory vs lab types, and adjust duration slots.',
                  icon: BookOpen,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  key: 'canManageRooms' as keyof AdminPermissions,
                  title: 'Classrooms & Laboratories',
                  desc: 'Register physical classrooms, seminar halls, and laboratory spaces with seating capacity quotas.',
                  icon: Warehouse,
                  color: 'text-teal-600',
                  bg: 'bg-teal-50',
                },
                {
                  key: 'canManageCurriculum' as keyof AdminPermissions,
                  title: 'Semester Planner & Mapping',
                  desc: 'Assign required curriculum courses (Semesters I-VIII) and set lecture, tutorial, practical hours.',
                  icon: Sliders,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50',
                },
                {
                  key: 'canManageBatches' as keyof AdminPermissions,
                  title: 'Batch Creation & Promotion',
                  desc: 'Create student sections and promote batches to next academic semesters (Sem 1-8).',
                  icon: GraduationCap,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                },
                {
                  key: 'canClearGrids' as keyof AdminPermissions,
                  title: 'Timetable Grid Clearance & Wipe',
                  desc: 'Execute grid clearing and remove all scheduled periods for sections or campus-wide.',
                  icon: Trash2,
                  color: 'text-rose-600',
                  bg: 'bg-rose-50',
                },
                {
                  key: 'canExportReports' as keyof AdminPermissions,
                  title: 'Export PDF & Excel Reports',
                  desc: 'Generate printable high-resolution PDF timetables and download Excel master spreadsheets.',
                  icon: Download,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  key: 'canViewAnalytics' as keyof AdminPermissions,
                  title: 'Health & Section Diagnostics',
                  desc: 'Access the 24-Constraint audit dashboard and inspect parallel section overlap clash diagnostics.',
                  icon: Activity,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isGranted = Boolean(adminPermsForm[item.key]);

                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleAdminPerm(item.key)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                      isGranted
                        ? 'border-purple-300 bg-purple-50/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <h4 className="font-black text-xs text-slate-900 leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        {/* Switch Pill */}
                        <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                          isGranted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {isGranted ? '✓ GRANTED' : '✗ RESTRICTED'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Admin Access:</span>
                      <span className={`font-bold ${isGranted ? 'text-purple-700' : 'text-slate-400'}`}>
                        {isGranted ? 'Enabled for Admins' : 'Disabled / Hidden'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Apply Admin Role Permissions
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECTION 3: USER & ADMIN ACCESS MANAGEMENT (RBAC) */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Role-Based User & Administrator Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Assign administrative privileges, configure authorization PINs, and grant Super Admin access.
                </p>
              </div>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add New User / Admin
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold uppercase text-[11px] bg-slate-50 sticky top-0 z-10">
                    <th className="p-3.5 pl-4">User Profile</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Department / Title</th>
                    <th className="p-3.5">Security PIN</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userAccounts.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                            user.role === 'super_admin' ? 'bg-purple-700' :
                            user.role === 'admin' ? 'bg-indigo-600' :
                            user.role === 'faculty' ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">{user.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono ${
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          user.role === 'faculty' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {user.role === 'super_admin' ? '👑 SUPER ADMIN' :
                           user.role === 'admin' ? '🛡️ ADMIN' :
                           user.role === 'faculty' ? '👨‍🏫 FACULTY' : '🎓 STUDENT'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{user.designation || 'Academic Staff'}</p>
                        <p className="text-[10px] text-slate-400">{user.department}</p>
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        {user.pin ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                            {user.pin}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit User Role & PIN"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Privilege Comparison Matrix */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              University Multi-Tier RBAC Privilege Matrix
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold uppercase text-[10px] bg-slate-50">
                    <th className="p-3">Capability / Operation</th>
                    <th className="p-3 text-purple-700 font-black">👑 Super Admin</th>
                    <th className="p-3 text-indigo-700 font-black">🛡️ Admin</th>
                    <th className="p-3 text-emerald-700 font-black">👨‍🏫 Faculty</th>
                    <th className="p-3 text-blue-700 font-black">🎓 Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {[
                    { cap: 'View Class Schedules & PDF Export', sa: true, ad: true, fa: true, st: true },
                    { cap: 'View Personal Schedule & Room Occupancy', sa: true, ad: true, fa: true, st: true },
                    { cap: 'CSP Timetable Solver Execution (Single / Multi-Sem)', sa: true, ad: true, fa: false, st: false },
                    { cap: 'Drag-and-Drop Slot Editing & Manual Swaps', sa: true, ad: true, fa: false, st: false },
                    { cap: 'Manage Faculty, Rooms, Courses & Syllabus', sa: true, ad: true, fa: false, st: false },
                    { cap: 'Emergency Timetable Freeze (Global Campus Lock)', sa: true, ad: false, fa: false, st: false },
                    { cap: 'Manage Admin Accounts, Roles & Security PINs', sa: true, ad: false, fa: false, st: false },
                    { cap: 'AICTE / UGC System Policy & Quota Configuration', sa: true, ad: false, fa: false, st: false },
                    { cap: 'Institutional Security Audit Trail & Access Logs', sa: true, ad: false, fa: false, st: false },
                    { cap: 'Master Database Health Check & Auto-Repair', sa: true, ad: false, fa: false, st: false },
                    { cap: 'Master University Disaster Backup & Factory Reset', sa: true, ad: false, fa: false, st: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{row.cap}</td>
                      <td className="p-3">
                        <Check className="w-4 h-4 text-purple-600" />
                      </td>
                      <td className="p-3">
                        {row.ad ? <Check className="w-4 h-4 text-indigo-600" /> : <X className="w-4 h-4 text-slate-300" />}
                      </td>
                      <td className="p-3">
                        {row.fa ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-300" />}
                      </td>
                      <td className="p-3">
                        {row.st ? <Check className="w-4 h-4 text-blue-600" /> : <X className="w-4 h-4 text-slate-300" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: INSTITUTIONAL POLICIES & GOVERNANCE */}
      {activeSubTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                Institutional System Policies & Governance Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Enforce university regulations, workload thresholds, and administrative restrictions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Institution Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Institution / School Name</label>
                <input
                  type="text"
                  value={policyForm.institutionName}
                  onChange={(e) => setPolicyForm({ ...policyForm, institutionName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Department Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Department Name</label>
                <input
                  type="text"
                  value={policyForm.departmentName}
                  onChange={(e) => setPolicyForm({ ...policyForm, departmentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Academic Session */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Active Academic Session</label>
                <input
                  type="text"
                  value={policyForm.academicYear}
                  onChange={(e) => setPolicyForm({ ...policyForm, academicYear: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Max Daily Faculty Hours */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Max Daily Faculty Teaching Load</label>
                <select
                  value={policyForm.maxDailyFacultyHours}
                  onChange={(e) => setPolicyForm({ ...policyForm, maxDailyFacultyHours: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value={3}>3 Hours per Day (Strict AICTE)</option>
                  <option value={4}>4 Hours per Day (Recommended Standard)</option>
                  <option value={5}>5 Hours per Day (High Intensity)</option>
                  <option value={6}>6 Hours per Day (Maximum Limit)</option>
                </select>
              </div>
            </div>

            {/* Policy Toggle Switches */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                System Governance Rules
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rule 1: AICTE Enforcement */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block mb-0.5">Strict AICTE Constraint Mode</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Enforce strict 16h/week Assistant Professor and 14h/week Professor workload ceilings in CSP solver.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyForm.strictAicteEnforcement}
                    onChange={(e) => setPolicyForm({ ...policyForm, strictAicteEnforcement: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>

                {/* Rule 2: Emergency Freeze */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block mb-0.5">Campus Timetable Freeze</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Lock all timetables against edits by regular administrators across the university.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyForm.emergencyFreezeTimetables}
                    onChange={(e) => setPolicyForm({ ...policyForm, emergencyFreezeTimetables: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>

                {/* Rule 3: Admin Global Wipe */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block mb-0.5">Allow Admin Global Grid Wipe</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      When disabled, only Super Admins can execute campus-wide university grid clearances.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyForm.allowAdminTimetableWipe}
                    onChange={(e) => setPolicyForm({ ...policyForm, allowAdminTimetableWipe: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>

                {/* Rule 4: Auto-Backup on Solver */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block mb-0.5">Auto-Snapshot on Solver Run</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Automatically record snapshot backup prior to computing new timetable schedules.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyForm.autoBackupOnSolver}
                    onChange={(e) => setPolicyForm({ ...policyForm, autoBackupOnSolver: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Apply Institutional Policies
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECTION 4: SECURITY AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Institutional Security & Governance Audit Trail
                </h3>
                <p className="text-xs text-slate-500">
                  Tamper-evident logs of timetable generation, batch promotions, slot modifications, and security events.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAuditLogs}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Logs
                </button>
                <button
                  onClick={handleClearAuditLogs}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search logs by action, user, or details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={auditCategoryFilter}
                  onChange={(e) => setAuditCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="security">Security</option>
                  <option value="schedule">Schedule</option>
                  <option value="curriculum">Curriculum</option>
                  <option value="system">System</option>
                  <option value="override">Override</option>
                </select>

                <select
                  value={auditSeverityFilter}
                  onChange={(e) => setAuditSeverityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Audit Log Stream */}
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No audit logs matching current filter criteria.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-2xl border flex items-start justify-between gap-3 ${
                      log.severity === 'critical' ? 'bg-rose-50/60 border-rose-200 text-rose-950' :
                      log.severity === 'warning' ? 'bg-amber-50/60 border-amber-200 text-amber-950' :
                      log.severity === 'success' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
                      'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-xs">{log.action}</span>
                        <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-bold">
                          {log.userName} ({log.userRole.replace('_', ' ')})
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-slate-200 text-slate-800">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-slate-600 leading-snug">{log.details}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MASTER DATABASE MAINTENANCE & DISASTER RECOVERY */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Database Health Scan */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Database Consistency Diagnostic</h3>
                    <p className="text-[11px] text-slate-500">Scan for orphaned timetable entries or unmapped faculty</p>
                  </div>
                </div>

                <button
                  onClick={handleRunHealthCheck}
                  disabled={isScanningHealth}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningHealth ? 'animate-spin' : ''}`} />
                  {isScanningHealth ? 'Scanning...' : 'Scan Now'}
                </button>
              </div>

              {healthReport && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  healthReport.isHealthy ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      {healthReport.isHealthy ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {healthReport.isHealthy ? 'Database 100% Consistent' : `${healthReport.totalIssues} Inconsistencies Found`}
                    </span>
                    {!healthReport.isHealthy && (
                      <button
                        onClick={handleRepairDatabase}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Auto-Repair Now
                      </button>
                    )}
                  </div>

                  {!healthReport.isHealthy && healthReport.details.length > 0 && (
                    <ul className="text-[11px] list-disc list-inside space-y-1 text-slate-700">
                      {healthReport.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Master Export / Import */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Master University State Archive</h3>
                  <p className="text-[11px] text-slate-500">Backup and restore all department schedules and accounts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleMasterBackupDownload}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs p-3.5 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Download className="w-5 h-5 text-purple-400" />
                  <span>Download Master JSON</span>
                </button>

                <label className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-black text-xs p-3.5 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Restore from JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleMasterRestoreUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Super Admin Danger Zone */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-rose-950">Super Admin University Factory Reset</h3>
                <p className="text-xs text-rose-700">
                  Permanently clear all scheduled timetables across all 40 batches and restore default semester catalog.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Execute University Reset...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: EXECUTIVE OVERRIDES */}
      {activeSubTab === 'overrides' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Super Admin Executive Overrides
              </h3>
              <p className="text-xs text-slate-500">
                Override locked periods, force mass room relocations, and bypass standard scheduling constraints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-xs text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Universal Timetable Slot Lock
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mark all {entries.length} scheduled periods across Semesters I through VIII as locked. Regular administrators cannot move them.
                </p>
                <button
                  onClick={() => handleMassLockAll(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Lock All {entries.length} Slots
                </button>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-xs text-slate-900 flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-amber-600" />
                  Universal Timetable Slot Unlock
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unlock all {entries.length} scheduled periods, allowing the CSP solver or drag-and-drop actions to relocate all slots.
                </p>
                <button
                  onClick={() => handleMassLockAll(false)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Unlock All Slots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  Add User / Administrator
                </h3>
                <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Prof. Sarah Jenkins"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah.jenkins@university.edu"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="super_admin">👑 Super Admin</option>
                      <option value="admin">🛡️ Admin</option>
                      <option value="faculty">👨‍🏫 Faculty</option>
                      <option value="student">🎓 Student</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Security PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g., 5555"
                      value={newUser.pin}
                      onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Dean / Timetable Member"
                    value={newUser.designation}
                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-600" />
                  Edit User Account ({editingUser.name})
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="super_admin">👑 Super Admin</option>
                      <option value="admin">🛡️ Admin</option>
                      <option value="faculty">👨‍🏫 Faculty</option>
                      <option value="student">🎓 Student</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Security PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editingUser.pin || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Designation / Title</label>
                  <input
                    type="text"
                    value={editingUser.designation || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* University Master Factory Reset Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-slate-950">Confirm University Factory Reset</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                This operation will clear all {entries.length} scheduled periods across all batches, reset faculty workload assignments, and record a critical audit log.
              </p>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">
                  Type <span className="font-mono text-rose-600 font-black">RESET-UNIVERSITY</span> to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  placeholder="RESET-UNIVERSITY"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-center text-xs tracking-wider"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setResetConfirmInput('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={resetConfirmInput !== 'RESET-UNIVERSITY'}
                  onClick={() => {
                    onUpdateEntries([]);
                    setIsResetModalOpen(false);
                    setResetConfirmInput('');
                    const updatedLogs = recordAuditLog(
                      'Executed University Factory Reset',
                      currentUser,
                      'Purged all scheduled slots across all campus sections.',
                      'system',
                      'critical'
                    );
                    onUpdateAuditLogs(updatedLogs);
                    onShowToast('warning', 'University Reset', 'All scheduled timetable slots were wiped across the university.');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    resetConfirmInput === 'RESET-UNIVERSITY'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Full Factory Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
