const fs = require('fs');
const XLSX = require('xlsx');

// 读取现有的 JSON 文件
const jsonName = 'neimenggu-schools';
fs.readFile(`${jsonName}.json`, 'utf8', (err, data) => {
  if (err) {
    console.error('文件读取失败', err);
    return;
  }

  console.log('读取到的数据:', data); // 打印读取到的数据

  try {
    const allResults = JSON.parse(data); // 解析 JSON 数据

    // 验证 allResults 是否为数组
    console.log('allResults的类型:', Array.isArray(allResults.results) ? 'Array' : typeof allResults);

    if (!Array.isArray(allResults.results)) {
      console.error('数据格式不正确，期望是数组。');
      return;
    }

    const processedArray = allResults.results.map(item => {        
        if (item.location === undefined) {
            console.log(item);
            return;            
        }

        const { name, address, province, city, area, location } = item;
        return {
          name,
          address,
          province,
          city,
          area,
          lat: location.lat || undefined,
          lng: location.lng || undefined
        };
    });

    const citySchoolData = {};
    const uncategorizedSchools = []; // 用于存放未分类的学校
    
    // 遍历所有学校数据，并按城市分类
    processedArray.forEach(school => {
      const city = school.city || ''; // 确保有地址信息
      const cityName = city.match(/^(.*?市|.*?自治州|.*?县|.*?盟|.*?区)/);; // 使用正则表达式提取城市名称

      if (cityName) {
        const cityKey = cityName[1];
        if (!citySchoolData[cityKey]) {
          citySchoolData[cityKey] = [];
        }
        citySchoolData[cityKey].push(school); // 将学校数据按城市分类
      } else {
        // 如果没有城市名，将学校放入未分类数组
        uncategorizedSchools.push(school);
      }
    });
    
    // 打印未分类学校的信息
    if (uncategorizedSchools.length > 0) {
      console.log('未分类的学校:', uncategorizedSchools);
    } else {
      console.log('所有学校都已成功分类。');
    }

    // 创建 Excel 文件
    const workbook = XLSX.utils.book_new();

    // 将每个城市的数据转换为工作表
    for (const city in citySchoolData) {
      const worksheet = XLSX.utils.json_to_sheet(citySchoolData[city]);
      XLSX.utils.book_append_sheet(workbook, worksheet, city);
    }

    // 处理未分类的学校数据并创建新的工作表
    if (uncategorizedSchools.length > 0) {
      const uncategorizedWorksheet = XLSX.utils.json_to_sheet(uncategorizedSchools);
      XLSX.utils.book_append_sheet(workbook, uncategorizedWorksheet, '未分类学校'); // 新工作表名为“未分类学校”
    }

    // 写入 Excel 文件
    XLSX.writeFile(workbook, `${jsonName}.xlsx`);
    console.log(`分类后的数据已成功保存到 ${jsonName}.xlsx 文件！`);

  } catch (error) {
    console.error('解析 JSON 数据失败', error);
  }
});