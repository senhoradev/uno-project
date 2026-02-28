const playerService = require('../services/playerService');
const PlayerResponseDTO = require('../DTO/Response/PlayerResponseDTO');
const CreatePlayerRequestDTO = require('../DTO/Request/Player/CreatePlayerRequestDTO');
const UpdatePlayerRequestDTO = require('../DTO/Request/Player/UpdatePlayerResquestDTO');

const sendErrorResponse = (res, error) => {
  const statusMap = {
    VALIDATION_ERROR: 400,
    CONFLICT: 409,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    DATABASE_ERROR: 500,
    AUTH_ERROR: 401
  };

  return res.status(statusMap[error.code] || 400).json({
    error: error.message,
    code: error.code
  });
};

// CREATE
exports.create = async (req, res) => {
  try {
    const dto = new CreatePlayerRequestDTO(req.body);
    dto.validate();

    const result = await playerService.createPlayer(dto);

    return result.fold(
        value => res.status(201).json(new PlayerResponseDTO(value)),
        error => sendErrorResponse(res, error)
    );

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const result = await playerService.login(username, password);

  return result.fold(
      value => res.json(value), // normalmente retorna token/user info
      error => sendErrorResponse(res, error)
  );
};

// GET BY ID
exports.getById = async (req, res) => {
  const result = await playerService.getPlayerById(req.params.id);

  return result.fold(
      value => res.json(new PlayerResponseDTO(value)),
      error => sendErrorResponse(res, error)
  );
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const dto = new UpdatePlayerRequestDTO(req.body);
    dto.validate(); // lança erro se inválido

    const result = await playerService.updatePlayer(req.params.id, dto);

    return result.fold(
        value => res.json(new PlayerResponseDTO(value)),
        error => sendErrorResponse(res, error)
    );

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// DELETE
exports.delete = async (req, res) => {
  const result = await playerService.deletePlayer(req.params.id);

  return result.fold(
      () => res.status(204).send(),
      error => sendErrorResponse(res, error)
  );
};

// GET ALL
exports.getAll = async (req, res) => {
  const result = await playerService.getAllPlayers();

  return result.fold(
      value => res.json(value.map(player => new PlayerResponseDTO(player))),
      error => sendErrorResponse(res, error)
  );
};