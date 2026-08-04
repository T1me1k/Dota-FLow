import React,{createContext,useContext,useEffect,useMemo,useState}from'react';

export type Language='ru'|'en';
export const THEMES=[
  {id:'emerald',nameRu:'Изумрудная',nameEn:'Emerald',color:'#67e86f'},
  {id:'violet',nameRu:'Фиолетовая',nameEn:'Violet',color:'#a879ff'},
  {id:'amber',nameRu:'Янтарная',nameEn:'Amber',color:'#ffc14d'},
  {id:'crimson',nameRu:'Красная',nameEn:'Crimson',color:'#ff626d'},
  {id:'sapphire',nameRu:'Синяя',nameEn:'Sapphire',color:'#5b8cff'},
  {id:'cyan',nameRu:'Голубая',nameEn:'Cyan',color:'#46d9e8'},
  {id:'rose',nameRu:'Розовая',nameEn:'Rose',color:'#ff7eb6'},
  {id:'orange',nameRu:'Оранжевая',nameEn:'Orange',color:'#ff963f'},
  {id:'lime',nameRu:'Лаймовая',nameEn:'Lime',color:'#b4e84f'},
  {id:'teal',nameRu:'Бирюзовая',nameEn:'Teal',color:'#42d6b4'},
  {id:'indigo',nameRu:'Индиго',nameEn:'Indigo',color:'#7887ff'},
  {id:'magenta',nameRu:'Малиновая',nameEn:'Magenta',color:'#e86ee6'},
  {id:'graphite',nameRu:'Графитовая',nameEn:'Graphite',color:'#b7c0c8'},
  {id:'ice',nameRu:'Ледяная',nameEn:'Ice',color:'#a9e6ff'},
  {id:'gold',nameRu:'Золотая',nameEn:'Gold',color:'#e6c45a'}
]as const;
export type ThemeId=typeof THEMES[number]['id'];

type SettingsContextValue={
  language:Language;
  theme:ThemeId;
  setLanguage:(language:Language)=>void;
  setTheme:(theme:ThemeId)=>void;
  t:(key:string,vars?:Record<string,string|number>)=>string;
  value:(input:unknown,fallback?:string)=>string;
  text:(input:unknown)=>string;
};

const en:Record<string,string>={
  'app.subtitle':'Dota 2 Coaching Assistant','app.connected':'Connected','app.connecting':'Connecting','app.runtime':'runtime',
  'nav.dashboard':'Dashboard','nav.coach':'Coach','nav.live':'Live Match','nav.diagnostics':'Diagnostics','nav.validation':'Validation','nav.settings':'Settings','nav.about':'About',
  'top.hero':'Hero','top.role':'Role','top.phase':'Phase','top.gameTime':'Game time','top.capture':'Capture','top.live':'Live',
  'window.alwaysOnTop':'Always on top','window.disableAlwaysOnTop':'Disable always on top','window.compact':'Collapse to compact window','window.expand':'Expand TRUST window','window.close':'Close TRUST','window.compactLabel':'TRUST compact coaching window',
  'common.unavailable':'Unavailable','common.waiting':'Waiting','common.confidence':'confidence','common.live':'Live','common.on':'On','common.off':'Off','common.ready':'Ready','common.loading':'Loading','common.currentSnapshot':'Current snapshot','common.notAvailable':'Not available',
  'decision.current':'Current decision','decision.waiting':'Waiting for a decision','decision.why':'Why this call','decision.next':'Next condition','decision.reassess':'Reassess when the tactical state changes.','decision.waitingMatch':'Waiting for match',
  'phase.pregame':'Pre-game','phase.laning':'Laning','phase.mid':'Mid game','phase.late':'Late game','phase.ultra':'Ultra late',
  'phase.pregameAction':'Prepare lane','phase.pregameInstruction':'Buy starting items, choose your lane and wait for the horn.','phase.pregameReason':'Objectives and map rotations are blocked before the match starts.','phase.pregameNext':'The horn sounds and lane creeps meet.',
  'phase.laningAction':'Stabilize lane','phase.laningInstruction':'Prioritize last hits, denies and lane equilibrium. Do not leave the lane for an unconfirmed objective.','phase.laningReason':'The match is still in the laning stage, so split-push and major-objective calls are suppressed.','phase.laningNext':'The lane breaks down or the clock reaches the mid game.',
  'dashboard.kicker':'Command center','dashboard.title':'Welcome to TRUST','dashboard.description':'Your explainable coaching workspace is ready.','dashboard.active':'Match active','dashboard.activeText':'{hero} match is live.','dashboard.readyText':'Configure and start a canonical mock match.','dashboard.activeDescription':'Macro, role and power-spike engines are reading the active snapshot.','dashboard.readyDescription':'Hero, role and draft are sent through the canonical match event.','dashboard.start':'Start match','dashboard.starting':'Starting…','dashboard.openLive':'Open live monitor','dashboard.openCoach':'Open coach center','dashboard.dataConfidence':'Data confidence','dashboard.noMatchId':'No active match id','dashboard.roleTask':'Role task','dashboard.powerSpike':'Active power spike','dashboard.matchState':'Match state','dashboard.clock':'Clock','dashboard.thinking':'How TRUST thinks','dashboard.thinkingTitle':'Signals become one explainable move.','dashboard.signalGame':'Game signals','dashboard.signalContext':'Context','dashboard.signalPower':'Power spike','dashboard.signalMacro':'Macro decision','dashboard.signalRole':'Role task','dashboard.signalRecommendation':'Recommendation',
  'live.kicker':'Live match','live.title':'Decision room','live.description':'One call first. Supporting context only where it matters.','live.blockers':'Blockers & missing signals','live.noBlockers':'No blockers reported','live.noBlockersText':'The current coach call has no missing-signal warning.','live.roleTask':'Role task','live.noRoleExplanation':'No role-specific explanation.','live.powerSpike':'Power spike','live.adaptiveBuild':'Adaptive build','live.controls':'Coach controls','live.voice':'Voice coach: {state}','live.markSafe':'Mark safe to fight','live.startTimer':'Start 1m timer','live.advance':'Advance 1m','live.end':'End match','live.signalHealth':'Signal health','live.runtime':'Runtime','live.context':'Context','live.macro':'Macro','live.role':'Role','live.capture':'Capture','live.freshness':'Freshness','live.qualityNote':'Observed, manual and inferred signals are never presented as equivalent.',
  'coach.kicker':'Coach center','coach.title':'Prepare. Adapt. Improve.','coach.description':'Coaching organized around the full match cycle.','coach.pregame':'Pre-game','coach.live':'Live','coach.postgame':'Post-game','coach.dataQuality':'Data quality','coach.liveTools':'Manual context, timers and voice coaching remain available in Live Monitor.','coach.fpi':'Flow performance index','coach.completed':'Completed match review','coach.noCompleted':'No completed match selected','coach.strong':'Strongest areas','coach.improve':'Improvement focus','coach.training':'Training plan','coach.trend':'Recent trend','coach.historyRequired':'Match history required',
  'diagnostics.kicker':'System','diagnostics.title':'Runtime diagnostics','diagnostics.description':'Inspect the signal pipeline without losing operational context.','diagnostics.connection':'Connection','diagnostics.events':'Events','diagnostics.recording':'Recording','diagnostics.search':'Search events…','diagnostics.copy':'Copy snapshot','diagnostics.type':'Type','diagnostics.source':'Source','diagnostics.state':'State','diagnostics.payload':'Payload','diagnostics.expand':'Expand JSON','diagnostics.noEvents':'No recent events','diagnostics.noEventsText':'The current provider has not exposed raw event history.',
  'validation.kicker':'Release readiness','validation.title':'Validation status','validation.description':'What is proven, what is pending, and what blocks release.','validation.conditional':'Conditional','validation.coreReady':'Core ready. Live validation pending.','validation.evidence':'Simulator evidence cannot replace Windows, Overwolf and Dota capture validation.','validation.checklist':'Release checklist','validation.blockers':'Blockers','validation.blockerGep':'Live GEP has not been verified in this environment.','validation.blockerRecording':'No Windows recording is attached to this snapshot.','validation.history':'Validation history','validation.noRuns':'No recorded runs','validation.noRunsText':'Run the validation suite to create local evidence.',
  'settings.kicker':'Application','settings.title':'Settings','settings.description':'Change the interface language, accent theme and window behavior.','settings.language':'Language','settings.languageText':'The entire interface switches immediately.','settings.russian':'Русский','settings.english':'English','settings.theme':'Color theme','settings.themeText':'Choose one of 15 accent palettes. The selection is saved locally.','settings.window':'Window behavior','settings.windowText':'TRUST starts in compact mode. Use the pin button to keep it above Dota and click the compact card to expand it.','settings.saved':'Settings are saved automatically on this device.',
  'about.badge':'Explainable Dota 2 coach','about.titleA':'Make the next move','about.titleB':'with confidence.','about.description':'TRUST turns permitted game signals into role-aware, transparent recommendations without pretending uncertain data is fact.','about.openCoach':'Open coach center','about.openLive':'View live monitor','about.fair':'Fair play by design','about.fairTitle':'Coaching, never automation.','about.noAutomation':'No gameplay automation','about.noHidden':'No hidden enemy data','about.noMemory':'No memory reading','about.noInput':'No input injection',
  'footer.privacy':'Privacy','footer.terms':'Terms',
  'pregame.heroRole':'Hero & role','pregame.selection':'Selection follows the canonical runtime snapshot.','pregame.intelligence':'Pre-game intelligence','pregame.waitingDraft':'Waiting for draft picks.','pregame.draftSummary':'Draft summary','pregame.mainThreats':'Main threats','pregame.adaptiveBuild':'Adaptive build','pregame.counterItems':'Counter items','pregame.matchPlan':'Match plan','pregame.scouting':'Player scouting','pregame.draftRequired':'Draft data required','pregame.draftRequiredText':'TRUST calculates this from confirmed picks without inventing missing heroes.','pregame.yourTeam':'Your team','pregame.enemyTeam':'Enemy team','pregame.noThreat':'No calibrated threat','pregame.noThreatText':'The confirmed picks do not trigger a supported high-priority threat rule yet.','pregame.buildUnavailable':'Build unavailable','pregame.noVerifiedBuild':'No verified build plan is available.','pregame.noCounter':'No counter item yet','pregame.noCounterText':'More enemy picks are required before recommending a deviation.','pregame.planUnavailable':'Plan unavailable','pregame.planUnavailableText':'A match plan requires at least one confirmed enemy pick.','pregame.fightRule':'Fight rule','pregame.convert':'Convert','pregame.publicUnavailable':'Public scouting unavailable','pregame.providerMissing':'The player-stat provider is not configured.','pregame.profilesLoaded':'{count} player profiles loaded.'
};

const ru:Record<string,string>={
  'app.subtitle':'Помощник-тренер по Dota 2','app.connected':'Подключено','app.connecting':'Подключение','app.runtime':'режим',
  'nav.dashboard':'Главная','nav.coach':'Тренер','nav.live':'Матч','nav.diagnostics':'Диагностика','nav.validation':'Проверка','nav.settings':'Настройки','nav.about':'О программе',
  'top.hero':'Герой','top.role':'Роль','top.phase':'Стадия','top.gameTime':'Время игры','top.capture':'Запись','top.live':'Матч',
  'window.alwaysOnTop':'Поверх всех окон','window.disableAlwaysOnTop':'Отключить режим поверх окон','window.compact':'Свернуть в компактное окно','window.expand':'Раскрыть окно TRUST','window.close':'Закрыть TRUST','window.compactLabel':'Компактное окно тренера TRUST',
  'common.unavailable':'Недоступно','common.waiting':'Ожидание','common.confidence':'уверенность','common.live':'В эфире','common.on':'Вкл.','common.off':'Выкл.','common.ready':'Готово','common.loading':'Загрузка','common.currentSnapshot':'Данные актуальны','common.notAvailable':'Нет данных',
  'decision.current':'Текущая рекомендация','decision.waiting':'Ожидание рекомендации','decision.why':'Почему сейчас','decision.next':'Когда пересмотреть','decision.reassess':'Пересмотреть при изменении ситуации.','decision.waitingMatch':'Ожидание матча',
  'phase.pregame':'До начала','phase.laning':'Лайнинг','phase.mid':'Мидгейм','phase.late':'Лейтгейм','phase.ultra':'Ультралейт',
  'phase.pregameAction':'Подготовь линию','phase.pregameInstruction':'Купи стартовые предметы, выбери линию и дождись выхода крипов.','phase.pregameReason':'До начала матча запрещены советы по объектам, сплитпушу и перемещениям по карте.','phase.pregameNext':'Прозвучит горн и крипы встретятся на линии.',
  'phase.laningAction':'Стабилизируй линию','phase.laningInstruction':'Сосредоточься на ластхитах, денаях и равновесии линии. Не уходи с линии ради неподтверждённой цели.','phase.laningReason':'Сейчас идёт лайнинг, поэтому советы про сплитпуш, Рошана и глубокие чужие зоны заблокированы.','phase.laningNext':'Линия закончится или игра перейдёт в мидгейм.',
  'dashboard.kicker':'Центр управления','dashboard.title':'Добро пожаловать в TRUST','dashboard.description':'Рабочее пространство объяснимого тренера готово.','dashboard.active':'Матч идёт','dashboard.activeText':'Матч на герое {hero} активен.','dashboard.readyText':'Настрой и запусти тестовый матч.','dashboard.activeDescription':'Движки макро, роли и пиков силы читают текущие данные.','dashboard.readyDescription':'Герой, роль и драфт передаются через единое событие начала матча.','dashboard.start':'Начать матч','dashboard.starting':'Запуск…','dashboard.openLive':'Открыть матч','dashboard.openCoach':'Открыть тренера','dashboard.dataConfidence':'Качество данных','dashboard.noMatchId':'Нет активного матча','dashboard.roleTask':'Задача роли','dashboard.powerSpike':'Активный пик силы','dashboard.matchState':'Состояние матча','dashboard.clock':'Время','dashboard.thinking':'Как думает TRUST','dashboard.thinkingTitle':'Сигналы превращаются в одно понятное действие.','dashboard.signalGame':'Сигналы игры','dashboard.signalContext':'Контекст','dashboard.signalPower':'Пик силы','dashboard.signalMacro':'Макро-решение','dashboard.signalRole':'Задача роли','dashboard.signalRecommendation':'Рекомендация',
  'live.kicker':'Текущий матч','live.title':'Комната решений','live.description':'Сначала одно главное действие, затем только важный контекст.','live.blockers':'Блокеры и недостающие данные','live.noBlockers':'Блокеров нет','live.noBlockersText':'Для текущей рекомендации нет предупреждений о недостающих данных.','live.roleTask':'Задача роли','live.noRoleExplanation':'Нет объяснения, зависящего от роли.','live.powerSpike':'Пик силы','live.adaptiveBuild':'Адаптивный билд','live.controls':'Управление тренером','live.voice':'Голосовой тренер: {state}','live.markSafe':'Отметить безопасный бой','live.startTimer':'Запустить таймер 1 мин.','live.advance':'Перемотать 1 мин.','live.end':'Завершить матч','live.signalHealth':'Состояние сигналов','live.runtime':'Источник','live.context':'Контекст','live.macro':'Макро','live.role':'Роль','live.capture':'Запись','live.freshness':'Актуальность','live.qualityNote':'Наблюдаемые, ручные и вычисленные сигналы всегда обозначаются по-разному.',
  'coach.kicker':'Центр тренера','coach.title':'Подготовься. Адаптируйся. Улучшайся.','coach.description':'Тренер охватывает подготовку, сам матч и разбор.','coach.pregame':'До матча','coach.live':'Матч','coach.postgame':'После матча','coach.dataQuality':'Качество данных','coach.liveTools':'Ручной контекст, таймеры и голос доступны во вкладке матча.','coach.fpi':'Индекс качества игры','coach.completed':'Разбор завершённого матча','coach.noCompleted':'Завершённый матч не выбран','coach.strong':'Сильные стороны','coach.improve':'Что улучшить','coach.training':'План тренировки','coach.trend':'Последняя динамика','coach.historyRequired':'Нужна история матчей',
  'diagnostics.kicker':'Система','diagnostics.title':'Диагностика подключения','diagnostics.description':'Проверка цепочки сигналов без потери игрового контекста.','diagnostics.connection':'Подключение','diagnostics.events':'События','diagnostics.recording':'Запись','diagnostics.search':'Поиск событий…','diagnostics.copy':'Копировать снимок','diagnostics.type':'Тип','diagnostics.source':'Источник','diagnostics.state':'Состояние','diagnostics.payload':'Данные','diagnostics.expand':'Раскрыть JSON','diagnostics.noEvents':'Событий пока нет','diagnostics.noEventsText':'Текущий источник ещё не передал историю сырых событий.',
  'validation.kicker':'Готовность выпуска','validation.title':'Статус проверки','validation.description':'Что подтверждено, что ожидается и что блокирует выпуск.','validation.conditional':'Условно готово','validation.coreReady':'Ядро готово. Нужна проверка живого матча.','validation.evidence':'Симулятор не заменяет проверку Windows, Overwolf и записи реальной Dota.','validation.checklist':'Список проверок','validation.blockers':'Блокеры','validation.blockerGep':'Живой GEP ещё не подтверждён в этой среде.','validation.blockerRecording':'К этому снимку не приложена запись Windows.','validation.history':'История проверок','validation.noRuns':'Запусков пока нет','validation.noRunsText':'Запусти набор проверок, чтобы создать локальные доказательства.',
  'settings.kicker':'Приложение','settings.title':'Настройки','settings.description':'Измени язык интерфейса, цветовую тему и поведение окна.','settings.language':'Язык','settings.languageText':'Весь интерфейс переключается сразу.','settings.russian':'Русский','settings.english':'English','settings.theme':'Цветовая тема','settings.themeText':'Выбери одну из 15 цветовых схем. Выбор сохраняется локально.','settings.window':'Поведение окна','settings.windowText':'TRUST всегда запускается компактным. Булавка закрепляет его поверх Dota, а нажатие по карточке раскрывает полное окно.','settings.saved':'Настройки автоматически сохраняются на этом компьютере.',
  'about.badge':'Объяснимый тренер Dota 2','about.titleA':'Сделай следующий ход','about.titleB':'уверенно.','about.description':'TRUST превращает разрешённые игровые сигналы в понятные рекомендации с учётом роли и не выдаёт неопределённые данные за факты.','about.openCoach':'Открыть тренера','about.openLive':'Открыть матч','about.fair':'Честная игра по умолчанию','about.fairTitle':'Тренер, а не автоматизация.','about.noAutomation':'Без автоматизации игры','about.noHidden':'Без скрытых данных врага','about.noMemory':'Без чтения памяти','about.noInput':'Без подмены ввода',
  'footer.privacy':'Конфиденциальность','footer.terms':'Условия',
  'pregame.heroRole':'Герой и роль','pregame.selection':'Выбор берётся из текущего состояния матча.','pregame.intelligence':'Подготовка к матчу','pregame.waitingDraft':'Ожидание драфта.','pregame.draftSummary':'Сводка драфта','pregame.mainThreats':'Главные угрозы','pregame.adaptiveBuild':'Адаптивный билд','pregame.counterItems':'Контр-предметы','pregame.matchPlan':'План матча','pregame.scouting':'Данные игроков','pregame.draftRequired':'Нужны данные драфта','pregame.draftRequiredText':'TRUST рассчитает это по подтверждённым пикам и не будет придумывать отсутствующих героев.','pregame.yourTeam':'Твоя команда','pregame.enemyTeam':'Команда врага','pregame.noThreat':'Критических угроз нет','pregame.noThreatText':'Подтверждённые пики пока не активируют приоритетное правило угрозы.','pregame.buildUnavailable':'Билд недоступен','pregame.noVerifiedBuild':'Нет подтверждённого плана предметов.','pregame.noCounter':'Контр-предмет пока не нужен','pregame.noCounterText':'Для отклонения от базового билда нужно больше вражеских пиков.','pregame.planUnavailable':'План недоступен','pregame.planUnavailableText':'Для плана матча нужен хотя бы один подтверждённый герой врага.','pregame.fightRule':'Правило боя','pregame.convert':'Конверсия','pregame.publicUnavailable':'Публичные данные недоступны','pregame.providerMissing':'Источник статистики игроков не настроен.','pregame.profilesLoaded':'Загружено профилей: {count}.'
};

const valueLabels:Record<Language,Record<string,string>>={
  en:{UNAVAILABLE:'Unavailable',INFERRED:'Inferred',MANUAL:'Manual',OBSERVED:'Observed',LIVE:'Live',CONNECTED:'Connected',CONNECTING:'Connecting',READY:'Ready',PLAYING:'Playing',IDLE:'Idle',UNKNOWN:'Unknown',CARRY:'Carry',MID:'Mid',OFFLANE:'Offlane',SOFT_SUPPORT:'Soft support',HARD_SUPPORT:'Hard support',HOLD_POSITION:'Hold position',STABILIZE_LANE:'Stabilize lane',PREPARE_LANE:'Prepare lane',RESET:'Reset',FARM:'Farm',FARM_SAFE_TRIANGLE:'Farm safe triangle',PREPARE_ROSHAN:'Prepare Roshan',TRADE_OBJECTIVE:'Trade objective',SPLIT_PUSH:'Split push'},
  ru:{UNAVAILABLE:'Недоступно',INFERRED:'Вычислено',MANUAL:'Вручную',OBSERVED:'Наблюдается',LIVE:'В эфире',CONNECTED:'Подключено',CONNECTING:'Подключение',READY:'Готово',PLAYING:'Игра',IDLE:'Ожидание',UNKNOWN:'Неизвестно',CARRY:'Керри',MID:'Мидер',OFFLANE:'Оффлейнер',SOFT_SUPPORT:'Четвёртая позиция',HARD_SUPPORT:'Пятая позиция',HOLD_POSITION:'Удерживай позицию',STABILIZE_LANE:'Стабилизируй линию',PREPARE_LANE:'Подготовь линию',RESET:'Отступи и восстановись',FARM:'Фарми',FARM_SAFE_TRIANGLE:'Фарми безопасный треугольник',PREPARE_ROSHAN:'Подготовь Рошана',TRADE_OBJECTIVE:'Размени объект',SPLIT_PUSH:'Сплитпуш'}
};

const knownTextRu:Record<string,string>={
  'No role-specific explanation.':'Нет объяснения, зависящего от роли.',
  'Reassess when the tactical state changes.':'Пересмотри решение при изменении ситуации.',
  'Do not force an unknown zone; choose an available conversion.':'Не заходи в неподтверждённую зону; выбери доступную безопасную цель.',
  'Hold position until the task is confirmed.':'Удерживай безопасную позицию до подтверждения задачи.',
  'The current coach call has no missing-signal warning.':'Для текущей рекомендации нет предупреждений о недостающих данных.'
};

function interpolate(template:string,vars?:Record<string,string|number>):string{
  if(!vars)return template;
  return template.replace(/\{(\w+)\}/g,(_,key)=>String(vars[key]??`{${key}}`));
}
function safeLanguage(value:string|null):Language{return value==='en'?'en':'ru'}
function safeTheme(value:string|null):ThemeId{return THEMES.some(theme=>theme.id===value)?value as ThemeId:'emerald'}

const SettingsContext=createContext<SettingsContextValue|null>(null);

export function AppSettingsProvider({children}:{children:React.ReactNode}){
  const[language,setLanguageState]=useState<Language>(safeLanguage(localStorage.getItem('trust-language')));
  const[theme,setThemeState]=useState<ThemeId>(safeTheme(localStorage.getItem('trust-theme')));
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('trust-theme',theme)},[theme]);
  useEffect(()=>{document.documentElement.lang=language;localStorage.setItem('trust-language',language)},[language]);
  const context=useMemo<SettingsContextValue>(()=>({
    language,theme,
    setLanguage:setLanguageState,
    setTheme:setThemeState,
    t:(key,vars)=>interpolate((language==='ru'?ru:en)[key]??en[key]??key,vars),
    value:(input,fallback)=>{
      if(input==null||input==='')return fallback??(language==='ru'?ru['common.unavailable']:en['common.unavailable']);
      const normalized=String(input).replaceAll(' ','_').toUpperCase();
      return valueLabels[language][normalized]??String(input).replaceAll('_',' ');
    },
    text:(input)=>{
      const raw=String(input??'');
      if(language==='ru')return knownTextRu[raw]??raw;
      return raw;
    }
  }),[language,theme]);
  return <SettingsContext.Provider value={context}>{children}</SettingsContext.Provider>;
}

export function useAppSettings():SettingsContextValue{
  const value=useContext(SettingsContext)as SettingsContextValue|null;
  if(!value)throw new Error('AppSettingsProvider is missing');
  return value;
}
