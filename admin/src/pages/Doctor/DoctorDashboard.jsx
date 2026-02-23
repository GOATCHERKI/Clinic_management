import { useContext } from 'react'
import { useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const DoctorDashboard = () => {

  const { dToken, dashData, getDashData, cancelAppointment, appointmentConfirm, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)


  useEffect(() => {

    if (dToken) {
      getDashData()
    }

  }, [dToken])

  return dashData && (
    <div className='m-4 sm:m-5'>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        <div className='flex items-center gap-3 bg-white p-4 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all w-full'>
          <img className='w-14' src={assets.earning_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{currency} {dashData.earnings}</p>
            <p className='text-gray-400'>Earnings</p>
          </div>
        </div>
        <div className='flex items-center gap-3 bg-white p-4 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all w-full'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-3 bg-white p-4 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all w-full'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p></div>
        </div>
      </div>

      <div className='bg-white mt-6 sm:mt-10 rounded-t'>
        <div className='flex items-center gap-2.5 px-4 py-4 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex flex-col sm:flex-row sm:items-center px-4 sm:px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
              <img className='rounded-full w-10' src={item.userData.image} alt="" />
              <div className='flex-1 text-sm min-w-0'>
                <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
              </div>
              <div className='sm:ml-auto'>
                {item.cancelled
                  ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                  : item.confirmed
                    ? item.isCompleted 
                      ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                      : <div className='flex items-center gap-2'>
                          <p className='text-green-500 text-xs font-medium'>Confirmed</p>
                          <button
                            onClick={() => completeAppointment(item._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-all duration-200"
                          >
                            Completed?
                          </button>
                        </div>
                    : <div className='flex'>
                      <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer ' src={assets.cancel_icon} alt="" />
                      <img onClick={() => appointmentConfirm(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                    </div>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default DoctorDashboard