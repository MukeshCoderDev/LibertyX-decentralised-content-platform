# 🎯 Premium Background Implementation Guide

## 🚀 **What We Just Built**

✅ **Investor Hook Overlay** - Shows "Unlock 90% earnings. No bans. Own your pleasure—on-chain." for 1.5s  
✅ **Regional Video Config** - Easy switching between 4 premium aesthetics  
✅ **IPFS Ready** - Just drop in your CID and you're live  

## 🎬 **Next Steps (Your Mentor's Strategy)**

### **Step 1: Generate Your Premium Video**
Pick ONE region and use this prompt in [Lexica.art](https://lexica.art) or Stable Diffusion:

**🇺🇸 American (Recommended):**
```
convertible silhouette against sunset skyline, palm trees, teal-pink glow, 9:16, cinematic, 3-second loop, faceless, blurred, safe for landing
```

**🇯🇵 Japanese:**
```
neon Tokyo alley, silhouette in kimono, pink lights, rain, faceless, 9:16, cinematic, 3-second loop
```

### **Step 2: Upload to IPFS**
1. Upload your generated video to [Pinata](https://pinata.cloud) or IPFS
2. Copy the CID (looks like: `QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### **Step 3: 30-Second Integration**
Open `lib/premiumVideoConfig.ts` and:

1. **Change the region:**
```ts
export const CURRENT_PREMIUM_BACKGROUND = 'american'; // or japanese, european, latin
```

2. **Add your CID:**
```ts
american: {
  cid: 'QmYourActualCIDHere', // Replace this
  // ... rest stays the same
}
```

3. **Uncomment the IPFS URL:**
```ts
export const getCurrentPremiumVideoUrl = (): string => {
  const config = PREMIUM_BACKGROUNDS[CURRENT_PREMIUM_BACKGROUND];
  
  // Uncomment this line:
  return `https://gateway.pinata.cloud/ipfs/${config.cid}`;
  
  // Comment out this line:
  // return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
};
```

## 🔥 **Result**
- Landing page now has premium, region-specific background video
- Investor hook appears every few seconds
- Looks like a million-dollar Web3 platform
- Investors and creators will stop scrolling

## 🎯 **Current Status**
- ✅ Code is ready
- ✅ Investor hook working
- ⏳ Waiting for your premium video CID
- ⏳ 30-second swap to go live

**Your mentor is right - this will make LibertyX look absolutely premium! 🚀**