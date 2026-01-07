
import { Hackemon, HackemonData, Moves, getLearnableMoves } from '../hackemon.js';

export const ItemTypes = {
    HEAL: 'heal',
    STAT: 'stat',
    BALL: 'ball',
    PP: 'pp',
    TM: 'tm',
    SPECIAL: 'special'
};

export const Items = {
    // Healing Items
    POTION: {
        id: 'POTION', name: '포션', type: ItemTypes.HEAL,
        desc: 'HP를 50 회복', price: 100, icon: '💊',
        canUse: (hackemon) => hackemon.hp > 0, // Can't use on fainted
        effect: (hackemon) => {
            const heal = Math.min(50, hackemon.maxHp - hackemon.hp);
            hackemon.hp += heal;
            return `${hackemon.name}의 HP가 ${heal} 회복되었다!`;
        }
    },
    SUPER_POTION: {
        id: 'SUPER_POTION', name: '고급 포션', type: ItemTypes.HEAL,
        desc: 'HP를 100 회복', price: 250, icon: '💊',
        canUse: (hackemon) => hackemon.hp > 0,
        effect: (hackemon) => {
            const heal = Math.min(100, hackemon.maxHp - hackemon.hp);
            hackemon.hp += heal;
            return `${hackemon.name}의 HP가 ${heal} 회복되었다!`;
        }
    },
    HYPER_POTION: {
        id: 'HYPER_POTION', name: '상급 포션', type: ItemTypes.HEAL,
        desc: 'HP를 200 회복', price: 500, icon: '💊',
        canUse: (hackemon) => hackemon.hp > 0,
        effect: (hackemon) => {
            const heal = Math.min(200, hackemon.maxHp - hackemon.hp);
            hackemon.hp += heal;
            return `${hackemon.name}의 HP가 ${heal} 회복되었다!`;
        }
    },
    FULL_HEAL: {
        id: 'FULL_HEAL', name: '만병통치제', type: ItemTypes.HEAL,
        desc: 'HP 전부 + 상태이상 회복', price: 800, icon: '💊',
        canUse: (hackemon) => hackemon.hp > 0,
        effect: (hackemon) => {
            hackemon.hp = hackemon.maxHp;
            hackemon.status = null;
            return `${hackemon.name}이(가) 완전히 회복되었다!`;
        }
    },
    REVIVE: {
        id: 'REVIVE', name: '기력의조각', type: ItemTypes.HEAL,
        desc: '기절한 학켓몬 HP 50% 부활', price: 1000, icon: '✨',
        canUse: (hackemon) => hackemon.hp <= 0,
        effect: (hackemon) => {
            hackemon.hp = Math.floor(hackemon.maxHp / 2);
            return `${hackemon.name}이(가) 다시 일어났다!`;
        }
    },

    // PP Items
    PP_AID: {
        id: 'PP_AID', name: 'PP에이드', type: ItemTypes.PP,
        desc: '기술 하나의 PP를 10 회복', price: 80, icon: '🧪',
        ppRestore: 10
    },
    PP_MAX: {
        id: 'PP_MAX', name: 'PP맥스', type: ItemTypes.PP,
        desc: '기술 하나의 PP를 전부 회복', price: 300, icon: '🧪',
        ppRestore: 999
    },
    ELIXIR: {
        id: 'ELIXIR', name: '엘릭서', type: ItemTypes.PP,
        desc: '모든 기술의 PP를 10씩 회복', price: 500, icon: '🧪',
        allMoves: true, ppRestore: 10
    },
    MAX_ELIXIR: {
        id: 'MAX_ELIXIR', name: '맥스엘릭서', type: ItemTypes.PP,
        desc: '모든 기술의 PP를 전부 회복', price: 1500, icon: '🧪',
        allMoves: true, ppRestore: 999
    },

    // Stat Boost Items
    PROTEIN: {
        id: 'PROTEIN', name: '프로틴', type: ItemTypes.STAT,
        desc: '공격력 영구 +5 (80웨이브 이후 +10)', price: 400, icon: '⬆️',
        effect: (hackemon, wave = 1) => {
            const boost = wave >= 80 ? 10 : 5;
            hackemon.baseStats.attack += boost;
            hackemon.recalculateStats();
            return `${hackemon.name}의 공격력이 ${boost} 올랐다!`;
        }
    },
    IRON: {
        id: 'IRON', name: '철분', type: ItemTypes.STAT,
        desc: '방어력 영구 +5 (80웨이브 이후 +10)', price: 400, icon: '⬆️',
        effect: (hackemon, wave = 1) => {
            const boost = wave >= 80 ? 10 : 5;
            hackemon.baseStats.defense += boost;
            hackemon.recalculateStats();
            return `${hackemon.name}의 방어력이 ${boost} 올랐다!`;
        }
    },
    CARBOS: {
        id: 'CARBOS', name: '카르보스', type: ItemTypes.STAT,
        desc: '스피드 영구 +5 (80웨이브 이후 +10)', price: 400, icon: '⬆️',
        effect: (hackemon, wave = 1) => {
            const boost = wave >= 80 ? 10 : 5;
            hackemon.baseStats.speed += boost;
            hackemon.recalculateStats();
            return `${hackemon.name}의 스피드가 ${boost} 올랐다!`;
        }
    },
    RARE_CANDY: {
        id: 'RARE_CANDY', name: '이상한사탕', type: ItemTypes.STAT,
        desc: '레벨 +1', price: 1000, icon: '🍬',
        effect: (hackemon) => {
            hackemon.level++;
            hackemon.recalculateStats();
            hackemon.hp = hackemon.maxHp;
            return `${hackemon.name}의 레벨이 올랐다! (Lv.${hackemon.level})`;
        }
    },

    // Pokeballs
    POKEBALL: {
        id: 'POKEBALL', name: '학볼', type: ItemTypes.BALL,
        desc: '야생 학켓몬을 잡는다', price: 200, icon: '⚪',
        catchRate: 1.0
    },
    GREAT_BALL: {
        id: 'GREAT_BALL', name: '학퍼볼', type: ItemTypes.BALL,
        desc: '포획률 1.5배', price: 400, icon: '🔵',
        catchRate: 1.5
    },
    ULTRA_BALL: {
        id: 'ULTRA_BALL', name: '학이퍼볼', type: ItemTypes.BALL,
        desc: '포획률 2배', price: 800, icon: '🟡',
        catchRate: 2.0
    }
};

// Generate TM items dynamically from Moves
export function generateTM(moveKey) {
    const move = Moves[moveKey];
    if (!move) return null;
    return {
        id: `TM_${moveKey}`,
        name: `TM: ${move.name}`,
        type: ItemTypes.TM,
        desc: `${move.name} 습득 (${move.type})`,
        price: move.power ? move.power * 10 : 300,
        icon: '💿',
        moveKey: moveKey,
        move: move
    };
}

// Reward pools
export const RewardPools = {
    COMMON: ['POTION', 'POKEBALL', 'PP_AID'],
    UNCOMMON: ['SUPER_POTION', 'GREAT_BALL', 'PROTEIN', 'IRON', 'CARBOS', 'PP_MAX'],
    RARE: ['HYPER_POTION', 'ULTRA_BALL', 'ELIXIR', 'REVIVE', 'FULL_HEAL'],
    BOSS: ['RARE_CANDY', 'MAX_ELIXIR', 'REVIVE', 'ULTRA_BALL']
};

// TM pool (moves that can appear as rewards)
export const TMPool = [
    'TACKLE', 'MICRO_FUEL', 'POOP_TERROR', 'CRUNCH', 'PIRATE_KING',
    'METEOR', 'HEAD_SMASH', 'IDLE', 'OWL_MAN', 'FORTY_SEVEN'
];

// Generate free rewards (pick one)
export function generateFreeRewards(wave, count = 3) {
    const rewards = [];
    const isBoss = wave % 10 === 0;

    for (let i = 0; i < count && rewards.length < count; i++) {
        const roll = Math.random();
        let pool;

        if (isBoss) {
            pool = roll < 0.3 ? RewardPools.BOSS : roll < 0.6 ? RewardPools.RARE : RewardPools.UNCOMMON;
        } else {
            pool = roll < 0.5 ? RewardPools.COMMON : roll < 0.85 ? RewardPools.UNCOMMON : RewardPools.RARE;
        }

        // 20% chance for TM
        if (Math.random() < 0.2 && TMPool.length > 0) {
            const tmKey = TMPool[Math.floor(Math.random() * TMPool.length)];
            const tm = generateTM(tmKey);
            if (tm && !rewards.find(r => r.id === tm.id)) {
                rewards.push(tm);
                continue;
            }
        }

        const itemId = pool[Math.floor(Math.random() * pool.length)];
        if (!rewards.find(r => r.id === itemId)) {
            rewards.push({ ...Items[itemId] });
        } else {
            i--; // Retry
        }
    }

    return rewards;
}

// Generate shop items (only 3 core items)
export function generateShopItems(wave) {
    const scale = 1 + (wave * 0.02); // 2% increase per wave (reduced from 5%)

    const potionPrice = Math.floor(300 * scale);
    const ppAidPrice = Math.floor(400 * scale);
    const revivePrice = Math.floor(400 * scale);

    return [
        { ...Items.POTION, price: potionPrice, stock: 99 },
        { ...Items.PP_AID, price: ppAidPrice, stock: 99 },
        { ...Items.REVIVE, price: revivePrice, stock: 99 }
    ];
}

// Reroll cost
export function getRerollCost(wave) {
    return 150 + Math.floor(wave / 10) * 50;
}

// Trainers
export const Trainers = {
    WAVE_20: {
        name: '2반 반장', party: ['LEE_HAK_BEOM', 'KIM_SANG_WON'], levelBonus: 7
    },
    WAVE_50: {
        name: '1반 반장', party: ['AHN_WOOK_GAE', 'PARK_SANG_WOOK', 'EOM_JI_O'], levelBonus: 10
    },
    WAVE_80: {
        name: '4반 반장', party: ['JO_HAN_BI', 'JUNG_JAE_SEONG', 'LEE_HA_EUM'], levelBonus: 13
    },
    WAVE_110: {
        name: '인정쌤', party: ['KIM_SANG_WON', 'PARK_SANG_WOOK', 'JO_HAN_BI', 'YANG_JUN_HYEOK'], levelBonus: 20
    },
    WAVE_140: {
        name: '일규쌤', party: ['LEE_HAK_BEOM', 'EOM_JI_O', 'LEE_HA_EUM', 'AHN_WOOK_GAE'], levelBonus: 25
    },
    WAVE_170: {
        name: '현준쌤', party: ['AHN_WOOK_GAE', 'JUNG_JAE_SEONG', 'YANG_JUN_HYEOK', 'KIM_SANG_WON', 'PARK_SANG_WOOK'], levelBonus: 30
    },
    WAVE_200: {
        name: '경민쌤', party: ['LEE_HAK_BEOM', 'KIM_SANG_WON', 'AHN_WOOK_GAE', 'EOM_JI_O', 'JUNG_JAE_SEONG', 'YANG_JUN_HYEOK'], levelBonus: 40, isFinalBoss: true
    }
};

export function getTrainerForWave(wave) {
    return Trainers[`WAVE_${wave}`] || null;
}

export function isTrainerWave(wave) {
    return [20, 50, 80, 110, 140, 170, 200].includes(wave);
}

export function isBossWave(wave) {
    return wave % 10 === 0 && !isTrainerWave(wave);
}

export function isRewardWave(wave) {
    return true; // Every wave has rewards now
}
