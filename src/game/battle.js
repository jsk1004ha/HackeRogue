
import { TypeChart, Hackemon, HackemonData, Abilities } from '../hackemon.js';
import { getTrainerForWave } from './items.js';

export class Battle {
    constructor(playerParty, enemyMon, gameState, callbacks, trainerData = null, startingIndex = 0) {
        this.playerParty = playerParty;
        // Use startingIndex, but fallback to first alive mon if that one is fainted
        let idx = startingIndex;
        if (playerParty[idx]?.hp <= 0) {
            idx = playerParty.findIndex(m => m.hp > 0);
            if (idx < 0) idx = 0;
        }
        this.activeIndex = idx;
        this.enemyMon = enemyMon;
        this.enemyParty = trainerData ? [] : null;
        this.currentEnemyIndex = 0;
        this.trainerData = trainerData;
        this.gameState = gameState;
        this.callbacks = callbacks;
        this.turn = 1;
        this.ended = false;
        this.caught = false;
        this.isProcessingTurn = false;
        this.pendingUturnSwitch = null; // Index of mon to switch to after U-turn attack

        if (trainerData) {
            // Calculate average level of player party
            const alive = playerParty.filter(m => m.hp > 0);
            const avgLevel = alive.length > 0
                ? Math.floor(alive.reduce((sum, m) => sum + m.level, 0) / alive.length)
                : playerParty[0]?.level || 5;

            const baseLevel = avgLevel + trainerData.levelBonus;

            trainerData.party.forEach(id => {
                const mon = new Hackemon(id, baseLevel);
                this.enemyParty.push(mon);
            });
            this.enemyMon = this.enemyParty[0];
        }

        // Apply entry abilities
        this.applyEntryAbility(this.playerMon, this.enemyMon);
    }

    get playerMon() {
        return this.playerParty[this.activeIndex];
    }

    applyEntryAbility(entering, opponent) {
        if (!entering.ability) return;
        const ab = Abilities[entering.ability];
        if (!ab) return;

        if (ab.effect === 'on_entry_debuff_atk') {
            opponent.statStages.atk = Math.max(-3, opponent.statStages.atk - 1);
            this.callbacks.onLog(`${entering.name}의 ${ab.name}! ${opponent.name}의 공격이 떨어졌다!`);
        }
    }

    getAlivePartyMembers() {
        return this.playerParty.filter(m => m.hp > 0);
    }

    canSwitch() {
        return this.getAlivePartyMembers().length > 1;
    }

    // Select a move for enemy that has PP remaining
    selectEnemyMove() {
        const availableMoves = this.enemyMon.moves
            .map((m, i) => ({ move: m, index: i }))
            .filter(({ move }) => move.currentPp > 0);

        if (availableMoves.length === 0) {
            // No PP left - use Struggle (special move)
            return {
                move: { name: '발버둥', type: 'normal', power: 50, accuracy: 100, pp: 1, currentPp: 1, recoil: true, desc: 'PP가 없어 발버둥친다!' },
                index: -1
            };
        }

        const selected = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        return { move: selected.move, index: selected.index };
    }

    async switchTo(index) {
        if (this.isProcessingTurn) return false;
        if (index === this.activeIndex || this.playerParty[index].hp <= 0) return false;

        const oldMon = this.playerMon;
        this.activeIndex = index;
        this.callbacks.onLog(`${oldMon.name}, 돌아와! 가라, ${this.playerMon.name}!`);

        // Reset switched mon's stat stages
        this.playerMon.statStages = { atk: 0, def: 0, spd: 0, acc: 0, eva: 0 };

        // Apply entry ability
        this.applyEntryAbility(this.playerMon, this.enemyMon);

        this.callbacks.onUpdateUI();
        await this.wait(1000);

        // Switching no longer consumes a turn - player can act again
        return true;
    }

    async useBall(ballItem) {
        if (this.isProcessingTurn) return false;
        if (this.trainerData) {
            this.callbacks.onLog('트레이너의 학켓몬은 잡을 수 없다!');
            await this.wait(800);
            return false;
        }

        const ballIndex = this.gameState.inventory.findIndex(i => i.id === ballItem.id);
        if (ballIndex === -1) {
            this.callbacks.onLog('학볼이 없다!');
            return false;
        }
        this.gameState.inventory.splice(ballIndex, 1);

        this.callbacks.onLog(`${ballItem.name}을(를) 던졌다!`);

        // Trigger ball throw animation
        if (this.callbacks.onBallThrow) {
            await this.callbacks.onBallThrow(ballItem.id);
        }
        await this.wait(200);

        const hpPercent = this.enemyMon.hp / this.enemyMon.maxHp;
        const baseCatchRate = (1 - hpPercent) * 0.5 + 0.1;
        const finalRate = baseCatchRate * ballItem.catchRate;

        // Ball shake animation (1-3 times based on how close to catching)
        const shakeCount = Math.min(3, Math.floor(Math.random() * 3) + 1);
        if (this.callbacks.onBallShake) {
            for (let i = 0; i < shakeCount; i++) {
                await this.callbacks.onBallShake(i);
                await this.wait(700);
            }
        }

        if (Math.random() < finalRate) {
            // Capture success animation
            if (this.callbacks.onCaptureSuccess) {
                await this.callbacks.onCaptureSuccess();
            }

            this.callbacks.onLog(`잡았다! ${this.enemyMon.name}을(를) 잡았다!`);
            this.caught = true;
            this.ended = true;

            // Reset enemy stats to original (remove enemy bonuses)
            this.enemyMon.recalculateStats();
            this.enemyMon.hp = this.enemyMon.maxHp;

            // Restore PP to normal (enemy had 2x consumption)
            this.enemyMon.restoreAllPp();

            if (this.playerParty.length < 6) {
                this.playerParty.push(this.enemyMon);
                this.callbacks.onLog(`${this.enemyMon.name}이(가) 파티에 합류했다!`);
            } else {
                if (this.callbacks.onPartyFull) {
                    await this.callbacks.onPartyFull(this.enemyMon);
                } else {
                    this.callbacks.onLog('파티가 꽉 찼다... (놓아주었다)');
                }
            }

            await this.wait(1500);
            this.callbacks.onWaveComplete();
            return true;
        } else {
            // Capture failed animation
            if (this.callbacks.onCaptureFail) {
                await this.callbacks.onCaptureFail();
            }

            this.callbacks.onLog('안돼! 빠져나왔다!');
            await this.wait(800);
            await this.enemyTurn();
            return false;
        }
    }

    async executeTurn(moveIndex) {
        if (this.ended || this.isProcessingTurn) return;
        this.isProcessingTurn = true;

        const playerMove = this.playerMon.moves[moveIndex];
        if (!playerMove) return;

        // Check PP
        if (playerMove.currentPp <= 0) {
            this.callbacks.onLog('PP가 없어서 기술을 쓸 수 없다!');
            return;
        }

        const playerStunned = this.processStartTurnStatus(this.playerMon);
        const enemyMoveResult = this.selectEnemyMove();
        const enemyMove = enemyMoveResult.move;
        const enemyMoveIndex = enemyMoveResult.index;

        // Speed check with ability
        let playerSpeed = this.playerMon.speed;
        let enemySpeed = this.enemyMon.speed;
        if (this.playerMon.statStages.spd > 0) playerSpeed *= 1.5;
        if (this.enemyMon.statStages.spd > 0) enemySpeed *= 1.5;

        // Crisis Speed ability (Maknae Power) - HP 50% 이하시 스피드 +50%
        if (this.playerMon.ability === 'MAKNAE_POWER' && this.playerMon.hp <= this.playerMon.maxHp * 0.5) {
            playerSpeed *= Abilities[this.playerMon.ability].value;
        }
        if (this.enemyMon.ability === 'MAKNAE_POWER' && this.enemyMon.hp <= this.enemyMon.maxHp * 0.5) {
            enemySpeed *= Abilities[this.enemyMon.ability].value;
        }

        const playerFirst = playerSpeed >= enemySpeed;

        if (playerFirst) {
            if (!playerStunned) await this.performAttack(this.playerMon, this.enemyMon, playerMove, moveIndex);
            if (this.enemyMon.hp <= 0) { await this.handleEnemyFaint(); return; }

            const enemyStunned = this.processStartTurnStatus(this.enemyMon);
            if (!enemyStunned) await this.performAttack(this.enemyMon, this.playerMon, enemyMove, enemyMoveIndex);
            if (this.playerMon.hp <= 0) { await this.handlePlayerFaint(); return; }
        } else {
            const enemyStunned = this.processStartTurnStatus(this.enemyMon);
            if (!enemyStunned) await this.performAttack(this.enemyMon, this.playerMon, enemyMove, enemyMoveIndex);
            if (this.playerMon.hp <= 0) { await this.handlePlayerFaint(); return; }

            // Re-check player stun status after enemy attack (in case player got stunned this turn)
            const playerNowStunned = this.playerMon.status === 'stun';
            if (playerNowStunned) {
                this.callbacks.onLog(`${this.playerMon.name}은(는) 기절하여 움직일 수 없다!`);
                this.playerMon.status = null;
            } else if (!playerStunned) {
                await this.performAttack(this.playerMon, this.enemyMon, playerMove, moveIndex);
            }
            if (this.enemyMon.hp <= 0) { await this.handleEnemyFaint(); return; }
        }

        await this.processEndTurn(this.playerMon);
        if (this.playerMon.hp <= 0) { await this.handlePlayerFaint(); return; }

        await this.processEndTurn(this.enemyMon);
        if (this.enemyMon.hp <= 0) { await this.handleEnemyFaint(); return; }

        this.turn++;
        this.isProcessingTurn = false;

        // Show action prompt after turn ends
        await this.wait(500);
        this.callbacks.onLog(`${this.playerMon.name}은(는) 무엇을 할까?`);
    }

    // Execute turn with U-turn (switch after attack)
    async executeUturnTurn(moveIndex, switchToIndex) {
        if (this.ended || this.isProcessingTurn) return;
        this.isProcessingTurn = true;
        this.pendingUturnSwitch = switchToIndex;

        const playerMove = this.playerMon.moves[moveIndex];
        if (!playerMove) return;

        if (playerMove.currentPp <= 0) {
            this.callbacks.onLog('PP가 없어서 기술을 쓸 수 없다!');
            this.isProcessingTurn = false;
            return;
        }

        const playerStunned = this.processStartTurnStatus(this.playerMon);
        const enemyMoveResult = this.selectEnemyMove();
        const enemyMove = enemyMoveResult.move;
        const enemyMoveIndex = enemyMoveResult.index;

        let playerSpeed = this.playerMon.speed;
        let enemySpeed = this.enemyMon.speed;
        if (this.playerMon.statStages.spd > 0) playerSpeed *= 1.5;
        if (this.enemyMon.statStages.spd > 0) enemySpeed *= 1.5;

        // Crisis Speed ability (Maknae Power) - HP 50% 이하시 스피드 +50%
        if (this.playerMon.ability === 'MAKNAE_POWER' && this.playerMon.hp <= this.playerMon.maxHp * 0.5) {
            playerSpeed *= Abilities[this.playerMon.ability].value;
        }
        if (this.enemyMon.ability === 'MAKNAE_POWER' && this.enemyMon.hp <= this.enemyMon.maxHp * 0.5) {
            enemySpeed *= Abilities[this.enemyMon.ability].value;
        }

        const playerFirst = playerSpeed >= enemySpeed;

        if (playerFirst) {
            // Player attacks first -> switch -> enemy attacks new mon
            if (!playerStunned) await this.performAttack(this.playerMon, this.enemyMon, playerMove, moveIndex);
            if (this.enemyMon.hp <= 0) { await this.handleEnemyFaint(); return; }

            // U-turn switch before enemy attacks
            await this.performUturnSwitch();

            const enemyStunned = this.processStartTurnStatus(this.enemyMon);
            if (!enemyStunned) await this.performAttack(this.enemyMon, this.playerMon, enemyMove, enemyMoveIndex);
            if (this.playerMon.hp <= 0) { await this.handlePlayerFaint(); return; }
        } else {
            // Enemy attacks first -> player attacks -> switch
            const enemyStunned = this.processStartTurnStatus(this.enemyMon);
            if (!enemyStunned) await this.performAttack(this.enemyMon, this.playerMon, enemyMove, enemyMoveIndex);
            if (this.playerMon.hp <= 0) { await this.handlePlayerFaint(); return; }

            // Re-check player stun status after enemy attack (in case player got stunned this turn)
            const playerNowStunned = this.playerMon.status === 'stun';
            if (playerNowStunned) {
                this.callbacks.onLog(`${this.playerMon.name}은(는) 기절하여 움직일 수 없다!`);
                this.playerMon.status = null;
            } else if (!playerStunned) {
                await this.performAttack(this.playerMon, this.enemyMon, playerMove, moveIndex);
            }
            if (this.enemyMon.hp <= 0) { await this.handleEnemyFaint(); return; }

            // U-turn switch after player attacks
            await this.performUturnSwitch();
        }

        await this.processEndTurn(this.playerMon);
        if (this.playerMon.hp <= 0) { await this.handlePlayerFaint(); return; }

        await this.processEndTurn(this.enemyMon);
        if (this.enemyMon.hp <= 0) { await this.handleEnemyFaint(); return; }

        this.turn++;
        this.isProcessingTurn = false;
        this.pendingUturnSwitch = null;

        await this.wait(500);
        this.callbacks.onLog(`${this.playerMon.name}은(는) 무엇을 할까?`);
    }

    async performUturnSwitch() {
        if (this.pendingUturnSwitch === null) return;
        if (this.pendingUturnSwitch === this.activeIndex) return;
        if (this.playerParty[this.pendingUturnSwitch].hp <= 0) return;

        const oldMon = this.playerMon;
        this.activeIndex = this.pendingUturnSwitch;

        // Update UI first so image changes immediately
        this.callbacks.onUpdateUI();
        if (this.callbacks.onUturnSwitch) {
            this.callbacks.onUturnSwitch();
        }

        this.callbacks.onLog(`${oldMon.name}, 돌아와! 가라, ${this.playerMon.name}!`);
        await this.wait(500);

        this.playerMon.statStages = { atk: 0, def: 0, spd: 0, acc: 0, eva: 0 };
        this.applyEntryAbility(this.playerMon, this.enemyMon);
        this.callbacks.onUpdateUI();
        await this.wait(500);

        this.pendingUturnSwitch = null;
    }

    async enemyTurn() {
        const enemyMoveResult = this.selectEnemyMove();
        const enemyMove = enemyMoveResult.move;
        const enemyMoveIndex = enemyMoveResult.index;
        const enemyStunned = this.processStartTurnStatus(this.enemyMon);

        if (!enemyStunned) {
            await this.performAttack(this.enemyMon, this.playerMon, enemyMove, enemyMoveIndex);
        }

        if (this.playerMon.hp <= 0) await this.handlePlayerFaint();
    }

    processStartTurnStatus(mon) {
        if (mon.status === 'stun') {
            this.callbacks.onLog(`${mon.name}은(는) 기절하여 움직일 수 없다!`);
            mon.status = null;
            return true;
        }
        if (mon.status === 'sleep') {
            mon.statusDuration--;
            if (mon.statusDuration <= 0) {
                mon.status = null;
                this.callbacks.onLog(`${mon.name}은(는) 일어났다!`);
                return false;
            }
            this.callbacks.onLog(`${mon.name}은(는) 잠들어 있다...`);
            return true;
        }
        return false;
    }

    async processEndTurn(mon) {
        // DoT damage
        if (mon.status === 'dot') {
            const dmg = Math.floor(mon.maxHp / 8);
            mon.hp = Math.max(0, mon.hp - dmg);
            this.callbacks.onLog(`${mon.name}은(는) 지속 피해를 받았다! (-${dmg})`);
            this.callbacks.onUpdateUI();
            await this.wait(800);
            mon.statusDuration--;
            if (mon.statusDuration <= 0) mon.status = null;
        }

        // Speed Boost ability
        if (mon.ability && Abilities[mon.ability]?.effect === 'speed_up_each_turn') {
            mon.statStages.spd = Math.min(3, mon.statStages.spd + 1);
            this.callbacks.onLog(`${mon.name}의 ${Abilities[mon.ability].name}! 스피드가 올랐다!`);
            await this.wait(500);
        }
    }

    async performAttack(attacker, defender, move, moveIndex) {
        // Consume PP
        if (moveIndex >= 0) {
            if (attacker === this.playerMon) {
                // Player: normal PP consumption
                attacker.moves[moveIndex].currentPp--;
            } else {
                // Enemy: 2x PP consumption
                attacker.moves[moveIndex].currentPp = Math.max(0, attacker.moves[moveIndex].currentPp - 2);
            }
        }

        this.callbacks.onLog(`${attacker.name}의 ${move.name}!`);
        await this.wait(800);

        // Accuracy check - skip for self-target moves (buffs, heals)
        const isSelfTarget = move.power === 0 && move.effect?.startsWith('buff') ||
            move.effect === 'heal' ||
            move.effect === 'full_heal_sleep';

        if (!isSelfTarget) {
            let acc = move.accuracy;
            if (attacker.statStages.acc < 0) acc *= 0.7;
            if (defender.statStages.eva > 0) acc *= 0.7;

            if (Math.random() * 100 >= acc) {
                this.callbacks.onLog('...빗나갔다!');
                await this.wait(800);
                return;
            }
        }

        // Trigger attack animation
        const isPlayerAttacking = attacker === this.playerMon;
        if (this.callbacks.onAttackAnim) {
            this.callbacks.onAttackAnim(isPlayerAttacking, move.type);
        }

        // Status moves
        if (move.power === 0) {
            await this.handleStatusMove(attacker, defender, move);
            return;
        }

        // Critical hit calculation
        let critStage = 0;
        if (move.highCrit) critStage++;
        if (attacker.ability === 'SNIPER') critStage++;

        const critRates = [1 / 24, 1 / 8, 1 / 2, 1];
        const critChance = critRates[Math.min(critStage, 3)];
        const isCrit = Math.random() < critChance;

        // Damage calculation
        let effectiveness = 1;
        const typeData = TypeChart[move.type];
        if (typeData) {
            if (typeData.strong.includes(defender.type)) effectiveness = 2;
            if (typeData.weak.includes(defender.type)) effectiveness = 0.5;
        }

        // STAB (Same Type Attack Bonus)
        let stab = move.type === attacker.type ? 1.5 : 1;
        if (attacker.ability === 'ADAPTABILITY' && move.type === attacker.type) {
            stab = 2;
        }

        // Attack stat with stages
        let atkStat = attacker.attack;
        if (!isCrit && attacker.statStages.atk < 0) atkStat *= 0.7;
        else if (attacker.statStages.atk > 0) atkStat *= (1 + attacker.statStages.atk * 0.25);

        // Guts ability
        if (attacker.ability === 'GUTS' && attacker.status) {
            atkStat *= 1.5;
        }

        // Crisis Attack ability (Luffy Power) - HP 30% 이하시 공격 +80%
        if (attacker.ability === 'LUFFY_POWER' && attacker.hp <= attacker.maxHp * 0.3) {
            atkStat *= Abilities[attacker.ability].value;
        }

        // Defense stat
        let defStat = defender.defense;
        if (!isCrit && defender.statStages.def > 0) defStat *= (1 + defender.statStages.def * 0.25);
        else if (defender.statStages.def < 0) defStat *= 0.7;

        // Thick Fat ability
        if (defender.ability === 'THICK_FAT') {
            defStat *= 1.1;
        }

        // Crit damage
        let critMultiplier = 1;
        if (isCrit) {
            critMultiplier = attacker.ability === 'SNIPER' ? 2.25 : 1.5;
        }

        const baseDamage = (((2 * attacker.level) / 5 + 2) * move.power * (atkStat / defStat)) / 50 + 2;
        let damage = Math.floor(baseDamage * effectiveness * stab * critMultiplier * (0.85 + Math.random() * 0.15));

        // Sturdy ability
        if (defender.ability === 'STURDY' && defender.hp === defender.maxHp && damage >= defender.hp) {
            damage = defender.hp - 1;
            this.callbacks.onLog(`${defender.name}의 옹골참!`);
            await this.wait(500);
        }

        defender.hp = Math.max(0, defender.hp - damage);

        // Trigger hit animation
        const isDefenderPlayer = defender === this.playerMon;
        if (this.callbacks.onHitAnim) {
            this.callbacks.onHitAnim(!isDefenderPlayer, isCrit, move.type);
        }

        this.callbacks.onUpdateUI();

        if (isCrit) {
            this.callbacks.onLog('급소에 맞았다!');
            await this.wait(500);
        }
        if (effectiveness > 1) this.callbacks.onLog('효과가 굉장했다!');
        else if (effectiveness < 1) this.callbacks.onLog('효과가 별로인 듯하다...');

        await this.wait(800);

        // Secondary effects
        if (move.effect === 'stun' && Math.random() < 0.3) {
            defender.status = 'stun';
            this.callbacks.onLog(`${defender.name}은(는) 기절했다!`);
            await this.wait(500);
        } else if (move.effect === 'dot') {
            defender.status = 'dot';
            defender.statusDuration = 3;
            this.callbacks.onLog(`${defender.name}에게 지속 피해!`);
            await this.wait(500);
        } else if (move.effect === 'drain') {
            const healAmount = Math.floor(damage / 2);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
            this.callbacks.onLog(`${attacker.name}은(는) 체력을 흡수했다!`);
            this.callbacks.onUpdateUI();
            await this.wait(500);
        }

        if (move.recoil) {
            const recoilDmg = Math.floor(damage / 3);
            attacker.hp = Math.max(0, attacker.hp - recoilDmg);
            this.callbacks.onLog(`${attacker.name}은(는) 반동 데미지를 받았다!`);
            this.callbacks.onUpdateUI();
            await this.wait(500);
        }

        // Moxie ability
        if (attacker.ability === 'MOXIE' && defender.hp <= 0) {
            attacker.statStages.atk = Math.min(3, attacker.statStages.atk + 1);
            this.callbacks.onLog(`${attacker.name}의 자기과신! 공격이 올랐다!`);
            await this.wait(500);
        }
    }

    async handleStatusMove(attacker, defender, move) {
        if (move.effect?.startsWith('buff')) {
            this.applyBuff(attacker, move.effect);
        } else if (move.effect?.startsWith('debuff')) {
            this.applyDebuff(defender, move.effect);
        } else if (move.effect === 'heal') {
            const heal = Math.floor(attacker.maxHp * 0.25);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            this.callbacks.onLog(`${attacker.name}의 체력이 회복되었다! (+${heal})`);
        } else if (move.effect === 'heal_50') {
            const heal = Math.floor(attacker.maxHp * 0.5);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            this.callbacks.onLog(`${attacker.name}의 체력이 회복되었다! (+${heal})`);
        } else if (move.effect === 'full_heal_sleep') {
            attacker.hp = attacker.maxHp;
            attacker.status = 'sleep';
            attacker.statusDuration = 2;
            this.callbacks.onLog(`${attacker.name}은(는) 잠들어 HP가 전부 회복되었다!`);
        } else if (move.effect === 'stun') {
            if (Math.random() < 0.7) {
                defender.status = 'stun';
                this.callbacks.onLog(`${defender.name}은(는) 기절했다!`);
            } else {
                this.callbacks.onLog('하지만 실패했다...');
            }
        } else if (move.effect === 'money') {
            this.gameState.nextMoneyMultiplier = 2;
            this.callbacks.onLog('다음 승리 시 돈 2배!');
        } else if (move.effect === 'heal_30') {
            const heal = Math.floor(attacker.maxHp * 0.3);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            this.callbacks.onLog(`${attacker.name}의 체력이 회복되었다! (+${heal})`);
        }
        this.callbacks.onUpdateUI();
        await this.wait(800);
    }

    applyBuff(mon, effect) {
        const buffs = { 'buff_atk': 'atk', 'buff_def': 'def', 'buff_eva': 'eva', 'buff_spd': 'spd' };
        const names = { 'atk': '공격력', 'def': '방어력', 'eva': '회피율', 'spd': '스피드' };

        if (effect === 'buff_all') {
            ['atk', 'def', 'spd'].forEach(s => mon.statStages[s] = Math.min(3, mon.statStages[s] + 1));
            this.callbacks.onLog(`${mon.name}의 모든 능력치가 올랐다!`);
        } else if (buffs[effect]) {
            const stat = buffs[effect];
            mon.statStages[stat] = Math.min(3, mon.statStages[stat] + 1);
            this.callbacks.onLog(`${mon.name}의 ${names[stat]}이(가) 올랐다!`);
        }
    }

    applyDebuff(mon, effect) {
        const debuffs = { 'debuff_atk': 'atk', 'debuff_def': 'def', 'debuff_acc': 'acc' };
        const names = { 'atk': '공격력', 'def': '방어력', 'acc': '명중률' };

        if (debuffs[effect]) {
            const stat = debuffs[effect];
            mon.statStages[stat] = Math.max(-3, mon.statStages[stat] - 1);
            this.callbacks.onLog(`${mon.name}의 ${names[stat]}이(가) 떨어졌다!`);
        }
    }

    async handleEnemyFaint() {
        // Trigger faint animation
        if (this.callbacks.onFaint) {
            this.callbacks.onFaint(true); // true = enemy fainted
        }

        this.callbacks.onLog(`${this.enemyMon.name}은(는) 쓰러졌다!`);
        this.callbacks.onUpdateUI();
        await this.wait(1000);

        if (this.trainerData && this.enemyParty && this.currentEnemyIndex < this.enemyParty.length - 1) {
            this.currentEnemyIndex++;
            this.enemyMon = this.enemyParty[this.currentEnemyIndex];
            this.callbacks.onLog(`${this.trainerData.name}이(가) ${this.enemyMon.name}을(를) 내보냈다!`);
            this.applyEntryAbility(this.enemyMon, this.playerMon);
            this.callbacks.onUpdateUI();
            await this.wait(1000);
            this.isProcessingTurn = false;
            return;
        }

        this.ended = true;
        this.isProcessingTurn = false;

        // XP to all party
        const baseXp = this.enemyMon.level * 15;
        let newMoves = [];

        for (let i = 0; i < this.playerParty.length; i++) {
            const mon = this.playerParty[i];
            if (mon.hp > 0) {
                const xpGain = i === this.activeIndex ? baseXp : Math.floor(baseXp / 2);
                const result = mon.gainXp(xpGain);
                if (result.leveledUp) {
                    this.callbacks.onLog(`${mon.name}의 레벨이 올랐다! (Lv.${mon.level})`);
                    // Show stat gains popup
                    if (result.statGains && this.callbacks.onStatGain) {
                        this.callbacks.onStatGain(mon.name, result.statGains);
                    }
                    await this.wait(2000); // Wait for stat popup to show
                }
                if (result.newMoveAvailable) {
                    newMoves.push({ mon, move: result.newMoveAvailable });
                }
            }
        }

        // Money
        let moneyMult = this.gameState.nextMoneyMultiplier || 1;
        this.gameState.nextMoneyMultiplier = 1;
        const moneyGain = this.enemyMon.level * 20 * (this.trainerData ? 3 : 1) * moneyMult;
        this.gameState.money += moneyGain;

        this.callbacks.onLog(`${baseXp} 경험치, ₱${moneyGain} 획득!`);
        this.callbacks.onUpdateUI();
        await this.wait(1000);

        if (this.callbacks.onWaveComplete) {
            this.callbacks.onWaveComplete(newMoves);
        }
    }

    async handlePlayerFaint() {
        // Trigger faint animation
        if (this.callbacks.onFaint) {
            this.callbacks.onFaint(false); // false = player fainted
        }

        this.callbacks.onLog(`${this.playerMon.name}은(는) 쓰러졌다!`);
        this.callbacks.onUpdateUI();
        await this.wait(1000);

        const alive = this.getAlivePartyMembers();
        if (alive.length > 0) {
            this.isProcessingTurn = false;
            this.callbacks.onLog('다른 학켓몬을 선택하세요!');
            if (this.callbacks.onForceSwitch) this.callbacks.onForceSwitch();
        } else {
            this.ended = true;
            this.isProcessingTurn = false;
            this.callbacks.onLog('눈앞이 캄캄해졌다...');
            if (this.callbacks.onGameOver) this.callbacks.onGameOver();
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
