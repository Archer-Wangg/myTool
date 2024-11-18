const xlsx = require('xlsx');
const fs = require('fs');

// 读取 Excel 文件
const workbook = xlsx.readFile('./10.30（修改版）词汇量检测单词（其他选项未修改）.xlsx'); // 将 'yourfile.xlsx' 替换为文件名
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// 转换为 JSON 格式
const jsonData = xlsx.utils.sheet_to_json(worksheet);

// 构建所需格式的数组
const formattedData = jsonData.map(item => {
  // 获取单词和选项，按顺序拼接成字符串
  const word = item['单词'];
  const correctAnswer = item['正确答案'];
  const options = [correctAnswer, item['其他错误选项'], item['__EMPTY'], item['__EMPTY_1'], correctAnswer];
  
  // 拼接成所需的格式字符串
  return `${word} ${options.join(' ')}`;
});

// 输出 JSON 文件
fs.writeFileSync('output.json', JSON.stringify(formattedData, null, 2), 'utf-8');
console.log('Excel 数据已成功转换为所需格式的 JSON 文件');

