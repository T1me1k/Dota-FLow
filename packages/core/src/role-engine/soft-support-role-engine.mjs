import {evaluateRoleDecision} from '../role-engine.mjs';
export function evaluateSoftSupportRole(state){return evaluateRoleDecision({...state,role:'soft_support'});}
