
import hakbeomImg from './assets/hackemon/학범몬.png';
import sangwonImg from './assets/hackemon/상원몬.png';
import wookgaeImg from './assets/hackemon/욱개몬.png';
import sangwookImg from './assets/hackemon/상욱몬.png';
import jioImg from './assets/hackemon/지오몬.png';
import hanbiImg from './assets/hackemon/한비몬.png';
import jaeseongImg from './assets/hackemon/재성몬.png';
import haeumImg from './assets/hackemon/하음몬.png';
import junhyeokImg from './assets/hackemon/준혁몬.png';
import yunhoImg from './assets/hackemon/윤호몬.png'; // TODO: Add image
import jiminImg from './assets/hackemon/지민몬.png'; // TODO: Add image

export const Types = {
    PHYSICS: 'physics',
    CHEMISTRY: 'chemistry',
    ENGINEERING: 'engineering',
    BIOLOGY: 'biology',
    EARTH: 'earth',
    MATH: 'math',
    INFO: 'info',
    NORMAL: 'normal'
};

export const TypeChart = {
    // 물리>화학, 물리>지구
    [Types.PHYSICS]: { strong: [Types.CHEMISTRY, Types.EARTH], weak: [Types.ENGINEERING] },
    // 화학>생물, 화학>지구
    [Types.CHEMISTRY]: { strong: [Types.BIOLOGY, Types.EARTH], weak: [Types.PHYSICS] },
    // 공학>물리
    [Types.ENGINEERING]: { strong: [Types.PHYSICS], weak: [Types.MATH, Types.BIOLOGY] },
    // 생물>공학
    [Types.BIOLOGY]: { strong: [Types.ENGINEERING], weak: [Types.CHEMISTRY, Types.EARTH] },
    // 지구>생물, 지구>수학
    [Types.EARTH]: { strong: [Types.BIOLOGY, Types.MATH], weak: [Types.PHYSICS, Types.CHEMISTRY] },
    // 수학>공학
    [Types.MATH]: { strong: [Types.ENGINEERING], weak: [Types.INFO, Types.EARTH] },
    // 정보>수학
    [Types.INFO]: { strong: [Types.MATH], weak: [Types.BIOLOGY] },
    [Types.NORMAL]: { strong: [], weak: [] }
};

export const TypeNames = {
    [Types.PHYSICS]: '물리',
    [Types.CHEMISTRY]: '화학',
    [Types.ENGINEERING]: '공학',
    [Types.BIOLOGY]: '생물',
    [Types.EARTH]: '지구',
    [Types.MATH]: '수학',
    [Types.INFO]: '정보',
    [Types.NORMAL]: '일반'
};

// ============== ABILITIES ==============
export const Abilities = {
    IRON_WALL: { id: 'IRON_WALL', name: '철벽', desc: '방어력 +20%', effect: 'def_boost', value: 1.2 },
    INTIMIDATE: { id: 'INTIMIDATE', name: '위협', desc: '등장 시 상대 공격력 -1', effect: 'on_entry_debuff_atk' },
    HUGE_POWER: { id: 'HUGE_POWER', name: '천하장사', desc: '공격력 +50%', effect: 'atk_boost', value: 1.5 },
    ADAPTABILITY: { id: 'ADAPTABILITY', name: '적응력', desc: '자속 보정 2배', effect: 'stab_boost' },
    SPEED_BOOST: { id: 'SPEED_BOOST', name: '가속', desc: '매 턴 스피드 +1', effect: 'speed_up_each_turn' },
    THICK_FAT: { id: 'THICK_FAT', name: '두꺼운지방', desc: '받는 데미지 -10%', effect: 'damage_reduce', value: 0.9 },
    GUTS: { id: 'GUTS', name: '남자 중의 남자', desc: '상태이상 시 공격 +50%', effect: 'guts' },
    MOXIE: { id: 'MOXIE', name: '자기과신', desc: '적 처치 시 공격 +1', effect: 'moxie' },
    STURDY: { id: 'STURDY', name: '옹골참', desc: '일격 기절 방지 (HP 1)', effect: 'sturdy' },
    SNIPER: { id: 'SNIPER', name: '스나이퍼', desc: '급소 데미지 2.25배', effect: 'crit_boost', value: 2.25 },
    // 윤호몬 고유 특성
    MAKNAE_POWER: { id: 'MAKNAE_POWER', name: '막내의 힘', desc: 'HP 50% 이하시 스피드 +50%', effect: 'crisis_speed', value: 1.5 },
    // 지민몬 고유 특성
    LUFFY_POWER: { id: 'LUFFY_POWER', name: '루피의 힘', desc: 'HP 30% 이하시 공격 +80%', effect: 'crisis_attack', value: 1.8 }
};

// ============== NATURES (25 types) ==============
export const Natures = {
    // Neutral
    HARDY: { id: 'HARDY', name: '노력', boost: null, reduce: null },
    DOCILE: { id: 'DOCILE', name: '온순', boost: null, reduce: null },
    SERIOUS: { id: 'SERIOUS', name: '성실', boost: null, reduce: null },
    BASHFUL: { id: 'BASHFUL', name: '수줍음', boost: null, reduce: null },
    QUIRKY: { id: 'QUIRKY', name: '변덕', boost: null, reduce: null },
    // ATK up
    LONELY: { id: 'LONELY', name: '외로움', boost: 'attack', reduce: 'defense' },
    BRAVE: { id: 'BRAVE', name: '용감', boost: 'attack', reduce: 'speed' },
    ADAMANT: { id: 'ADAMANT', name: '고집', boost: 'attack', reduce: 'spAtk' },
    NAUGHTY: { id: 'NAUGHTY', name: '개구쟁이', boost: 'attack', reduce: 'spDef' },
    // DEF up
    BOLD: { id: 'BOLD', name: '대담', boost: 'defense', reduce: 'attack' },
    RELAXED: { id: 'RELAXED', name: '무사태평', boost: 'defense', reduce: 'speed' },
    IMPISH: { id: 'IMPISH', name: '짓궂음', boost: 'defense', reduce: 'spAtk' },
    LAX: { id: 'LAX', name: '촐랑', boost: 'defense', reduce: 'spDef' },
    // SPD up
    TIMID: { id: 'TIMID', name: '겁쟁이', boost: 'speed', reduce: 'attack' },
    HASTY: { id: 'HASTY', name: '성급', boost: 'speed', reduce: 'defense' },
    JOLLY: { id: 'JOLLY', name: '명랑', boost: 'speed', reduce: 'spAtk' },
    NAIVE: { id: 'NAIVE', name: '천진난만', boost: 'speed', reduce: 'spDef' }
};

// ============== MOVES ==============
export const Moves = {
    // Common
    TACKLE: { name: '몸통박치기', type: Types.NORMAL, power: 40, accuracy: 100, pp: 35, desc: '몸을 부딪쳐 데미지를 준다.' },

    // 1. Lee Hak-beom (Chemistry)
    BINGE_EAT: { name: '많이 먹기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 10, effect: 'heal_50', desc: 'HP의 50%를 회복한다.' },
    KUMCHEOK: { name: '쿰척 쿰척', type: Types.NORMAL, power: 0, accuracy: 90, pp: 20, effect: 'debuff_atk', desc: '상대의 공격력을 낮춘다.' },
    DIET_PLAN: { name: '나 살 뺄거야', type: Types.NORMAL, power: 0, accuracy: 100, pp: 20, effect: 'buff_def', desc: '방어력을 올린다.' },
    MICRO_FUEL: { name: '미쉥물 연료 젼줴', type: Types.CHEMISTRY, power: 70, accuracy: 90, pp: 10, desc: '미생물 연료로 강력한 공격!' },
    HUG: { name: '함 안아보자', type: Types.NORMAL, power: 60, accuracy: 85, pp: 10, effect: 'stun', desc: '안아서 다음 턴 행동불능.' },

    // 2. Kim Sang-won (Physics)
    POOP_TERROR: { name: '똥테러', type: Types.PHYSICS, power: 65, accuracy: 90, pp: 15, desc: '강력한 물리 공격.' },
    SEXY_MAN: { name: '물섹남', type: Types.PHYSICS, power: 0, accuracy: 100, pp: 20, effect: 'buff_atk', desc: '공격력을 크게 올린다.' },
    FART_TERROR: { name: '방귀테러', type: Types.PHYSICS, power: 30, accuracy: 90, pp: 20, effect: 'dot', desc: '3턴 동안 지속 데미지.' },
    TERMINAL: { name: '터미널', type: Types.PHYSICS, power: 0, accuracy: 80, pp: 10, effect: 'stun', desc: '상대를 기절시킨다.' },
    FORTY_SEVEN: { name: '47!!!', type: Types.MATH, power: 80, accuracy: 85, pp: 10, highCrit: true, desc: '김상원 생물 점수는..?' },
    STEAL_EAT: { name: '뺏어 먹기', type: Types.NORMAL, power: 40, accuracy: 100, pp: 5, effect: 'drain', desc: '데미지의 50% 회복.' },

    // 3. Ahn Wook-gae (Engineering)
    CRUNCH: { name: '깨물어 부수기', type: Types.ENGINEERING, power: 70, accuracy: 100, pp: 15, desc: '강하게 깨문다.' },
    COLOR_BLIND: { name: '적록색맹', type: Types.ENGINEERING, power: 0, accuracy: 90, pp: 20, effect: 'debuff_acc', desc: '상대 명중률 하락.' },
    FACTORIAL: { name: '7!=720', type: Types.MATH, power: 100, accuracy: 70, pp: 5, highCrit: true, desc: '7!=...?' },
    QUADRUPED: { name: '4족 보행', type: Types.NORMAL, power: 0, accuracy: 100, pp: 20, effect: 'buff_atk', desc: '공격력을 올린다.' },
    OREO: { name: '민생 회복 오레오', type: Types.NORMAL, power: 0, accuracy: 100, pp: 5, effect: 'heal', desc: 'HP의 25%를 회복.' },
    DRUM: { name: '드럼통', type: Types.ENGINEERING, power: 0, accuracy: 80, pp: 10, effect: 'stun', desc: '드럼통으로 기절!' },

    // 4. Park Sang-wook (Physics)
    ARMPIT: { name: '겨드랑이', type: Types.NORMAL, power: 0, accuracy: 90, pp: 20, effect: 'debuff_acc', desc: '상대 명중률 하락.' },
    NONSENSE: { name: '뻘소리', type: Types.NORMAL, power: 0, accuracy: 80, pp: 15, effect: 'stun', desc: '뻘소리로 혼란!' },
    PIRATE_KING: { name: '해적왕', type: Types.PHYSICS, power: 75, accuracy: 95, pp: 15, desc: '해적왕의 일격!' },
    YUMIKATSU: { name: '유미카츠', type: Types.NORMAL, power: 0, accuracy: 100, pp: 5, effect: 'heal', desc: 'HP 25% 회복.' },
    INJEONG_SSAM: { name: '인정쌤', type: Types.NORMAL, power: 0, accuracy: 100, pp: 20, effect: 'buff_atk', desc: '공격력 상승.' },
    CAREER_CLASS: { name: '4교시는 진로야', type: Types.PHYSICS, power: 60, accuracy: 100, pp: 20, desc: '진로 시간의 힘.' },

    // 5. Eom Ji-o (Chemistry)
    EOM_SMELL: { name: '엄발내', type: Types.CHEMISTRY, power: 20, accuracy: 95, pp: 25, effect: 'dot', desc: '3턴 지속 데미지.' },
    EOM_OEBA: { name: '엄메바', type: Types.CHEMISTRY, power: 0, accuracy: 100, pp: 20, effect: 'buff_spd', desc: '스피드 상승.' },
    TNT_DROP: { name: 'TNT 떨어져서 왔는데요?', type: Types.CHEMISTRY, power: 0, accuracy: 100, pp: 5, effect: 'heal', desc: 'HP 25% 회복.' },
    SUCCESSFULLY: { name: '성공적으로', type: Types.EARTH, power: 0, accuracy: 100, pp: 5, effect: 'buff_all', desc: '모든 능력치 상승!' },
    METEOR: { name: '메테오', type: Types.EARTH, power: 90, accuracy: 80, pp: 5, highCrit: true, desc: '운석으로 강타!' },
    UM: { name: '엄', type: Types.NORMAL, power: 50, accuracy: 100, pp: 30, desc: '엄.' },

    // 6. Jo Han-bi (Physics)
    STEALTH: { name: '은신', type: Types.NORMAL, power: 0, accuracy: 100, pp: 20, effect: 'buff_eva', desc: '회피율 상승.' },
    KKAMBI: { name: '깜비', type: Types.PHYSICS, power: 60, accuracy: 100, pp: 20, desc: '어디있는지 안보여!' },
    MINIMIZE: { name: '작아지기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 20, effect: 'buff_eva', desc: '회피율 상승.' },
    HAIR_POWDER: { name: '흑채복사', type: Types.PHYSICS, power: 55, accuracy: 95, pp: 20, desc: '흑채의 힘.' },
    FETCH_WATER: { name: '물길러오기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 5, effect: 'heal', desc: 'HP 25% 회복.' },
    CAN_THROW: { name: '캔날리기', type: Types.PHYSICS, power: 50, accuracy: 95, pp: 25, highCrit: true, desc: '캔을 던진다. 급소율↑' },
    NIGA: { name: '니가', type: Types.NORMAL, power: 65, accuracy: 100, pp: 20, desc: '"어둠".' },

    // 7. Jung Jae-seong (Physics)
    BITE: { name: '물기', type: Types.NORMAL, power: 60, accuracy: 100, pp: 25, desc: '물어뜯는다.' },
    GESUNGJAEI: { name: '게성재이', type: Types.NORMAL, power: 0, accuracy: 100, pp: 15, effect: 'debuff_def', desc: '상대 방어력 하락.' },
    HEAD_SMASH: { name: '대가리 부수기', type: Types.PHYSICS, power: 90, accuracy: 85, pp: 10, recoil: true, desc: '강력하지만 반동!' },
    RABIES: { name: '광견병', type: Types.BIOLOGY, power: 0, accuracy: 90, pp: 15, effect: 'buff_atk', desc: '공격력 크게 상승.' },
    BLANKET_STEAL: { name: '담요뺏기', type: Types.NORMAL, power: 50, accuracy: 100, pp: 20, desc: '담요를 뺏는다.' },
    OVERSLEEP: { name: '늦잠자기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 5, effect: 'full_heal_sleep', desc: 'HP 100% 회복, 2턴 수면.' },

    // 8. Lee Ha-eum (Biology)
    IDLE: { name: '아이들', type: Types.BIOLOGY, power: 60, accuracy: 95, pp: 20, desc: '생물의 힘.' },
    LOLI: { name: '로리', type: Types.BIOLOGY, power: 65, accuracy: 90, pp: 15, desc: '강력한 공격.' },
    CRUTCH: { name: '목발 짚기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 20, effect: 'buff_def', desc: '방어력 상승.' },
    BOOK_TALK: { name: '책톡', type: Types.BIOLOGY, power: 55, accuracy: 100, pp: 25, desc: '지혜의 힘!' },

    // 9. Yang Jun-hyeok (Physics)
    CLUB_APP: { name: '동아리 지원서 제출', type: Types.PHYSICS, power: 60, accuracy: 95, pp: 20, desc: '누군가의 힘.' },
    OWL_MAN: { name: '부엉남', type: Types.PHYSICS, power: 70, accuracy: 90, pp: 15, desc: '부엉이의 힘.' },
    GONJIAM: { name: '곤지암 사진 보여주기', type: Types.NORMAL, power: 0, accuracy: 90, pp: 15, effect: 'stun', desc: '무서워서 기절!' },
    CHARACTER_ED: { name: '인성교육받기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 10, effect: 'heal', desc: 'HP 25% 회복.' },
    RICH_BOY: { name: '부잣집 도련님', type: Types.NORMAL, power: 0, accuracy: 100, pp: 5, effect: 'money', desc: '돈을 2배 획득.' },

    // 10. Yun-ho (Math)
    TEN_YEAR_POWER: { name: '10년생의 힘', type: Types.MATH, power: 0, accuracy: 100, pp: 20, effect: 'buff_all', desc: '어린 에너지로 모든 능력치 상승!' },
    LICK: { name: '핥기', type: Types.MATH, power: 30, accuracy: 100, pp: 30, effect: 'stun', desc: '핥아서 기절시킨다. (30%)' },
    YOUNGJO_BEST: { name: '영조가 제일 좋아요', type: Types.NORMAL, power: 55, accuracy: 100, pp: 25, desc: '영조에 대한 사랑을 담은 공격.' },
    ENYO_EAT: { name: '엔요 먹기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 10, effect: 'heal_30', desc: 'HP의 30%를 회복한다.' },
    EARLY_GRAD: { name: '조기 졸업', type: Types.NORMAL, power: 50, accuracy: 100, pp: 3, effect: 'uturn', desc: '공격 후 교체한다.' },

    // 11. 지민몬 (Info)
    MY_YOON: { name: '아 내 윤석열', type: Types.INFO, power: 80, accuracy: 90, pp: 10, desc: '그분의 힘으로 강타!' },
    IS_IT_SOLVED: { name: '그거 푼거야?', type: Types.CHEMISTRY, power: 70, accuracy: 95, pp: 15, desc: '그거 진짜 점수임?' },
    STOP_EATING: { name: '그만 처먹어', type: Types.NORMAL, power: 0, accuracy: 85, pp: 15, effect: 'stun', desc: '그래 학범아' },
    BE_LATE: { name: '지각하기', type: Types.NORMAL, power: 0, accuracy: 100, pp: 10, effect: 'buff_spd', desc: '지각 전문임' },
    TECH_NOOB_POWER: { name: '컴맹의 힘', type: Types.INFO, power: 90, accuracy: 80, pp: 5, highCrit: true, desc: '라이빗인데 컴맹이라 역으로 강해진다! 급소율↑' }
};

// Get all learnable moves for a hackemon type
export function getLearnableMoves(hackemonType) {
    return Object.entries(Moves)
        .filter(([key, move]) => move.type === hackemonType || move.type === Types.NORMAL)
        .map(([key, move]) => ({ ...move, key }));
}

// ============== HACKEMON CLASS ==============
export function getXpToLevel(level) {
    return level * 50;
}

export class Hackemon {
    constructor(id, level = 5) {
        const data = HackemonData[id];
        this.id = id;
        this.name = data.name;
        this.type = data.type;
        this.image = data.image;
        this.baseStats = { ...data.baseStats };

        this.level = level;
        this.xp = 0;
        this.xpToLevel = getXpToLevel(level);

        // Assign random ability from pool
        this.ability = data.abilities[Math.floor(Math.random() * data.abilities.length)];

        // Assign random nature
        const natureKeys = Object.keys(Natures);
        this.nature = Natures[natureKeys[Math.floor(Math.random() * natureKeys.length)]];

        this.recalculateStats();
        this.hp = this.maxHp;

        // Start with 3 moves, copy PP
        const availableMoves = data.moves.map(m => ({ ...Moves[m], key: m, currentPp: Moves[m].pp })).filter(m => m);
        this.moves = availableMoves.slice(0, 3);
        this.learnableMoves = availableMoves.slice(3); // Can learn later

        this.status = null;
        this.statusDuration = 0;
        this.statStages = { atk: 0, def: 0, spd: 0, acc: 0, eva: 0 };
    }

    recalculateStats() {
        const scale = (base) => Math.floor(base * (this.level / 50) + 10 + this.level);
        this.maxHp = scale(this.baseStats.hp);
        this.attack = scale(this.baseStats.attack);
        this.defense = scale(this.baseStats.defense);
        this.speed = scale(this.baseStats.speed);

        // Apply nature modifier
        if (this.nature) {
            if (this.nature.boost === 'attack') this.attack = Math.floor(this.attack * 1.1);
            if (this.nature.boost === 'defense') this.defense = Math.floor(this.defense * 1.1);
            if (this.nature.boost === 'speed') this.speed = Math.floor(this.speed * 1.1);
            if (this.nature.reduce === 'attack') this.attack = Math.floor(this.attack * 0.9);
            if (this.nature.reduce === 'defense') this.defense = Math.floor(this.defense * 0.9);
            if (this.nature.reduce === 'speed') this.speed = Math.floor(this.speed * 0.9);
        }

        // Apply ability stat modifiers
        if (this.ability) {
            const ab = Abilities[this.ability];
            if (ab?.effect === 'def_boost') this.defense = Math.floor(this.defense * ab.value);
            if (ab?.effect === 'atk_boost') this.attack = Math.floor(this.attack * ab.value);
        }
    }

    gainXp(amount) {
        this.xp += amount;
        let leveledUp = false;
        let newMoveAvailable = null;
        let statGains = null;

        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = getXpToLevel(this.level);
            leveledUp = true;

            // Random stat increases on level up
            const hpGain = Math.floor(Math.random() * 3) + 1; // 1-3
            const atkGain = Math.floor(Math.random() * 3) + 1;
            const defGain = Math.floor(Math.random() * 3) + 1;
            const spAtkGain = Math.floor(Math.random() * 3) + 1;
            const spDefGain = Math.floor(Math.random() * 3) + 1;
            const spdGain = Math.floor(Math.random() * 3) + 1;

            this.baseStats.hp += hpGain;
            this.baseStats.attack += atkGain;
            this.baseStats.defense += defGain;
            this.baseStats.speed += spdGain;

            statGains = { hp: hpGain, atk: atkGain, def: defGain, spAtk: spAtkGain, spDef: spDefGain, spd: spdGain };

            const oldMaxHp = this.maxHp;
            this.recalculateStats();

            // Full HP recovery on level up
            this.hp = this.maxHp;

            // Full PP recovery on level up
            this.moves.forEach(move => {
                move.currentPp = move.pp;
            });

            // Learn new move at level 10, 20, 30...
            if (this.level % 10 === 0 && this.learnableMoves.length > 0) {
                newMoveAvailable = this.learnableMoves.shift();
            }
        }

        return { leveledUp, newMoveAvailable, statGains };
    }

    learnMove(move, forgetIndex = null) {
        if (forgetIndex !== null && this.moves.length >= 4) {
            this.moves[forgetIndex] = { ...move, currentPp: move.pp };
        } else if (this.moves.length < 4) {
            this.moves.push({ ...move, currentPp: move.pp });
        }
    }

    restoreAllPp() {
        this.moves.forEach(m => m.currentPp = m.pp);
    }

    restorePp(moveIndex, amount) {
        if (this.moves[moveIndex]) {
            this.moves[moveIndex].currentPp = Math.min(
                this.moves[moveIndex].pp,
                this.moves[moveIndex].currentPp + amount
            );
        }
    }
}

// ============== HACKEMON DATA ==============
// 스탯 총합 기준: 약 250~280 (역할에 따라 변동)
export const HackemonData = {
    LEE_HAK_BEOM: {
        // 탱커형: 높은 HP, 높은 방어, 낮은 스피드 (무거움)
        name: '학범몬',
        type: Types.CHEMISTRY,
        image: hakbeomImg,
        baseStats: { hp: 110, attack: 55, defense: 75, speed: 30 },  // 총합 270
        moves: ['BINGE_EAT', 'TACKLE', 'KUMCHEOK', 'DIET_PLAN', 'MICRO_FUEL', 'HUG'],
        abilities: ['THICK_FAT', 'GUTS'],
        desc: '무거운 학켓몬'
    },
    KIM_SANG_WON: {
        // 물리 어태커: 높은 공격, 좋은 스피드, 평범한 내구
        name: '상원몬',
        type: Types.PHYSICS,
        image: sangwonImg,
        baseStats: { hp: 70, attack: 90, defense: 45, speed: 75 },  // 총합 280
        moves: ['POOP_TERROR', 'SEXY_MAN', 'FART_TERROR', 'TERMINAL', 'FORTY_SEVEN', 'STEAL_EAT'],
        abilities: ['HUGE_POWER', 'MOXIE'],
        desc: '이상한 학켓몬'
    },
    AHN_WOOK_GAE: {
        // 글래스 캐논: 매우 높은 공격, 낮은 방어/HP
        name: '욱개몬',
        type: Types.ENGINEERING,
        image: wookgaeImg,
        baseStats: { hp: 50, attack: 95, defense: 35, speed: 70 },  // 총합 250
        moves: ['CRUNCH', 'COLOR_BLIND', 'FACTORIAL', 'QUADRUPED', 'OREO', 'DRUM'],
        abilities: ['ADAPTABILITY', 'INTIMIDATE'],
        desc: '개 같은 학켓몬'
    },
    PARK_SANG_WOOK: {
        // 밸런스형: 고른 스탯, 해적왕 답게 약간 공격 강조
        name: '상욱몬',
        type: Types.PHYSICS,
        image: sangwookImg,
        baseStats: { hp: 85, attack: 70, defense: 65, speed: 55 },  // 총합 275
        moves: ['CRUNCH', 'ARMPIT', 'NONSENSE', 'PIRATE_KING', 'YUMIKATSU', 'INJEONG_SSAM', 'CAREER_CLASS'],
        abilities: ['GUTS', 'INTIMIDATE'],
        desc: '해적왕을 꿈꾸는 학켓몬'
    },
    EOM_JI_O: {
        // 스피드형: 높은 스피드, 좋은 공격
        name: '지오몬',
        type: Types.CHEMISTRY,
        image: jioImg,
        baseStats: { hp: 60, attack: 75, defense: 45, speed: 90 },  // 총합 270
        moves: ['EOM_SMELL', 'EOM_OEBA', 'UM', 'TNT_DROP', 'SUCCESSFULLY', 'METEOR'],
        abilities: ['SPEED_BOOST', 'ADAPTABILITY'],
        desc: '냄새나는 학켓몬'
    },
    JO_HAN_BI: {
        // 최고 스피드: 극한의 스피드, 은신 특화, 낮은 체력
        name: '한비몬',
        type: Types.PHYSICS,
        image: hanbiImg,
        baseStats: { hp: 50, attack: 70, defense: 40, speed: 110 },  // 총합 270
        moves: ['STEALTH', 'KKAMBI', 'MINIMIZE', 'HAIR_POWDER', 'FETCH_WATER', 'CAN_THROW', 'NIGA'],
        abilities: ['SPEED_BOOST', 'SNIPER'],
        desc: '은신의 달인 학켓몬'
    },
    JUNG_JAE_SEONG: {
        // 파워형: 최고 공격, 좋은 HP, 평범한 방어/스피드
        name: '재성몬',
        type: Types.PHYSICS,
        image: jaeseongImg,
        baseStats: { hp: 80, attack: 100, defense: 45, speed: 55 },  // 총합 280
        moves: ['BITE', 'GESUNGJAEI', 'HEAD_SMASH', 'RABIES', 'BLANKET_STEAL', 'OVERSLEEP', 'CAN_THROW'],
        abilities: ['MOXIE', 'GUTS'],
        desc: '물기가 특기인 학켓몬'
    },
    LEE_HA_EUM: {
        // 방어형: 높은 방어, 옹골참 특성과 시너지
        name: '하음몬',
        type: Types.BIOLOGY,
        image: haeumImg,
        baseStats: { hp: 75, attack: 55, defense: 80, speed: 50 },  // 총합 260
        moves: ['IDLE', 'LOLI', 'MINIMIZE', 'BINGE_EAT', 'CRUTCH', 'METEOR', 'BOOK_TALK'],
        abilities: ['IRON_WALL', 'STURDY'],
        desc: '어린이를 좋아하는 학켓몬'
    },
    YANG_JUN_HYEOK: {
        // 탱커형: 부잣집 도련님, 높은 HP/방어
        name: '준혁몬',
        type: Types.PHYSICS,
        image: junhyeokImg,
        baseStats: { hp: 95, attack: 60, defense: 70, speed: 45 },  // 총합 270
        moves: ['CLUB_APP', 'OWL_MAN', 'GONJIAM', 'CHARACTER_ED', 'RICH_BOY'],
        abilities: ['THICK_FAT', 'STURDY'],
        desc: '부잣집 도련님 학켓몬'
    },
    KIM_YUN_HO: {
        // 어린이형: 낮은 기본 스탯, 높은 스피드, 성장 잠재력
        name: '윤호몬',
        type: Types.MATH,
        image: yunhoImg,
        baseStats: { hp: 45, attack: 50, defense: 35, speed: 95 },  // 총합 225 (약체지만 스피드 빠름)
        moves: ['TEN_YEAR_POWER', 'LICK', 'EARLY_GRAD', 'YOUNGJO_BEST', 'ENYO_EAT'],
        abilities: ['MAKNAE_POWER', 'SPEED_BOOST'],
        desc: '매우 어린 학켓몬'
    },
    LEE_JI_MIN: {
        // 정보형: 루피를 닮은 학켓몬, 균형 잡힌 스탯
        name: '지민몬',
        type: Types.INFO,
        image: jiminImg,
        baseStats: { hp: 75, attack: 80, defense: 55, speed: 65 },  // 총합 275
        moves: ['MY_YOON', 'IS_IT_SOLVED', 'STOP_EATING', 'BE_LATE', 'TECH_NOOB_POWER'],
        abilities: ['LUFFY_POWER', 'ADAPTABILITY'],
        desc: '루피를 닮은 학켓몬'
    }
};

export function getRandomStarters(count = 3) {
    const keys = Object.keys(HackemonData);
    const shuffled = keys.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
