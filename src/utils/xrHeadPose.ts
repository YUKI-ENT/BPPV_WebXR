import * as THREE from 'three'

export function getHeadPose(
  camera: THREE.Camera,
  gl: THREE.WebGLRenderer,
  targetPosition: THREE.Vector3,
  targetQuaternion: THREE.Quaternion
) {
  if (gl.xr.isPresenting) {
    const xrCamera = gl.xr.getCamera()

    if (xrCamera instanceof THREE.ArrayCamera && xrCamera.cameras.length > 0) {
      const firstEye = xrCamera.cameras[0]
      firstEye.getWorldQuaternion(targetQuaternion)

      targetPosition.set(0, 0, 0)
      for (const eyeCamera of xrCamera.cameras) {
        targetPosition.add(eyeCamera.getWorldPosition(new THREE.Vector3()))
      }
      targetPosition.multiplyScalar(1 / xrCamera.cameras.length)

      return
    }

    xrCamera.getWorldPosition(targetPosition)
    xrCamera.getWorldQuaternion(targetQuaternion)
    return
  }

  camera.getWorldPosition(targetPosition)
  camera.getWorldQuaternion(targetQuaternion)
}
