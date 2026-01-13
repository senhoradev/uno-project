const playerService = require('../services/playerService');

exports.create = async (req, res) => {
  try {
    const player = await playerService.createPlayer(req.body);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const player = await playerService.getPlayerById(req.params.id);
    res.json(player);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const player = await playerService.updatePlayer(req.params.id, req.body);
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await playerService.deletePlayer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};