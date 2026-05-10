import { RouterProvider } from 'react-router-dom'
import router from './routes.jsx'
import ConnectionStatusModal from './components/ConnectionStatusModal.jsx'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ConnectionStatusModal />
    </>
  )
}

export default App