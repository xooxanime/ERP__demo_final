import { Link } from 'react-router-dom';
import { FiUsers, FiClock, FiStar } from 'react-icons/fi';
import { formatCurrency } from '../utils/helpers';

const CourseCard = ({ course }) => {
  const finalPrice = course.price - (course.price * course.discount / 100);

  return (
    <Link to={`/courses/${course._id}`} className="card-hover group">
      {/* Thumbnail */}
      <div className="relative overflow-hidden rounded-lg mb-4">
        <img
          src={course.thumbnail?.url || 'https://via.placeholder.com/400x250'}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {course.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {course.discount}% OFF
          </div>
        )}
        <div className="absolute top-2 left-2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {course.category}
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span className="font-medium">{course.instructor}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <FiUsers className="w-4 h-4" />
            <span>{course.enrolledStudents || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          {course.rating > 0 && (
            <div className="flex items-center space-x-1">
              <FiStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            {course.discount > 0 ? (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(finalPrice)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(course.price)}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(course.price)}
              </span>
            )}
          </div>
          <button className="btn-primary text-sm">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
