import { useState } from 'react'
import './App.css'

interface Operation {
  type: 'resize' | 'pad' | 'convert' | 'compress' | 'strip-metadata' | 'rename'
  params: Record<string, unknown>
}

function App() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
  }

  const handleAddOperation = (type: Operation['type']) => {
    const newOp: Operation = {
      type,
      params: {},
    }
    setOperations([...operations, newOp])
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎨 Pixen</h1>
        <p>Client-side image processing and organization</p>
      </header>

      <main className="main">
        <div className="import-section">
          <h2>Step 1: Import Images</h2>
          <div
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <p>Drag and drop images here or use file picker</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(Array.from(e.currentTarget.files || []))}
              style={{ marginTop: '1rem' }}
            />
          </div>
          {selectedFiles.length > 0 && (
            <p className="file-count">{selectedFiles.length} image(s) selected</p>
          )}
        </div>

        <div className="pipeline-section">
          <h2>Step 2: Build Pipeline</h2>
          <div className="operation-buttons">
            <button onClick={() => handleAddOperation('resize')}>+ Resize</button>
            <button onClick={() => handleAddOperation('pad')}>+ Pad</button>
            <button onClick={() => handleAddOperation('convert')}>+ Convert Format</button>
            <button onClick={() => handleAddOperation('compress')}>+ Compress</button>
            <button onClick={() => handleAddOperation('strip-metadata')}>+ Strip Metadata</button>
            <button onClick={() => handleAddOperation('rename')}>+ Rename</button>
          </div>

          {operations.length > 0 && (
            <div className="pipeline-preview">
              <h3>Pipeline ({operations.length} operations)</h3>
              <ol>
                {operations.map((op, idx) => (
                  <li key={idx}>
                    <strong>{op.type}</strong>
                    <button
                      onClick={() => setOperations(operations.filter((_, i) => i !== idx))}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="preview-section">
          <h2>Step 3: Preview & Process</h2>
          <p className="coming-soon">
            Preview system coming soon — real-time before/after comparison
          </p>
        </div>

        <div className="status">
          <p>Status: Scaffolding in progress</p>
          <p>Read docs/SPEC.md for full feature specification</p>
        </div>
      </main>

      <footer className="footer">
        <p>
          All processing happens on your machine. Your data never leaves your browser.
        </p>
      </footer>
    </div>
  )
}

export default App
