const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

// All AI endpoints require verified authentication (SEC-02)
router.use(verifyToken);

// Central Chat Orchestrator (Node ↔ Python)
router.post('/chat', aiController.chat);
router.post('/', aiController.chat); // for /api/chat directly
router.post('/stream', aiController.chatStream);
router.post('/chat/stream', aiController.chatStream);

// Static routes first
router.get('/suggestions', aiController.getSuggestions);
router.get('/memory', aiController.getUserMemory);
router.post('/rag/search', aiController.ragSearch);
router.post('/tools/execute', aiController.executeTool);
router.get('/observability', aiController.getObservability);

// Conversations & Chats routes
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:id', aiController.getConversationById);
router.delete('/conversations/:id', aiController.deleteConversation);
router.get('/chats', aiController.getConversations);
router.get('/chats/:id', aiController.getConversationById);
router.delete('/chats/:id', aiController.deleteConversation);

// Root routes
router.get('/', aiController.getConversations);
router.get('/:id', aiController.getConversationById);
router.delete('/:id', aiController.deleteConversation);

module.exports = router;

