export const convertWater = (amount: number, fromUnit: string, toUnit: string) => {
    if (!amount) return 0;
    const from = (fromUnit || "oz").toLowerCase();
    const to = (toUnit || "oz").toLowerCase();
    
    if (from === to) return amount;
  
    let baseMl = amount;
    if (from === "oz") baseMl = amount * 29.5735;
    else if (from === "liters") baseMl = amount * 1000;
  
    if (to === "oz") return baseMl / 29.5735;
    if (to === "liters") return baseMl / 1000;
    
    return baseMl; 
  };
  
  export const calculateDay = (startDate?: number) => {
    if (!startDate) return 1;
    const now = new Date();
    now.setHours(now.getHours() - 2);
    const start = new Date(startDate);
    start.setHours(start.getHours() - 2);
    start.setHours(0,0,0,0);
    const todayObj = new Date(now);
    todayObj.setHours(0,0,0,0);
    const diffTime = todayObj.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };