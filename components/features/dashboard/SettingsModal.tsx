"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { X, Users, Shield, AlertTriangle, CheckCircle, User } from "lucide-react";
import { CustomDropdown } from "@/components/features/CustomDropdown";
import { useClerk, useUser } from "@clerk/nextjs";

export function SettingsModal({ user, onClose }: { user: any, onClose: () => void }) {
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  
  const squadMembers = useQuery(api.logs.getSquadMembers) || [];
  const updateSettings = useMutation(api.logs.updateUserSettings);
  const joinSquad = useMutation(api.logs.joinSquad);
  const resetChallenge = useMutation(api.logs.resetChallenge);
  const adminResetSquad = useMutation(api.logs.adminResetSquad);

  const [activeTab, setActiveTab] = useState<"general" | "privacy" | "account">("general");
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [isSquadResetConfirming, setIsSquadResetConfirming] = useState(false);
  const [isAccountDeleteConfirming, setIsAccountDeleteConfirming] = useState(false);

  // General Settings State
  const [vesselSizeInput, setVesselSizeInput] = useState("128");
  const [vesselUnitInput, setVesselUnitInput] = useState<"oz" | "ml" | "liters">("oz");
  const [bodyWeightInput, setBodyWeightInput] = useState("160");
  const [weightUnitInput, setWeightUnitInput] = useState<"lbs" | "kg">("lbs");
  const [squadIdInput, setSquadIdInput] = useState("");
  
  // Account Settings State
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");

  const [privacySettings, setPrivacySettings] = useState<{
    shareWorkouts: "everyone" | "close_friends" | "none";
    shareWater: "everyone" | "close_friends" | "none";
    shareReading: "everyone" | "close_friends" | "none";
    shareDiet: "everyone" | "close_friends" | "none";
    sharePhotos: "everyone" | "close_friends" | "none";
    closeFriends: string[];
  }>({
    shareWorkouts: "everyone",
    shareWater: "everyone",
    shareReading: "everyone",
    shareDiet: "everyone",
    sharePhotos: "close_friends",
    closeFriends: []
  });

  useEffect(() => {
    // Populate Convex Data
    if (user?.vesselSize) setVesselSizeInput(user.vesselSize.toString());
    if (user?.vesselUnit) setVesselUnitInput(user.vesselUnit as any);
    if (user?.bodyWeight) setBodyWeightInput(user.bodyWeight.toString());
    if (user?.weightUnit) setWeightUnitInput(user.weightUnit as any);
    if (user?.squadId) setSquadIdInput(user.squadId);
    
    if (user?.privacySettings) {
      const mapLegacy = (val: any) => val === true ? "everyone" : val === false ? "none" : (val || "everyone");
      setPrivacySettings({
        shareWorkouts: mapLegacy(user.privacySettings.shareWorkouts),
        shareWater: mapLegacy(user.privacySettings.shareWater),
        shareReading: mapLegacy(user.privacySettings.shareReading),
        shareDiet: mapLegacy(user.privacySettings.shareDiet),
        sharePhotos: mapLegacy(user.privacySettings.sharePhotos),
        closeFriends: user.privacySettings.closeFriends || []
      });
    }

    // Populate Clerk Data
    if (clerkUser) {
      setFirstNameInput(clerkUser.firstName || "");
      setLastNameInput(clerkUser.lastName || "");
    }
  }, [user, clerkUser]);

  const handleSave = async () => {
    // Save Convex Metrics
    const parsed = parseFloat(vesselSizeInput);
    const bwParsed = parseFloat(bodyWeightInput);
    if (!isNaN(parsed) && parsed > 0) {
      await updateSettings({ 
        vesselSize: parsed, 
        vesselUnit: vesselUnitInput,
        privacySettings,
        ...(isNaN(bwParsed) ? {} : { bodyWeight: bwParsed, weightUnit: weightUnitInput })
      });
    }
    if (squadIdInput !== (user?.squadId || "")) {
      await joinSquad({ squadId: squadIdInput });
    }

    // Save Clerk Name Updates
    if (clerkUser && (firstNameInput !== clerkUser.firstName || lastNameInput !== clerkUser.lastName)) {
      await clerkUser.update({ firstName: firstNameInput, lastName: lastNameInput });
    }

    onClose();
  };

  const handleDeleteAccount = async () => {
    try {
      await clerkUser?.delete();
      // NextJS & Clerk will automatically kick the user to the landing page
    } catch (e) {
      console.error("Failed to delete account:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-sm max-h-[90vh] overflow-y-auto hide-scrollbar flex flex-col"
      >
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Command Settings</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={20}/></button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 bg-neutral-950 p-1 rounded-2xl border border-neutral-800 flex-wrap sm:flex-nowrap">
          <button onClick={() => setActiveTab("general")} className={`flex-1 py-2 px-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === "general" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}>General</button>
          <button onClick={() => setActiveTab("privacy")} className={`flex-1 py-2 px-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === "privacy" ? "bg-emerald-500 text-neutral-950" : "text-neutral-500 hover:text-neutral-300"}`}>Privacy</button>
          <button onClick={() => setActiveTab("account")} className={`flex-1 py-2 px-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === "account" ? "bg-red-500/20 text-red-400" : "text-neutral-500 hover:text-neutral-300"}`}>Account</button>
        </div>

        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-neutral-800 pb-2 flex items-center gap-2"><Users size={14} /> Squad Network</h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Enter a shared ID to link your dashboard.</p>
              <input type="text" placeholder="e.g. alpha-squad" value={squadIdInput} onChange={e => setSquadIdInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Body Metrics</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Vessel Size</label>
                  <input type="text" value={vesselSizeInput} onChange={e => setVesselSizeInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                </div>
                <div className="w-1/3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unit</label>
                  <CustomDropdown options={[{label: "oz", value: "oz"}, {label: "ml", value: "ml"}, {label: "liters", value: "liters"}]} value={vesselUnitInput} onChange={(val) => setVesselUnitInput(val as any)} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Weight <span className="lowercase text-neutral-600">(opt)*</span></label>
                  <input type="number" value={bodyWeightInput} onChange={e => setBodyWeightInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                </div>
                <div className="w-1/3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unit</label>
                  <CustomDropdown options={[{label: "lbs", value: "lbs"}, {label: "kg", value: "kg"}]} value={weightUnitInput} onChange={(val) => setWeightUnitInput(val as any)} />
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono mt-2 leading-tight">
                *If provided, weight is only used to personalize your active calorie burn estimations.
              </p>
            </div>
            
            <div className="pt-6 border-t border-red-500/20 mt-6 space-y-3">
              {isResetConfirming ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-3">This will reset YOUR progress to Day 1. Are you sure?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsResetConfirming(false)} className="flex-1 py-3 bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-widest">Cancel</button>
                    <button onClick={() => {
                      resetChallenge();
                      onClose();
                    }} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Confirm</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsResetConfirming(true)} className="w-full py-4 border border-red-500/30 hover:bg-red-500/10 text-red-500 font-black tracking-widest rounded-2xl transition-all uppercase text-[10px]">
                  I Compromised. Reset to Day 1.
                </button>
              )}

              {/* ONLY RENDER SQUAD NUKE IF THEY ARE THE ADMIN */}
              {user?.squadId && user?.isSquadAdmin && (
                isSquadResetConfirming ? (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center">
                    <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-3">This will force the ENTIRE SQUAD to reset to Day 1. Are you sure?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setIsSquadResetConfirming(false)} className="flex-1 py-3 bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-widest">Cancel</button>
                      <button onClick={() => {
                        adminResetSquad();
                        onClose();
                      }} className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Nuke Squad</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setIsSquadResetConfirming(true)} className="w-full py-4 border border-orange-500/30 hover:bg-orange-500/10 text-orange-500 font-black tracking-widest rounded-2xl transition-all uppercase text-[10px]">
                    Nuke Squad to Day 1
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === "privacy" && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Set your broadcast limits per category.</p>
            
            {[
              { key: "shareWorkouts", label: "Workouts" },
              { key: "shareWater", label: "Hydration" },
              { key: "shareReading", label: "Reading" },
              { key: "shareDiet", label: "Diet Status" },
              { key: "sharePhotos", label: "Photos" },
            ].map((setting) => (
              <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">{setting.label}</span>
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 gap-1 w-full sm:w-auto">
                  <button onClick={() => setPrivacySettings({...privacySettings, [setting.key]: "everyone"})} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${privacySettings[setting.key as keyof typeof privacySettings] === "everyone" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-600 hover:text-neutral-400"}`}>All</button>
                  <button onClick={() => setPrivacySettings({...privacySettings, [setting.key]: "close_friends"})} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${privacySettings[setting.key as keyof typeof privacySettings] === "close_friends" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-600 hover:text-neutral-400"}`}>Close</button>
                  <button onClick={() => setPrivacySettings({...privacySettings, [setting.key]: "none"})} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${privacySettings[setting.key as keyof typeof privacySettings] === "none" ? "bg-red-500/20 text-red-400" : "text-neutral-600 hover:text-neutral-400"}`}>None</button>
                </div>
              </div>
            ))}

            <AnimatePresence>
              {Object.values(privacySettings).includes("close_friends") && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-6 border-t border-neutral-800 mt-6">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> Close Friends List</h3>
                  {squadMembers.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 font-mono">No one else is in your squad yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar">
                      {squadMembers.map(member => {
                        const isClose = privacySettings.closeFriends.includes(member._id);
                        return (
                          <label key={member._id} className="flex items-center justify-between p-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 cursor-pointer active:scale-[0.98] transition-all">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">{member.name}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isClose ? "bg-emerald-500 border-emerald-500" : "border-neutral-600"}`}>
                              {isClose && <CheckCircle size={12} className="text-neutral-950" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={isClose} onChange={(e) => {
                              const newFriends = e.target.checked 
                                ? [...privacySettings.closeFriends, member._id]
                                : privacySettings.closeFriends.filter(id => id !== member._id);
                              setPrivacySettings({...privacySettings, closeFriends: newFriends});
                            }}/>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ACCOUNT TAB (CUSTOM GRITIFY UI) */}
        {activeTab === "account" && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-neutral-800 pb-2 flex items-center gap-2"><User size={14}/> Identity</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className="w-full bg-neutral-950/50 border border-neutral-800/50 rounded-2xl px-4 py-3 text-neutral-500 font-mono text-sm cursor-not-allowed">
                  {clerkUser?.primaryEmailAddress?.emailAddress || "Loading..."}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">First Name</label>
                  <input type="text" value={firstNameInput} onChange={e => setFirstNameInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Last Name</label>
                  <input type="text" value={lastNameInput} onChange={e => setLastNameInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-red-500/20 mt-6 space-y-3">
              {isAccountDeleteConfirming ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-3">This permanently destroys your account and all telemetry. Are you sure?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsAccountDeleteConfirming(false)} className="flex-1 py-3 bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-widest">Cancel</button>
                    <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Destroy</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsAccountDeleteConfirming(true)} className="w-full py-4 border border-red-500/30 hover:bg-red-500/10 text-red-500 font-black tracking-widest rounded-2xl transition-all uppercase text-[10px]">
                  Delete Account Permanently
                </button>
              )}
            </div>
          </motion.div>
        )}

        <div className="pt-6 mt-auto border-t border-neutral-800">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-2xl transition-all uppercase text-[11px] shadow-[0_0_20px_rgba(16,185,129,0.2)] mb-3"
          >
            Save Settings
          </button>
          
          <button 
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full py-4 bg-transparent border border-neutral-800 hover:bg-neutral-800 text-neutral-500 font-black tracking-widest rounded-2xl transition-all uppercase text-[11px]"
          >
            Log Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}