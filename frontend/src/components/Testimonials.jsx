import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'CA Final Student',
      image: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=3B82F6&color=fff&size=128',
      rating: 5,
      text: 'SHRI Educational World transformed my CA preparation. The faculty is excellent and the study material is comprehensive. Highly recommended!'
    },
    {
      name: 'Priya Patel',
      role: 'CA Intermediate',
      image: 'https://ui-avatars.com/api/?name=Priya+Patel&background=8B5CF6&color=fff&size=128',
      rating: 5,
      text: 'Best platform for CA preparation! Live classes are interactive and recorded lectures help me revise anytime. Thank you SHRI!'
    },
    {
      name: 'Amit Kumar',
      role: 'CA Foundation',
      image: 'https://ui-avatars.com/api/?name=Amit+Kumar&background=10B981&color=fff&size=128',
      rating: 5,
      text: 'The structured approach and expert guidance helped me clear CA Foundation in first attempt. Grateful to the entire team!'
    },
    {
      name: 'Sneha Reddy',
      role: 'CA Final Cleared',
      image: 'https://ui-avatars.com/api/?name=Sneha+Reddy&background=F59E0B&color=fff&size=128',
      rating: 5,
      text: 'I cleared CA Final with excellent marks thanks to SHRI Educational World. The mock tests and doubt sessions were invaluable!'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Students Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Join thousands of successful CA students
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Student Info */}
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
