import { useState , useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { images } from '../assets/assets'

const MyProfile = () => {

  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)
  const [medicalFiles, setMedicalFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

  const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

  // Function to fetch user's appointments
  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
      if (data.success) {
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to fetch appointments')
    }
  }

  useEffect(() => {
    if (userData) {
      fetchAppointments()
    }
  }, [userData])

  // Function to update user profile data using API
  const updateUserProfileData = async () => {
    try {
      const formData = new FormData();
      formData.append('name', userData.name)
      formData.append('email', userData.email)    
      formData.append('phone', userData.phone)
      formData.append('emergency_phone', userData.emergency_phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)
      image && formData.append('image', image)

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Upload medical file handler
  const handleMedicalFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }
    setUploading(true)
    try {
      // First upload to Cloudinary
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('upload_preset', 'medical_files')

      const res = await fetch('https://api.cloudinary.com/v1_1/dtvsxpzch/raw/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(`Cloudinary upload failed: ${data.error?.message || 'Unknown error'}`)
      }
      
      if (!data.secure_url) {
        throw new Error('Cloudinary upload failed: No secure_url in response')
      }

      // Then send to backend
      const backendResponse = await axios.post(backendUrl + '/api/user/upload-medical-file', {
        userId: userData._id,
        fileUrl: data.secure_url,
        fileName: selectedFile.name,
        fileType: selectedFile.type
      }, { headers: { token } })

      if (backendResponse.data.success) {
        toast.success('File uploaded successfully!')
        // Update local state with new file
        setMedicalFiles(prev => [...prev, {
          url: data.secure_url,
          name: selectedFile.name,
          type: selectedFile.type,
          uploadedAt: Date.now()
        }])
        // Reload user data to get updated medical history
        await loadUserProfileData()
        // Clear selected file
        setSelectedFile(null)
      } else {
        toast.error(backendResponse.data.message)
      }
    } catch (err) {
      console.error(err)
      toast.error('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  // Load medical files from user's medical history when component mounts
  useEffect(() => {
    if (userData && userData.medical_history && userData.medical_history.files) {
      setMedicalFiles(userData.medical_history.files)
    }
  }, [userData])

  // Function to delete medical file
  const handleDeleteMedicalFile = async (fileUrl) => {
    try {
      console.log('Attempting to delete file:', fileUrl);
      const { data } = await axios.post(backendUrl + '/api/user/delete-medical-file', {
        userId: userData._id,
        fileUrl
      }, { headers: { token } })

      console.log('Delete response:', data);

      if (data.success) {
        toast.success('File deleted successfully!')
        // Update local state
        setMedicalFiles(prev => prev.filter(file => file.url !== fileUrl))
        // Reload user data to get updated medical history
        await loadUserProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file: ' + error.message)
    }
  }

  return userData ? (
    <div className="flex items-start justify-center mt-0 mb-0 min-h-screen w-full bg-white">
      {/* Profile Card */}
      <div className="w-full max-w-md flex flex-col gap-6 text-base bg-white p-8 rounded-2xl shadow-xl border border-blue-100 mr-8 mt-10 mb-10">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
          <div className="relative">
            {isEdit ? (
              <label htmlFor="image">
                <div className="inline-block relative cursor-pointer">
                  <img
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg opacity-80"
                    src={image ? URL.createObjectURL(image) : userData.image}
                    alt=""
                  />
                  <img
                    className="w-10 absolute bottom-2 right-2"
                    src={image ? "" : images.upload_icon}
                    alt=""
                  />
                </div>
                <input
                  onChange={(e) => setImage(e.target.files[0])}
                  type="file"
                  id="image"
                  hidden
                />
              </label>
            ) : (
              <img
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                src={userData.image}
                alt=""
              />
            )}
          </div>
          <div className="flex-1 flex flex-col items-center sm:items-start">
            {isEdit ? (
              <input
                className="bg-gray-50 text-1xl font-bold max-w-[230px] px-2 py-1 rounded border border-gray-200 focus:outline-blue-300"
                type="text"
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, name: e.target.value }))
                }
                value={userData.name}
              />
            ) : (
              <p className="font-bold text-2xl text-[#262626] mt-2 text-center sm:text-left">
                {userData.name}
              </p>
            )}
            <p className="text-base text-blue-400 mt-1">{userData.email}</p>
          </div>
        </div>

        <hr className="bg-[#ADADAD] h-[2px] border-none mb-2" />

        <div className="grid grid-cols-1 gap-4">
          {/* Contact Information */}
          <div>
            <p className="text-blue-600 font-semibold underline mb-2 tracking-wide">
              CONTACT INFORMATION
            </p>
            <div className="flex flex-col gap-2 text-[#363636]">
              <div>
                <span className="font-medium">Phone:</span>
                {isEdit ? (
                  <input
                    className="bg-gray-50 max-w-40 ml-2 px-2 py-1 rounded border border-gray-200"
                    type="text"
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    value={userData.phone}
                  />
                ) : (
                  <span className="text-blue-500 ml-2">{userData.phone}</span>
                )}
              </div>
              <div>
                <span className="font-medium">Emergency Phone:</span>
                {isEdit ? (
                  <input
                    className="bg-gray-50 max-w-40 ml-2 px-2 py-1 rounded border border-gray-200"
                    type="text"
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        emergency_phone: e.target.value,
                      }))
                    }
                    value={userData.emergency_phone}
                  />
                ) : (
                  <span className="text-blue-500 ml-2">
                    {userData.emergency_phone}
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Address:</span>
                {isEdit ? (
                  <span className="block mt-1">
                    <input
                      className="bg-gray-50 w-full mb-1 px-2 py-1 rounded border border-gray-200"
                      type="text"
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          address: { ...prev.address, line1: e.target.value },
                        }))
                      }
                      value={userData.address.line1}
                    />
                    <input
                      className="bg-gray-50 w-full px-2 py-1 rounded border border-gray-200"
                      type="text"
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          address: { ...prev.address, line2: e.target.value },
                        }))
                      }
                      value={userData.address.line2}
                    />
                  </span>
                ) : (
                  <span className="text-gray-500 ml-2 block">
                    {userData.address.line1}
                    <br />
                    {userData.address.line2}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <p className="text-blue-600 font-semibold underline mb-2 tracking-wide">
              BASIC INFORMATION
            </p>
            <div className="flex flex-col gap-2 text-gray-600">
              <div>
                <span className="font-medium">Gender:</span>
                {isEdit ? (
                  <select
                    className="max-w-24 ml-2 bg-gray-50 px-2 py-1 rounded border border-gray-200"
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    value={userData.gender}
                  >
                    <option value="Not Selected">Not Selected</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                ) : (
                  <span className="text-gray-500 ml-2">{userData.gender}</span>
                )}
              </div>
              <div>
                <span className="font-medium">Birthday:</span>
                {isEdit ? (
                  <input
                    className="max-w-32 ml-2 bg-gray-50 px-2 py-1 rounded border border-gray-200"
                    type="date"
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        dob: e.target.value,
                      }))
                    }
                    value={userData.dob}
                  />
                ) : (
                  <span className="text-gray-500 ml-2">{userData.dob}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          {isEdit ? (
            <button
              onClick={updateUserProfileData}
              className="border border-green-400 px-8 py-2 rounded-full bg-green-400 text-white font-semibold text-base shadow hover:bg-green-500 transition-all duration-300"
            >
              Save information
            </button>
          ) : (
            <button
              onClick={() => setIsEdit(true)}
              className="border border-blue-400 px-8 py-2 rounded-full bg-blue-400 text-white font-semibold text-base shadow hover:bg-blue-500 transition-all duration-300"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Medical History Card */}
      <div className="w-full max-w-lg flex flex-col gap-6 text-base bg-white p-8 rounded-2xl shadow-xl border border-blue-100 mt-10 mb-10">
        <p className="text-blue-600 font-semibold underline mb-2 tracking-wide">
          MEDICAL HISTORY
        </p>
        
        {/* Appointment Prescriptions */}
        <div className="mb-6">
          <p className="font-medium mb-3">Appointment Prescriptions:</p>
          {appointments.length === 0 ? (
            <p className="text-gray-400">No appointments found.</p>
          ) : (
            <div className="space-y-4">
              {appointments
                .filter(appointment => appointment.isCompleted && appointment.prescription)
                .map((appointment, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Dr. {appointment.docData.name}</p>
                        <p className="text-sm text-gray-600">
                          {appointment.slotDate}, {appointment.slotTime}
                        </p>
                      </div>
                      <a
                        href={appointment.prescription}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline text-sm"
                      >
                        View Prescription
                      </a>
                    </div>
                  </div>
                ))}
              {appointments.filter(appointment => appointment.isCompleted && appointment.prescription).length === 0 && (
                <p className="text-gray-400">No prescriptions available from completed appointments.</p>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Upload Additional Medical Files</label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              disabled={uploading}
            />
            {selectedFile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
                <button
                  onClick={handleMedicalFileUpload}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="font-medium mb-2">Additional Medical Files:</p>
          <ul className="list-disc ml-6">
            {medicalFiles.length === 0 && <li className="text-gray-400">No additional files uploaded yet.</li>}
            {medicalFiles.map((file, idx) => (
              <li key={idx} className="mb-2">
                <div className="flex items-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    {file.name || `File ${idx + 1}`}
                  </a>
                  <span className="text-sm text-gray-500">
                    ({new Date(file.uploadedAt).toLocaleDateString()})
                  </span>
                  <button
                    onClick={() => handleDeleteMedicalFile(file.url)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  ) : null
}

export default MyProfile