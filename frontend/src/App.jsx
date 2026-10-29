import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Connecting...')
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/hello', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.text()
      })
      .then((data) => {
        setMessage(data)
        setError(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setMessage('Cannot connect to Spring Boot')
        setError(true)
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <section className="panel">
        <h1>Student Freelance Marketplace</h1>
        <p>ReactJS + Spring Boot + MySQL</p>

        <h2>Backend Connection Test</h2>
        <p>{message}</p>

        <strong>
          {error ? 'Connection failed' : 'API test'}
        </strong>
      </section>
    </main>
  )
}

export default App
