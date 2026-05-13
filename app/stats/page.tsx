"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Loader2, Activity } from "lucide-react";
import SquadOverview from "@/components/features/stats/SquadOverview";
import UserDeepDive from "@/components/features/stats/UserDeepDive";

export default function SquadDirectoryDashboard() {
  const { isLoading } = useConvexAuth();
  const me = useQuery(api.logs.getMe);
  const data = useQuery(api.logs.getGlobalAggregates);
  
  const [selectedUserDetailed, setSelectedUserDetailed] = useState<any | null>(null);

  if (isLoading || data === undefined || me === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (data === null || me === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-12 h-12 text-neutral-800 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Syncing Telemetry</h2>
        <p className="text-neutral-500 text-sm">Awaiting authentication lock-in to decrypt global stats.</p>
      </div>
    );
  }

  const myUnit = me.vesselUnit || "oz";
  const rawSquadArray = data.squad || []; 
  const fullSquadList = [
    {
      user: { ...me, name: "You" },
      stats: data.userStats,
      logs: data.userLogs,
      isMe: true
    },
    ...rawSquadArray
  ];

  const openUserDetail = (member: any) => {
    window.history.pushState({ view: 'user_detail' }, "");
    setSelectedUserDetailed(member);
  };

  const closeDeepDive = () => {
    setSelectedUserDetailed(null);
  };

  if (!selectedUserDetailed) {
    return (
      <SquadOverview 
        fullSquadList={fullSquadList} 
        openUserDetail={openUserDetail} 
      />
    );
  }

  return (
    <UserDeepDive 
      selectedUserDetailed={selectedUserDetailed} 
      myUnit={myUnit} 
      meId={me._id}
      closeDeepDive={closeDeepDive}
    />
  );
}