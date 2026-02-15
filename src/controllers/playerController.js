const playerService = require('../services/playerService');
const PlayerResponseDTO = require('../DTO/Response/PlayerResponseDTO');

/**
 * Função utilitária para centralizar o tratamento de erros do Result Monad
 * e mapear para os status HTTP corretos.
 */
const sendErrorResponse = (res, error) => {
  const statusMap = {
    'VALIDATION_ERROR': 400,
    'CONFLICT': 409,
    'UNAUTHORIZED': 401,
    'NOT_FOUND': 404,
    'DATABASE_ERROR': 500,
    'AUTH_ERROR': 401
  };

  return res.status(statusMap[error.code] || 400).json({
    error: error.message,
    code: error.code
  });
};

exports.register = async (req, res) => {
  const result = await playerService.createPlayer(req.body);
  
  if (result.isErr()) {
    return sendErrorResponse(res, result.error);
  }

  // Mantém o uso da DTO para a resposta
  const response = new PlayerResponseDTO(result.value.username, result.value.email);
  return res.status(201).json(response);
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const result = await playerService.login(username, password);
  
  if (result.isErr()) {
    return sendErrorResponse(res, result.error);
  }

  return res.json(result.value);
};

exports.create = async (req, res) => {
  const result = await playerService.createPlayer(req.body);
  
  if (result.isErr()) {
    return sendErrorResponse(res, result.error);
  }

  const response = new PlayerResponseDTO(result.value.username, result.value.email);
  return res.status(201).json(response);
};

exports.getById = async (req, res) => {
  const result = await playerService.getPlayerById(req.params.id);
  
  if (result.isErr()) {
    return sendErrorResponse(res, result.error);
  }

  const response = new PlayerResponseDTO(result.value.username, result.value.email);
  return res.json(response);
};

exports.update = async (req, res) => {
  const result = await playerService.updatePlayer(req.params.id, req.body);
  
  if (result.isErr()) {
    return sendErrorResponse(res, result.error);
  }

  const response = new PlayerResponseDTO(result.value.username, result.value.email);
  return res.json(response);
};

exports.delete = async (req, res) => {
  const result = await playerService.deletePlayer(req.params.id);
  
  if (result.isErr()) {
    return sendErrorResponse(res, result.error);
  }
};

exports.getAll = async (req, res) => {
  try {
    const players = await playerService.getAllPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};