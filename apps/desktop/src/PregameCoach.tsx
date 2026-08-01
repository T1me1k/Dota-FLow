import React from 'react';

const label=(value:unknown,fallback='Unavailable')=>String(value??fallback).replaceAll('_',' ');
const percent=(value?:number)=>value==null?'—':`${Math.round(value*100)}%`;

function Card({children,className=''}:{children:React.ReactNode;className?:string;key?:React.Key}){
  return <section className={`card ${className}`}>{children}</section>;
}

function Empty({title,text}:{title:string;text:string}){
  return <div className="empty"><b>{title}</b><span>{text}</span></div>;
}

function QualityBadge({value}:{value?:string}){
  const tone=value==='INFERRED'?'lime':value==='PARTIAL'?'orange':'muted';
  return <span className={`badge ${tone}`}>{label(value).toUpperCase()}</span>;
}

function HeroList({title,heroes}:{title:string;heroes?:string[]}){
  return <div><span className="subtle">{title}</span><p>{heroes?.length?heroes.map(hero=>label(hero)).join(' · '):'Not available'}</p></div>;
}

export function PregameCoach({snapshot}:{snapshot:any}){
  const pregame=snapshot.coach?.pregame;
  const state=snapshot.state??{};

  if(!pregame||pregame.status==='UNAVAILABLE'){
    const missing=pregame?.missingSignals?.join(' · ')??'Waiting for draft picks.';
    return <div className="coach-grid">
      <Card><p className="kicker">HERO & ROLE</p><h3>{label(state.hero)} · {label(state.role)}</h3><p>Selection follows the canonical runtime snapshot.</p></Card>
      <Card className="fpi"><p>PRE-GAME INTELLIGENCE</p><strong>—</strong><span>{missing}</span></Card>
      {['Draft Summary','Main Threats','Adaptive Build','Counter Items','Match Plan','Player Scouting'].map(title=><Card key={title}><p className="kicker">{title}</p><Empty title="Draft data required" text="TRUST will calculate this from confirmed picks without inventing missing heroes."/></Card>)}
    </div>;
  }

  const summary=pregame.draftSummary;
  const build=pregame.adaptiveBuild;
  const plan=pregame.matchPlan;
  const scouting=pregame.scouting;

  return <div className="coach-grid">
    <Card><p className="kicker">HERO & ROLE</p><h3>{pregame.displayName} · {label(pregame.role)}</h3><div className="chips"><QualityBadge value={pregame.dataQuality}/><span className="badge muted">DRAFT {summary?.ownCount??0}+{summary?.enemyCount??0}/10</span></div></Card>

    <Card><p className="kicker">DRAFT SUMMARY</p><HeroList title="Your team" heroes={summary?.ownTeam}/><HeroList title="Enemy team" heroes={summary?.enemyTeam}/><p className="subtle">Confidence {percent(pregame.draftConfidence)}</p>{pregame.missingSignals?.length>0&&<p>{pregame.missingSignals.join(' · ')}</p>}</Card>

    <Card><p className="kicker">MAIN THREATS</p>{pregame.threats?.length?<>{pregame.threats.map((threat:any)=><div className="signal" key={threat.label}><span>{threat.label}</span><strong>{percent(threat.value)}</strong></div>)}</>:<Empty title="No calibrated threat" text="The confirmed picks do not trigger a supported high-priority threat rule yet."/>}</Card>

    <Card><p className="kicker">ADAPTIVE BUILD</p>{build?.recommendedPlan?<><h3>{build.recommendedPlan.name}</h3><p>{build.recommendedPlan.items?.map((item:any)=>item.name).join(' → ')}</p><p className="subtle">{build.recommendedPlan.reasons?.[0]??'Hero profile baseline'}</p><strong>{percent(build.confidence)} confidence</strong></>:<Empty title={build?.status==='NOT_CALIBRATED'?'Hero profile not calibrated':'Build unavailable'} text={build?.limitations?.[0]??'No verified build plan is available.'}/>}</Card>

    <Card><p className="kicker">COUNTER ITEMS</p>{pregame.counterItems?.length?<ol>{pregame.counterItems.map((item:any)=><li key={item.id}><b>{item.name}</b><span className="subtle"> — {item.reasons?.[0]??'Draft counter'}</span></li>)}</ol>:<Empty title="No counter item yet" text="More enemy picks are required before recommending a deviation."/>}</Card>

    <Card><p className="kicker">MATCH PLAN</p>{plan?<><h3>{plan.opening}</h3><ul>{plan.priorities?.slice(1).map((item:string)=><li key={item}>{item}</li>)}</ul><p><b>Fight rule:</b> {plan.fightRule}</p><p><b>Convert:</b> {plan.conversion}</p></>:<Empty title="Plan unavailable" text="A match plan requires at least one confirmed enemy pick."/>}</Card>

    <Card><p className="kicker">PLAYER SCOUTING</p>{scouting?.status&&scouting.status!=='UNAVAILABLE'?<><h3>{label(scouting.status)}</h3><p>{scouting.players?.length??0} player profiles loaded.</p></>:<Empty title="Public scouting unavailable" text={scouting?.limitations?.[0]??'The player-stat provider is not configured.'}/>}</Card>
  </div>;
}
