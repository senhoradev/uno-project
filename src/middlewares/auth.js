const jwt = require('jsonwebtoken');

/**
 * Middleware para validar o token de acesso (JWT)
 * Extrai o token do Header Authorization ou do corpo da requisição.
 */
module.exports = (req, res, next) => {
  // 1. Tenta obter o token do Header (Bearer TOKEN) ou do campo access_token no corpo
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.body.access_token;

  // Se não houver token, retorna erro 401
  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    // 2. IMPORTANTE: A chave secreta deve ser EXATAMENTE a mesma do loginService/playerService
    // Mudamos de 'fallback_secret' para 'secret_key' para bater com seus serviços
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // 3. Salva os dados decodificados (id, username, email) no req.user
    // Isso é o que permite que o gameController saiba quem é o criador do jogo
    req.user = decoded; 
    
    next(); // Autorizado, segue para o controller
  } catch (error) {
    // Se o token for inválido ou a chave secreta não bater
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};