export type RuntimeMode='MOCK'|'REPLAY'|'LIVE_GEP'|'OFFLINE';
export type RuntimeSnapshot={loading?:boolean;error?:string;runtimeMode?:RuntimeMode;status?:string;capture?:any;capabilities?:any;state?:any;powerSpike?:any;macroDecision?:any;decision?:any;roleDecision?:any;laneDecision?:any;objectiveDecision?:any;adaptiveBuild?:any;coachCall?:any;coachCallHistory?:unknown[];review?:any;dataQuality?:Record<string,string>;runtimeMetadata?:Record<string,unknown>};
export type ScenarioSummary={id:string;title:string;mode:'PROJECTION'|'REPLAY';category:string;role:string;phase:string;heroId?:string;passed?:boolean;checkpoints?:any[];expectedFinalCall?:string;forbiddenActions?:string[]};
export type ScenarioRunResult=Record<string,any>;
export type ScenarioSuiteResult={results:ScenarioRunResult[];summary:Record<string,unknown>};
export type GoldenDiff=Record<string,unknown>[];
export type StartMatchCommand={hero:string;role:string;draft:{radiant:string[];dire:string[]};team?:'radiant'|'dire';buildPlanId?:string};

export interface DotaFlowRuntimeProvider{
  getSnapshot():Promise<RuntimeSnapshot>;
  subscribe(listener:(snapshot:RuntimeSnapshot)=>void):()=>void;
  startMatch?(command:StartMatchCommand):Promise<RuntimeSnapshot>;
  endMatch?():Promise<RuntimeSnapshot>;
  advanceMockTime?(seconds?:number):Promise<RuntimeSnapshot>;
  loadRecording?(source:unknown):Promise<void>;
  sendManualContext?(command:unknown):Promise<void>;
  startCoachTimer?(command:unknown):Promise<void>;
  listScenarios?():Promise<ScenarioSummary[]>;
  runScenario?(id:string):Promise<ScenarioRunResult>;
  runScenarioCategory?(category:string):Promise<ScenarioSuiteResult>;
  loadReplayScenario?(id:string):Promise<void>;
  getScenarioGoldenDiff?(id:string):Promise<GoldenDiff>;
}

export class ObservableProvider{
  protected listeners=new Set<(snapshot:RuntimeSnapshot)=>void>();
  subscribe(listener:(snapshot:RuntimeSnapshot)=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener)}}
  protected emit(snapshot:RuntimeSnapshot){this.listeners.forEach(listener=>listener(structuredClone(snapshot)))}
}

type DevelopmentMode='mock'|'replay';

abstract class LazyDevelopmentRuntimeProvider extends ObservableProvider implements DotaFlowRuntimeProvider{
  private delegatePromise:Promise<DotaFlowRuntimeProvider>|null=null;
  protected constructor(private readonly mode:DevelopmentMode){super()}

  protected loadProvider():Promise<DotaFlowRuntimeProvider>{
    if(!this.delegatePromise){
      this.delegatePromise=import('./mock-provider').then(module=>{
        const provider=module.createDevelopmentRuntimeProvider(this.mode);
        provider.subscribe(snapshot=>this.emit(snapshot));
        return provider;
      });
    }
    return this.delegatePromise;
  }

  async getSnapshot(){return(await this.loadProvider()).getSnapshot()}
  async startMatch(command:StartMatchCommand){const provider=await this.loadProvider();if(!provider.startMatch)throw new Error('Start Match is unavailable for this runtime');return provider.startMatch(command)}
  async endMatch(){const provider=await this.loadProvider();if(!provider.endMatch)throw new Error('End Match is unavailable for this runtime');return provider.endMatch()}
  async advanceMockTime(seconds=10){const provider=await this.loadProvider();if(!provider.advanceMockTime)throw new Error('Mock time controls are unavailable for this runtime');return provider.advanceMockTime(seconds)}
  async sendManualContext(command:unknown){const provider=await this.loadProvider();if(!provider.sendManualContext)throw new Error('Manual context is unavailable for this runtime');await provider.sendManualContext(command)}
  async startCoachTimer(command:unknown){const provider=await this.loadProvider();if(!provider.startCoachTimer)throw new Error('Coach timers are unavailable for this runtime');await provider.startCoachTimer(command)}
  async listScenarios(){const provider=await this.loadProvider();if(!provider.listScenarios)throw new Error('Scenario catalog is unavailable for this runtime');return provider.listScenarios()}
  async runScenario(id:string){const provider=await this.loadProvider();if(!provider.runScenario)throw new Error('Scenario execution is unavailable for this runtime');return provider.runScenario(id)}
  async runScenarioCategory(category:string){const provider=await this.loadProvider();if(!provider.runScenarioCategory)throw new Error('Scenario category execution is unavailable for this runtime');return provider.runScenarioCategory(category)}
  async loadReplayScenario(id:string){const provider=await this.loadProvider();if(!provider.loadReplayScenario)throw new Error('Replay scenarios are unavailable for this runtime');await provider.loadReplayScenario(id)}
  async getScenarioGoldenDiff(id:string){const provider=await this.loadProvider();if(!provider.getScenarioGoldenDiff)throw new Error('Scenario golden diff is unavailable for this runtime');return provider.getScenarioGoldenDiff(id)}
}

export class MockRuntimeProvider extends LazyDevelopmentRuntimeProvider{
  constructor(){super('mock')}
}

export class ReplayRuntimeProvider extends LazyDevelopmentRuntimeProvider{
  constructor(){super('replay')}
  async loadRecording(source:unknown){const provider=await this.loadProvider();if(!provider.loadRecording)throw new Error('Replay recording import is unavailable for this runtime');await provider.loadRecording(source)}
}

type ElectronRuntimeApi={invoke:(channel:string,payload?:unknown)=>Promise<unknown>;subscribe:(listener:(snapshot:unknown)=>void)=>()=>void};
declare global{interface Window{dotaFlowRuntime?:ElectronRuntimeApi}}

export class ElectronIpcRuntimeProvider extends ObservableProvider implements DotaFlowRuntimeProvider{
  private api:ElectronRuntimeApi;
  private off?:()=>void;
  constructor(api=window.dotaFlowRuntime){
    super();
    if(!api)throw new Error('OVERWOLF_NOT_CONFIGURED: Electron preload API unavailable');
    this.api=api;
    this.off=api.subscribe(snapshot=>this.emit(snapshot as RuntimeSnapshot));
  }
  async getSnapshot(){return await this.api.invoke('runtime:get-snapshot') as RuntimeSnapshot}
  async sendManualContext(command:unknown){await this.api.invoke('manual-context:send',command)}
  async startCoachTimer(command:unknown){await this.api.invoke('coach-timer:start',command)}
  dispose(){this.off?.();this.off=undefined}
  private fail():never{throw new Error('Scenario operations failed closed in LIVE_GEP mode')}
  async loadRecording(){return this.fail()}
  async listScenarios(){return this.fail()}
  async runScenario(){return this.fail()}
  async runScenarioCategory(){return this.fail()}
  async loadReplayScenario(){return this.fail()}
  async getScenarioGoldenDiff(){return this.fail()}
}
