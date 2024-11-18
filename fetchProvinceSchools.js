const https = require('https');
const fs = require('fs');

// 初始化所有城市和存储学校数据的数组
const provinces = [
    // "重庆市",
    // "北京市",
    // "上海市",
    // "广州市",
    // "成都市",
    // "临沂市",
    // "广东省",
    // "江苏省",
    // "河南省",
    // "山东省",
    // "安徽省",
    "浙江省",
    // "河北省",
    // "湖南省",
    // "湖北省",
    // "四川省",
    // "广西壮族自治区",
    // "江西省",
    // "福建省",
    // "陕西省",
    // "贵州省",
    "云南省",
    // "辽宁省",
    // "山西省",
    // "黑龙江省",
    // "甘肃省",
    // "内蒙古自治区",
    // "吉林省",
    // "新疆维吾尔自治区",
    // "海南省",
    // "天津市",
    // "宁夏回族自治区",
    // "青海省",
    // "西藏自治区"
];
let allResults = [];
let cities = [];
const province = '天津';
const provincePingyin = 'tianjin';
const ak = '6aTdTioMOVlZno4HCtclbvHznSvulbQ0'

// 1. 获取所有市的函数
function fetchCities() {
    return new Promise((resolve, reject) => {
      const url = `https://api.map.baidu.com/place/v2/search?query=中学&region=${province}&output=json&ak=${ak}`;
  
      https.get(url, (resp) => {
        let data = '';
  
        resp.on('data', (chunk) => {
          data += chunk; // 累积数据块
        });
  
        
        resp.on('end', () => {
          try {
            const jsonData = JSON.parse(data); // 解析 JSON 数据
            if(jsonData.result_type === 'poi_type') {
                cities.push(province);
                console.log('城市数据获取成功:', cities);
                resolve(cities); // 返回城市数据
                return;
            };

            // 提取城市名并存入 cities 数组
            jsonData.results.forEach(city => {
              cities.push(city.name);
            });
  
            console.log('城市数据获取成功:', cities);
            resolve(cities); // 返回城市数据
          } catch (error) {
            console.error('解析错误，响应内容可能不是 JSON：', data);
            reject(error);
          }
        });
  
      }).on('error', (err) => {
        console.log('Error: ' + err.message);
        reject(err); // 出错时 reject Promise
      });
    });
  }

// 2. 获取学校数据的函数
 function fetchSchools(city, page) {
  return new Promise((resolve, reject) => {
    const url = `https://api.map.baidu.com/place/v2/search?query=中学&region=${city}&page_size=20&page_num=${page}&output=json&ak=${ak}`;

    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', async () => {
        try {
          const jsonData = JSON.parse(data);

          if (jsonData && jsonData.results ) {
            allResults = allResults.concat(jsonData.results);
            // 继续请求下一页的学校数据
            if (jsonData.results.length === 20) {
                await fetchSchools(city, page + 1).then(resolve);
                return
            }
          }
          console.log(`城市 ${city} 没有更多数据，终止请求。`);
          resolve(); // 如果没有更多学校数据，则停止
          return;
          // 将学校数据添加到 allResults 数组中

        } catch (error) {
          console.error('解析错误，响应内容可能不是 JSON：', data);
          reject(error);
        }
      });

    }).on('error', (err) => {
      console.log('Error: ' + err.message);
      reject(err); // 出错时 reject Promise
    });
  });
}

// 3. 遍历所有城市并获取学校数据

async function fetchAllCities() {
  await Promise.all(cities.map(async (item) => { 
    await fetchSchools(item, 0)
  }))
  // 等待所有城市的数据请求完成
    const outputData = {
      totalResults: allResults.length,
      results: allResults
    };
    
   
    fs.writeFile(`${provincePingyin}-schools.json`, JSON.stringify(outputData, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('文件保存失败', err);
        return;
      }
      console.log(`所有数据已成功保存到 ${provincePingyin}-schools.json 文件！`);
      console.log('总结果数量:', allResults.length);
    });
}

// 开始流程：先获取所有市，再获取各市的学校信息
// fetchCities().then(() => {
//   console.log('所有市数据获取完成，城市列表为：', cities);
//   fetchAllCities(); // 获取完市数据后，开始获取每个市的学校数据
// });
console.log(provinces.length);
