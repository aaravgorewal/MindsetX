
import React, { useEffect, useState } from 'react';
import { Battery, Zap, Play, Heart, Bell, X, Loader2, Brain, Leaf, Wind, ChevronRight, Video, FileText, Image as ImageIcon } from 'lucide-react';
import { generateCatchyNudge, generateHealthLesson, generateHealingImage, generateRelaxationVideo } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { logUserMood } from '../services/userService';

interface HealthModule {
    topic: string;
    perspective: 'Allopathy' | 'Ayurveda' | 'Yoga';
    title: string;
    description: string;
    color: string;
    icon: any;
}

const MindSetFeed: React.FC = () => {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Health Module State
  const [activeModule, setActiveModule] = useState<HealthModule | null>(null);
  const [moduleContent, setModuleContent] = useState<{ text: string; image?: string; video?: string } | null>(null);
  const [loadingModule, setLoadingModule] = useState(false);
  const [genStatus, setGenStatus] = useState<string>('');

  useEffect(() => {
    // Generate Nudge on Mount - with fallback if API unavailable
    const fetchNudge = async () => {
      const hour = new Date().getHours();
      let context = 'normal';
      
      if (hour >= 23 || hour < 5) context = 'late_night';
      else if (Math.random() > 0.7) context = 'exam_week';
      
      // Fallback nudge messages when API is unavailable
      const fallbackNudges: { [key: string]: string[] } = {
        'late_night': ['You\'re up late! 🌙 Make sure to rest soon.', 'Night owl? Don\'t forget self-care! 💤'],
        'exam_week': ['You got this! 📚 One step at a time.', 'Study breaks are important too! 🧠'],
        'normal': ['Today is a fresh start! 🌟', 'You\'re doing great! Keep going! 💪', 'Mental health matters - take a moment for yourself 🧘'],
        'high_stress_panic': ['It\'s okay to feel overwhelmed. Breathe. 🌬️', 'This too shall pass. You\'re stronger than you think. 💪'],
        'anxious_tired': ['Rest is productive. Take a break. 😌', 'Self-care isn\'t selfish. You deserve it. 💝'],
        'bored_neutral': ['Try something new today! 🎯', 'Adventure awaits! ✨'],
        'feeling_good_productivity': ['Ride this wave! Keep the momentum! 🚀', 'You\'re in flow - amazing! 🔥'],
        'celebration_great_mood': ['Celebrate the wins, no matter how small! 🎉', 'Joy looks good on you! ✨']
      };
      
      try {
        const text = await generateCatchyNudge(context);
        if (text) {
          setNudge(text);
          setShowNudge(true);
        } else {
          // Use fallback if API returns nothing
          const fallbacks = fallbackNudges[context] || fallbackNudges['normal'];
          const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
          setNudge(randomFallback);
          setShowNudge(true);
        }
      } catch (e) {
        console.error("Nudge generation failed, using fallback", e);
        // Use fallback when API fails
        const fallbacks = fallbackNudges[context] || fallbackNudges['normal'];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setNudge(randomFallback);
        setShowNudge(true);
      }
    };
    
    fetchNudge();
  }, []);

  const handleMoodClick = async (level: number) => {
    setIsGenerating(true);
    // Hide current nudge briefly to show transition
    setShowNudge(false);

    // Persist mood log to Firestore (users/{uid}/moodLog/{date})
    if (user?.uid) {
      logUserMood(user.uid, level).catch((err) => {
        console.error('Failed to log mood to Firestore:', err);
      });
    }

    let context = 'normal';
    switch (level) {
        case 1: context = 'high_stress_panic'; break;
        case 2: context = 'anxious_tired'; break;
        case 3: context = 'bored_neutral'; break;
        case 4: context = 'feeling_good_productivity'; break;
        case 5: context = 'celebration_great_mood'; break;
    }

    // Fallback nudge messages
    const fallbackNudges: { [key: string]: string[] } = {
        'high_stress_panic': ['It\'s okay to feel overwhelmed. Breathe. 🌬️', 'This too shall pass. You\'re stronger than you think. 💪'],
        'anxious_tired': ['Rest is productive. Take a break. 😌', 'Self-care isn\'t selfish. You deserve it. 💝'],
        'bored_neutral': ['Try something new today! 🎯', 'Adventure awaits! ✨'],
        'feeling_good_productivity': ['Ride this wave! Keep the momentum! 🚀', 'You\'re in flow - amazing! 🔥'],
        'celebration_great_mood': ['Celebrate the wins, no matter how small! 🎉', 'Joy looks good on you! ✨']
    };

    try {
        const text = await generateCatchyNudge(context);
        if (text) {
            setNudge(text);
            setShowNudge(true);
        } else {
            const fallbacks = fallbackNudges[context] || ['Keep going! 💪'];
            const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            setNudge(randomFallback);
            setShowNudge(true);
        }
    } catch (e) {
        console.error("Manual nudge generation failed, using fallback", e);
        const fallbacks = fallbackNudges[context] || ['Keep going! 💪'];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setNudge(randomFallback);
        setShowNudge(true);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleModuleClick = async (module: HealthModule) => {
      // Check for API Key Selection for Veo/Imagen (Paid Models)
      const win = window as any;
      if (win.aistudio) {
          try {
              const hasKey = await win.aistudio.hasSelectedApiKey();
              if (!hasKey) {
                  await win.aistudio.openSelectKey();
              }
          } catch (e) {
              console.error("API Key selection error:", e);
          }
      }

      setActiveModule(module);
      setLoadingModule(true);
      setModuleContent(null);
      setGenStatus('Drafting Lesson Plan...');

      try {
          // 1. Generate Text Lesson
          const text = await generateHealthLesson(module.topic, module.perspective);
          setModuleContent({ text });
          
          // 2. Generate Image (Async)
          setGenStatus('Creating Educational Infographic...');
          generateHealingImage(
              `Educational infographic flowchart about ${module.topic} from ${module.perspective} perspective. Clear text, professional medical diagram.`, 
              "16:9"
          ).then(img => setModuleContent(prev => ({ ...prev!, image: img })))
           .catch(e => {
               console.error("Image gen failed", e);
               // If failed with permission denied (likely key issue), we can't do much inside the promise without interrupting UI
           });

          // 3. Generate Video (Async - Veo)
          setGenStatus('Rendering AI Explanation Video...');
          generateRelaxationVideo(
              `Cinematic educational video about ${module.topic} in a ${module.perspective} setting. Soothing, professional, 4k.`
          ).then(vid => setModuleContent(prev => ({ ...prev!, video: vid })))
           .catch(e => console.error("Video gen failed", e));

      } catch (e) {
          console.error("Module generation failed", e);
          setModuleContent({ text: "Failed to load module content. Please try again." });
      } finally {
          setLoadingModule(false);
          setGenStatus('');
      }
  };

  const MODULES: HealthModule[] = [
      {
          topic: 'Curing Depression',
          perspective: 'Allopathy',
          title: 'Neuro-Science',
          description: 'Serotonin & Dopamine pathways explained by MBBS experts.',
          color: 'from-blue-600 to-indigo-600',
          icon: Brain
      },
      {
          topic: 'Stress Management',
          perspective: 'Ayurveda',
          title: 'Ayurvedic Balance',
          description: 'Fixing Vata/Pitta imbalances with Ashwagandha.',
          color: 'from-green-600 to-emerald-600',
          icon: Leaf
      },
      {
          topic: 'Anxiety Relief',
          perspective: 'Yoga',
          title: 'Yogic Breath',
          description: '60s Pranayama techniques for instant calm.',
          color: 'from-orange-500 to-red-500',
          icon: Wind
      }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Catchy Nudge Banner (Vibrant Gradient) */}
      {(showNudge || isGenerating) && (
        <div className="bg-gradient-to-r from-saffron-500 to-red-500 rounded-3xl p-4 shadow-vibrant relative overflow-hidden animate-slide-in-up flex items-start gap-3 border-2 border-white/20 min-h-[80px]">
           <div className="p-2 bg-white/20 rounded-full backdrop-blur-md shrink-0">
              {isGenerating ? <Loader2 size={20} className="text-white animate-spin"/> : <Bell size={20} className="text-white animate-pulse" />}
           </div>
           <div className="flex-1 flex items-center">
              {isGenerating ? (
                  <p className="text-white font-bold text-sm animate-pulse">Cooking up a fresh fact...</p>
              ) : (
                  <p className="text-white font-bold text-sm font-hindi leading-snug drop-shadow-md">
                    {nudge}
                  </p>
              )}
           </div>
           {!isGenerating && (
               <button 
                 onClick={() => setShowNudge(false)}
                 className="text-white/60 hover:text-white transition-colors"
               >
                 <X size={16} />
               </button>
           )}
           
           {/* Background Deco */}
           <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>
      )}

      {/* Vibe Check Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome & Vibe Check */}
        <div className="lg:col-span-2 relative rounded-3xl p-1 bg-gradient-to-br from-teal-400 to-blue-500 shadow-xl">
            <div className="bg-white rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-between">
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                        <h2 className="text-2xl font-bold text-slate-900">Vibe Check Battery</h2>
                        <p className="text-sm text-gray-500 font-hindi mt-1">Aaj ka mood kaisa hai?</p>
                        </div>
                        {/* 3D Battery Icon */}
                        <div className="relative w-20 h-10 bg-gray-100 rounded-lg p-1.5 flex items-center shadow-inner border border-gray-200">
                            <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 w-[60%] rounded-sm shadow-md animate-pulse relative">
                                <div className="absolute top-0 left-0 w-full h-[50%] bg-white/20 rounded-t-sm"></div>
                            </div>
                            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-gray-300 rounded-r-sm"></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                        <button 
                            key={lvl} 
                            onClick={() => handleMoodClick(lvl)}
                            disabled={isGenerating}
                            className="aspect-square rounded-2xl bg-white border border-gray-100 shadow-lg flex items-center justify-center text-3xl active:scale-95 transition-transform hover:-translate-y-1 hover:shadow-xl group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="filter group-hover:scale-125 transition-transform block">
                                {lvl === 1 ? '😫' : lvl === 2 ? '😓' : lvl === 3 ? '😐' : lvl === 4 ? '🙂' : '🤩'}
                            </span>
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
            {['Micro-Nap', 'Deep Breath', 'Vent Box', 'Consult'].map((action, idx) => (
            <button key={idx} className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-4 flex items-center space-x-3 active:scale-95 transition-transform hover:shadow-xl group">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 text-white shadow-md group-hover:scale-110 transition-transform">
                    <Zap size={18} fill="white" />
                </div>
                <span className="text-sm font-bold text-slate-800">{action}</span>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={16} className="text-gray-400" />
                </div>
            </button>
            ))}
        </div>
      </section>

      {/* AI Health Modules Section */}
      <section>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                  AI Health Modules
              </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x no-scrollbar">
              {MODULES.map((mod, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleModuleClick(mod)}
                    className={`min-w-[280px] h-48 rounded-3xl p-6 relative overflow-hidden cursor-pointer shadow-lg group snap-center bg-gradient-to-br ${mod.color}`}
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
                          <mod.icon size={100} className="text-white" />
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                          <div>
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg">
                                      <mod.icon size={16} className="text-white" />
                                  </div>
                                  <span className="text-xs font-bold text-white/90 uppercase tracking-widest">{mod.perspective}</span>
                              </div>
                              <h3 className="text-2xl font-bold text-white leading-tight mb-2">{mod.title}</h3>
                              <p className="text-xs text-white/80 line-clamp-2">{mod.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-white text-xs font-bold mt-4">
                              <span>Generate Module</span> <ChevronRight size={14} />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* Content Grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-6 bg-saffron-500 rounded-full"></span>
                For You
            </h3>
            <button className="text-xs font-bold text-saffron-600 hover:text-saffron-700">View All</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
             {/* Card 1 - Tall Video */}
            <div className="row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer shadow-xl bg-white border border-gray-100">
                <img src="https://picsum.photos/400/700?random=1" alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-white"></div>
                        <span className="text-sm font-bold text-white shadow-black drop-shadow-md">Dr. Ananya</span>
                    </div>
                    <p className="text-sm text-white font-hindi leading-snug drop-shadow-md font-medium">Exam stress? Try 4-7-8 breathing. 🧠</p>
                </div>
                <div className="absolute top-4 right-4 p-3 bg-white/20 rounded-full backdrop-blur-md border border-white/40 shadow-lg group-hover:bg-saffron-500 transition-colors">
                    <Play size={14} className="text-white" fill="white" />
                </div>
            </div>

            {/* Card 2 - Quote (Vibrant Purple) */}
            <div className="rounded-3xl overflow-hidden relative group cursor-pointer shadow-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-5xl mb-4 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">🗣️</span>
                    <p className="text-lg font-bold text-white font-hindi drop-shadow-md leading-tight">"Log kya kahenge" ko ignore karo!</p>
                </div>
            </div>

             {/* Card 3 - Article */}
             <div className="row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer shadow-xl bg-white border border-gray-100">
                <img src="https://picsum.photos/400/600?random=2" alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                     <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded mb-2 border border-white/30">Article</span>
                     <span className="text-base font-bold text-white block mb-1 drop-shadow-md">Coach Ravi</span>
                    <p className="text-sm text-gray-100 line-clamp-2">Cricket analogy for life: How to play the long game 🏏</p>
                </div>
            </div>
             
             {/* Card 4 - Meme */}
            <div className="rounded-3xl overflow-hidden relative group cursor-pointer shadow-xl bg-white border border-gray-100">
                <img src="https://picsum.photos/300/200?random=3" alt="Meme" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                 <div className="absolute bottom-3 right-3 bg-saffron-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">MEME</div>
            </div>

            {/* Card 5 - Community (White with colorful accents) */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 rounded-3xl overflow-hidden relative group cursor-pointer shadow-xl bg-white border border-gray-100 p-6 flex flex-col justify-center">
                 <div className="flex items-center gap-4 mb-3">
                     <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                         <Heart size={24} className="animate-pulse" />
                     </div>
                     <div>
                         <h4 className="font-bold text-slate-900">Community</h4>
                         <p className="text-xs text-gray-500 font-bold">12 Online Now</p>
                     </div>
                 </div>
                 <p className="text-sm text-gray-600">Join the "Night Owls" study group session starting in 5 mins.</p>
                 <button className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-900 font-bold transition-colors">Join Room</button>
            </div>
        </div>
      </section>

      {/* MODULE DETAIL MODAL */}
      {activeModule && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                  {/* Modal Header */}
                  <div className={`p-6 bg-gradient-to-r ${activeModule.color} text-white shrink-0`}>
                      <button onClick={() => setActiveModule(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"><X size={20} /></button>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                          <activeModule.icon size={28} /> {activeModule.topic}
                      </h2>
                      <p className="text-white/80 text-sm mt-1">{activeModule.description}</p>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {loadingModule ? (
                          <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                              <Loader2 size={48} className="text-saffron-500 animate-spin" />
                              <p className="font-bold text-slate-700 animate-pulse">{genStatus}</p>
                              <p className="text-xs text-gray-500">Generating bespoke {activeModule.perspective} content...</p>
                          </div>
                      ) : moduleContent ? (
                          <div className="animate-fade-in space-y-6">
                              
                              {/* 1. Visual Guide */}
                              <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner min-h-[200px] flex items-center justify-center relative group">
                                  {moduleContent.image ? (
                                      <img src={moduleContent.image} alt="Flowchart" className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="flex flex-col items-center text-gray-400">
                                          <ImageIcon size={32} className="mb-2" />
                                          <span className="text-xs">Generating Infographic...</span>
                                          <Loader2 size={16} className="animate-spin mt-2" />
                                      </div>
                                  )}
                                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">AI Generated Visual</div>
                              </div>

                              {/* 2. Text Lesson */}
                              <div className="prose prose-sm prose-slate max-w-none">
                                  <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                                      {moduleContent.text}
                                  </div>
                              </div>

                              {/* 3. Video Module */}
                              <div className="bg-black rounded-2xl overflow-hidden aspect-video relative group shadow-lg">
                                  {moduleContent.video ? (
                                      <video src={moduleContent.video} controls className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                                          <Video size={48} className="mb-2" />
                                          <span className="text-xs">Rendering Video (Veo)... This takes a moment.</span>
                                          <Loader2 size={24} className="animate-spin mt-2 text-white" />
                                      </div>
                                  )}
                              </div>

                          </div>
                      ) : (
                          <div className="text-center text-red-500">Failed to load content.</div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MindSetFeed;
