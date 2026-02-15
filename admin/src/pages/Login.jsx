import axios from 'axios'
import { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [state, setState] = useState('Admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    if (state === 'Admin') {
      const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
      if (data.success) {
        setAToken(data.token)
        localStorage.setItem('aToken', data.token)
        navigate('/admin-dashboard')        
      } else {
        toast.error(data.message)
      }
    } else {
      const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
      if (data.success) {
        setDToken(data.token)
        localStorage.setItem('dToken', data.token)
        navigate('/doctor-dashboard')
      } else {
        toast.error(data.message)
      }
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'><span className='text-primary'>{state}</span> {t('auth.login')}</p>
        <div className='w-full '>
          <p>{t('auth.email')}</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>{t('auth.password')}</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
        </div>
        <button className='bg-primary text-white w-full py-2 rounded-md text-base'>{t('auth.login')}</button>
        {state === 'Admin' 
          ? <p>{t('auth.doctorLogin')} <span className='text-[#75a7e7] underline cursor-pointer' onClick={() => setState('Doctor')}>{t('auth.clickHere')}</span></p> 
          : <p>{t('auth.adminLogin')} <span className='text-[#75a7e7] underline cursor-pointer' onClick={() => setState('Admin')}>{t('auth.clickHere')}</span></p>
        }
      </div>
    </form>
  )
}

export default Login