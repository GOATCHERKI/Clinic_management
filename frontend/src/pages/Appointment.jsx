import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { images } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {


    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSolts = async () => {

        setDocSlots([])
        console.log('getAvailableSolts called');

        // getting current date
        let today = new Date()
        today.setHours(0, 0, 0, 0); // Reset time to start of the day

        const daysOfWeekMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        let allAvailableSlots = [];

        console.log('Doc Info:', docInfo);

        if (!docInfo || !docInfo.weeklySchedule) {
             console.log('Doc info or weekly schedule not available');
             setDocSlots([]); // Ensure slots are empty if data is missing
             return;
        }

        for (let i = 0; i < 7; i++) {

            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            const dayName = daysOfWeekMap[currentDate.getDay()];
            const workingHours = docInfo.weeklySchedule[dayName] || [];

            console.log(`Processing day: ${dayName}`, workingHours);

            let daySlots = [];

            // Sort the working hour ranges
            workingHours.sort((a, b) => {
                 const [aStart] = a.split('-');
                 const [bStart] = b.split('-');
                 return aStart.localeCompare(bStart);
            });

            for (const slotRange of workingHours) {
                const [start, end] = slotRange.split('-');
                
                // Create startTime and endTime using currentDate to ensure consistent dates
                let startTime = new Date(currentDate);
                startTime.setHours(parseInt(start.split(':')[0]), parseInt(start.split(':')[1]), 0, 0);

                let endTime = new Date(currentDate);
                 endTime.setHours(parseInt(end.split(':')[0]), parseInt(end.split(':')[1]), 0, 0);

                 console.log(`  Processing range: ${slotRange}. StartTime: ${startTime.toLocaleString()}, EndTime: ${endTime.toLocaleString()}`);

                // Adjust start time if it's today and the start time is in the past
                if (i === 0) {
                    const currentTime = new Date();
                 if (startTime < currentTime) {
                     startTime = new Date(currentTime);
                     // Round up to the next half hour if needed
                     if (startTime.getMinutes() > 0 && startTime.getMinutes() <= 30) {
                         startTime.setMinutes(30, 0, 0);
                     } else if (startTime.getMinutes() > 30) {
                          startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
                     }
                 }
            }

                let currentTimeSlot = new Date(startTime);

                while (currentTimeSlot < endTime) {
                    let formattedTime = currentTimeSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    let day = currentDate.getDate()
                    let month = currentDate.getMonth() + 1
                    let year = currentDate.getFullYear()

                    const slotDateKey = day + "_" + month + "_" + year
                    const slotTimeValue = formattedTime

                    console.log(`    Checking slot: ${formattedTime} for date key ${slotDateKey}. CurrentSlotTime: ${currentTimeSlot.toLocaleString()}`);

                    // Check if the slot is booked
                    const isBooked = docInfo.slots_booked[slotDateKey] && docInfo.slots_booked[slotDateKey].includes(slotTimeValue);

                    console.log(`    Is booked: ${isBooked}`);

                    // Add the slot if it's not booked
                    if (!isBooked) {
                        daySlots.push({
                            datetime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentTimeSlot.getHours(), currentTimeSlot.getMinutes()),
                            time: formattedTime
                        });
                         console.log(`    Slot added: ${formattedTime}`);
                    }

                    // Move to the next 30-minute slot
                    currentTimeSlot.setMinutes(currentTimeSlot.getMinutes() + 30);
                }
            }
            allAvailableSlots.push(daySlots);
             console.log(`Finished processing ${dayName}. Day slots:`, daySlots);
        }
        setDocSlots(allAvailableSlots);
         console.log('Final allAvailableSlots:', allAvailableSlots);
    }

    const bookAppointment = async () => {

        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        const date = docSlots[slotIndex][0].datetime

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = day + "_" + month + "_" + year

        try {

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                getDoctosData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const startChat = () => {
        if (!token) {
            toast.warning('Please login to start a chat')
            navigate('/login')
            return
        }
        navigate(`/chat?doctorId=${docInfo._id}`)
    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts()
        }
    }, [docInfo])

    return docInfo ? (
        <div className="w-full min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {/* ---------- Doctor Details ----------- */}
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                    <div className="w-full lg:w-auto flex-shrink-0">
                        <img
                            className="bg-primary w-full h-64 sm:h-80 lg:h-96 lg:w-72 rounded-lg object-cover shadow"
                            src={docInfo.image}
                            alt={docInfo.name}
                        />
                    </div>
                    <div className="flex-1 border border-[#ADADAD] rounded-lg p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1">
                                <p className="flex items-center gap-2 text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-700 mb-2">
                                    {docInfo.name}
                                    <img className="w-4 sm:w-5" src={images.verified} alt="Verified" />
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-sm sm:text-base text-gray-600 mb-3">
                                    <p className="break-words">{docInfo.degree} - {docInfo.speciality}</p>
                                    <span className="py-0.5 px-2 border text-xs rounded-full bg-gray-100 w-fit">{docInfo.experience}</span>
                                </div>
                            </div>
                            <button
                                onClick={startChat}
                                className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-blue-500 text-white text-sm sm:text-base rounded-lg hover:bg-blue-600 transition-colors font-medium w-full sm:w-auto"
                            >
                                <img src={images.chat} alt="Chat" className="w-4 sm:w-5 h-4 sm:h-5" />
                                Chat
                            </button>
                        </div>
                        <div className="mb-4 sm:mb-6">
                            <p className="flex items-center gap-1 text-sm font-medium text-[#262626] mt-3">
                                About <img className="w-3" src={images.about} alt="Info" />
                            </p>
                            <p className="text-sm text-gray-600 max-w-full mt-2 leading-relaxed">{docInfo.about}</p>
                        </div>
                        <p className="text-gray-600 font-medium mt-4">
                            Appointment fee: <span className="text-gray-800 text-lg">{currencySymbol}{docInfo.fees}</span>
                        </p>
                    </div>
                </div>

                {/* Booking slots */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 text-primary">Booking Slots</h2>
                    <div className="flex gap-2 sm:gap-3 items-center w-full overflow-x-auto mt-2 pb-3">
                        {docSlots.length ? docSlots.map((item, index) => (
                            <div
                                onClick={() => setSlotIndex(index)}
                                key={index}
                                className={`text-center py-3 sm:py-4 px-3 sm:px-4 min-w-14 sm:min-w-16 rounded-lg cursor-pointer transition-all duration-150 text-sm sm:text-base
                                    ${slotIndex === index ? 'bg-primary text-white shadow' : 'border border-[#DDDDDD] bg-gray-50 hover:bg-primary hover:text-white'}`}
                                tabIndex={0}
                                aria-label={`Select ${item[0] ? daysOfWeek[item[0].datetime.getDay()] : ''}`}
                            >
                                <p className="font-bold text-xs sm:text-sm">{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                                <p className="text-base sm:text-lg font-semibold">{item[0] && item[0].datetime.getDate()}</p>
                            </div>
                        )) : (
                            <p className="text-gray-400 text-sm">No slots available</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full mt-4 pb-2">
                        {docSlots.length && docSlots[slotIndex] && docSlots[slotIndex].length ? docSlots[slotIndex].map((item, index) => (
                            <p
                                onClick={() => setSlotTime(item.time)}
                                key={index}
                                className={`text-xs sm:text-sm font-light flex-shrink-0 px-3 sm:px-5 py-2 rounded-full cursor-pointer transition-all duration-150
                                    ${item.time === slotTime ? 'bg-primary text-white shadow' : 'text-[#949494] border border-[#B4B4B4] bg-gray-50 hover:bg-primary hover:text-white'}`}
                                tabIndex={0}
                                aria-label={`Select time ${item.time}`}
                            >
                                {item.time.toLowerCase()}
                            </p>
                        )) : (
                            <p className="text-gray-400 text-sm">No times available for this day</p>
                        )}
                    </div>

                    <button
                        onClick={bookAppointment}
                        className="w-full sm:w-auto bg-primary text-white text-sm sm:text-base font-medium px-8 sm:px-10 py-3 rounded-full mt-6 shadow hover:bg-blue-700 transition-all duration-150"
                        disabled={!slotTime}
                    >
                        Book an appointment
                    </button>
                </div>

                {/* Listing Related Doctors */}
                <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
            </div>
        </div>
    ) : null
}

export default Appointment