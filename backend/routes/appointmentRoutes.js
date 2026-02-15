import express from 'express';
import emailService from '../services/emailService.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import nodemailer from 'nodemailer';
import emailConfig from '../config/emailConfig.js';

const router = express.Router();

// Simple test route for basic email
router.post('/test-simple-email', async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            ...emailConfig,
            debug: true,
            logger: true
        });

        const mailOptions = {
            from: `"Smart Clinic" <${emailConfig.from}>`,
            to: 'REMOVED_EMAIL',
            subject: 'Test Email',
            text: 'This is a test email from Smart Clinic',
            html: '<h1>Test Email</h1><p>This is a test email from Smart Clinic</p>'
        };

        console.log('Sending test email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Test email sent:', info);
        
        res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message,
            stack: error.stack
        });
    }
});

// Test route to verify email sending
router.post('/test-email', async (req, res) => {
    try {
        const testAppointment = {
            patientName: 'Test Patient',
            doctorName: 'Test Doctor',
            date: '2024-03-20',
            time: '10:00 AM',
            reason: 'Test Appointment',
            location: 'Test Location'
        };

        await emailService.sendDoctorConfirmationEmail(
            'REMOVED_EMAIL', // Send to your email for testing
            testAppointment
        );

        res.json({
            success: true,
            message: 'Test email sent successfully'
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
});

// Test route to send emails to real doctor and user
router.post('/test-real-emails', async (req, res) => {
    try {
        // Fetch first doctor and user from database
        const doctor = await doctorModel.findOne();
        const user = await userModel.findOne();

        if (!doctor || !user) {
            return res.status(404).json({
                success: false,
                message: 'No doctor or user found in database'
            });
        }

        console.log('Found doctor:', doctor.email);
        console.log('Found user:', user.email);

        const transporter = nodemailer.createTransport({
            ...emailConfig,
            debug: true,
            logger: true
        });

        // Test email to doctor
        const doctorMailOptions = {
            from: `"Smart Clinic" <${emailConfig.from}>`,
            to: doctor.email,
            subject: 'Test Email to Doctor',
            text: `Hello Dr. ${doctor.name}, this is a test email from Smart Clinic.`,
            html: `<h1>Test Email to Doctor</h1>
                  <p>Hello Dr. ${doctor.name},</p>
                  <p>This is a test email from Smart Clinic.</p>
                  <p>Your email: ${doctor.email}</p>`
        };

        // Test email to user
        const userMailOptions = {
            from: `"Smart Clinic" <${emailConfig.from}>`,
            to: user.email,
            subject: 'Test Email to User',
            text: `Hello ${user.name}, this is a test email from Smart Clinic.`,
            html: `<h1>Test Email to User</h1>
                  <p>Hello ${user.name},</p>
                  <p>This is a test email from Smart Clinic.</p>
                  <p>Your email: ${user.email}</p>`
        };

        console.log('Sending test email to doctor:', doctor.email);
        const doctorInfo = await transporter.sendMail(doctorMailOptions);
        console.log('Doctor test email sent:', doctorInfo.messageId);

        console.log('Sending test email to user:', user.email);
        const userInfo = await transporter.sendMail(userMailOptions);
        console.log('User test email sent:', userInfo.messageId);

        res.json({
            success: true,
            message: 'Test emails sent successfully',
            doctorEmail: doctor.email,
            userEmail: user.email,
            doctorMessageId: doctorInfo.messageId,
            userMessageId: userInfo.messageId
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test emails',
            error: error.message,
            stack: error.stack
        });
    }
});

// Enhanced test route with detailed diagnostics
router.post('/test-email-diagnosis', async (req, res) => {
    try {
        console.log('Starting email diagnosis...');
        
        // Test 1: Basic configuration check
        console.log('Test 1: Configuration check');
        const configValid = emailConfig.auth?.user && emailConfig.auth?.pass;
        console.log('Config valid:', configValid);
        
        if (!configValid) {
            return res.status(500).json({
                success: false,
                message: 'Email configuration is invalid',
                details: 'Missing user or password in auth configuration'
            });
        }

        // Test 2: Transporter verification
        console.log('Test 2: Transporter verification');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass
            },
            debug: true,
            logger: true
        });

        try {
            await transporter.verify();
            console.log('✅ Transporter verification successful');
        } catch (verifyError) {
            console.error('❌ Transporter verification failed:', verifyError);
            return res.status(500).json({
                success: false,
                message: 'Email transporter verification failed',
                error: verifyError.message
            });
        }

        // Test 3: Send test email using enhanced service
        console.log('Test 3: Sending test email');
        await emailService.sendTestEmail('REMOVED_EMAIL');

        res.json({
            success: true,
            message: 'All email tests passed successfully!',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Email diagnosis failed:', error);
        res.status(500).json({
            success: false,
            message: 'Email diagnosis failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Route to handle new appointment booking
router.post('/book', async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime, userData, docData, amount } = req.body;

        // Create new appointment
        const appointment = await appointmentModel.create({
            userId,
            docId,
            slotDate,
            slotTime,
            userData,
            docData,
            amount,
            date: Date.now(),
            confirmed: false,
            cancelled: false,
            payment: false,
            isCompleted: false
        });

        // Send email to doctor for confirmation
        await emailService.sendDoctorConfirmationEmail(
            docData.email,
            {
                doctorName: docData.name,
                patientName: userData.name,
                date: slotDate,
                time: slotTime,
                reason: userData.reason || 'General Checkup'
            }
        );

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully. Doctor will be notified.',
            appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error booking appointment',
            error: error.message
        });
    }
});

// Route to confirm appointment
router.put('/:id/confirm', async (req, res) => {
    try {
        const appointment = await appointmentModel.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.confirmed = true;
        await appointment.save();

        // Send confirmation email to patient
        try {
            console.log('Attempting to send patient confirmation email for appointment ID:', req.params.id);
            const patientConfirmationData = {
                userData: {
                    name: appointment.userData.name,
                    email: appointment.userData.email
                },
                docData: {
                    name: appointment.docData.name,
                    speciality: appointment.docData.speciality,
                    address: appointment.docData.address // Pass the full address object
                },
                slotDate: appointment.slotDate,
                slotTime: appointment.slotTime,
                amount: appointment.amount
            };
            console.log('Patient confirmation email data:', JSON.stringify(patientConfirmationData, null, 2));

            await emailService.sendConfirmationEmail(
                appointment.userData.email,
                patientConfirmationData
            );
            console.log('Patient confirmation email sent successfully for appointment ID:', req.params.id);

        } catch (emailError) {
            console.error('Error sending patient confirmation email for appointment ID:', req.params.id, ':', emailError);
            // Log the error but don't prevent the confirmation from completing
        }

        res.json({
            success: true,
            message: 'Appointment confirmed successfully',
            appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error confirming appointment',
            error: error.message
        });
    }
});

// Route to cancel appointment
router.put('/:id/cancel', async (req, res) => {
    try {
        const appointment = await appointmentModel.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.cancelled = true;
        await appointment.save();

        // Send cancellation email to patient
        await emailService.sendCancellationEmail(
            appointment.userData.email,
            {
                patientName: appointment.userData.name,
                doctorName: appointment.docData.name,
                date: appointment.slotDate,
                time: appointment.slotTime
            }
        );

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling appointment',
            error: error.message
        });
    }
});

export default router; 