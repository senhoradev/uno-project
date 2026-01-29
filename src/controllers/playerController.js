const playerService = require('../services/playerService');
require('../DTO/Response/PlayerResponseDTO')


exports.register = async (req, res) => {
  try {
    const userResponse = await playerService.createPlayer(req.body);

    return res.status(201).json(userResponse);
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(400).json({ error: error.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await playerService.login(username, password);
    
    // Retorna o token de acesso em caso de sucesso
    res.json(result);
  } catch (error) {
    // Retorna erro de credenciais inválidas conforme solicitado
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        "error": "Invalid credentials"
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

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