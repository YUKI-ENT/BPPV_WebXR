import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import './App.css'

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

      {/* X軸 */}
      <Line points={[[0, 0.02, 0], [5, 0.02, 0]]} color="red" lineWidth={3} />
      <Text position={[5.4, 0.2, 0]} fontSize={0.35} color="red">
        X
      </Text>

      {/* Y軸 */}
      <Line points={[[0, 0.02, 0], [0, 5, 0]]} color="green" lineWidth={3} />
      <Text position={[0.2, 5.3, 0]} fontSize={0.35} color="green">
        Y
      </Text>

      {/* Z軸 */}
      <Line points={[[0, 0.02, 0], [0, 0.02, 5]]} color="blue" lineWidth={3} />
      <Text position={[0, 0.2, 5.4]} fontSize={0.35} color="blue">
        Z
      </Text>

      {/* 水平線 */}
      <Line points={[[-20, 0, -20], [20, 0, -20]]} color="white" lineWidth={2} />

      <OrbitControls makeDefault />
    </>
  )
}

export default function App() {
  return (
    <div className="app">
      <div className="hud">
        <h1>BPPV WebXR Prototype</h1>
        <div>地面・水平線・XYZ軸の初期表示</div>
      </div>

      <Canvas camera={{ position: [6, 5, 8], fov: 55 }}>
        <color attach="background" args={['#111827']} />
        <Scene />
      </Canvas>
    </div>
  )
}