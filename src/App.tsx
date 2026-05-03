import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, Line, OrbitControls, Text } from '@react-three/drei'
import { XR, createXRStore } from '@react-three/xr'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { RightInnerEarModel } from './components/RightInnerEarModel'
import { getHeadPose } from './utils/xrHeadPose'
import './App.css'

const xrStore = createXRStore()

type HeadAngles = {
  x: number
  y: number
  z: number
}

function HeadPoseDebug({
  onChange,
}: {
  onChange: (angles: HeadAngles) => void
}) {
  const lastUpdate = useRef(0)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const headPosition = useRef(new THREE.Vector3())
  const quaternion = useRef(new THREE.Quaternion())

  useFrame(({ camera, clock, gl }) => {
    const elapsed = clock.getElapsedTime()
    if (elapsed - lastUpdate.current < 0.12) return

    getHeadPose(camera, gl, headPosition.current, quaternion.current)
    euler.current.setFromQuaternion(quaternion.current, 'YXZ')
    onChange({
      x: euler.current.x,
      y: euler.current.y,
      z: euler.current.z,
    })
    lastUpdate.current = elapsed
  })

  return null
}

function ViewLockedDebugText({ angles }: { angles: HeadAngles }) {
  const groupRef = useRef<THREE.Group>(null)
  const cameraPosition = useRef(new THREE.Vector3())
  const cameraQuaternion = useRef(new THREE.Quaternion())
  const cameraForward = useRef(new THREE.Vector3())
  const cameraUp = useRef(new THREE.Vector3())

  useFrame(({ camera, gl }) => {
    const group = groupRef.current
    if (!group) return

    getHeadPose(camera, gl, cameraPosition.current, cameraQuaternion.current)
    cameraForward.current.set(0, 0, -1).applyQuaternion(cameraQuaternion.current)
    cameraUp.current.set(0, 1, 0).applyQuaternion(cameraQuaternion.current)

    group.position
      .copy(cameraPosition.current)
      .add(cameraForward.current.multiplyScalar(2.2))
      .add(cameraUp.current.multiplyScalar(-0.72))
    group.quaternion.copy(cameraQuaternion.current)
  })

  return (
    <group ref={groupRef}>
      <Text
        fontSize={0.075}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineColor="#111827"
        outlineWidth={0.006}
      >
        {`X: ${THREE.MathUtils.radToDeg(angles.x).toFixed(2)} Y: ${(
          -THREE.MathUtils.radToDeg(angles.y)
        ).toFixed(2)} Z: ${(-THREE.MathUtils.radToDeg(angles.z)).toFixed(2)}`}
      </Text>
    </group>
  )
}

function Scene({
  headAngles,
  onHeadAnglesChange,
}: {
  headAngles: HeadAngles
  onHeadAnglesChange: (angles: HeadAngles) => void
}) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <HeadPoseDebug onChange={onHeadAnglesChange} />
      <ViewLockedDebugText angles={headAngles} />

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

      <RightInnerEarModel />

      <OrbitControls makeDefault />
    </>
  )
}

export default function App() {
  const [vrError, setVrError] = useState<string>('')
  const [headAngles, setHeadAngles] = useState<HeadAngles>({ x: 0, y: 0, z: 0 })

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
          <div>Head angle debug</div>
          <div>X: {THREE.MathUtils.radToDeg(headAngles.x).toFixed(1)} deg</div>
          <div>Y: {(-THREE.MathUtils.radToDeg(headAngles.y)).toFixed(1)} deg</div>
          <div>Z: {(-THREE.MathUtils.radToDeg(headAngles.z)).toFixed(1)} deg</div>
        </div>
        {vrError && <p className="error">{vrError}</p>}
      </div>

      <Canvas camera={{ position: [0, 1.6, 4], fov: 65 }}>
        <color attach="background" args={['#111827']} />
        <XR store={xrStore}>
          <Scene headAngles={headAngles} onHeadAnglesChange={setHeadAngles} />
        </XR>
      </Canvas>
    </div>
  )
}
