import { Line, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getHeadPose } from '../utils/xrHeadPose'

type TubeProps = {
  curve: THREE.Curve<THREE.Vector3>
  color: string
  radius?: number
  opacity?: number
}

function Tube({ curve, color, radius = 0.06, opacity = 0.42 }: TubeProps) {
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 128, radius, 20, false)
  }, [curve, radius])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.38}
        metalness={0.03}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ConnectorTube({
  from,
  to,
  color,
  radius = 0.035,
  opacity = 0.3,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  color: string
  radius?: number
  opacity?: number
}) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([from.clone(), to.clone()])
  }, [from, to])

  return <Tube curve={curve} color={color} radius={radius} opacity={opacity} />
}

function MarkerSphere({
  position,
  color,
  radius = 0.08,
  opacity = 1,
}: {
  position: THREE.Vector3
  color: string
  radius?: number
  opacity?: number
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 28, 28]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.34}
      />
    </mesh>
  )
}

function makeEllipseArc(
  center: THREE.Vector3,
  axisU: THREE.Vector3,
  axisV: THREE.Vector3,
  radiusU: number,
  radiusV: number,
  startDeg: number,
  endDeg: number,
  segments: number
) {
  const points: THREE.Vector3[] = []
  const start = THREE.MathUtils.degToRad(startDeg)
  const end = THREE.MathUtils.degToRad(endDeg)

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const angle = start + (end - start) * t

    points.push(
      center
        .clone()
        .add(axisU.clone().multiplyScalar(Math.cos(angle) * radiusU))
        .add(axisV.clone().multiplyScalar(Math.sin(angle) * radiusV))
    )
  }

  return points
}

function makeCurve(points: THREE.Vector3[]) {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
}

function translatePointsToEnd(points: THREE.Vector3[], target: THREE.Vector3) {
  const delta = target.clone().sub(points[points.length - 1])
  return points.map((point) => point.clone().add(delta))
}

export function RightInnerEarModel() {
  const groupRef = useRef<THREE.Group>(null)
  const cameraPosition = useMemo(() => new THREE.Vector3(), [])
  const cameraQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const cameraForward = useMemo(() => new THREE.Vector3(), [])
  const posteriorViewRotation = useMemo(
    () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
    []
  )
  const contentRotation = useMemo(() => [0, Math.PI, 0] as [number, number, number], [])

  const model = useMemo(() => {
    // Coordinate system: X+ patient right, Y+ up, Z+ posterior, Z- anterior.
    const utricle = new THREE.Vector3(0, 0, 0)
    const commonCrus = new THREE.Vector3(0.0, 0.56, 0.0)
    const lateralUtricleEndTarget = new THREE.Vector3(0.64, 0.02, 0.0)
    const posteriorUtricleEndTarget = new THREE.Vector3(-0.08, 0.28, 0.44)
    const anteriorUtricleEndTarget = new THREE.Vector3(0.08, 0.28, -0.44)
    const posteriorAmpullaPort = new THREE.Vector3(-0.22, -0.02, 0.34)
    const anteriorAmpullaPort = new THREE.Vector3(0.22, -0.02, -0.34)

    const lateralTilt = THREE.MathUtils.degToRad(28)
    const lateralAxisU = new THREE.Vector3(1, 0, 0).normalize()
    const lateralAxisV = new THREE.Vector3(
      0,
      -Math.sin(lateralTilt),
      Math.cos(lateralTilt)
    ).normalize()
    const lateralPoints = translatePointsToEnd(
      makeEllipseArc(
        new THREE.Vector3(0.72, 0.04, 0.0),
        lateralAxisU,
        lateralAxisV,
        0.5,
        0.46,
        210,
        -55,
        72
      ),
      lateralUtricleEndTarget
    )

    const posteriorAxisU = new THREE.Vector3(0.44, 0, 0.9).normalize()
    const posteriorAxisV = new THREE.Vector3(0, 1, 0).normalize()
    const posteriorPoints = translatePointsToEnd(
      makeEllipseArc(
        new THREE.Vector3(-0.02, 0.2, 0.54),
        posteriorAxisU,
        posteriorAxisV,
        0.52,
        0.82,
        -125,
        215,
        88
      ),
      posteriorUtricleEndTarget
    )

    const anteriorAxisU = new THREE.Vector3(0.44, 0, -0.9).normalize()
    const anteriorAxisV = new THREE.Vector3(0, 1, 0).normalize()
    const anteriorPoints = translatePointsToEnd(
      makeEllipseArc(
        new THREE.Vector3(0.02, 0.2, -0.54),
        anteriorAxisU,
        anteriorAxisV,
        0.52,
        0.82,
        -125,
        215,
        88
      ),
      anteriorUtricleEndTarget
    )

    const lateralCurve = makeCurve(lateralPoints)
    const posteriorCurve = makeCurve(posteriorPoints)
    const anteriorCurve = makeCurve(anteriorPoints)
    const posteriorOtolithT = 0.58
    const otolith = posteriorCurve.getPoint(posteriorOtolithT)

    return {
      utricle,
      commonCrus,
      lateralCurve,
      posteriorCurve,
      anteriorCurve,
      lateralAmpulla: lateralCurve.getPoint(0),
      lateralUtricleEnd: lateralCurve.getPoint(1),
      lateralUtricleEndTarget,
      posteriorAmpulla: posteriorCurve.getPoint(0),
      posteriorUtricleEnd: posteriorCurve.getPoint(1),
      posteriorAmpullaPort,
      anteriorAmpulla: anteriorCurve.getPoint(0),
      anteriorUtricleEnd: anteriorCurve.getPoint(1),
      anteriorAmpullaPort,
      otolith,
    }
  }, [])

  useFrame(({ camera, gl }) => {
    const group = groupRef.current
    if (!group) return

    getHeadPose(camera, gl, cameraPosition, cameraQuaternion)
    cameraForward.set(0, 0, -1).applyQuaternion(cameraQuaternion)

    group.position.copy(cameraPosition).add(cameraForward.multiplyScalar(7))
    group.quaternion.copy(cameraQuaternion).multiply(posteriorViewRotation)
  })

  return (
    <group ref={groupRef} scale={1.2}>
      <group rotation={contentRotation}>
      <group position={[-0.78, -0.62, 0]}>
        <Line points={[[0, 0, 0], [0.34, 0, 0]]} color="#ef4444" lineWidth={3} />
        <Line points={[[0, 0, 0], [0, 0.34, 0]]} color="#22c55e" lineWidth={3} />
        <Line points={[[0, 0, 0], [0, 0, 0.34]]} color="#3b82f6" lineWidth={3} />
        <Text position={[0.42, 0, 0]} fontSize={0.07} color="#ef4444" anchorX="center">
          X
        </Text>
        <Text position={[0, 0.42, 0]} fontSize={0.07} color="#22c55e" anchorX="center">
          Y
        </Text>
        <Text position={[0, 0, 0.42]} fontSize={0.07} color="#3b82f6" anchorX="center">
          Z
        </Text>
      </group>

      <mesh position={model.utricle} scale={[1.9, 1.0, 1.28]}>
        <sphereGeometry args={[0.2, 40, 40]} />
        <meshStandardMaterial color="#facc15" transparent opacity={0.74} depthWrite={false} />
      </mesh>
      <Text position={[0, -0.36, 0]} fontSize={0.09} color="#facc15" anchorX="center">
        Utricle
      </Text>

      <MarkerSphere position={model.commonCrus} color="#fb923c" radius={0.085} />
      <Text
        position={model.commonCrus.clone().add(new THREE.Vector3(0.08, 0.16, 0))}
        fontSize={0.075}
        color="#fb923c"
        anchorX="left"
      >
        common crus
      </Text>

      <Tube curve={model.lateralCurve} color="#22c55e" radius={0.062} opacity={0.43} />
      <Tube curve={model.posteriorCurve} color="#3b82f6" radius={0.068} opacity={0.45} />
      <Tube curve={model.anteriorCurve} color="#ef4444" radius={0.062} opacity={0.4} />

      <ConnectorTube from={model.lateralUtricleEnd} to={model.utricle} color="#22c55e" />
      <ConnectorTube from={model.lateralAmpulla} to={model.utricle} color="#22c55e" opacity={0.2} />
      <ConnectorTube from={model.posteriorAmpulla} to={model.posteriorAmpullaPort} color="#3b82f6" />
      <ConnectorTube from={model.posteriorAmpullaPort} to={model.utricle} color="#3b82f6" opacity={0.24} />
      <ConnectorTube from={model.posteriorUtricleEnd} to={model.commonCrus} color="#3b82f6" />
      <ConnectorTube from={model.anteriorAmpulla} to={model.anteriorAmpullaPort} color="#ef4444" />
      <ConnectorTube from={model.anteriorAmpullaPort} to={model.utricle} color="#ef4444" opacity={0.24} />
      <ConnectorTube from={model.anteriorUtricleEnd} to={model.commonCrus} color="#ef4444" />
      <ConnectorTube from={model.commonCrus} to={model.utricle} color="#fb923c" radius={0.05} opacity={0.38} />

      <MarkerSphere position={model.lateralAmpulla} color="#86efac" radius={0.105} />
      <MarkerSphere position={model.posteriorAmpulla} color="#93c5fd" radius={0.11} />
      <MarkerSphere position={model.anteriorAmpulla} color="#fca5a5" radius={0.105} />

      <Text
        position={model.posteriorAmpulla.clone().add(new THREE.Vector3(0.08, -0.15, 0))}
        fontSize={0.065}
        color="#93c5fd"
        anchorX="left"
      >
        posterior ampulla
      </Text>

      <group position={model.otolith}>
        {[
          [0, 0, 0, 0.048, '#f8fafc'],
          [0.07, 0.025, 0.02, 0.035, '#e5e7eb'],
          [-0.055, -0.025, 0.035, 0.032, '#cbd5e1'],
          [0.015, -0.05, -0.035, 0.028, '#f1f5f9'],
          [-0.02, 0.05, -0.02, 0.026, '#d1d5db'],
        ].map(([x, y, z, radius, color], index) => (
          <mesh key={index} position={[x, y, z] as [number, number, number]}>
            <sphereGeometry args={[radius as number, 20, 20]} />
            <meshStandardMaterial color={color as string} roughness={0.28} metalness={0.08} />
          </mesh>
        ))}
      </group>
      <Text
        position={model.otolith.clone().add(new THREE.Vector3(0.12, 0.12, 0))}
        fontSize={0.075}
        color="white"
        anchorX="left"
      >
        otolith
      </Text>

      <Text position={[1.08, 0.03, 0.02]} fontSize={0.075} color="#22c55e" anchorX="left">
        lateral canal
      </Text>
      <Text position={[0.48, 0.52, 0.72]} fontSize={0.075} color="#3b82f6" anchorX="left">
        posterior canal
      </Text>
      <Text position={[0.48, 0.52, -0.72]} fontSize={0.075} color="#ef4444" anchorX="left">
        anterior canal
      </Text>
      </group>
    </group>
  )
}
