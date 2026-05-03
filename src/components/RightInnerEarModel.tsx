import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

type TubeProps = {
  curve: THREE.Curve<THREE.Vector3>
  color: string
  radius?: number
  opacity?: number
}

function Tube({ curve, color, radius = 0.035, opacity = 0.55 }: TubeProps) {
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 96, radius, 16, false)
  }, [curve, radius])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.45}
        metalness={0.05}
      />
    </mesh>
  )
}

function ConnectorTube({
  from,
  to,
  color,
  radius = 0.025,
  opacity = 0.35,
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
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.4}
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

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const a = start + (end - start) * t

    const p = center
      .clone()
      .add(axisU.clone().multiplyScalar(Math.cos(a) * radiusU))
      .add(axisV.clone().multiplyScalar(Math.sin(a) * radiusV))

    points.push(p)
  }

  return points
}

function makeCurve(points: THREE.Vector3[]) {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
}

export function RightInnerEarModel() {
  const model = useMemo(() => {
    // 座標系:
    // X+ = 患者右
    // Y+ = 上方
    // Z+ = 後方
    // Z- = 前方
    //
    // 右内耳を原点付近に置く説明用モデル。
    // 厳密なCTメッシュではなく、半規管平面・接続関係を重視した模式モデル。

    const utricle = new THREE.Vector3(0, 0, 0)
    const commonCrus = new THREE.Vector3(0.05, 0.75, 0.05)

    // 外側半規管:
    // おおむね水平面だが、前方側が上がるように約25度傾ける。
    const lateralTilt = THREE.MathUtils.degToRad(25)
    const lateralAxisU = new THREE.Vector3(1, 0, 0).normalize()
    const lateralAxisV = new THREE.Vector3(
      0,
      -Math.sin(lateralTilt),
      Math.cos(lateralTilt)
    ).normalize()

    const lateralPoints = makeEllipseArc(
      new THREE.Vector3(0, 0.02, 0),
      lateralAxisU,
      lateralAxisV,
      0.72,
      0.62,
      210,
      -60,
      56
    )
    const lateralCurve = makeCurve(lateralPoints)

    // 後半規管:
    // 右後半規管は、上方-後外側方向の垂直系平面として近似。
    const posteriorAxisU = new THREE.Vector3(0.45, 0, 0.9).normalize()
    const posteriorAxisV = new THREE.Vector3(0, 1, 0).normalize()

    const posteriorPoints = makeEllipseArc(
      new THREE.Vector3(0.03, 0.18, 0.08),
      posteriorAxisU,
      posteriorAxisV,
      0.62,
      0.78,
      -120,
      215,
      72
    )
    const posteriorCurve = makeCurve(posteriorPoints)

    // 前半規管:
    // 後半規管とほぼ直交する垂直系平面として近似。
    const anteriorAxisU = new THREE.Vector3(0.45, 0, -0.9).normalize()
    const anteriorAxisV = new THREE.Vector3(0, 1, 0).normalize()

    const anteriorPoints = makeEllipseArc(
      new THREE.Vector3(0.03, 0.18, -0.08),
      anteriorAxisU,
      anteriorAxisV,
      0.62,
      0.78,
      -120,
      215,
      72
    )
    const anteriorCurve = makeCurve(anteriorPoints)

    const posteriorAmpulla = posteriorCurve.getPoint(0)
    const posteriorCommon = posteriorCurve.getPoint(1)

    const anteriorAmpulla = anteriorCurve.getPoint(0)
    const anteriorCommon = anteriorCurve.getPoint(1)

    const lateralAmpulla = lateralCurve.getPoint(0)
    const lateralUtricleEnd = lateralCurve.getPoint(1)

    // 後半規管内の耳石。後で t を動かせば管内移動になる。
    const posteriorOtolithT = 0.58
    const otolith = posteriorCurve.getPoint(posteriorOtolithT)

    return {
      utricle,
      commonCrus,
      lateralCurve,
      posteriorCurve,
      anteriorCurve,
      posteriorAmpulla,
      posteriorCommon,
      anteriorAmpulla,
      anteriorCommon,
      lateralAmpulla,
      lateralUtricleEnd,
      otolith,
    }
  }, [])

  return (
    <group position={[0, 1.45, -3]} scale={1.2}>
      {/* 卵形嚢 */}
      <mesh position={model.utricle} scale={[1.35, 0.75, 0.9]}>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial color="#facc15" transparent opacity={0.85} />
      </mesh>

      <Text
        position={[0, -0.28, 0]}
        fontSize={0.09}
        color="#facc15"
        anchorX="center"
        anchorY="middle"
      >
        Utricle
      </Text>

      {/* common crus */}
      <MarkerSphere position={model.commonCrus} color="#fb923c" radius={0.075} />
      <Text
        position={[0.1, 0.92, 0.05]}
        fontSize={0.075}
        color="#fb923c"
        anchorX="left"
        anchorY="middle"
      >
        common crus
      </Text>

      {/* 半規管本体 */}
      <Tube curve={model.lateralCurve} color="#22c55e" radius={0.032} opacity={0.55} />
      <Tube curve={model.posteriorCurve} color="#3b82f6" radius={0.036} opacity={0.62} />
      <Tube curve={model.anteriorCurve} color="#ef4444" radius={0.032} opacity={0.48} />

      {/* 卵形嚢との接続を模式的に表示 */}
      <ConnectorTube from={model.lateralAmpulla} to={model.utricle} color="#22c55e" />
      <ConnectorTube from={model.lateralUtricleEnd} to={model.utricle} color="#22c55e" />

      <ConnectorTube from={model.posteriorAmpulla} to={model.utricle} color="#3b82f6" />
      <ConnectorTube from={model.posteriorCommon} to={model.commonCrus} color="#3b82f6" />

      <ConnectorTube from={model.anteriorAmpulla} to={model.utricle} color="#ef4444" />
      <ConnectorTube from={model.anteriorCommon} to={model.commonCrus} color="#ef4444" />

      {/* 膨大部 */}
      <MarkerSphere position={model.lateralAmpulla} color="#86efac" radius={0.095} />
      <MarkerSphere position={model.posteriorAmpulla} color="#93c5fd" radius={0.105} />
      <MarkerSphere position={model.anteriorAmpulla} color="#fca5a5" radius={0.095} />

      <Text
        position={model.posteriorAmpulla.clone().add(new THREE.Vector3(0.08, -0.14, 0))}
        fontSize={0.065}
        color="#93c5fd"
        anchorX="left"
        anchorY="middle"
      >
        posterior ampulla
      </Text>

      {/* 後半規管内の耳石 */}
      <group position={model.otolith}>
        <mesh>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.15} />
        </mesh>
        <mesh position={[0.08, 0.02, 0.02]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.3} />
        </mesh>
        <mesh position={[-0.06, -0.02, 0.04]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
        </mesh>
      </group>

      <Text
        position={model.otolith.clone().add(new THREE.Vector3(0.12, 0.12, 0))}
        fontSize={0.075}
        color="white"
        anchorX="left"
        anchorY="middle"
      >
        otolith
      </Text>

      {/* ラベル */}
      <Text
        position={[0.85, 0.05, 0.15]}
        fontSize={0.075}
        color="#22c55e"
        anchorX="left"
        anchorY="middle"
      >
        lateral canal
      </Text>

      <Text
        position={[0.55, 0.55, 0.75]}
        fontSize={0.075}
        color="#3b82f6"
        anchorX="left"
        anchorY="middle"
      >
        posterior canal
      </Text>

      <Text
        position={[0.55, 0.55, -0.75]}
        fontSize={0.075}
        color="#ef4444"
        anchorX="left"
        anchorY="middle"
      >
        anterior canal
      </Text>
    </group>
  )
}