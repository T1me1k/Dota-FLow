import {evaluateRoleDecision} from '../role-engine.mjs';
export function evaluateHardSupportRole(state){return evaluateRoleDecision({...state,role:'hard_support'});}
