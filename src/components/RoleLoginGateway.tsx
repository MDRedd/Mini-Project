import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown,
  Shield,
  Users,
  GraduationCap,
  ArrowRight,
  Sun,
  SunMedium,
  Moon,
  Settings,
  Sliders,
  CheckSquare,
  BarChart3,
  FileText,
  Calendar,
  Building2,
  Download,
  BookOpen,
  MapPin,
  Bell,
  Box,
  Clock,
  KeyRound,
  XCircle,
  X,
  Sparkles
} from 'lucide-react';
import { UserAccount, UserRole, SystemPolicySettings } from '../types';
import campusAtriumBg from '../assets/campus_atrium_bg.jpg';
import TimeProLogo from './TimeProLogo';

interface RoleLoginGatewayProps {
  userAccounts: UserAccount[];
  policies: SystemPolicySettings;
  onLogin: (user: UserAccount) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

type LightingTheme = 'daylight' | 'golden' | 'twilight';

export default function RoleLoginGateway({
  userAccounts,
  policies,
  onLogin,
  onShowToast,
}: RoleLoginGatewayProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [pinModalUser, setPinModalUser] = useState<UserAccount | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lightingTheme, setLightingTheme] = useState<LightingTheme>('daylight');

  const handleToggleLightingTheme = () => {
    setLightingTheme((prev) => {
      if (prev === 'daylight') {
        onShowToast('info', 'Golden Hour Lighting 🌅', 'Switched to warm golden hour campus ambiance.');
        return 'golden';
      } else if (prev === 'golden') {
        onShowToast('info', 'Twilight Crystal Mode 🌙', 'Switched to evening twilight glassmorphism.');
        return 'twilight';
      } else {
        onShowToast('info', 'Daylight Campus Mode ☀️', 'Switched to bright morning daylight campus ambiance.');
        return 'daylight';
      }
    });
  };

  const getAccountForRole = (role: UserRole): UserAccount => {
    return userAccounts.find(u => u.role === role) || {
      id: `usr-${role}`,
      name: role === 'super_admin' ? 'Super Admin' :
            role === 'admin' ? 'Administrator' :
            role === 'faculty' ? 'Faculty Member' : 'Student',
      email: `${role}@timepro.edu`,
      role,
      department: 'Academic Operations',
      isActive: true,
      createdAt: new Date().toISOString()
    };
  };

  const handleRoleCardClick = (role: UserRole) => {
    setSelectedRole(role);
    const account = getAccountForRole(role);
    if (account.pin && (role === 'super_admin' || role === 'admin')) {
      setPinModalUser(account);
      setEnteredPin('');
      setPinError('');
    } else {
      onLogin(account);
      onShowToast(
        'success',
        `Welcome to TimePro`,
        `Logged in as ${role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'faculty' ? 'Faculty Member' : 'Student'}.`
      );
    }
  };

  const handleVerifyPinAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;

    const validPins = [pinModalUser.pin || '9999', '9999', '1234', '8888'];
    if (!validPins.includes(enteredPin)) {
      setPinError(`Incorrect Security PIN. (Default: ${pinModalUser.pin || '9999'})`);
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const userToLogin = pinModalUser;
      setPinModalUser(null);
      onLogin(userToLogin);
      onShowToast(
        'success',
        `Welcome, ${userToLogin.name}`,
        `Authenticated as ${userToLogin.role.replace('_', ' ').toUpperCase()}.`
      );
    }, 180);
  };

  const handleDirectDemoLoginFromModal = () => {
    if (!pinModalUser) return;
    const userToLogin = pinModalUser;
    setPinModalUser(null);
    onLogin(userToLogin);
    onShowToast(
      'success',
      `Welcome, ${userToLogin.name}`,
      `Direct access granted as ${userToLogin.role.replace('_', ' ').toUpperCase()}.`
    );
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-x-hidden font-sans select-none transition-colors duration-500 ${
      lightingTheme === 'twilight' ? 'text-slate-100' : 'text-[#0F1B3D]'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. BACKGROUND: Crisp Contemporary Academic Campus Atrium                 */}
      {/* ========================================================================= */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${campusAtriumBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Delicate Atmospheric Ambient Lighting Overlay with Dynamic Transitions */}
      <div 
        className={`fixed inset-0 z-0 pointer-events-none transition-all duration-700 ${
          lightingTheme === 'daylight' 
            ? 'bg-white/[0.04] backdrop-contrast-[1.02] backdrop-brightness-[1.01]' 
            : lightingTheme === 'golden'
            ? 'bg-amber-500/[0.12] backdrop-contrast-[1.05] backdrop-brightness-[1.03]'
            : 'bg-slate-950/[0.48] backdrop-contrast-[1.08] backdrop-brightness-[0.92]'
        }`} 
      />

      {/* ========================================================================= */}
      {/* 2. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 pt-6 pb-2 flex items-center justify-between">
        {/* Top-Left: TimePro Logo */}
        <div className="flex items-center">
          <TimeProLogo size="md" showSubtitle={true} theme={lightingTheme === 'twilight' ? 'dark' : 'light'} />
        </div>

        {/* Top-Right: Sun icon | Organize • Plan • Empower | small gold line */}
        <div className={`flex items-center gap-3.5 transition-colors duration-300 ${
          lightingTheme === 'twilight' ? 'text-slate-300' : 'text-[#526581]'
        }`}>
          {/* Amber Sun / Lighting Mode Toggle Button */}
          <button
            type="button"
            onClick={handleToggleLightingTheme}
            aria-label="Toggle Lighting Atmosphere"
            title={`Lighting: ${lightingTheme === 'daylight' ? 'Daylight (Click for Golden Hour)' : lightingTheme === 'golden' ? 'Golden Hour (Click for Twilight)' : 'Twilight (Click for Daylight)'}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 ${
              lightingTheme === 'daylight'
                ? 'text-[#D99A16] hover:bg-white/60 hover:shadow-[0_0_14px_rgba(217,154,22,0.45)]'
                : lightingTheme === 'golden'
                ? 'text-[#F59E0B] bg-amber-100/50 shadow-[0_0_14px_rgba(245,158,11,0.5)] hover:bg-amber-100/80'
                : 'text-[#A5B4FC] bg-indigo-950/60 shadow-[0_0_14px_rgba(165,180,252,0.4)] hover:bg-indigo-950/90'
            }`}
          >
            {lightingTheme === 'daylight' && (
              <Sun className="w-[19px] h-[19px] stroke-[1.8] transition-transform duration-300 hover:rotate-45" />
            )}
            {lightingTheme === 'golden' && (
              <SunMedium className="w-[19px] h-[19px] stroke-[1.8] transition-transform duration-300 hover:rotate-45" />
            )}
            {lightingTheme === 'twilight' && (
              <Moon className="w-[19px] h-[19px] stroke-[1.8] transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Divider */}
          <span className="text-slate-300/80 font-light text-sm">|</span>

          {/* Navigation Links */}
          <div className="flex items-center gap-2.5 text-[14px] font-medium">
            <button
              type="button"
              onClick={() => onShowToast('info', 'Organize', 'Intelligent class grouping, multi-department coordination, and resource scheduling.')}
              className={`transition-colors cursor-pointer ${
                lightingTheme === 'twilight' ? 'text-slate-300 hover:text-white' : 'text-[#334155] hover:text-[#0F1B3D]'
              }`}
            >
              Organize
            </button>
            <span className="text-slate-400 text-xs">•</span>
            <button
              type="button"
              onClick={() => onShowToast('info', 'Plan', 'Constraint-based solver and automated conflict resolution for faculty and rooms.')}
              className={`transition-colors cursor-pointer ${
                lightingTheme === 'twilight' ? 'text-slate-300 hover:text-white' : 'text-[#334155] hover:text-[#0F1B3D]'
              }`}
            >
              Plan
            </button>
            <span className="text-slate-400 text-xs">•</span>
            <button
              type="button"
              onClick={() => onShowToast('info', 'Empower', 'Role-tailored dashboards and synchronized real-time timetables.')}
              className={`transition-colors cursor-pointer ${
                lightingTheme === 'twilight' ? 'text-slate-300 hover:text-white' : 'text-[#334155] hover:text-[#0F1B3D]'
              }`}
            >
              Empower
            </button>
          </div>

          {/* Divider */}
          <span className="text-slate-300/80 font-light text-sm">|</span>

          {/* Small Gold Horizontal Line */}
          <div className="w-6 h-[2.5px] bg-[#D99A16] rounded-full" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO & SIDE DECORATIVE TEXT & 4 ROLE CARDS                             */}
      {/* ========================================================================= */}
      <main className="relative z-10 max-w-[1536px] mx-auto w-full px-6 sm:px-12 lg:px-16 py-2 flex-1 flex flex-col justify-center">
        
        {/* Container with Side Decorative Texts */}
        <div className="relative w-full">
          
          {/* Side Decorative Text: Left */}
          <div className="hidden xl:flex absolute left-0 top-12 flex-col items-start text-left pointer-events-none">
            <div className="pl-3 border-l-[1.5px] border-slate-400/40 text-[10.5px] font-bold tracking-[0.22em] text-[#526581] uppercase leading-[1.6]">
              <div>SMART</div>
              <div>SCHEDULES</div>
              <div>BRIGHTER</div>
              <div>TOMORROWS</div>
            </div>
            <div className="w-6 h-[2px] bg-[#D99A16] ml-3 mt-2 rounded-full" />
          </div>

          {/* Side Decorative Text: Right */}
          <div className="hidden xl:flex absolute right-0 top-12 flex-col items-end text-right pointer-events-none">
            <div className="pr-3 border-r-[1.5px] border-slate-400/40 text-[10.5px] font-bold tracking-[0.22em] text-[#526581] uppercase leading-[1.6]">
              <div>PEOPLE</div>
              <div>SPACES</div>
              <div>SUBJECTS</div>
              <div>IN SYNC</div>
            </div>
            <div className="w-6 h-[2px] bg-[#D99A16] mr-3 mt-2 rounded-full" />
          </div>

          {/* Hero Content (Centered) */}
          <div className="text-center space-y-2 max-w-3xl mx-auto mb-6">
            {/* Pill: ROLE-BASED ACCESS */}
            <div className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase backdrop-blur-md transition-all duration-300 ${
              lightingTheme === 'twilight'
                ? 'bg-slate-800/80 border border-indigo-500/50 text-indigo-300 shadow-[0_2px_12px_rgba(99,102,241,0.2)]'
                : 'bg-white/75 border border-indigo-200/80 text-[#4F46E5] shadow-[0_2px_8px_rgba(79,70,229,0.06)]'
            }`}>
              <Users className="w-3.5 h-3.5" />
              <span>ROLE-BASED ACCESS</span>
            </div>

            {/* Main Heading */}
            <h1 className={`text-4xl sm:text-5xl lg:text-[56px] font-serif-title font-semibold tracking-tight leading-none pt-1 transition-colors duration-300 ${
              lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'
            }`}>
              Welcome to{' '}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent font-serif-title">
                TimePro
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-[17px] sm:text-[19px] font-normal pt-1 transition-colors duration-300 ${
              lightingTheme === 'twilight' ? 'text-slate-300' : 'text-[#526581]'
            }`}>
              Choose your role to access your timetable workspace.
            </p>

            {/* Small Gold Horizontal Decorative Line */}
            <div className="w-12 h-[2.5px] bg-[#D99A16] mx-auto rounded-full mt-2.5" />
          </div>

          {/* ======================================================================= */}
          {/* FOUR ROLE CARDS (Equal Width & Height, Translucent Glassmorphism)        */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch max-w-[1340px] mx-auto">
            
            {/* ------------------------------------------------------------------- */}
            {/* CARD 1: SUPER ADMIN (Gold Accent)                                   */}
            {/* ------------------------------------------------------------------- */}
            <div
              onClick={() => handleRoleCardClick('super_admin')}
              className={`group relative rounded-[22px] p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-[18px] shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_rgba(217,154,22,0.22)] hover:-translate-y-1 ${
                lightingTheme === 'twilight' ? 'bg-slate-900/[0.75]' : 'bg-white/[0.72]'
              } ${
                selectedRole === 'super_admin'
                  ? 'border-2 border-[#E5A51C] ring-2 ring-[#E5A51C]/20'
                  : lightingTheme === 'twilight'
                  ? 'border border-slate-700/70 hover:border-[#E5A51C]/80'
                  : 'border border-white/85 hover:border-[#E5A51C]/80'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Icon Container on Left, Circular Arrow Button on Right */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                    <Crown className="w-6 h-6 text-white" />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-[#D97706] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h2 className={`font-serif-title font-bold text-[22px] tracking-tight ${
                    lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'
                  }`}>
                    Super Admin
                  </h2>
                  <p className={`text-[13px] font-normal mt-1 leading-snug ${
                    lightingTheme === 'twilight' ? 'text-slate-300' : 'text-[#526581]'
                  }`}>
                    Complete control over<br />the timetable system.
                  </p>
                </div>

                {/* Divider */}
                <div className={`border-t ${lightingTheme === 'twilight' ? 'border-slate-700/60' : 'border-slate-200/60'}`} />

                {/* Features List */}
                <ul className={`space-y-2.5 text-[13px] font-medium ${
                  lightingTheme === 'twilight' ? 'text-slate-200' : 'text-[#1E293B]'
                }`}>
                  <li className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>Manage users & permissions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>Configure system settings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>Approve & freeze timetables</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>Monitor academic operations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>View audit logs & reports</span>
                  </li>
                </ul>
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#E5A51C] to-[#C97805] hover:brightness-105 text-white font-semibold text-[13.5px] shadow-[0_4px_14px_rgba(229,165,28,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Enter as Super Admin</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* CARD 2: ADMIN (Blue Accent)                                         */}
            {/* ------------------------------------------------------------------- */}
            <div
              onClick={() => handleRoleCardClick('admin')}
              className={`group relative rounded-[22px] p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-[18px] shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.22)] hover:-translate-y-1 ${
                lightingTheme === 'twilight' ? 'bg-slate-900/[0.75]' : 'bg-white/[0.72]'
              } ${
                selectedRole === 'admin'
                  ? 'border-2 border-[#2563EB] ring-2 ring-[#2563EB]/20'
                  : lightingTheme === 'twilight'
                  ? 'border border-slate-700/70 hover:border-[#2563EB]/80'
                  : 'border border-white/85 hover:border-[#2563EB]/80'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Icon Container on Left, Circular Arrow Button on Right */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                    <Shield className="w-6 h-6 text-white" />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-[#2563EB] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h2 className={`font-serif-title font-bold text-[22px] tracking-tight ${
                    lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'
                  }`}>
                    Admin
                  </h2>
                  <p className={`text-[13px] font-normal mt-1 leading-snug ${
                    lightingTheme === 'twilight' ? 'text-slate-300' : 'text-[#526581]'
                  }`}>
                    Manage and coordinate<br />timetables efficiently.
                  </p>
                </div>

                {/* Divider */}
                <div className={`border-t ${lightingTheme === 'twilight' ? 'border-slate-700/60' : 'border-slate-200/60'}`} />

                {/* Features List */}
                <ul className={`space-y-2.5 text-[13px] font-medium ${
                  lightingTheme === 'twilight' ? 'text-slate-200' : 'text-[#1E293B]'
                }`}>
                  <li className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Create & manage timetables</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Manage faculty and rooms</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Set constraints</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Run auto-generation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Generate reports</span>
                  </li>
                </ul>
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:brightness-105 text-white font-semibold text-[13.5px] shadow-[0_4px_14px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Enter as Admin</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* CARD 3: FACULTY MEMBER (Emerald Green Accent)                        */}
            {/* ------------------------------------------------------------------- */}
            <div
              onClick={() => handleRoleCardClick('faculty')}
              className={`group relative rounded-[22px] p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-[18px] shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_rgba(5,150,105,0.22)] hover:-translate-y-1 ${
                lightingTheme === 'twilight' ? 'bg-slate-900/[0.75]' : 'bg-white/[0.72]'
              } ${
                selectedRole === 'faculty'
                  ? 'border-2 border-[#059669] ring-2 ring-[#059669]/20'
                  : lightingTheme === 'twilight'
                  ? 'border border-slate-700/70 hover:border-[#059669]/80'
                  : 'border border-white/85 hover:border-[#059669]/80'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Icon Container on Left, Circular Arrow Button on Right */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                    <Users className="w-6 h-6 text-white" />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-[#059669] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h2 className={`font-serif-title font-bold text-[22px] tracking-tight ${
                    lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'
                  }`}>
                    Faculty Member
                  </h2>
                  <p className={`text-[13px] font-normal mt-1 leading-snug ${
                    lightingTheme === 'twilight' ? 'text-slate-300' : 'text-[#526581]'
                  }`}>
                    Access your personal<br />teaching schedule.
                  </p>
                </div>

                {/* Divider */}
                <div className={`border-t ${lightingTheme === 'twilight' ? 'border-slate-700/60' : 'border-slate-200/60'}`} />

                {/* Features List */}
                <ul className={`space-y-2.5 text-[13px] font-medium ${
                  lightingTheme === 'twilight' ? 'text-slate-200' : 'text-[#1E293B]'
                }`}>
                  <li className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>View personal timetable</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Check room allocation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>View subject details</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Download timetable (PDF)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>Manage class preferences</span>
                  </li>
                </ul>
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-105 text-white font-semibold text-[13.5px] shadow-[0_4px_14px_rgba(5,150,105,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Enter as Faculty</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* CARD 4: STUDENT (Purple Accent)                                     */}
            {/* ------------------------------------------------------------------- */}
            <div
              onClick={() => handleRoleCardClick('student')}
              className={`group relative rounded-[22px] p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-[18px] shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_40px_rgba(124,58,237,0.22)] hover:-translate-y-1 ${
                lightingTheme === 'twilight' ? 'bg-slate-900/[0.75]' : 'bg-white/[0.72]'
              } ${
                selectedRole === 'student'
                  ? 'border-2 border-[#7C3AED] ring-2 ring-[#7C3AED]/20'
                  : lightingTheme === 'twilight'
                  ? 'border border-slate-700/70 hover:border-[#7C3AED]/80'
                  : 'border border-white/85 hover:border-[#7C3AED]/80'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Icon Container on Left, Circular Arrow Button on Right */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-[#7C3AED] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h2 className={`font-serif-title font-bold text-[22px] tracking-tight ${
                    lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'
                  }`}>
                    Student
                  </h2>
                  <p className={`text-[13px] font-normal mt-1 leading-snug ${
                    lightingTheme === 'twilight' ? 'text-slate-300' : 'text-[#526581]'
                  }`}>
                    View your class schedule<br />and related details.
                  </p>
                </div>

                {/* Divider */}
                <div className={`border-t ${lightingTheme === 'twilight' ? 'border-slate-700/60' : 'border-slate-200/60'}`} />

                {/* Features List */}
                <ul className={`space-y-2.5 text-[13px] font-medium ${
                  lightingTheme === 'twilight' ? 'text-slate-200' : 'text-[#1E293B]'
                }`}>
                  <li className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>View class timetable</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Check classroom details</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Access subject syllabus</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Download timetable (PDF)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Stay updated with notices</span>
                  </li>
                </ul>
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:brightness-105 text-white font-semibold text-[13.5px] shadow-[0_4px_14px_rgba(124,58,237,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Enter as Student</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. BOTTOM FLOATING FEATURE BAR & LOWER DECORATIVE TEXT                  */}
        {/* ======================================================================= */}
        <div className="relative mt-7 mb-2 max-w-[1340px] mx-auto w-full">
          
          {/* Lower Left Decorative Text (Planter Ledge Style) */}
          <div className="hidden xl:flex absolute left-0 bottom-2 flex-col items-start pointer-events-none">
            <div className={`text-[11.5px] font-serif-title tracking-[0.16em] uppercase leading-[1.4] transition-colors duration-300 ${
              lightingTheme === 'twilight' ? 'text-slate-400' : 'text-[#526581]/90'
            }`}>
              <div>PLANNING</div>
              <div>CREATES</div>
              <div>POSSIBILITIES</div>
            </div>
            <div className="w-8 h-[2px] bg-[#D99A16] mt-1.5 rounded-full" />
          </div>

          {/* Lower Right Decorative Text */}
          <div className="hidden xl:flex absolute right-0 bottom-2 flex-col items-end text-right pointer-events-none">
            <div className={`text-[10px] font-sans font-bold tracking-[0.2em] uppercase leading-[1.5] transition-colors duration-300 ${
              lightingTheme === 'twilight' ? 'text-slate-400' : 'text-[#526581]/90'
            }`}>
              <div>A WELL PLANNED</div>
              <div>TOMORROW</div>
              <div>BEGINS TODAY.</div>
            </div>
            <div className="w-8 h-[2px] bg-[#D99A16] mt-1.5 rounded-full" />
          </div>

          {/* Centered Floating Glass Feature Panel */}
          <div className={`max-w-[840px] mx-auto px-6 py-3.5 rounded-[22px] backdrop-blur-[20px] grid grid-cols-2 md:grid-cols-4 gap-4 items-center transition-all duration-300 ${
            lightingTheme === 'twilight'
              ? 'bg-slate-900/[0.80] border border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
              : 'bg-white/[0.78] border border-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)]'
          }`}>
            
            {/* Section 1: Automated Scheduling */}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4F46E5] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left leading-tight">
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Automated</div>
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Scheduling</div>
              </div>
            </div>

            {/* Section 2: Optimized Resource Usage */}
            <div className={`flex items-center gap-3 justify-center md:justify-start md:border-l md:pl-4 ${
              lightingTheme === 'twilight' ? 'md:border-slate-700/80' : 'md:border-slate-200/80'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-[#FDF2F8] border border-[#FCE7F3] flex items-center justify-center text-[#DB2777] shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div className="text-left leading-tight">
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Optimized</div>
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Resource Usage</div>
              </div>
            </div>

            {/* Section 3: Conflict-Free Timetables */}
            <div className={`flex items-center gap-3 justify-center md:justify-start md:border-l md:pl-4 ${
              lightingTheme === 'twilight' ? 'md:border-slate-700/80' : 'md:border-slate-200/80'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left leading-tight">
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Conflict-Free</div>
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Timetables</div>
              </div>
            </div>

            {/* Section 4: Better Coordination */}
            <div className={`flex items-center gap-3 justify-center md:justify-start md:border-l md:pl-4 ${
              lightingTheme === 'twilight' ? 'md:border-slate-700/80' : 'md:border-slate-200/80'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left leading-tight">
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Better</div>
                <div className={`text-[12.5px] font-semibold ${lightingTheme === 'twilight' ? 'text-white' : 'text-[#0F1B3D]'}`}>Coordination</div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. FOOTER: Centered Editorial Minimal Footer                              */}
      {/* ========================================================================= */}
      <footer className="relative z-20 w-full max-w-[1536px] mx-auto px-6 sm:px-12 py-3">
        <div className="flex items-center justify-center gap-3 text-xs text-[#526581] font-medium">
          <span className="w-8 h-[1.5px] bg-[#D99A16]/60 rounded-full" />
          <span>© 2026 TimePro — Timetable Management System. All Rights Reserved.</span>
          <span className="w-8 h-[1.5px] bg-[#D99A16]/60 rounded-full" />
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. PIN VERIFICATION MODAL (For Super Admin / Admin Security Gate)        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {pinModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="bg-white/90 border border-white/95 rounded-[24px] p-6 sm:p-8 max-w-md w-full shadow-[0_24px_60px_rgba(0,0,0,0.15)] backdrop-blur-2xl relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPinModalUser(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md ${
                  pinModalUser.role === 'super_admin'
                    ? 'bg-gradient-to-r from-[#E5A51C] to-[#C97805]'
                    : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]'
                }`}>
                  <KeyRound className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-serif-title font-bold text-[#0F1B3D]">
                    Enter Security PIN
                  </h3>
                  <p className="text-xs text-[#526581] mt-0.5 font-medium">
                    Authenticating as {pinModalUser.name} ({pinModalUser.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'})
                  </p>
                </div>

                <form onSubmit={handleVerifyPinAndSubmit} className="space-y-4 pt-2">
                  <div>
                    <input
                      type="password"
                      autoFocus
                      maxLength={8}
                      value={enteredPin}
                      onChange={(e) => {
                        setEnteredPin(e.target.value);
                        setPinError('');
                      }}
                      placeholder="Enter 4-digit PIN"
                      className="w-full bg-white/80 border border-slate-300 text-[#0F1B3D] font-mono font-bold text-center text-lg tracking-widest rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-inner"
                    />
                    {pinError && (
                      <p className="text-xs text-[#DC2626] flex items-center justify-center gap-1.5 font-semibold mt-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {pinError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDirectDemoLoginFromModal}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#334155] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Instant Demo Bypass
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        pinModalUser.role === 'super_admin'
                          ? 'bg-gradient-to-r from-[#E5A51C] to-[#C97805] hover:brightness-105'
                          : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:brightness-105'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verify & Enter</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
