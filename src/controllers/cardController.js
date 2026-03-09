const cardService = require('../services/cardService');

exports.getAll = async (req, res) => {
  try {
    const { game_id } = req.query;
    const cards = await cardService.getAllCards(game_id);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const card = await cardService.createCard(req.body);
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const card = await cardService.getCardById(req.params.id);
    res.json(card);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const card = await cardService.updateCard(req.params.id, req.body);
    res.json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await cardService.deleteCard(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};