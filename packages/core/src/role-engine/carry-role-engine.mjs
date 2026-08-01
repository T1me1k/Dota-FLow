import {evaluateRoleDecision} from '../role-engine.mjs';
export function evaluateCarryRole(state){return evaluateRoleDecision({...state,role:'carry'});}
