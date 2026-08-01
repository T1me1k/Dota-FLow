export interface CoreSessionCoachEvaluation {readinessScore:number|null;readinessLevel:'HIGH'|'MEDIUM'|'LOW'|'VERY_LOW'|'UNKNOWN';recommendation:{type:string;title:string;reasons:string[];saferAlternative:string|null};confidence:{level:string}}
export class SessionCoachEngine {static evaluate(input:{checkIns:unknown[];currentCheckIn?:unknown;historyCount?:number}):CoreSessionCoachEvaluation}
