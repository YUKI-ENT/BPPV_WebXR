import { RightInnerEarModel } from './components/RightInnerEarModel'
import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { XR, createXRStore } from '@react-three/xr'
import { useState } from 'react'
import './App.css'

const xrStore = createXRStore()

function Scene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />

      <Grid
        args={[40, 40]}
        cellSize={1}
        sectionSize={5}
        position={[0, 0, 0]}
      />

      <Line points={[[-20, 0, -20], [20, 0, -20]]} color="white" lineWidth={2} />

      <Line points={[[0, 0.02, 0], [5, 0.02, 0]]} color="red" lineWidth={3} />
      <Text position={[5.4, 0.2, 0]} fontSize={0.35} color="red">X</Text>

      <Line points={[[0, 0.02, 0], [0, 5, 0]]} color="green" lineWidth={3} />
      <Text position={[0.2, 5.3, 0]} fontSize={0.35} color="green">Y</Text>

      <Line points={[[0, 0.02, 0], [0, 0.02, 5]]} color="blue" lineWidth={3} />
      <Text position={[0, 0.2, 5.4]} fontSize={0.35} color="blue">Z</Text>

      <RightInnerEarModel />

      <OrbitControls makeDefault />
    </>
  )
}

export default function App() {
  const [vrError, setVrError] = useState<string>('')

  const enterVR = async () => {
    try {
      setVrError('')
      await xrStore.enterVR()
    } catch (e) {
      console.error(e)
      setVrError('VR開始に失敗しました。Quest BrowserでHTTPSページを開いてください。')
    }
  }

  return (
    <div className="app">
      <div className="hud">
        <h1>BPPV WebXR Prototype</h1>
        <button onClick={enterVR}>VR開始</button>
        <div>地面・水平線・XYZ軸・三半規管プロトタイプ</div>
        {vrError && <p className="error">{vrError}</p>}
      </div>

      <Canvas camera={{ position: [0, 1.6, 4], fov: 65 }}>
        <color attach="background" args={['#111827']} />
        <XR store={xrStore}>
          <Scene />
        </XR>
      </Canvas>
    </div>
  )
}
