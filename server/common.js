const jwt = require('jsonwebtoken');
const secret = 'knflerf3i3f8f5h3n59bds'

const verifyToken = (requiredPermissions = 4) => async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send('Authorization error: Token not provided');
    }

    try {
        const payload = jwt.verify(token, secret);
        // Assuming permissions are part of the payload
        if (payload.permissionsStatus <= requiredPermissions) {
            next();
        } else {
            return res.status(403).send('Authorization error: Insufficient permissions');
        }
    } catch (err) {
        console.error('Middleware: Token verification error', err);
        return res.status(401).send('Authorization error: Invalid token');
    }
};


const getUserId = (token) => {
    if (!token) {
        throw new Error('Authorization error: Token not provided');
    }

    try {
        const payload = jwt.verify(token, secret);
        // Assuming permissions are part of the payload
        if (payload && payload.userId) {
            return payload.userId;
        } else {
            throw new Error('Authorization error: Permissions status not found');
        }
    } catch (err) {
        console.error('Middleware: Token verification error', err);
        throw new Error('Authorization error: Invalid token');
    }
};

const getOfficeId = (token) => {
    if (!token) {
        throw new Error('Authorization error: Token not provided');
    }

    try {
        const payload = jwt.verify(token, secret);
        // Assuming permissions are part of the payload
        if (payload && payload.userId) {
            return payload.officeId;
        } else {
            throw new Error('Authorization error: Permissions status not found');
        }
    } catch (err) {
        console.error('Middleware: Token verification error', err);
        throw new Error('Authorization error: Invalid token');
    }
};

// const verifyToken = async (req, res, next) => {
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).send('Authorization error: Token not provided');
//     }

//     try {
//         const payload = jwt.verify(token, secret);
//         next();
//     } catch (err) {
//         return res.status(401).send('Authorization error: Invalid token');
//     }
// };

module.exports = { secret, verifyToken, getUserId, getOfficeId }