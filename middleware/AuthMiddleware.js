const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'fail',
            message: 'Akses ditolak, token tidak ada',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        req.user = decoded; 
        next();
    } catch (error) {
        console.log("Detail Error JWT:", error.message); 
        res.status(403).json({
            status: 'fail',
            message: 'Token tidak valid atau sudah kadaluarsa',
        });
    }
};

module.exports = authMiddleware;