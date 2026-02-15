import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import emailService from "../services/emailService.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            
            // Send cancellation email to patient
            try {
                console.log('Attempting to send cancellation email for appointment ID:', appointmentId);
                const cancellationData = {
                    userData: {
                        name: appointmentData.userData.name,
                        email: appointmentData.userData.email
                    },
                    docData: {
                        name: appointmentData.docData.name,
                        speciality: appointmentData.docData.speciality
                    },
                    slotDate: appointmentData.slotDate,
                    slotTime: appointmentData.slotTime
                };
                console.log('Cancellation email data:', JSON.stringify(cancellationData, null, 2));

                await emailService.sendCancellationEmail(
                    appointmentData.userData.email,
                    cancellationData
                );
                console.log('Cancellation email sent successfully for appointment ID:', appointmentId);
            } catch (emailError) {
                console.error('Error sending cancellation email:', emailError);
                // Log the error but don't prevent the cancellation from completing
            }

            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            
            // Send completion notification email to patient
            try {
                console.log('Attempting to send completion notification email for appointment ID:', appointmentId);
                const completionData = {
                    userData: {
                        name: appointmentData.userData.name,
                        email: appointmentData.userData.email
                    },
                    docData: {
                        name: appointmentData.docData.name,
                        speciality: appointmentData.docData.speciality
                    },
                    slotDate: appointmentData.slotDate,
                    slotTime: appointmentData.slotTime
                };
                console.log('Completion notification email data:', JSON.stringify(completionData, null, 2));

                await emailService.sendCompletionEmail(
                    appointmentData.userData.email,
                    completionData
                );
                console.log('Completion notification email sent successfully for appointment ID:', appointmentId);
            } catch (emailError) {
                console.error('Error sending completion notification email:', emailError);
                // Log the error but don't prevent the completion from being marked
            }

            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment confirmed for doctor panel
const appointmentConfirm = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { confirmed: true })
            
            // Send confirmation email to patient
            try {
                console.log('Attempting to send patient confirmation email for appointment ID:', appointmentId);
                const patientConfirmationData = {
                    userData: {
                        name: appointmentData.userData.name,
                        email: appointmentData.userData.email
                    },
                    docData: {
                        name: appointmentData.docData.name,
                        speciality: appointmentData.docData.speciality,
                        address: appointmentData.docData.address
                    },
                    slotDate: appointmentData.slotDate,
                    slotTime: appointmentData.slotTime,
                    amount: appointmentData.amount
                };
                console.log('Patient confirmation email data:', JSON.stringify(patientConfirmationData, null, 2));

                await emailService.sendConfirmationEmail(
                    appointmentData.userData.email,
                    patientConfirmationData
                );
                console.log('Patient confirmation email sent successfully for appointment ID:', appointmentId);
            } catch (emailError) {
                console.error('Error sending patient confirmation email:', emailError);
                // Log the error but don't prevent the confirmation from completing
            }

            return res.json({ success: true, message: 'Appointment is Confirmed' })
        }

        res.json({ success: false, message: 'Appointment is not Confirmed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to upload prescription for an appointment
const uploadPrescription = async (req, res) => {
    try {
        const { appointmentId, prescriptionUrl } = req.body;
        await appointmentModel.findByIdAndUpdate(appointmentId, { prescription: prescriptionUrl });
        res.json({ success: true, message: 'Prescription uploaded' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// API to delete prescription for an appointment
const deletePrescription = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        await appointmentModel.findByIdAndUpdate(appointmentId, { prescription: null });
        res.json({ success: true, message: 'Prescription deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// API to update doctor's weekly schedule
const updateWeeklySchedule = async (req, res) => {
    try {
        const { docId, weeklySchedule } = req.body;

        if (!docId || !weeklySchedule) {
            return res.json({ success: false, message: 'Doctor ID and weekly schedule are required' });
        }

        // Find the doctor by ID and update the weeklySchedule field
        await doctorModel.findByIdAndUpdate(docId, { weeklySchedule });

        res.json({ success: true, message: 'Weekly schedule updated successfully' });

    } catch (error) {
        console.error('Error updating weekly schedule:', error);
        res.json({ success: false, message: 'Failed to update weekly schedule' });
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    appointmentConfirm,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    uploadPrescription,
    deletePrescription,
    updateWeeklySchedule
}