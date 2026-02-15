import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

export const authUser = async (req, res, next) => {
    
    if (req.user) {
        console.log('authUser middleware - req.user already set, skipping authentication');
        return next();
    }

    try {
        const token = req.headers.token;
        console.log('AuthUser middleware - received token:', !!token);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try to find user first
        let user = await userModel.findById(decoded.id);
        if (user) {
            req.user = user;
            req.userType = 'patient';
            console.log('AuthUser middleware - user found, calling next()');
            next();
            console.log('AuthUser middleware - returned from next()');
            return;
        }

        // If not found in users, try doctors
        let doctor = await doctorModel.findById(decoded.id);
        if (doctor) {
            req.user = doctor;
            req.userType = 'doctor';
            console.log('AuthUser middleware - doctor found, calling next()');
            next();
            console.log('AuthUser middleware - returned from next()');
            return;
        }

        // If neither found
        return res.status(401).json({
            success: false,
            message: 'User not found'
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

export const authDoctor = async (req, res, next) => {
    try {
        const token = req.headers.dtoken;
        console.log('AuthDoctor middleware - received token:', !!token);
        console.log('AuthDoctor middleware - headers:', req.headers);
        
        if (!token) {
            console.error('No token provided in request headers');
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('AuthDoctor middleware - decoded token:', decoded);
        
        const doctor = await doctorModel.findById(decoded.id);
        console.log('AuthDoctor middleware - found doctor:', doctor?._id);
        
        if (!doctor) {
            console.error('Doctor not found in database');
            return res.status(401).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        req.user = doctor;
        req.userType = 'doctor';
        console.log('AuthDoctor middleware - doctor authenticated, calling next()');
        next();
    } catch (error) {
        console.error('AuthDoctor middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}; 