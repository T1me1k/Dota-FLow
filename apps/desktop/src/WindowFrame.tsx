import React,{useEffect,useState}from'react';
import type{RuntimeSnapshot}from'./runtime/provider';
import'./window-frame.css';

type WindowState={compact:boolean;alwaysOnTop:boolean};
const fallbackState:WindowState={compact:false,alwaysOnTop:false};
const label=(value:unknown,fallback='Unavailable')=>String(value??fallback).replaceAll('_',' ');
const time=(seconds?:number)=>seconds==null?'—':`${Math.floor(Math.abs(seconds)/60)}:${String(Math.abs(seconds)%60).padStart(2,'0')}`;
const confidence=(value?:number)=>value==null?'—':`${Math.round(value*100)}%`;

function PinIcon(){return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 4 6 6-3 1-4 4-1 5-3-3-4 4-2-2 4-4-3-3 5-1 4-4z"/></svg>}
function ExpandIcon(){return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>}

export function WindowFrame({snapshot,children}:{snapshot:RuntimeSnapshot;children:React.ReactNode}){
  const[state,setState]=useState<WindowState>(fallbackState);
  const[busy,setBusy]=useState(false);
  const api=window.dotaFlowRuntime;

  useEffect(()=>{
    let active=true;
    if(!api)return;
    void api.invoke('window:get-state').then((value)=>{
      if(!active||!value||typeof value!=='object')return;
      const next=value as Partial<WindowState>;
      setState({compact:next.compact===true,alwaysOnTop:next.alwaysOnTop===true});
    }).catch((error)=>console.error('[TRUST] Failed to load window state',error));
    return()=>{active=false};
  },[api]);

  const setCompact=async(compact:boolean)=>{
    if(busy)return;
    setBusy(true);
    const previous=state;
    if(compact)setState({...state,compact:true});
    try{
      if(!api){setState({...state,compact});return}
      const value=await api.invoke('window:set-compact',{compact});
      const next=value&&typeof value==='object'?value as Partial<WindowState>:{};
      setState({compact:next.compact===true,alwaysOnTop:next.alwaysOnTop===true});
    }catch(error){
      setState(previous);
      console.error('[TRUST] Failed to change compact window mode',error);
    }finally{setBusy(false)}
  };

  const toggleAlwaysOnTop=async()=>{
    if(busy)return;
    setBusy(true);
    const previous=state;
    const alwaysOnTop=!state.alwaysOnTop;
    setState({...state,alwaysOnTop});
    try{
      if(!api)return;
      const value=await api.invoke('window:set-always-on-top',{alwaysOnTop});
      const next=value&&typeof value==='object'?value as Partial<WindowState>:{};
      setState({compact:next.compact===true,alwaysOnTop:next.alwaysOnTop===true});
    }catch(error){
      setState(previous);
      console.error('[TRUST] Failed to change always-on-top mode',error);
    }finally{setBusy(false)}
  };

  const call=snapshot.coachCall as any;
  if(state.compact)return <div className="compact-window-root"><section className="compact-window" aria-label="TRUST compact coaching window"><header><span className="compact-brand"><i/>TRUST</span><span className="compact-live">{snapshot.runtimeMode==='LIVE_GEP'?'LIVE':label(snapshot.dataQuality?.overall)}</span><button className={state.alwaysOnTop?'active':''} disabled={busy} aria-pressed={state.alwaysOnTop} aria-label="Always on top" title="Always on top" onClick={(event)=>{event.stopPropagation();void toggleAlwaysOnTop()}}><PinIcon/></button><button disabled={busy} aria-label="Expand TRUST window" title="Expand" onClick={()=>void setCompact(false)}><ExpandIcon/></button></header><button className="compact-window-body" disabled={busy} onClick={()=>void setCompact(false)} aria-label="Expand TRUST window"><span className="compact-context"><small>{label(snapshot.state?.hero,'Hero')}</small><b>{time(snapshot.state?.gameTimeSec)}</b></span><span className="compact-call"><small>CURRENT CALL</small><strong>{label(call?.primaryAction,'Waiting for match')}</strong></span><span className="compact-confidence"><b>{confidence(call?.confidence)}</b><small>confidence</small></span></button></section></div>;

  return <div className="window-frame-host"><div className="window-controls" aria-label="Window controls"><button className={state.alwaysOnTop?'active':''} disabled={busy} aria-pressed={state.alwaysOnTop} aria-label="Always on top" title={state.alwaysOnTop?'Disable always on top':'Enable always on top'} onClick={()=>void toggleAlwaysOnTop()}><PinIcon/></button><button disabled={busy} aria-label="Collapse to compact window" title="Collapse to compact window" onClick={()=>void setCompact(true)}><span className="window-minus">−</span></button></div>{children}</div>;
}
