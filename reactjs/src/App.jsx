import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import ChatWidget from './components/ChatWidget/ChatWidget';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;
