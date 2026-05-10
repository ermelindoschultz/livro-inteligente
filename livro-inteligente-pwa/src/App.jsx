import { RouterProvider } from 'react-router-dom'
import router from './routes.jsx'
import ConnectionStatusModal from './components/ConnectionStatusModal.jsx'
import GlobalDialogContainer from './components/GlobalDialogContainer.jsx'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ConnectionStatusModal />
      <GlobalDialogContainer />
    </>
  )
}

export default App