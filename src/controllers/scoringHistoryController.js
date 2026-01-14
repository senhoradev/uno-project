const scoringHistoryService = require('../services/scoringHistoryService');
 
 
exports.create = async (req, res) => {
  try {
    const scoringHistory = await scoringHistoryService.createscoringHistory(req.body);
    res.status(201).json(scoringHistory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
 
exports.getById = async (req, res) => {
  try {
    const scoringHistory = await scoringHistoryService.getscoringHistoryById(req.params.id);
    res.json(scoringHistory);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
 
exports.update = async (req, res) => {
  try {
    const scoringHistory = await scoringHistoryService.updatescoringHistory(req.params.id, req.body);
    res.json(scoringHistory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
 
exports.delete = async (req, res) => {
  try {
    const result = await scoringHistoryService.deletescoringHistory(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
