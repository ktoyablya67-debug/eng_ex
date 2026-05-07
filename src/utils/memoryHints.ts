import { Term } from '../types';
import { getMemoryHint as getGeneratedHint } from './generateDistractors';

export const getMemoryHint = (term: Term) => getGeneratedHint(term);
