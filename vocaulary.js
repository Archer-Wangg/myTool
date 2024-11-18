const math = require("mathjs");

// 识别概率
const probabilities = {
  p1: [0.95, 0.56, 0.3, 0.2, 0.14, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05, 0.03],
  p2: [0.95, 0.92, 0.6, 0.38, 0.28, 0.23, 0.19, 0.16, 0.14, 0.12, 0.1, 0.06],
  p3: [0.95, 0.95, 0.9, 0.72, 0.52, 0.43, 0.36, 0.3, 0.26, 0.25, 0.22, 0.2],
  m1: [0.98, 0.95, 0.92, 0.87, 0.83, 0.69, 0.58, 0.49, 0.42, 0.4, 0.35, 0.32],
  m2: [0.98, 0.98, 0.95, 0.9, 0.85, 0.83, 0.7, 0.58, 0.5, 0.48, 0.42, 0.38],
  m3: [0.98, 0.98, 0.95, 0.9, 0.87, 0.83, 0.78, 0.7, 0.61, 0.58, 0.51, 0.46],
  h1: [1.0, 0.98, 0.98, 0.95, 0.9, 0.85, 0.8, 0.75, 0.73, 0.7, 0.61, 0.55],
  h2: [1.0, 1.0, 0.98, 0.95, 0.9, 0.87, 0.85, 0.77, 0.74, 0.73, 0.72, 0.65],
  h3: [1.0, 1.0, 0.98, 0.95, 0.92, 0.9, 0.87, 0.8, 0.75, 0.74, 0.73, 0.68],
  t1: [1.0, 1.0, 1.0, 0.98, 0.92, 0.92, 0.9, 0.85, 0.8, 0.75, 0.74, 0.7],
  t2: [1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.92, 0.87, 0.85, 0.8, 0.75, 0.72],
  t3: [1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.92, 0.9, 0.87, 0.82, 0.77, 0.75],
};

const expectedCorrectRates = [
  0.95, 0.92, 0.9, 0.87, 0.85, 0.83, 0.8, 0.77, 0.75, 0.72, 0.72, 0.72,
];
const actualRates = [1,1,0.9,0.8,0.6,0.3,0,0,0,0,0,0]
// const actualRates = [0.92, 0.80, 0.74, 0.67, 0.55, 0.53, 0.49, 0.47, 0.44, 0.42, 0.40, 0.38];
const sigmaSquared = 0.01;
const sqrtTwoPiSigma = Math.sqrt(2 * Math.PI * sigmaSquared);

function calculateLikelihood(observed, expected, sigma) {
  const exponent = -Math.pow(observed - expected, 2) / (2 * sigma);
  return (1 / sqrtTwoPiSigma) * Math.exp(exponent);
}

const totalLikelihoods = [];
const likelihoodArrays = { p1: [], p2: [], p3: [], m1: [], m2: [], m3: [], h1: [], h2: [], h3: [], t1: [], t2: [], t3: [] };

for (const [name, array] of Object.entries(probabilities)) {
  let totalLikelihood = 0;

  for (let i = 0; i < array.length; i++) {
    let likelihood = 0;
    let adjustedObserved = actualRates[i];
    let effectiveExpected = array[i];

    if (actualRates[i] >= 0.3) {
      if (array[i] > expectedCorrectRates[i]) {
        effectiveExpected = expectedCorrectRates[i];
      }

      if (actualRates[i] >= expectedCorrectRates[i]) {
        adjustedObserved = expectedCorrectRates[i];
      } else {
        adjustedObserved = actualRates[i];
      }

      likelihood = calculateLikelihood(adjustedObserved, effectiveExpected, sigmaSquared);
    }
    totalLikelihood += likelihood;
    likelihoodArrays[name].push(likelihood.toFixed(4)); // 收集每个阶段的似然值

    console.log(`P(${actualRates[i]} | ${effectiveExpected}, ${sigmaSquared}) ≈ ${likelihood.toFixed(4)}`);
  }

  totalLikelihoods.push(totalLikelihood.toFixed(4));
  console.log(`${name}总似然值 ≈ ${totalLikelihood.toFixed(4)}`);
}

console.log("所有阶段总似然值:", totalLikelihoods);
console.log("每个阶段的总似然值:");
Object.entries(probabilities).forEach(([name], index) => {
  console.log(`${name} 总似然值 ≈ ${totalLikelihoods[index]}`);
});

// 找到最高的似然值及其索引
const maxLikelihoodValue = Math.max(...totalLikelihoods);
const maxLikelihoodIndex = totalLikelihoods.indexOf(maxLikelihoodValue.toFixed(4));
const nextIndex = Math.min(maxLikelihoodIndex + 1, totalLikelihoods.length - 1);
const nextLikelihoodValue = totalLikelihoods[nextIndex];

// 词汇量（示例）
const vocabLevels = [
  200, 400, 750, 1200, 1700, 2100, 2600, 3200, 3800, 4000, 4500, 5000,
];
const maxLikelihoodVocabAmount = vocabLevels[maxLikelihoodIndex];
const nextVocabAmount = vocabLevels[nextIndex];
const intervalValue = nextVocabAmount - maxLikelihoodVocabAmount;
const ratio = (1 - maxLikelihoodValue / (Number(nextLikelihoodValue) + Number(maxLikelihoodValue))).toFixed(4);

let finalVocabAmount;
if (maxLikelihoodIndex < 13) {
  finalVocabAmount = ((maxLikelihoodVocabAmount + ratio * intervalValue) / expectedCorrectRates[nextIndex]).toFixed(0);
} else {
  finalVocabAmount = (((1 + ratio) / 2) * nextVocabAmount) / expectedCorrectRates[nextIndex];
}

console.log("最高似然值对应的等级:", Object.keys(probabilities)[maxLikelihoodIndex]);
console.log("下一个等级的似然值:", nextLikelihoodValue);
console.log("区间比例:", ratio);
console.log("预计的基础词汇量", nextVocabAmount);
console.log("预期的合格率", expectedCorrectRates[nextIndex]);
console.log("最终的词汇量:", finalVocabAmount);

// 打印每个阶段的似然值数组
for (const [name, array] of Object.entries(likelihoodArrays)) {
  console.log(`${name} 似然值数组:`, array);
}

