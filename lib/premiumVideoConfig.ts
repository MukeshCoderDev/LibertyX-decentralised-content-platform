// 🎯 Premium Background Video Configuration
// Your mentor's regional aesthetic options

export interface PremiumVideoConfig {
  region: string;
  aesthetic: string;
  cid: string;
  prompt: string;
  mood: string;
}

export const PREMIUM_BACKGROUNDS: Record<string, PremiumVideoConfig> = {
  japanese: {
    region: '🇯🇵 Japanese',
    aesthetic: 'Cyber-Kimono',
    cid: 'QmCyberKimono', // Replace with actual CID
    prompt: 'neon Tokyo alley, silhouette in kimono, pink lights, rain, faceless, 9:16, cinematic',
    mood: 'neon-pink'
  },
  american: {
    region: '🇺🇸 American',
    aesthetic: 'Miami Neon',
    cid: 'QmMiamiNeon', // Replace with actual CID
    prompt: 'convertible silhouette against sunset skyline, palm trees, teal-pink glow, 9:16',
    mood: 'miami-sunset'
  },
  european: {
    region: '🇪🇺 European',
    aesthetic: 'Baroque Velvet',
    cid: 'QmBaroqueVelvet', // Replace with actual CID
    prompt: 'baroque corridor, silhouette in red gown, chiaroscuro lighting, 9:16',
    mood: 'baroque-red'
  },
  latin: {
    region: '🇧🇷 Latin',
    aesthetic: 'Carnival Pulse',
    cid: 'QmCarnivalPulse', // Replace with actual CID
    prompt: 'carnival street, silhouette, gold confetti, samba colors, 9:16',
    mood: 'carnival-gold'
  }
};

// 🚀 Current active background (change this to switch instantly)
export const CURRENT_PREMIUM_BACKGROUND = 'american'; // Change to: japanese, european, latin

// 🎬 Get current video URL
export const getCurrentPremiumVideoUrl = (): string => {
  const config = PREMIUM_BACKGROUNDS[CURRENT_PREMIUM_BACKGROUND];
  
  // Use working video URL for demo purposes
  // This will be replaced with real advertiser content
  return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
};

// 🔥 Investor hook message
export const INVESTOR_HOOK = "Unlock 90% earnings. No bans. Own your pleasure—on-chain.";