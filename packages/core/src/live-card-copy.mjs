const pair=(ru,en)=>Object.freeze({ru,en});

const SPIKE_COPY=Object.freeze({
  morphling_level_6:{name:pair('Первое окно адаптации Morph','First Morph adaptation window'),recommendation:pair('Копируй только полезный набор способностей и сохраняй Waveform для выхода после первой реакции.','Copy only a useful spell set and keep Waveform available to disengage from the first response.')},
  morphling_manta:{name:pair('Manta: диспел и давление через Waveform','Manta dispel and Waveform pressure'),recommendation:pair('Дави линию только пока доступны диспел Manta и безопасный выход через Waveform.','Pressure a lane only while Manta dispel and a Waveform exit are available.')},
  morphling_linken:{name:pair('Защитное окно Linken’s Sphere','Linken’s Sphere safety window'),recommendation:pair('Используй агрессивный угол против одного направленного контроля и отходи до наложения нескольких дизейблов.','Take the aggressive angle against one key targeted disable, but leave before multiple controls can overlap.')},
  morphling_satanic:{name:pair('Полное боевое окно Satanic','Satanic full-commit timing'),recommendation:pair('Принимай долгую драку после расхода мгновенного контроля и не трать Waveform только на вход.','Accept a longer fight after instant disable is committed; do not spend Waveform only to begin the engagement.')},
  sniper_level_6:{name:pair('Угроза добивания Assassinate','Assassinate finishing threat'),recommendation:pair('Добивай отходящую цель с безопасной дистанции и не выходи вперёд только ради угла для Assassinate.','Finish a retreating target from safe range; do not step forward merely to create an Assassinate angle.')},
  sniper_dragon_lance:{name:pair('Безопасная дальность Dragon Lance','Dragon Lance safe range'),recommendation:pair('Наноси урон из-за фронтлайна и не превращай дополнительную дальность в лишнее сближение.','Use the extra range to hit while remaining behind the frontline; never convert range into unnecessary proximity.')},
  sniper_hurricane_pike:{name:pair('Защитное окно Hurricane Pike','Hurricane Pike anti-dive window'),recommendation:pair('Сохраняй Pike для первого героя, который прыгнет в тебя, и продолжай наносить урон только после восстановления дистанции.','Hold Pike for the first diver and continue dealing damage only after distance is restored.')},
  sniper_pike_bkb:{name:pair('Защищённое окно Pike и BKB','Pike plus BKB protected carry window'),recommendation:pair('Стой за фронтлайном, переживи первый вход через Pike или BKB и конвертируй время свободной атаки в объект.','Stay behind the frontline, survive the first dive with Pike or BKB, and convert uninterrupted damage into an objective.')},
  monkey_king_level_6:{name:pair('Первое окно контроля зоны Wukong','First Wukong zone-control window'),recommendation:pair('Ставь Wukong только в ограниченной зоне линии или объекта, из которой враги не могут сразу выйти.','Cast Wukong only around a constrained lane or objective where enemies cannot immediately walk out.')},
  monkey_king_echo:{name:pair('Темповое окно Echo Sabre и Jingu','Echo Sabre Jingu timing'),recommendation:pair('Наказывай цель, которая не может разорвать контакт, но не раскрывай маршрут по деревьям без реального убийства.','Punish a target that cannot break contact, but keep the tree route hidden until the kill is realistic.')},
  monkey_king_desolator:{name:pair('Давление Desolator и Wukong','Desolator Wukong pressure'),recommendation:pair('Ставь Wukong у Рошана, башенного подъёма или другой узкой зоны и конвертируй снижение брони в объект.','Place Wukong around Roshan, a tower ramp or another narrow area and turn the armor reduction into the objective.')},
  monkey_king_bkb:{name:pair('Полное окно BKB и Wukong','BKB Wukong commitment'),recommendation:pair('Заходи с дерева после показа первого контроля и оставайся внутри Wukong, пока BKB защищает полное включение.','Enter from the tree after the first control is shown and remain inside Wukong while BKB protects the commitment.')}
});

const PLAN_COPY=Object.freeze({
  morphling_balanced:pair('Адаптивный урон через Manta','Adaptive Manta damage scaling'),
  morphling_control_response:pair('Защищённое включение Attribute Shift','Protected Attribute Shift commitment'),
  morphling_recovery:pair('Безопасное восстановление экономики через Waveform','Waveform-safe economy recovery'),
  morphling_objective:pair('Добивание цели с переходом в объект','Burst pickoff objective conversion'),
  sniper_balanced:pair('Дальность и ускорение фарма','Range and farming progression'),
  sniper_control_response:pair('Защита от прыжка и контроля','Anti-dive protection'),
  sniper_recovery:pair('Безопасное восстановление с дальней позиции','Safe ranged recovery'),
  sniper_objective:pair('Защищённый урон по укреплениям','Protected high-ground damage'),
  monkey_king_balanced:pair('Преимущество Echo в Wukong-контроль','Echo lane lead into Wukong control'),
  monkey_king_control_response:pair('Защищённое включение Wukong','Protected Wukong commitment'),
  monkey_king_recovery:pair('Безопасное восстановление через деревья','Tree-safe lane recovery'),
  monkey_king_objective:pair('Wukong в узкой зоне объекта','Wukong choke-point conversion')
});

const REASON_COPY=Object.freeze({
  balanced_draft:pair('Подтверждённый драфт пока не требует специального отклонения.','The confirmed draft does not require a special deviation yet.'),
  enemy_control_high:pair('В подтверждённом драфте много контроля.','The confirmed enemy draft has heavy control.'),
  enemy_magic_burst_high:pair('В подтверждённом драфте много магического burst-урона.','The confirmed enemy draft has heavy magic burst.'),
  enemy_physical_dps_high:pair('В подтверждённом драфте высокий физический урон.','The confirmed enemy draft has high physical damage.'),
  player_behind:pair('Текущая подтверждённая экономика требует безопасного восстановления.','Confirmed current economy calls for a safer recovery path.'),
  player_ahead:pair('Подтверждённая экономика позволяет ускорить конвертацию преимущества.','Confirmed current economy allows faster advantage conversion.'),
  objective_window:pair('Подтверждено окно для ближайшего объекта.','A nearby objective window is confirmed.'),
  split_push_required:pair('Команде требуется подтверждённое давление боковой линии.','The team needs confirmed side-lane pressure.')
});

const BLOCKER_COPY=Object.freeze({
  'Morph must be ready for the adaptation attempt':pair('Morph должен быть готов для попытки адаптации.','Morph must be ready for the adaptation attempt.'),
  'Do not copy a target while already vulnerable to burst':pair('Не копируй цель, пока сам уязвим для burst-урона.','Do not copy a target while already vulnerable to burst.'),
  'Keep a survivable strength buffer before showing on a dangerous lane':pair('Сохрани безопасный запас силы перед выходом на опасную линию.','Keep a survivable strength buffer before showing on a dangerous lane.'),
  'Linken does not replace a safe strength buffer':pair('Linken не заменяет безопасный запас силы.','Linken does not replace a safe strength buffer.'),
  'Enter the decisive fight with enough health to activate Satanic':pair('Входи в решающую драку с запасом здоровья для активации Satanic.','Enter the decisive fight with enough health to activate Satanic.'),
  'Assassinate must be ready':pair('Assassinate должен быть готов.','Assassinate must be ready.'),
  'Keep mana for Assassinate and one defensive spell cycle':pair('Сохрани ману на Assassinate и один защитный цикл способностей.','Keep mana for Assassinate and one defensive spell cycle.'),
  'Heal before taking the protected damage position':pair('Восстанови здоровье перед занятием защищённой позиции для урона.','Heal before taking the protected damage position.'),
  'Enter the decisive fight at high health':pair('Входи в решающую драку с высоким запасом здоровья.','Enter the decisive fight at high health.'),
  'Wukong Command must be ready':pair('Wukong’s Command должен быть готов.','Wukong’s Command must be ready.'),
  'Do not land into the zone already vulnerable to burst':pair('Не приземляйся в зону, если уже уязвим для burst-урона.','Do not land into the zone already vulnerable to burst.'),
  'Wukong Command must be ready for the objective fight':pair('Wukong’s Command должен быть готов к драке за объект.','Wukong’s Command must be ready for the objective fight.'),
  'Start the committed zone fight with enough health':pair('Начинай полную драку в зоне с достаточным запасом здоровья.','Start the committed zone fight with enough health.')
});

function fallbackPair(value){const text=String(value??'').trim();return pair(text,text)}

export function localizedSpikeCopy(spike){
  const fallbackName=fallbackPair(spike?.name);
  const fallbackRecommendation=fallbackPair(spike?.recommendation);
  const copy=SPIKE_COPY[String(spike?.id??'')];
  return{
    nameRu:copy?.name.ru??fallbackName.ru,
    nameEn:copy?.name.en??fallbackName.en,
    recommendationRu:copy?.recommendation.ru??fallbackRecommendation.ru,
    recommendationEn:copy?.recommendation.en??fallbackRecommendation.en
  };
}

export function localizedPlanCopy(plan){
  const fallback=fallbackPair(plan?.name);
  const copy=PLAN_COPY[String(plan?.id??'')];
  return{activePlanRu:copy?.ru??fallback.ru,activePlanEn:copy?.en??fallback.en};
}

export function localizedReasonCopy(reason){
  const key=String(reason??'').trim();
  const copy=REASON_COPY[key]??fallbackPair(key);
  return{nextItemReasonRu:copy.ru,nextItemReasonEn:copy.en};
}

export function localizedBlockerCopy(blocker){
  const key=String(blocker??'').trim();
  const copy=BLOCKER_COPY[key]??fallbackPair(key);
  return{ru:copy.ru,en:copy.en};
}

export const LIVE_CARD_LOCALIZED_HERO_IDS=Object.freeze(['morphling','sniper','monkey_king']);
