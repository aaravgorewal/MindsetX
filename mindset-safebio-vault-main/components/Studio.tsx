
import React, { useState, useEffect } from 'react';
import { Search, Heart, MessageCircle, Share2, Video, UserPlus, CheckCircle, ArrowLeft, TrendingUp, Users, DollarSign, Image as ImageIcon, UploadCloud, X, Award, ChevronRight, Eye, Settings, BarChart3, Wallet, Zap } from 'lucide-react';
import { Influencer, Reel } from '../types';

// --- MOCK DATA ---
const INFLUENCERS: Influencer[] = [
  {
    id: '1',
    name: 'Dr. Ananya Sharma',
    handle: '@dr_ananya_mind',
    avatar: 'https://i.pravatar.cc/150?u=1',
    specialty: 'Allopathy',
    bio: 'MBBS, MD Psychiatry. Demystifying Neurotransmitters & Meds. 🧠💊',
    followers: '125K',
    verified: true,
    hourlyRate: 1500
  },
  {
    id: '2',
    name: 'Vaidya Ravi Kumar',
    handle: '@ayur_ravi',
    avatar: 'https://i.pravatar.cc/150?u=2',
    specialty: 'Ayurveda',
    bio: 'Healing Vata/Pitta imbalances naturally. Ashwagandha expert. 🌿',
    followers: '89K',
    verified: true,
    hourlyRate: 800
  },
  {
    id: '3',
    name: 'Yogi Meera',
    handle: '@flow_with_meera',
    avatar: 'https://i.pravatar.cc/150?u=3',
    specialty: 'Yoga',
    bio: 'Pranayama for anxiety. 60s relief techniques. 🧘‍♀️✨',
    followers: '210K',
    verified: false,
    hourlyRate: 1200
  }
];

const REELS: Reel[] = [
  {
    id: '101',
    influencerId: '1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://picsum.photos/400/800?random=1',
    description: 'Serotonin vs Dopamine: Samjho difference kya hai! 🤔 #MentalHealth #MBBS',
    category: 'Allopathy',
    likes: 12400,
    comments: 342,
    isBookable: true
  },
  {
    id: '102',
    influencerId: '3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://picsum.photos/400/800?random=2',
    description: 'Panic Attack aa raha hai? Try this 4-7-8 breathing now. 🌬️ #Yoga #AnxietyRelief',
    category: 'Yoga',
    likes: 45000,
    comments: 1200,
    isBookable: true
  },
  {
    id: '103',
    influencerId: '2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://picsum.photos/400/800?random=3',
    description: 'Ashwagandha lene se pehle ye side effects jaan lo! ⚠️ #Ayurveda #Facts',
    category: 'Ayurveda',
    likes: 8900,
    comments: 150,
    isBookable: true
  }
];

const Studio: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'FEED' | 'SEARCH' | 'PROFILE' | 'DASHBOARD'>('FEED');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Allopathy' | 'Ayurveda' | 'Yoga'>('All');
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  
  // Dashboard & Creator State
  const [isCreator, setIsCreator] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'REEL' | 'IMAGE'>('REEL');
  const [dashboardTab, setDashboardTab] = useState<'INSIGHTS' | 'MONETIZATION' | 'CONTENT'>('INSIGHTS');
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
      name: '',
      handle: '',
      specialty: 'Allopathy',
      bio: ''
  });

  useEffect(() => {
    const creatorStatus = localStorage.getItem('mindset_creator_status');
    if (creatorStatus === 'active') {
        setIsCreator(true);
        const savedProfile = localStorage.getItem('mindset_creator_profile');
        if (savedProfile) {
            setRegForm(JSON.parse(savedProfile));
        }
    }
  }, []);

  const filteredReels = activeCategory === 'All' 
    ? REELS 
    : REELS.filter(r => r.category === activeCategory);

  const handleProfileClick = (id: string) => {
    const influencer = INFLUENCERS.find(i => i.id === id);
    if (influencer) {
      setSelectedInfluencer(influencer);
      setView('PROFILE');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
          localStorage.setItem('mindset_creator_status', 'active');
          localStorage.setItem('mindset_creator_profile', JSON.stringify(regForm));
          setIsCreator(true);
          setIsLoading(false);
      }, 1500);
  };

  const handleUpload = (e: React.FormEvent) => {
      e.preventDefault();
      setShowUploadModal(false);
      alert("Content Uploaded Successfully! It is being processed for the feed.");
  };

  const FeedView = () => (
    <div className="h-full relative bg-gray-50">
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-2 flex gap-3 overflow-x-auto no-scrollbar">
         {['All', 'Allopathy', 'Ayurveda', 'Yoga'].map(cat => (
             <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all border ${
                    activeCategory === cat 
                    ? 'bg-saffron-500 text-white border-saffron-600' 
                    : 'bg-white/80 backdrop-blur-md text-slate-700 border-white'
                }`}
             >
                 {cat}
             </button>
         ))}
      </div>
      <div className="h-[calc(100vh-180px)] overflow-y-scroll snap-y snap-mandatory no-scrollbar pb-24 rounded-3xl mx-2 mt-2">
         {filteredReels.map((reel) => {
             const influencer = INFLUENCERS.find(i => i.id === reel.influencerId);
             return (
                 <div key={reel.id} className="snap-center h-full w-full relative flex items-center justify-center bg-gray-900 rounded-3xl overflow-hidden mb-2 shadow-xl">
                     <video src={reel.videoUrl} poster={reel.thumbnail} className="h-full w-full object-cover" loop muted autoPlay playsInline />
                     <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none"></div>
                     <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                         <div className="flex flex-col items-center gap-1">
                             <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                                <Heart size={24} className="text-white hover:text-red-500 hover:fill-red-500 transition-colors" />
                             </div>
                             <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{reel.likes / 1000}k</span>
                         </div>
                         <div className="flex flex-col items-center gap-1">
                             <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                                <MessageCircle size={24} className="text-white" />
                             </div>
                             <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{reel.comments}</span>
                         </div>
                         <div className="p-3 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                             <Share2 size={24} className="text-white" />
                         </div>
                     </div>
                     <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-10">
                         <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => handleProfileClick(influencer?.id || '')}>
                             <img src={influencer?.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
                             <div>
                                 <h3 className="text-white font-bold text-sm flex items-center gap-1 shadow-black drop-shadow-md">
                                     {influencer?.handle}
                                     {influencer?.verified && <CheckCircle size={14} className="text-blue-400 fill-blue-400/20" />}
                                 </h3>
                                 <span className="text-[10px] bg-saffron-500/80 px-2 py-0.5 rounded text-white font-bold backdrop-blur-sm">{influencer?.specialty}</span>
                             </div>
                             <button className="ml-2 px-4 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg">Follow</button>
                         </div>
                         <p className="text-sm text-gray-100 line-clamp-2 leading-relaxed font-medium shadow-black drop-shadow-md">{reel.description}</p>
                     </div>
                 </div>
             );
         })}
      </div>
    </div>
  );

  const SearchView = () => (
      <div className="p-4 pt-6 h-full bg-gray-50 overflow-y-auto pb-24">
          <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search influencers, topics..." className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 shadow-sm focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Top Influencers</h2>
          <div className="space-y-3 mb-8">
              {INFLUENCERS.map(influencer => (
                  <div key={influencer.id} onClick={() => handleProfileClick(influencer.id)} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                          <img src={influencer.avatar} alt={influencer.name} className="w-14 h-14 rounded-full object-cover border border-gray-100" />
                          <div>
                              <h3 className="font-bold text-sm flex items-center gap-1 text-slate-900">{influencer.name} {influencer.verified && <CheckCircle size={14} className="text-blue-500" />}</h3>
                              <p className="text-xs text-saffron-600 font-bold">{influencer.specialty}</p>
                              <p className="text-xs text-gray-500">{influencer.followers} Followers</p>
                          </div>
                      </div>
                      <button className="p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-saffron-50 hover:text-saffron-600 transition-colors"><UserPlus size={18} /></button>
                  </div>
              ))}
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Explore Categories</h2>
          <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-indiaGreen-500 to-teal-700 p-4 flex flex-col justify-end relative overflow-hidden group cursor-pointer shadow-lg" onClick={() => { setActiveCategory('Ayurveda'); setView('FEED'); }}>
                   <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                   <h3 className="font-bold text-xl text-white relative z-10">Ayurveda</h3>
                   <p className="text-xs text-green-100 relative z-10">Herbs & Balance</p>
              </div>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 flex flex-col justify-end relative overflow-hidden group cursor-pointer shadow-lg" onClick={() => { setActiveCategory('Allopathy'); setView('FEED'); }}>
                   <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                   <h3 className="font-bold text-xl text-white relative z-10">Allopathy</h3>
                   <p className="text-xs text-blue-100 relative z-10">Clinical Science</p>
              </div>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-saffron-500 to-red-600 p-4 flex flex-col justify-end relative overflow-hidden group cursor-pointer shadow-lg" onClick={() => { setActiveCategory('Yoga'); setView('FEED'); }}>
                   <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                   <h3 className="font-bold text-xl text-white relative z-10">Yoga</h3>
                   <p className="text-xs text-orange-100 relative z-10">Mind & Body</p>
              </div>
          </div>
      </div>
  );

  const CreatorDashboardView = () => {
      if (!isCreator) {
          return (
              <div className="h-full bg-gray-50 p-6 overflow-y-auto pb-32">
                  <div className="max-w-md mx-auto mt-8">
                      <div className="text-center mb-8">
                          <div className="w-20 h-20 bg-gradient-to-tr from-saffron-400 to-red-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3">
                              <Video size={40} className="text-white" />
                          </div>
                          <h1 className="text-2xl font-bold text-slate-900">Become a Creator</h1>
                          <p className="text-gray-500 mt-2">Share your expertise, inspire students, and earn incentives.</p>
                      </div>

                      <form onSubmit={handleRegister} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                              <input required type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500 transition-colors" placeholder="Dr. Rohan Das" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Professional Handle</label>
                              <input required type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500 transition-colors" placeholder="@dr_rohan" value={regForm.handle} onChange={e => setRegForm({...regForm, handle: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Specialty</label>
                              <select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500 transition-colors" value={regForm.specialty} onChange={e => setRegForm({...regForm, specialty: e.target.value})}>
                                  <option value="Allopathy">Allopathy (MBBS/MD)</option>
                                  <option value="Ayurveda">Ayurveda (BAMS)</option>
                                  <option value="Yoga">Yoga & Wellness</option>
                                  <option value="Psychology">Psychology</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Bio / Credentials</label>
                              <textarea required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-saffron-500 transition-colors h-24 resize-none" placeholder="Tell us about your experience..." value={regForm.bio} onChange={e => setRegForm({...regForm, bio: e.target.value})} />
                          </div>
                          <button type="submit" disabled={isLoading} className="w-full py-4 bg-navy-900 text-white font-bold rounded-xl shadow-lg hover:bg-navy-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                              {isLoading ? 'Registering...' : <>Register as Creator <ChevronRight size={16} /></>}
                          </button>
                      </form>
                  </div>
              </div>
          );
      }

      return (
          <div className="h-full bg-gray-50 overflow-y-auto pb-32 relative">
              <div className="bg-white p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-saffron-500 p-0.5">
                               <img src="https://i.pravatar.cc/150?u=5" alt="Profile" className="w-full h-full rounded-full object-cover" />
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-slate-900">{regForm.handle || '@dr_rohan'}</h2>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">{regForm.specialty}</span>
                                  <span className="flex items-center gap-1"><Award size={12} className="text-saffron-500"/> Pro Creator</span>
                              </div>
                              <p className="text-sm mt-2 text-slate-600 line-clamp-1">{regForm.bio || 'Mental Health Professional'}</p>
                          </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-slate-900"><Settings size={20} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-4 mb-6">
                      <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">12.5K</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Followers</p>
                      </div>
                      <div className="text-center border-l border-gray-200">
                          <p className="text-lg font-bold text-slate-900">482</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Posts</p>
                      </div>
                      <div className="text-center border-l border-gray-200">
                          <p className="text-lg font-bold text-slate-900">4.9</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Rating</p>
                      </div>
                  </div>
                  <div className="bg-navy-900 text-white rounded-xl p-4 flex items-center justify-between shadow-lg shadow-navy-900/20 cursor-pointer hover:bg-navy-800 transition-colors" onClick={() => setDashboardTab('INSIGHTS')}>
                      <div>
                          <p className="text-xs font-bold text-gray-300 uppercase mb-1">Professional Dashboard</p>
                          <p className="font-bold text-sm">34K accounts reached in the last 30 days.</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                  </div>
              </div>

              <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
                  <button onClick={() => setDashboardTab('INSIGHTS')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${dashboardTab === 'INSIGHTS' ? 'border-saffron-500 text-slate-900' : 'border-transparent text-gray-400'}`}>
                      <BarChart3 size={18} /> Insights
                  </button>
                  <button onClick={() => setDashboardTab('MONETIZATION')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${dashboardTab === 'MONETIZATION' ? 'border-saffron-500 text-slate-900' : 'border-transparent text-gray-400'}`}>
                      <DollarSign size={18} /> Incentives
                  </button>
                  <button onClick={() => setDashboardTab('CONTENT')} className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 border-b-2 transition-colors ${dashboardTab === 'CONTENT' ? 'border-saffron-500 text-slate-900' : 'border-transparent text-gray-400'}`}>
                      <ImageIcon size={18} /> Content
                  </button>
              </div>

              <div className="p-4">
                  {dashboardTab === 'INSIGHTS' && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                              <h3 className="font-bold text-slate-900 mb-4">Account Reach</h3>
                              <div className="h-32 flex items-end justify-between gap-2 px-2">
                                  {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                      <div key={i} className="w-full bg-saffron-100 rounded-t-lg relative group">
                                          <div className="absolute bottom-0 left-0 right-0 bg-saffron-500 rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }}></div>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex justify-between text-xs text-gray-400 mt-2"><span>Mon</span><span>Sun</span></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                   <p className="text-xs text-gray-500 font-bold uppercase">Engagement</p>
                                   <p className="text-2xl font-bold text-slate-900 mt-1">4.2K</p>
                                   <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp size={10} /> +12%</p>
                               </div>
                               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                   <p className="text-xs text-gray-500 font-bold uppercase">Profile Visits</p>
                                   <p className="text-2xl font-bold text-slate-900 mt-1">1.8K</p>
                                   <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp size={10} /> +8%</p>
                               </div>
                          </div>
                      </div>
                  )}

                  {dashboardTab === 'MONETIZATION' && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg">
                              <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Balance</p>
                              <div className="flex items-center justify-between">
                                  <h2 className="text-4xl font-bold">₹12,450</h2>
                                  <div className="p-2 bg-white/10 rounded-full"><Wallet size={24} /></div>
                              </div>
                              <div className="mt-4 flex gap-2">
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">Eligible for Payout</span>
                              </div>
                          </div>
                          <h3 className="font-bold text-slate-900 mt-2">Monetization Tools</h3>
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                              <div className="p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Award size={20} /></div>
                                      <div><p className="font-bold text-sm text-slate-900">Bonuses</p><p className="text-xs text-gray-500">Reels Play Bonus Active</p></div>
                                  </div>
                                  <ChevronRight size={16} className="text-gray-400" />
                              </div>
                              <div className="p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Zap size={20} /></div>
                                      <div><p className="font-bold text-sm text-slate-900">Ads in Profile Feed</p><p className="text-xs text-gray-500">Approx. ₹450 earned</p></div>
                                  </div>
                                  <ChevronRight size={16} className="text-gray-400" />
                              </div>
                              <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Heart size={20} /></div>
                                      <div><p className="font-bold text-sm text-slate-900">Badges</p><p className="text-xs text-gray-500">On during Live Video</p></div>
                                  </div>
                                  <ChevronRight size={16} className="text-gray-400" />
                              </div>
                          </div>
                          <div className="bg-saffron-50 rounded-xl p-4 border border-saffron-100 flex items-center gap-3">
                              <div className="p-2 bg-saffron-500 text-white rounded-full"><Award size={16} /></div>
                              <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900">Rising Star Milestone</p>
                                  <div className="w-full bg-saffron-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="w-[70%] bg-saffron-600 h-full rounded-full"></div></div>
                                  <p className="text-[10px] text-saffron-700 mt-1">Reach 15K followers to unlock ₹5,000 bonus</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {dashboardTab === 'CONTENT' && (
                      <div className="grid grid-cols-3 gap-1 animate-fade-in">
                          {[1,2,3,4,5,6].map((i) => (
                              <div key={i} className="aspect-square bg-gray-200 relative overflow-hidden group">
                                  <img src={`https://picsum.photos/300/300?random=${i+10}`} className="w-full h-full object-cover" alt="post" />
                                  <div className="absolute top-1 right-1">
                                      {i % 2 === 0 ? <Video size={16} className="text-white drop-shadow-md" /> : <ImageIcon size={16} className="text-white drop-shadow-md" />}
                                  </div>
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex items-center gap-1 text-white font-bold text-sm"><Heart size={12} fill="white" /> 1.2k</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
              <button onClick={() => setShowUploadModal(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-navy-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-30 ring-4 ring-white"><UploadCloud size={24} /></button>
          </div>
      );
  };

  return (
    <div className="h-full bg-gray-50">
        {view === 'FEED' && <FeedView />}
        {view === 'SEARCH' && <SearchView />}
        {view === 'PROFILE' && (
             <div className="h-full bg-white text-slate-800 overflow-y-auto pb-24">
                  <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 relative">
                      <button onClick={() => setView('FEED')} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"><ArrowLeft size={20} /></button>
                  </div>
                  <div className="px-4 relative -mt-12 mb-6">
                      <div className="flex justify-between items-end">
                          <img src={selectedInfluencer?.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 shadow-lg" />
                          <button className="px-6 py-2 bg-navy-900 text-white font-bold rounded-lg text-sm shadow-lg mb-2">Book Session</button>
                      </div>
                      <div className="mt-4">
                          <h1 className="text-xl font-bold flex items-center gap-1 text-slate-900">{selectedInfluencer?.name} <CheckCircle size={18} className="text-blue-500" /></h1>
                          <p className="text-gray-500 text-sm">{selectedInfluencer?.handle}</p>
                          <p className="text-sm mt-2 text-slate-600">{selectedInfluencer?.bio}</p>
                      </div>
                  </div>
             </div>
        )}
        {view === 'DASHBOARD' && <CreatorDashboardView />}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-100 rounded-full px-6 py-3 flex items-center gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-40">
             <button onClick={() => setView('FEED')} className={`transition-colors ${view === 'FEED' ? 'text-saffron-600' : 'text-gray-400'}`}><Video size={24} /></button>
             <button onClick={() => setView('SEARCH')} className={`transition-colors ${view === 'SEARCH' ? 'text-saffron-600' : 'text-gray-400'}`}><Search size={24} /></button>
             <button onClick={() => setView('DASHBOARD')} className={`transition-colors ${view === 'DASHBOARD' ? 'text-saffron-600' : 'text-gray-400'}`}>
                 {isCreator ? <img src="https://i.pravatar.cc/150?u=5" className="w-6 h-6 rounded-full border border-gray-200" alt="me" /> : <Settings size={24} />}
             </button>
        </div>
        {showUploadModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">New Post</h2>
                        <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-slate-900"><X size={24} /></button>
                    </div>
                    <div className="flex gap-4 mb-6">
                        <button onClick={() => setUploadType('REEL')} className={`flex-1 py-3 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${uploadType === 'REEL' ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-gray-100 text-gray-400'}`}><Video size={24} /> Reel</button>
                        <button onClick={() => setUploadType('IMAGE')} className={`flex-1 py-3 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${uploadType === 'IMAGE' ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-gray-100 text-gray-400'}`}><ImageIcon size={24} /> Image</button>
                    </div>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col items-center">
                                <UploadCloud size={32} className="mb-2 group-hover:text-saffron-500 transition-colors" />
                                <p className="text-sm font-bold">Tap to upload {uploadType === 'REEL' ? 'Video' : 'Image'}</p>
                                <p className="text-[10px] mt-1">MP4, JPG, PNG (Max 50MB)</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Caption</label>
                            <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-saffron-500 resize-none h-20 text-sm" placeholder="Write something informative..." required />
                        </div>
                        <button type="submit" className="w-full py-4 bg-navy-900 text-white font-bold rounded-xl shadow-lg hover:bg-navy-800 transition-colors">Post Content</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Studio;
