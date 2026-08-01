import {evaluateRoleDecision} from '../role-engine.mjs';
export function evaluateMidRole(state){return evaluateRoleDecision({...state,role:'mid'});}
