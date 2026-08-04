import React from'react';
import{useAppSettings}from'./app-settings';

const percent=(value?:number)=>value==null?'—':`${Math.round(value*100)}%`;
function Card({children,className=''}:{children:React.ReactNode;className?:string;key?:React.Key}){return <section className={`card ${className}`}>{children}</section>}
function Empty({title,text}:{title:string;text:string}){return <div className="empty"><b>{title}</b><span>{text}</span></div>}
function QualityBadge({value}:{value?:string}){const{value:format}=useAppSettings();const tone=value==='INFERRED'?'lime':value==='PARTIAL'?'orange':'muted';return <span className={`badge ${tone}`}>{format(value).toUpperCase()}</span>}
function HeroList({title,heroes}:{title:string;heroes?:string[]}){const{value}=useAppSettings();return <div><span className="subtle">{title}</span><p>{heroes?.length?heroes.map(hero=>value(hero)).join(' · '):value(undefined)}</p></div>}

export function PregameCoach({snapshot}:{snapshot:any}){
  const{t,value,text}=useAppSettings();const pregame=snapshot.coach?.pregame;const state=snapshot.state??{};
  if(!pregame||pregame.status==='UNAVAILABLE'){
    const missing=pregame?.missingSignals?.map(text).join(' · ')??t('pregame.waitingDraft');
    const sections=['pregame.draftSummary','pregame.mainThreats','pregame.adaptiveBuild','pregame.counterItems','pregame.matchPlan','pregame.scouting'];
    return <div className="coach-grid"><Card><p className="kicker">{t('pregame.heroRole')}</p><h3>{value(state.hero)} · {value(state.role)}</h3><p>{t('pregame.selection')}</p></Card><Card className="fpi"><p>{t('pregame.intelligence')}</p><strong>—</strong><span>{missing}</span></Card>{sections.map(key=><Card key={key}><p className="kicker">{t(key)}</p><Empty title={t('pregame.draftRequired')} text={t('pregame.draftRequiredText')}/></Card>)}</div>;
  }
  const summary=pregame.draftSummary,build=pregame.adaptiveBuild,plan=pregame.matchPlan,scouting=pregame.scouting;
  return <div className="coach-grid">
    <Card><p className="kicker">{t('pregame.heroRole')}</p><h3>{pregame.displayName} · {value(pregame.role)}</h3><div className="chips"><QualityBadge value={pregame.dataQuality}/><span className="badge muted">DRAFT {summary?.ownCount??0}+{summary?.enemyCount??0}/10</span></div></Card>
    <Card><p className="kicker">{t('pregame.draftSummary')}</p><HeroList title={t('pregame.yourTeam')} heroes={summary?.ownTeam}/><HeroList title={t('pregame.enemyTeam')} heroes={summary?.enemyTeam}/><p className="subtle">{percent(pregame.draftConfidence)}</p>{pregame.missingSignals?.length>0&&<p>{pregame.missingSignals.map(text).join(' · ')}</p>}</Card>
    <Card><p className="kicker">{t('pregame.mainThreats')}</p>{pregame.threats?.length?pregame.threats.map((threat:any)=><div className="signal" key={threat.label}><span>{text(threat.label)}</span><strong>{percent(threat.value)}</strong></div>):<Empty title={t('pregame.noThreat')} text={t('pregame.noThreatText')}/>}</Card>
    <Card><p className="kicker">{t('pregame.adaptiveBuild')}</p>{build?.recommendedPlan?<><h3>{text(build.recommendedPlan.name)}</h3><p>{build.recommendedPlan.items?.map((item:any)=>item.name).join(' → ')}</p><p className="subtle">{text(build.recommendedPlan.reasons?.[0]??'')}</p><strong>{percent(build.confidence)}</strong></>:<Empty title={t('pregame.buildUnavailable')} text={text(build?.limitations?.[0]??t('pregame.noVerifiedBuild'))}/>}</Card>
    <Card><p className="kicker">{t('pregame.counterItems')}</p>{pregame.counterItems?.length?<ol>{pregame.counterItems.map((item:any)=><li key={item.id}><b>{item.name}</b><span className="subtle"> — {text(item.reasons?.[0]??'')}</span></li>)}</ol>:<Empty title={t('pregame.noCounter')} text={t('pregame.noCounterText')}/>}</Card>
    <Card><p className="kicker">{t('pregame.matchPlan')}</p>{plan?<><h3>{text(plan.opening)}</h3><ul>{plan.priorities?.slice(1).map((item:string)=><li key={item}>{text(item)}</li>)}</ul><p><b>{t('pregame.fightRule')}:</b> {text(plan.fightRule)}</p><p><b>{t('pregame.convert')}:</b> {text(plan.conversion)}</p></>:<Empty title={t('pregame.planUnavailable')} text={t('pregame.planUnavailableText')}/>}</Card>
    <Card><p className="kicker">{t('pregame.scouting')}</p>{scouting?.status&&scouting.status!=='UNAVAILABLE'?<><h3>{value(scouting.status)}</h3><p>{t('pregame.profilesLoaded',{count:scouting.players?.length??0})}</p></>:<Empty title={t('pregame.publicUnavailable')} text={text(scouting?.limitations?.[0]??t('pregame.providerMissing'))}/>}</Card>
  </div>;
}
