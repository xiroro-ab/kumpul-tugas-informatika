import assert from 'node:assert/strict';
import { calculateExamScore, getMaxScore, toPercent, getSubmissionAnswers } from '../src/examScoring.js';

const questions = [
    { id: 1, tipe: 'pg', kunci_pg: 'A', bobot: 10 },
    { id: 2, tipe: 'esai', bobot: 20 }
];
const pgOnly = calculateExamScore(questions, { 1: 'A' });
assert.equal(pgOnly.autoScoreTotal, 10);
assert.equal(pgOnly.autoSubjectiveScore, 0);
assert.equal(pgOnly.hasSubjective, false);
assert.equal(toPercent(pgOnly.autoScoreTotal, getMaxScore(questions)), 33);

const withEssay = calculateExamScore(questions, { 1: 'A', 2: 'jawaban' });
assert.equal(withEssay.hasSubjective, true);

const singkat = calculateExamScore([{ id: 3, tipe: 'singkat', kunci_pg: 'Jakarta', bobot: 10 }], { 3: 'jakarta' });
assert.equal(singkat.autoSubjectiveScore, 10);
assert.equal(singkat.hasSubjective, false);

const match = calculateExamScore([{
    id: 4,
    tipe: 'menjodohkan',
    rubrik_esai: JSON.stringify([{ kiri: 'a', kanan: 'x' }, { kiri: 'b', kanan: 'y' }]),
    bobot: 20
}], { 4: { 0: 'x', 1: 'z' } });
assert.equal(match.autoSubjectiveScore, 10);

assert.deepEqual(getSubmissionAnswers({ jawaban_siswa: { answers: { 1: 'A' }, cheatAttempts: 2 } }), { 1: 'A' });
assert.deepEqual(getSubmissionAnswers({ jawaban_siswa: '{"answers":{"1":"B"}}' }), { 1: 'B' });

console.log('examScoring: ok');
