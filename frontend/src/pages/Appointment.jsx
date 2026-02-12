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
        <div className="max-w-5xl mx-auto px-2 py-8">
            {/* ---------- Doctor Details ----------- */}
            <div className="flex flex-col sm:flex-row gap-8 bg-white rounded-xl shadow-md p-6 mb-8">
                <div>
                    <img
                        className="bg-primary w-full sm:max-w-72 rounded-lg object-cover shadow"
                        src={docInfo.image}
                        alt={docInfo.name}
                    />
                </div>
                <div className="flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="flex items-center gap-2 text-3xl font-semibold text-gray-700 mb-2">
                                {docInfo.name}
                                <img className="w-5" src={images.verified} alt="Verified" />
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-gray-600 mb-2">
                                <p>{docInfo.degree} - {docInfo.speciality}</p>
                                <span className="py-0.5 px-2 border text-xs rounded-full bg-gray-100">{docInfo.experience}</span>
                            </div>
                        </div>
                        <button
                            onClick={startChat}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <img src={images.chat} alt="Chat" className="w-5 h-5" />
                            Chat
                        </button>
                    </div>
                    <div className="mb-3">
                        <p className="flex items-center gap-1 text-sm font-medium text-[#262626] mt-3">
                            About <img className="w-3" src={images.about} alt="Info" />
                        </p>
                        <p className="text-sm text-gray-600 max-w-[700px] mt-1">{docInfo.about}</p>
                    </div>
                    <p className="text-gray-600 font-medium mt-4">
                        Appointment fee: <span className="text-gray-800">{currencySymbol}{docInfo.fees}</span>
                    </p>
                </div>
            </div>

            {/* Booking slots */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-primary">Booking Slots</h2>
                <div className="flex gap-3 items-center w-full overflow-x-auto mt-2 pb-2">
                    {docSlots.length ? docSlots.map((item, index) => (
                        <div
                            onClick={() => setSlotIndex(index)}
                            key={index}
                            className={`text-center py-4 min-w-16 rounded-lg cursor-pointer transition-all duration-150 
                                ${slotIndex === index ? 'bg-primary text-white shadow' : 'border border-[#DDDDDD] bg-gray-50 hover:bg-primary hover:text-white'}`}
                            tabIndex={0}
                            aria-label={`Select ${item[0] ? daysOfWeek[item[0].datetime.getDay()] : ''}`}
                        >
                            <p className="font-bold">{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                            <p className="text-lg">{item[0] && item[0].datetime.getDate()}</p>
                        </div>
                    )) : (
                        <p className="text-gray-400">No slots available</p>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full overflow-x-auto mt-4 pb-2">
                    {docSlots.length && docSlots[slotIndex] && docSlots[slotIndex].length ? docSlots[slotIndex].map((item, index) => (
                        <p
                            onClick={() => setSlotTime(item.time)}
                            key={index}
                            className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer transition-all duration-150
                                ${item.time === slotTime ? 'bg-primary text-white shadow' : 'text-[#949494] border border-[#B4B4B4] bg-gray-50 hover:bg-primary hover:text-white'}`}
                            tabIndex={0}
                            aria-label={`Select time ${item.time}`}
                        >
                            {item.time.toLowerCase()}
                        </p>
                    )) : (
                        <p className="text-gray-400">No times available for this day</p>
                    )}
                </div>

                <button
                    onClick={bookAppointment}
                    className="bg-primary text-white text-base font-medium px-10 py-3 rounded-full my-6 shadow hover:bg-blue-700 transition-all duration-150"
                    disabled={!slotTime}
                >
                    Book an appointment
                </button>
            </div>

            {/* Listing Related Doctors */}
            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : null
}

export default Appointment