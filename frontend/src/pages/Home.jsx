import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiBook, FiUsers, FiAward, FiCheckCircle, FiTrendingUp, FiClock, FiVideo } from 'react-icons/fi';
import { adminAPI, courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';
import DemoVideoModal from '../components/DemoVideoModal';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Newsletter from '../components/Newsletter';

const Home = () => {
  const [heroSection, setHeroSection] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [heroRes, coursesRes] = await Promise.all([
        adminAPI.getHeroSection(),
        courseAPI.getAll({ limit: 6 })
      ]);
      setHeroSection(heroRes.data.data.heroSection);
      setCourses(coursesRes.data.data.courses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiBook className="w-8 h-8" />,
      title: 'Expert Faculty',
      description: 'Learn from experienced CA professionals with proven track records'
    },
    {
      icon: <FiClock className="w-8 h-8" />,
      title: 'Flexible Learning',
      description: 'Study at your own pace with lifetime access'
    },
    {
      icon: <FiVideo className="w-8 h-8" />,
      title: 'Recorded Lectures',
      description: 'Access HD quality lectures anytime, anywhere'
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: 'Study Material',
      description: 'Comprehensive notes, practice questions & mock tests'
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: 'Progress Tracking',
      description: 'Monitor your performance with detailed analytics'
    },
    {
      icon: <FiClock className="w-8 h-8" />,
      title: 'Doubt Support',
      description: 'Get your queries resolved by our expert faculty community'
    }
  ];

  const stats = [
    { label: 'Students Enrolled', value: '10,000+' },
    { label: 'Expert Instructors', value: '50+' },
    { label: 'Success Rate', value: '95%' },
    { label: 'Courses Available', value: '100+' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {heroSection?.showOffer && heroSection?.offerText && (
                <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                  {heroSection.offerText}
                </div>
              )}
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {heroSection?.title || 'Master CA with Expert Guidance'}
              </h1>
              
              <p className="text-xl md:text-2xl mb-4 text-gray-100">
                {heroSection?.subtitle || 'Join thousands of students achieving their CA dreams'}
              </p>
              
              <p className="text-lg mb-8 text-gray-200">
                {heroSection?.description || 'Comprehensive courses for CA Foundation, Intermediate, and Final'}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/courses" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                  {heroSection?.ctaText || 'Explore Courses'}
                </Link>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center space-x-2"
                >
                  <FiPlay />
                  <span>{heroSection?.secondaryCtaText || 'Watch Demo'}</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full"
            >
              <img
                src={heroSection?.bannerImage?.url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800'}
                alt="Students learning"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-gray-800 py-12 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to succeed in your CA journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="card text-center hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Featured Courses
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Start your CA journey with our popular courses
              </p>
            </div>
            <Link to="/courses" className="btn-primary hidden md:block">
              View All Courses
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/courses" className="btn-primary">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your CA Journey?
          </h2>
          <p className="text-xl mb-8 text-gray-100">
            Join thousands of successful students and achieve your dreams
          </p>
          <Link to="/register" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block shadow-lg">
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* Newsletter */}
      <Newsletter />

      {/* Demo Video Modal */}
      <DemoVideoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
        videoData={heroSection}
      />
    </div>
  );
};

export default Home;
