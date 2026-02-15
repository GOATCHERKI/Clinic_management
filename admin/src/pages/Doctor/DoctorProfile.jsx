import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorProfile = () => {

    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl, getDoctosData } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)
    const [newTimeSlot, setNewTimeSlot] = useState({ day: 'monday', start: '09:00', end: '12:00' })

    const validateTimeSlot = (start, end, day) => {
        const slots = profileData.weeklySchedule[day] || [];
        const newStart = new Date(`2000-01-01T${start}`);
        const newEnd = new Date(`2000-01-01T${end}`);
        
        if (newStart >= newEnd) {
            toast.error('End time must be after start time');
            return false;
        }

        for (const slot of slots) {
            const [existingStart, existingEnd] = slot.split('-');
            const existingStartTime = new Date(`2000-01-01T${existingStart}`);
            const existingEndTime = new Date(`2000-01-01T${existingEnd}`);

            // Check for overlaps between the new time slot and existing slots
            if (
                (newStart >= existingStartTime && newStart < existingEndTime) ||
                (newEnd > existingStartTime && newEnd <= existingEndTime) ||
                (newStart <= existingStartTime && newEnd >= existingEndTime)
            ) {
                toast.error('Time slot overlaps with existing slot');
                return false;
            }
        }
        return true;
    }

    const addTimeSlot = (day) => {
        if (!isEdit) return;
        
        if (!validateTimeSlot(newTimeSlot.start, newTimeSlot.end, newTimeSlot.day)) {
            return;
        }

        const timeSlot = `${newTimeSlot.start}-${newTimeSlot.end}`;
        setProfileData(prev => ({
            ...prev,
            weeklySchedule: {
                ...prev.weeklySchedule,
                [day]: [...(prev.weeklySchedule[day] || []), timeSlot].sort((a, b) => {
                    const [aStart] = a.split('-');
                    const [bStart] = b.split('-');
                    return aStart.localeCompare(bStart);
                })
            }
        }));
    }

    const removeTimeSlot = (day, index) => {
        if (!isEdit) return;
        setProfileData(prev => ({
            ...prev,
            weeklySchedule: {
                ...prev.weeklySchedule,
                [day]: prev.weeklySchedule[day].filter((_, i) => i !== index)
            }
        }));
    }

    const updateProfile = async () => {
        try {
            const updateData = {
                address: profileData.address,
                fees: profileData.fees,
                about: profileData.about,
                available: profileData.available,
            }

            // Update general profile information
            const { data: profileUpdateData } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } });

            if (!profileUpdateData.success) {
                toast.error(profileUpdateData.message);
                setIsEdit(false);
                // If profile update fails, stop here
                return;
            }

            // Update weekly schedule separately
            const { data: scheduleUpdateData } = await axios.post(backendUrl + '/api/doctor/update-weekly-schedule', { docId: profileData._id, weeklySchedule: profileData.weeklySchedule }, { headers: { dToken } });

            if (scheduleUpdateData.success) {
                toast.success('Profile and weekly schedule updated successfully');
                setIsEdit(false);
                getProfileData(); // Refresh doctor's profile data in DoctorContext
                // Assuming AppContext is available here, refresh the global doctors list
                if (typeof getDoctosData === 'function') { // Check if getDoctosData is available in this context
                    getDoctosData();
                }
            } else {
                toast.error(scheduleUpdateData.message);
                setIsEdit(false);
            }

        } catch (error) {
            toast.error(error.message);
            console.log(error);
            setIsEdit(false);
        }
    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    return profileData && (
        <div className='min-h-screen bg-white p-6 h-full w-full'>
            <div className='bg-white rounded-xl shadow-md overflow-hidden'>
                <div className='flex flex-col'>
                    <div className='w-full p-6 flex  '>
                        <img className='h-48 w-100 object-cover rounded-lg shadow bg-primary' src={profileData.image} alt={`${profileData.name}'s profile`} />
                    </div>
                    <div className='p-8'>

                        <div className='mb-4'>
                            <div className='text-2xl font-bold text-gray-800'>{profileData.name}</div>
                            <div className='text-sm text-gray-600 mt-1 flex items-center gap-2'>
                                <span>{profileData.degree} - {profileData.speciality}</span>
                                <span className='px-2 py-0.5 border border-blue-300 text-blue-600 text-xs rounded-full bg-blue-50'>{profileData.experience}</span>
                            </div>
                            <div className='text-sm text-gray-600 mt-2 flex items-center gap-2'>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{profileData.email}</span>
                            </div>
                        </div>

                        <div className='mb-4'>
                            <p className='block text-sm font-medium text-gray-700 mb-1'>About:</p>
                            <div className='text-sm text-gray-600'>
                                {isEdit
                                    ? <textarea onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))} className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50' rows={4} value={profileData.about}></textarea>
                                    : <p className='mt-1 text-sm text-gray-600'>{profileData.about}</p>
                                }
                            </div>
                        </div>

                        <div className='mb-4'>
                            <p className='block text-sm font-medium text-gray-700 mb-1'>Appointment fee:</p>
                            <span className='text-gray-800'>
                                {currency} {isEdit
                                    ? <input type='number' onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))} value={profileData.fees} className='mt-1 inline-block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50' />
                                    : <span className='text-gray-800 font-semibold'>{profileData.fees}</span>
                                }
                            </span>
                        </div>

                        <div className='mb-4'>
                            <p className='block text-sm font-medium text-gray-700 mb-1'>Address:</p>
                            <div className='text-sm text-gray-600'>
                                {isEdit
                                    ? (
                                        <>
                                            <input type='text' onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={profileData.address.line1} className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50' />
                                            <input type='text' onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={profileData.address.line2} className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50' />
                                        </>
                                    ) : (
                                        <>
                                            <p>{profileData.address.line1}</p>
                                            <p>{profileData.address.line2}</p>
                                        </>
                                    )
                                }
                            </div>
                        </div>

                        <div className='mt-6 pt-4 border-t border-gray-200'>
                            <h3 className='text-lg font-semibold text-gray-800 mb-4'>Weekly Schedule (Working Hours)</h3>
                            {isEdit && (
                                <div className='space-y-4 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50'>
                                    <div className='flex flex-wrap gap-4 items-end'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Day</label>
                                            <select
                                                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2'
                                                value={newTimeSlot.day}
                                                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, day: e.target.value }))}
                                            >
                                                {Object.keys(profileData.weeklySchedule || {}).map(day => (
                                                    <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Start Time</label>
                                            <input
                                                type="time"
                                                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2'
                                                value={newTimeSlot.start}
                                                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, start: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>End Time</label>
                                            <input
                                                type="time"
                                                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2'
                                                value={newTimeSlot.end}
                                                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, end: e.target.value }))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => addTimeSlot(newTimeSlot.day)}
                                            className='px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150'
                                        >
                                            Add Working Hours
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {Object.entries(profileData.weeklySchedule || {}).map(([day, slots]) => (
                                    <div key={day} className='border border-gray-200 rounded-md p-4 bg-white shadow-sm'>
                                        <h4 className='font-medium text-gray-700 mb-3'>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                                        <div className='space-y-3'>
                                            {slots.map((slot, index) => (
                                                <div key={index} className={`flex items-center justify-between p-3 rounded-md bg-blue-50 border border-blue-100`}>
                                                    <span className='text-blue-800 font-medium'>{slot}</span>
                                                    {isEdit && (
                                                        <button
                                                            onClick={() => removeTimeSlot(day, index)}
                                                            className='text-red-500 hover:text-red-700 text-sm font-medium focus:outline-none'
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {slots.length === 0 && (
                                                <p className='text-gray-500 text-sm italic'>No time slots set</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='mt-6 pt-4 border-t border-gray-200 flex items-center gap-2'>
                            <input type="checkbox" id="available" onChange={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))} checked={profileData.available} className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50' disabled={!isEdit} />
                            <label htmlFor="available" className='text-sm font-medium text-gray-700'>Available</label>
                        </div>

                        <div className='mt-6 flex justify-end'>
                            {isEdit
                                ? <button onClick={updateProfile} className='px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-150'>Save Changes</button>
                                : <button onClick={() => setIsEdit(prev => !prev)} className='px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150'>Edit Profile</button>
                            }
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default DoctorProfile