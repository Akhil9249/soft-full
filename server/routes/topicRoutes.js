// routes/topicRoutes.js
const express = require("express");
const router = express.Router();
// const topicController = require("../controllers/topicController");
const topicController = require("../controllers/syllabus-management/topicController");
const { checkAuth } = require("../middlewares/checkAuth");
const { checkPermission } = require("../middlewares/checkPermission");
        
router.post("/",checkAuth, checkPermission('topicManagement', 'addTopic'), topicController.createTopic);
router.get("/",checkAuth, checkPermission('topicManagement', 'viewTopic'), topicController.getTopics);
router.get("/:id",checkAuth, checkPermission('topicManagement', 'viewTopic'), topicController.getTopicById);
router.put("/:id",checkAuth, checkPermission('topicManagement', 'editTopic'), topicController.updateTopic);
router.delete("/:id",checkAuth, checkPermission('topicManagement', 'deleteTopic'), topicController.deleteTopic);

module.exports = router;
