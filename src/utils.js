/**
 * Turn an array of { qid, weight } into a profile map { qid: totalWeight }
 */
export function computeProfile(answers) {
  return answers.reduce((acc, { qid, weight }) => {
    acc[qid] = (acc[qid] || 0) + weight
    return acc
  }, {})
}
