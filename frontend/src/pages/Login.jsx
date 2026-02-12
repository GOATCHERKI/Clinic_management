import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Login = () => {
  const { t } = useTranslation();
  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (state === 'Sign Up') {
      const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password, phone })
      
      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message)
      }
    } else {
      const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message)
      }
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form className='min-h-[80vh] flex items-center' onSubmit={onSubmitHandler}>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 rounded-xl text-gray-800 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>
          {state === 'Sign Up' ? t('auth.createAccount') : t('auth.login')}
        </p>
        <p className='text-gray-500'>
          {state === 'Sign Up' ? t('auth.pleaseSignUp') : t('auth.pleaseLogin')}
        </p>
        {state === "Sign Up" && (
          <>
            <div className='w-full'>
              <p>{t('auth.fullName')}</p>
              <input 
                name='name' 
                className='border border-gray-300 rounded w-full p-2 mt-1' 
                type="text" 
                onChange={(e) => setName(e.target.value)} 
                value={name} 
                required 
              />
            </div>
            <div className='w-full'>
              <p>{t('auth.phoneNumber')}</p>
              <input 
                name='phone' 
                className='border border-gray-300 rounded w-full p-2 mt-1' 
                type="tel" 
                onChange={(e) => setPhone(e.target.value)} 
                value={phone} 
                required 
              />
            </div>
          </>
        )}
        <div className='w-full'>
          <p>{t('auth.email')}</p>
          <input 
            className='border border-gray-300 rounded w-full p-2 mt-1' 
            type="email" 
            onChange={(e) => setEmail(e.target.value)} 
            value={email} 
            required
          />
        </div>
        <div className='w-full'>
          <p>{t('auth.password')}</p>
          <input 
            className='border border-gray-300 rounded w-full p-2 mt-1' 
            type="password" 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
            required
          />
        </div>
        <button className='bg-blue-500 text-white rounded-md w-full py-2 text-base' type='submit'>
          {state === 'Sign Up' ? t('auth.createAccount') : t('auth.login')}
        </button>
        {state === "Sign Up" ? (
          <p>
            {t('auth.alreadyHaveAccount')} 
            <span className='text-blue-500 underline cursor-pointer' onClick={() => setState('Login')}>
              {t('auth.login')}
            </span>
          </p>
        ) : (
          <p>
            {t('auth.dontHaveAccount')} 
            <span className='text-blue-500 underline cursor-pointer' onClick={() => setState('Sign Up')}>
              {t('auth.signUp')}
            </span>
          </p>
        )}
      </div>
    </form>
  )
}

export default Login