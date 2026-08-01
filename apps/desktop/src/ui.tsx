import React from'react';
export type SurfaceVariant='base'|'raised'|'interactive'|'command'|'danger'|'success'|'inset';
export const Surface=({children,className='',critical=false,variant='base'}:{children:React.ReactNode;className?:string;critical?:boolean;variant?:SurfaceVariant;key?:React.Key})=><section className={`surface surface-${critical?'danger':variant} ${critical?'surface-critical':''} ${className}`}>{children}</section>;
export const Badge=({children,tone='neutral'}:{children:React.ReactNode;tone?:string})=><span className={`badge badge-${tone}`}>{children}</span>;
export function RuntimeModeBadge({mode='OFFLINE'}:{mode?:string}){const label=mode==='MOCK'?'MOCK DATA':mode==='REPLAY'?'REPLAY DATA':mode==='LIVE_GEP'?'LIVE RUNTIME':'OFFLINE';return <Badge tone={mode==='LIVE_GEP'?'live':mode==='OFFLINE'?'muted':'violet'}>{label}</Badge>}
export const DataQualityBadge=({quality='UNAVAILABLE'}:{quality?:string})=><Badge tone={quality.toLowerCase()}>{quality.replaceAll('_',' ')}</Badge>;
export const UrgencyBadge=({value='INFORMATIONAL'}:{value?:string})=><Badge tone={value.toLowerCase()}>{value}</Badge>;
export const PageHeader=({eyebrow,title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:React.ReactNode})=><header className="page-header"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="actions">{actions}</div>}</header>;
export const Metric=({label,value,note}:{label:string;value:React.ReactNode;note?:string})=><div className="metric"><span>{label}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div>;
export const ProgressBar=({value,label}:{value:number;label?:string})=><div className="progress" aria-label={label} aria-valuenow={value} role="progressbar"><i style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>;
export const EmptyState=({title,body,action}:{title:string;body:string;action?:React.ReactNode})=><div className="empty"><div className="empty-icon">◇</div><h3>{title}</h3><p>{body}</p>{action}</div>;
export const SectionHeader=({title,meta}:{title:string;meta?:string})=><div className="section-header"><h2>{title}</h2>{meta&&<span>{meta}</span>}</div>;
export const Sparkline=({values}:{values:number[]})=><svg className="sparkline" viewBox="0 0 240 70" role="img" aria-label="Performance trend"><polyline points={values.map((v,i)=>`${i*(240/(values.length-1))},${68-v*.6}`).join(' ')}/></svg>;
