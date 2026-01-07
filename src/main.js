
import './style.css';
import { Hackemon, HackemonData, TypeNames, Abilities, getRandomStarters, Moves } from './hackemon.js';
import { Battle } from './game/battle.js';
import { Items, ItemTypes, generateFreeRewards, generateShopItems, getRerollCost, getTrainerForWave, isTrainerWave, isBossWave, generateTM } from './game/items.js';

const SAVE_KEY = 'hackemon_save';

// ============== GAME STATE ==============
let gameState = {
  phase: 'starter',
  wave: 1,
  money: 1000,
  party: [],
  inventory: [],
  battle: null,
  starterOptions: [],
  nextMoneyMultiplier: 1,
  pendingNewMoves: [], // Moves to learn after battle
  lastActiveIndex: 0 // Track last used Hackemon
};

// ============== TOAST NOTIFICATION ==============
function showToast(message, type = 'info', duration = 1500) {
  // Remove existing toast if any
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============== SAVE / LOAD SYSTEM ==============
function saveGame() {
  const saveData = {
    wave: gameState.wave,
    money: gameState.money,
    party: gameState.party.map(mon => ({
      id: mon.id,
      level: mon.level,
      xp: mon.xp,
      hp: mon.hp,
      baseStats: mon.baseStats,
      moves: mon.moves,
      ability: mon.ability,
      nature: mon.nature,
      status: mon.status
    })),
    inventory: gameState.inventory.map(item => ({
      id: item.id,
      type: item.type
    }))
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  showToast('게임이 저장되었습니다!', 'success');
}

// Auto-save (silent, no toast)
function autoSave() {
  if (gameState.phase === 'starter' || !gameState.party.length) return;

  const saveData = {
    wave: gameState.wave,
    money: gameState.money,
    party: gameState.party.map(mon => ({
      id: mon.id,
      level: mon.level,
      xp: mon.xp,
      hp: mon.hp,
      baseStats: mon.baseStats,
      moves: mon.moves,
      ability: mon.ability,
      nature: mon.nature,
      status: mon.status
    })),
    inventory: gameState.inventory.map(item => ({
      id: item.id,
      type: item.type
    })),
    // Save enemy data to persist across sessions
    cachedEnemy: gameState.cachedEnemy,
    cachedEnemyWave: gameState.cachedEnemyWave,
    // Save rewards cache to persist across sessions (only IDs to avoid function serialization issues)
    cachedRewardIds: gameState.cachedRewards ? gameState.cachedRewards.map(r => ({ id: r.id, moveKey: r.moveKey })) : null,
    cachedRewardsWave: gameState.cachedRewardsWave,
    // Save wave completion status
    waveCompleted: gameState.waveCompleted || false
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  console.log('Auto-saved at wave', gameState.wave, 'completed:', gameState.waveCompleted);
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);

    // Reconstruct party
    const party = data.party.map(monData => {
      const mon = new Hackemon(monData.id, monData.level);
      mon.xp = monData.xp;
      mon.hp = monData.hp;
      mon.baseStats = monData.baseStats;
      mon.moves = monData.moves;
      mon.ability = monData.ability;
      mon.nature = monData.nature;
      mon.status = monData.status;
      mon.recalculateStats();
      return mon;
    });

    // Reconstruct inventory
    const inventory = data.inventory.map(itemData => ({
      ...Items[itemData.id],
      id: itemData.id
    })).filter(item => item.name); // Filter out invalid items

    gameState = {
      phase: 'battle',
      wave: data.wave,
      money: data.money,
      party,
      inventory,
      battle: null,
      starterOptions: [],
      nextMoneyMultiplier: 1,
      pendingNewMoves: [],
      // Restore enemy cache for consistent enemy on load
      cachedEnemy: data.cachedEnemy,
      cachedEnemyWave: data.cachedEnemyWave,
      // Restore rewards cache by reconstructing from IDs
      cachedRewards: data.cachedRewardIds ? data.cachedRewardIds.map(r => {
        if (r.moveKey) {
          return generateTM(r.moveKey);
        }
        return Items[r.id] ? { ...Items[r.id] } : null;
      }).filter(r => r) : null,
      cachedRewardsWave: data.cachedRewardsWave,
      // Restore wave completion status
      waveCompleted: data.waveCompleted || false
    };

    return true;
  } catch (e) {
    console.error('Failed to load save:', e);
    return false;
  }
}

function hasSaveData() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

// ============== MAIN MENU ==============
function renderMainMenu() {
  const hasSave = hasSaveData();

  document.querySelector('#app').innerHTML = `
    <div class="main-menu">
      <div class="menu-title">학켓로그</div>
      <div class="menu-subtitle">HackeLog</div>
      <div class="menu-buttons">
        ${hasSave ? '<div class="menu-btn" id="continue-btn">이어하기</div>' : ''}
        <div class="menu-btn" id="newgame-btn">새 게임</div>
        ${hasSave ? '<div class="menu-btn danger" id="delete-btn">저장 삭제</div>' : ''}
      </div>
    </div>
  `;

  if (hasSave) {
    document.getElementById('continue-btn').onclick = () => {
      if (loadGame()) {
        // Check if wave was completed - if so go to rewards, otherwise battle
        if (gameState.waveCompleted) {
          renderRewardShop([]);
        } else {
          startWave();
        }
      }
    };
    document.getElementById('delete-btn').onclick = () => {
      if (confirm('정말로 저장 데이터를 삭제하시겠습니까?')) {
        deleteSave();
        renderMainMenu();
      }
    };
  }

  document.getElementById('newgame-btn').onclick = () => {
    deleteSave();
    resetGame();
  };
}

// ============== STARTER SELECTION ==============
let selectedStarters = [];

function renderStarterSelection() {
  gameState.starterOptions = getRandomStarters(4);
  selectedStarters = [];

  document.querySelector('#app').innerHTML = `
    <div class="starter-screen">
      <div class="starter-header">
        <div class="starter-title">스타팅 학켓몬을 2마리 선택하세요!</div>
        <div class="starter-subtitle">선택한 학켓몬: <span id="selected-count">0</span>/2</div>
      </div>
      <div class="starter-grid">
        ${gameState.starterOptions.map((key, i) => {
    const data = HackemonData[key];
    const ability = Abilities[data.abilities[0]];
    return `
            <div class="starter-card" data-key="${key}">
              <div class="starter-sprite" style="background-image: url('${data.image}'); background-size: cover; background-position: center;"></div>
              <div class="starter-info">
                <div class="starter-name">${data.name}</div>
                <div class="starter-type type-${data.type}">${TypeNames[data.type]}</div>
                <div class="starter-ability">${ability?.name || ''}</div>
                <div class="starter-stats-grid">
                  <div class="stat-item"><span class="stat-label">HP</span><span class="stat-value">${data.baseStats.hp}</span></div>
                  <div class="stat-item"><span class="stat-label">ATK</span><span class="stat-value">${data.baseStats.attack}</span></div>
                  <div class="stat-item"><span class="stat-label">DEF</span><span class="stat-value">${data.baseStats.defense}</span></div>
                  <div class="stat-item"><span class="stat-label">SPD</span><span class="stat-value">${data.baseStats.speed}</span></div>
                </div>
                <div class="starter-desc">${data.desc}</div>
              </div>
              <div class="starter-check">✓</div>
            </div>
          `;
  }).join('')}
      </div>
      <div class="starter-bottom">
        <div class="starter-start-btn disabled" id="start-btn">2마리를 선택하세요</div>
      </div>
    </div>
  `;

  document.querySelectorAll('.starter-card').forEach(card => {
    card.onclick = () => {
      const key = card.dataset.key;

      if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        selectedStarters = selectedStarters.filter(k => k !== key);
      } else if (selectedStarters.length < 2) {
        card.classList.add('selected');
        selectedStarters.push(key);
      }

      // Update UI
      document.getElementById('selected-count').innerText = selectedStarters.length;
      const btn = document.getElementById('start-btn');
      if (selectedStarters.length === 2) {
        btn.classList.remove('disabled');
        btn.innerText = `${selectedStarters.map(k => HackemonData[k].name).join(' & ')}(으)로 시작!`;
      } else {
        btn.classList.add('disabled');
        btn.innerText = `${2 - selectedStarters.length}마리 더 선택하세요`;
      }
    };
  });

  document.getElementById('start-btn')?.addEventListener('click', () => {
    if (selectedStarters.length === 2) {
      gameState.party = selectedStarters.map(key => new Hackemon(key, 5));
      gameState.inventory = [
        { ...Items.POKEBALL, id: 'POKEBALL' },
        { ...Items.POKEBALL, id: 'POKEBALL' },
        { ...Items.POKEBALL, id: 'POKEBALL' },
        { ...Items.POTION, id: 'POTION' },
        { ...Items.POTION, id: 'POTION' }
      ];
      startWave();
    }
  });
}

// ============== BATTLE SCREEN ==============
function renderBattle() {
  const p = gameState.battle.playerMon;
  const e = gameState.battle.enemyMon;
  const isTrainer = gameState.battle.trainerData;
  const ability = p.ability ? Abilities[p.ability] : null;

  document.querySelector('#app').innerHTML = `
    <div class="battle-container">
      <!-- Background elements -->
      <div class="battle-bg-mountains"></div>
      <div class="battle-bg-trees"></div>
      <div class="cloud" style="top: 5%; left: 10%; width: 120px; height: 40px;"></div>
      <div class="cloud" style="top: 12%; left: 40%; width: 80px; height: 30px;"></div>
      <div class="cloud" style="top: 8%; right: 15%; width: 100px; height: 35px;"></div>
      
      <div class="ground"></div>
      <div class="platform enemy"></div>
      <div class="platform player"></div>
      <div class="sprite enemy" style="background-image: url('${e.image}')"></div>
      <div class="sprite player" style="background-image: url('${p.image}')"></div>

      <div class="party-sidebar">
        ${gameState.party.map((mon, i) => `
          <div class="party-slot ${i === gameState.battle.activeIndex ? 'active' : ''} ${mon.hp <= 0 ? 'fainted' : ''}" data-index="${i}">
            <div class="party-icon" style="background-image: url('${mon.image}'); background-size: cover; background-position: center;"></div>
            <div class="party-hp-mini" style="width: ${Math.max(0, (mon.hp / mon.maxHp) * 100)}%"></div>
          </div>
        `).join('')}
      </div>

      <div class="hud enemy-1">
        ${isTrainer ? `<div class="trainer-label">${isTrainer.name}</div>` : ''}
        <div class="hud-row">
          <span class="hud-name" id="enemy-name">${e.name}</span>
          <span class="level-text">Lv.<span id="enemy-level">${e.level}</span></span>
        </div>
        <div class="bar-row">
          <span class="bar-label hp">HP</span>
          <div class="bar-container"><div class="bar-fill hp" id="enemy-hp-bar"></div></div>
        </div>
        ${isTrainer && gameState.battle.enemyParty ? `
          <div class="trainer-party-icons">
            ${gameState.battle.enemyParty.map((m, i) => `
              <div class="trainer-party-dot ${m.hp <= 0 ? 'fainted' : ''} ${i === gameState.battle.currentEnemyIndex ? 'active' : ''}"></div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="hud player-1">
        <div class="hud-row">
          <span class="hud-name" id="player-name">${p.name}</span>
          <span class="level-text">Lv.<span id="player-level">${p.level}</span></span>
        </div>
        <div class="bar-row">
          <span class="bar-label hp">HP</span>
          <div class="bar-container"><div class="bar-fill hp" id="player-hp-bar"></div></div>
        </div>
        <div class="bar-row">
          <span class="bar-label xp">XP</span>
          <div class="bar-container"><div class="bar-fill xp" id="player-xp-bar"></div></div>
        </div>
        <div class="hp-text" id="player-hp-text">${p.hp}/${p.maxHp}</div>
        ${ability ? `<div class="ability-label">${ability.name}</div>` : ''}
      </div>

      <div class="top-info">
        <div class="location">웨이브 - ${gameState.wave}</div>
        <div class="money">₱${gameState.money}</div>
      </div>

      <div class="bottom-panel">
        <div class="dialog-box" id="dialog-text">
          ${isTrainer ? `${isTrainer.name}이(가) 승부를 걸어왔다!` : `야생의 ${e.name}이(가) 나타났다!`}
        </div>
        
        <div class="command-menu" id="command-menu">
          <div class="cmd-btn" id="btn-fight"><span class="arrow">▶</span>싸우다</div>
          <div class="cmd-btn" id="btn-ball">볼</div>
          <div class="cmd-btn" id="btn-pokemon">학켓몬</div>
          <div class="cmd-btn" id="btn-run">도망치다</div>
        </div>

        <div class="move-menu" id="move-menu" style="display:none;"></div>
        <div class="party-menu" id="party-menu" style="display:none;"></div>
        <div class="ball-menu" id="ball-menu" style="display:none;"></div>
      </div>
      
      <div class="move-tooltip" id="move-tooltip" style="display:none;">
        <div id="tooltip-name"></div>
        <div id="tooltip-type"></div>
        <div id="tooltip-power"></div>
        <div id="tooltip-desc"></div>
      </div>
      
      <div class="stat-gain-popup" id="stat-gain-popup" style="display:none;">
        <div class="stat-gain-title" id="stat-gain-title">레벨이 올랐다!</div>
        <div class="stat-gain-row"><span>HP</span><span class="stat-plus">+</span><span id="stat-hp">0</span></div>
        <div class="stat-gain-row"><span>공격</span><span class="stat-plus">+</span><span id="stat-atk">0</span></div>
        <div class="stat-gain-row"><span>방어</span><span class="stat-plus">+</span><span id="stat-def">0</span></div>
        <div class="stat-gain-row"><span>특수공격</span><span class="stat-plus">+</span><span id="stat-spatk">0</span></div>
        <div class="stat-gain-row"><span>특수방어</span><span class="stat-plus">+</span><span id="stat-spdef">0</span></div>
        <div class="stat-gain-row"><span>스피드</span><span class="stat-plus">+</span><span id="stat-spd">0</span></div>
      </div>
    </div>
  `;

  setupBattleUI();
  updateUI();
}

function setupBattleUI() {
  buildMoveMenu();
  buildPartyMenu();
  buildBallMenu();

  document.getElementById('btn-fight').onclick = () => { showMenu('move'); log('기술을 선택하세요!'); };
  document.getElementById('btn-ball').onclick = () => {
    if (gameState.battle.trainerData) { log('트레이너의 학켓몬은 잡을 수 없다!'); return; }
    showMenu('ball'); log('학볼을 선택하세요!');
  };
  document.getElementById('btn-pokemon').onclick = () => { showMenu('party'); log('교체할 학켓몬을 선택하세요!'); };
  document.getElementById('btn-run').onclick = () => {
    if (gameState.battle.trainerData) { log('트레이너 배틀에서는 도망칠 수 없다!'); return; }
    log('도망쳤다!');
    setTimeout(() => {
      gameState.wave++;
      startWave();
    }, 1000);
  };
}

function buildMoveMenu() {
  const menu = document.getElementById('move-menu');
  menu.innerHTML = '';

  const p = gameState.battle.playerMon;
  p.moves.forEach((move, i) => {
    const btn = document.createElement('div');
    btn.className = `move-btn ${move.currentPp <= 0 ? 'disabled' : ''}`;
    btn.innerHTML = `
      <span class="move-name">${move.name}</span>
      <span class="move-meta">
        <span class="move-type type-${move.type}">${TypeNames[move.type]}</span>
        <span class="move-pp">PP ${move.currentPp}/${move.pp}</span>
      </span>
    `;

    btn.onclick = async () => {
      if (move.currentPp <= 0) { log('PP가 없다!'); return; }
      hideTooltip();

      // Check if this is a U-turn move
      if (move.effect === 'uturn') {
        const alive = gameState.party.filter((m, idx) => m.hp > 0 && idx !== gameState.battle.activeIndex);
        if (alive.length > 0) {
          showUturnSwitchMenu(i);
          return;
        }
      }

      showMenu('command');
      await gameState.battle.executeTurn(i);
    };
    btn.onmouseenter = () => showTooltip(move);
    btn.onmouseleave = hideTooltip;
    menu.appendChild(btn);
  });

  addBackButton(menu);
}

function showUturnSwitchMenu(moveIndex) {
  log('교체할 학켓몬을 선택하세요!');

  const menu = document.getElementById('party-menu');
  menu.innerHTML = '';

  gameState.party.forEach((mon, i) => {
    const btn = document.createElement('div');
    btn.className = `party-btn ${mon.hp <= 0 ? 'fainted' : ''} ${i === gameState.battle?.activeIndex ? 'active' : ''}`;
    btn.innerHTML = `<span>${mon.name} Lv.${mon.level}</span><span class="party-hp">${mon.hp}/${mon.maxHp}</span>`;
    btn.onclick = async () => {
      if (i === gameState.battle?.activeIndex) { log('현재 학켓몬은 선택할 수 없다!'); return; }
      if (mon.hp <= 0) { log('기절한 학켓몬은 선택할 수 없다!'); return; }
      showMenu('command');
      await gameState.battle.executeUturnTurn(moveIndex, i);
      renderBattle();
    };
    menu.appendChild(btn);
  });

  // Back button to cancel
  const backBtn = document.createElement('div');
  backBtn.className = 'move-btn back-btn';
  backBtn.innerHTML = '<span>← 취소</span>';
  backBtn.onclick = () => showMenu('move');
  menu.appendChild(backBtn);

  showMenu('party');
}

function buildPartyMenu() {
  const menu = document.getElementById('party-menu');
  menu.innerHTML = '';

  gameState.party.forEach((mon, i) => {
    const btn = document.createElement('div');
    btn.className = `party-btn ${mon.hp <= 0 ? 'fainted' : ''} ${i === gameState.battle?.activeIndex ? 'active' : ''}`;
    btn.innerHTML = `<span>${mon.name} Lv.${mon.level}</span><span class="party-hp">${mon.hp}/${mon.maxHp}</span>`;
    btn.onclick = async () => {
      if (i === gameState.battle?.activeIndex) { log('이미 싸우고 있다!'); return; }
      if (mon.hp <= 0) { log('기절한 학켓몬은 내보낼 수 없다!'); return; }
      showMenu('command');
      await gameState.battle.switchTo(i);
      // Re-render battle UI to update player name, HP, moves etc
      renderBattle();
    };
    menu.appendChild(btn);
  });
  addBackButton(menu);
}

function buildBallMenu() {
  const menu = document.getElementById('ball-menu');
  menu.innerHTML = '';

  const ballCounts = {};
  gameState.inventory.forEach(item => {
    if (item.type === ItemTypes.BALL) {
      ballCounts[item.id] = (ballCounts[item.id] || 0) + 1;
    }
  });

  if (Object.keys(ballCounts).length === 0) {
    menu.innerHTML = '<div class="empty-message">학볼이 없다...</div>';
    addBackButton(menu);
    return;
  }

  Object.entries(ballCounts).forEach(([id, count]) => {
    const item = Items[id];
    const btn = document.createElement('div');
    btn.className = 'ball-btn';
    btn.innerHTML = `<span>${item.icon} ${item.name} ×${count}</span>`;
    btn.onclick = async () => {
      showMenu('command');
      await gameState.battle.useBall(item);
      buildBallMenu();
      updateUI();
    };
    menu.appendChild(btn);
  });
  addBackButton(menu);
}

function addBackButton(menu, backTo = 'command') {
  const btn = document.createElement('div');
  btn.className = 'move-btn back-btn';
  btn.innerHTML = '<span>← 뒤로</span>';
  btn.onclick = () => showMenu(backTo);
  menu.appendChild(btn);
}

function showMenu(type) {
  ['command', 'move', 'party', 'ball'].forEach(t => {
    const el = document.getElementById(`${t}-menu`);
    if (el) el.style.display = t === type ? 'grid' : 'none';
  });
}

function showTooltip(move) {
  const t = document.getElementById('move-tooltip');
  document.getElementById('tooltip-name').innerText = move.name;
  document.getElementById('tooltip-type').innerText = `타입: ${TypeNames[move.type]}`;
  document.getElementById('tooltip-power').innerText = move.power > 0 ? `위력: ${move.power} | 명중: ${move.accuracy}` : '변화기';
  document.getElementById('tooltip-desc').innerText = move.desc + (move.highCrit ? ' (급소율↑)' : '');
  t.style.display = 'block';
}

function hideTooltip() {
  document.getElementById('move-tooltip').style.display = 'none';
}

function showStatGain(monName, statGains) {
  const popup = document.getElementById('stat-gain-popup');
  if (!popup) return;

  const title = document.getElementById('stat-gain-title');
  if (title) title.innerText = `${monName} 레벨이 올랐다!`;

  document.getElementById('stat-hp').innerText = statGains.hp;
  document.getElementById('stat-atk').innerText = statGains.atk;
  document.getElementById('stat-def').innerText = statGains.def;
  document.getElementById('stat-spatk').innerText = statGains.spAtk || 0;
  document.getElementById('stat-spdef').innerText = statGains.spDef || 0;
  document.getElementById('stat-spd').innerText = statGains.spd;

  popup.style.display = 'block';

  // Hide after 2.5 seconds
  setTimeout(() => {
    popup.style.display = 'none';
  }, 2500);
}

function updateUI() {
  const p = gameState.battle?.playerMon;
  const e = gameState.battle?.enemyMon;
  if (!p || !e) return;

  // Update player name
  const pName = document.getElementById('player-name');
  if (pName) pName.innerText = p.name;

  const pHp = document.getElementById('player-hp-bar');
  if (pHp) {
    const pct = (p.hp / p.maxHp) * 100;
    pHp.style.width = `${pct}%`;
    pHp.classList.toggle('low', pct < 50);
    pHp.classList.toggle('critical', pct < 20);
  }

  const pXp = document.getElementById('player-xp-bar');
  if (pXp) pXp.style.width = `${(p.xp / p.xpToLevel) * 100}%`;

  const pHpText = document.getElementById('player-hp-text');
  if (pHpText) pHpText.innerText = `${p.hp}/${p.maxHp}`;

  const pLv = document.getElementById('player-level');
  if (pLv) pLv.innerText = p.level;

  // Update Enemy Info
  const eName = document.getElementById('enemy-name');
  if (eName) eName.innerText = e.name;

  const eLv = document.getElementById('enemy-level');
  if (eLv) eLv.innerText = e.level;

  const eHp = document.getElementById('enemy-hp-bar');
  if (eHp) {
    const pct = (e.hp / e.maxHp) * 100;
    eHp.style.width = `${pct}%`;
    eHp.classList.toggle('low', pct < 50);
    eHp.classList.toggle('critical', pct < 20);
  }

  // Update Enemy Sprite (Fix for enemy swap not showing)
  const eSprite = document.querySelector('.sprite.enemy');
  if (eSprite) {
    eSprite.style.backgroundImage = `url('${e.image}')`;
    if (e.hp > 0) {
      eSprite.classList.remove('fainted', 'capturing', 'hit');
      eSprite.style.display = 'block';
    }
  }

  // Update Trainer Party Dots
  if (gameState.battle.trainerData && gameState.battle.enemyParty) {
    const dots = document.querySelectorAll('.trainer-party-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === gameState.battle.currentEnemyIndex);
      dot.classList.toggle('fainted', gameState.battle.enemyParty[i].hp <= 0);
    });
  }

  const money = document.querySelector('.money');
  if (money) money.innerText = `₱${gameState.money}`;

  // Rebuild move menu to reflect PP changes
  if (document.getElementById('move-menu')) {
    buildMoveMenu();
  }
}

function log(text) {
  const d = document.getElementById('dialog-text');
  if (d) d.innerText = text;
}

// ============== ATTACK EFFECTS ==============
function createAttackEffect(isEnemy, moveType) {
  const container = document.querySelector('.battle-container');
  if (!container) return;

  // Create main burst effect
  const effect = document.createElement('div');
  effect.className = `attack-effect burst ${moveType}`;

  // Position based on target
  if (isEnemy) {
    effect.style.top = '25%';
    effect.style.right = '22%';
  } else {
    effect.style.bottom = '30%';
    effect.style.left = '20%';
  }

  container.appendChild(effect);

  // Create sparks
  for (let i = 0; i < 6; i++) {
    createSpark(container, isEnemy, i);
  }

  // Remove effect after animation
  setTimeout(() => effect.remove(), 500);
}

function createSpark(container, isEnemy, index) {
  const spark = document.createElement('div');
  spark.className = 'spark';

  // Random direction
  const angle = (index * 60) + Math.random() * 30;
  const distance = 40 + Math.random() * 40;
  const tx = Math.cos(angle * Math.PI / 180) * distance;
  const ty = Math.sin(angle * Math.PI / 180) * distance;

  spark.style.setProperty('--tx', `${tx}px`);
  spark.style.setProperty('--ty', `${ty}px`);

  if (isEnemy) {
    spark.style.top = 'calc(25% + 50px)';
    spark.style.right = 'calc(22% + 50px)';
  } else {
    spark.style.bottom = 'calc(30% + 50px)';
    spark.style.left = 'calc(20% + 100px)';
  }

  container.appendChild(spark);
  setTimeout(() => spark.remove(), 500);
}

// ============== COMBINED SHOP + REWARDS ==============
let selectedItem = null; // Item currently selected for use
let selectedItemSource = null; // 'shop' or 'reward'

function renderRewardShop(newMoves = []) {
  gameState.pendingNewMoves = newMoves;
  selectedItem = null;
  selectedItemSource = null;

  // Check for new moves to learn
  if (newMoves.length > 0) {
    renderMoveLearnScreen(newMoves[0]);
    return;
  }

  const isBoss = isBossWave(gameState.wave);

  // Cache rewards - only generate if not already cached for this wave
  if (!gameState.cachedRewards || gameState.cachedRewardsWave !== gameState.wave) {
    gameState.cachedRewards = generateFreeRewards(gameState.wave, 3);
    gameState.cachedRewardsWave = gameState.wave;
    autoSave(); // Save immediately after generating rewards
  }
  const freeRewards = gameState.cachedRewards;

  const shopItems = generateShopItems(gameState.wave);
  const rerollCost = getRerollCost(gameState.wave);

  // Heal party only on trainer wave (not regular boss waves)
  if (isTrainerWave(gameState.wave)) {
    gameState.party.forEach(mon => {
      mon.hp = mon.maxHp;
      mon.status = null;
      mon.statStages = { atk: 0, def: 0, spd: 0, acc: 0, eva: 0 };
      mon.restoreAllPp();
    });
  }

  const render = () => {
    document.querySelector('#app').innerHTML = `
      <div class="reward-shop-screen">
        <div class="rs-left">
          <!-- TOP: Shop Items -->
          <div class="rs-shop">
            <div class="rs-info">
              <div class="rs-wave">웨이브 ${gameState.wave} ${isBoss ? '(보스!)' : ''}</div>
              <div class="rs-money">₱${gameState.money}</div>
            </div>
            <div class="rs-section-title">상점 (구매 후 즉시 사용)</div>
            <div class="rs-shop-grid">
              ${shopItems.map((item, i) => `
                <div class="rs-shop-item ${selectedItem === item ? 'selected' : ''}" data-idx="${i}" data-type="shop">
                  <div class="rs-shop-icon">${item.icon}</div>
                  <div class="rs-shop-info">
                    <div class="rs-shop-name">${item.name}</div>
                    <div class="rs-shop-price">₱${item.price}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- BOTTOM: Free Rewards -->
          <div class="rs-free-rewards">
            <div class="rs-section-title">보상 선택 (1개)</div>
            <div class="rs-reward-grid" id="free-rewards">
              ${freeRewards.map((item, i) => `
                <div class="rs-reward-card ${selectedItem === item ? 'selected' : ''}" data-idx="${i}" data-type="reward">
                  <div class="rs-icon">${item.icon || '🎁'}</div>
                  <div class="rs-name">${item.name}</div>
                  <div class="rs-desc">${item.desc}</div>
                </div>
              `).join('')}
            </div>
            <div class="rs-reroll" id="reroll-btn">갱신 ₱${rerollCost}</div>
          </div>
        </div>
        
        <div class="rs-right">
          <div class="rs-section-title">${selectedItem ? '대상을 선택하세요' : '파티 정보'}</div>
          <div class="rs-party">
            ${gameState.party.map((mon, i) => `
              <div class="rs-party-slot ${selectedItem ? 'clickable' : ''}" data-index="${i}">
                <div class="rs-party-name">${mon.name} (Lv.${mon.level})</div>
                <div class="rs-party-bar"><div class="rs-party-hp" style="width:${(mon.hp / mon.maxHp) * 100}%"></div></div>
                <div class="rs-party-hp-text">${mon.hp}/${mon.maxHp}</div>
                <div class="rs-party-moves">${mon.moves.map(m => m.name).join(', ')}</div>
              </div>
            `).join('')}
          </div>
          <div class="rs-bottom">
            <div class="rs-save" id="save-btn">💾 저장</div>
            <div class="rs-continue" id="continue-btn">${selectedItem ? '취소' : '다음 웨이브 →'}</div>
          </div>
        </div>
      </div>
    `;

    // Event Listeners

    // Shop Items
    document.querySelectorAll('.rs-shop-item').forEach(el => {
      el.onclick = () => {
        const item = shopItems[el.dataset.idx];
        if (gameState.money < item.price) return;

        if (selectedItem === item) {
          selectedItem = null;
          selectedItemSource = null;
        } else {
          selectedItem = item;
          selectedItemSource = 'shop';
        }
        render();
      };
    });

    // Reward Items
    document.querySelectorAll('.rs-reward-card').forEach(el => {
      el.onclick = () => {
        const item = freeRewards[el.dataset.idx];

        // Immediate items (Balls, etc) check logic later, assuming all usable on mon for now per context
        // But actually, Balls shouldn't be usable on mon.
        if (item.type === ItemTypes.BALL || item.type === ItemTypes.TM) {
          // Balls/TMs handled differently? 
          // TMs -> showTMLearnScreen immediately?
          // Balls -> Add to inventory immediately and proceed?
          if (item.type === ItemTypes.TM) {
            showTMLearnScreen(item);
            return;
          } else {
            gameState.inventory.push(item);
            proceedAfterReward();
            return;
          }
        }

        if (selectedItem === item) {
          selectedItem = null;
          selectedItemSource = null;
        } else {
          selectedItem = item;
          selectedItemSource = 'reward';
        }
        render();
      };
    });

    // Party select
    document.querySelectorAll('.rs-party-slot').forEach(el => {
      el.onclick = () => {
        if (!selectedItem) return;
        const mon = gameState.party[el.dataset.index];

        // Validate usage
        if (selectedItem.canUse && !selectedItem.canUse(mon)) return;
        // Basic healing check
        if (selectedItem.type === ItemTypes.HEAL && mon.hp >= mon.maxHp && selectedItem.id !== 'REVIVE') return;
        if (selectedItem.id === 'REVIVE' && mon.hp > 0) return;

        // Use Item
        let msg = '';
        if (selectedItem.effect) {
          msg = selectedItem.effect(mon);
        } else if (selectedItem.type === ItemTypes.PP) {
          // Restore PP logic
          if (selectedItem.allMoves) {
            mon.restoreAllPp();
            msg = '모든 PP 회복!';
          } else {
            // Single move PP restore - show selection screen
            showPPRestoreScreen(mon, selectedItem);
            return;
          }
        }

        // Deduct cost / Complete reward
        if (selectedItemSource === 'shop') {
          gameState.money -= selectedItem.price;
          showToast(msg, 'success');
          selectedItem = null;
          selectedItemSource = null;
          render(); // Stay in shop
        } else {
          showToast(msg, 'success');
          proceedAfterReward();
        }
      };
    });

    // Reroll
    document.getElementById('reroll-btn').onclick = () => {
      if (gameState.money >= rerollCost) {
        gameState.money -= rerollCost;
        gameState.cachedRewards = null; // Clear cache to get new rewards
        renderRewardShop();
      }
    };

    // Save
    document.getElementById('save-btn').onclick = () => {
      saveGame();
    };

    // Continue / Cancel
    document.getElementById('continue-btn').onclick = () => {
      if (selectedItem) {
        selectedItem = null;
        selectedItemSource = null;
        render();
      } else {
        proceedAfterReward();
      }
    };
  };

  render();
}

function proceedAfterReward() {
  gameState.wave++;
  gameState.cachedRewards = null; // Clear rewards for next wave
  gameState.cachedEnemy = null; // Clear enemy for next wave
  gameState.waveCompleted = false; // New wave not completed yet
  autoSave(); // Auto-save before each wave
  startWave();
}

// Check if a hackemon can learn a move (same type, NORMAL type, or in their original moveset)
function canLearnMove(mon, move) {
  // Check type compatibility
  if (move.type === mon.type || move.type === 'normal') {
    return true;
  }

  // Check if the move is in the hackemon's original moveset
  const data = HackemonData[mon.id];
  if (data && data.moves) {
    const moveKey = move.key || Object.keys(Moves).find(k => Moves[k].name === move.name);
    if (moveKey && data.moves.includes(moveKey)) {
      return true;
    }
  }

  return false;
}

function showTMLearnScreen(tm) {
  // Let player choose which party member learns the move
  document.querySelector('#app').innerHTML = `
    <div class="learn-screen">
      <div class="learn-title">${tm.move.name}을(를) 누구에게 가르칠까?</div>
      <div class="learn-grid">
        ${gameState.party.map((mon, i) => {
    const canLearn = canLearnMove(mon, tm.move);
    return `
          <div class="learn-card ${canLearn ? '' : 'disabled'}" data-index="${i}">
            <div class="learn-name">${mon.name}</div>
            <div class="learn-moves">${mon.moves.map(m => m.name).join(', ')}</div>
            ${canLearn ? '' : '<div class="learn-cant">배울 수 없음</div>'}
          </div>
        `;
  }).join('')}
        <div class="learn-card skip">사용하지 않는다</div>
      </div>
    </div>
  `;

  document.querySelectorAll('.learn-card').forEach(card => {
    card.onclick = () => {
      if (card.classList.contains('skip')) {
        // Go back to reward selection instead of proceeding
        renderRewardShop();
        return;
      }
      if (card.classList.contains('disabled')) return;

      const mon = gameState.party[parseInt(card.dataset.index)];
      if (mon.moves.length < 4) {
        mon.learnMove(tm.move);
        proceedAfterReward();
      } else {
        showForgetMoveScreen(mon, tm.move, true); // true = isTM, should proceed after
      }
    };
  });
}

function renderMoveLearnScreen(data) {
  const { mon, move } = data;

  if (mon.moves.length < 4) {
    mon.learnMove(move);
    gameState.pendingNewMoves.shift();
    renderRewardShop(gameState.pendingNewMoves);
    return;
  }

  showForgetMoveScreen(mon, move);
}

function showForgetMoveScreen(mon, newMove, isTM = false) {
  document.querySelector('#app').innerHTML = `
    <div class="forget-screen">
      <div class="forget-title">${mon.name}은(는) ${newMove.name}을(를) 배우려 한다!</div>
      <div class="forget-subtitle">어떤 기술을 잊을까?</div>
      <div class="forget-grid">
        ${mon.moves.map((m, i) => `
          <div class="forget-card" data-index="${i}">
            <div class="forget-name">${m.name}</div>
            <div class="forget-type type-${m.type}">${TypeNames[m.type]}</div>
            <div class="forget-power">${m.power > 0 ? `위력:${m.power}` : '변화'}</div>
          </div>
        `).join('')}
        <div class="forget-card new">
          <div class="forget-name">★ ${newMove.name}</div>
          <div class="forget-type type-${newMove.type}">${TypeNames[newMove.type]}</div>
          <div class="forget-power">${newMove.power > 0 ? `위력:${newMove.power}` : '변화'}</div>
        </div>
        <div class="forget-card skip">배우지 않는다</div>
      </div>
    </div>
  `;

  document.querySelectorAll('.forget-card').forEach(card => {
    card.onclick = () => {
      if (card.classList.contains('skip') || card.classList.contains('new')) {
        // Don't learn
        if (isTM) {
          // If cancelling TM, go back to reward selection
          renderRewardShop(gameState.pendingNewMoves);
          return;
        }
      } else {
        const idx = parseInt(card.dataset.index);
        mon.learnMove({ ...newMove, key: newMove.key || 'TM_MOVE' }, idx);
      }

      if (isTM) {
        // TM learned - proceed to next wave
        proceedAfterReward();
      } else {
        // Level-up learning - continue with pending moves
        gameState.pendingNewMoves.shift();
        renderRewardShop(gameState.pendingNewMoves);
      }
    };
  });
}

// ============== GAME OVER / VICTORY ==============
function renderGameOver() {
  document.querySelector('#app').innerHTML = `
    <div class="gameover-overlay"></div>
    <div class="gameover-screen">
      <div class="gameover-title">게임 오버</div>
      <div class="gameover-stats">
        <div>도달 웨이브: ${gameState.wave}</div>
        <div>획득 머니: ₱${gameState.money}</div>
      </div>
      <div class="gameover-btn" id="restart-btn">다시 시작</div>
    </div>
  `;
  document.getElementById('restart-btn').onclick = resetGame;
}

function renderVictory() {
  document.querySelector('#app').innerHTML = `
    <div class="victory-screen">
      <div class="victory-title">🎉 축하합니다! 🎉</div>
      <div class="victory-subtitle">클래식 모드 클리어!</div>
      <div class="gameover-stats">
        <div>최종 웨이브: ${gameState.wave}</div>
        <div>머니: ₱${gameState.money}</div>
      </div>
      <div class="gameover-btn" id="restart-btn">다시 시작</div>
    </div>
  `;
  document.getElementById('restart-btn').onclick = resetGame;
}

function resetGame() {
  gameState = {
    phase: 'starter', wave: 1, money: 1000, party: [], inventory: [],
    battle: null, starterOptions: [], nextMoneyMultiplier: 1, pendingNewMoves: []
  };
  renderStarterSelection();
}

// ============== ENEMY STAT BONUSES ==============
function applyEnemyBonuses(enemyMon, wave) {
  const level = enemyMon.level;

  // 1. Bonus stats per level (cumulative)
  // +1 to all stats per 5 levels
  const statBonusPerLevel = Math.floor(level / 5);
  enemyMon.attack += statBonusPerLevel * 2;
  enemyMon.defense += statBonusPerLevel * 2;
  enemyMon.speed += statBonusPerLevel;

  // 2. HP scaling based on wave (reaches 2x+ at level 40+)
  // Formula: HP multiplier = 1 + (wave * 0.02) + (level > 40 ? (level - 40) * 0.03 : 0)
  // At wave 50, level 40: 1 + 1.0 = 2.0x HP
  // At wave 70, level 50: 1 + 1.4 + 0.3 = 2.7x HP
  let hpMultiplier = 1;

  // Wave-based HP scaling
  hpMultiplier += wave * 0.015;

  // Level-based HP scaling (kicks in hard after level 40)
  if (level > 40) {
    hpMultiplier += (level - 40) * 0.025;
  }

  // Boss wave extra HP
  if (isBossWave(wave)) {
    hpMultiplier += 0.4;
  }

  // Apply HP multiplier
  enemyMon.maxHp = Math.floor(enemyMon.maxHp * hpMultiplier);
  enemyMon.hp = enemyMon.maxHp;
}

// ============== GAME FLOW ==============
function startWave() {
  gameState.phase = 'battle';

  const trainerData = getTrainerForWave(gameState.wave);
  let enemyMon = null;

  if (!trainerData) {
    // Use cached enemy if available (for save/load), otherwise generate new
    if (gameState.cachedEnemy && gameState.cachedEnemyWave === gameState.wave) {
      // Reconstruct enemy from cache with boosted stats
      const cached = gameState.cachedEnemy;
      enemyMon = new Hackemon(cached.id, cached.level);
      enemyMon.hp = cached.hp;
      if (cached.maxHp) enemyMon.maxHp = cached.maxHp;
      if (cached.attack) enemyMon.attack = cached.attack;
      if (cached.defense) enemyMon.defense = cached.defense;
      if (cached.speed) enemyMon.speed = cached.speed;
    } else {
      const keys = Object.keys(HackemonData);
      const enemyKey = keys[Math.floor(Math.random() * keys.length)];

      // Base level on player's party average level with range -1 to +2
      const aliveParty = gameState.party.filter(m => m.hp > 0);
      const avgLevel = aliveParty.length > 0
        ? Math.floor(aliveParty.reduce((sum, m) => sum + m.level, 0) / aliveParty.length)
        : gameState.party[0]?.level || 5;
      const maxPlayerLevel = Math.max(...gameState.party.map(m => m.level));

      // Dynamic Level Scaling - gets harder as game progresses
      // Early game (wave 1-30): +1 per 10 waves
      // Mid game (wave 31-60): +1 per 7 waves
      // Late game (wave 61-100): +1 per 5 waves
      // End game (wave 101+): +1 per 3 waves
      let waveScaling = 0;
      const wave = gameState.wave;
      if (wave <= 30) {
        waveScaling = Math.floor(wave * 0.1);
      } else if (wave <= 60) {
        waveScaling = 7 + Math.floor((wave - 30) * 0.18); // ~1 per 7 waves
      } else if (wave <= 100) {
        waveScaling = 12 + Math.floor((wave - 60) * 0.25); // ~1 per 5 waves
      } else {
        waveScaling = 20 + Math.floor((wave - 100) * 0.33); // ~1 per 3 waves
      }

      // Additional scaling based on max player level (catch up mechanic)
      // If player is high level, enemies scale faster
      const levelCatchUp = maxPlayerLevel > 40 ? Math.floor((maxPlayerLevel - 40) * 0.15) : 0;

      const levelVariance = Math.floor(Math.random() * 4) - 1; // -1 to +2
      let baseLevel = Math.max(1, avgLevel + waveScaling + levelCatchUp + levelVariance);

      // Boss wave: max player level * 1.15~1.35 (increased from 1.10~1.25)
      let level;
      if (isBossWave(gameState.wave)) {
        const bossMultiplier = 1.15 + Math.random() * 0.20; // 1.15 to 1.35
        level = Math.floor(maxPlayerLevel * bossMultiplier);
      } else {
        level = baseLevel;
      }
      enemyMon = new Hackemon(enemyKey, level);

      // Apply enemy stat bonuses based on level and wave
      applyEnemyBonuses(enemyMon, gameState.wave);

      // Cache the enemy with boosted stats
      gameState.cachedEnemy = {
        id: enemyKey,
        level: level,
        hp: enemyMon.hp,
        maxHp: enemyMon.maxHp,
        attack: enemyMon.attack,
        defense: enemyMon.defense,
        speed: enemyMon.speed
      };
      gameState.cachedEnemyWave = gameState.wave;
      autoSave(); // Save newly generated enemy immediately
    }
  }

  gameState.battle = new Battle(
    gameState.party,
    enemyMon,
    gameState,
    {
      onLog: log,
      onUpdateUI: updateUI,
      onStatGain: showStatGain,
      onAttackAnim: (isPlayer, moveType) => {
        const sprite = document.querySelector(isPlayer ? '.sprite.player' : '.sprite.enemy');
        if (sprite) {
          sprite.classList.add('attacking');
          setTimeout(() => sprite.classList.remove('attacking'), 500);
        }
      },
      onHitAnim: (isEnemy, isCrit, moveType) => {
        const sprite = document.querySelector(isEnemy ? '.sprite.enemy' : '.sprite.player');
        if (sprite) {
          sprite.classList.add('hit');
          if (isCrit) sprite.classList.add('crit');
          setTimeout(() => {
            sprite.classList.remove('hit', 'crit');
          }, 500);
        }
        // Create attack effect
        createAttackEffect(isEnemy, moveType);
      },
      onBallThrow: (ballType) => {
        return new Promise(resolve => {
          const container = document.querySelector('.battle-container');
          const enemySprite = document.querySelector('.sprite.enemy');
          if (!container || !enemySprite) { resolve(); return; }

          // Hide enemy and show ball
          enemySprite.classList.add('capturing');

          const ball = document.createElement('div');
          ball.className = 'pokeball throwing';

          // Apply ball type class
          if (ballType === 'GREAT_BALL') ball.classList.add('great-ball');
          else if (ballType === 'ULTRA_BALL') ball.classList.add('ultra-ball');

          container.appendChild(ball);

          setTimeout(() => {
            enemySprite.style.display = 'none';
            ball.classList.remove('throwing');
            ball.classList.add('at-rest');
            resolve();
          }, 800);
        });
      },
      onBallShake: (shakeIndex) => {
        return new Promise(resolve => {
          const ball = document.querySelector('.pokeball');
          if (!ball) { resolve(); return; }

          // Just shake animation, no stars
          ball.classList.add('wiggle');

          setTimeout(() => {
            ball.classList.remove('wiggle');
            resolve();
          }, 800);
        });
      },
      onCaptureSuccess: () => {
        return new Promise(resolve => {
          const container = document.querySelector('.battle-container');
          const ball = document.querySelector('.pokeball');

          if (container && ball) {
            // Show 3 stars above the ball
            for (let i = 0; i < 3; i++) {
              const star = document.createElement('div');
              star.className = 'capture-star-fixed';
              star.style.right = `calc(23% + ${(i - 1) * 20}px)`;
              star.style.bottom = 'calc(38% + 40px)';
              star.style.animationDelay = `${i * 0.15}s`;
              container.appendChild(star);
            }

            // After stars appear, burst effect
            setTimeout(() => {
              for (let i = 0; i < 6; i++) {
                const burst = document.createElement('div');
                burst.className = 'capture-star';
                burst.style.right = `calc(23% + ${(Math.random() - 0.5) * 50}px)`;
                burst.style.bottom = `calc(38% + ${(Math.random() - 0.5) * 50}px)`;
                container.appendChild(burst);
                setTimeout(() => burst.remove(), 600);
              }
            }, 500);

            setTimeout(() => {
              container.querySelectorAll('.capture-star-fixed').forEach(s => s.remove());
              ball.remove();
              resolve();
            }, 1000);
          } else {
            resolve();
          }
        });
      },
      onCaptureFail: () => {
        return new Promise(resolve => {
          const container = document.querySelector('.battle-container');
          const enemySprite = document.querySelector('.sprite.enemy');
          const ball = document.querySelector('.pokeball');

          // Remove stars
          container?.querySelectorAll('.capture-star-fixed').forEach(s => s.remove());

          if (ball && container) {
            // Add escape effect
            ball.classList.add('escaping');

            const flash = document.createElement('div');
            flash.className = 'escape-flash';
            flash.style.right = '23%';
            flash.style.bottom = '38%';
            container.appendChild(flash);

            setTimeout(() => {
              flash.remove();
              ball.remove();
            }, 500);
          }

          if (enemySprite) {
            setTimeout(() => {
              enemySprite.style.display = '';
              enemySprite.classList.remove('capturing');
              enemySprite.classList.add('emerging');
              setTimeout(() => {
                enemySprite.classList.remove('emerging');
                resolve();
              }, 600);
            }, 300);
          } else {
            resolve();
          }
        });
      },
      onFaint: (isEnemy) => {
        const sprite = document.querySelector(isEnemy ? '.sprite.enemy' : '.sprite.player');
        if (sprite) {
          sprite.classList.add('fainted');
        }
      },
      onWaveComplete: (newMoves) => {
        // Mark wave as completed and save
        gameState.waveCompleted = true;
        gameState.lastActiveIndex = gameState.battle.activeIndex;
        autoSave(); // Save completed state

        if (gameState.wave >= 200 && trainerData?.isFinalBoss) {
          renderVictory();
          return;
        }
        setTimeout(() => renderRewardShop(newMoves || []), 1000);
      },
      onPartyFull: (newMon) => {
        return new Promise(resolve => {
          showPartyFullScreen(newMon, resolve);
        });
      },
      onGameOver: () => setTimeout(renderGameOver, 1500),
      onForceSwitch: () => { showMenu('party'); buildPartyMenu(); }
    },
    trainerData,
    gameState.lastActiveIndex
  );

  renderBattle();
  setTimeout(() => log(`${gameState.battle.playerMon.name}은(는) 무엇을 할까?`), 2000);
}

// ============== START ==============
renderMainMenu();

function showPPRestoreScreen(mon, item) {
  document.querySelector('#app').innerHTML = `
    <div class="forget-screen">
      <div class="forget-title">${mon.name}의 PP를 회복합니다</div>
      <div class="forget-subtitle">${item.name}: ${item.desc}</div>
      <div class="forget-grid">
        ${mon.moves.map((m, i) => `
          <div class="forget-card ${m.currentPp >= m.pp ? 'disabled' : ''}" data-index="${i}">
            <div class="forget-name">${m.name}</div>
            <div class="forget-type type-${m.type}">${TypeNames[m.type]}</div>
            <div class="forget-power">PP ${m.currentPp}/${m.pp}</div>
          </div>
        `).join('')}
        <div class="forget-card skip">취소</div>
      </div>
    </div>
  `;

  document.querySelectorAll('.forget-card').forEach(card => {
    card.onclick = () => {
      if (card.classList.contains('skip')) {
        renderRewardShop(); // Cancel and go back
        return;
      }
      if (card.classList.contains('disabled')) return;

      const idx = parseInt(card.dataset.index);

      // Apply Item
      mon.restorePp(idx, item.ppRestore || 10);
      showToast(`${mon.name}의 ${mon.moves[idx].name} PP가 회복되었습니다!`, 'success');

      // Track source before clearing
      const wasReward = selectedItemSource === 'reward';

      // Consume Item Logic (Manual consumption since handling UI)
      if (selectedItemSource === 'shop') {
        gameState.money -= item.price;
      } else if (selectedItemSource === 'reward') {
        // Remove from cached rewards
        const rewards = gameState.cachedRewards;
        const rewardIdx = rewards.indexOf(item);
        if (rewardIdx >= 0) rewards.splice(rewardIdx, 1);
      }

      selectedItem = null;
      selectedItemSource = null;

      // If it was a reward item, proceed to next wave. If shop, stay in shop.
      if (wasReward) {
        proceedAfterReward();
      } else {
        renderRewardShop();
      }
    };
  });
}

function showPartyFullScreen(newMon, resolve) {
  document.querySelector('#app').innerHTML = `
    <div class="forget-screen">
      <div class="forget-title">파티가 꽉 찼습니다!</div>
      <div class="forget-subtitle">새로운 학켓몬: ${newMon.name} (Lv.${newMon.level})</div>
      <div class="forget-grid">
         <div class="party-full-options">
           <div class="menu-btn" id="release-btn">그냥 놓아준다</div>
           <div class="menu-btn" id="swap-btn">멤버와 교체한다</div>
         </div>
         <div id="swap-list" style="display:none; width: 100%;">
            ${gameState.party.map((mon, i) => `
              <div class="forget-card" data-index="${i}">
                <div class="forget-name">${mon.name} (Lv.${mon.level})</div>
                <div class="forget-power">HP ${mon.hp}/${mon.maxHp}</div>
              </div>
            `).join('')}
         </div>
      </div>
    </div>
  `;

  document.getElementById('release-btn').onclick = () => {
    if (confirm(`${newMon.name}을(를) 놓아주겠습니까?`)) {
      showToast(`${newMon.name}에게 작별 인사를 했다.`, 'info');
      resolve();
    }
  };

  document.getElementById('swap-btn').onclick = () => {
    document.querySelector('.party-full-options').style.display = 'none';
    document.getElementById('swap-list').style.display = 'block';
  };

  document.querySelectorAll('#swap-list .forget-card').forEach(card => {
    card.onclick = () => {
      const idx = parseInt(card.dataset.index);
      const oldMon = gameState.party[idx];

      if (confirm(`${oldMon.name}을(를) 떠나보내고 ${newMon.name}을(를) 영입하겠습니까?`)) {
        gameState.party[idx] = newMon;
        showToast(`${oldMon.name}과 작별하고 ${newMon.name}이(가) 합류했다!`, 'success');
        resolve();
      }
    };
  });
}
