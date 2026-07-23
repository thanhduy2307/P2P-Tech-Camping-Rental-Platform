const https = require('https');

/**
 * Call Gemini API using native https module to avoid external dependency issues.
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
const cleanAndParseJSON = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  // Robust fallback: Extract first '{' to last '}' to bypass any conversational intro/outro text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  // Sanitize control characters (except \t, \n, \r) that break JSON.parse
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return JSON.parse(cleaned);
};

const callGeminiAPI = (prompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return reject(new Error('GEMINI_API_KEY is not configured in .env file'));
    }

    const data = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    let isSettled = false;
    
    // Global request timer (60 seconds) to force fallback if DNS, TCP, or API hangs
    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        req.destroy();
        reject(new Error('Gemini API request global timeout (60s)'));
      }
    }, 60000);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (isSettled) return;
        clearTimeout(timer);
        isSettled = true;
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Gemini API error (Status ${res.statusCode}): ${body}`));
          }
          const json = JSON.parse(body);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(`Invalid response structure from Gemini API: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      if (isSettled) return;
      clearTimeout(timer);
      isSettled = true;
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

/**
 * AI Feature 1: Camping Consultant / Gear Recommendation
 */
exports.generateCampingRecommendation = async (query, availableAssets, location) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return getLocalCampingRecommendation(query, availableAssets);
  }

  try {
    const assetListForAI = availableAssets.map(a => ({
      id: a._id.toString(),
      name: a.name,
      category: a.category,
      pricePerDay: a.pricePerDay,
      condition: a.condition || 'Tốt',
      description: a.description
    }));

    const campingKeywords = /cắm trại|camping|dã ngoại|trekking|leo núi|đi bộ|túi ngủ|lều|bếp|nướng|thuê|thiết bị|đồ|đèn|pin|balo|tent|outdoor|sleeping|backpack|cook|hike|trail|ngủ|ngồi|ghế|bàn|sạc|solar|máy ảnh|vlog|quay|chụp|du lịch|phượt|giày|gậy|mũ|áo khoác|gió|mưa|lạnh|ấm|chống|nước|ngân sách|budget|giá|rẻ|tiết kiệm|mang vác|nhẹ|gọn|địa điểm|chỗ|ở đâu|gần/i;
    const isCampingQuery = campingKeywords.test(query);

    const locationInfo = location
      ? `Vị trí hiện tại của người dùng: ${location.lat}, ${location.lng} (latitude, longitude). Hãy gợi ý các địa điểm cắm trại nổi tiếng gần khu vực này nếu có thể.`
      : '';

    const prompt = `Bạn là chatbot tư vấn của EquipPeer - nền tảng thuê đồ cắm trại và dã ngoại P2P. Bạn CHỈ được phép trả lời câu hỏi về cắm trại, dã ngoại, leo núi, trekking và thiết bị ngoài trời.

QUY TẮC NGHIÊM NGẶT:
- Nếu câu hỏi KHÔNG liên quan đến cắm trại/dã ngoại/thiết bị ngoài trời, bạn PHẢI trả về JSON:
{"recommendations": "Xin lỗi, tôi chỉ tư vấn về cắm trại, dã ngoại và thiết bị ngoài trời. Bạn hãy đặt câu hỏi về nhu cầu cắm trại của mình nhé!", "recommendedAssetIds": [], "suggestedPlan": ""}
- TUYỆT ĐỐI KHÔNG bịa đặt, suy diễn, hoặc cố gắng biến câu hỏi không liên quan thành chủ đề cắm trại.
- KHÔNG được đề xuất thiết bị nếu câu hỏi không thực sự về nhu cầu cắm trại.
- Chỉ sử dụng danh sách thiết bị bên dưới để match. Nếu không có thiết bị phù hợp, trả về mảng rỗng.

${locationInfo}

Câu hỏi khách hàng: "${query}"

Danh sách thiết bị hiện có:
${JSON.stringify(assetListForAI, null, 2)}

${isCampingQuery ? `
Nếu câu hỏi thuộc chủ đề cắm trại/dã ngoại, hãy:
1. Tư vấn trang bị cần thiết cho chuyến đi, gợi ý địa điểm cắm trại gần vị trí người dùng nếu có thông tin.
2. Chọn thiết bị phù hợp từ danh sách. Nếu có ngân sách, CHỈ chọn thiết bị trong ngân sách.
3. Đưa checklist ngắn gọn.
` : `Câu hỏi này KHÔNG thuộc chủ đề cắm trại. Hãy trả về JSON từ chối như quy tắc.`}

Trả về JSON thuần túy (không markdown, không giải thích thêm):
{
  "recommendations": "Nội dung tư vấn hoặc lời từ chối.",
  "recommendedAssetIds": [],
  "suggestedPlan": ""
}`;

    const aiResponse = await callGeminiAPI(prompt);
    const parsed = cleanAndParseJSON(aiResponse);
    parsed.aiSource = "Gemini AI";

    // Backend safety net: force refusal if query has no camping keywords
    if (!isCampingQuery && parsed.recommendations && parsed.recommendedAssetIds && parsed.recommendedAssetIds.length > 0) {
      parsed.recommendations = "Xin lỗi, tôi chỉ tư vấn về cắm trại, dã ngoại và thiết bị ngoài trời. Bạn hãy đặt câu hỏi về nhu cầu cắm trại của mình nhé!";
      parsed.recommendedAssetIds = [];
      parsed.suggestedPlan = "";
    }
    return parsed;
  } catch (error) {
    console.error('Error generating AI recommendation, falling back to local:', error.message);
    return getLocalCampingRecommendation(query, availableAssets);
  }
};

/**
 * AI Feature 2: Smart Deposit & Rental Price Calculator
 */
exports.estimateDepositAndPrice = async (name, description, originalPrice, purchaseYear, condition) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // FALLBACK: Rule-based pricing
    return getLocalDepositAndPriceEstimate(originalPrice, purchaseYear, condition);
  }

  try {
    const prompt = `
Bạn là một chuyên gia định giá tài sản và thiết bị cho thuê.
Lender muốn đăng cho thuê thiết bị với thông tin sau:
- Tên thiết bị: ${name}
- Mô tả: ${description}
- Giá mua mới gốc: ${originalPrice} VNĐ
- Năm mua: ${purchaseYear}
- Độ mới/Chất lượng hiện tại: ${condition}%

Hãy phân tích và đề xuất:
1. Giá trị hiện tại ước tính của thiết bị (đã khấu hao theo thời gian và độ mới).
2. Số tiền đặt cọc (depositAmount) hợp lý để bảo vệ Lender nhưng vẫn thu hút Renter (thường từ 50% - 80% giá trị hiện tại).
3. Giá thuê theo ngày (pricePerDay) đề xuất (thường bằng 2% - 5% giá trị hiện tại của thiết bị).
4. Lời giải thích ngắn gọn bằng tiếng Việt.

Yêu cầu trả về kết quả định dạng JSON thuần túy theo cấu trúc sau:
{
  "estimatedCurrentValue": 0,
  "suggestedDeposit": 0,
  "suggestedPricePerDay": 0,
  "explanation": "Lời giải thích định giá chi tiết bằng tiếng Việt."
}
Đảm bảo kết quả trả về là JSON hợp lệ, không chứa ký tự markdown \`\`\`json ở đầu và cuối.
`;

    const aiResponse = await callGeminiAPI(prompt);
    const parsed = cleanAndParseJSON(aiResponse);
    parsed.aiSource = "Gemini AI";
    return parsed;
  } catch (error) {
    console.error('Error estimating price with AI, falling back to local:', error.message);
    return getLocalDepositAndPriceEstimate(originalPrice, purchaseYear, condition);
  }
};

/**
 * AI Feature 3: AI PR Content Assistant
 */
exports.generatePRContent = async (assetName, assetDesc, userRequest) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // FALLBACK: Template-based content generator
    return getLocalPRContent(assetName, assetDesc, userRequest);
  }

  try {
    const prompt = `
Bạn là một Copywriter chuyên nghiệp viết bài review dã ngoại và PR sản phẩm cực hay.
Renter muốn viết một bài PR/Review cho sản phẩm họ đã thuê để đăng lên trang cá nhân của họ:
- Tên thiết bị: ${assetName}
- Mô tả thiết bị: ${assetDesc}
- Yêu cầu thêm từ người dùng: ${userRequest || 'Hãy viết một bài viết đánh giá chi tiết, hấp dẫn và chân thực về trải nghiệm chuyến cắm trại dã ngoại sử dụng sản phẩm này.'}

Nhiệm vụ của bạn là tạo ra:
1. Một tiêu đề bài viết giật gân, cuốn hút.
2. Nội dung bài viết chi tiết, hành văn tự nhiên, có cảm xúc, nêu bật được lợi ích của thiết bị trong chuyến cắm trại (ví dụ: chống mưa tốt, ấm áp, nhẹ nhàng dễ mang vác).
3. Đề xuất các hashtags dã ngoại hot.

Yêu cầu trả về kết quả định dạng JSON thuần túy theo cấu trúc sau:
{
  "title": "Tiêu đề bài viết PR",
  "content": "Nội dung bài viết PR chi tiết bằng tiếng Việt (khoảng 200-400 từ).",
  "suggestedHashtags": ["#VeloX", "#Camping", "#Review"]
}
Đảm bảo kết quả trả về là JSON hợp lệ, không chứa ký tự markdown \`\`\`json ở đầu và cuối.
`;

    const aiResponse = await callGeminiAPI(prompt);
    const parsed = cleanAndParseJSON(aiResponse);
    parsed.aiSource = "Gemini AI";
    return parsed;
  } catch (error) {
    console.error('Error generating PR content with AI, falling back to local:', error.message);
    return getLocalPRContent(assetName, assetDesc, userRequest);
  }
};

// ==================== LOCAL FALLBACK IMPLEMENTATIONS ====================

function getLocalCampingRecommendation(query, availableAssets) {
  const normalizedQuery = query.toLowerCase();
  
  // Parse numbers from query
  let peopleCount = 2; // default
  const peopleMatch = normalizedQuery.match(/(\d+)\s*(người|ng|chỗ|nhân)/);
  if (peopleMatch) {
    peopleCount = parseInt(peopleMatch[1]);
  }

  let daysCount = 1; // default
  const daysMatch = normalizedQuery.match(/(\d+)\s*(ngày|ngay|đêm|dem)/);
  if (daysMatch) {
    daysCount = parseInt(daysMatch[1]);
  }

  // Parse max budget constraints (e.g. "tối đa 1000000", "ngân sách 1 triệu", "dưới 500k")
  let maxBudget = null;
  const budgetRegex = /(?:tối đa|dưới|budget|ngân sách|khoảng|giá|tiền)\s*(?:là\s*)?(\d+(?:[\.,\s]\d+)*)\s*(triệu|tr|k|đ|vnd|vnđ)?/i;
  const budgetMatch = normalizedQuery.match(budgetRegex);
  if (budgetMatch) {
    let budgetStr = budgetMatch[1].replace(/[\.,\s]/g, '');
    let value = parseFloat(budgetStr);
    let unit = budgetMatch[2] ? budgetMatch[2].toLowerCase() : '';
    if (unit === 'triệu' || unit === 'tr') {
      value = value * 1000000;
    } else if (unit === 'k') {
      value = value * 1000;
    }
    if (!isNaN(value) && value > 0) {
      maxBudget = value;
    }
  }

  let recommendations = `Dựa trên phân tích nhu cầu của bạn cho chuyến đi dã ngoại ${peopleCount} người trong ${daysCount} ngày, chúng tôi đề xuất các trang bị cơ bản sau: `;
  
  if (maxBudget) {
    recommendations += `Chúng tôi đã chọn lọc các thiết bị có giá thuê ngày phù hợp với ngân sách tối đa ${maxBudget.toLocaleString('vi-VN')} đ của bạn. `;
  }

  const suggestedChecklist = [];
  
  // Decide basic needs based on query analysis
  if (normalizedQuery.includes('trekking') || normalizedQuery.includes('đi bộ') || normalizedQuery.includes('leo núi')) {
    recommendations += `Vì bạn đi leo núi/trekking dã ngoại, hãy ưu tiên các thiết bị siêu nhẹ, balo trợ lực tốt, lều gọn nhẹ chống gió và túi ngủ giữ ấm tốt. `;
    suggestedChecklist.push("Balo trợ lực dã ngoại", "Lều leo núi gọn nhẹ chống gió", "Túi ngủ ấm", "Gậy trekking & Giày leo núi");
  } else {
    recommendations += `Đối với chuyến cắm trại giải trí thông thường, bạn nên chọn lều cắm trại rộng rãi (loại dành cho ${peopleCount} người), bạt che nắng (tarp), bếp ga dã ngoại để nấu nướng và bàn ghế xếp dã ngoại thư giãn. `;
    suggestedChecklist.push(`Lều cắm trại ${peopleCount} người`, "Bếp ga dã ngoại & dụng cụ nấu ăn", "Bàn ghế xếp dã ngoại", "Đèn lều tích điện");
  }

  // Filter available assets that match keywords
  const recommendedAssetIds = [];
  
  availableAssets.forEach(asset => {
    // Skip if daily price exceeds specified budget
    if (maxBudget && asset.pricePerDay > maxBudget) {
      return;
    }

    const assetName = asset.name.toLowerCase();
    const assetDesc = asset.description ? asset.description.toLowerCase() : '';
    const assetCategory = asset.category.toLowerCase();

    let matches = false;

    // Tent matches
    if (assetCategory.includes('tent') || assetCategory.includes('lều') || assetName.includes('lều') || assetName.includes('tent')) {
      if (peopleCount <= 2 && (assetName.includes('2') || assetName.includes('đôi') || assetName.includes('nhỏ'))) {
        matches = true;
      } else if (peopleCount >= 3 && (assetName.includes('3') || assetName.includes('4') || assetName.includes('tập thể') || assetName.includes('lớn'))) {
        matches = true;
      } else if (!assetName.includes('2') && !assetName.includes('4')) {
        matches = true; // generic tent
      }
    }

    // Mountain/hiking equipment matches
    if (normalizedQuery.includes('trekking') || normalizedQuery.includes('đi bộ') || normalizedQuery.includes('leo núi')) {
      if (assetName.includes('balo') || assetName.includes('trek') || assetName.includes('leo') || assetName.includes('túi ngủ') || assetName.includes('sleeping')) {
        matches = true;
      }
    }

    // Cookware/Kitchen matches
    if (normalizedQuery.includes('bếp') || normalizedQuery.includes('nấu') || normalizedQuery.includes('ăn') || normalizedQuery.includes('nướng')) {
      if (assetName.includes('bếp') || assetName.includes('nồi') || assetName.includes('nướng') || assetName.includes('cook')) {
        matches = true;
      }
    }

    // General match falls
    if (recommendedAssetIds.length < 3 && !matches) {
      // Add a couple of popular assets if list is short
      if (assetCategory.includes('phổ biến') || asset.pricePerDay > 50000) {
        matches = true;
      }
    }

    if (matches && recommendedAssetIds.length < 5) {
      recommendedAssetIds.push(asset._id.toString());
    }
  });

  return {
    recommendations,
    recommendedAssetIds,
    suggestedPlan: `Kế hoạch đề xuất: \n1. Chuẩn bị lều trại phù hợp với ${peopleCount} thành viên.\n2. Chuẩn bị thực phẩm và nước uống đủ cho ${daysCount} ngày.\n3. Đóng gói hành lý gọn gàng và phân chia mang vác.\n4. Liên hệ các Lender trên VeloX để nhận đồ trước giờ xuất phát 1 buổi.`,
    aiSource: "Local Fallback Simulation"
  };
}

function getLocalDepositAndPriceEstimate(originalPrice, purchaseYear, condition) {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - purchaseYear);
  
  // Calculate depreciation (10% per year, maximum 50% depreciation)
  const depreciationFactor = Math.max(0.5, 1 - (age * 0.1));
  
  // Condition factor (e.g. 90% condition -> 0.9)
  const conditionFactor = Math.min(100, Math.max(20, condition)) / 100;
  
  // Current estimated value
  const estimatedCurrentValue = Math.round(originalPrice * conditionFactor * depreciationFactor);
  
  // Suggested deposit (around 70% of current value, rounded to nearest 10k)
  const suggestedDeposit = Math.round((estimatedCurrentValue * 0.7) / 10000) * 10000;
  
  // Suggested price per day (around 3% of current value, rounded to nearest 5k)
  const suggestedPricePerDay = Math.round((estimatedCurrentValue * 0.03) / 5000) * 5000;

  const explanation = `[Dự phòng] Hệ thống định giá tự động dựa trên khấu hao thời gian và chất lượng:\n- Thiết bị của bạn đã sử dụng được khoảng ${age} năm (giảm ${Math.round((1 - depreciationFactor)*100)}% giá trị).\n- Tình trạng độ mới đạt ${condition}%.\n- Giá trị còn lại ước tính khoảng ${estimatedCurrentValue.toLocaleString('vi-VN')} đ.\n- Đề xuất tiền cọc khoảng 70% giá trị còn lại, và phí thuê bằng 3% giá trị mỗi ngày.`;

  return {
    estimatedCurrentValue,
    suggestedDeposit,
    suggestedPricePerDay,
    explanation,
    aiSource: "Local Fallback Simulation"
  };
}

function getLocalPRContent(assetName, assetDesc, userRequest) {
  const title = `Trải Nghiệm Tuyệt Vời Cùng Siêu Phẩm ${assetName} Từ VeloX!`;
  const content = `Mình vừa hoàn thành chuyến đi dã ngoại cuối tuần qua và muốn chia sẻ một chút về em máy/thiết bị ${assetName} mà mình đã thuê trên VeloX. 

Cảm giác đầu tiên là đồ cực kỳ mới và chất lượng đúng như Lender mô tả (${assetDesc}). Thiết bị hoạt động ổn định và giúp chuyến đi của nhóm mình trở nên trọn vẹn hơn rất nhiều. Việc thuê đồ qua VeloX vừa tiết kiệm chi phí mua sắm đồ mới, vừa yên tâm nhờ chính sách ký quỹ và hợp đồng rõ ràng. 

${userRequest ? `Ghi chú thêm: ${userRequest}` : 'Các bạn nào chuẩn bị đi cắm trại hay trekking thì highly recommend thuê em này nhé, đáng tiền lắm luôn!'}`;

  return {
    title,
    content,
    suggestedHashtags: ["#VeloX", "#CampingReview", "#ThueDoDaNgoai", `#${assetName.replace(/\s+/g, '')}`],
    aiSource: "Local Fallback Simulation"
  };
}

/**
 * Helper to call Gemini with an image part + text prompt.
 */
const callGeminiWithImage = (mimeType, base64Data, textPrompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return reject(new Error('GEMINI_API_KEY is not configured in .env file'));
    }

    const data = JSON.stringify({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: textPrompt
          }
        ]
      }]
    });

    let isSettled = false;
    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        req.destroy();
        reject(new Error('Gemini API image request global timeout (60s)'));
      }
    }, 60000);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (isSettled) return;
        clearTimeout(timer);
        isSettled = true;
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Gemini API error (Status ${res.statusCode}): ${body}`));
          }
          const json = JSON.parse(body);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(`Invalid response structure from Gemini API: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      if (isSettled) return;
      clearTimeout(timer);
      isSettled = true;
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

/**
 * AI-powered Image Anti-Fraud Scan.
 */
exports.scanImageForFraud = async (imageB64) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !imageB64) {
    return {
      isCopied: false,
      reason: "[Dự phòng] Mô phỏng quét ảnh chống giả: Ảnh chụp thực tế của sản phẩm không phát hiện watermark hoặc nguồn sao chép trực tuyến.",
      aiSource: "Local Fallback Simulation"
    };
  }

  try {
    let mimeType = 'image/jpeg';
    let base64Data = imageB64;

    if (imageB64.startsWith('data:')) {
      const parts = imageB64.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }
    }

    const prompt = `
Bạn là chuyên gia thẩm định, phòng chống gian lận thương mại điện tử và kiểm duyệt nội dung an toàn.
Hãy phân tích bức ảnh sản phẩm này để kiểm duyệt dựa trên 2 tiêu chí chính:
1. Nội dung nhạy cảm/không an toàn (NSFW): Phát hiện xem ảnh có chứa nội dung người lớn, khiêu dâm, bạo lực, rùng rợn, hoặc các chất cấm không phù hợp thuần phong mỹ tục không.
2. Gian lận hình ảnh (Fraud/Copied): Phát hiện xem ảnh có bị lấy từ trên mạng không (ví dụ: ảnh stock photo chuyên nghiệp, ảnh của hãng sản xuất, ảnh có watermark chìm của các trang thương mại điện tử khác như Shopee, Lazada, Amazon, hoặc web khác) hay bị chụp lại từ màn hình điện thoại/máy tính khác.

Nếu ảnh chứa nội dung nhạy cảm HOẶC là ảnh sao chép/mạng, hãy đánh dấu là vi phạm (isCopied = true). Nếu ảnh chụp thực tế sản phẩm một cách trung thực và an toàn, hãy báo cáo là an toàn (isCopied = false).

Yêu cầu trả về kết quả định dạng JSON thuần túy theo cấu trúc sau:
{
  "isCopied": true_hoặc_false,
  "reason": "Giải thích chi tiết bằng tiếng Việt về lý do đánh giá (nêu rõ vi phạm nội dung nhạy cảm hay vi phạm bản quyền/gian lận hình ảnh, hoặc an toàn)."
}
Đảm bảo kết quả trả về là JSON hợp lệ, không chứa ký tự markdown \`\`\`json ở đầu và cuối.
`;

    const aiResponse = await callGeminiWithImage(mimeType, base64Data, prompt);
    const parsed = cleanAndParseJSON(aiResponse);
    parsed.aiSource = "Gemini AI";
    return parsed;
  } catch (error) {
    console.error('Error in scanImageForFraud with AI, falling back to local:', error.message);
    return {
      isCopied: false,
      reason: `[Dự phòng - Lỗi API] Quét ảnh chống giả tạm tính: Ảnh chụp hợp lệ. Chi tiết lỗi: ${error.message}`,
      aiSource: "Local Fallback Simulation"
    };
  }
};

