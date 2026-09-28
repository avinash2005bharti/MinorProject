const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Central Chat Orchestrator (Node ↔ Python)
router.post('/chat', optionalAuth, aiController.chat);

// User Memory and Context
router.get('/conversations', optionalAuth, aiController.getConversations);
router.get('/conversations/:id', optionalAuth, aiController.getConversationById);
router.get('/memory', optionalAuth, aiController.getUserMemory);

// Suggestions and RAG
router.get('/suggestions', optionalAuth, aiController.getSuggestions);
router.post('/rag/search', optionalAuth, aiController.ragSearch);

module.exports = router;
