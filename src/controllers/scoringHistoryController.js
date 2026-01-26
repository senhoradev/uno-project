const scoringHistoryService = require('../services/scoringHistoryService');

exports.create = async (req, res) => {
  try {
    // Alterado de createscoringHistory para createScore
    const scoringHistory = await scoringHistoryService.createScore(req.body);
    res.status(201).json(scoringHistory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    // Alterado de getscoringHistoryById para getScoreById
    const scoringHistory = await scoringHistoryService.getScoreById(req.params.id);
    res.json(scoringHistory);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    // Alterado de updatescoringHistory para updateScore
    const scoringHistory = await scoringHistoryService.updateScore(req.params.id, req.body);
    res.json(scoringHistory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    // Alterado de deletescoringHistory para deleteScore
    const result = await scoringHistoryService.deleteScore(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};