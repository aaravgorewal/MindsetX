
import React, { useState } from 'react';
import { User, MapPin, Calendar, Award, Trophy, ChevronLeft, Star, Clock, Shield, Zap, Lock, BookOpen, BarChart2, Activity, ClipboardList, Edit2, GraduationCap, Droplet } from 'lucide-react';

// --- MOCK DATA ---
const AVATARS = [
    { id: '1', name: 'Rookie', src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', locked: false, level: 1 },
    { id: '2', name: 'Scholar', src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', locked: false, level: 1 },
    { id: '3', name: 'Zen Master', src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yogi', locked: true, level: 5 },
    { id: '4', name: 'Warrior', src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan', locked: true, level: 10 },
    { id: '5', name: 'Cyber Sage', src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tech', locked: true, level: 20 },
    { id: '6', name: 'Guru', src: 'https://api.dicebear.com/7.x/notionists/svg?seed=Guru', locked: true, level: 50 },
];

const BOOKINGS = [
    { id: '101', specialist: 'Dr. Ananya Sharma', type: 'Video Call', date: '2024-05-20', time: '10:00 AM', status: 'Completed', score: 450 },
    { id: '102', specialist: 'Campus Counselor (Room 202)', type: 'In-Person', date: '2024-05-22', time: '02:00 PM', status: 'Upcoming', score: 0 },
    { id: '103', specialist: 'MindSet AI Session', type: 'AI Chat', date: '2024-05-18', time: '11:30 PM', status: 'Completed', score: 120 },
];

const PAST_ASSESSMENTS = [
    { id: 'a1', date: '25 May 2024', score: 8, total: 27, severity: 'Mild Stress', trend: 'down' },
    { id: 'a2', date: '10 May 2024', score: 12, total: 27, severity: 'Moderate', trend: 'up' },
    { id: 'a3', date: '20 Apr 2024', score: 5, total: 27, severity: 'Minimal', trend: 'stable' },
];

const CAMPUS_COUNSELORS = [
    { id: 'c1', name: 'Prof. Rao (Psychology)', location: 'Block A, Room 202', status: 'Available', specialty: 'Academic Stress' },
    { id: 'c2', name: 'Mrs. Deshmukh', location: 'Student Center, 1st Floor', status: 'In Session', specialty: 'Anxiety & Trauma' },
    { id: 'c3', name: 'Peer Support Group', location: 'Library Conf Room', status: 'Opens at 4PM', specialty: 'Group Therapy' }
];

interface UserProfileProps {
    onBack: () => void;
    currentAvatar: string;
    onUpdateAvatar: (url: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack, currentAvatar, onUpdateAvatar }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'AVATARS' | 'CAMPUS'>('DASHBOARD');
    const [userLevel, setUserLevel] = useState(3);
    const [userPoints, setUserPoints] = useState(3450);

    const levelProgress = (userPoints % 1000) / 10; // Simple logic: 1000 pts per level

    const DashboardView = () => (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Gamified Header */}
            <div className="bg-white/5 rounded-3xl p-6 shadow-lg border border-white/10 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-saffron-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => setActiveTab('AVATARS')}>
                        <div className="w-24 h-24 rounded-full border-4 border-white/10 shadow-xl overflow-hidden bg-charcoal ring-2 ring-white/5">
                            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-charcoal shadow-sm">
                            <Zap size={14} fill="white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">QuietStorm_99</h2>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 bg-saffron-500/20 text-saffron-400 text-xs font-bold rounded-full border border-saffron-500/30 shadow-sm">Level {userLevel} Scholar</span>
                             <span className="text-xs text-gray-400">Member since 2023</span>
                        </div>
                        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner">
                            <div className="bg-gradient-to-r from-saffron-500 to-red-500 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${levelProgress}%` }}>
                                <div className="absolute top-0 right-0 w-2 h-full bg-white/50 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-bold">
                            <span>{userPoints} XP</span>
                            <span>Next Level: {(userLevel + 1) * 1000} XP</span>
                        </div>
                    </div>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-white font-bold text-xl">
                            <CheckCircleIcon /> 12
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sessions</p>
                    </div>
                    <div className="text-center border-l border-white/10">
                        <div className="flex items-center justify-center gap-1 text-white font-bold text-xl">
                            <Trophy size={18} className="text-saffron-500" /> 3
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Badges</p>
                    </div>
                    <div className="text-center border-l border-white/10">
                        <div className="flex items-center justify-center gap-1 text-white font-bold text-xl">
                            <Star size={18} className="text-yellow-400" fill="#FACC15" /> 4.8
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Consistency</p>
                    </div>
                </div>
            </div>

            {/* Student Identity Card */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 shadow-sm relative overflow-hidden backdrop-blur-md">
                <div className="absolute right-0 top-0 p-4 opacity-5">
                    <GraduationCap size={100} className="text-white" />
                </div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <User size={18} className="text-teal-400" /> Student Identity
                    </h3>
                    <button className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1">
                        <Edit2 size={12} /> Edit
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm relative z-10">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Full Name</p>
                        <p className="font-bold text-white text-base">Rohan Das</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">University</p>
                        <p className="font-bold text-white">IIT Bombay</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Course & Year</p>
                        <p className="font-bold text-white">B.Tech CS (3rd Year)</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Blood Group</p>
                        <p className="font-bold text-white flex items-center gap-1">
                            <Droplet size={14} className="text-red-500 fill-red-500" /> O+
                        </p>
                    </div>
                </div>
            </div>

            {/* Assessment History */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ClipboardList className="text-purple-400" size={20} /> Wellness Check-ins
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {PAST_ASSESSMENTS.map((assessment) => (
                        <div key={assessment.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                                    assessment.score < 5 ? 'bg-green-600' : assessment.score < 10 ? 'bg-yellow-600' : 'bg-red-600'
                                }`}>
                                    {assessment.score}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{assessment.severity}</h4>
                                    <p className="text-xs text-gray-400">{assessment.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400">PHQ-9</span>
                                {assessment.trend === 'down' ? <Activity size={16} className="text-green-500" /> : <Activity size={16} className="text-red-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session History */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="text-teal-400" size={20} /> Booking History
                </h3>
                <div className="space-y-3">
                    {BOOKINGS.map(booking => (
                        <div key={booking.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                                    booking.type === 'AI Chat' ? 'bg-indigo-600' : booking.type === 'In-Person' ? 'bg-green-700' : 'bg-blue-600'
                                }`}>
                                    {booking.type === 'AI Chat' ? <Zap size={20} /> : booking.type === 'In-Person' ? <MapPin size={20} /> : <VideoIcon />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{booking.specialist}</h4>
                                    <p className="text-xs text-gray-400">{booking.date} • {booking.time}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    booking.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                    {booking.status}
                                </span>
                                {booking.score > 0 && (
                                    <p className="text-[10px] text-saffron-500 font-bold mt-1">+{booking.score} XP</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Analytics (Personal) */}
            <div className="bg-navy-900 border border-white/10 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <BarChart2 className="text-saffron-400" /> My Analytics
                    </h3>
                    <select className="bg-white/10 text-xs rounded-lg px-2 py-1 border border-white/20 text-white outline-none cursor-pointer hover:bg-white/20">
                        <option className="text-slate-800">Last 7 Days</option>
                        <option className="text-slate-800">Last Month</option>
                    </select>
                </div>
                
                <div className="h-32 flex items-end justify-between gap-2 mb-4 relative z-10">
                    {[30, 45, 60, 40, 70, 85, 65].map((h, i) => (
                        <div key={i} className="w-full bg-white/10 rounded-t-lg relative group hover:bg-white/20 transition-colors cursor-pointer">
                            <div 
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all duration-1000 group-hover:from-saffron-500 group-hover:to-saffron-400" 
                                style={{ height: `${h}%` }}
                            ></div>
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-navy-900 text-[10px] font-bold px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap z-20">
                                Mood Score: {h}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold relative z-10">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>
        </div>
    );

    const AvatarInventoryView = () => (
        <div className="animate-fade-in pb-20">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Trophy className="text-yellow-300" /> Avatar Inventory</h2>
                <p className="text-sm opacity-90">Unlock new personas as you level up!</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full border border-white/20">
                    <Zap size={16} className="text-yellow-300" fill="currentColor" /> {userPoints} Available XP
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {AVATARS.map((av) => (
                    <div 
                        key={av.id} 
                        onClick={() => {
                            if (!av.locked) {
                                onUpdateAvatar(av.src);
                            }
                        }}
                        className={`relative bg-white/5 rounded-2xl p-4 border shadow-sm transition-all duration-300 ${
                            av.locked ? 'opacity-70 grayscale cursor-not-allowed border-white/5' : 'hover:scale-105 cursor-pointer active:scale-95 hover:bg-white/10 hover:border-white/20'
                        } ${currentAvatar === av.src ? 'border-saffron-500 ring-4 ring-saffron-500/20' : 'border-white/5'}`}
                    >
                        <div className="aspect-square bg-charcoal rounded-xl mb-3 overflow-hidden border border-white/5">
                            <img src={av.src} alt={av.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm">{av.name}</h3>
                            {av.locked ? (
                                <div className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400 font-bold">
                                    <Lock size={10} /> Lvl {av.level}
                                </div>
                            ) : (
                                currentAvatar === av.src ? (
                                    <div className="bg-saffron-500 rounded-full p-1 shadow-sm">
                                        <CheckCircleIcon className="text-white w-3 h-3" />
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-400 font-bold">Select</div>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const CampusConnectView = () => (
        <div className="animate-fade-in h-full flex flex-col pb-20">
            <div className="bg-indiaGreen-600 text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <MapPin className="text-white" /> Campus Offline Support
                    </h2>
                    <p className="text-xs opacity-90">Find registered counselors on your college campus.</p>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white/5 rounded-2xl h-48 mb-6 relative overflow-hidden shadow-inner border border-white/10 group cursor-pointer">
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Campus_Map_Placeholder.png')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-charcoal/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 border border-white/20">
                        <MapPin size={16} className="text-red-500" /> Interactive Map (Click to Expand)
                    </div>
                </div>
                {/* Simulated Pins */}
                <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold animate-bounce delay-100">A</div>
                <div className="absolute bottom-1/3 right-1/3 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold animate-bounce delay-300">B</div>
            </div>

            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Available Personnel</h3>
            <div className="space-y-3">
                {CAMPUS_COUNSELORS.map((c) => (
                    <div key={c.id} className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm flex items-center justify-between transition-all hover:bg-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold border border-white/10">
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-white">{c.name}</h4>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <MapPin size={10} /> {c.location}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'Available' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {c.status}
                            </span>
                            <button className="block mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline">
                                Book Slot
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                <button className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors animate-pulse border-2 border-red-500">
                    <Shield size={18} /> Emergency Campus Security
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-charcoal relative pb-20">
            {/* Nav Header */}
            <div className="sticky top-0 bg-charcoal/80 backdrop-blur-md p-4 border-b border-white/10 z-20 flex justify-between items-center">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-white">My Profile</h1>
                <button className="p-2 hover:bg-white/10 rounded-full text-white">
                    <User size={24} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'DASHBOARD' && <DashboardView />}
                {activeTab === 'AVATARS' && <AvatarInventoryView />}
                {activeTab === 'CAMPUS' && <CampusConnectView />}
            </div>

            {/* Bottom Tab Bar for Profile */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-charcoal border border-white/20 rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl z-30">
                <button 
                    onClick={() => setActiveTab('DASHBOARD')} 
                    className={`transition-all ${activeTab === 'DASHBOARD' ? 'text-saffron-500 scale-125' : 'text-gray-400'}`}
                >
                    <User size={24} />
                </button>
                <button 
                    onClick={() => setActiveTab('AVATARS')} 
                    className={`transition-all ${activeTab === 'AVATARS' ? 'text-saffron-500 scale-125' : 'text-gray-400'}`}
                >
                    <Award size={24} />
                </button>
                <button 
                    onClick={() => setActiveTab('CAMPUS')} 
                    className={`transition-all ${activeTab === 'CAMPUS' ? 'text-saffron-500 scale-125' : 'text-gray-400'}`}
                >
                    <BookOpen size={24} />
                </button>
            </div>
        </div>
    );
};

// Icons helper
const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const CheckCircleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export default UserProfile;
