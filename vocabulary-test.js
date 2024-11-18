const math = require('mathjs');

// 识别概率
const probabilities = {
  p1: [0.95, 0.56, 0.3, 0.2, 0.14, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05, 0.03],
  p2: [0.95, 0.92, 0.60, 0.38, 0.28, 0.23, 0.19, 0.16, 0.14, 0.12, 0.10, 0.06],
  p3: [0.95, 0.95, 0.90, 0.72, 0.52, 0.43, 0.36, 0.30, 0.26, 0.25, 0.22, 0.20],
  m1: [0.98, 0.95, 0.92, 0.87, 0.83, 0.69, 0.58, 0.49, 0.42, 0.40, 0.35, 0.32],
  m2: [0.98, 0.98, 0.95, 0.90, 0.85, 0.83, 0.70, 0.58, 0.50, 0.48, 0.42, 0.38],
  m3: [0.98, 0.98, 0.95, 0.90, 0.87, 0.83, 0.78, 0.70, 0.61, 0.58, 0.51, 0.46],
  h1: [1.00, 0.98, 0.98, 0.95, 0.90, 0.85, 0.80, 0.75, 0.73, 0.70, 0.61, 0.55],
  h2: [1.00, 1.00, 0.98, 0.95, 0.90, 0.87, 0.85, 0.77, 0.74, 0.73, 0.72, 0.65],
  h3: [1.00, 1.00, 0.98, 0.95, 0.92, 0.90, 0.87, 0.80, 0.75, 0.74, 0.73, 0.68],
  t1: [1.00, 1.00, 1.00, 0.98, 0.92, 0.92, 0.90, 0.85, 0.80, 0.75, 0.74, 0.70],
  t2: [1.00, 1.00, 1.00, 1.00, 0.95, 0.95, 0.92, 0.87, 0.85, 0.80, 0.75, 0.72],
  t3: [1.00, 1.00, 1.00, 1.00, 0.95, 0.95, 0.92, 0.90, 0.87, 0.82, 0.77, 0.75]
};

const expectedCorrectRates = [0.95, 0.92, 0.9, 0.87, 0.85, 0.83, 0.8, 0.77, 0.75, 0.72, 0.72, 0.72];
// 实际正确率
const actualRates = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

// 正态分布的参数
const sigmaSquared = 0.01;
const sqrtTwoPiSigma = Math.sqrt(2 * Math.PI * sigmaSquared);

// 计算似然值的函数
function calculateLikelihood(observed, expected, sigma) {
  const exponent = -Math.pow(observed - expected, 2) / (2 * sigma);
  return (1 / sqrtTwoPiSigma) * Math.exp(exponent);
}

// 存储每个阶段总似然值的数组
const totalLikelihoods = [];

// 遍历每个数组并计算似然值
for (const [name, array] of Object.entries(probabilities)) {
  let totalLikelihood = 0;

  for (let i = 0; i < array.length; i++) {
    let likelihood = 0;
    let adjustedObserved = actualRates[i];

    if (actualRates[i] >= 0.3) {
      // 确定有效的期望值
      let effectiveExpected = array[i];

      // 如果实际正确率大于或等于期望正确率，调整观察值
      if (actualRates[i] >= expectedCorrectRates[i]) {
        adjustedObserved = expectedCorrectRates[i];
      }

      // 计算似然值
      likelihood = calculateLikelihood(adjustedObserved, effectiveExpected, sigmaSquared);
    }
    totalLikelihood += likelihood;
  }

  totalLikelihoods.push(totalLikelihood.toFixed(4));
}

// 输出每个阶段的总似然值
console.log('每个阶段的总似然值:');
Object.entries(probabilities).forEach(([name], index) => {
  console.log(`${name} 总似然值 ≈ ${totalLikelihoods[index]}`);
});

// 找到最高的似然值及其索引
const maxLikelihoodValue = Math.max(...totalLikelihoods);
const maxLikelihoodIndex = totalLikelihoods.indexOf(maxLikelihoodValue.toFixed(4));
const nextIndex = Math.min(maxLikelihoodIndex + 1, totalLikelihoods.length - 1);
const nextLikelihoodValue = totalLikelihoods[nextIndex];

// 计算小于1的数字
const ratio = nextLikelihoodValue / maxLikelihoodValue;

// 词汇量（示例）
const vocabLevels = [200, 400, 750, 1200, 1700, 2100, 2600, 3200, 3800, 4000, 4500, 5000];
const nextVocabAmount = vocabLevels[nextIndex];

// 计算最终词汇量
const finalVocabAmount = (ratio * nextVocabAmount) / expectedCorrectRates[nextIndex];

console.log('最高似然值对应的等级:', Object.keys(probabilities)[nextIndex]);
console.log('下一个等级的似然值:', nextLikelihoodValue);
console.log('小于1的数字:', ratio);
console.log('预计的基础词汇量', nextVocabAmount);
console.log('预期的合格率', expectedCorrectRates[nextIndex]);
console.log('最终的词汇量:', finalVocabAmount);
