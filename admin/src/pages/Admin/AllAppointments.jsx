import { useEffect } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  return (
    <div className='w-full max-w-6xl mx-auto px-4 sm:px-5 my-4 sm:my-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-col sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] sm:items-center text-gray-500 py-3 px-4 sm:px-6 gap-3 sm:gap-1 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Date & Time</span>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            </div>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <span className='sm:hidden text-xs text-gray-400'>Doctor</span>
              <div className='flex items-center gap-2'>
                <img src={item.docData.image} className='w-8 rounded-full bg-gray-200' alt="" /> <p>{item.docData.name}</p>
              </div>
            </div>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Fees</span>
              <p>{currency}{item.amount}</p>
            </div>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Status</span>
              {item.cancelled
                ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted
                  ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                  : item.confirmed
                    ? <p className='text-green-500 text-xs font-medium'>Confirmed</p>
                    : <img
                        onClick={() => cancelAppointment(item._id)}
                        className='w-10 cursor-pointer' src={assets.cancel_icon} alt="Cancel" />
              }
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default AllAppointments