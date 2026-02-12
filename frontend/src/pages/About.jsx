import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo1.png';

const About = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      title: "24/7 Availability",
      description: "Round-the-clock access to healthcare services and appointment booking.",
      icon: "🕒"
    },
    {
      title: "Expert Doctors",
      description: "Access to a network of verified and experienced healthcare professionals.",
      icon: "👨‍⚕️"
    },
    {
      title: "Easy Scheduling",
      description: "Intuitive booking system that fits your busy lifestyle.",
      icon: "📅"
    },
    {
      title: "Smart Reminders",
      description: "Automated notifications to keep your health appointments on track.",
      icon: "🔔"
    }
  ];

  const stats = [
    { number: "50k+", label: "Patients Served" },
    { number: "200+", label: "Expert Doctors" },
    { number: "15+", label: "Specialties" },
    { number: "98%", label: "Satisfaction Rate" }
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Smart Clinic Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-blue-600">Us</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Welcome to Smart Clinic, your trusted partner in managing healthcare needs conveniently and efficiently. 
            We understand the challenges individuals face when it comes to scheduling doctor appointments and managing their health records.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/doctors')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all"
            >
              Find Doctors
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-all"
            >
              Contact Us
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-blue-50 rounded-xl"
              >
                <h2 className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</h2>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Why Choose Smart Clinic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-center"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
            <p className="text-lg leading-relaxed opacity-90">
              Our vision at Smart Clinic is to create a seamless healthcare experience for every user. 
              We aim to bridge the gap between patients and healthcare providers, making it easier 
              for you to access the care you need, when you need it.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
