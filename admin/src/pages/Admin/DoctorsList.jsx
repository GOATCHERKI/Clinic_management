import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState(null)

  const { doctors, changeAvailability, deleteDoctor, aToken, getAllDoctors } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
        getAllDoctors()
    }
  }, [aToken])

  const handleDeleteClick = (doctor) => {
    setDoctorToDelete(doctor)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    if (doctorToDelete) {
      deleteDoctor(doctorToDelete._id)
      setShowConfirmDialog(false)
      setDoctorToDelete(null)
    }
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors.map((item, index) => (
          <div className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center justify-between'>
                <div className='flex items-center gap-1 text-sm'>
                  <input onChange={()=>changeAvailability(item._id)} type="checkbox" checked={item.available} />
                  <p>Available</p>
                </div>
                <button 
                  onClick={() => handleDeleteClick(item)}
                  className='px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete Dr. {doctorToDelete?.name}? This action cannot be undone.
              Completed appointments will be preserved while others will be cancelled.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorsList