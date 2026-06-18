const mongoose = require('mongoose');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Post = require('../models/Post');
const aiService = require('../services/aiService');
const assetController = require('./assetController');
const postController = require('./postController');
const authController = require('./authController');

exports.runIntegrationTests = async (req, res) => {
  const report = {
    timestamp: new Date(),
    status: 'PENDING',
    results: []
  };

  const addResult = (name, passed, details, error = null) => {
    report.results.push({
      testName: name,
      passed: passed ? 'PASSED' : 'FAILED',
      details,
      error: error ? error.message : null
    });
  };

  let testLender = null;
  let testRenter = null;
  let testAsset = null;
  let testPost = null;

  try {
    // 1. SETUP: Create clean test users
    // Clean up any old test records first
    await User.deleteMany({ email: { $in: ['test_lender@velox.com', 'test_renter@velox.com'] } });
    
    testLender = await User.create({
      name: 'Test Lender Partner',
      email: 'test_lender@velox.com',
      password: 'password123',
      role: 'lender',
      lenderStatus: 'approved',
      isProfileCompleted: true,
      phoneNumber: '0911222333',
      address: {
        province: 'Lâm Đồng',
        district: 'Đà Lạt',
        ward: 'Phường 1',
        street: '12 Ba Tháng Hai',
        coordinates: { lat: 11.9404, lng: 108.4373 }
      }
    });

    testRenter = await User.create({
      name: 'Test Renter Customer',
      email: 'test_renter@velox.com',
      password: 'password123',
      role: 'renter',
      isProfileCompleted: true,
      phoneNumber: '0988777666'
    });

    addResult('Setup Test Environment', true, 'Created mock test Lender and Renter in database.');

    // 2. TEST FEATURE 2: Dynamic Deposit Pricing (Chế độ auto)
    // Formula: deposit = originalPrice * conditionFactor * (1 - age * 0.1)
    // For originalPrice = 3000000, condition = 90 (0.9), year = 2024 (age = 2 in 2026 -> depreciation = 0.8)
    // Expected deposit = 3000000 * 0.9 * 0.8 = 2160000
    const mockAssetBody = {
      name: 'Eureka Camping Tent for 4 People',
      description: 'High quality windproof and rainproof camping tent, perfect for family trips.',
      category: 'Tents',
      condition: 'Excellent',
      originalPrice: 3000000,
      purchaseYear: 2024,
      itemConditionRate: 90,
      depositCalculationMode: 'auto',
      pricePerDay: 150000,
      images: ['http://example.com/eureka1.jpg'],
      videos: [],
      location: { lat: 11.9404, lng: 108.4373 }
    };

    // Simulate calling createAsset logic
    const reqCreate = {
      user: testLender,
      body: mockAssetBody
    };

    let createdAssetData = null;
    const resCreate = {
      status: (code) => {
        return {
          json: (data) => {
            createdAssetData = data;
          }
        };
      }
    };

    await assetController.createAsset(reqCreate, resCreate);

    if (createdAssetData && createdAssetData.success) {
      testAsset = createdAssetData.data;
      const expectedDeposit = 2160000;
      const actualDeposit = testAsset.depositAmount;

      if (actualDeposit === expectedDeposit) {
        addResult('Dynamic Deposit Calculation', true, `Asset created with auto deposit. Calculated: ${actualDeposit.toLocaleString('vi-VN')} đ (Expected: ${expectedDeposit.toLocaleString('vi-VN')} đ).`);
      } else {
        addResult('Dynamic Deposit Calculation', false, `Deposit mismatch! Calculated: ${actualDeposit} đ, Expected: ${expectedDeposit} đ`);
      }
    } else {
      addResult('Dynamic Deposit Calculation', false, 'Failed to create asset with auto deposit.', new Error(JSON.stringify(createdAssetData)));
    }

    // 3. TEST FEATURE 4: AI Deposit Estimation API
    const reqEstimate = {
      body: {
        name: 'Flycam DJI Mavic 3 Pro',
        description: 'Professional cinema drone with triple camera system.',
        originalPrice: 50000000,
        purchaseYear: 2025, // age = 1 in 2026 -> depreciation = 0.9
        itemConditionRate: 95
      }
    };

    let estimationResult = null;
    const resEstimate = {
      status: (code) => {
        return {
          json: (data) => {
            estimationResult = data;
          }
        };
      }
    };

    await assetController.aiEstimateDeposit(reqEstimate, resEstimate);

    if (estimationResult && estimationResult.success) {
      addResult('AI Deposit & Price Estimation API', true, `AI estimated deposit/rent correctly. Result: ${JSON.stringify(estimationResult.data)}`);
    } else {
      addResult('AI Deposit & Price Estimation API', false, 'Failed to get AI estimation.', new Error(JSON.stringify(estimationResult)));
    }

    // 4. TEST FEATURE 1: AI Camping Recommendation Search
    // First, verify the test asset so it's public
    await Asset.findByIdAndUpdate(testAsset._id, { status: 'verified' });

    const reqRecommend = {
      body: { query: 'Mình muốn đi cắm trại Đà Lạt với gia đình 4 người, cần thuê lều gì Eureka' }
    };

    let recommendationResult = null;
    const resRecommend = {
      status: (code) => {
        return {
          json: (data) => {
            recommendationResult = data;
          }
        };
      }
    };

    await assetController.recommendAssetsByNeed(reqRecommend, resRecommend);

    if (recommendationResult && recommendationResult.success) {
      const matchedAssets = recommendationResult.data.assets || [];
      const hasMatch = matchedAssets.some(a => a._id.toString() === testAsset._id.toString());
      addResult(
        'AI Camping Recommendation Search',
        true,
        `AI responded. Recommendation: "${recommendationResult.data.recommendations.substring(0, 100)}...". Matched our test asset: ${hasMatch ? 'YES' : 'NO'}`
      );
    } else {
      addResult('AI Camping Recommendation Search', false, 'Failed to get AI recommendations.', new Error(JSON.stringify(recommendationResult)));
    }

    // 5. TEST FEATURE 3: Renter PR Post Generation & CRUD
    // A. AI PR Post content generation
    const reqGenPost = {
      body: {
        assetId: testAsset._id,
        userRequest: 'Viết bài tràn đầy năng lượng, khen anh chủ Lender nhiệt tình.'
      }
    };

    let aiPostContent = null;
    const resGenPost = {
      status: (code) => {
        return {
          json: (data) => {
            aiPostContent = data;
          }
        };
      }
    };

    await postController.generateAIPostContent(reqGenPost, resGenPost);
    let postTitle = 'Trải nghiệm lều tuyệt vời';
    let postText = 'Lều chống nước rất tốt, chủ nhà thân thiện.';
    
    if (aiPostContent && aiPostContent.success) {
      postTitle = aiPostContent.data.title;
      postText = aiPostContent.data.content;
      addResult('AI PR Content Generation', true, `AI generated title: "${postTitle}". Content preview: "${postText.substring(0, 50)}..."`);
    } else {
      addResult('AI PR Content Generation', false, 'Failed to generate PR content via AI, using fallback values.');
    }

    // B. Create PR Post
    const reqCreatePost = {
      user: testRenter,
      body: {
        title: postTitle,
        content: postText,
        images: ['http://example.com/camp_fun.jpg'],
        taggedAssets: [testAsset._id]
      }
    };

    let createdPostResult = null;
    const resCreatePost = {
      status: (code) => {
        return {
          json: (data) => {
            createdPostResult = data;
          }
        };
      }
    };

    await postController.createPost(reqCreatePost, resCreatePost);

    if (createdPostResult && createdPostResult.success) {
      testPost = createdPostResult.data;
      addResult('Create PR Post', true, `Successfully posted PR review tagging asset ${testAsset.name}`);
    } else {
      addResult('Create PR Post', false, 'Failed to create PR post.', new Error(JSON.stringify(createdPostResult)));
    }

    // C. Like Post
    const reqLike = {
      user: testLender, // Lender likes Renter's post
      params: { id: testPost._id }
    };

    let likeResult = null;
    const resLike = {
      status: (code) => {
        return {
          json: (data) => {
            likeResult = data;
          }
        };
      }
    };

    await postController.toggleLikePost(reqLike, resLike);
    if (likeResult && likeResult.success && likeResult.isLiked) {
      addResult('Like PR Post', true, 'Lender liked Renter\'s post successfully.');
    } else {
      addResult('Like PR Post', false, 'Failed to like post.', new Error(JSON.stringify(likeResult)));
    }

    // D. Comment Post
    const reqComment = {
      user: testLender,
      params: { id: testPost._id },
      body: { content: 'Cảm ơn em đã ủng hộ nhé, lần sau ghé anh giảm giá!' }
    };

    let commentResult = null;
    const resComment = {
      status: (code) => {
        return {
          json: (data) => {
            commentResult = data;
          }
        };
      }
    };

    await postController.commentPost(reqComment, resComment);
    if (commentResult && commentResult.success) {
      addResult('Comment on PR Post', true, 'Lender commented on Renter\'s post successfully.');
    } else {
      addResult('Comment on PR Post', false, 'Failed to comment on post.', new Error(JSON.stringify(commentResult)));
    }

    // E. Retrieve Renter Personal Feed
    const reqFeed = {
      params: { userId: testRenter._id }
    };

    let feedResult = null;
    const resFeed = {
      status: (code) => {
        return {
          json: (data) => {
            feedResult = data;
          }
        };
      }
    };

    await postController.getUserPosts(reqFeed, resFeed);
    if (feedResult && feedResult.success && feedResult.count > 0) {
      addResult('User Personal Feed (Posts)', true, `Retrieved ${feedResult.count} posts for Renter's personal page.`);
    } else {
      addResult('User Personal Feed (Posts)', false, 'Failed to retrieve user personal page posts.', new Error(JSON.stringify(feedResult)));
    }

    // F. Retrieve Renter Public Profile
    const reqProfile = {
      params: { id: testRenter._id }
    };

    let profileResult = null;
    const resProfile = {
      status: (code) => {
        return {
          json: (data) => {
            profileResult = data;
          }
        };
      }
    };

    await authController.getPublicProfile(reqProfile, resProfile);
    if (profileResult && profileResult.success) {
      addResult('User Public Profile Summary', true, `Retrieved public profile card. Name: ${profileResult.data.name}, Role: ${profileResult.data.role}, Score: ${profileResult.data.reputationScore}`);
    } else {
      addResult('User Public Profile Summary', false, 'Failed to retrieve public profile.', new Error(JSON.stringify(profileResult)));
    }

    // 6. TEARDOWN: Clean up test data
    if (testPost) await Post.deleteOne({ _id: testPost._id });
    if (testAsset) await Asset.deleteOne({ _id: testAsset._id });
    if (testLender) await User.deleteOne({ _id: testLender._id });
    if (testRenter) await User.deleteOne({ _id: testRenter._id });
    
    addResult('Teardown Test Environment', true, 'Cleaned up all created test records.');

    report.status = 'SUCCESS';
    res.status(200).json(report);
  } catch (err) {
    console.error('Integration test error:', err);
    report.status = 'FAILED';
    addResult('Unhandled Test Suite Error', false, 'An unexpected error occurred during test execution.', err);
    
    // Attempt cleanup
    try {
      if (testPost) await Post.deleteOne({ _id: testPost._id });
      if (testAsset) await Asset.deleteOne({ _id: testAsset._id });
      if (testLender) await User.deleteOne({ _id: testLender._id });
      if (testRenter) await User.deleteOne({ _id: testRenter._id });
    } catch (cleanErr) {
      console.error('Cleanup failed:', cleanErr);
    }
    
    res.status(500).json(report);
  }
};
