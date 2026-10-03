const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Central Chat Orchestrator (Node ↔ Python)
router.post('/chat', optionalAuth, aiController.chat);
router.post('/', optionalAuth, aiController.chat); // for /api/chat directly
router.post('/stream', optionalAuth, aiController.chatStream);
router.post('/chat/stream', optionalAuth, aiController.chatStream);

// Static routes first
router.get('/suggestions', optionalAuth, aiController.getSuggestions);
router.get('/memory', optionalAuth, aiController.getUserMemory);
router.post('/rag/search', optionalAuth, aiController.ragSearch);
router.post('/tools/execute', optionalAuth, aiController.executeTool);
router.get('/observability', optionalAuth, aiController.getObservability);

// Conversations & Chats routes
router.get('/conversations', optionalAuth, aiController.getConversations);
router.get('/conversations/:id', optionalAuth, aiController.getConversationById);
router.delete('/conversations/:id', optionalAuth, aiController.deleteConversation);
router.get('/chats', optionalAuth, aiController.getConversations);
router.get('/chats/:id', optionalAuth, aiController.getConversationById);
router.delete('/chats/:id', optionalAuth, aiController.deleteConversation);

// Root routes
router.get('/', optionalAuth, aiController.getConversations);
router.get('/:id', optionalAuth, aiController.getConversationById);
router.delete('/:id', optionalAuth, aiController.deleteConversation);

module.exports = router;

