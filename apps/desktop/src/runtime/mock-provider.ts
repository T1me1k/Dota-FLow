import replayFixtures from '../../../../fixtures/scenarios/replay-scenarios.json';
import {MockMatchRuntime} from '../../../../packages/core/src/mock-match-runtime.mjs';
import {ObservableProvider,type DotaFlowRuntimeProvider,type RuntimeSnapshot,type ScenarioSummary,type ScenarioRunResult,type ScenarioSuiteResult,type GoldenDiff,type StartMatchCommand} from './provider';

const roles=['carry','mid','offlane','soft support','hard support'];
const projectionTitles=['Weak lane transition','Tower pressure','Farming timing','Connect on spike','Avoid early fight','Safe split push','Dangerous chase reset','Buyback discipline','Objective window','Lane recovery','Rune control','Prepared rotation','Wisdom timing'];
const projection:ScenarioSummary[]=Array.from({length:65},(_,i)=>({id:`v021-${String(i+1).padStart(3,'0')}`,title:projectionTitles[i%projectionTitles.length],mode:'PROJECTION',category:i>48?'safety':roles[i%5],role:roles[i%5],phase:i<20?'LANING':i<49?'MID_GAME':'LATE_GAME',passed:true}));
const heroPacks=['anti_mage','faceless_void','juggernaut','luna','medusa','phantom_assassin'].map((heroId,i)=>({id:`hero-pack-${heroId}`,title:`${heroId.replaceAll('_',' ')} calibration pack`,mode:'PROJECTION' as const,category:'hero pack',role:'carry',phase:i<3?'MID_GAME':'LATE_GAME',heroId,passed:true}));
const replay=(replayFixtures as any[]).map(x=>({...x,mode:'REPLAY' as const,passed:true}));
const catalog:ScenarioSummary[]=Object.freeze([...projection,...heroPacks,...replay]) as unknown as ScenarioSummary[];
const decision=(action:string,domain:string,urgency='MEDIUM',confidence=.84)=>({action,primaryAction:action,domain,urgency,confidence,reasons:[`${action.replaceAll('_',' ')} is the safest calibrated call.`],reasonCodes:['CALIBRATED_WINDOW'],missingSignals:[],dataQuality:'INFERRED'});
const mockSnapshot:RuntimeSnapshot={runtimeMode:'MOCK',status:'READY',state:{gameTimeSec:1320,hero:'luna',role:'carry',level:18,alive:true},powerSpike:{status:'ACTIVE',name:'Manta timing',confidence:.86},macroDecision:decision('RESET','MACRO','CRITICAL',.91),decision:decision('RESET','MACRO','CRITICAL',.91),roleDecision:decision('FARM_SAFE_TRIANGLE','ROLE'),laneDecision:decision('HOLD_SAFE_LANE','LANE','LOW',.74),objectiveDecision:decision('PREPARE_ROSHAN','OBJECTIVE'),adaptiveBuild:{activePlan:'Survive control',nextItem:'Black King Bar',confidence:.82,dataQuality:'INFERRED'},coachCall:{primaryAction:'RESET',primaryDomain:'SAFETY',urgency:'CRITICAL',confidence:.91,instruction:'Break contact, restore resources, then reconnect with your team.',reasonCodes:['LOW_HP','OBJECTIVE_WINDOW_PENDING'],reasons:['Health is below the safe fight threshold.','The next objective window allows time to reset.'],missingSignals:['enemy buybacks'],cancellationConditions:['All immediate threats leave vision'],ttlSec:18,secondaryActions:[{action:'PREPARE_ROSHAN'}],suppressedActions:[{action:'FARM',confidence:.68,reason:'Safety override'}],strategyTrace:{selected:'RESET',selectionReasons:['Critical safety rule overrides economy calls']},dataQuality:'INFERRED'},dataQuality:{overall:'INFERRED',macro:'INFERRED',role:'MANUAL'},runtimeMetadata:{source:'bundled-development-fixture',engineProjections:true}};

function scenarioResult(s:ScenarioSummary):ScenarioRunResult{
  const checkpoints=s.checkpoints?.length?s.checkpoints:[{gameTimeSec:300,expectedPrimaryAction:s.category==='safety'?'RESET':'FARM',expectedUrgency:'MEDIUM',expectedDataQuality:'INFERRED',expectedMissingSignals:[]}];
  const checkpointResults=checkpoints.map((c:any,i)=>({index:i,gameTimeSec:c.gameTimeSec,expectedAction:c.expectedPrimaryAction,actualAction:c.expectedPrimaryAction,passed:true,urgency:c.expectedUrgency??'MEDIUM',dataQuality:c.expectedDataQuality??'INFERRED',reasons:['Fixture expectation matched'],missingSignals:c.expectedMissingSignals??[],suppressedActions:[]}));
  const last=checkpointResults.at(-1)!;
  return{scenarioId:s.id,title:s.title,passed:true,checkpointResults,forbiddenViolations:[],finalCall:{primaryAction:last.actualAction,urgency:last.urgency,confidence:.84,dataQuality:last.dataQuality,reasonCodes:last.reasons,missingSignals:last.missingSignals},strategyTrace:{selected:last.actualAction,historySize:checkpointResults.length},reviewMetrics:{decisionSuccess:1,callStability:1},goldenDiff:[]};
}

export class LoadedMockRuntimeProvider extends ObservableProvider implements DotaFlowRuntimeProvider{
  private runtime=new MockMatchRuntime();
  async getSnapshot(){return this.runtime.snapshot() as RuntimeSnapshot}
  async startMatch(command:StartMatchCommand){const snapshot=this.runtime.startMatch(command) as RuntimeSnapshot;this.emit(snapshot);return snapshot}
  async endMatch(){const snapshot=this.runtime.endMatch() as RuntimeSnapshot;this.emit(snapshot);return snapshot}
  async advanceMockTime(seconds=10){const snapshot=this.runtime.advance(seconds) as RuntimeSnapshot;this.emit(snapshot);return snapshot}
  async sendManualContext(command:unknown){const id=typeof command==='string'?command:(command as any)?.command;const snapshot=this.runtime.sendManualContext(id) as RuntimeSnapshot;this.emit(snapshot)}
  async startCoachTimer(command:unknown){const snapshot=this.runtime.startCoachTimer(command as any) as RuntimeSnapshot;this.emit(snapshot)}
  async listScenarios(){return structuredClone(catalog)}
  async runScenario(id:string){const s=catalog.find(x=>x.id===id);if(!s)throw new Error(`Unknown scenario: ${id}. Select a scenario from the catalog.`);return scenarioResult(s)}
  async runScenarioCategory(category:string){const rows=catalog.filter(x=>x.category===category);const results=await Promise.all(rows.map(x=>this.runScenario(x.id)));return{results,summary:{total:rows.length,passed:results.length,failed:0}}}
  async loadReplayScenario(id:string){const s=catalog.find(x=>x.id===id&&x.mode==='REPLAY');if(!s)throw new Error(`Replay scenario unavailable: ${id}`);const result=scenarioResult(s);this.emit({...mockSnapshot,runtimeMode:'REPLAY',state:{...mockSnapshot.state,hero:s.heroId,role:s.role},review:{timeline:result.checkpointResults,metrics:result.reviewMetrics}})}
  async getScenarioGoldenDiff(id:string){const result=await this.runScenario(id);return result.goldenDiff as GoldenDiff}
}

export class LoadedReplayRuntimeProvider extends LoadedMockRuntimeProvider{
  private current:RuntimeSnapshot={...mockSnapshot,runtimeMode:'REPLAY',status:'REPLAY_READY'};
  async getSnapshot(){return structuredClone(this.current)}
  async loadRecording(source:unknown){const text=typeof source==='string'?source:JSON.stringify(source);const events=text.split('\n').filter(Boolean);this.current={...this.current,state:{...this.current.state,eventCount:events.length},review:{timeline:events.map((_,i)=>({gameTimeSec:i*30,action:i%2?'FARM':'RESET',outcome:'observed'})),metrics:{recordedEvents:events.length}},dataQuality:{overall:events.length?'INFERRED':'UNAVAILABLE'}};this.emit(this.current)}
}

export function createDevelopmentRuntimeProvider(mode:'mock'|'replay'):DotaFlowRuntimeProvider{
  return mode==='replay'?new LoadedReplayRuntimeProvider():new LoadedMockRuntimeProvider();
}
