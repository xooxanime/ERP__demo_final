import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 flex items-center justify-center bg-white rounded-lg shadow-md p-2">
                <img 
                  src="/shri-logo.png" 
                  alt="SHRI Educational World" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 rounded text-white font-bold text-2xl">S</div>';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-tight">SHRI</span>
                <span className="text-base font-semibold text-blue-400 leading-tight">EDUCATIONAL WORLD</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Empowering students with quality education. Comprehensive courses for CA Foundation, Intermediate, and Final.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-sm hover:text-primary-400 transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-primary-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-primary-400 transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses?category=CA Foundation" className="text-sm hover:text-primary-400 transition-colors">
                  CA Foundation
                </Link>
              </li>
              <li>
                <Link to="/courses?category=CA Intermediate" className="text-sm hover:text-primary-400 transition-colors">
                  CA Intermediate
                </Link>
              </li>
              <li>
                <Link to="/courses?category=CA Final" className="text-sm hover:text-primary-400 transition-colors">
                  CA Final
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm">
                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>455 B, 3rd Floor Rd, near Bazar India, Betiahata, Gorakhpur, Uttar Pradesh 273001</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiPhone className="w-4 h-4" />
                <span>+91 94153 74479</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiMail className="w-4 h-4" />
                <span>support@shrieducationalworld.com</span>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} SHRI Educational World. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
