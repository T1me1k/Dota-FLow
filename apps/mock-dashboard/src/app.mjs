import {
  createInitialGameState,
  targetGoldRemaining,
  GameEventPipeline,
  GAME_EVENT_TYPES,
  listHeroProfiles,
  getHeroProfile,
  getBuildPlan,
  evaluatePowerState
} from '/packages/core/src/index.mjs';

const elements = Object.fromEntries(
  [...document.querySelectorAll('[id]')].map((element) => [element.id, element])
);

const draftPresets = {
  neutral: { radiant: ['luna', 'axe', 'puck', 'tusk', 'treant'], dire: ['juggernaut', 'underlord', 'windranger', 'crystal_maiden', 'zeus'] },
  enemy_control: { radiant: ['phantom_assassin', 'puck', 'tusk', 'treant', 'beastmaster'], dire: ['axe', 'lion', 'shadow_shaman', 'necrophos', 'omniknight'] },
  enemy_squishy: { radiant: ['phantom_assassin', 'puck', 'tusk', 'treant', 'beastmaster'], dire: ['sniper', 'drow_ranger', 'crystal_maiden', 'pugna', 'natures_prophet'] },
  ally_initiation: { radiant: ['luna', 'puck', 'beastmaster', 'tusk', 'shadow_demon'], dire: ['spectre', 'underlord', 'windranger', 'zeus', 'treant'] }
};

let pipeline = new GameEventPipeline({ initialState: createInitialGameState() });
let state = pipeline.state;
let lastDecision = pipeline.decision;
let lastRoleDecision = pipeline.roleDecision;
let running = false;
let timer = null;
let speed = 10;
let tickCount = 0;

function formatTime(seconds) {
  const sign = seconds < 0 ? '-' : '';
  const abs = Math.abs(Math.round(seconds));
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
}

function pct(value, max) {
  return max ? Math.round(value / max * 100) : 0;
}

function log(text) {
  const row = document.createElement('div');
  row.className = 'log-entry';
  row.textContent = `[${formatTime(state.gameTimeSec)}] ${text}`;
  elements.eventLog.prepend(row);
  while (elements.eventLog.children.length > 50) elements.eventLog.lastChild.remove();
}

function dispatch(event, { announceDecision = true } = {}) {
  const previousAction = lastDecision?.action;
  const previousRoleAction = lastRoleDecision?.action;
  const snapshot = pipeline.dispatch(event);
  state = snapshot.state;
  lastDecision = snapshot.decision;
  lastRoleDecision = snapshot.roleDecision;
  if (announceDecision && previousAction && lastDecision.action !== previousAction) {
    log(`Macro Call → ${lastDecision.action}`);
  }
  if (announceDecision && previousRoleAction && lastRoleDecision.action !== previousRoleAction) {
    log(`Role Task → ${lastRoleDecision.action}`);
  }
  return snapshot;
}

function currentProfile() {
  return getHeroProfile(elements.heroSelect.value || state.hero);
}

function currentPlan() {
  return getBuildPlan(elements.heroSelect.value || state.hero, elements.buildSelect.value);
}

function selectedItem() {
  const items = currentPlan().items ?? [];
  const item = items.find((entry) => entry.id === elements.itemSelect.value) ?? items[0];
  return item ? { id: item.id, name: item.name, totalCost: item.cost, ownedValue: 0 } : null;
}

function populateHeroes() {
  const preferredHero = state.hero || 'luna';
  elements.heroSelect.innerHTML = listHeroProfiles()
    .map((profile) => `<option value="${profile.id}">${profile.displayName}${profile.calibrationTier === 'BASELINE' ? ' · baseline' : ''}</option>`)
    .join('');
  elements.heroSelect.value = preferredHero;
}

function populateBuilds() {
  const profile = currentProfile();
  elements.buildSelect.innerHTML = profile.buildPlans
    .map((plan) => `<option value="${plan.id}">${plan.name}</option>`)
    .join('');
  populateItems();
}

function populateItems() {
  const plan = currentPlan();
  const items = plan.items ?? [];
  elements.itemSelect.innerHTML = items.length
    ? items.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')
    : '<option value="">Предметный план ещё не откалиброван</option>';
  elements.itemSelect.disabled = items.length === 0;
}

function selectedDraft() {
  const preset = structuredClone(draftPresets[elements.draftPresetSelect.value] ?? draftPresets.neutral);
  const hero = elements.heroSelect.value;
  const own = state.team === 'dire' ? preset.dire : preset.radiant;
  if (!own.includes(hero)) own[0] = hero;
  return preset;
}

function start() {
  if (state.phase === 'idle' || state.phase === 'ended') {
    dispatch({
      type: GAME_EVENT_TYPES.MATCH_STARTED,
      gameTimeSec: 0,
      payload: {
        hero: elements.heroSelect.value,
        role: elements.roleSelect.value,
        buildPlanId: elements.buildSelect.value,
        targetItem: selectedItem(),
        draft: selectedDraft(),
        source: 'mock'
      }
    }, { announceDecision: false });
    tickCount = 0;
    log('Матч запущен через Event Pipeline');
  }
  running = true;
  ensureTimer();
  render();
}

function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => { if (running) simulateStep(); }, 1000);
}

function simulateStep() {
  tickCount += 1;
  const nextTime = state.gameTimeSec + speed;
  const minute = nextTime / 60;
  const farmRate = state.context.enemyCoreDead ? 5.5 : state.context.safeRouteAvailable ? 4.2 : 2.2;
  const earned = Math.max(0, Math.round(speed * farmRate));
  const previousLevel = state.level;
  const level = Math.min(30, Math.max(state.level, Math.floor(1 + minute * 0.72)));
  const maxHealth = 660 + level * 76;
  const maxMana = 363 + level * 34;
  const inventoryValue = state.inventory.reduce((sum, item) => sum + (item.cost ?? 0), 0);
  const gpm = Math.round((state.gold + inventoryValue + minute * 155) / Math.max(1, minute));
  const ultimateReady = level >= 6 && tickCount % 8 > 1;
  const levelReachedAt = level > previousLevel ? { [level]: nextTime } : {};

  dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    gameTimeSec: nextTime,
    payload: {
      gameTimeSec: nextTime,
      gold: state.gold + earned,
      unreliableGold: state.unreliableGold + earned,
      level,
      maxHealth,
      maxMana,
      health: Math.min(maxHealth, state.health + Math.round(speed * 2.5)),
      mana: Math.min(maxMana, state.mana + Math.round(speed * 1.7)),
      gpm: Math.min(900, Math.max(250, gpm)),
      xpm: Math.round(Math.min(950, 300 + minute * 18)),
      ultimateReady,
      progression: { levelReachedAt },
      context: { enemyCoreDead: state.context.enemyCoreDead && tickCount % 6 !== 0 }
    }
  });

  if (state.gameTimeSec >= 45 * 60) {
    running = false;
    dispatch({ type: GAME_EVENT_TYPES.MATCH_ENDED, payload: {} });
    log('Матч завершён');
  }

  render();
}

function triggerPowerSpike() {
  const item = state.targetItem;
  if (!item) {
    log('Активный build plan завершён');
    return;
  }
  const spend = Math.max(0, item.totalCost - item.ownedValue);
  dispatch({
    type: GAME_EVENT_TYPES.ITEM_ADDED,
    payload: {
      itemId: item.id,
      name: item.name,
      cost: item.totalCost,
      goldAfter: Math.max(0, state.gold - spend),
      unreliableGoldAfter: 0
    }
  });
  if (state.targetItem) elements.itemSelect.value = state.targetItem.id;
  log(`${item.name}: предмет завершён`);
  render();
}

function triggerLevelSpike() {
  const power = evaluatePowerState(state);
  const nextLevelSpike = currentProfile().spikes
    .flatMap((spike) => (spike.trigger?.all ?? []).filter((condition) => condition.type === 'level_gte').map((condition) => ({ spike, level: Number(condition.value) })))
    .filter((entry) => entry.level > state.level)
    .sort((a, b) => a.level - b.level)[0];
  const level = nextLevelSpike?.level ?? Math.min(30, state.level + 1);
  dispatch({
    type: GAME_EVENT_TYPES.HERO_LEVEL_CHANGED,
    payload: { level, ultimateReady: true }
  });
  log(`Получен уровень ${level}${nextLevelSpike ? `: ${nextLevelSpike.spike.name}` : ''}`);
  render();
}

function triggerDanger() {
  dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    payload: {
      health: Math.round(state.maxHealth * 0.19),
      mana: Math.round(state.maxMana * 0.12),
      gold: Math.max(2200, state.gold),
      unreliableGold: Math.max(1900, state.unreliableGold),
      context: { safeRouteAvailable: false }
    }
  });
  log('Симулирована опасная ситуация');
  render();
}

function triggerOpportunity() {
  dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    payload: {
      health: state.maxHealth,
      mana: state.maxMana,
      ultimateReady: true,
      context: { enemyCoreDead: true, alliesReady: 4, safeRouteAvailable: true, roshanAvailable: true }
    }
  });
  log('Вражеский core мёртв: окно давления');
  render();
}

function fadeWindow() {
  dispatch({
    type: GAME_EVENT_TYPES.CLOCK_UPDATED,
    payload: { gameTimeSec: state.gameTimeSec + 360 }
  });
  log('Игровое время продвинуто на 6 минут');
  render();
}

function reset() {
  running = false;
  pipeline = new GameEventPipeline({
    initialState: createInitialGameState({
      hero: elements.heroSelect.value,
      role: elements.roleSelect.value,
      buildPlanId: elements.buildSelect.value,
      targetItem: selectedItem(),
      draft: selectedDraft()
    })
  });
  state = pipeline.state;
  lastDecision = pipeline.decision;
  lastRoleDecision = pipeline.roleDecision;
  elements.eventLog.innerHTML = '';
  render();
}

function renderPower(power) {
  elements.powerStatus.textContent = power.status;
  elements.primarySpikeValue.textContent = power.primarySpike?.name ?? '—';
  elements.timingValue.textContent = power.primarySpike
    ? `${power.primarySpike.timing.label} · ×${power.primarySpike.effectiveMultiplier}`
    : `Стадия: ${power.stage}`;
  elements.nextSpikeValue.textContent = power.nextSpike?.name ?? '—';
  elements.nextSpikeDetail.textContent = power.nextSpike?.proximity?.missing?.join(' · ') || '—';

  const labels = { farm: 'Фарм', fight: 'Драка', push: 'Пуш', survival: 'Выживание', initiation: 'Инициация', objective: 'Объекты', mobility: 'Мобильность' };
  elements.powerDimensions.innerHTML = Object.entries(power.dimensions).map(([key, value]) => `
    <div class="dimension-row">
      <div class="dimension-head"><span>${labels[key] ?? key}</span><strong>${value}</strong></div>
      <div class="dimension-track"><div class="dimension-fill" style="width:${value}%"></div></div>
    </div>
  `).join('');

  elements.powerBlockers.innerHTML = power.blockers.length
    ? power.blockers.map((blocker) => `<span class="blocker">${blocker}</span>`).join('')
    : '<span class="clear-state">Критических блокеров нет</span>';

  const active = [...power.activeSpikes, ...power.fadingSpikes, ...power.missedSpikes].slice(0, 6);
  elements.activeSpikeList.innerHTML = active.length
    ? active.map((spike) => `<div class="spike-row"><strong>${spike.name}</strong><span>${spike.lifecycle} · ${spike.timing.label}</span></div>`).join('')
    : '<div class="empty-list">Активных окон пока нет</div>';
}

function render() {
  const decision = lastDecision;
  const power = decision.powerState;
  const roleDecision = lastRoleDecision;
  const actionClass = decision.action.toLowerCase();
  const remaining = targetGoldRemaining(state);

  if (state.targetItem && [...elements.itemSelect.options].some((option) => option.value === state.targetItem.id)) {
    elements.itemSelect.value = state.targetItem.id;
  }

  elements.phaseBadge.textContent = state.phase.toUpperCase();
  elements.decisionCard.className = `decision-card ${actionClass}`;
  elements.decisionAction.textContent = decision.headline;
  elements.decisionMessage.textContent = decision.message;
  elements.decisionReasons.innerHTML = decision.reasons.map((reason) => `<span class="reason">${reason}</span>`).join('');
  elements.confidenceBar.style.width = `${Math.round(decision.confidence * 100)}%`;
  elements.confidenceText.textContent = `${Math.round(decision.confidence * 100)}%`;
  elements.roleAction.textContent = roleDecision.headline;
  elements.roleMessage.textContent = roleDecision.message;
  elements.roleConfidence.textContent = `${Math.round(roleDecision.confidence * 100)}% confidence`;

  elements.timeValue.textContent = formatTime(state.gameTimeSec);
  elements.heroValue.textContent = power.displayName;
  elements.roleValue.textContent = state.role;
  elements.levelValue.textContent = state.level;
  elements.goldValue.textContent = state.gold.toLocaleString('ru-RU');
  elements.gpmValue.textContent = state.gpm;
  elements.benchmarkValue.textContent = decision.benchmark.expectedGpm;
  elements.hpValue.textContent = `${pct(state.health, state.maxHealth)}%`;
  elements.manaValue.textContent = `${pct(state.mana, state.maxMana)}%`;
  elements.ultValue.textContent = state.ultimateReady ? 'Готов' : 'Нет';
  elements.itemRemainingValue.textContent = remaining === null ? '—' : remaining === 0 ? 'Готов' : `${remaining}g`;

  const scores = Object.entries(decision.scores).filter(([key]) => key !== 'NEUTRAL').sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...scores.map(([, score]) => Math.max(0, score)));
  elements.scoreList.innerHTML = scores.map(([name, score]) => `
    <div class="score-row">
      <div class="score-head"><span>${name}</span><strong>${score}</strong></div>
      <div class="score-track"><div class="score-fill" style="width:${Math.max(0, score) / max * 100}%"></div></div>
    </div>
  `).join('');

  renderPower(power);

  elements.overlayPreview.className = `overlay-preview ${actionClass}`;
  elements.overlayAction.textContent = decision.action;
  elements.overlayDetail.textContent = power.primarySpike ? `${power.status}: ${power.primarySpike.name}` : decision.message;
  elements.overlaySubdetail.textContent = remaining > 0
    ? `До ${state.targetItem.name}: ${remaining}g`
    : power.nextSpike ? `Далее: ${power.nextSpike.name}` : decision.reasons[0] ?? 'Power Engine active';
}

populateHeroes();
populateBuilds();

elements.startButton.addEventListener('click', start);
elements.pauseButton.addEventListener('click', () => { running = false; log('Симуляция приостановлена'); });
elements.resetButton.addEventListener('click', reset);
elements.spikeButton.addEventListener('click', triggerPowerSpike);
elements.levelSpikeButton.addEventListener('click', triggerLevelSpike);
elements.dangerButton.addEventListener('click', triggerDanger);
elements.opportunityButton.addEventListener('click', triggerOpportunity);
elements.fadeButton.addEventListener('click', fadeWindow);
elements.speedInput.addEventListener('input', (event) => { speed = Number(event.target.value); elements.speedValue.textContent = `×${speed}`; });
elements.heroSelect.addEventListener('change', () => { populateBuilds(); reset(); });
elements.roleSelect.addEventListener('change', reset);
elements.buildSelect.addEventListener('change', () => { populateItems(); reset(); });
elements.itemSelect.addEventListener('change', reset);
elements.draftPresetSelect.addEventListener('change', reset);

reset();
