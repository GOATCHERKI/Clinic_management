import cron from 'node-cron';
import emailService from './emailService.js';
import appointmentModel from '../models/appointmentModel.js';

// Function to send reminder emails for appointments scheduled for tomorrow
const sendReminderEmails = async () => {
    try {
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // Find all appointments scheduled for tomorrow
        const appointments = await appointmentModel.find({
            slotDate: tomorrow.toISOString().split('T')[0], 
            confirmed: true,
            cancelled: false,
            isCompleted: false
        });

        // Send reminder email for each appointment
        for (const appointment of appointments) {
            await emailService.sendReminderEmail(
                appointment.userData.email,
                {
                    patientName: appointment.userData.name,
                    doctorName: appointment.docData.name,
                    date: appointment.slotDate,
                    time: appointment.slotTime,
                    location: appointment.docData.location || 'Hospital'
                }
            );
        }

        console.log(`Sent ${appointments.length} reminder emails`);
    } catch (error) {
        console.error('Error sending reminder emails:', error);
    }
};

// Schedule the reminder email job to run daily at 9 AM
const startReminderScheduler = () => {
    cron.schedule('0 9 * * *', () => {
        console.log('Running reminder email scheduler...');
        sendReminderEmails();
    });
};

export { startReminderScheduler }; 