import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, appointmentConfirm, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [uploadingId, setUploadingId] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  
  const handlePrescriptionUpload = async (appointmentId) => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    console.log('Attempting to upload file:', file.name);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'prescriptions');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dtvsxpzch/raw/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Cloudinary upload response:', data);
      
      if (!res.ok) {
        throw new Error(`Cloudinary upload failed: ${data.error?.message || 'Unknown error'}`);
      }
      
      if (!data.secure_url) {
        throw new Error('Cloudinary upload failed: No secure_url in response');
      }
      
      setUploading(false);
      setUploadingId(null);
      setFile(null);
      
      // Send to backend
      const backendResponse = await fetch('http://localhost:4000/api/doctor/upload-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', dToken },
        body: JSON.stringify({ appointmentId, prescriptionUrl: data.secure_url }),
      });
      const backendData = await backendResponse.json();
      console.log('Backend upload response:', backendData);
      if (backendData.success) {
        toast.success('Prescription uploaded successfully!');
        getAppointments();
      } else {
        toast.error('Failed to save prescription: ' + backendData.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload prescription: ' + error.message);
      setUploading(false);
      setUploadingId(null);
      setFile(null);
    }
  };

  const handleDeletePrescription = async (appointmentId) => {
    try {
      const response = await fetch('http://localhost:4000/api/doctor/delete-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', dToken },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Prescription deleted successfully!');
        getAppointments();
      } else {
        toast.error('Failed to delete prescription: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Failed to delete prescription: ' + error.message);
    }
  };

  
  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])
  
  return (
    <div className='w-full max-w-6xl mx-auto px-4 sm:px-5 my-4 sm:my-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
          <p>Prescription</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-col sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-3 sm:gap-1 sm:items-center text-gray-500 py-3 px-4 sm:px-6 border-b hover:bg-gray-50' key={index}>
            {console.log(`Appointment ${item._id}: Prescription URL is ${item.prescription}`)}
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
            </div>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Payment</span>
              <p className='text-xs inline border border-primary px-2 rounded-full'>
                {item.payment?'Online':'CASH'}
              </p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Date & Time</span>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            </div>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Fees</span>
              <p>{currency}{item.amount}</p>
            </div>
            <div className='flex flex-col sm:block'>
              <span className='sm:hidden text-xs text-gray-400'>Action</span>
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
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                    <img onClick={() => appointmentConfirm(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                  </div>
              }
            </div>
            <div className='flex flex-col gap-1'>
              <span className='sm:hidden text-xs text-gray-400'>Prescription</span>
              {item.prescription && (
                <div className='flex items-center gap-2'>
                  <a href={item.prescription} target='_blank' rel='noopener noreferrer' className='text-green-600 underline text-xs'>View Prescription</a>
                  <button onClick={() => handleDeletePrescription(item._id)} className='text-red-500 text-xs'>Delete</button>
                </div>
              )}
              {!item.prescription && item.isCompleted && (
                <>
                  <button onClick={() => setUploadingId(item._id)} className='text-blue-500 underline text-xs'>Upload Prescription</button>
                  {uploadingId === item._id && (
                    <div className='flex flex-col gap-1'>
                      <input type='file' accept='image/*,application/pdf' onChange={e => setFile(e.target.files[0])} />
                      <button onClick={() => handlePrescriptionUpload(item._id)} disabled={uploading} className='bg-blue-500 text-white px-2 py-1 rounded text-xs'>
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}
                </>
              )}
              {!item.prescription && !item.isCompleted && (
                <p className='text-gray-400 text-xs'>Prescription will be available after appointment completion</p>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default DoctorAppointments