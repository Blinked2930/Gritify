import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // This physically blocks anyone without an account
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 sm:p-6 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between border-b border-neutral-800 pb-6 pt-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Gritify <span className="text-emerald-500">Command</span>
            </h1>
            <p className="text-neutral-400 mt-2 text-sm sm:text-base">
              Shëngjin Matrix • Day 1 of 75
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</p>
            <p className="text-emerald-400 font-mono text-sm mt-1">LOCKED IN</p>
          </div>
        </div>

        {/* 75 Hard Daily Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Workout 1 (Outdoor) */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-neutral-200">Workout 1 (Outdoor)</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">45 min minimum</p>
            <button className="w-full py-3 bg-neutral-950 hover:bg-emerald-600/10 hover:text-emerald-400 text-neutral-400 rounded-lg border border-neutral-800 hover:border-emerald-500/50 transition-all font-mono text-sm flex items-center justify-center gap-2">
              <span className="text-lg leading-none">☐</span> LOG ZONE 2 CARDIO
            </button>
          </div>

          {/* Workout 2 */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-neutral-200">Workout 2</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">45 min minimum</p>
            <button className="w-full py-3 bg-neutral-950 hover:bg-emerald-600/10 hover:text-emerald-400 text-neutral-400 rounded-lg border border-neutral-800 hover:border-emerald-500/50 transition-all font-mono text-sm flex items-center justify-center gap-2">
              <span className="text-lg leading-none">☐</span> LOG RESISTANCE
            </button>
          </div>

          {/* Hydration */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-neutral-200">Hydration</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">1 Gallon (128 oz)</p>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="oz" 
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 w-20 text-neutral-200 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors" 
              />
              <button className="flex-1 py-2 bg-neutral-950 hover:bg-emerald-600/10 hover:text-emerald-400 text-neutral-400 rounded-lg border border-neutral-800 hover:border-emerald-500/50 transition-all font-mono text-sm">
                + ADD WATER
              </button>
            </div>
          </div>

          {/* Reading */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-neutral-200">Reading</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">10 Pages Non-Fiction</p>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="pgs" 
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 w-20 text-neutral-200 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors" 
              />
              <button className="flex-1 py-2 bg-neutral-950 hover:bg-emerald-600/10 hover:text-emerald-400 text-neutral-400 rounded-lg border border-neutral-800 hover:border-emerald-500/50 transition-all font-mono text-sm">
                + LOG PAGES
              </button>
            </div>
          </div>

          {/* Diet & Progress Pic */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-200">Discipline Checks</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Diet followed. No alcohol. No cheat meals. Picture taken.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 bg-neutral-950 hover:bg-emerald-600/10 hover:text-emerald-400 text-neutral-400 rounded-lg border border-neutral-800 hover:border-emerald-500/50 transition-all font-mono text-sm flex items-center justify-center gap-2">
                <span className="text-lg leading-none">☐</span> DIET PERFECT
              </button>
              <button className="py-3 bg-neutral-950 hover:bg-emerald-600/10 hover:text-emerald-400 text-neutral-400 rounded-lg border border-neutral-800 hover:border-emerald-500/50 transition-all font-mono text-sm flex items-center justify-center gap-2">
                <span className="text-lg leading-none">☐</span> PROGRESS PIC
              </button>
            </div>
          </div>
        </div>

        {/* Vault Reflections */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-sm mt-8">
          <h2 className="text-xl font-bold text-white mb-2">Vault Reflections</h2>
          <p className="text-neutral-400 text-sm mb-4">End of day mental review and Q&A.</p>
          <textarea 
            className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-neutral-200 focus:outline-none focus:border-emerald-500 resize-none font-mono text-sm transition-colors"
            placeholder="The mind gives up before the body does..."
          ></textarea>
          <div className="mt-4 flex justify-end">
            <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all text-sm uppercase tracking-wide">
              Save to Convex
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}