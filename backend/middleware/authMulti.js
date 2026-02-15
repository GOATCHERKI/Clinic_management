import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

export default async function authMulti(req, res, next) {
    try {
        // Try user token first
        const userToken = req.headers.token;
        if (userToken) {
            try {
                const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
                const user = await userModel.findById(decoded.id);
                if (user) {
                    req.user = user;
                    req.userType = 'patient';
                    return next();
                }
            } catch (error) {
                console.log('User token verification failed:', error.message);
            }
        }

        // Try doctor token next
        const doctorToken = req.headers.dtoken;
        if (doctorToken) {
            try {
                const decoded = jwt.verify(doctorToken, process.env.JWT_SECRET);
                const doctor = await doctorModel.findById(decoded.id);
                if (doctor) {
                    req.user = doctor;
                    req.userType = 'doctor';
                    return next();
                }
            } catch (error) {
                console.log('Doctor token verification failed:', error.message);
            }
        }

        // If both fail, return unauthorized
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    } catch (error) {
        console.error('AuthMulti middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}