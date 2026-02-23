import { useContext, useState } from 'react'
import { images } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  const handleNavigation = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  const navLinkClasses = ({ isActive }) =>
    `relative py-2 px-1 text-sm font-medium transition-colors ${
      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <nav className='top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 relative'>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img onClick={() => handleNavigation('/')} className="h-8 w-auto cursor-pointer" src={images.logo} alt="Smart Clinic Logo" />
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center space-x-8">
            <NavLink to="/" className={navLinkClasses} onClick={() => setShowMenu(false)}>
              <li className="group">
                {t('nav.home')}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </li>
            </NavLink>
            <NavLink to="/doctors" className={navLinkClasses} onClick={() => setShowMenu(false)}>
              <li className="group">
                {t('nav.doctors')}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </li>
            </NavLink>
            <NavLink to="/about" className={navLinkClasses} onClick={() => setShowMenu(false)}>
              <li className="group">
                {t('nav.about')}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </li>
            </NavLink>
            <NavLink to="/contact" className={navLinkClasses} onClick={() => setShowMenu(false)}>
              <li className="group">
                {t('nav.contact')}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </li>
            </NavLink>
          </ul>

          {/* Desktop Right Section */}
          <div className='hidden lg:flex items-center gap-4'>
            <LanguageSwitcher />
            {token && userData ? (
              <div className="flex items-center gap-3 cursor-pointer group relative">
                <img 
                  className="w-9 h-9 rounded-full border-2 border-gray-200 transition-all group-hover:border-blue-400" 
                  src={userData.image} 
                  alt="User" 
                />
                <svg
                  className="w-4 h-4 text-gray-600 transition-transform duration-300 group-hover:text-blue-600 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    <p
                      onClick={() => {
                        handleNavigation('/my-profile');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <img src={images.profile} alt="Profile" className="w-4 h-4" />
                      {t('common.myProfile')}
                    </p>
                    <p
                      onClick={() => {
                        handleNavigation('my-appointments');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <img src={images.appointment} alt="Appointments" className="w-4 h-4" />
                      {t('common.myAppointments')}
                    </p>
                    <p
                      onClick={() => {
                        handleNavigation('/chat');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <img src={images.chat} alt="Chat" className="w-4 h-4" />
                      {t('common.chat')}
                    </p>
                    <p
                      onClick={() => {
                        logout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <img src={images.logout} alt="Logout" className="w-4 h-4" />
                      {t('common.logout')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-105"
              >
                {t('common.createAccount')}
              </button>
            )}
          </div>

          {/* Hamburger menu button (mobile only) */}
          <button
            className="lg:hidden flex items-center justify-center p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Toggle menu"
            type="button"
          >
            <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`${showMenu ? 'block' : 'hidden'} lg:hidden border-t border-gray-200`}>
          <div className="py-3 space-y-1">
            {/* Navigation Links */}
            <NavLink
              to="/"
              onClick={() => setShowMenu(false)}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-base font-medium ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/doctors"
              onClick={() => setShowMenu(false)}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-base font-medium ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {t('nav.doctors')}
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setShowMenu(false)}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-base font-medium ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {t('nav.about')}
            </NavLink>
            <NavLink
              to="/contact"
              onClick={() => setShowMenu(false)}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-base font-medium ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {t('nav.contact')}
            </NavLink>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* User Section for Mobile */}
            {token && userData ? (
              <>
                <div className="px-4 py-2 flex items-center gap-3">
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-gray-200" 
                    src={userData.image} 
                    alt="User" 
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                    <p className="text-xs text-gray-500">{userData.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleNavigation('/my-profile');
                  }}
                  className="w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                >
                  <img src={images.profile} alt="Profile" className="w-5 h-5" />
                  {t('common.myProfile')}
                </button>
                <button
                  onClick={() => {
                    handleNavigation('my-appointments');
                  }}
                  className="w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                >
                  <img src={images.appointment} alt="Appointments" className="w-5 h-5" />
                  {t('common.myAppointments')}
                </button>
                <button
                  onClick={() => {
                    handleNavigation('/chat');
                  }}
                  className="w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                >
                  <img src={images.chat} alt="Chat" className="w-5 h-5" />
                  {t('common.chat')}
                </button>
                <button
                  onClick={() => {
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <img src={images.logout} alt="Logout" className="w-5 h-5" />
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <div className="px-4 py-2">
                <button
                  onClick={() => {
                    navigate('/login');
                    setShowMenu(false);
                  }}
                  className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-full text-base font-medium hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('common.createAccount')}
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Language Switcher for Mobile */}
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Language
              </p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar