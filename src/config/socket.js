/**
 * @fileoverview Configuracao do Socket.IO para suporte multijogador em tempo real.
 * Gerencia conexoes WebSocket, entrada/saida de jogadores em salas de jogo,
 * e comunicacao em tempo real entre servidor e clientes.
 * @module config/socket
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const gameService = require('../services/gameService');

/**
 * Inicializa o servidor Socket.IO com autenticacao JWT e eventos de jogo.
 * @param {http.Server} server - Instancia do servidor HTTP
 * @returns {Server} Instancia do Socket.IO
 */
function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  /**
   * Middleware de autenticacao do Socket.IO.
   * Valida o token JWT enviado via handshake.auth.token.
   * Se o token for valido, decodifica e anexa as informacoes do usuario ao socket.
   * Caso contrario, rejeita a conexao com um erro de autenticacao.
   */
  io.use((socket, next) => {
    const token =
    socket.handshake.auth.token ||
    socket.handshake.query.token;

    if (!token) {
      return next(new Error('Token de autenticacao necessario'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Token invalido ou expirado'));
    }
  });

  /**
   * Handler principal de conexao.
   * Cada socket conectado pode emitir eventos de jogo (join, ready, start, leave, etc.)
   * e recebe notificacoes em tempo real via salas (rooms) do Socket.IO.
   */
  io.on('connection', (socket) => {
    const userName = socket.user.username || 'Anonimo';
    console.log(`Nova conexao WebSocket: ${userName} (socket: ${socket.id})`);

    /**
     * Evento: join
     * Permite que um jogador entre em um jogo existente.
     * O jogador entra na sala (room) do Socket.IO correspondente ao jogo.
     *
     * Entrada JSON esperada:
     *   { "action": "join", "game_id": 1 }
     *
     * Saida JSON emitida para a sala:
     *   { "message": "Player1 has joined the game.", "players": ["Player1", "Player2", ...] }
     */
    socket.on('join', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        // Usa o gameService existente para adicionar o jogador
        await gameService.joinGame(game_id, socket.user.id);

        // Entra na sala do Socket.IO para receber eventos deste jogo
        const room = `game_${game_id}`;
        socket.join(room);

        // Busca a lista atualizada de jogadores
        const playersData = await gameService.getGamePlayers(game_id);

        // Emite para todos na sala (formato da especificacao)
        io.to(room).emit('player_joined', {
          message: `${userName} has joined the game.`,
          players: playersData.players
        });

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: rejoin
     * Permite que um jogador que ja esta no jogo reconecte a sala WebSocket
     * sem tentar entrar novamente no jogo pelo service.
     */
    socket.on('rejoin', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        const room = `game_${game_id}`;
        socket.join(room);

        const playersData = await gameService.getGamePlayers(game_id);

        socket.emit('rejoined', {
          message: `${userName} reconectou ao jogo.`,
          players: playersData.players
        });

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: ready
     * Alterna o status de "pronto" do jogador.
     * Notifica todos os jogadores na sala sobre a mudanca.
     */
    socket.on('ready', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        const result = await gameService.toggleReady(game_id, socket.user.id);

        const room = `game_${game_id}`;
        io.to(room).emit('player_ready', {
          player: userName,
          isReady: result.isReady,
          message: `${userName} ${result.isReady ? 'esta pronto!' : 'nao esta mais pronto'}`
        });

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: start
     * Inicia o jogo (apenas o criador pode iniciar, e todos devem estar prontos).
     * Notifica todos os jogadores na sala que o jogo comecou.
     */
    socket.on('start', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        await gameService.startGame(game_id, socket.user.id);

        const room = `game_${game_id}`;
        io.to(room).emit('game_started', {
          message: 'O jogo comecou!',
          game_id: game_id
        });

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: leave
     * Remove o jogador do jogo e notifica os demais.
     */
    socket.on('leave', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        await gameService.leaveGame(game_id, socket.user.id);

        const room = `game_${game_id}`;
        socket.leave(room);

        // Tenta buscar jogadores restantes
        try {
          const playersData = await gameService.getGamePlayers(game_id);
          io.to(room).emit('player_left', {
            message: `${userName} saiu do jogo.`,
            players: playersData.players
          });
        } catch (e) {
          // Se o jogo foi finalizado (nao encontrado ou sem jogadores)
          io.to(room).emit('game_ended', {
            message: 'O jogo foi encerrado por falta de jogadores.'
          });
        }

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: end
     * Finaliza o jogo (apenas o criador pode encerrar).
     * Notifica todos na sala sobre o encerramento.
     */
    socket.on('end', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        await gameService.endGame(game_id, socket.user.id);

        const room = `game_${game_id}`;
        io.to(room).emit('game_ended', {
          message: 'O jogo foi encerrado pelo criador.',
          game_id: game_id
        });

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: get_state
     * Retorna o estado atual do jogo para o jogador que solicitou.
     */
    socket.on('get_state', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        const state = await gameService.getGameState(game_id);
        socket.emit('game_state', state);

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: get_players
     * Retorna a lista de jogadores no jogo.
     */
    socket.on('get_players', async (data) => {
      try {
        const { game_id } = data;
        if (!game_id) {
          socket.emit('error', { error: 'game_id e obrigatorio' });
          return;
        }

        const players = await gameService.getGamePlayers(game_id);
        socket.emit('game_players', players);

      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Evento: chat_message
     * Permite comunicacao entre jogadores de um mesmo jogo via chat.
     */
    socket.on('chat_message', (data) => {
      const { game_id, message } = data;
      if (!game_id || !message) {
        socket.emit('error', { error: 'game_id e message sao obrigatorios' });
        return;
      }

      const room = `game_${game_id}`;
      io.to(room).emit('chat_message', {
        user: userName,
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    /**
     * Evento: disconnect
     * Executado quando o jogador perde a conexao WebSocket.
     */
    socket.on('disconnect', () => {
      console.log(`Jogador desconectado: ${userName} (socket: ${socket.id})`);
    });
  });

  return io;
}

module.exports = initSocket;
