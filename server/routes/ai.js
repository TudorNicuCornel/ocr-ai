const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const firestore = require('../config/db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/generate-departments', async (req, res) => {
  try {
    const { cui, caenCode, denCaen } = req.body;

    const prompt = `As an organizational expert, suggest 3-5 relevant departments for a company with the following details:
    CUI (Company ID): ${cui}
    CAEN Code (Industry Code): ${caenCode}
    Industry Description: ${denCaen}

    Please provide departments that would be most suitable for this type of business.
    Format the response as a JSON array of department objects with 'name' property only.
    Example: {"departments": [{"name": "Human Resources"}, {"name": "Finance"}]}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const departments = JSON.parse(completion.choices[0].message.content);
    
    res.json({
      success: true,
      departments: departments.departments.map(dept => ({
        ...dept,
        id: Date.now() + Math.random(),
        employees: [],
        position: { x: 400, y: 300 }
      }))
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate departments',
      error: error.message
    });
  }
});

// New chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, collectionId, context } = req.body;

    // Create system message with context
    const systemMessage = `You are an AI assistant specialized in organizational management. 
    You have access to the following organization information:
    
    Departments: ${JSON.stringify(context.departments)}
    CEO: ${context.adminData.name} (${context.adminData.position})
    
    Use this information to provide accurate and relevant responses about the organization.
    When asked about specific employees or departments, refer to this data.
    If asked about something not in the data, mention that you don't have that information.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1000
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message
    });
  }
});

// Optional: Add an endpoint to get organization context
router.get('/context/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const orgRef = firestore.collection(collectionId);
    const doc = await orgRef.doc('orgChart').get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Organization data not found'
      });
    }

    res.json({
      success: true,
      data: doc.data()
    });
  } catch (error) {
    console.error('Context fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization context',
      error: error.message
    });
  }
});

module.exports = router;