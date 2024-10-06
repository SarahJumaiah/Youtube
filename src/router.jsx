import { createBrowserRouter } from 'react-router-dom';
import App from './App';  
import Sign from './pages/Sign';  
import Home from './pages/Home';  
import Content from './pages/Content';  
import NotFoundPage from './pages/NotFoundPage';  

const router = createBrowserRouter([
  {
    path: "/",  
    element: <App />,
  },
  {
    path: "/signup",
    element: <Sign />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/content/:id",  
    element: <Content />,
  },
  {
    path: "*",  
    element: <NotFoundPage />,  
  },
]);

export default router;
