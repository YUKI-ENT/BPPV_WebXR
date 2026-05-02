import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text, Torus } from '@react-three/drei'
import { XR, createXRStore } from '@react-three/xr'
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './App.css'

const xrStore = createXRStore()

function RotationDisplay3D() {
  const textRef = useRef<any>(null)

  useFrame(({ camera }) => {
    if (!textRef.current) return

    const rot = camera.rotation
    const x = THREE.MathUtils.radToDeg(rot.x).toFixed(1)
    const y = THREE.MathUtils.radToDeg(rot.y).toFixed(1)
    const z = THREE.MathUtils.radToDeg(rot.z).toFixed(1)

    textRef.current.text = `Head rotation\nX: ${x}  Y: ${y}  Z: ${z}`
  })

  return (
    <Text
      ref={textRef}
      position={[0, 1.6, -2.2]}
      fontSize={0.12}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      Head rotation
    </Text>
  )
}

function InnerEarPrototype() {
  return (
    <group position={[0, 1.4, -3]}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial color="yellow" />
      </mesh>

      {/* 前半規管っぽい輪 */}
      <Torus
        args={[0.55, 0.035, 16, 96]}
        position={[0, 0.35, -0.2]}
        rotation={[0, THREE.MathUtils.degToRad(60), 0]}
      >
        <meshStandardMaterial color="red" transparent opacity={0.45} />
      </Torus>

      {/* 外側半規管っぽい輪 */}
      <Torus
        args={[0.55, 0.035, 16, 96]}
        position={[0.45, 0, 0]}
        rotation={[THREE.MathUtils.degToRad(120), 0, 0]}
      >
        <meshStandardMaterial color="green" transparent opacity={0.45} />
      </Torus>

      {/* 後半規管っぽい輪 */}
      <Torus
        args={[0.55, 0.035, 16, 96]}
        position={[0, 0.2, 0.45]}
        rotation={[0, THREE.MathUtils.degToRad(-40), 0]}
      >
        <meshStandardMaterial color="blue" transparent opacity={0.45} />
      </Torus>
    </group>
  )
}

function Scene() {
  const horizonPoints = useMemo(
    () =>
      [
        [-20, 0, -20],
        [20, 0, -20],
      ] as [number, number, number][],
    []
  )

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

      <Line points={horizonPoints} color="white" lineWidth={2} />

      <Line points={[[0, 0.02, 0], [5, 0.02, 0]]} color="red" lineWidth={3} />
      <Text position={[5.4, 0.2, 0]} fontSize={0.35} color="red">X</Text>

      <Line points={[[0, 0.02, 0], [0, 5, 0]]} color="green" lineWidth={3} />
      <Text position={[0.2, 5.3, 0]} fontSize={0.35} color="green">Y</Text>

      <Line points={[[0, 0.02, 0], [0, 0.02, 5]]} color="blue" lineWidth={3} />
      <Text position={[0, 0.2, 5.4]} fontSize={0.35} color="blue">Z</Text>

      <InnerEarPrototype />
      <RotationDisplay3D />

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