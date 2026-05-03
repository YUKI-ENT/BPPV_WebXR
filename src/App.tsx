import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { XR, createXRStore } from '@react-three/xr'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { RightInnerEarModel } from './components/RightInnerEarModel'
import { getHeadPose } from './utils/xrHeadPose'
import './App.css'

const xrStore = createXRStore()

type HeadGravity = {
  x: number
  y: number
  z: number
}

function HeadPoseDebug({
  onChange,
}: {
  onChange: (gravity: HeadGravity) => void
}) {
  const lastUpdate = useRef(0)
  const headPosition = useRef(new THREE.Vector3())
  const quaternion = useRef(new THREE.Quaternion())
  const inverseQuaternion = useRef(new THREE.Quaternion())
  const localGravity = useRef(new THREE.Vector3())
  const worldGravity = useRef(new THREE.Vector3(0, -1, 0))

  useFrame(({ camera, clock, gl }) => {
    const elapsed = clock.getElapsedTime()
    if (elapsed - lastUpdate.current < 0.12) return

    getHeadPose(camera, gl, headPosition.current, quaternion.current)
    inverseQuaternion.current.copy(quaternion.current).invert()
    localGravity.current.copy(worldGravity.current).applyQuaternion(inverseQuaternion.current)
    onChange({
      x: localGravity.current.x,
      y: localGravity.current.y,
      z: localGravity.current.z,
    })
    lastUpdate.current = elapsed
  })

  return null
}

function ViewLockedOverlay({ gravity }: { gravity: HeadGravity }) {
  const groupRef = useRef<THREE.Group>(null)
  const cameraPosition = useRef(new THREE.Vector3())
  const cameraQuaternion = useRef(new THREE.Quaternion())

  useFrame(({ camera, gl }) => {
    const group = groupRef.current
    if (!group) return

    getHeadPose(camera, gl, cameraPosition.current, cameraQuaternion.current)

    group.position.copy(cameraPosition.current)
    group.quaternion.copy(cameraQuaternion.current)
  })

  return (
    <group ref={groupRef}>
      <group position={[0, 0.35, -7]}>
        <RightInnerEarModel />
      </group>
      <Text
        position={[0, -0.72, -2.2]}
        fontSize={0.075}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineColor="#111827"
        outlineWidth={0.006}
      >
        {`X: ${gravity.x.toFixed(2)} Y: ${gravity.y.toFixed(2)} Z: ${gravity.z.toFixed(2)}`}
      </Text>
    </group>
  )
}

function Scene({
  headGravity,
  onHeadGravityChange,
}: {
  headGravity: HeadGravity
  onHeadGravityChange: (gravity: HeadGravity) => void
}) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <HeadPoseDebug onChange={onHeadGravityChange} />
      <ViewLockedOverlay gravity={headGravity} />

      <Grid
        args={[40, 40]}
        cellSize={1}
        sectionSize={5}
        position={[0, 0, 0]}
      />

      <Line points={[[-20, 0, -20], [20, 0, -20]]} color="white" lineWidth={2} />

      <Line points={[[0, 0.02, 0], [5, 0.02, 0]]} color="red" lineWidth={3} />
      <Text position={[5.4, 0.2, 0]} fontSize={0.35} color="red">
        X
      </Text>

      <Line points={[[0, 0.02, 0], [0, 5, 0]]} color="green" lineWidth={3} />
      <Text position={[0.2, 5.3, 0]} fontSize={0.35} color="green">
        Y
      </Text>

      <Line points={[[0, 0.02, 0], [0, 0.02, 5]]} color="blue" lineWidth={3} />
      <Text position={[0, 0.2, 5.4]} fontSize={0.35} color="blue">
        Z
      </Text>

      <OrbitControls makeDefault />
    </>
  )
}

export default function App() {
  const [vrError, setVrError] = useState<string>('')
  const [headGravity, setHeadGravity] = useState<HeadGravity>({ x: 0, y: -1, z: 0 })

  const enterVR = async () => {
    try {
      setVrError('')
      await xrStore.enterVR()
    } catch (e) {
      console.error(e)
      setVrError('VR start failed. Open the HTTPS GitHub Pages URL in Quest Browser.')
    }
  }

  return (
    <div className="app">
      <div className="hud">
        <h1>BPPV WebXR Prototype</h1>
        <button onClick={enterVR}>Start VR</button>
        <div>Right inner ear model, posterior canal otolith, grid, and XYZ axes.</div>
        <div className="debug-pose">
          <div>Gravity vector debug</div>
          <div>X: {headGravity.x.toFixed(2)}</div>
          <div>Y: {headGravity.y.toFixed(2)}</div>
          <div>Z: {headGravity.z.toFixed(2)}</div>
        </div>
        {vrError && <p className="error">{vrError}</p>}
      </div>

      <Canvas camera={{ position: [0, 1.6, 4], fov: 65 }}>
        <color attach="background" args={['#111827']} />
        <XR store={xrStore}>
          <Scene headGravity={headGravity} onHeadGravityChange={setHeadGravity} />
        </XR>
      </Canvas>
    </div>
  )
}
