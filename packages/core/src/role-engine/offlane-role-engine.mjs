import {evaluateRoleDecision} from '../role-engine.mjs';
export function evaluateOfflaneRole(state){return evaluateRoleDecision({...state,role:'offlane'});}
