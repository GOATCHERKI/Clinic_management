import nodemailer from 'nodemailer';
import emailConfig from '../config/emailConfig.js';

// Enhanced email configuration with validation
const validateEmailConfig = () => {
    const required = ['service', 'host', 'port', 'auth'];
    const missing = required.filter(key => !emailConfig[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing email configuration: ${missing.join(', ')}`);
    }
    
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        throw new Error('Email authentication credentials are missing');
    }
    
    console.log('Email Configuration Validated:', {
        service: emailConfig.service,
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.auth.user,
        from: emailConfig.from
    });
};

// Validate configuration on startup
validateEmailConfig();

// Create transporter with enhanced configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        ...emailConfig,
        debug: true,
        logger: true
    });
};

const transporter = createTransporter();

// Enhanced transporter verification with retry logic
const verifyTransporter = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting transporter verification (attempt ${i + 1}/${retries})...`);
            await transporter.verify();
            console.log('✅ Email server is ready to send messages');
            return true;
        } catch (error) {
            console.error(`❌ Email transporter verification failed (attempt ${i + 1}):`, {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response
            });
            
            if (i === retries - 1) {
                console.error('All verification attempts failed. Email service may not work properly.');
                return false;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Call verification on startup (non-blocking)
verifyTransporter().catch(console.error);

// Enhanced email validation
const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Enhanced data validation
const validateAppointmentData = (appointment) => {
    if (!appointment) {
        throw new Error('Appointment data is required');
    }

    // Log the appointment data for debugging
    console.log('Validating appointment data:', JSON.stringify(appointment, null, 2));

    // Validate user data
    if (!appointment.userData) {
        throw new Error('User data is required');
    }

    // Validate doctor data - Relaxed validation
    if (!appointment.docData) {
        // We still need docData to exist, but name/email will be handled by template fallbacks
        console.warn('Doctor data object is missing from appointment data during validation.');
        // Depending on requirements, you might throw an error here or allow it to proceed with warnings.
        // For now, we'll allow it but log a warning.
    }

    // Validate appointment details
    if (!appointment.slotDate || !appointment.slotTime) {
        throw new Error('Appointment date and time are required');
    }

    return true;
};

// Email templates with improved data handling
const emailTemplates = {
    doctorConfirmation: (appointment) => {
        console.log('Preparing doctor confirmation email with data:', appointment);
        return {
            subject: 'New Appointment Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">New Appointment Request</h2>
                    <p>Dear Dr. ${appointment.docData?.name || 'Doctor'},</p>
                    <p>A new appointment has been requested:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Patient:</strong> ${appointment.userData?.name || 'N/A'}</li>
                            <li><strong>Patient Email:</strong> ${appointment.userData?.email || 'N/A'}</li>
                            <li><strong>Patient Phone:</strong> ${appointment.userData?.phone || 'Not provided'}</li>
                            <li><strong>Date:</strong> ${appointment.slotDate || 'N/A'}</li>
                            <li><strong>Time:</strong> ${appointment.slotTime || 'N/A'}</li>
                        </ul>
                    </div>
                    <p>Please confirm this appointment through the admin panel.</p>
                    <p>Best regards,<br>Smart Clinic Team</p>
                </div>
            `
        };
    },

    appointmentConfirmation: (appointment) => {
        console.log('Preparing patient confirmation email with data:', appointment);
        return {
            subject: 'Appointment Confirmation - Smart Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">Appointment Confirmed</h2>
                    <p>Dear ${appointment.userData?.name || 'Patient'},</p>
                    <p>Your appointment has been confirmed:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Doctor:</strong> Dr. ${appointment.docData?.name || 'N/A'}</li>
                            <li><strong>Speciality:</strong> ${appointment.docData?.speciality || 'N/A'}</li>
                            <li><strong>Date:</strong> ${appointment.slotDate || 'N/A'}</li>
                            <li><strong>Time:</strong> ${appointment.slotTime || 'N/A'}</li>
                            <li><strong>Location:</strong> ${appointment.docData?.address?.line1 || 'Hospital'}</li>
                            <li><strong>Fees:</strong> $${appointment.amount || 'N/A'}</li>
                        </ul>
                    </div>
                    <p style="color: #e74c3c;"><strong>Please arrive 10 minutes before your scheduled time.</strong></p>
                    <p>Best regards,<br>Smart Clinic Team</p>
                </div>
            `
        };
    },

    appointmentCancellation: (appointment) => {
        validateAppointmentData(appointment);
        return {
            subject: 'Appointment Cancellation - Smart Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Appointment Cancelled</h2>
                    <p>Dear ${appointment.userData.name},</p>
                    <p>Your appointment has been cancelled:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Doctor:</strong> Dr. ${appointment.docData.name}</li>
                            <li><strong>Speciality:</strong> ${appointment.docData.speciality}</li>
                            <li><strong>Date:</strong> ${appointment.slotDate}</li>
                            <li><strong>Time:</strong> ${appointment.slotTime}</li>
                        </ul>
                    </div>
                    <p>If you need to reschedule, please contact us.</p>
                    <p>Best regards,<br>Smart Clinic Team</p>
                </div>
            `
        };
    },

    appointmentReminder: (appointment) => {
        validateAppointmentData(appointment);
        return {
            subject: 'Appointment Reminder - Tomorrow',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f39c12;">Appointment Reminder</h2>
                    <p>Dear ${appointment.userData.name},</p>
                    <p>This is a reminder for your appointment tomorrow:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Doctor:</strong> Dr. ${appointment.docData.name}</li>
                            <li><strong>Speciality:</strong> ${appointment.docData.speciality}</li>
                            <li><strong>Date:</strong> ${appointment.slotDate}</li>
                            <li><strong>Time:</strong> ${appointment.slotTime}</li>
                            <li><strong>Location:</strong> ${appointment.docData.address?.line1 || 'Hospital'}</li>
                            <li><strong>Fees:</strong> $${appointment.amount}</li>
                        </ul>
                    </div>
                    <p style="color: #e74c3c;"><strong>Please arrive 10 minutes before your scheduled time.</strong></p>
                    <p>Best regards,<br>Smart Clinic Team</p>
                </div>
            `
        };
    },

    appointmentCompletion: (appointment) => {
        validateAppointmentData(appointment);
        return {
            subject: 'Appointment Completed - Smart Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">Appointment Completed</h2>
                    <p>Dear ${appointment.userData.name},</p>
                    <p>Your appointment has been marked as completed:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Doctor:</strong> Dr. ${appointment.docData.name}</li>
                            <li><strong>Speciality:</strong> ${appointment.docData.speciality}</li>
                            <li><strong>Date:</strong> ${appointment.slotDate}</li>
                            <li><strong>Time:</strong> ${appointment.slotTime}</li>
                        </ul>
                    </div>
                    <p>Thank you for choosing Smart Clinic for your healthcare needs.</p>
                    <p>Best regards,<br>Smart Clinic Team</p>
                </div>
            `
        };
    }
};

// Enhanced email sending function with retry logic
const sendEmail = async (mailOptions, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Sending email (attempt ${i + 1}/${retries}):`, {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject
            });

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully:`, {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response
            });

            return info;
        } catch (error) {
            console.error(`❌ Email sending failed (attempt ${i + 1}):`, {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            });

            if (i === retries - 1) {
                throw error;
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Enhanced email service with better error handling
const emailService = {
    // Send email to doctor for appointment confirmation
    sendDoctorConfirmationEmail: async (doctorEmail, appointment) => {
        try {
            if (!validateEmail(doctorEmail)) {
                throw new Error(`Invalid doctor email address: ${doctorEmail}`);
            }

            validateAppointmentData(appointment);

            const mailOptions = {
                from: `"Smart Clinic" <${emailConfig.from}>`,
                to: doctorEmail,
                ...emailTemplates.doctorConfirmation(appointment)
            };

            await sendEmail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error in sendDoctorConfirmationEmail:', error);
            throw new Error(`Failed to send doctor confirmation email: ${error.message}`);
        }
    },

    // Send confirmation email to patient
    sendConfirmationEmail: async (patientEmail, appointment) => {
        try {
            if (!validateEmail(patientEmail)) {
                throw new Error(`Invalid patient email address: ${patientEmail}`);
            }

            validateAppointmentData(appointment);

            const mailOptions = {
                from: `"Smart Clinic" <${emailConfig.from}>`,
                to: patientEmail,
                ...emailTemplates.appointmentConfirmation(appointment)
            };

            await sendEmail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error in sendConfirmationEmail:', error);
            throw new Error(`Failed to send confirmation email: ${error.message}`);
        }
    },

    // Send cancellation email to patient
    sendCancellationEmail: async (patientEmail, appointment) => {
        try {
            if (!validateEmail(patientEmail)) {
                throw new Error(`Invalid patient email address: ${patientEmail}`);
            }

            validateAppointmentData(appointment);

            const mailOptions = {
                from: `"Smart Clinic" <${emailConfig.from}>`,
                to: patientEmail,
                ...emailTemplates.appointmentCancellation(appointment)
            };

            await sendEmail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error in sendCancellationEmail:', error);
            throw new Error(`Failed to send cancellation email: ${error.message}`);
        }
    },

    // Send reminder email to patient
    sendReminderEmail: async (patientEmail, appointment) => {
        try {
            if (!validateEmail(patientEmail)) {
                throw new Error(`Invalid patient email address: ${patientEmail}`);
            }

            validateAppointmentData(appointment);

            const mailOptions = {
                from: `"Smart Clinic" <${emailConfig.from}>`,
                to: patientEmail,
                ...emailTemplates.appointmentReminder(appointment)
            };

            await sendEmail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error in sendReminderEmail:', error);
            throw error;
        }
    },

    // Send completion notification email to patient
    sendCompletionEmail: async (patientEmail, appointment) => {
        try {
            if (!validateEmail(patientEmail)) {
                throw new Error(`Invalid patient email address: ${patientEmail}`);
            }

            validateAppointmentData(appointment);

            const mailOptions = {
                from: `"Smart Clinic" <${emailConfig.from}>`,
                to: patientEmail,
                ...emailTemplates.appointmentCompletion(appointment)
            };

            await sendEmail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error in sendCompletionEmail:', error);
            throw new Error(`Failed to send completion email: ${error.message}`);
        }
    },

    // Test email function
    sendTestEmail: async (testEmail = 'REMOVED_EMAIL') => {
        try {
            if (!validateEmail(testEmail)) {
                throw new Error(`Invalid test email address: ${testEmail}`);
            }

            const mailOptions = {
                from: `"Smart Clinic" <${emailConfig.from}>`,
                to: testEmail,
                subject: '🧪 Smart Clinic - Test Email',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #3498db;">Test Email from Smart Clinic</h2>
                        <p>This is a test email to verify the email service is working correctly.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                            <p><strong>Service:</strong> ${emailConfig.service}</p>
                            <p><strong>From:</strong> ${emailConfig.from}</p>
                        </div>
                        <p>If you received this email, the Smart Clinic email service is working properly! ✅</p>
                    </div>
                `,
                text: `Test email from Smart Clinic sent at ${new Date().toISOString()}`
            };

            await sendEmail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error in sendTestEmail:', error);
            throw new Error(`Failed to send test email: ${error.message}`);
        }
    }
};

export default emailService; 