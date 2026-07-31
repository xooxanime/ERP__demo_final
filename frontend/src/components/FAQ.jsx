import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What courses do you offer?',
      answer: 'We offer comprehensive courses for CA Foundation, CA Intermediate, and CA Final. Each course includes live classes, recorded lectures, study material, and mock tests.'
    },
    {
      question: 'Can I access recorded lectures?',
      answer: 'Yes! All live classes are recorded and available for unlimited viewing. You can access them anytime, anywhere at your convenience.'
    },
    {
      question: 'Who are the instructors?',
      answer: 'Our instructors are experienced CA professionals with years of teaching experience. They are experts in their subjects and dedicated to student success.'
    },
    {
      question: 'Do you provide study material?',
      answer: 'Yes, we provide comprehensive study material including notes, practice questions, and previous year papers for all subjects.'
    },
    {
      question: 'Is there any doubt clearing session?',
      answer: 'Absolutely! We conduct regular doubt clearing sessions where you can ask questions directly to the faculty. You can also post doubts in our discussion forum.'
    },
    {
      question: 'What is the validity of the course?',
      answer: 'Course validity varies by program. Typically, courses are valid until the exam attempt. Check individual course details for specific validity periods.'
    },
    {
      question: 'Do you offer any free trial?',
      answer: 'Yes, we offer free demo classes for all courses. You can attend a demo class before enrolling to experience our teaching methodology.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major payment methods including credit/debit cards, net banking, UPI, and digital wallets through our secure payment gateway.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Got questions? We've got answers!
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white pr-8">
                  {faq.question}
                </span>
                <FiChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
