import { useState } from 'react'
import './App.css'
import AuthModal from './AuthModal.jsx'
import JobMarketplace from './JobMarketplace.jsx'

// Mở trang web là vào thẳng trang chủ việc làm (khách xem được danh sách việc).
// Đăng nhập / Đăng ký là hộp thoại, chỉ bắt buộc khi ứng tuyển hoặc đăng tin.
function App() {
  const [session, setSession] = useState(null)
  const [auth, setAuth] = useState(null) // { mode, role, reason, intent }
  const [intent, setIntent] = useState(null) // việc cần làm tiếp sau khi đăng nhập
  const [flash, setFlash] = useState('')

  function requestAuth({ mode = 'login', role = 'STUDENT', reason = '', intent: next = null } = {}) {
    setAuth({ mode, role, reason, intent: next })
  }

  function handleLoggedIn(data) {
    // Ví dụ: khách bấm "Ứng tuyển" → đăng nhập bằng tài khoản sinh viên → mở luôn form ứng tuyển.
    const next = auth?.intent
    setIntent(next && (!next.role || next.role === data.role) ? next : null)
    setSession(data)
    setAuth(null)
    setFlash('')
  }

  function signOut() {
    setSession(null)
    setIntent(null)
    setFlash('Bạn đã đăng xuất.')
  }

  return (
    <>
      <JobMarketplace
        key={session ? `user-${session.userId}` : 'guest'}
        session={session}
        intent={intent}
        flash={flash}
        onRequestAuth={requestAuth}
        onLogout={signOut}
        onProfileSaved={(profile) => setSession((current) => ({ ...current, fullName: profile.fullName }))}
      />
      {auth && (
        <AuthModal
          key={`${auth.mode}-${auth.role}`}
          initialMode={auth.mode}
          initialRole={auth.role}
          reason={auth.reason}
          onClose={() => setAuth(null)}
          onLoggedIn={handleLoggedIn}
        />
      )}
    </>
  )
}

export default App
