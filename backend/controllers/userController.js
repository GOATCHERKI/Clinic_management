import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import emailService from "../services/emailService.js";


// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password, phone } = req.body;

        // checking for all data to register user
        if (!name || !email || !password || !phone) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email 
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid Email" })
        }

        // validating password
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
            phone,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid Password or Email" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => { 

    try {

        const { userId, name, email, phone, address, emergency_phone, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !email || !phone || !dob || !gender ) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, email, phone, address: JSON.parse(address), emergency_phone, dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body
        console.log(`Attempting to book appointment for slotDate: ${slotDate}, slotTime: ${slotTime}`);
        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked
        console.log('Current slots_booked data:', JSON.stringify(slots_booked, null, 2));

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        // Send email to doctor for confirmation
        try {
            console.log('Sending doctor confirmation email to:', docData.email);
            const doctorEmailData = {
                docData: {
                    name: docData.name,
                    email: docData.email
                },
                userData: {
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone
                },
                slotDate,
                slotTime
            };
            console.log('Doctor confirmation email data:', JSON.stringify(doctorEmailData, null, 2));

            await emailService.sendDoctorConfirmationEmail(docData.email, doctorEmailData);
            console.log('Doctor confirmation email sent successfully');
        } catch (emailError) {
            console.error('Error sending doctor confirmation email:', emailError);
            // Don't fail the appointment booking if email fails
        }

        res.json({ success: true, message: 'Appointment Booked' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user all appointments 
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to upload medical file and update user's medical history
const uploadMedicalFile = async (req, res) => {
    try {
        const { userId, fileUrl, fileName, fileType } = req.body;
        console.log('Upload request received:', { userId, fileUrl, fileName, fileType });

        if (!fileUrl) {
            return res.json({ success: false, message: 'No file URL provided' });
        }

        // Create file data object
        const fileData = {
            url: fileUrl,
            name: fileName,
            type: fileType,
            uploadedAt: Date.now()
        };

        // Update user's medical history using findByIdAndUpdate
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $push: { 'medical_history.files': fileData } },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'User not found' });
        }

        console.log('Updated user medical files:', updatedUser.medical_history?.files);

        res.json({ 
            success: true, 
            message: 'Medical file uploaded successfully',
            file: fileData
        });

    } catch (error) {
        console.log('Error in uploadMedicalFile:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete medical file from user's medical history
const deleteMedicalFile = async (req, res) => {
    try {
        const { userId, fileUrl } = req.body;
        console.log('Delete request received:', { userId, fileUrl });

        if (!fileUrl) {
            return res.json({ success: false, message: 'No file URL provided' });
        }

        // Get current user data
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        console.log('Current user medical files:', user.medical_history?.files);

        // Check if medical_history and files array exist
        if (!user.medical_history || !user.medical_history.files) {
            return res.json({ success: false, message: 'No medical files found' });
        }

        // Remove the file from the array using $pull operator
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $pull: { 'medical_history.files': { url: fileUrl } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'Failed to update user data' });
        }
        console.log('Updated user medical files:', updatedUser.medical_history?.files);

        res.json({ 
            success: true, 
            message: 'Medical file deleted successfully'
        });

    } catch (error) {
        console.log('Error in deleteMedicalFile:', error);
        res.json({ success: false, message: error.message });
    }
};

// // API to make payment of appointment using razorpay
// const paymentRazorpay = async (req, res) => {
//     try {
//         const { appointmentId } = req.body
//         const appointmentData = await appointmentModel.findById(appointmentId)

//         if (!appointmentData || appointmentData.cancelled) {
//             return res.json({ success: false, message: 'Appointment Cancelled or not found' })
//         }

//         // creating options for razorpay payment
//         const options = {
//             amount: appointmentData.amount * 100,
//             currency: process.env.CURRENCY,
//             receipt: appointmentId,
//         }

//         // creation of an order
//         const order = await razorpayInstance.orders.create(options)

//         res.json({ success: true, order })
//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }

// // API to verify payment of razorpay
// const verifyRazorpay = async (req, res) => {
//     try {
//         const { razorpay_order_id } = req.body
//         const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

//         if (orderInfo.status === 'paid') {
//             await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
//             res.json({ success: true, message: "Payment Successful" })
//         }
//         else {
//             res.json({ success: false, message: 'Payment Failed' })
//         }
//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }

// // API to make payment of appointment using Stripe
// const paymentStripe = async (req, res) => {
//     try {
//         const { appointmentId } = req.body
//         const { origin } = req.headers

//         const appointmentData = await appointmentModel.findById(appointmentId)

//         if (!appointmentData || appointmentData.cancelled) {
//             return res.json({ success: false, message: 'Appointment Cancelled or not found' })
//         }

//         const currency = process.env.CURRENCY.toLocaleLowerCase()

//         const line_items = [{
//             price_data: {
//                 currency,
//                 product_data: {
//                     name: "Appointment Fees"
//                 },
//                 unit_amount: appointmentData.amount * 100
//             },
//             quantity: 1
//         }]

//         const session = await stripeInstance.checkout.sessions.create({
//             success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
//             cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
//             line_items: line_items,
//             mode: 'payment',
//         })

//         res.json({ success: true, session_url: session.url });
//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }

// // API to verify payment of Stripe
// const verifyStripe = async (req, res) => {
//     try {
//         const { appointmentId, success } = req.body

//         if (success === "true") {
//             await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
//             return res.json({ success: true, message: 'Payment Successful' })
//         }

//         res.json({ success: false, message: 'Payment Failed' })
//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    uploadMedicalFile,
    deleteMedicalFile
    // paymentRazorpay,
    // verifyRazorpay,
    // paymentStripe,
    // verifyStripe,
}