import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Lock, 
  Check, 
  ArrowRight, 
  KeyRound, 
  Sparkles,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  userAccounts: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  onLogout?: () => void;
}

export default function RoleSwitchModal({
  isOpen,
  onClose,
  currentUser,
  userAccounts,
  onSelectUser,
  onShowToast,
  onLogout,
}: RoleSwitchModalProps) {
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectAccount = (account: UserAccount) => {
    setSelectedAccount(account);
    setPinError('');
    setEnteredPin('');
    // If student or faculty with no pin, switch instantly
    if (account.role === 'student' || account.role === 'faculty' || !account.pin) {
      onSelectUser(account);
      onShowToast('success', 'Switched Profile', `Logged in as ${account.name} (${account.role.replace('_', ' ').toUpperCase()}).`);
      onClose();
    }
  };

  const handleVerifyPinAndSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    if (selectedAccount.pin && enteredPin !== selectedAccount.pin) {
      setPinError(`Incorrect Security PIN. (Hint: Default PIN is ${selectedAccount.pin})`);
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSelectUser(selectedAccount);
      onShowToast('success', 'Elevated Access Granted', `Authenticated as ${selectedAccount.name} (${selectedAccount.role.replace('_', ' ').toUpperCase()}).`);
      onClose();
    }, 200);
  };

  const handleQuickBypass = () => {
    if (!selectedAccount) return;
    onSelectUser(selectedAccount);
    onShowToast('info', 'Demo Login', `Switched to ${selectedAccount.name} (${selectedAccount.role.replace('_', ' ').toUpperCase()}).`);
    onClose();
  };

  const roleMeta: Record<UserRole, { label: string; icon: any; color: string; bg: string; border: string; desc: string }> = {
    super_admin: {
      label: 'Super Admin (Dean / Director)',
      icon: Crown,
      color: 'text-[#D4A72C]',
      bg: 'bg-amber-50 text-[#92400E] border border-amber-200',
      border: 'border-amber-300',
      desc: 'Full Institutional Governance, User & Admin Access Management, System Policies, Master Database Backups, Freeze Controls, and Audit Trail.'
    },
    admin: {
      label: 'Admin (Timetable Convener / HOD)',
      icon: ShieldCheck,
      color: 'text-[#3B82F6]',
      bg: 'bg-blue-50 text-[#1D4ED8] border border-blue-200',
      border: 'border-blue-300',
      desc: 'CSP Auto Timetable Solver, Drag-and-Drop Slot Editing, Curriculum & Syllabus Management, Faculty & Classroom Directories, Analytics.'
    },
    faculty: {
      label: 'Faculty (Lecturer / Professor)',
      icon: Users,
      color: 'text-[#10B981]',
      bg: 'bg-emerald-50 text-[#047857] border border-emerald-200',
      border: 'border-emerald-300',
      desc: 'Personal Teaching Schedule, Classroom Allocations, Workload Overview, Syllabus Catalog, and Academic Regulations.'
    },
    student: {
      label: 'Student (Class Rep / Learner)',
      icon: GraduationCap,
      color: 'text-[#8B5CF6]',
      bg: 'bg-purple-50 text-[#6D28D9] border border-purple-200',
      border: 'border-purple-300',
      desc: 'Classroom Timetable Viewing, High-Resolution PDF & Excel Print Exports, Subject Catalog, Room Finder.'
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] text-[#0F172A]"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#F59E0B] via-[#D4A72C] to-[#B45309] rounded-2xl shadow-md text-white">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight font-cinzel-title text-[#0F172A]">TimePro Role & Profile Switcher</h2>
              <p className="text-xs text-[#64748B]">Switch role or test multi-tier RBAC access levels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* User Account Selection Grid */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-[#64748B] flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#4F46E5]" />
              Select Profile / Role Persona
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {userAccounts.map((acc) => {
                const meta = roleMeta[acc.role] || roleMeta.student;
                const Icon = meta.icon;
                const isCurrent = currentUser.id === acc.id;
                const isSelected = selectedAccount?.id === acc.id;

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-400 shadow-sm'
                        : isSelected
                        ? 'border-indigo-400 bg-indigo-50/70 ring-1 ring-indigo-400 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${meta.bg}`}>
                          <Icon className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-[#0F172A] leading-snug">{acc.name}</h4>
                          <p className="text-[11px] text-[#64748B] font-medium">{acc.designation || acc.department}</p>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4A72C] text-white shadow-2xs">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px]">
                      <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-md ${
                        acc.role === 'super_admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : acc.role === 'admin'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : acc.role === 'faculty'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}>
                        {acc.role.replace('_', ' ')}
                      </span>
                      {acc.pin && (
                        <span className="text-[#64748B] flex items-center gap-1 font-mono text-[10px]">
                          <KeyRound className="w-3 h-3 text-amber-500" />
                          PIN Protected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIN Verification Section when Super Admin or Admin is selected */}
          {selectedAccount && selectedAccount.pin && selectedAccount.id !== currentUser.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-50 text-[#0F172A] p-5 rounded-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-[#92400E] rounded-lg border border-amber-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0F172A]">
                      Security Verification for {selectedAccount.name}
                    </h4>
                    <p className="text-[11px] text-[#64748B]">
                      Enter the security PIN to activate {selectedAccount.role.replace('_', ' ').toUpperCase()} privileges
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold bg-white text-[#92400E] px-2.5 py-1 rounded-lg border border-amber-200">
                  Default PIN: {selectedAccount.pin}
                </span>
              </div>

              <form onSubmit={handleVerifyPinAndSwitch} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={8}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder={`Enter PIN (${selectedAccount.pin})`}
                    className="flex-1 bg-white border border-slate-300 text-[#0F172A] font-mono font-bold text-center tracking-widest text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="bg-[#D4A72C] hover:bg-[#B88E1F] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Authorize</span>
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs text-[#DC2626] flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {pinError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-[#64748B]">Pair programming demo testing:</p>
                  <button
                    type="button"
                    onClick={handleQuickBypass}
                    className="text-[11px] font-bold text-[#D4A72C] hover:text-[#B45309] underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Instant Demo Login (Bypass PIN)
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Role Capabilities Reference Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-black text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
              Role Privilege Matrix
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <span className="font-black text-[#92400E] block mb-0.5">👑 Super Admin</span>
                <span className="text-[#64748B] text-[10px] leading-tight block">
                  Campus Freeze, User Roles, AICTE Policies, Master Raw DB Backup/Restore, System Logs.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-2xs">
                <span className="font-black text-[#1E40AF] block mb-0.5">🛡️ Admin</span>
                <span className="text-[#64748B] text-[10px] leading-tight block">
                  CSP Solver, Slot Editing, Batch Promotion, Curriculum, Faculty Load, Excel/PDF.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="font-black text-[#065F46] block mb-0.5">👨‍🏫 Faculty</span>
                <span className="text-[#64748B] text-[10px] leading-tight block">
                  Personal Weekly Schedule, Room Allocations, Syllabus Catalog, Print Personal PDF.
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-purple-200 shadow-2xs">
                <span className="font-black text-[#5B21B6] block mb-0.5">🎓 Student</span>
                <span className="text-[#64748B] text-[10px] leading-tight block">
                  Class Timetable Viewer, Semester Selector, Syllabus Catalog, Print Section Schedule.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {onLogout ? (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#DC2626] border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Log out and return to Gateway Sign In"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Session</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
