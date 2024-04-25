// 필요한 모듈들을 불러옵니다.
const express = require('express');
const cookieParser = require('cookie-parser');
// 포스트 데이터를 관리하는 별도의 모듈을 불러옵니다.
const posts = require('./posts');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Express 애플리케이션을 초기화합니다.
const app = express();

// JSON 요청 본문을 파싱하기 위해 express.json() 미들웨어를 사용합니다.
app.use(express.json());
// CORS 이슈를 방지하기 위해 cors 미들웨어를 사용합니다.
app.use(cors());
// 쿠키를 파싱하기 위해 cookie-parser 미들웨어를 사용합니다.
app.use(cookieParser());

// JWT를 생성하고 검증할 때 사용할 비밀키를 정의합니다.
const secretText = 'superSecret';
const refreshSecretText = 'supersuperSecret';

// 유효한 리프레시 토큰을 저장하는 배열을 초기화합니다.
const refreshTokens = [];

// 사용자 로그인 요청을 처리하는 라우트를 정의합니다.
app.post('/login', (req, res) => {
    // 요청 본문에서 사용자 이름을 추출합니다.
    const user = { name: req.body.username };
    // 액세스 토큰을 생성합니다.
    const accessToken = jwt.sign(user, secretText, { expiresIn: '30s' });
    // 리프레시 토큰을 생성합니다.
    const refreshToken = jwt.sign(user, refreshSecretText, { expiresIn: '1d' });
    // 리프레시 토큰 목록에 새 토큰을 추가합니다.
    refreshTokens.push(refreshToken);
    // 쿠키에 리프레시 토큰을 설정합니다.
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    });
    // 액세스 토큰을 응답으로 보냅니다.
    res.json({ accessToken: accessToken });
});

// 액세스 토큰이 필요한 포스트 요청을 처리하는 라우트를 정의합니다.
app.get('/posts', authMiddleware, (req, res) => {
    // 인증이 완료된 후, 포스트 데이터를 응답으로 보냅니다.
    res.json(posts);
});

// 인증 미들웨어 함수입니다. 헤더에서 액세스 토큰을 검증합니다.
function authMiddleware(req, res, next) {
    // 요청 헤더에서 'authorization'을 읽어옵니다.
    const authHeader = req.headers['authorization'];
    // 토큰이 있는 경우 분리하고, 없으면 null을 반환합니다.
    const token = authHeader && authHeader.split(' ')[1];
    // 토큰이 없으면 401 Unauthorized 응답을 보냅니다.
    if (!token) return res.sendStatus(401);

    // 토큰을 검증합니다.
    jwt.verify(token, secretText, (err, user) => {
        // 에러가 있는 경우 403 Forbidden 응답을 보냅니다.
        if (err) return res.sendStatus(403);
        // 검증이 성공하면 req.user에 사용자 정보를 추가하고 다음 미들웨어로 넘어갑니다.
        req.user = user;
        next();
    });
}

// 리프레시 토큰을 검증하고 새 액세스 토큰을 발급하는 라우트를 정의합니다.
app.get('/refresh', (req, res) => {
    // 요청에서 쿠키를 가져옵니다.
    const cookies = req.cookies;
    // 쿠키에 'jwt' 토큰이 없으면 401 Unauthorized 응답을 보냅니다.
    if (!cookies?.jwt) return res.sendStatus(401);
    // 쿠키에서 리프레시 토큰을 추출합니다.
    const refreshToken = cookies.jwt;
    // 리프레시 토큰이 유효한 목록에 없으면 403 Forbidden 응답을 보냅니다.
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    
    // 리프레시 토큰을 검증합니다.
    jwt.verify(refreshToken, refreshSecretText, (err, user) => {
        // 에러가 있는 경우 403 Forbidden 응답을 보냅니다.
        if (err) return res.sendStatus(403);
        // 새 액세스 토큰을 발급합니다.
        const accessToken = jwt.sign({ name: user.name }, secretText, { expiresIn: '30s' });
        // 새 토큰을 응답으로 보냅니다.
        res.json({ accessToken: accessToken });
    });
});

// 서버가 4000번 포트에서 듣기를 시작합니다. 서버가 시작되면 콘솔에 메시지를 출력합니다.
const port = 4000;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
