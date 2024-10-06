import { Link } from 'react-router-dom'; 

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-6">
      <h1 className="text-5xl font-extrabold text-gray-800">404</h1>
      <p className="text-2xl font-semibold mt-2 text-gray-600">Page Not Found</p>
      <p className="text-md mt-4 text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/home" className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
        Go Back to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
