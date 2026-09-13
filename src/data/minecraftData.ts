/**
 * Comprehensive Minecraft Server Networks & MCTier.com Knowledge Base
 * Includes official server IPs, domains, Bedrock ports, store links,
 * gamemodes, combat meta, tier lists, and mechanics.
 */

export interface MinecraftServerInfo {
  name: string;
  domain: string;
  javaIp: string;
  bedrockIp?: string;
  bedrockPort?: number;
  website: string;
  storeUrl?: string;
  discordUrl?: string;
  primaryLocation: string;
  crackedAllowed: boolean;
  recommendedVersions: string;
  gamemodes: string[];
  description: string;
  features: string[];
  ranks?: string[];
}

export const MINECRAFT_SERVERS: Record<string, MinecraftServerInfo> = {
  hylexmc: {
    name: 'HylexMC Network',
    domain: 'hylexmc.net',
    javaIp: 'play.hylexmc.net',
    bedrockIp: 'play.hylexmc.net',
    bedrockPort: 19132,
    website: 'https://hylexmc.net',
    storeUrl: 'https://store.hylexmc.net',
    discordUrl: 'https://discord.gg/hylexmc',
    primaryLocation: 'South Asia / Global (Singapore, Mumbai, EU nodes)',
    crackedAllowed: true,
    recommendedVersions: '1.8.9 (for PvP/Bedwars) & 1.20+ (for SMP)',
    gamemodes: [
      'Bedwars (Solo, Doubles, 3v3v3v3, 4v4v4v4, Rush, Voidless)',
      'Practice PvP (Nodebuff, Duels, Boxing, Gapple, Combo, Sumo, Bridge)',
      'Lifesteal SMP (Steal hearts on player kills, custom revives, clans, /ah auction house)',
      'Survival SMP (Economy, claims, player warps, custom quests)',
      'BoxPvP (Custom mine tiers, armor upgrades, PvP arena)',
      'SkyWars (Solo & Team normal/insane)'
    ],
    description:
      'HylexMC is one of the most popular cracked and premium Minecraft networks in South Asia and globally. It offers low-ping routing, highly competitive Bedwars and Practice PvP, and custom Lifesteal SMP seasons.',
    features: [
      'Crossplay support for both Java Edition and Bedrock Edition (Port 19132)',
      'Cracked launcher support (TLauncher, Salwyrr, Feather, Prism, Badlion, Lunar)',
      'Custom cosmetics, kill effects, victory dances, and project trails',
      'Active community tournaments and leaderboards with seasonal rewards'
    ],
    ranks: ['VIP', 'VIP+', 'MVP', 'MVP+', 'Immortal', 'Legend']
  },

  firemc: {
    name: 'FireMC Network',
    domain: 'firemc.fun',
    javaIp: 'play.firemc.fun',
    bedrockIp: 'pe.firemc.fun',
    bedrockPort: 19132,
    website: 'https://firemc.fun',
    storeUrl: 'https://store.firemc.fun',
    discordUrl: 'https://discord.gg/firemc',
    primaryLocation: 'India / South Asia (Mumbai, Singapore)',
    crackedAllowed: true,
    recommendedVersions: '1.8.9 - 1.20.x (Supports Java & Bedrock)',
    gamemodes: [
      'Practice PvP (Duels, Boxing, Bedfight, Fireball Fight, Sumo, Nodebuff)',
      'Lifesteal SMP (Heart extraction, custom heart crafts, clan wars, black market)',
      'Bedwars (Clutch, Rush, Ranked Bedwars, custom generators)',
      'BoxPvP (Multi-tier mines, custom weapons, boss fights)',
      'Survival Earth / Towny (Custom terrain, land claiming, trading)',
      'SkyWars (Normal, Insane, Lucky Block mode)'
    ],
    description:
      'FireMC is a top-tier Indian & Asian Minecraft gaming network known for exceptional latency in the subcontinent, active staff, fair anticheat system (GrimAC + custom checks), and thriving competitive player base.',
    features: [
      'Optimized knockback profiles for Indian/Asian internet providers',
      'Ranked matchmaking for Bedwars and Boxing Practice',
      'Weekly clan tournaments with in-game coins and rank giveaways',
      'Supports TLauncher, Badlion, Lunar, Feather, and vanilla clients'
    ],
    ranks: ['Coal', 'Iron', 'Gold', 'Diamond', 'Emerald', 'Netherite', 'Fire']
  },

  donutsmp: {
    name: 'DonutSMP (Donut MC)',
    domain: 'donutsmp.net',
    javaIp: 'donutsmp.net',
    bedrockIp: 'donutsmp.net',
    bedrockPort: 19132,
    website: 'https://donutsmp.net',
    storeUrl: 'https://store.donutsmp.net',
    discordUrl: 'https://discord.gg/donutsmp',
    primaryLocation: 'North America / Global',
    crackedAllowed: false,
    recommendedVersions: '1.20+ (1.20 - 1.21 Java & Bedrock Crossplay)',
    gamemodes: [
      'Hardcore Lifesteal SMP (Kill players to steal hearts, temporary death ban if you reach 0 hearts)',
      'Economy SMP (Player-driven Auction House, shop plots, coinflips, trade systems)',
      'Grief & Raid Anarchy Survival (No claiming in the wild, traps and cannoning permitted)'
    ],
    description:
      'DonutSMP is the world-renowned Hardcore Lifesteal SMP created by YouTuber DrDonut. It features high-stakes survival where death means losing a heart, and running out of hearts triggers a temporary ban until revived by an ally.',
    features: [
      'Heart crafting recipe: 4 Netherite Ingots, 4 Diamond Blocks, and a Heart Fragment',
      'Revive Beacons to bring back banned friends who lost all their hearts',
      'Dynamic player economy with /ah, /shop, and high-roller coinflip gambling',
      'Massive player caps with thousands of active players and content creators'
    ],
    ranks: ['VIP', 'Donut', 'Glazed', 'Baker', 'Owner Tier', 'Media']
  },

  fleetpvp: {
    name: 'Fleet / FleetPvP Network',
    domain: 'fleetpvp.com',
    javaIp: 'play.fleetpvp.com',
    website: 'https://fleetpvp.com',
    storeUrl: 'https://store.fleetpvp.com',
    discordUrl: 'https://discord.gg/fleetpvp',
    primaryLocation: 'North America / Europe',
    crackedAllowed: false,
    recommendedVersions: '1.8.9 (Dedicated 1.8 combat engine)',
    gamemodes: [
      'Practice PotPvP (Nodebuff, Debuff, Speed II, Health II pots)',
      'Boxing (100 hits to win, combo counter, velocity tracking)',
      'BuildUHC (Water, lava bucket, rod, bow, golden heads, absorption)',
      'Gapple (Protection IV, notch apples, durability battle)',
      'Combo (Zero hit delay, infinite combo training)',
      'Bedfight & Bridge Duels'
    ],
    description:
      'FleetPvP is an elite dedicated competitive Minecraft Practice network engineered specifically for competitive 1.8.9 duelists, offering pristine knockback consistency, custom hit registration, and ranked ELO queues.',
    features: [
      'Custom network netcode with responsive hit-detection and sprint-reset tracking',
      'Ranked competitive seasons with seasonal ELO resets and badges',
      'Replay review tools and strict anti-cheat for tournament matches'
    ],
    ranks: ['Fleet', 'Elite', 'Master', 'Champion', 'Legend']
  },

  battlepie: {
    name: 'BattlePie Network',
    domain: 'battlepie.net',
    javaIp: 'play.battlepie.net',
    website: 'https://battlepie.net',
    storeUrl: 'https://store.battlepie.net',
    discordUrl: 'https://discord.gg/battlepie',
    primaryLocation: 'South Asia / India',
    crackedAllowed: true,
    recommendedVersions: '1.8.9 - 1.20',
    gamemodes: [
      'Competitive Practice PvP (Nodebuff, Boxing, Duels, Sumo)',
      'FFA Arenas (Continuous fast-paced respawn combat)',
      'Bedwars (Casual and sweat queues)',
      'Bridge Duels and Clutch training'
    ],
    description:
      'BattlePie is a beloved competitive Minecraft server in the Indian subcontinent gaming community, catering to both cracked and premium players looking for zero-lag 1.8 combat, Practice FFA, and Bedwars.',
    features: [
      'Low ping servers routed directly through Mumbai and Singapore data centers',
      'Active scrims community for competitive tournament squads',
      'Custom leaderboards and in-game cosmetics'
    ],
    ranks: ['Pie', 'Sweet', 'Baker', 'Warrior', 'Immortal']
  },

  hypixel: {
    name: 'Hypixel Network',
    domain: 'hypixel.net',
    javaIp: 'mc.hypixel.net',
    website: 'https://hypixel.net',
    storeUrl: 'https://store.hypixel.net',
    discordUrl: 'https://discord.gg/hypixel',
    primaryLocation: 'North America (Chicago, Illinois, USA)',
    crackedAllowed: false,
    recommendedVersions: '1.8.9 (for Bedwars/SkyWars/Duels) & Latest Java (for modern builds)',
    gamemodes: [
      'Hypixel SkyBlock (Dungeons Catacombs, Slayer quests, Crimson Isle, Mining/Dwarven Mines, Bazaar, Auction House)',
      'Bedwars (Solo, Doubles, 3v3v3v3, 4v4v4v4, 4v4, Rush, Ultimate, Lucky Blocks, Armed)',
      'SkyWars (Normal, Insane, Ranked legacy, Mega, Corrupted games)',
      'Duels (Bridge, Classic, UHC, OP, Sumo, Bow, Blitz, Mega Walls, Parkour)',
      'Murder Mystery (Classic, Double Up, Assassins, Infection)',
      'Arcade Games (Hypixel Party Games, Blocking Dead, Mini Walls, Zombies)',
      'Build Battle (Solo, Teams, Pro, Guess the Build)',
      'Cops and Crims, Mega Walls, Warlords, TNT Games, Smash Heroes'
    ],
    description:
      'Hypixel is the largest and most influential Minecraft Java Edition multiplayer network in history, holding multiple Guinness World Records. Home to Hypixel SkyBlock, Bedwars, and an enormous global player base.',
    features: [
      'Watchdog Anti-Cheat + Atlas player community replay review system',
      'Hypixel Leveling, Achievement rewards, and extensive Guild system (/g create)',
      'Massive server events (Halloween Spooktacular, Holiday seasonal events, Tournaments)',
      'Official Forums with millions of posts and developer dev-blogs'
    ],
    ranks: ['VIP ($6.99)', 'VIP+ ($14.99)', 'MVP ($29.99)', 'MVP+ ($44.99)', 'MVP++ (Monthly subscription with /nick and private SMP)']
  },

  pikanetwork: {
    name: 'PikaNetwork',
    domain: 'pika-network.net',
    javaIp: 'play.pika-network.net',
    bedrockIp: 'bedrock.pika-network.net',
    bedrockPort: 19132,
    website: 'https://pika-network.net',
    storeUrl: 'https://store.pika-network.net',
    primaryLocation: 'Europe / International',
    crackedAllowed: true,
    recommendedVersions: '1.8.9 - 1.20',
    gamemodes: ['Bedwars', 'Practice PvP', 'Lifesteal SMP', 'Skyblock', 'OP Factions', 'Prison'],
    description: 'One of the world’s largest cracked Minecraft networks with massive player counts across Bedwars, OP Factions, and Lifesteal.',
    features: ['Cracked & Premium support', 'Regular seasonal wipes and payout prizes for top factions and island teams']
  },

  jartexnetwork: {
    name: 'JartexNetwork',
    domain: 'jartexnetwork.com',
    javaIp: 'play.jartexnetwork.com',
    website: 'https://jartexnetwork.com',
    storeUrl: 'https://store.jartexnetwork.com',
    primaryLocation: 'Europe / International',
    crackedAllowed: true,
    recommendedVersions: '1.8.9 - 1.20',
    gamemodes: ['Bedwars', 'Lifesteal SMP', 'Factions', 'SkyBlock', 'Prison', 'KitPvP'],
    description: 'Major international cracked Minecraft server with high-energy PvP gamemodes, custom economy, and weekly events.',
    features: ['Long-standing history in the Minecraft cracked community', 'Custom vote rewards and rank upgrade vouchers']
  },

  minemen: {
    name: 'Minemen Club (MMC)',
    domain: 'minemen.club',
    javaIp: 'minemen.club (NA) / sa.minemen.club (SA) / eu.minemen.club (EU) / as.minemen.club (Asia)',
    website: 'https://minemen.club',
    storeUrl: 'https://store.minemen.club',
    primaryLocation: 'North America, Europe, Asia (Multiple global nodes)',
    crackedAllowed: false,
    recommendedVersions: '1.8.9 (Strict 1.8 combat)',
    gamemodes: ['Ranked Practice PotPvP', 'Boxing', 'BuildUHC', 'Gapple', 'Debuff', 'Archer', 'MLG Rush'],
    description: 'The gold standard of competitive 1.8.9 Minecraft PvP duels, featuring world-class anti-cheat (Club Anti-Cheat / CAC) and the most respected leaderboards in Minecraft.',
    features: ['Proprietary CAC anticheat engineered to catch subtle auto-clickers and reach cheats', 'Global nodes for low ping in North America, Europe, and Asia']
  }
};

export const MCTIER_DATA = {
  website: 'https://mctier.com',
  name: 'MCTier (mctier.com)',
  description:
    'MCTier (mctier.com) is the premier global authority and official community ranking platform for competitive Minecraft PvP players. It tests and categorizes the top players in the world into standardized skill tiers.',
  tierLevels: [
    {
      tier: 'Tier 1 (HT1 / LT1)',
      name: 'High Tier 1 & Low Tier 1',
      description: 'The absolute apex of competitive Minecraft PvP. Top 1-10 players in the world. Dominates international tournaments and possesses near-flawless mechanics, movement, and game sense.'
    },
    {
      tier: 'Tier 2 (HT2 / LT2)',
      name: 'High Tier 2 & Low Tier 2',
      description: 'Elite competitive professionals. Highly skilled duelists capable of taking rounds off Tier 1 players and consistently winning community tournaments.'
    },
    {
      tier: 'Tier 3 (HT3 / LT3)',
      name: 'High Tier 3 & Low Tier 3',
      description: 'Strong competitive tier. Solid mastery of rod/projectile combos, blockhitting, shield disables, inventory hotkeying, and crystal placements.'
    },
    {
      tier: 'Tier 4 (HT4 / LT4)',
      name: 'High Tier 4 & Low Tier 4',
      description: 'Intermediate competitive players. Good grasp of fundamental combat mechanics with ongoing refinement in high-speed execution.'
    },
    {
      tier: 'Tier 5 (HT5 / LT5)',
      name: 'High Tier 5 & Low Tier 5',
      description: 'Entry-level competitive tier. Meets the baseline testing criteria to be listed on the official MCTier leaderboards.'
    }
  ],
  gamemodeTiers: [
    {
      mode: 'Netherite Pot (1.9+)',
      description: 'Full Netherite armor, Health & Speed splash potions, Totems, Shield, Sword, Anchor/Crystals.'
    },
    {
      mode: 'Diamond Pot (1.9+ / 1.8)',
      description: 'Diamond armor, Health II and Speed II potions, pearls, and close-quarters sprint resets.'
    },
    {
      mode: 'Sword PvP (1.9+)',
      description: 'Weapon attack cooldown timing, critical hit timing, sprint resets (w-tap/s-tap), and spacing.'
    },
    {
      mode: 'Axe & Shield (1.9+)',
      description: 'Axe weapon charge, 5-second shield stun mechanic, spacing, critical jump attacks, and crossbows.'
    },
    {
      mode: 'Crystal PvP (CPvP / Anarchy)',
      description: 'Obsidian placement, End Crystal detonation, Respawn Anchors with Glowstone, double-tapping, and totem cycling.'
    },
    {
      mode: 'SMP PvP (1.9 - 1.21)',
      description: 'Totem of Undying popping, chorus fruit, fireworks with crossbows, Netherite gear, and pearl clutches.'
    },
    {
      mode: 'BuildUHC & Rod PvP (1.8.9)',
      description: 'Fishing rod kb combos, water bucket placements, lava placement, golden heads, and bow shots.'
    },
    {
      mode: '1.8.9 Nodebuff',
      description: 'Speed II, Health II pots, blockhitting, strafing, w-tapping, and pot-refilling during combat.'
    }
  ],
  testingProcess:
    'Players apply through the official MCTier Discord servers (EU, NA, AS regions) where certified Tier Testers conduct multi-round 1v1 duels following strict rule sets to evaluate mechanics, damage trading, and gamesense.'
};

/**
 * Searches and returns relevant Minecraft data based on query text
 */
export function queryMinecraftKnowledge(query: string): string | null {
  const q = query.toLowerCase();

  // MCTier queries
  if (q.includes('mctier') || q.includes('mc tier') || q.includes('tier list') || q.includes('ht1') || q.includes('lt1') || q.includes('tier 1')) {
    let res = `### 🏆 MCTier (mctier.com) - Official Minecraft PvP Tier Rankings\n\n`;
    res += `**Website:** [mctier.com](https://mctier.com)\n\n`;
    res += `${MCTIER_DATA.description}\n\n`;
    res += `#### ⚔️ Official PvP Tiers:\n`;
    for (const t of MCTIER_DATA.tierLevels) {
      res += `- **${t.tier} (${t.name}):** ${t.description}\n`;
    }
    res += `\n#### 🎮 Tested Gamemodes on MCTier:\n`;
    for (const m of MCTIER_DATA.gamemodeTiers) {
      res += `- **${m.mode}:** ${m.description}\n`;
    }
    res += `\n#### 📋 How Tier Testing Works:\n${MCTIER_DATA.testingProcess}\n`;
    return res;
  }

  // Check specific server names
  for (const [key, s] of Object.entries(MINECRAFT_SERVERS)) {
    if (
      q.includes(key) ||
      q.includes(s.domain) ||
      (key === 'donutsmp' && (q.includes('donut') || q.includes('drdonut'))) ||
      (key === 'hylexmc' && (q.includes('hylex') || q.includes('hylex mc'))) ||
      (key === 'firemc' && (q.includes('fire mc') || q.includes('firemc'))) ||
      (key === 'battlepie' && (q.includes('battle pie') || q.includes('battlepie'))) ||
      (key === 'fleetpvp' && (q.includes('fleet') || q.includes('fleet pvp') || q.includes('fleetpvp'))) ||
      (key === 'hypixel' && (q.includes('hypixle') || q.includes('hypixel') || q.includes('skyblock')))
    ) {
      let res = `### 🎮 ${s.name} - Server Overview & Information\n\n`;
      res += `- **Website:** [${s.domain}](${s.website})\n`;
      res += `- **Java Server IP:** \`${s.javaIp}\`\n`;
      if (s.bedrockIp) {
        res += `- **Bedrock Server IP:** \`${s.bedrockIp}\` (Port: \`${s.bedrockPort || 19132}\`)\n`;
      }
      if (s.storeUrl) res += `- **Official Store:** [${s.storeUrl}](${s.storeUrl})\n`;
      if (s.discordUrl) res += `- **Discord:** [${s.discordUrl}](${s.discordUrl})\n`;
      res += `- **Cracked Allowed:** ${s.crackedAllowed ? '✅ Yes (Supports TLauncher, Salwyrr, Feather, etc.)' : '❌ No (Premium Minecraft Java Only)'}\n`;
      res += `- **Recommended Versions:** ${s.recommendedVersions}\n`;
      res += `- **Server Nodes & Region:** ${s.primaryLocation}\n\n`;
      res += `#### 🕹️ Popular Gamemodes:\n`;
      for (const gm of s.gamemodes) {
        res += `- ${gm}\n`;
      }
      res += `\n#### ✨ Key Features & Info:\n`;
      for (const feat of s.features) {
        res += `- ${feat}\n`;
      }
      if (s.ranks) {
        res += `\n**Available Ranks:** ${s.ranks.join(' • ')}\n`;
      }
      return res;
    }
  }

  // General Minecraft servers query
  if (q.includes('minecraft server') || q.includes('best servers') || q.includes('pvp servers') || q.includes('cracked server') || q.includes('lifesteal')) {
    let res = `### 🌐 Top Minecraft Server Networks & Websites\n\n`;
    res += `Here is a curated overview of the most popular Minecraft networks requested:\n\n`;
    for (const s of Object.values(MINECRAFT_SERVERS)) {
      res += `#### 🎮 ${s.name}\n`;
      res += `- **IP:** \`${s.javaIp}\`${s.bedrockIp ? ` | Bedrock: \`${s.bedrockIp}:${s.bedrockPort || 19132}\`` : ''}\n`;
      res += `- **Website:** [${s.domain}](${s.website}) | **Cracked:** ${s.crackedAllowed ? '✅ Yes' : '❌ Premium'}\n`;
      res += `- **Top Modes:** ${s.gamemodes.slice(0, 3).join(', ')}\n\n`;
    }
    res += `\n### 🏆 Official PvP Rankings:\nVisit **[MCTier (mctier.com)](https://mctier.com)** to check international Tier 1 to Tier 5 leaderboards for Netherite Pot, Diamond Pot, Sword, Axe, and Crystal PvP.\n`;
    return res;
  }

  return null;
}
