import doc1 from './doc1.png'
import doc2 from './doc2.png'
import doc3 from './doc3.png'
import book from './doc11.png'
import doctor from './doctor.png'
import gynecologist from './gynecologist.png'
import neurologist from './neurologist.png'
import dermatologist from './dermatologist (1).png'
import pediatrician from './pediatrician.png'
import gastroenterologist from './gastroenterologist.png'
import logo from './logo1(1).png'
import group from './group.png'
import kuh from './kuh.jpg'
import heade from './Head2.png'
import fee from './fee.png'
import exp from './exp.png'
import briefcase from './briefcase.png'
import verified from './verified_icon.svg'
import about from './info_icon.svg'
import clock from './clock.png'
import appointment from './appointment.png'
import profile from './user.png'
import logout from './logout(1).png'
import menu from './menu.png'
import X from './cross_icon.png'
import chat from './chat.svg'

export const specialityData = [
    {
        speciality: 'General physician',
        image: doctor
    },
    {
        speciality: 'Gynecologist',
        image: gynecologist
    },
    {
        speciality: 'Neurologist',
        image: neurologist
    },
    {
        speciality: 'Dermatologist',
        image: dermatologist
    },
    {
        speciality: 'Pediatrician',
        image: pediatrician
    },
    {
        speciality: 'Gastroenterologist',
        image: gastroenterologist
    },
]

export const doctors = [
    {
        _id: 'doc1',
        name: 'Dr. Hassan Ahmed',
        image: book,
        speciality: 'General Physician',
        degree: 'MBBS',
        experience: '3 years',
        about: 'dedicated hospital doctor specializing in general ',
        Fees: 50,
        adress: {
            add1:'office 402',
            add2:'none'
        }
    },
    {
        _id: 'doc2',
        name: 'Dr. Aaron Wilson',
        image: doc1,
        speciality: 'Pediatrician',
        degree: 'MBBS, MD Pediatrics',
        experience: '5 years',
        about: 'Experienced pediatrician specializing in child healthcare and development',
        Fees: 75,
        adress: {
            add1: '2456 sk. istanbul',
            add2: 'none'
        }
    },
    {
        _id: 'doc3',
        name: 'Dr. Michael Chen',
        image: doc2,
        speciality: 'Neurologist',
        degree: 'MD, PhD Neurology',
        experience: '8 years',
        about: 'Specialized in neurological disorders and brain health',
        Fees: 100,
        adress: {
            add1: '3789 sk. istanbul',
            add2: 'none'
        }
    },
    {
        _id: 'doc4',
        name: 'Dr. Julio Rodriguez',
        image: doc3,
        speciality: 'Dermatologist',
        degree: 'MD Dermatology',
        experience: '6 years',
        about: 'Expert in skin care and dermatological treatments',
        Fees: 90,
        adress: {
            add1: '4567 sk. istanbul',
            add2: 'none'
        }
    }
]

// Export all images for direct use in components
export const images = {
    doc1,
    doc2,
    doc3,
    book,
    doctor,
    gynecologist,
    neurologist,
    dermatologist,
    pediatrician,
    gastroenterologist,
    logo,
    group,
    kuh,
    heade,
    fee,
    exp,
    briefcase,
    verified,
    about,
    clock,
    appointment,
    profile,
    logout,
    menu,
    X,
    chat
}